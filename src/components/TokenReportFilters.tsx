'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter, X, RotateCcw } from 'lucide-react';
import { TokenReportFilters as TokenReportFiltersType } from '@/lib/tokenReportTypes';

interface TokenReportFiltersProps {
  filters: TokenReportFiltersType;
  uniqueValues: {
    names: string[];
    providers: string[];
    models: string[];
    configTypes: string[];
  };
  onFiltersChange: (filters: Partial<TokenReportFiltersType>) => void;
  onReset: () => void;
}

export function TokenReportFiltersComponent({
  filters,
  uniqueValues,
  onFiltersChange,
  onReset,
}: TokenReportFiltersProps) {
  const hasActiveFilters = 
    filters.periodStart !== null ||
    filters.periodEnd !== null ||
    filters.name !== null ||
    filters.provider !== null ||
    filters.modelName !== null ||
    filters.configType !== null ||
    filters.onlyWithTokens;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Фильтры отчёта
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Сбросить
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Период */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">С (дата)</Label>
            <Input
              type="date"
              value={filters.periodStart || ''}
              onChange={(e) => onFiltersChange({ 
                periodStart: e.target.value || null 
              })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">По (дата)</Label>
            <Input
              type="date"
              value={filters.periodEnd || ''}
              onChange={(e) => onFiltersChange({ 
                periodEnd: e.target.value || null 
              })}
              className="h-9"
            />
          </div>
        </div>

        {/* Фильтры в ряд */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Джоба */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Джоба</Label>
            <Select
              value={filters.name || 'all'}
              onValueChange={(value) => onFiltersChange({ name: value === 'all' ? null : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {uniqueValues.names.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Провайдер */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Провайдер</Label>
            <Select
              value={filters.provider || 'all'}
              onValueChange={(value) => onFiltersChange({ provider: value === 'all' ? null : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {uniqueValues.providers.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Модель */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Модель</Label>
            <Select
              value={filters.modelName || 'all'}
              onValueChange={(value) => onFiltersChange({ modelName: value === 'all' ? null : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {uniqueValues.models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ConfigType */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Config Type</Label>
            <Select
              value={filters.configType || 'all'}
              onValueChange={(value) => onFiltersChange({ configType: value === 'all' ? null : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {uniqueValues.configTypes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Чекбоксы */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="only-tokens"
              checked={filters.onlyWithTokens}
              onCheckedChange={(checked) => onFiltersChange({ onlyWithTokens: checked === true })}
            />
            <Label htmlFor="only-tokens" className="text-sm cursor-pointer">
              Только записи с токенами &gt; 0
            </Label>
          </div>
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">Активные:</span>
            {filters.periodStart && (
              <Badge variant="secondary" className="text-xs">
                С: {filters.periodStart}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ periodStart: null })}
                />
              </Badge>
            )}
            {filters.periodEnd && (
              <Badge variant="secondary" className="text-xs">
                По: {filters.periodEnd}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ periodEnd: null })}
                />
              </Badge>
            )}
            {filters.name && (
              <Badge variant="secondary" className="text-xs">
                Джоба: {filters.name}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ name: null })}
                />
              </Badge>
            )}
            {filters.provider && (
              <Badge variant="secondary" className="text-xs">
                Провайдер: {filters.provider}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ provider: null })}
                />
              </Badge>
            )}
            {filters.modelName && (
              <Badge variant="secondary" className="text-xs">
                Модель: {filters.modelName}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ modelName: null })}
                />
              </Badge>
            )}
            {filters.configType && (
              <Badge variant="secondary" className="text-xs">
                Config: {filters.configType}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ configType: null })}
                />
              </Badge>
            )}
            {filters.onlyWithTokens && (
              <Badge variant="secondary" className="text-xs">
                С токенами &gt; 0
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => onFiltersChange({ onlyWithTokens: false })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
