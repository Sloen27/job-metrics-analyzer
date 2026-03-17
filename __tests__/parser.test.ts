// Простые тесты для парсера CSV и извлечения метрик

import { parseCsvFile, parseMetrics, formatDuration, formatNumber } from '../src/lib/parser';
import * as fs from 'fs';

describe('CSV Parser', () => {
  test('parseMetrics - должен извлекать количество обработанных постов', () => {
    const metrics = parseMetrics('Суммарное количество обработанных постов: 372');
    expect(metrics.processedPosts).toBe(372);
  });

  test('parseMetrics - должен извлекать LLM метрики', () => {
    const metricsStr = `Среднее время LLM запроса: 605.0 мс
      Суммарное время всех LLM запросов: 469020 мс
      Общее количество LLM запросов: 1000`;
    const metrics = parseMetrics(metricsStr);
    
    expect(metrics.avgLlmTime).toBe(605.0);
    expect(metrics.totalLlmTime).toBe(469020);
    expect(metrics.llmRequestsCount).toBe(1000);
  });

  test('parseMetrics - должен возвращать пустой объект для пустой строки', () => {
    const metrics = parseMetrics('');
    expect(Object.keys(metrics).length).toBe(0);
  });

  test('formatDuration - должен форматировать короткие длительности', () => {
    expect(formatDuration(500)).toBe('500 мс');
    expect(formatDuration(5000)).toBe('5.0 сек');
  });
});

describe('CSV File Parsing', () => {
  test('parseCsvFile - должен парсить CSV файл', () => {
    const csvContent = fs.readFileSync('/home/z/my-project/upload/OperationLog.csv', 'utf-8');
    const jobs = parseCsvFile(csvContent);
    
    expect(jobs.length).toBeGreaterThan(0);
    
    const firstJob = jobs[0];
    expect(firstJob).toHaveProperty('id');
    expect(firstJob).toHaveProperty('name');
    expect(firstJob).toHaveProperty('duration');
    expect(firstJob.duration).not.toBeNaN();
  });
});
