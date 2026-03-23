import React, { useEffect, useState } from 'react';
import { Search, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { reportsApi, ApiReport } from '../../services/api';

export function AdminReports() {
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.list()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s: string) => {
    if (s === 'submitted') return { label: 'Submitted', cls: 'bg-green-100 text-green-700', icon: CheckCircle };
    if (s === 'reviewed') return { label: 'Reviewed', cls: 'bg-purple-100 text-purple-700', icon: CheckCircle };
    return { label: 'Draft', cls: 'bg-gray-100 text-gray-700', icon: Clock };
  };

  const filtered = reports.filter(r => {
    const matchSearch = r.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      r.respondentName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Reports</h1>
        <p className="text-gray-600">Review and manage ESG reports from all companies</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by company or respondent..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading reports...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Respondent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E / S / G</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => {
                const badge = statusBadge(r.status);
                const Icon = badge.icon;
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.companyName}</td>
                    <td className="px-6 py-4 text-gray-600">{r.respondentName}</td>
                    <td className="px-6 py-4 text-gray-600">{r.periodName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                        <Icon className="w-3 h-3" />{badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      {r.eScore != null ? `${r.eScore} / ${r.sScore} / ${r.gScore}` : '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {r.total_score != null ? r.total_score : '—'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No reports found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
