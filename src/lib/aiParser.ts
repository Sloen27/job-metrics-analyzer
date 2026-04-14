// Парсинг CSV файлов с AI логами

import { AiLogRow } from './aiTypes';

// Результат парсинга
export interface AiLogParseResult {
  records: AiLogRow[];
  errorCount: number;
  errors: string[];
}

/**
 * Парсит CSV файл с AI логами
 */
export function parseAiLogFile(content: string): AiLogParseResult {
  const errors: string[] = [];
  const records: AiLogRow[] = [];
  
  // Удаляем BOM если есть
  let normalizedContent = content;
  if (content.charCodeAt(0) === 0xFEFF) {
    normalizedContent = content.slice(1);
  }
  
  const lines = normalizedContent.split('\n');
  
  // Находим заголовок
  if (lines.length === 0) {
    return { records: [], errorCount: 0, errors: ['Файл пуст'] };
  }
  
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);
  
  // Проверяем обязательные колонки (EndDate не обязателен)
  const requiredColumns = ['Id', 'Name', 'StartDate', 'CreatedAt', 'Status'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    return { 
      records: [], 
      errorCount: 0, 
      errors: [`Отсутствуют обязательные колонки: ${missingColumns.join(', ')}`] 
    };
  }
  
  // Создаём маппинг индексов колонок
  const columnIndices: Record<string, number> = {};
  headers.forEach((header, index) => {
    columnIndices[header] = index;
  });
  
  // Объединяем многострочные записи
  const csvRecords: string[] = [];
  let currentRecord = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Проверяем, начинается ли новая запись (содержит UUID в начале)
    const isNewRecord = /^[a-f0-9-]{36}/i.test(line.trim()) || 
                        /^"[a-f0-9-]{36}/i.test(line.trim());
    
    if (isNewRecord) {
      if (currentRecord) {
        csvRecords.push(currentRecord);
      }
      currentRecord = line;
    } else {
      currentRecord += '\n' + line;
    }
  }
  
  if (currentRecord) {
    csvRecords.push(currentRecord);
  }
  
  // Парсим каждую запись
  for (const record of csvRecords) {
    try {
      const parsed = parseAiLogRecord(record, columnIndices);
      if (parsed) {
        records.push(parsed);
      }
    } catch (error) {
      errors.push(`Ошибка парсинга записи: ${error}`);
    }
  }
  
  return { 
    records, 
    errorCount: csvRecords.length - records.length,
    errors 
  };
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
 * Парсит запись AI лога
 */
function parseAiLogRecord(record: string, columnIndices: Record<string, number>): AiLogRow | null {
  const fields = parseCsvRecord(record);
  
  // Получаем значения по индексам колонок
  const getValue = (columnName: string): string => {
    const index = columnIndices[columnName];
    return index !== undefined ? (fields[index] || '') : '';
  };
  
  const id = getValue('Id');
  const name = getValue('Name');
  const startDateStr = getValue('StartDate');
  const createdAtStr = getValue('CreatedAt');
  const statusStr = getValue('Status');
  const error = getValue('Error');
  const endDateStr = getValue('EndDate');
  const configType = getValue('ConfigType');
  const provider = getValue('Provider');
  const modelName = getValue('ModelName');
  const spentTokensStr = getValue('SpentTokens');
  
  // Валидация обязательных полей (EndDate не обязателен)
  if (!id || !name || !startDateStr || !createdAtStr) {
    return null;
  }
  
  const startDate = parseDateTime(startDateStr);
  const createdAt = parseDateTime(createdAtStr);
  // EndDate может быть пустым (джоба в процессе выполнения)
  const endDate = endDateStr && endDateStr.trim() !== '' 
    ? parseDateTime(endDateStr) 
    : startDate;
  const status = parseInt(statusStr) || 0;
  
  // Вычисляем durationMs и queueLagMs
  let durationMs = endDate.getTime() - startDate.getTime();
  if (isNaN(durationMs) || durationMs < 0) {
    durationMs = 0;
  }
  
  let queueLagMs = startDate.getTime() - createdAt.getTime();
  if (isNaN(queueLagMs) || queueLagMs < 0) {
    queueLagMs = 0;
  }
  
  // Парсим spentTokens (по умолчанию 0)
  const spentTokens = parseInt(spentTokensStr) || 0;
  
  // Status = 1 — успех, Status = 3 — ошибка, Status = 0 — в процессе
  const isSuccess = status === 1;
  const isError = status === 3;
  
  return {
    id: id.replace(/"/g, ''),
    name: name.replace(/"/g, ''),
    startDate,
    createdAt,
    endDate,
    status,
    error: error?.replace(/"/g, '') || '',
    configType: configType?.replace(/"/g, '') || '',
    provider: provider?.replace(/"/g, '') || '',
    modelName: modelName?.replace(/"/g, '') || '',
    spentTokens,
    durationMs,
    queueLagMs,
    isSuccess,
    isError,
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

/**
 * Вычисляет перцентиль
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Вычисляет медиану
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
