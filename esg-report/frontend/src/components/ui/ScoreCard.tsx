import React from 'react';

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore: number;
  category: 'environmental' | 'social' | 'governance' | 'overall';
  subtitle?: string;
}

export function ScoreCard({ title, score, maxScore, category, subtitle }: ScoreCardProps) {
  const percentage = (score / maxScore) * 100;
  
  const colors = {
    environmental: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      bar: 'bg-green-500',
      text: 'text-green-700',
    },
    social: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      bar: 'bg-orange-500',
      text: 'text-orange-700',
    },
    governance: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      bar: 'bg-blue-500',
      text: 'text-blue-700',
    },
    overall: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      bar: 'bg-purple-500',
      text: 'text-purple-700',
    },
  };

  const color = colors[category];

  return (
    <div className={`${color.bg} ${color.border} border rounded-xl p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className={`text-right ${color.text}`}>
          <p className="text-3xl font-bold">{score}</p>
          <p className="text-sm font-medium">/ {maxScore}</p>
        </div>
      </div>
      <div className="relative h-3 bg-white rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${color.bar} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2">{percentage.toFixed(1)}% complete</p>
    </div>
  );
}
