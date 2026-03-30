import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Filter, Search, Calendar, X } from 'lucide-react';
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
  Cell,
} from 'recharts';
import { dashboardApi, periodsApi, ApiPeriod, DashboardStats } from '../../services/api';

export function ViewerAnalytics() {
  const [periods, setPeriods] = useState<ApiPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>(undefined);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  // Load periods
  useEffect(() => {
    periodsApi.list().then(setPeriods).catch(console.error);
  }, []);

  // Reload stats when filters change
  const loadStats = useCallback(async () => {
    const isInitial = loading;
    if (!isInitial) setFilterLoading(true);
    try {
      const s = await dashboardApi.stats({
        period:   selectedPeriod,
        industry: selectedIndustry || undefined,
        region:   selectedRegion || undefined,
      });
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, [selectedPeriod, selectedIndustry, selectedRegion]); // eslint-disable-line

  useEffect(() => { loadStats(); }, [loadStats]);

  // Derive display data from API stats (fall back to empty arrays if not loaded)
  const industryData = (stats?.industryStats ?? []).map(d => ({
    industry: d.industry,
    e: d.e, s: d.s, g: d.g,
  }));

  const trendData = (stats?.trendData ?? []).map(d => ({
    period: d.period,
    environmental: d.e,
    social: d.s,
    governance: d.g,
  }));

  const companyRankings = stats?.companyRankings ?? [];

  // Scatter from rankings
  const scatterData = companyRankings.slice(0, 10).map(c => ({
    x: c.eScore, y: c.sScore, z: c.reportCount, name: c.name,
  }));

  // Derived metrics
  const avgE = industryData.length
    ? Math.round(industryData.reduce((s, d) => s + d.e, 0) / industryData.length)
    : stats?.avgEsgScore ?? null;
  const avgS = industryData.length
    ? Math.round(industryData.reduce((s, d) => s + d.s, 0) / industryData.length)
    : null;
  const avgG = industryData.length
    ? Math.round(industryData.reduce((s, d) => s + d.g, 0) / industryData.length)
    : null;

  // Unique industries/regions for filter dropdowns
  const industries = Array.from(new Set(companyRankings.map(c => c.industry))).filter(Boolean);
  const regions    = Array.from(new Set(companyRankings.map(c => c.region))).filter(Boolean);

  // Filtered rankings table
  const filteredRankings = companyRankings.filter(c => {
    if (selectedIndustry && c.industry !== selectedIndustry) return false;
    if (selectedRegion && c.region !== selectedRegion) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedPeriodName = periods.find(p => p.id === selectedPeriod)?.name;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
        <p className="text-gray-600">Advanced analytics and benchmarking data</p>
      </div>

      {/* ── 5.2 Фильтры, включая период ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Period filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPeriod ?? ''}
              onChange={(e) => setSelectedPeriod(e.target.value ? parseInt(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Все периоды</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Industry filter */}
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Industries</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>

          {/* Region filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Search */}
          <div className="flex-1 relative lg:ml-auto lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Active filter badges + clear */}
          {(selectedPeriod || selectedIndustry || selectedRegion || search) && (
            <button
              onClick={() => { setSelectedPeriod(undefined); setSelectedIndustry(''); setSelectedRegion(''); setSearch(''); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 border border-gray-200"
            >
              <X className="w-3 h-3" /> Сбросить
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {(selectedPeriodName || selectedIndustry || selectedRegion) && (
          <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-100">
            {selectedPeriodName && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                <Calendar className="w-3 h-3" /> {selectedPeriodName}
              </span>
            )}
            {selectedIndustry && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                {selectedIndustry}
              </span>
            )}
            {selectedRegion && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                {selectedRegion}
              </span>
            )}
            {filterLoading && <span className="text-xs text-gray-400 animate-pulse ml-1">Обновление...</span>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-24 text-gray-400">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
              <p className="text-sm text-green-700 mb-1">Avg Environmental</p>
              <p className="text-3xl font-bold text-green-600">{avgE ?? '—'}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700">E score</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
              <p className="text-sm text-orange-700 mb-1">Avg Social</p>
              <p className="text-3xl font-bold text-orange-600">{avgS ?? '—'}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-orange-700">S score</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <p className="text-sm text-blue-700 mb-1">Avg Governance</p>
              <p className="text-3xl font-bold text-blue-600">{avgG ?? '—'}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-700">G score</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
              <p className="text-sm text-purple-700 mb-1">Overall ESG</p>
              <p className="text-3xl font-bold text-purple-600">{stats?.avgEsgScore ?? '—'}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-purple-700">Avg score</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            {/* Trend */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ESG Score Trends</h2>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="period" stroke="#666" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} stroke="#666" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="environmental" stroke="#10b981" strokeWidth={2} name="Environmental" dot={{ fill: '#10b981', r: 5 }} />
                    <Line type="monotone" dataKey="social" stroke="#f97316" strokeWidth={2} name="Social" dot={{ fill: '#f97316', r: 5 }} />
                    <Line type="monotone" dataKey="governance" stroke="#3b82f6" strokeWidth={2} name="Governance" dot={{ fill: '#3b82f6', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                  Нет данных о трендах
                </div>
              )}
            </div>

            {/* Industry Breakdown */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Industry Breakdown</h2>
              {industryData.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                  Нет отраслевых данных
                </div>
              )}
            </div>

            {/* E vs S scatter */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental vs Social Performance</h2>
              {scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" dataKey="x" name="Environmental" stroke="#666" domain={[0, 100]}
                      label={{ value: 'Environmental Score', position: 'insideBottom', offset: -5 }} />
                    <YAxis type="number" dataKey="y" name="Social" stroke="#666" domain={[0, 100]}
                      label={{ value: 'Social Score', angle: -90, position: 'insideLeft' }} />
                    <ZAxis type="number" dataKey="z" range={[60, 300]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                      if (!payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-xs">
                          <p className="font-medium">{d.name}</p>
                          <p>E: {d.x} · S: {d.y}</p>
                          <p>{d.z} reports</p>
                        </div>
                      );
                    }} />
                    <Scatter data={scatterData} fill="#3b82f6">
                      {scatterData.map((_, i) => (
                        <Cell key={i} fill={`hsl(${i * 40}, 65%, 55%)`} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                  Нет данных компаний
                </div>
              )}
            </div>

            {/* Score distribution */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h2>
              {(stats?.scoreDistribution ?? []).length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats!.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" stroke="#666" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#666" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Companies">
                      {(stats!.scoreDistribution ?? []).map((_, i) => (
                        <Cell key={i} fill={`hsl(${210 + i * 15}, 65%, ${65 - i * 5}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
                  Нет данных о распределении
                </div>
              )}
            </div>
          </div>

          {/* Company Rankings Table */}
          {filteredRankings.length > 0 && (
            <div className={`bg-white rounded-xl border border-gray-200 p-6 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Company Rankings</h2>
                <span className="text-sm text-gray-400">{filteredRankings.length} companies</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Company</th>
                      <th className="pb-3 font-medium">Industry</th>
                      <th className="pb-3 font-medium">Region</th>
                      <th className="pb-3 font-medium text-green-600">E</th>
                      <th className="pb-3 font-medium text-orange-600">S</th>
                      <th className="pb-3 font-medium text-blue-600">G</th>
                      <th className="pb-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRankings.map((c, i) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-2.5 font-medium text-gray-900">{c.name}</td>
                        <td className="py-2.5 text-gray-500">{c.industry}</td>
                        <td className="py-2.5 text-gray-500">{c.region}</td>
                        <td className="py-2.5 text-green-700 font-mono">{c.eScore?.toFixed(1)}</td>
                        <td className="py-2.5 text-orange-700 font-mono">{c.sScore?.toFixed(1)}</td>
                        <td className="py-2.5 text-blue-700 font-mono">{c.gScore?.toFixed(1)}</td>
                        <td className="py-2.5 font-semibold text-gray-900">{c.avgScore?.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
