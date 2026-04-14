// Тесты для хранилища состояния (store)

import { useJobStore } from '../src/store/jobStore';
import * as fs from 'fs';

describe('JobStore - Новая логика анализа', () => {
  beforeEach(() => {
    // Сбрасываем состояние перед каждым тестом
    useJobStore.getState().clearData();
  });

  test('Начальное состояние должно быть пустым', () => {
    const state = useJobStore.getState();
    expect(state.jobs).toEqual([]);
    expect(state.jobNames).toEqual([]);
    expect(state.selectedJob).toBeNull();
    expect(state.jobStatistics).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('loadFile должен загружать и парсить CSV данные', () => {
    const csvContent = fs.readFileSync('/home/z/my-project/upload/OperationLog.csv', 'utf-8');
    
    useJobStore.getState().loadFile(csvContent);
    
    const state = useJobStore.getState();
    
    expect(state.jobs.length).toBeGreaterThan(0);
    expect(state.jobNames.length).toBeGreaterThan(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('selectJob должен устанавливать выбранную джобу и вычислять статистику', () => {
    const csvContent = fs.readFileSync('/home/z/my-project/upload/OperationLog.csv', 'utf-8');
    useJobStore.getState().loadFile(csvContent);
    
    const { jobNames } = useJobStore.getState();
    const firstJob = jobNames[0];
    
    useJobStore.getState().selectJob(firstJob);
    
    const state = useJobStore.getState();
    expect(state.selectedJob).toBe(firstJob);
    expect(state.jobStatistics).not.toBeNull();
    expect(state.jobStatistics?.jobName).toBe(firstJob);
    expect(state.jobStatistics?.dailyMetrics.length).toBeGreaterThan(0);
  });

  test('Статистика должна содержать сравнения метрик', () => {
    const csvContent = fs.readFileSync('/home/z/my-project/upload/OperationLog.csv', 'utf-8');
    useJobStore.getState().loadFile(csvContent);
    
    const { jobNames } = useJobStore.getState();
    useJobStore.getState().selectJob(jobNames[0]);
    
    const state = useJobStore.getState();
    
    expect(state.jobStatistics?.latestDayComparisons).toBeDefined();
    expect(Object.keys(state.jobStatistics?.latestDayComparisons || {}).length).toBeGreaterThan(0);
  });

  test('Статистика должна содержать список доступных метрик', () => {
    const csvContent = fs.readFileSync('/home/z/my-project/upload/OperationLog.csv', 'utf-8');
    useJobStore.getState().loadFile(csvContent);
    
    const { jobNames } = useJobStore.getState();
    useJobStore.getState().selectJob(jobNames[0]);
    
    const state = useJobStore.getState();
    
    expect(state.jobStatistics?.availableMetrics).toBeDefined();
    expect(state.jobStatistics?.availableMetrics.length).toBeGreaterThan(0);
    // Базовые метрики должны быть всегда
    expect(state.jobStatistics?.availableMetrics).toContain('runCount');
    expect(state.jobStatistics?.availableMetrics).toContain('successCount');
  });

  test('Дневные метрики должны иметь правильную структуру', () => {
    const csvContent = fs.readFileSync('/home/z/my-project/upload/OperationLog.csv', 'utf-8');
    useJobStore.getState().loadFile(csvContent);
    
    const { jobNames } = useJobStore.getState();
    useJobStore.getState().selectJob(jobNames[0]);
    
    const state = useJobStore.getState();
    const firstDay = state.jobStatistics?.dailyMetrics[0];
    
    expect(firstDay).toHaveProperty('date');
    expect(firstDay).toHaveProperty('runCount');
    expect(firstDay).toHaveProperty('successCount');
    expect(firstDay).toHaveProperty('errorCount');
    expect(firstDay).toHaveProperty('avgDuration');
    expect(firstDay).toHaveProperty('metrics');
  });

  test('clearData должен очищать все данные', () => {
    const csvContent = fs.readFileSync('/home/z/my-project/upload/OperationLog.csv', 'utf-8');
    useJobStore.getState().loadFile(csvContent);
    useJobStore.getState().selectJob(useJobStore.getState().jobNames[0]);
    
    useJobStore.getState().clearData();
    
    const state = useJobStore.getState();
    expect(state.jobs).toEqual([]);
    expect(state.jobNames).toEqual([]);
    expect(state.selectedJob).toBeNull();
    expect(state.jobStatistics).toBeNull();
  });

  test('selectJob(null) должен сбрасывать выбранную джобу', () => {
    const csvContent = fs.readFileSync('/home/z/my-project/upload/OperationLog.csv', 'utf-8');
    useJobStore.getState().loadFile(csvContent);
    useJobStore.getState().selectJob(useJobStore.getState().jobNames[0]);
    
    useJobStore.getState().selectJob(null);
    
    const state = useJobStore.getState();
    expect(state.selectedJob).toBeNull();
    expect(state.jobStatistics).toBeNull();
  });
});

console.log('Running store tests with new logic...');
