import { supabase } from './supabase';
import { NewsItem } from '../types';

/**
 * Загружает все данные из таблицы total_data и маппинг стран
 * Использует пагинацию для загрузки всех записей (Supabase ограничивает ответ до 1000 строк по умолчанию)
 */
export async function fetchAllNewsFromSupabase(): Promise<any[]> {
  console.log('Fetching data from total_data...');
  
  const PAGE_SIZE = 1000;
  const allData: any[] = [];
  let page = 0;
  let hasMore = true;
  
  // 1. Загружаем основные данные из total_data с пагинацией
  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    
    const { data: pageData, error: totalErr } = await supabase
      .from('total_data')
      .select('*')
      .order('dt', { ascending: false })
      .range(from, to);

    if (totalErr) {
      console.error('Error fetching total_data page', page, ':', totalErr);
      throw totalErr;
    }
    
    if (!pageData || pageData.length === 0) {
      hasMore = false;
    } else {
      allData.push(...pageData);
      console.log(`Loaded page ${page}: ${pageData.length} items (total: ${allData.length})`);
      page++;
    }
  }
  
  const totalData = allData;

  // 2. Загружаем маппинг стран
  const { data: countryMapping, error: mapErr } = await supabase
    .from('contry_mappping')
    .select('iso3, iso2');

  if (mapErr) {
    console.warn('Error fetching contry_mappping (non-critical):', mapErr);
  }

  // Создаем карту для быстрого поиска iso2 по iso3
  const isoMap = new Map<string, string>();
  if (countryMapping) {
    countryMapping.forEach(m => {
      if (m.iso3 && m.iso2) {
        isoMap.set(m.iso3.toUpperCase(), m.iso2.toLowerCase());
      }
    });
  }

  // 3. Объединяем данные
  const combinedData = totalData.map(item => {
    const iso3 = item.country?.toUpperCase();
    const iso2 = iso3 ? isoMap.get(iso3) : null;
    
    return {
      ...item,
      country_iso2: iso2
    };
  });

  console.log(`Successfully loaded ${combinedData.length} items from total_data`);
  return combinedData;
}
