import { NewsItem } from '../types';

const TOPICS = [
  'Политика', 'Экономика', 'Технологии', 'Спорт', 'Культура',
  'Здоровье', 'Наука', 'Общество', 'Бизнес', 'Международные отношения',
];

const VERDICTS = ['Желтуха', 'Политика', 'Агрессия', 'Кликбейт', 'Манипуляция', 'Дезинформация'];

const PERSONS = [
  'Илон Маск', 'Владимир Путин', 'Дональд Трамп', 'Джо Байден', 'Тим Кук',
  'Марк Цукерберг', 'Сергей Собянин', 'Михаил Мишустин', 'Антон Силуанов',
  'Герман Греф', 'Андрей Костин', 'Набиуллина Эльвира', 'Кирилл Дмитриев',
  'Алексей Миллер', 'Игорь Сечин', 'Сатья Наделла', 'Дженсен Хуанг',
  'Эммануэль Макрон', 'Олаф Шольц', 'Риши Сунак',
];

const COMPANIES = [
  'Газпром', 'Сбербанк', 'Роснефть', 'Лукойл', 'Яндекс', 'VK', 'МТС',
  'Apple', 'Google', 'Microsoft', 'Tesla', 'OpenAI', 'Nvidia', 'Amazon',
  'Норникель', 'Северсталь', 'Магнит', 'X5 Group', 'Аэрофлот', 'РЖД',
];

const LOCATIONS = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань',
  'США', 'Китай', 'Европа', 'Украина', 'Германия', 'Великобритания',
  'Ближний Восток', 'Азия', 'Африка', 'Латинская Америка', 'Сибирь',
  'Дальний Восток', 'Краснодар', 'Ростов-на-Дону', 'Нижний Новгород',
];

const PUBLISHERS = [
  'РИА Новости', 'ТАСС', 'Интерфакс', 'Коммерсантъ', 'Ведомости',
  'РБК', 'Газета.Ru', 'Lenta.ru', 'Meduza', 'Forbes Russia',
  'Известия', 'Российская газета', 'НТВ', 'Первый канал', 'RT',
];

const HEADLINES = [
  'Илон Маск анонсировал новый проект Tesla в России',
  'Газпром увеличил поставки газа в Европу',
  'Яндекс запустил новую нейросеть для обработки текстов',
  'Сбербанк отчитался о рекордной прибыли за квартал',
  'МВФ пересмотрел прогноз роста мировой экономики',
  'Путин провёл переговоры с лидерами G20',
  'Apple представила новые iPhone с улучшенным ИИ',
  'Нефть Brent упала ниже 80 долларов за баррель',
  'Россия и Китай подписали соглашение о торговле',
  'Трамп заявил о планах по реформированию НАТО',
  'Nvidia побила рекорд капитализации на бирже',
  'Роснефть начала разработку новых месторождений в Сибири',
  'Цукерберг представил новые функции Meta AI',
  'Минфин России объявил о бюджетных изменениях',
  'Собянин открыл новые станции московского метро',
  'OpenAI выпустила новую версию ChatGPT',
  'Норникель увеличил производство никеля',
  'Аэрофлот восстановил маршруты в Азию',
  'Греф рассказал о цифровой трансформации банка',
  'Макрон призвал к реформированию ЕС',
  'Шольц обсудил энергетику с Путиным',
  'Силуанов представил бюджет на 2026 год',
  'РЖД инвестирует в высокоскоростные магистрали',
  'VK запустил новую платформу для разработчиков',
  'МТС объявил о слиянии с другим оператором',
  'Набиуллина повысила ключевую ставку',
  'Лукойл нашёл новые запасы нефти на шельфе',
  'Магнит открыл тысячный магазин в регионах',
  'X5 Group расширяет сеть в Сибири',
  'Северсталь увеличила экспорт стали в Азию',
  'Дмитриев рассказал об инвестициях РФПИ',
  'Миллер обсудил газовый транзит с европейскими партнёрами',
  'Сечин представил стратегию Роснефти до 2030 года',
  'Костин рассказал о санкционных рисках для ВТБ',
  'Наделла объявил о расширении Microsoft в России',
  'Хуанг представил новые чипы для ИИ-вычислений',
  'Сунак объявил о новом пакете помощи Украине',
  'Байден подписал закон о поддержке зелёной энергетики',
  'Тим Кук посетил производство в Китае',
  'Google обновил алгоритмы поиска',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = randomInt(min, max);
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function generateMockData(count: number = 500): NewsItem[] {
  const now = new Date();
  const items: NewsItem[] = [];

  for (let i = 0; i < count; i++) {
    const daysAgo = randomInt(0, 30);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const topics = randomSubset(TOPICS, 1, 3);
    const verdicts = Math.random() > 0.6 ? randomSubset(VERDICTS, 1, 2) : [];
    const persons = Math.random() > 0.4 ? randomSubset(PERSONS, 1, 3) : [];
    const companies = Math.random() > 0.5 ? randomSubset(COMPANIES, 1, 3) : [];
    const locations = Math.random() > 0.5 ? randomSubset(LOCATIONS, 1, 3) : [];

    items.push({
      ndx: i + 1,
      pub_url: `https://example.com/news/${i + 1}`,
      publication_title_name: randomFrom(HEADLINES),
      publisher_name: randomFrom(PUBLISHERS),
      dt: formatDate(date),
      shows: randomInt(1000, 500000),
      likes: String(randomInt(0, 5000)),
      comments: String(randomInt(0, 1000)),
      topics_verdicts_list: topics.join(', '),
      bad_verdicts_list: verdicts.length > 0 ? verdicts.join(', ') : null,
      persons: persons.length > 0 ? persons.join(', ') : null,
      organizations: companies.length > 0 ? companies.join(', ') : null,
      locations: locations.length > 0 ? locations.join(', ') : null,
      country: 'Россия',
    });
  }

  return items;
}

// Pre-generated static dataset for consistent rendering
export const MOCK_DATA: NewsItem[] = generateMockData(500);
