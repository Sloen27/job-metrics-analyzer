// Парсинг CSV файлов с логами джоб

import { JobLog, JobStatus, JobMetrics } from './types';

/**
 * Парсит CSV файл с логами джоб
 */
export function parseCsvFile(content: string): JobLog[] {
  const lines = content.split('\n');
  const jobs: JobLog[] = [];
  
  // Находим заголовок
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);
  
  // Объединяем многострочные записи
  const records: string[] = [];
  let currentRecord = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Проверяем, начинается ли новая запись (содержит UUID в начале)
    const isNewRecord = /^[a-f0-9-]{36}/i.test(line.trim()) || 
                        /^"[a-f0-9-]{36}/i.test(line.trim());
    
    if (isNewRecord) {
      if (currentRecord) {
        records.push(currentRecord);
      }
      currentRecord = line;
    } else {
      currentRecord += '\n' + line;
    }
  }
  
  if (currentRecord) {
    records.push(currentRecord);
  }
  
  // Парсим каждую запись
  for (const record of records) {
    try {
      const job = parseJobRecord(record);
      if (job) {
        jobs.push(job);
      }
    } catch (error) {
      console.error('Error parsing record:', error);
    }
  }
  
  return jobs;
}

/**
 * Парсит строку CSV с учетом кавычек
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Парсит запись о джобе
 */
function parseJobRecord(record: string): JobLog | null {
  const fields = parseCsvRecord(record);
  
  if (fields.length < 6) return null;
  
  const [id, name, startDateStr, endDateStr, statusStr, error, metricsStr] = fields;
  
  if (!id || !name || !startDateStr || !endDateStr) return null;
  
  const startDate = parseDateTime(startDateStr);
  const endDate = parseDateTime(endDateStr);
  const status = parseInt(statusStr) as JobStatus;
  
  // Вычисляем длительность и проверяем на NaN
  let duration = endDate.getTime() - startDate.getTime();
  if (isNaN(duration)) {
    duration = 0;
  }
  
  return {
    id: id.replace(/"/g, ''),
    name: name.replace(/"/g, ''),
    startDate,
    endDate,
    status: status || JobStatus.Success,
    error: error?.replace(/"/g, '') || '',
    metrics: parseMetrics(metricsStr || ''),
    duration,
  };
}

/**
 * Парсит запись CSV с многострочными полями
 */
function parseCsvRecord(record: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < record.length; i++) {
    const char = record[i];
    
    if (char === '"') {
      if (inQuotes && record[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Парсит дату/время в формате PostgreSQL
 */
function parseDateTime(dateStr: string): Date {
  // Формат: 2026-03-08 22:00:05.606554+00
  if (!dateStr) {
    return new Date();
  }
  
  try {
    let normalized = dateStr.trim();
    
    // Если есть пробел между датой и временем, заменяем на T
    if (normalized.includes(' ')) {
      normalized = normalized.replace(' ', 'T');
    }
    
    // Убираем микросекунды (оставляем только миллисекунды - 3 знака)
    // Формат: 2026-03-08T22:00:05.606554+00 -> 2026-03-08T22:00:05.606+00
    normalized = normalized.replace(/\.(\d{3})\d*([+-Z].*)?$/, '.$1$2');
    
    // Если timezone +00, заменяем на Z
    normalized = normalized.replace(/\+00$/, 'Z');
    normalized = normalized.replace(/\+00:/, 'Z');
    
    const date = new Date(normalized);
    
    // Проверяем валидность даты
    if (isNaN(date.getTime())) {
      // Пробуем другой формат - без timezone
      const withoutTz = normalized.replace(/[+-]\d{2}(:?\d{2})?$/, '').replace(/Z$/, '');
      const fallbackDate = new Date(withoutTz + 'Z');
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate;
      }
      return new Date();
    }
    
    return date;
  } catch {
    return new Date();
  }
}

/**
 * Парсит строку метрик в структурированный объект
 */
export function parseMetrics(metricsStr: string): JobMetrics {
  const metrics: JobMetrics = {};
  
  if (!metricsStr || metricsStr.trim() === '') return metrics;
  
  // Нормализуем строку - убираем лишние пробелы и переносы строк
  const normalizedMetrics = metricsStr
    .replace(/\s+/g, ' ')
    .trim();
  
  // Извлекаем числовые значения с помощью паттернов
  
  // Количество обработанных постов
  const processedPostsMatch = normalizedMetrics.match(/Суммарное количество обработанных постов:\s*([\d\s]+)/i);
  if (processedPostsMatch) {
    metrics.processedPosts = parseNumber(processedPostsMatch[1]);
  }
  
  // Количество протегированных постов
  const taggedPostsMatch = normalizedMetrics.match(/Суммарное количество протегированных постов:\s*([\d\s]+)/i);
  if (taggedPostsMatch) {
    metrics.taggedPosts = parseNumber(taggedPostsMatch[1]);
  }
  
  // Среднее время LLM запроса
  const avgLlmTimeMatch = normalizedMetrics.match(/Среднее время LLM запроса:\s*([\d.,]+)/i);
  if (avgLlmTimeMatch) {
    metrics.avgLlmTime = parseFloat(avgLlmTimeMatch[1].replace(',', '.'));
  }
  
  // Суммарное время LLM запросов
  const totalLlmTimeMatch = normalizedMetrics.match(/Суммарное время всех LLM запросов:\s*([\d\s]+)/i);
  if (totalLlmTimeMatch) {
    metrics.totalLlmTime = parseNumber(totalLlmTimeMatch[1]);
  }
  
  // Количество LLM запросов
  const llmRequestsMatch = normalizedMetrics.match(/Общее количество LLM запросов:\s*([\d\s]+)/i);
  if (llmRequestsMatch) {
    metrics.llmRequestsCount = parseNumber(llmRequestsMatch[1]);
  }
  
  // Альтернативный формат для LLM запросов
  const llmRequestsAltMatch = normalizedMetrics.match(/Количество LLM запросов:\s*([\d\s]+)/i);
  if (llmRequestsAltMatch && !metrics.llmRequestsCount) {
    metrics.llmRequestsCount = parseNumber(llmRequestsAltMatch[1]);
  }
  
  // Суммарное время LLM (альтернативный формат)
  const totalLlmAltMatch = normalizedMetrics.match(/Суммарное время LLM:\s*([\d\s]+)/i);
  if (totalLlmAltMatch && !metrics.totalLlmTime) {
    metrics.totalLlmTime = parseNumber(totalLlmAltMatch[1]);
  }
  
  // Количество обработанных инфоповодов
  const processedInfoMatch = normalizedMetrics.match(/Суммарное количество обработанных инфоповодов:\s*([\d\s]+)/i);
  if (processedInfoMatch) {
    metrics.processedInfoEvents = parseNumber(processedInfoMatch[1]);
  }
  
  // Среднее количество комментариев
  const avgCommentsMatch = normalizedMetrics.match(/Среднее количество комментариев(?: на один пост| на инфоповод)?:\s*([\d.,]+)/i);
  if (avgCommentsMatch) {
    metrics.avgComments = parseFloat(avgCommentsMatch[1].replace(',', '.'));
  }
  
  // Всего комментариев
  const totalCommentsMatch = normalizedMetrics.match(/Всего проанализировано комментариев:\s*([\d\s]+)/i);
  if (totalCommentsMatch) {
    metrics.totalComments = parseNumber(totalCommentsMatch[1]);
  }
  
  // Telegram метрики
  const activeSourcesMatch = normalizedMetrics.match(/Количество активных источников для сбора:\s*([\d\s]+)/i);
  if (activeSourcesMatch) {
    metrics.activeSources = parseNumber(activeSourcesMatch[1]);
  }
  
  const processedSourcesMatch = normalizedMetrics.match(/Количество полностью обработанных источников:\s*([\d\s]+)/i);
  if (processedSourcesMatch) {
    metrics.processedSources = parseNumber(processedSourcesMatch[1]);
  }
  
  const connectedSourcesMatch = normalizedMetrics.match(/Количество источников к которым было подключение:\s*([\d\s]+)/i);
  if (connectedSourcesMatch) {
    metrics.connectedSources = parseNumber(connectedSourcesMatch[1]);
  }
  
  const usedAccountsMatch = normalizedMetrics.match(/Общее количество использованных аккаунтов:\s*([\d\s]+)/i);
  if (usedAccountsMatch) {
    metrics.usedAccounts = parseNumber(usedAccountsMatch[1]);
  }
  
  const newPostsMatch = normalizedMetrics.match(/Суммарное количество новых постов:\s*([\d\s]+)/i);
  if (newPostsMatch) {
    metrics.newPosts = parseNumber(newPostsMatch[1]);
  }
  
  const totalPostsMatch = normalizedMetrics.match(/Суммарное количество всех постов:\s*([\d\s]+)/i);
  if (totalPostsMatch) {
    metrics.totalPosts = parseNumber(totalPostsMatch[1]);
  }
  
  // Проценты и доли
  const successRateMatch = normalizedMetrics.match(/Доля успешных обработок постов:\s*([\d.,]+)%/i);
  if (successRateMatch) {
    metrics.successRate = parseFloat(successRateMatch[1].replace(',', '.'));
  }
  
  const taggedPercentMatch = normalizedMetrics.match(/Процент протегированных постов за период:\s*([\d.,]+)%/i);
  if (taggedPercentMatch) {
    metrics.taggedPercent = parseFloat(taggedPercentMatch[1].replace(',', '.'));
  }
  
  const shortPostsMatch = normalizedMetrics.match(/Доля постов с очень коротким текстом[^:]*:\s*[\d\s]+\s*\(([\d.,]+)%\)/i);
  if (shortPostsMatch) {
    metrics.shortPostsPercent = parseFloat(shortPostsMatch[1].replace(',', '.'));
  }
  
  const shortTrendsMatch = normalizedMetrics.match(/Доля пустых или слишком коротких трендов[^:]*:\s*[\d\s]+\s*\(([\d.,]+)%\)/i);
  if (shortTrendsMatch) {
    metrics.shortTrendsPercent = parseFloat(shortTrendsMatch[1].replace(',', '.'));
  }
  
  // Альтернативный формат доли трендов (без скобок)
  const shortTrendsAltMatch = normalizedMetrics.match(/Доля пустых или слишком коротких трендов[^:]*:\s*([\d.,]+)%/i);
  if (shortTrendsAltMatch && !metrics.shortTrendsPercent) {
    metrics.shortTrendsPercent = parseFloat(shortTrendsAltMatch[1].replace(',', '.'));
  }
  
  return metrics;
}

/**
 * Парсит число с пробелами (напр. "1 234 567")
 */
function parseNumber(str: string): number {
  return parseInt(str.replace(/\s/g, ''), 10);
}

/**
 * Форматирует длительность в читаемый формат
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} мс`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} сек`;
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes} мин ${seconds} сек`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.round((ms % 3600000) / 60000);
  return `${hours} ч ${minutes} мин`;
}

/**
 * Форматирует число с разделителями
 */
export function formatNumber(num: number | undefined): string {
  if (num === undefined) return '-';
  return num.toLocaleString('ru-RU');
}
