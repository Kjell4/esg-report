import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi, DashboardStats, periodsApi, ApiPeriod } from '../../services/api';
import { Building2, TrendingUp, FileText, Calendar, X, Search, Award } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureChartJs(cb: () => void) {
  if ((window as any).Chart) { cb(); return; }
  const existing = document.querySelector('script[src*="chart.umd"]');
  if (existing) { existing.addEventListener('load', cb); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// ─── Score Distribution Donut ─────────────────────────────────────────────────
function DistributionDonut({ data }: { data: Array<{ range: string; count: number }> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    ensureChartJs(() => {
      if (chartRef.current) chartRef.current.destroy();
      const total = data.reduce((s, d) => s + d.count, 0);
      const Chart = (window as any).Chart;
      chartRef.current = new Chart(ref.current, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.range),
          datasets: [{
            data: data.map(d => d.count),
            backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#22c55e'],
            borderWidth: 0, hoverOffset: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1',
              cornerRadius: 8, padding: 10,
              callbacks: {
                label: (ctx: any) => {
                  const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : '0';
                  return ` ${ctx.raw} компаний (${pct}%)`;
                },
              },
            },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  }, [data]);

  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = ['#ef4444', '#f97316', '#3b82f6', '#22c55e'];

  return (
    <div className="flex items-center gap-6">
      <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        <canvas ref={ref} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-400">компаний</span>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {data.map((d, i) => (
          <div key={d.range} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: colors[i] }} />
            <span className="text-xs text-gray-500 flex-1">{d.range}</span>
            <span className="text-xs font-semibold text-gray-800">{d.count}</span>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${total > 0 ? (d.count / total) * 100 : 0}%`, background: colors[i] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Industry Breakdown Horizontal Bar ───────────────────────────────────────
function IndustryChart({ data }: { data: Array<{ industry: string; e: number; s: number; g: number; total: number }> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    ensureChartJs(() => {
      if (chartRef.current) chartRef.current.destroy();
      const Chart = (window as any).Chart;
      chartRef.current = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.industry),
          datasets: [
            { label: 'E', data: data.map(d => d.e), backgroundColor: '#22c55e', borderRadius: 4, barPercentage: 0.6 },
            { label: 'S', data: data.map(d => d.s), backgroundColor: '#f97316', borderRadius: 4, barPercentage: 0.6 },
            { label: 'G', data: data.map(d => d.g), backgroundColor: '#3b82f6', borderRadius: 4, barPercentage: 0.6 },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', cornerRadius: 8, padding: 10 },
          },
          scales: {
            x: { max: 100, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#6b7280' } },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  }, [data]);

  if (data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Нет отраслевых данных</div>
  );
  const h = Math.max(180, data.length * 44 + 60);
  return <div style={{ position: 'relative', height: h }}><canvas ref={ref} /></div>;
}

// ─── Company Score Bubble ─────────────────────────────────────────────────────
function CompanyBubbleChart({ rankings }: { rankings: DashboardStats['companyRankings'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || !rankings?.length) return;
    ensureChartJs(() => {
      if (chartRef.current) chartRef.current.destroy();
      const top = rankings.slice(0, 20);
      const Chart = (window as any).Chart;
      chartRef.current = new Chart(ref.current, {
        type: 'bubble',
        data: {
          datasets: [{
            label: 'Компании',
            data: top.map(c => ({
              x: c.eScore ?? 0,
              y: c.sScore ?? 0,
              r: Math.max(4, Math.min(14, (c.reportCount ?? 1) * 3)),
              label: c.name,
              total: c.avgScore,
            })),
            backgroundColor: top.map(c => {
              const s = c.avgScore ?? 0;
              if (s >= 75) return '#22c55e88';
              if (s >= 50) return '#3b82f688';
              return '#f9731688';
            }),
            borderColor: top.map(c => {
              const s = c.avgScore ?? 0;
              if (s >= 75) return '#22c55e';
              if (s >= 50) return '#3b82f6';
              return '#f97316';
            }),
            borderWidth: 1.5,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          layout: { padding: 16 },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', cornerRadius: 8, padding: 10,
              callbacks: {
                title: (items: any[]) => items[0].raw.label,
                label: (ctx: any) => [
                  ` E: ${ctx.raw.x?.toFixed(1)}  S: ${ctx.raw.y?.toFixed(1)}`,
                  ` ESG total: ${ctx.raw.total?.toFixed(1)}`,
                ],
              },
            },
          },
          scales: {
            x: { min: 0, max: 110, title: { display: true, text: 'Environmental', font: { size: 11 }, color: '#22c55e' }, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
            y: { min: 0, max: 110, title: { display: true, text: 'Social', font: { size: 11 }, color: '#f97316' }, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  }, [rankings]);

  if (!rankings?.length) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Нет данных компаний</div>
  );
  return (
    <div>
      <div className="flex gap-4 mb-3 text-xs text-gray-400">
        {[{ color: '#22c55e', label: '≥75 (высокий)' }, { color: '#3b82f6', label: '50–74 (средний)' }, { color: '#f97316', label: '<50 (низкий)' }].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
      <div style={{ position: 'relative', height: 280 }}><canvas ref={ref} /></div>
    </div>
  );
}

// ─── Rankings Table ───────────────────────────────────────────────────────────
function RankingsTable({ rankings, search }: {
  rankings: DashboardStats['companyRankings'];
  search: string;
}) {
  const filtered = (rankings ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  const medal = (i: number) =>
    i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;

  const scoreColor = (s: number) =>
    s >= 75 ? 'text-green-600' : s >= 50 ? 'text-blue-600' : 'text-orange-600';

  if (!filtered.length) return (
    <div className="text-center py-8 text-gray-400 text-sm">Нет данных</div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-400">
            <th className="pb-2 text-left font-medium w-8">#</th>
            <th className="pb-2 text-left font-medium">Компания</th>
            <th className="pb-2 text-left font-medium hidden md:table-cell">Отрасль</th>
            <th className="pb-2 text-left font-medium hidden lg:table-cell">Регион</th>
            <th className="pb-2 text-center font-medium text-green-600">E</th>
            <th className="pb-2 text-center font-medium text-orange-600">S</th>
            <th className="pb-2 text-center font-medium text-blue-600">G</th>
            <th className="pb-2 text-right font-medium text-purple-600">Total</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c, i) => (
            <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i < 3 ? 'bg-gradient-to-r from-amber-50/40 to-transparent' : ''}`}>
              <td className="py-2.5 text-base leading-none w-8">{medal(i)}</td>
              <td className="py-2.5 font-medium text-gray-900">{c.name}</td>
              <td className="py-2.5 text-gray-500 hidden md:table-cell text-xs">{c.industry}</td>
              <td className="py-2.5 text-gray-400 hidden lg:table-cell text-xs">{c.region}</td>
              <td className="py-2.5 text-center font-mono text-xs text-green-700">{c.eScore?.toFixed(1) ?? '—'}</td>
              <td className="py-2.5 text-center font-mono text-xs text-orange-700">{c.sScore?.toFixed(1) ?? '—'}</td>
              <td className="py-2.5 text-center font-mono text-xs text-blue-700">{c.gScore?.toFixed(1) ?? '—'}</td>
              <td className="py-2.5 text-right">
                <span className={`text-sm font-bold ${scoreColor(c.avgScore ?? 0)}`}>
                  {c.avgScore?.toFixed(1) ?? '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ViewerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [periods, setPeriods] = useState<ApiPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>();
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => { periodsApi.list().then(setPeriods).catch(console.error); }, []);

  const loadStats = useCallback(async () => {
    if (!loading) setFilterLoading(true);
    try {
      const s = await dashboardApi.stats({
        period: selectedPeriod,
        industry: selectedIndustry || undefined,
        region: selectedRegion || undefined,
      });
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setFilterLoading(false); }
  }, [selectedPeriod, selectedIndustry, selectedRegion]); // eslint-disable-line

  useEffect(() => { loadStats(); }, [loadStats]);

  const rankings = stats.companyRankings ?? [];
  const industries = Array.from(new Set(rankings.map(c => c.industry).filter(Boolean)));
  const regions    = Array.from(new Set(rankings.map(c => c.region).filter(Boolean)));
  const hasFilters = !!(selectedPeriod || selectedIndustry || selectedRegion || search);
  const selectedPeriodName = periods.find(p => p.id === selectedPeriod)?.name;

  const clearFilters = () => {
    setSelectedPeriod(undefined); setSelectedIndustry('');
    setSelectedRegion(''); setSearch('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ESG Обзор</h1>
        <p className="text-gray-500 text-sm mt-0.5">Добро пожаловать, {user?.name}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Фильтры:</span>
          </div>
          <select value={selectedPeriod ?? ''}
            onChange={e => setSelectedPeriod(e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Все периоды</option>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selectedIndustry} onChange={e => setSelectedIndustry(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Все отрасли</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Все регионы</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск компаний..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200">
              <X className="w-3 h-3" /> Сброс
            </button>
          )}
          {filterLoading && <span className="text-xs text-gray-400 animate-pulse">Обновление...</span>}
        </div>
        {/* Active chips */}
        {(selectedPeriodName || selectedIndustry || selectedRegion) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 flex-wrap">
            {selectedPeriodName && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />{selectedPeriodName}
              </span>
            )}
            {selectedIndustry && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">{selectedIndustry}</span>
            )}
            {selectedRegion && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">{selectedRegion}</span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Загрузка...</div>
      ) : (
        <>
          {/* KPI Row */}
          <div className={`grid grid-cols-3 gap-4 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-gray-500">Отчётов сдано</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubmittedReports ?? '—'}</p>
              {selectedPeriodName && <p className="text-xs text-gray-400 mt-1">{selectedPeriodName}</p>}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500">Компаний</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies ?? '—'}</p>
              {selectedIndustry && <p className="text-xs text-gray-400 mt-1">{selectedIndustry}</p>}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500">Средний ESG балл</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.avgEsgScore ?? '—'}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className={`grid grid-cols-2 gap-6 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            {/* Score distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Распределение баллов</h2>
              {(stats.scoreDistribution ?? []).some(d => d.count > 0) ? (
                <DistributionDonut data={stats.scoreDistribution ?? []} />
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Нет данных</div>
              )}
            </div>

            {/* Industry breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">По отраслям</h2>
                <div className="flex gap-3 text-xs text-gray-400">
                  {[{ c: '#22c55e', l: 'E' }, { c: '#f97316', l: 'S' }, { c: '#3b82f6', l: 'G' }].map(x => (
                    <span key={x.l} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: x.c }} />{x.l}
                    </span>
                  ))}
                </div>
              </div>
              <IndustryChart data={stats.industryStats ?? []} />
            </div>
          </div>

          {/* Bubble chart */}
          <div className={`bg-white rounded-2xl border border-gray-100 p-5 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            <h2 className="text-sm font-semibold text-gray-800 mb-1">E vs S — позиция компаний</h2>
            <p className="text-xs text-gray-400 mb-4">Размер пузыря = количество отчётов</p>
            <CompanyBubbleChart rankings={stats.companyRankings} />
          </div>

          {/* Rankings */}
          <div className={`bg-white rounded-2xl border border-gray-100 p-5 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-800">Рейтинг компаний</h2>
              </div>
              <span className="text-xs text-gray-400">{rankings.length} компаний</span>
            </div>
            <RankingsTable rankings={stats.companyRankings} search={search} />
          </div>
        </>
      )}
    </div>
  );
}
