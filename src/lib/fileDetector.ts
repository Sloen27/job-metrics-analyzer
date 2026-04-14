// Определение типа CSV файла

export type FileType = 'operation' | 'ai' | 'unknown';

/**
 * Определяет тип CSV файла по заголовкам
 */
export function detectFileType(content: string): FileType {
  // Удаляем BOM если есть
  let normalizedContent = content;
  if (content.charCodeAt(0) === 0xFEFF) {
    normalizedContent = content.slice(1);
  }
  
  const lines = normalizedContent.split('\n');
  if (lines.length === 0) return 'unknown';
  
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);
  
  // Проверяем на OperationLog
  // Обязательные колонки: Id, Name, StartDate, EndDate, Status, Error, Metrics
  const operationLogRequired = ['Id', 'Name', 'StartDate', 'EndDate', 'Status', 'Error', 'Metrics'];
  const isOperationLog = operationLogRequired.every(col => headers.includes(col));
  
  if (isOperationLog) return 'operation';
  
  // Проверяем на AiLog
  // Обязательные колонки: Id, Name, StartDate, CreatedAt, Status, Error, EndDate, ConfigType, Provider, ModelName, SpentTokens
  const aiLogRequired = ['Id', 'Name', 'StartDate', 'CreatedAt', 'Status', 'Error', 'EndDate', 'ConfigType', 'Provider', 'ModelName', 'SpentTokens'];
  const isAiLog = aiLogRequired.every(col => headers.includes(col));
  
  if (isAiLog) return 'ai';
  
  return 'unknown';
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
 * Получает человекочитаемое название типа файла
 */
export function getFileTypeName(type: FileType): string {
  switch (type) {
    case 'operation':
      return 'OperationLog';
    case 'ai':
      return 'AiLog';
    default:
      return 'Неизвестный формат';
  }
}

/**
 * Получает описание типа файла
 */
export function getFileTypeDescription(type: FileType): string {
  switch (type) {
    case 'operation':
      return 'Логи выполнения операций (Id, Name, StartDate, EndDate, Status, Error, Metrics)';
    case 'ai':
      return 'Логи AI операций (Id, Name, StartDate, CreatedAt, Status, Error, EndDate, ConfigType, Provider, ModelName, SpentTokens)';
    default:
      return 'Файл не соответствует ни одному из поддерживаемых форматов';
  }
}
