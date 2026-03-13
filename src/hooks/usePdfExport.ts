import { useState, RefObject } from 'react';
import { Platform, Alert, ScrollView } from 'react-native';

// Динамические импорты для мобильных платформ
let Print: any = null;
let Sharing: any = null;

try {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
} catch (e) {}

/**
 * Генерирует PDF из содержимого экрана.
 * На вебе использует встроенную функцию печати браузера.
 * На мобильном использует expo-print для создания PDF.
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
        await exportMobileAsPdf(title);
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
  // На веб-платформе используем встроенную функцию печати браузера
  try {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { margin: 10mm; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #333;
    }
    .page-header {
      background: #1a1d27;
      color: #fff;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    .brand { font-size: 18px; font-weight: 900; letter-spacing: 4px; color: #6C63FF; }
    .meta { font-size: 11px; color: #8B8FA8; }
  </style>
</head>
<body>
  <div class="page-header">
    <span class="brand">PULSE</span>
    <span class="meta">${title} · ${new Date().toLocaleString('ru-RU')}</span>
  </div>
  <p style="text-align: center; color: #999; margin-top: 40px;">
    Используйте функцию печати браузера (Ctrl+P или Cmd+P) для сохранения в PDF
  </p>
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
  } catch (e) {
    // Fallback: window.print()
    window.print();
  }
}

// ─── MOBILE ──────────────────────────────────────────────────────────────────

async function exportMobileAsPdf(title: string) {
  if (!Print || !Sharing) {
    Alert.alert('Ошибка', 'Модуль печати недоступен');
    return;
  }

  // Создаём простой HTML для печати
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
    .content {
      padding: 20px;
      color: #333;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="brand">PULSE</span>
    <span class="meta">${title} · ${new Date().toLocaleString('ru-RU')}</span>
  </div>
  <div class="content">
    <h2>${title}</h2>
    <p>Отчёт сгенерирован в приложении Pulse</p>
  </div>
</body>
</html>`;

  try {
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
  } catch (e) {
    Alert.alert('Ошибка', 'Не удалось создать PDF');
  }
}
