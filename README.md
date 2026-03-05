# Pulse — News Analytics Dashboard

A React Native + Expo application for visualizing news publication data from a content platform. Supports **iOS** and **Web**.

## Features

- **Summary Metrics** — total publications, reach (shows), likes, and comments
- **Daily Chart** — publications count and total reach by day with toggle
- **Topics Pie Chart** — topic distribution with metric toggle (count / reach)
- **Top Persons** — ranked list of most mentioned persons with bar visualization
- **Top Publishers** — horizontal bar chart of publishers by publications or reach
- **Moderation Violations** — breakdown of bad verdicts (clickbait, yellow press, etc.)
- **Word Cloud** — generated from publication titles, updates with filters
- **News List** — searchable and sortable list of all publications with links
- **Filters** — filter by topics, publishers, and persons; active filter chips

## Tech Stack

- [Expo](https://expo.dev/) (SDK 55)
- React Native
- TypeScript
- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) — data source
- [react-native-svg](https://github.com/software-mansion/react-native-svg) — custom charts
- [@react-navigation/bottom-tabs](https://reactnavigation.org/) — navigation
- [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)

## Data Source

Supabase table `news_data` with 8,000+ news records including:
- Publication metadata (title, URL, publisher, date)
- Engagement metrics (shows, likes, comments)
- Moderation results (topics, bad verdicts, persons, organizations, locations)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on web
npx expo start --web

# Run on iOS (requires macOS + Xcode or Expo Go)
npx expo start --ios
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── BadVerdictsChart.tsx
│   ├── DailyChart.tsx
│   ├── FilterPanel.tsx
│   ├── LoadingScreen.tsx
│   ├── PersonsRanking.tsx
│   ├── PieChartView.tsx
│   ├── PublishersChart.tsx
│   ├── SectionHeader.tsx
│   ├── StatCard.tsx
│   └── WordCloud.tsx
├── hooks/
│   └── NewsDataContext.tsx   # Global data context with Supabase
├── screens/
│   ├── DashboardScreen.tsx   # Main analytics dashboard
│   └── NewsListScreen.tsx    # Browsable news list
├── services/
│   └── supabase.ts           # Supabase client
├── types/
│   └── index.ts              # TypeScript interfaces
└── utils/
    ├── dataProcessing.ts     # Data aggregation utilities
    └── theme.ts              # Design tokens (colors, spacing)
```

## Screenshots

The app uses a dark theme inspired by modern analytics dashboards, with a color palette featuring purple primary (`#6C63FF`), teal accent (`#00D4AA`), and warm highlights.
