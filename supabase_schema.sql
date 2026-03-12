-- ============================================================
-- Pulse — Supabase Database Schema
-- Запустите этот скрипт в Supabase SQL Editor
-- ============================================================

-- 1. ТИПЫ
-- -------
CREATE TYPE entity_type AS ENUM ('person', 'location', 'company');


-- 2. ОСНОВНЫЕ ТАБЛИЦЫ
-- --------------------

-- Публикации
CREATE TABLE public.news (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id    BIGINT UNIQUE,                         -- ndx из источника
    pub_url        TEXT NOT NULL,
    title          TEXT NOT NULL,                         -- publication_title_name
    publisher_name TEXT NOT NULL,
    dt             TIMESTAMP WITH TIME ZONE NOT NULL,     -- дата публикации
    shows          BIGINT DEFAULT 0,                      -- охват
    likes          INTEGER DEFAULT 0,
    comments       INTEGER DEFAULT 0,
    country        TEXT,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Справочник тематик (обычные + негативные)
CREATE TABLE public.topics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT UNIQUE NOT NULL,
    is_negative BOOLEAN DEFAULT FALSE  -- TRUE для: Желтуха, Конфликт, Насилие, Жестокость
);

-- Связь новостей и тематик (многие-ко-многим)
CREATE TABLE public.news_topics (
    news_id  UUID REFERENCES public.news(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    PRIMARY KEY (news_id, topic_id)
);

-- Справочник сущностей (персоны, локации, компании)
CREATE TABLE public.entities (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type entity_type NOT NULL,
    UNIQUE (name, type)
);

-- Связь новостей и сущностей (многие-ко-многим)
CREATE TABLE public.news_entities (
    news_id   UUID REFERENCES public.news(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
    PRIMARY KEY (news_id, entity_id)
);


-- 3. ИНДЕКСЫ
-- -----------

-- Основной индекс для фильтрации по дате и сортировки по охвату
CREATE INDEX idx_news_dt       ON public.news(dt DESC);
CREATE INDEX idx_news_dt_shows ON public.news(dt DESC, shows DESC);

-- Индексы для JOIN-ов в news_topics
CREATE INDEX idx_news_topics_news_id  ON public.news_topics(news_id);
CREATE INDEX idx_news_topics_topic_id ON public.news_topics(topic_id);

-- Индексы для JOIN-ов в news_entities
CREATE INDEX idx_news_entities_news_id   ON public.news_entities(news_id);
CREATE INDEX idx_news_entities_entity_id ON public.news_entities(entity_id);

-- Индекс для фильтрации сущностей по типу
CREATE INDEX idx_entities_type ON public.entities(type);

-- Полнотекстовый поиск по заголовкам
CREATE INDEX idx_news_title_fts ON public.news USING GIN (to_tsvector('russian', title));


-- 4. RPC ФУНКЦИИ
-- ---------------

-- 4.1. Общая статистика (для карточек на главном экране)
CREATE OR REPLACE FUNCTION get_summary_stats(
    start_date      TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    topic_filter    TEXT DEFAULT NULL,
    entity_filter   UUID DEFAULT NULL
)
RETURNS TABLE (
    total_count  BIGINT,
    total_shows  BIGINT,
    total_likes  BIGINT,
    total_comments BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT n.id),
        SUM(n.shows),
        SUM(n.likes),
        SUM(n.comments)
    FROM public.news n
    LEFT JOIN public.news_topics nt ON n.id = nt.news_id
    LEFT JOIN public.topics t       ON nt.topic_id = t.id AND topic_filter IS NOT NULL
    LEFT JOIN public.news_entities ne ON n.id = ne.news_id AND entity_filter IS NOT NULL
    WHERE n.dt >= start_date
      AND (topic_filter IS NULL OR t.name = topic_filter)
      AND (entity_filter IS NULL OR ne.entity_id = entity_filter);
END;
$$;


-- 4.2. Динамика по дням (LineChart)
CREATE OR REPLACE FUNCTION get_daily_stats(
    start_date    TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    topic_filter  TEXT DEFAULT NULL,
    entity_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    date        DATE,
    count       BIGINT,
    total_shows BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(n.dt),
        COUNT(DISTINCT n.id),
        SUM(n.shows)
    FROM public.news n
    LEFT JOIN public.news_topics nt ON n.id = nt.news_id
    LEFT JOIN public.topics t       ON nt.topic_id = t.id AND topic_filter IS NOT NULL
    LEFT JOIN public.news_entities ne ON n.id = ne.news_id AND entity_filter IS NOT NULL
    WHERE n.dt >= start_date
      AND (topic_filter IS NULL OR t.name = topic_filter)
      AND (entity_filter IS NULL OR ne.entity_id = entity_filter)
    GROUP BY DATE(n.dt)
    ORDER BY DATE(n.dt) ASC;
END;
$$;


-- 4.3. Распределение по тематикам (DonutChart)
CREATE OR REPLACE FUNCTION get_topic_stats(
    start_date    TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    entity_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    topic       TEXT,
    count       BIGINT,
    total_shows BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.name,
        COUNT(DISTINCT n.id),
        SUM(n.shows)
    FROM public.topics t
    JOIN public.news_topics nt ON t.id = nt.topic_id
    JOIN public.news n         ON nt.news_id = n.id
    LEFT JOIN public.news_entities ne ON n.id = ne.news_id AND entity_filter IS NOT NULL
    WHERE t.is_negative = FALSE
      AND n.dt >= start_date
      AND (entity_filter IS NULL OR ne.entity_id = entity_filter)
    GROUP BY t.id, t.name
    ORDER BY count DESC
    LIMIT 12;
END;
$$;


-- 4.4. Топ сущностей (EntityRanking)
CREATE OR REPLACE FUNCTION get_top_entities(
    start_date   TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    e_type       entity_type DEFAULT 'person',
    topic_filter TEXT DEFAULT NULL,
    limit_val    INTEGER DEFAULT 20
)
RETURNS TABLE (
    entity_id   UUID,
    name        TEXT,
    count       BIGINT,
    total_shows BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        COUNT(DISTINCT n.id),
        SUM(n.shows)
    FROM public.entities e
    JOIN public.news_entities ne ON e.id = ne.entity_id
    JOIN public.news n           ON ne.news_id = n.id
    LEFT JOIN public.news_topics nt ON n.id = nt.news_id AND topic_filter IS NOT NULL
    LEFT JOIN public.topics t       ON nt.topic_id = t.id AND topic_filter IS NOT NULL
    WHERE e.type = e_type
      AND n.dt >= start_date
      AND (topic_filter IS NULL OR t.name = topic_filter)
    GROUP BY e.id, e.name
    ORDER BY total_shows DESC
    LIMIT limit_val;
END;
$$;


-- 4.5. Негативные тематики (RadarChart) — с поддержкой фильтра по сущности
CREATE OR REPLACE FUNCTION get_negative_topics_stats(
    start_date    TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    entity_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    topic_name  TEXT,
    count       BIGINT,
    total_pubs  BIGINT  -- общее число публикаций сущности (для вычисления %)
)
LANGUAGE plpgsql AS $$
DECLARE
    total BIGINT;
BEGIN
    -- Считаем общее число публикаций для данного фильтра
    SELECT COUNT(DISTINCT n.id) INTO total
    FROM public.news n
    LEFT JOIN public.news_entities ne ON n.id = ne.news_id
    WHERE n.dt >= start_date
      AND (entity_filter IS NULL OR ne.entity_id = entity_filter);

    RETURN QUERY
    SELECT
        t.name,
        COUNT(DISTINCT n.id),
        total
    FROM public.topics t
    JOIN public.news_topics nt ON t.id = nt.topic_id
    JOIN public.news n         ON nt.news_id = n.id
    LEFT JOIN public.news_entities ne ON n.id = ne.news_id AND entity_filter IS NOT NULL
    WHERE t.is_negative = TRUE
      AND n.dt >= start_date
      AND (entity_filter IS NULL OR ne.entity_id = entity_filter)
    GROUP BY t.id, t.name;
END;
$$;


-- 4.6. Топ новостей по охвату (NewsTopList)
CREATE OR REPLACE FUNCTION get_top_news(
    start_date    TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    topic_filter  TEXT DEFAULT NULL,
    entity_filter UUID DEFAULT NULL,
    limit_val     INTEGER DEFAULT 10,
    offset_val    INTEGER DEFAULT 0
)
RETURNS TABLE (
    id             UUID,
    pub_url        TEXT,
    title          TEXT,
    publisher_name TEXT,
    dt             TIMESTAMP WITH TIME ZONE,
    shows          BIGINT,
    likes          INTEGER,
    comments       INTEGER
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (n.id)
        n.id, n.pub_url, n.title, n.publisher_name, n.dt, n.shows, n.likes, n.comments
    FROM public.news n
    LEFT JOIN public.news_topics nt ON n.id = nt.news_id
    LEFT JOIN public.topics t       ON nt.topic_id = t.id AND topic_filter IS NOT NULL
    LEFT JOIN public.news_entities ne ON n.id = ne.news_id AND entity_filter IS NOT NULL
    WHERE n.dt >= start_date
      AND (topic_filter IS NULL OR t.name = topic_filter)
      AND (entity_filter IS NULL OR ne.entity_id = entity_filter)
    ORDER BY n.id, n.shows DESC
    LIMIT limit_val OFFSET offset_val;
END;
$$;


-- 5. НАЧАЛЬНЫЕ ДАННЫЕ (справочник тематик)
-- -----------------------------------------

INSERT INTO public.topics (name, is_negative) VALUES
    ('Политика',                  FALSE),
    ('Экономика',                 FALSE),
    ('Технологии',                FALSE),
    ('Спорт',                     FALSE),
    ('Культура',                  FALSE),
    ('Общество',                  FALSE),
    ('Здоровье',                  FALSE),
    ('Наука',                     FALSE),
    ('Бизнес',                    FALSE),
    ('Международные отношения',   FALSE),
    ('Желтуха',                   TRUE),
    ('Конфликт',                  TRUE),
    ('Насилие',                   TRUE),
    ('Жестокость',                TRUE)
ON CONFLICT (name) DO NOTHING;


-- 6. ROW LEVEL SECURITY (RLS)
-- ----------------------------
-- Включите RLS если данные должны быть приватными.
-- Для публичного дашборда можно оставить открытым на чтение.

ALTER TABLE public.news         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_topics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_entities ENABLE ROW LEVEL SECURITY;

-- Политика: разрешить чтение всем (anon + authenticated)
CREATE POLICY "Allow read access" ON public.news         FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.topics       FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.news_topics  FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.entities     FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.news_entities FOR SELECT USING (true);
