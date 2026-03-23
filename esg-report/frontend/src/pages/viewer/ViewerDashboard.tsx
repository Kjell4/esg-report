import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardApi, DashboardStats, reportsApi, ApiReport } from '../../services/api';
import { FileText, Building2, TrendingUp } from 'lucide-react';

export function ViewerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.stats(), reportsApi.list()])
      .then(([s, r]) => { setStats(s); setReports(r.slice(0, 8)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ESG Overview</h1>
        <p className="text-gray-600">Welcome, {user?.name}. Viewing platform-wide ESG data.</p>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2"><FileText className="w-5 h-5 text-blue-600" /><span className="text-sm text-gray-600">Submitted Reports</span></div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubmittedReports ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2"><Building2 className="w-5 h-5 text-green-600" /><span className="text-sm text-gray-600">Companies</span></div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2"><TrendingUp className="w-5 h-5 text-purple-600" /><span className="text-sm text-gray-600">Avg ESG Score</span></div>
              <p className="text-3xl font-bold text-gray-900">{stats.avgEsgScore ?? '—'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h2>
            {reports.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No submitted reports yet.</p>
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
                      <tr key={r.id} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-900">{r.companyName}</td>
                        <td className="py-3 text-gray-600">{r.periodName}</td>
                        <td className="py-3 text-gray-500 font-mono text-xs">
                          {r.eScore != null ? `${r.eScore?.toFixed(0)} / ${r.sScore?.toFixed(0)} / ${r.gScore?.toFixed(0)}` : '—'}
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
