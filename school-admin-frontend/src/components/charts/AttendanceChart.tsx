import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AttendanceChartData, ClassAttendanceComparison } from '../../api/dashboard';

interface AttendanceChartProps {
  data?: AttendanceChartData[];
  loading?: boolean;
  timeRange?: '7d' | '30d';
  onTimeRangeChange?: (range: '7d' | '30d') => void;
}

export const AttendanceTrendChart: React.FC<AttendanceChartProps> = ({
  data,
  loading,
  timeRange = '7d',
  onTimeRangeChange,
}) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        暂无数据
      </div>
    );
  }

  return (
    <div>
      {/* Time Range Toggle */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => onTimeRangeChange?.('7d')}
          className={`px-3 py-1 text-sm rounded-l-md border ${
            timeRange === '7d'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          7天
        </button>
        <button
          onClick={() => onTimeRangeChange?.('30d')}
          className={`px-3 py-1 text-sm rounded-r-md border ${
            timeRange === '30d'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          30天
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`${value.toFixed(1)}%`, '出勤率']}
          labelFormatter={(label) => {
            const date = new Date(label);
            return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2 }}
          name="出勤率"
        />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface ClassComparisonChartProps {
  data?: ClassAttendanceComparison[];
  loading?: boolean;
}

export const ClassComparisonChart: React.FC<ClassComparisonChartProps> = ({
  data,
  loading,
}) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        暂无数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="className"
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#64748b"
          tick={{ fill: '#64748b', fontSize: 12 }}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`${value}%`, '']}
        />
        <Legend />
        <Bar
          dataKey="present"
          fill="#3b82f6"
          name="实到"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
