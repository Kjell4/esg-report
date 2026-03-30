import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Filter, Search, Calendar, X } from 'lucide-react';
import { dashboardApi, periodsApi, ApiPeriod, DashboardStats } from '../../services/api';

function ensureChartJs(cb: () => void) {
  if ((window as any).Chart) { cb(); return; }
  const existing = document.querySelector('script[src*="chart.umd"]');
  if (existing) { existing.addEventListener('load', cb); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
  s.onload = cb;
  document.head.appendChild(s);
}

function TrendLineChart({ data }: { data: DashboardStats['trendData'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    ensureChartJs(() => {
      if (chartRef.current) chartRef.current.destroy();
      const Chart = (window as any).Chart;
      chartRef.current = new Chart(ref.current, {
        type: 'line',
        data: {
          labels: data.map(d => d.period),
          datasets: [
            { label: 'E', data: data.map(d => d.e), borderColor: '#22c55e', backgroundColor: '#22c55e15', borderWidth: 2, pointRadius: 4, tension: 0.4, fill: true },
            { label: 'S', data: data.map(d => d.s), borderColor: '#f97316', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 4, tension: 0.4 },
            { label: 'G', data: data.map(d => d.g), borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 4, tension: 0.4 },
            { label: 'Total', data: data.map(d => d.total), borderColor: '#8b5cf6', backgroundColor: 'transparent', borderWidth: 2.5, pointRadius: 5, tension: 0.4, borderDash: [5, 3] },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', cornerRadius: 8, padding: 10 } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
            y: { min: 0, max: 100, grid: { color: '#f8fafc' }, ticks: { font: { size: 11 }, color: '#94a3b8', stepSize: 25 } },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  }, [data]);
  if (!data?.length) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Нет данных</div>;
  return <div style={{ position: 'relative', height: 260 }}><canvas ref={ref} /></div>;
}

function IndustryBarChart({ data }: { data: DashboardStats['industryStats'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    ensureChartJs(() => {
      if (chartRef.current) chartRef.current.destroy();
      const Chart = (window as any).Chart;
      chartRef.current = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.industry),
          datasets: [
            { label: 'E', data: data.map(d => d.e), backgroundColor: '#22c55e', borderRadius: 4, barPercentage: 0.65 },
            { label: 'S', data: data.map(d => d.s), backgroundColor: '#f97316', borderRadius: 4, barPercentage: 0.65 },
            { label: 'G', data: data.map(d => d.g), backgroundColor: '#3b82f6', borderRadius: 4, barPercentage: 0.65 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', cornerRadius: 8, padding: 10 } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8', maxRotation: 25 } },
            y: { min: 0, max: 100, grid: { color: '#f8fafc' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  }, [data]);
  if (!data?.length) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Нет отраслевых данных</div>;
  return <div style={{ position: 'relative', height: 260 }}><canvas ref={ref} /></div>;
}

function ScatterChart({ rankings }: { rankings: DashboardStats['companyRankings'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  useEffect(() => {
    if (!ref.current || !rankings?.length) return;
    ensureChartJs(() => {
      if (chartRef.current) chartRef.current.destroy();
      const Chart = (window as any).Chart;
      chartRef.current = new Chart(ref.current, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Компании',
            data: rankings.slice(0, 30).map(c => ({ x: c.eScore ?? 0, y: c.sScore ?? 0, label: c.name, g: c.gScore, total: c.avgScore })),
            backgroundColor: rankings.slice(0, 30).map((c, i) => `hsl(${(i * 37) % 360},60%,58%)`),
            pointRadius: 8, pointHoverRadius: 10,
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
                label: (ctx: any) => [` E: ${ctx.raw.x?.toFixed(1)}  S: ${ctx.raw.y?.toFixed(1)}  G: ${ctx.raw.g?.toFixed(1)}`, ` ESG: ${ctx.raw.total?.toFixed(1)}`],
              },
            },
          },
          scales: {
            x: { min: 0, max: 110, title: { display: true, text: 'Environmental', font: { size: 11 }, color: '#22c55e' }, grid: { color: '#f8fafc' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
            y: { min: 0, max: 110, title: { display: true, text: 'Social', font: { size: 11 }, color: '#f97316' }, grid: { color: '#f8fafc' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  }, [rankings]);
  if (!rankings?.length) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Нет данных</div>;
  return <div style={{ position: 'relative', height: 260 }}><canvas ref={ref} /></div>;
}

function DistributionBarChart({ data }: { data: DashboardStats['scoreDistribution'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    ensureChartJs(() => {
      if (chartRef.current) chartRef.current.destroy();
      const Chart = (window as any).Chart;
      chartRef.current = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.range),
          datasets: [{
            data: data.map(d => d.count),
            backgroundColor: ['#ef444488', '#f9731688', '#3b82f688', '#22c55e88'],
            borderColor: ['#ef4444', '#f97316', '#3b82f6', '#22c55e'],
            borderWidth: 1.5, borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', cornerRadius: 8, padding: 10, callbacks: { label: (ctx: any) => ` ${ctx.raw} компаний` } } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12 }, color: '#6b7280' } },
            y: { grid: { color: '#f8fafc' }, ticks: { font: { size: 11 }, color: '#94a3b8', precision: 0 } },
          },
        },
      });
    });
    return () => { chartRef.current?.destroy(); };
  }, [data]);
  if (!data?.length) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Нет данных</div>;
  return <div style={{ position: 'relative', height: 260 }}><canvas ref={ref} /></div>;
}

export function ViewerAnalytics() {
  const [periods, setPeriods] = useState<ApiPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>();
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => { periodsApi.list().then(setPeriods).catch(console.error); }, []);

  const loadStats = useCallback(async () => {
    if (!loading) setFilterLoading(true);
    try {
      const s = await dashboardApi.stats({ period: selectedPeriod, industry: selectedIndustry || undefined, region: selectedRegion || undefined });
      setStats(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setFilterLoading(false); }
  }, [selectedPeriod, selectedIndustry, selectedRegion]); // eslint-disable-line

  useEffect(() => { loadStats(); }, [loadStats]);

  const rankings = stats?.companyRankings ?? [];
  const industries = Array.from(new Set(rankings.map(c => c.industry).filter(Boolean)));
  const regions    = Array.from(new Set(rankings.map(c => c.region).filter(Boolean)));

  const filteredRankings = rankings.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const industryData = stats?.industryStats ?? [];
  const avgE = industryData.length ? Math.round(industryData.reduce((s, d) => s + d.e, 0) / industryData.length) : null;
  const avgS = industryData.length ? Math.round(industryData.reduce((s, d) => s + d.s, 0) / industryData.length) : null;
  const avgG = industryData.length ? Math.round(industryData.reduce((s, d) => s + d.g, 0) / industryData.length) : null;

  const selectedPeriodName = periods.find(p => p.id === selectedPeriod)?.name;
  const hasFilters = !!(selectedPeriod || selectedIndustry || selectedRegion || search);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Аналитика и инсайты</h1>
        <p className="text-gray-500 text-sm mt-0.5">Углублённая аналитика и бенчмарки</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">Фильтры:</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <select value={selectedPeriod ?? ''} onChange={e => setSelectedPeriod(e.target.value ? parseInt(e.target.value) : undefined)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Все периоды</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
          {hasFilters && (
            <button onClick={() => { setSelectedPeriod(undefined); setSelectedIndustry(''); setSelectedRegion(''); setSearch(''); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200">
              <X className="w-3 h-3" /> Сброс
            </button>
          )}
          {filterLoading && <span className="text-xs text-gray-400 animate-pulse">Обновление...</span>}
        </div>
        {(selectedPeriodName || selectedIndustry || selectedRegion) && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 flex-wrap">
            {selectedPeriodName && <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1"><Calendar className="w-3 h-3" />{selectedPeriodName}</span>}
            {selectedIndustry && <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">{selectedIndustry}</span>}
            {selectedRegion && <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">{selectedRegion}</span>}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Загрузка аналитики...</div>
      ) : (
        <>
          {/* KPI */}
          <div className={`grid grid-cols-4 gap-4 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            {[
              { label: 'Avg Environmental', value: avgE, color: 'text-green-600', bg: 'from-green-50 to-green-100 border-green-200' },
              { label: 'Avg Social',         value: avgS, color: 'text-orange-600', bg: 'from-orange-50 to-orange-100 border-orange-200' },
              { label: 'Avg Governance',     value: avgG, color: 'text-blue-600', bg: 'from-blue-50 to-blue-100 border-blue-200' },
              { label: 'Overall ESG',   value: stats?.avgEsgScore != null ? Math.round(stats.avgEsgScore) : null, color: 'text-purple-600', bg: 'from-purple-50 to-purple-100 border-purple-200' },
            ].map(k => (
              <div key={k.label} className={`bg-gradient-to-br ${k.bg} border rounded-2xl p-5`}>
                <p className="text-xs text-gray-500 mb-2">{k.label}</p>
                <p className={`text-3xl font-bold ${k.color}`}>{k.value ?? '—'}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className={`w-3.5 h-3.5 ${k.color}`} />
                  <span className={`text-xs ${k.color}`}>средний балл</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts 2×2 */}
          <div className={`grid grid-cols-2 gap-6 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Тренды ESG по периодам</h2>
                <div className="flex gap-3 text-xs text-gray-400">
                  {[{ c: '#22c55e', l: 'E' }, { c: '#f97316', l: 'S' }, { c: '#3b82f6', l: 'G' }, { c: '#8b5cf6', l: 'Total' }].map(x => (
                    <span key={x.l} className="flex items-center gap-1">
                      <span className="w-3 h-0.5 inline-block rounded" style={{ background: x.c }} />{x.l}
                    </span>
                  ))}
                </div>
              </div>
              <TrendLineChart data={stats?.trendData} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Разбивка по отраслям</h2>
                <div className="flex gap-3 text-xs text-gray-400">
                  {[{ c: '#22c55e', l: 'E' }, { c: '#f97316', l: 'S' }, { c: '#3b82f6', l: 'G' }].map(x => (
                    <span key={x.l} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: x.c }} />{x.l}
                    </span>
                  ))}
                </div>
              </div>
              <IndustryBarChart data={stats?.industryStats} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-1">E vs S позиция компаний</h2>
              <p className="text-xs text-gray-400 mb-4">Наведите на точку для деталей</p>
              <ScatterChart rankings={filteredRankings} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Распределение ESG баллов</h2>
              <DistributionBarChart data={stats?.scoreDistribution} />
            </div>
          </div>

          {/* Rankings table */}
          {filteredRankings.length > 0 && (
            <div className={`bg-white rounded-2xl border border-gray-100 p-5 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-800">Все компании</h2>
                <span className="text-xs text-gray-400">{filteredRankings.length} компаний</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400">
                      <th className="pb-2 text-left w-8">#</th>
                      <th className="pb-2 text-left">Компания</th>
                      <th className="pb-2 text-left hidden md:table-cell">Отрасль</th>
                      <th className="pb-2 text-left hidden lg:table-cell">Регион</th>
                      <th className="pb-2 text-center text-green-600">E</th>
                      <th className="pb-2 text-center text-orange-600">S</th>
                      <th className="pb-2 text-center text-blue-600">G</th>
                      <th className="pb-2 text-right text-purple-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRankings.map((c, i) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-2.5 font-medium text-gray-900">{c.name}</td>
                        <td className="py-2.5 text-gray-500 text-xs hidden md:table-cell">{c.industry}</td>
                        <td className="py-2.5 text-gray-400 text-xs hidden lg:table-cell">{c.region}</td>
                        <td className="py-2.5 text-center font-mono text-xs text-green-700">{c.eScore?.toFixed(1) ?? '—'}</td>
                        <td className="py-2.5 text-center font-mono text-xs text-orange-700">{c.sScore?.toFixed(1) ?? '—'}</td>
                        <td className="py-2.5 text-center font-mono text-xs text-blue-700">{c.gScore?.toFixed(1) ?? '—'}</td>
                        <td className="py-2.5 text-right font-bold text-gray-900">{c.avgScore?.toFixed(1) ?? '—'}</td>
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
