# Архитектура базы данных Supabase для проекта Pulse

Проект Pulse — это аналитический дашборд новостей, который требует агрегации больших объемов данных (публикации, охваты, тематики, сущности) в реальном времени с поддержкой сложной фильтрации (по дате, тематикам, сущностям).

Текущая реализация на фронтенде загружает весь массив данных в память и фильтрует/агрегирует его через JavaScript (в `NewsDataContext.tsx` и `dataProcessing.ts`). При переходе на реальный бэкенд с сотнями тысяч или миллионами записей такой подход перестанет работать.

Ниже представлена оптимальная архитектура базы данных для Supabase (PostgreSQL), спроектированная для максимальной производительности агрегационных запросов.

## 1. Паттерны доступа к данным (Access Patterns)

Анализ компонентов проекта выявил следующие основные паттерны доступа:

1. **Глобальные фильтры:** по диапазону дат (`dateRange`), по тематике (`selectedTopic`), по конкретным сущностям (персоны, локации, компании).
2. **Агрегация временных рядов:** динамика публикаций и охватов по дням (`getDailyStats`).
3. **Агрегация по категориям:** топ тематик (`getTopicStats`), топ негативных тематик (`getBadVerdictStats`).
4. **Агрегация по сущностям:** топ персон, локаций, компаний (`getPersonStats`, `getLocationStats`, `getCompanyStats`), топ источников (`getPublisherStats`).
5. **Страница сущности:** все те же агрегации, но жестко отфильтрованные по конкретной сущности (например, `filterByEntity(data, 'persons', 'Илон Маск')`).
6. **Полнотекстовый анализ:** облако слов из заголовков (`getWordCloud`).
7. **Списки:** топ новостей по охвату (`NewsTopList`).

## 2. Схема таблиц (Схема `public`)

Для оптимизации поиска и фильтрации, связи многие-ко-многим (новости ↔ тематики, новости ↔ сущности) вынесены в отдельные таблицы.

### 2.1. Таблица `news` (Основная таблица публикаций)
Содержит базовую информацию о каждой публикации.

```sql
CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id BIGINT UNIQUE, -- ndx из mockData
    pub_url TEXT NOT NULL,
    publication_title_name TEXT NOT NULL,
    publisher_name TEXT NOT NULL,
    dt TIMESTAMP WITH TIME ZONE NOT NULL, -- дата и время публикации
    shows BIGINT DEFAULT 0, -- охват
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2. Таблица `topics` (Справочник тематик)
Содержит как обычные тематики, так и негативные вердикты.

```sql
CREATE TABLE public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_negative BOOLEAN DEFAULT FALSE -- true для 'Желтуха', 'Конфликт' и т.д.
);
```

### 2.3. Таблица `news_topics` (Связь новостей и тематик)
```sql
CREATE TABLE public.news_topics (
    news_id UUID REFERENCES public.news(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    PRIMARY KEY (news_id, topic_id)
);
```

### 2.4. Таблица `entities` (Справочник сущностей)
Объединяет персон, локации и компании.

```sql
CREATE TYPE entity_type AS ENUM ('person', 'location', 'company');

CREATE TABLE public.entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type entity_type NOT NULL,
    UNIQUE (name, type)
);
```

### 2.5. Таблица `news_entities` (Связь новостей и сущностей)
```sql
CREATE TABLE public.news_entities (
    news_id UUID REFERENCES public.news(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
    PRIMARY KEY (news_id, entity_id)
);
```

## 3. Индексы для максимальной производительности

Так как дашборд постоянно фильтрует данные по дате и агрегирует по охватам, правильные индексы критически важны.

```sql
-- Индекс для быстрой фильтрации по дате и сортировки по охвату
CREATE INDEX idx_news_dt_shows ON public.news(dt DESC, shows DESC);

-- Индексы для быстрых JOIN-ов
CREATE INDEX idx_news_topics_topic_id ON public.news_topics(topic_id);
CREATE INDEX idx_news_entities_entity_id ON public.news_entities(entity_id);

-- Индекс для полнотекстового поиска (если потребуется искать по заголовкам)
CREATE INDEX idx_news_title_gin ON public.news USING GIN (to_tsvector('russian', publication_title_name));
```

## 4. RPC Функции для агрегации (Edge Functions)

Вместо того чтобы тянуть сырые данные на клиент, агрегацию нужно выполнять на стороне базы данных через RPC (Remote Procedure Call). Supabase позволяет вызывать их через `supabase.rpc('function_name')`.

### 4.1. Динамика публикаций (Daily Stats)
```sql
CREATE OR REPLACE FUNCTION get_daily_stats(start_date TIMESTAMP WITH TIME ZONE, entity_filter_id UUID DEFAULT NULL)
RETURNS TABLE (date DATE, count BIGINT, total_shows BIGINT) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(n.dt) as date,
        COUNT(n.id) as count,
        SUM(n.shows) as total_shows
    FROM public.news n
    LEFT JOIN public.news_entities ne ON n.id = ne.news_id
    WHERE n.dt >= start_date
      AND (entity_filter_id IS NULL OR ne.entity_id = entity_filter_id)
    GROUP BY DATE(n.dt)
    ORDER BY date ASC;
END;
$$;
```

### 4.2. Топ сущностей (Entity Stats)
```sql
CREATE OR REPLACE FUNCTION get_top_entities(start_date TIMESTAMP WITH TIME ZONE, e_type entity_type, limit_val INTEGER DEFAULT 20)
RETURNS TABLE (name TEXT, count BIGINT, total_shows BIGINT) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.name,
        COUNT(n.id) as count,
        SUM(n.shows) as total_shows
    FROM public.entities e
    JOIN public.news_entities ne ON e.id = ne.entity_id
    JOIN public.news n ON ne.news_id = n.id
    WHERE e.type = e_type
      AND n.dt >= start_date
    GROUP BY e.id, e.name
    ORDER BY total_shows DESC
    LIMIT limit_val;
END;
$$;
```

### 4.3. Топ негативных тематик (для RadarChart)
```sql
CREATE OR REPLACE FUNCTION get_negative_topics_stats(start_date TIMESTAMP WITH TIME ZONE, entity_filter_id UUID DEFAULT NULL)
RETURNS TABLE (topic_name TEXT, count BIGINT) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name as topic_name,
        COUNT(n.id) as count
    FROM public.topics t
    JOIN public.news_topics nt ON t.id = nt.topic_id
    JOIN public.news n ON nt.news_id = n.id
    LEFT JOIN public.news_entities ne ON n.id = ne.news_id
    WHERE t.is_negative = TRUE
      AND n.dt >= start_date
      AND (entity_filter_id IS NULL OR ne.entity_id = entity_filter_id)
    GROUP BY t.id, t.name;
END;
$$;
```

## 5. Облако слов (Особый случай)

Генерация облака слов на лету из десятков тысяч заголовков (удаление стоп-слов, токенизация, подсчет) — очень тяжелая операция для БД.

**Рекомендуемый подход:**
Использовать материализованное представление (Materialized View), которое обновляется по расписанию (например, раз в час), либо вычислять облако слов на стороне сервера (Edge Function) с кэшированием (Redis / Supabase Cache).

Пример базового SQL для извлечения слов (без учета сложной морфологии):
```sql
CREATE MATERIALIZED VIEW word_frequencies AS
SELECT word, count(*) as frequency
FROM (
  SELECT unnest(regexp_split_to_array(lower(publication_title_name), '\W+')) as word
  FROM public.news
  WHERE dt >= NOW() - INTERVAL '30 days'
) as words
WHERE length(word) > 3 AND word NOT IN ('это', 'как', 'что', /* список стоп-слов */)
GROUP BY word
ORDER BY frequency DESC
LIMIT 100;
```

## 6. Рекомендации по интеграции с фронтендом

1. **Замена `NewsDataContext`:** Вместо загрузки `allData`, контекст должен хранить только текущие фильтры (`dateRange`, `selectedEntity`).
2. **Использование `useQuery` (React Query):** При изменении фильтров, фронтенд должен делать параллельные вызовы `supabase.rpc()` для каждого блока дашборда (один запрос для графиков, один для топа сущностей и т.д.).
3. **Пагинация:** Список "Топ новостей" должен использовать `.range(0, 9)` в Supabase JS клиенте, а не рендерить весь массив.
