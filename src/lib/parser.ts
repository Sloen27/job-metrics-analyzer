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
  
  if (!id || !name || !startDateStr) return null;
  
  const startDate = parseDateTime(startDateStr);
  // EndDate может быть пустым (джоба в процессе выполнения)
  const endDate = endDateStr && endDateStr.trim() !== '' 
    ? parseDateTime(endDateStr) 
    : startDate; // Если EndDate пустой, используем StartDate
  const status = parseInt(statusStr) || 0;
  
  // Вычисляем длительность и проверяем на NaN
  let duration = endDate.getTime() - startDate.getTime();
  if (isNaN(duration) || duration < 0) {
    duration = 0;
  }
  
  // Status = 1 — успех, Status = 3 — ошибка, Status = 0 — в процессе
  const jobStatus = status === 3 ? JobStatus.Error : status === 1 ? JobStatus.Success : JobStatus.Success;
  
  return {
    id: id.replace(/"/g, ''),
    name: name.replace(/"/g, ''),
    startDate,
    endDate,
    status: jobStatus,
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

  // === НОВЫЕ МЕТРИКИ PostTagProcessingJob ===
  
  // Доля постов с 2-4 тегами
  const posts2to4TagsMatch = normalizedMetrics.match(/Доля постов с 2-4 тегами:\s*([\d.,]+)%/i);
  if (posts2to4TagsMatch) {
    metrics.postsWith2to4TagsPercent = parseFloat(posts2to4TagsMatch[1].replace(',', '.'));
  }

  // Доля постов с 1 тегом
  const posts1TagMatch = normalizedMetrics.match(/Доля постов с 1 тегом:\s*([\d.,]+)%/i);
  if (posts1TagMatch) {
    metrics.postsWith1TagPercent = parseFloat(posts1TagMatch[1].replace(',', '.'));
  }

  // Доля сломанных постов (0 тегов)
  const brokenPostsMatch = normalizedMetrics.match(/Доля сломанных постов \(0 тегов\):\s*([\d.,]+)%/i);
  if (brokenPostsMatch) {
    metrics.brokenPostsPercent = parseFloat(brokenPostsMatch[1].replace(',', '.'));
  }

  // Доля протегированных новых постов за два дня
  const newPostsTaggedMatch = normalizedMetrics.match(/Доля протегированных новых постов за два дня:\s*([\d.,]+)%/i);
  if (newPostsTaggedMatch) {
    metrics.newPostsTaggedIn2DaysPercent = parseFloat(newPostsTaggedMatch[1].replace(',', '.'));
  }

  // Среднее время от появления поста до тегирования
  const avgTimeToTagMatch = normalizedMetrics.match(/Среднее время от появления поста до тегирования:\s*([\d.,]+)\s*(мин|ч)/i);
  if (avgTimeToTagMatch) {
    const value = parseFloat(avgTimeToTagMatch[1].replace(',', '.'));
    // Если указано в часах, конвертируем в минуты
    metrics.avgTimeToTag = avgTimeToTagMatch[2] === 'ч' ? value * 60 : value;
  }

  // Парсинг таймингов: БД: 1.02% / ( 11315 мс / 1521 запросов)
  const dbTimingMatch = normalizedMetrics.match(/БД:\s*([\d.,]+)%\s*\/\s*\(\s*([\d\s]+)\s*мс\s*\/\s*([\d\s]+)\s*запросов?\)/i);
  if (dbTimingMatch) {
    metrics.dbTimePercent = parseFloat(dbTimingMatch[1].replace(',', '.'));
    metrics.dbTimeMs = parseNumber(dbTimingMatch[2]);
    metrics.dbRequests = parseNumber(dbTimingMatch[3]);
  }

  // Парсинг таймингов OpenSearch: OpenSearch: 0.29% / ( 3155 мс / 69 запросов)
  const openSearchTimingMatch = normalizedMetrics.match(/OpenSearch:\s*([\d.,]+)%\s*\/\s*\(\s*([\d\s]+)\s*мс\s*\/\s*([\d\s]+)\s*запросов?\)/i);
  if (openSearchTimingMatch) {
    metrics.openSearchTimePercent = parseFloat(openSearchTimingMatch[1].replace(',', '.'));
    metrics.openSearchTimeMs = parseNumber(openSearchTimingMatch[2]);
    metrics.openSearchRequests = parseNumber(openSearchTimingMatch[3]);
  }

  // Парсинг таймингов LLM: LLM: 85.42% / (944321 мс / 1500 запросов)
  const llmTimingMatch = normalizedMetrics.match(/LLM:\s*([\d.,]+)%\s*\/\s*\(\s*([\d\s]+)\s*мс\s*\/\s*([\d\s]+)\s*запросов?\)/i);
  if (llmTimingMatch) {
    metrics.llmTimePercent = parseFloat(llmTimingMatch[1].replace(',', '.'));
    metrics.llmTimeMs = parseNumber(llmTimingMatch[2]);
    // llmRequestsCount уже может быть установлен, обновляем только если пусто
    if (!metrics.llmRequestsCount) {
      metrics.llmRequestsCount = parseNumber(llmTimingMatch[3]);
    }
  }

  // === НОВЫЕ МЕТРИКИ TelegramProcessingJob ===
  
  // Суммарное количество смен прокси
  const proxyChangesMatch = normalizedMetrics.match(/Суммарное количество смен прокси:\s*([\d\s]+)/i);
  if (proxyChangesMatch) {
    metrics.proxyChanges = parseNumber(proxyChangesMatch[1]);
  }

  // Количество уникальных прокси
  const uniqueProxiesMatch = normalizedMetrics.match(/Количество уникальных прокси:\s*([\d\s]+)/i);
  if (uniqueProxiesMatch) {
    metrics.uniqueProxies = parseNumber(uniqueProxiesMatch[1]);
  }

  // Среднее количество источников на один прокси
  const avgSourcesPerProxyMatch = normalizedMetrics.match(/Среднее количество источников на один прокси:\s*([\d\s,.]+)/i);
  if (avgSourcesPerProxyMatch) {
    metrics.avgSourcesPerProxy = parseFloat(avgSourcesPerProxyMatch[1].replace(/\s/g, '').replace(',', '.'));
  }

  // Медианный пинг прокси
  const medianProxyPingMatch = normalizedMetrics.match(/Медианный пинг прокси:\s*([\d\s]+)\s*мс/i);
  if (medianProxyPingMatch) {
    metrics.medianProxyPing = parseNumber(medianProxyPingMatch[1]);
  }

  // Доля источников со сменой прокси
  const proxyChangeSourcesMatch = normalizedMetrics.match(/Доля источников со сменой прокси:\s*([\d,]+)%/i);
  if (proxyChangeSourcesMatch) {
    metrics.proxyChangeSourcesPercent = parseFloat(proxyChangeSourcesMatch[1].replace(',', '.'));
  }

  // === НОВЫЕ МЕТРИКИ TelegramPostCommentTrendProcessingJob ===
  
  // Общее количество постов для всех отслеживаний
  const totalTrackedPostsMatch = normalizedMetrics.match(/Общее количество постов для всех отслеживаний:\s*([\d\s]+)/i);
  if (totalTrackedPostsMatch) {
    metrics.totalTrackedPosts = parseNumber(totalTrackedPostsMatch[1]);
  }

  // Альтернативный формат LLM запросов (для PostTagProcessingJob в процессе)
  const llmRequestsSimpleMatch = normalizedMetrics.match(/LLM запросов:\s*([\d\s]+)/i);
  if (llmRequestsSimpleMatch && !metrics.llmRequestsCount) {
    metrics.llmRequestsCount = parseNumber(llmRequestsSimpleMatch[1]);
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
