# Pulse — News Analytics Dashboard

Дашборд для визуализации аналитических данных о публикуемых новостях.  
Написан на **React Native + Expo**, тестируется через [Expo Go](https://expo.dev/go) / [Expo Snack](https://snack.expo.dev/).

---

## Функциональность

### Главная страница
| Карточка | Описание |
|---|---|
| **Публикации** | Общее кол-во публикаций |
| **Охват** | Суммарный охват |
| **Динамика** | Curved Line Chart по дням с переключателем метрик (публикации / охват) |
| **Тематики** | Donut Chart с переключателем метрик; клик по сегменту фильтрует данные |
| **Облако слов** | Из заголовков новостей |
| **Топ сущностей** | Персоны / Локации / Компании; клик — переход на страницу сущности |

### Страница сущности
Открывается при клике на сущность в топе. Содержит:
- Статкарточки (публикации, охват) по упоминаниям выбранной сущности
- Curved Line Chart с переключателем метрик
- Облако слов из связанных новостей
- Топ-10 новостей с упоминанием сущности

### Фильтрация
- Кнопки **2 дня / 7 дней / 30 дней** для фильтрации по дате публикации
- Клик на сегмент donut-диаграммы фильтрует по тематике
- Кнопка **Сбросить** для очистки всех фильтров

### Дополнительно
- **Переключатель темы** (☀️ / 🌙) — светлая и тёмная тема
- **Кнопка «Выводы»** — заглушка AI-анализа с анимацией загрузки, модальным окном и кнопкой копирования

---

## Запуск в Expo Snack

1. Откройте [https://snack.expo.dev/](https://snack.expo.dev/)
2. Нажмите **Import from GitHub**
3. Вставьте URL: `https://github.com/GlenKoks/Pulse`
4. Нажмите **Import**

Или откройте напрямую:
**[https://snack.expo.dev/?github=GlenKoks/Pulse](https://snack.expo.dev/?github=GlenKoks/Pulse)**

---

## Локальный запуск

```bash
npm install
npx expo start
```

---

## Технологии

| Библиотека | Назначение |
|---|---|
| `react-native-gifted-charts` | LineChart (curved, area) + PieChart (donut) |
| `@react-navigation/native-stack` | Навигация между экранами |
| `expo-clipboard` | Копирование текста выводов |
| `react-native-svg` | Рендеринг графиков |
| `expo-linear-gradient` | Градиенты в графиках |

---

## Структура проекта

```
src/
├── components/
│   ├── DateFilter.tsx       # Фильтр по датам (2/7/30 дней)
│   ├── DonutChart.tsx       # Donut-диаграмма тематик (Gifted Charts)
│   ├── EntityRanking.tsx    # Топ сущностей с переключателем
│   ├── InsightsModal.tsx    # Модальное окно AI-выводов
│   ├── MetricLineChart.tsx  # Линейный график (Gifted Charts)
│   ├── NewsTopList.tsx      # Топ новостей
│   └── WordCloud.tsx        # Облако слов
├── data/
│   └── mockData.ts          # 500 синтетических новостей
├── hooks/
│   ├── NewsDataContext.tsx  # Контекст данных и фильтрации
│   └── ThemeContext.tsx     # Контекст темы (dark/light)
├── screens/
│   ├── DashboardScreen.tsx  # Главная страница
│   └── EntityScreen.tsx     # Страница сущности
├── types/
│   └── index.ts             # TypeScript типы
└── utils/
    └── dataProcessing.ts    # Утилиты обработки данных
```
