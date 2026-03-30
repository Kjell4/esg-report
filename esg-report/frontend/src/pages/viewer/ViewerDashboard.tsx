import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi, DashboardStats, reportsApi, ApiReport, periodsApi, ApiPeriod } from '../../services/api';
import { FileText, Building2, TrendingUp, Calendar, X } from 'lucide-react';

export function ViewerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [periods, setPeriods] = useState<ApiPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  // Load periods once
  useEffect(() => {
    periodsApi.list()
      .then(setPeriods)
      .catch(console.error);
  }, []);

  // Load stats + reports whenever period changes
  const loadData = useCallback(async (periodId?: number) => {
    const isFirst = loading;
    if (!isFirst) setFilterLoading(true);
    try {
      const [s, r] = await Promise.all([
        dashboardApi.stats(periodId ? { period: periodId } : undefined),
        reportsApi.list(periodId ? { period: periodId } : undefined),
      ]);
      setStats(s);
      setReports(r.slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod]); // eslint-disable-line

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPeriod(val ? parseInt(val) : undefined);
  };

  const clearPeriod = () => setSelectedPeriod(undefined);

  const selectedPeriodName = periods.find(p => p.id === selectedPeriod)?.name;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ESG Overview</h1>
        <p className="text-gray-600">Welcome, {user?.name}. Viewing platform-wide ESG data.</p>
      </div>

      {/* ── 5.2 Фильтр по периоду ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Период:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod ?? ''}
            onChange={handlePeriodChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            <option value="">Все периоды</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {selectedPeriod && (
            <button
              onClick={clearPeriod}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-3 h-3" /> Сбросить
            </button>
          )}
        </div>

        {selectedPeriodName && (
          <span className="ml-auto text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
            {selectedPeriodName}
          </span>
        )}

        {filterLoading && (
          <span className="text-xs text-gray-400 animate-pulse ml-1">Обновление...</span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`bg-white rounded-xl border border-gray-200 p-6 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Submitted Reports</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubmittedReports ?? '—'}</p>
              {selectedPeriodName && (
                <p className="text-xs text-gray-400 mt-1">{selectedPeriodName}</p>
              )}
            </div>
            <div className={`bg-white rounded-xl border border-gray-200 p-6 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Companies</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies ?? '—'}</p>
            </div>
            <div className={`bg-white rounded-xl border border-gray-200 p-6 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Avg ESG Score</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.avgEsgScore ?? '—'}</p>
              {selectedPeriodName && (
                <p className="text-xs text-gray-400 mt-1">{selectedPeriodName}</p>
              )}
            </div>
          </div>

          <div className={`bg-white rounded-xl border border-gray-200 p-6 transition-opacity ${filterLoading ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
              {selectedPeriodName && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {selectedPeriodName}
                </span>
              )}
            </div>
            {reports.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                {selectedPeriod ? 'Нет отчётов за выбранный период.' : 'No submitted reports yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">Company</th>
                      <th className="pb-3 font-medium">Period</th>
                      <th className="pb-3 font-medium">E / S / G</th>
                      <th className="pb-3 font-medium">Total Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">{r.companyName}</td>
                        <td className="py-3 text-gray-600">{r.periodName}</td>
                        <td className="py-3 text-gray-500 font-mono text-xs">
                          {r.eScore != null
                            ? `${r.eScore?.toFixed(0)} / ${r.sScore?.toFixed(0)} / ${r.gScore?.toFixed(0)}`
                            : '—'}
                        </td>
                        <td className="py-3 font-semibold text-gray-900">{r.total_score ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
