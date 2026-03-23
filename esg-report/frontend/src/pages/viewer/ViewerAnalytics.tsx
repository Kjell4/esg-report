import React, { useState } from 'react';
import { TrendingUp, Filter, Search } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';

const trendData = [
  { period: 'Q1 2025', environmental: 75, social: 78, governance: 80 },
  { period: 'Q2 2025', environmental: 78, social: 80, governance: 82 },
  { period: 'Q3 2025', environmental: 80, social: 82, governance: 84 },
  { period: 'Q4 2025', environmental: 82, social: 84, governance: 85 },
  { period: 'Q1 2026', environmental: 84, social: 86, governance: 87 },
];

const industryData = [
  { industry: 'Technology', e: 85, s: 88, g: 89 },
  { industry: 'Energy', e: 90, s: 85, g: 87 },
  { industry: 'Finance', e: 82, s: 87, g: 88 },
  { industry: 'Manufacturing', e: 75, s: 78, g: 81 },
  { industry: 'Retail', e: 78, s: 82, g: 80 },
];

const scatterData = [
  { x: 85, y: 88, z: 42, name: 'TechCorp Inc.' },
  { x: 95, y: 90, z: 28, name: 'Green Energy' },
  { x: 82, y: 87, z: 65, name: 'Finance Group' },
  { x: 75, y: 78, z: 38, name: 'Manufacturing Co.' },
  { x: 88, y: 85, z: 52, name: 'Tech Innovators' },
  { x: 79, y: 82, z: 45, name: 'Retail Chain' },
  { x: 92, y: 89, z: 31, name: 'EcoManufacturing' },
];

const regionData = [
  { region: 'North America', score: 84 },
  { region: 'Europe', score: 88 },
  { region: 'Asia Pacific', score: 82 },
  { region: 'Latin America', score: 76 },
  { region: 'Middle East', score: 79 },
  { region: 'Africa', score: 74 },
];

export function ViewerAnalytics() {
  const [timeframe, setTimeframe] = useState('quarterly');
  const [metric, setMetric] = useState('overall');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
        <p className="text-gray-600">Advanced analytics and benchmarking data</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="overall">Overall ESG</option>
            <option value="environmental">Environmental Only</option>
            <option value="social">Social Only</option>
            <option value="governance">Governance Only</option>
          </select>

          <div className="flex-1 relative lg:ml-auto lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <p className="text-sm text-green-700 mb-1">Avg Environmental</p>
          <p className="text-3xl font-bold text-green-600">84</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">+5.2%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
          <p className="text-sm text-orange-700 mb-1">Avg Social</p>
          <p className="text-3xl font-bold text-orange-600">86</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-700">+3.8%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <p className="text-sm text-blue-700 mb-1">Avg Governance</p>
          <p className="text-3xl font-bold text-blue-600">87</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">+4.1%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <p className="text-sm text-purple-700 mb-1">Overall ESG</p>
          <p className="text-3xl font-bold text-purple-600">85.7</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">+4.3%</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trend Analysis */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ESG Score Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 100]} stroke="#666" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="environmental"
                stroke="#10b981"
                strokeWidth={2}
                name="Environmental"
                dot={{ fill: '#10b981', r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="social"
                stroke="#f97316"
                strokeWidth={2}
                name="Social"
                dot={{ fill: '#f97316', r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="governance"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Governance"
                dot={{ fill: '#3b82f6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Industry Comparison */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Industry Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={industryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="industry" stroke="#666" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar dataKey="e" fill="#10b981" name="E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="s" fill="#f97316" name="S" radius={[4, 4, 0, 0]} />
              <Bar dataKey="g" fill="#3b82f6" name="G" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Company Distribution */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Environmental vs Social Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                dataKey="x"
                name="Environmental"
                stroke="#666"
                domain={[70, 100]}
                label={{ value: 'Environmental Score', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Social"
                stroke="#666"
                domain={[70, 100]}
                label={{ value: 'Social Score', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="z" range={[100, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill="#3b82f6">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 50}, 70%, 60%)`} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Performance */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Regional Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} stroke="#666" />
              <YAxis type="category" dataKey="region" stroke="#666" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                {regionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.score >= 85 ? '#10b981' : entry.score >= 80 ? '#3b82f6' : '#f97316'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Top Performer</h3>
          <p className="text-3xl font-bold text-green-600 mb-2">Europe</p>
          <p className="text-sm text-gray-600">
            Leading region with an average ESG score of 88, driven by strong environmental policies.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Best Industry</h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">Energy</p>
          <p className="text-sm text-gray-600">
            Renewable energy sector shows highest environmental scores with an average of 90.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Growth Leader</h3>
          <p className="text-3xl font-bold text-orange-600 mb-2">+5.2%</p>
          <p className="text-sm text-gray-600">
            Environmental scores show the strongest quarterly growth across all metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
