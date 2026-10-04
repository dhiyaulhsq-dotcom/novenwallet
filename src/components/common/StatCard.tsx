import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: {
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
    isGoodWhenUp?: boolean;
  };
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  subtitle,
  icon,
  variant = 'default',
}) => {
  const isPositive = trend?.trend === 'up';
  const isNegative = trend?.trend === 'down';
  const isGoodWhenUp = trend?.isGoodWhenUp ?? true;

  // Good vs Bad logic
  let trendColor = 'text-slate-500 dark:text-slate-400';
  if (trend) {
    if (isPositive) {
      trendColor = isGoodWhenUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
    } else if (isNegative) {
      trendColor = isGoodWhenUp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
    }
  }

  const borderStyles = {
    default: 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
    primary: 'border-teal-200/60 dark:border-teal-900/40 bg-teal-50/20 dark:bg-slate-900',
    success: 'border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-slate-900',
    danger: 'border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-slate-900',
  };

  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-150 ${borderStyles[variant]} shadow-xs hover:shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        {icon && (
          <div className="text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}
        </h4>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        {trend && (
          <span className={`inline-flex items-center font-medium ${trendColor} tabular-nums`}>
            {isPositive && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {isNegative && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3 mr-0.5" />}
            {Math.abs(trend.percentage).toFixed(1)}%
          </span>
        )}
        {trend && <span className="text-slate-400 dark:text-slate-600">·</span>}
        <span className="text-slate-500 dark:text-slate-400 truncate">
          {trend?.label || subtitle || 'vs periode lalu'}
        </span>
      </div>
    </div>
  );
};
