import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  icon,
  action,
  hover = false,
}) => {
  return (
    <div
      className={`
        bg-white
        rounded-xl
        shadow-sm
        border
        border-slate-200
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {(title || icon || action) && (
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <div className="text-slate-600">{icon}</div>}
              {title && (
                <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
              )}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  onClick,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div
      className={`
        bg-white
        rounded-xl
        shadow-sm
        border
        border-slate-200
        p-6
        hover:shadow-md
        transition-shadow
        duration-200
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
          <div className="text-3xl font-bold text-slate-900">{value}</div>
        </div>
        {icon && (
          <div className={`
            p-3
            rounded-lg
            border
            ${colorClasses[color]}
          `}>
            {icon}
          </div>
        )}
      </div>

      {subtitle && <p className="text-sm text-slate-500 mb-2">{subtitle}</p>}

      {trend && (
        <div className="flex items-center gap-1 text-sm">
          <span
            className={`
              flex
              items-center
              gap-0.5
              font-medium
              ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}
            `}
          >
            {trend.direction === 'up' ? '↑' : '↓'}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-slate-500">较昨日</span>
        </div>
      )}
    </div>
  );
};