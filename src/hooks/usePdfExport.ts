import { useState, RefObject } from 'react';
import { Platform, Alert, ScrollView } from 'react-native';

// Динамические импорты для мобильных платформ
let captureRef: any = null;
let Print: any = null;
let Sharing: any = null;

try {
  const viewShot = require('react-native-view-shot');
  captureRef = viewShot.captureRef;
} catch (e) {}

try {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
} catch (e) {}

/**
 * Захватывает весь ScrollView как изображение и генерирует PDF.
 * На вебе использует html2canvas для захвата DOM.
 * На мобильном использует react-native-view-shot + expo-print.
 */
export function usePdfExport() {
  const [loading, setLoading] = useState(false);

  /**
   * @param scrollRef - ref на ScrollView (для мобильного)
   * @param title - заголовок для PDF
   */
  const exportScreenAsPdf = async (
    scrollRef: RefObject<ScrollView | any>,
    title: string
  ) => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await exportWebAsPdf(title);
      } else {
        await exportMobileAsPdf(scrollRef, title);
      }
    } catch (e: any) {
      console.error('PDF export error:', e);
      Alert.alert('Ошибка', `Не удалось создать PDF: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return { exportScreenAsPdf, loading };
}

// ─── WEB ────────────────────────────────────────────────────────────────────

async function exportWebAsPdf(title: string) {
  // Динамически импортируем html2canvas
  let html2canvas: any;
  try {
    const mod = await import('html2canvas');
    html2canvas = mod.default || mod;
  } catch (e) {
    // Fallback: window.print()
    window.print();
    return;
  }

  // Находим корневой скролл-контейнер
  const scrollContainer = findScrollContainer();
  if (!scrollContainer) {
    window.print();
    return;
  }

  // Временно раскрываем весь контент для захвата
  const originalOverflow = scrollContainer.style.overflow;
  const originalHeight = scrollContainer.style.height;
  const originalMaxHeight = scrollContainer.style.maxHeight;
  scrollContainer.style.overflow = 'visible';
  scrollContainer.style.height = 'auto';
  scrollContainer.style.maxHeight = 'none';

  try {
    const canvas = await html2canvas(scrollContainer, {
      useCORS: true,
      allowTaint: true,
      scale: 1.5, // Повышенное разрешение для чёткости
      logging: false,
      backgroundColor: null,
      scrollX: 0,
      scrollY: 0,
      windowWidth: scrollContainer.scrollWidth,
      windowHeight: scrollContainer.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // A4 в пикселях при 96dpi: 794 x 1123
    const pageWidth = 794;
    const pageHeight = Math.round((imgHeight / imgWidth) * pageWidth);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: ${pageWidth}px ${pageHeight}px; margin: 0; }
    body { width: ${pageWidth}px; }
    .page-header {
      background: #1a1d27;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .brand { font-size: 18px; font-weight: 900; letter-spacing: 4px; color: #6C63FF; }
    .meta { font-size: 11px; color: #8B8FA8; }
    img { width: ${pageWidth}px; display: block; }
  </style>
</head>
<body>
  <div class="page-header">
    <span class="brand">PULSE</span>
    <span class="meta">${title} · ${new Date().toLocaleString('ru-RU')}</span>
  </div>
  <img src="${imgData}" />
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 800);
    }
  } finally {
    // Восстанавливаем стили
    scrollContainer.style.overflow = originalOverflow;
    scrollContainer.style.height = originalHeight;
    scrollContainer.style.maxHeight = originalMaxHeight;
  }
}

function findScrollContainer(): HTMLElement | null {
  // Ищем скролл-контейнер React Native Web
  const all = document.querySelectorAll<HTMLElement>('*');
  let best: HTMLElement | null = null;
  let bestHeight = 0;
  for (const el of all) {
    const s = window.getComputedStyle(el);
    const isScrollable =
      s.overflow === 'scroll' ||
      s.overflowY === 'scroll' ||
      s.overflow === 'auto' ||
      s.overflowY === 'auto';
    if (isScrollable && el.scrollHeight > bestHeight) {
      best = el;
      bestHeight = el.scrollHeight;
    }
  }
  return best;
}

// ─── MOBILE ──────────────────────────────────────────────────────────────────

async function exportMobileAsPdf(
  scrollRef: RefObject<any>,
  title: string
) {
  if (!captureRef) {
    Alert.alert('Ошибка', 'Модуль захвата экрана недоступен');
    return;
  }
  if (!Print || !Sharing) {
    Alert.alert('Ошибка', 'Модуль печати недоступен');
    return;
  }

  // Захватываем весь ScrollView включая контент за пределами экрана
  const uri = await captureRef(scrollRef, {
    format: 'jpg',
    quality: 0.92,
    result: 'tmpfile',
    snapshotContentContainer: true, // захватывает весь scroll-контент
  });

  // Конвертируем изображение в PDF через expo-print
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    @page { margin: 0; }
    body { width: 100%; }
    .header {
      background: #1a1d27;
      color: #fff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      font-family: sans-serif;
    }
    .brand { font-size: 16px; font-weight: 900; letter-spacing: 3px; color: #6C63FF; }
    .meta { font-size: 10px; color: #8B8FA8; }
    img { width: 100%; display: block; }
  </style>
</head>
<body>
  <div class="header">
    <span class="brand">PULSE</span>
    <span class="meta">${title} · ${new Date().toLocaleString('ru-RU')}</span>
  </div>
  <img src="${uri}" />
</body>
</html>`;

  const { uri: pdfUri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Поделиться: ${title}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    await Print.printAsync({ uri: pdfUri });
  }
}
