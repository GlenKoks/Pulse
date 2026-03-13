import { useState } from 'react';
import { Platform, Alert } from 'react-native';

// expo-print и expo-sharing используются только на мобильных платформах
// На вебе используем window.print()
let Print: any = null;
let Sharing: any = null;

try {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
} catch (e) {
  // Не критично — на вебе используем window.print()
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
}

export interface PdfSection {
  heading: string;
  rows?: { label: string; value: string }[];
  text?: string;
  table?: { headers: string[]; rows: string[][] };
  list?: string[];
}

function buildHtml(options: PdfExportOptions): string {
  const { title, subtitle, sections } = options;
  const now = new Date().toLocaleString('ru-RU');

  const sectionsHtml = sections.map(s => {
    let content = '';
    
    if (s.rows && s.rows.length > 0) {
      content = `<table class="key-value">
        ${s.rows.map(r => `<tr><td class="label">${r.label}</td><td class="value">${r.value}</td></tr>`).join('')}
      </table>`;
    } else if (s.table && s.table.headers.length > 0) {
      content = `<table class="data-table">
        <thead>
          <tr>${s.table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${s.table.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>`;
    } else if (s.list && s.list.length > 0) {
      content = `<ul class="item-list">
        ${s.list.map(item => `<li>${item}</li>`).join('')}
      </ul>`;
    } else if (s.text) {
      content = `<p class="text">${s.text}</p>`;
    }
    
    return `<div class="section">
      <h2>${s.heading}</h2>
      ${content}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fff;
      color: #1a1d27;
      padding: 40px;
    }
    .header {
      border-bottom: 3px solid #6C63FF;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 6px;
      color: #6C63FF;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #1a1d27;
      margin-top: 8px;
    }
    .subtitle {
      font-size: 13px;
      color: #8B8FA8;
      margin-top: 4px;
    }
    .meta {
      font-size: 11px;
      color: #9699B0;
      margin-top: 6px;
    }
    .section {
      margin-bottom: 28px;
      padding: 20px;
      border: 1px solid #DDE1F0;
      border-radius: 12px;
      break-inside: avoid;
    }
    h2 {
      font-size: 15px;
      font-weight: 700;
      color: #5A52E0;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Key-value table */
    table.key-value { width: 100%; border-collapse: collapse; }
    table.key-value tr { border-bottom: 1px solid #EEF0F8; }
    table.key-value tr:last-child { border-bottom: none; }
    table.key-value td { padding: 8px 4px; font-size: 13px; }
    table.key-value .label { color: #5A5E78; width: 55%; }
    table.key-value .value { color: #1a1d27; font-weight: 600; text-align: right; }
    
    /* Data table */
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.data-table thead { background: #F3F1FF; }
    table.data-table th { 
      padding: 10px 6px; 
      font-size: 12px; 
      font-weight: 700; 
      color: #5A52E0; 
      text-align: left;
      border-bottom: 2px solid #DDE1F0;
    }
    table.data-table td { 
      padding: 8px 6px; 
      font-size: 12px; 
      color: #3a3d50;
      border-bottom: 1px solid #EEF0F8;
    }
    table.data-table tr:last-child td { border-bottom: none; }
    
    /* Lists */
    ul.item-list { 
      margin-left: 20px; 
      font-size: 13px; 
      color: #3a3d50; 
      line-height: 1.8;
    }
    ul.item-list li { margin-bottom: 6px; }
    
    .text { 
      font-size: 13px; 
      color: #3a3d50; 
      line-height: 1.6; 
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #DDE1F0;
      font-size: 11px;
      color: #9699B0;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">PULSE</div>
    <div class="title">${title}</div>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    <div class="meta">Сформировано: ${now}</div>
  </div>
  ${sectionsHtml}
  <div class="footer">Pulse — Аналитика новостей · Автоматически сформированный отчёт</div>
</body>
</html>`;
}

export function usePdfExport() {
  const [loading, setLoading] = useState(false);

  const exportPdf = async (options: PdfExportOptions) => {
    setLoading(true);
    try {
      const html = buildHtml(options);

      // На вебе — открываем print-диалог браузера
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
        return;
      }

      // На мобильных — expo-print + expo-sharing
      if (!Print || !Sharing) {
        Alert.alert('Ошибка', 'Модуль печати недоступен');
        return;
      }

      const { uri } = await Print.printToFileAsync({ html, base64: false });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Поделиться: ${options.title}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ uri });
      }
    } catch (e) {
      console.error('PDF export error:', e);
      Alert.alert('Ошибка', 'Не удалось создать PDF');
    } finally {
      setLoading(false);
    }
  };

  return { exportPdf, loading };
}
