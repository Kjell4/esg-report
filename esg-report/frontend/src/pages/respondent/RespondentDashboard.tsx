import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { ScoreCard } from '../../components/ui/ScoreCard';
import { dashboardApi, DashboardStats, reportsApi, ApiReport } from '../../services/api';
import { FileText, Plus, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';

export function RespondentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentReports, setRecentReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardApi.stats(), reportsApi.list()])
      .then(([s, reports]) => {
        setStats(s);
        setRecentReports(reports.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => {
    if (s === 'submitted') return 'bg-green-100 text-green-700';
    if (s === 'draft') return 'bg-gray-100 text-gray-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}. {user?.companyName && `— ${user.companyName}`}</p>
        </div>
        <button
          onClick={() => navigate('/respondent/report/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Report
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Total Reports</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalReports ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">Drafts</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.draftReports ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Latest ESG Score</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.latestScore ?? '—'}</p>
            </div>
          </div>

          {stats.latestScore != null && (
            <div className="grid grid-cols-3 gap-6 mb-8">
              <ScoreCard
                title="Environmental"
                score={stats.latestEScore ?? 0}
                maxScore={100}
                category="environmental"
              />
              <ScoreCard
                title="Social"
                score={stats.latestSScore ?? 0}
                maxScore={100}
                category="social"
              />
              <ScoreCard
                title="Governance"
                score={stats.latestGScore ?? 0}
                maxScore={100}
                category="governance"
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
              <button onClick={() => navigate('/respondent/reports')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {recentReports.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No reports yet. Create your first report!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.questionnaireName}</p>
                      <p className="text-xs text-gray-500">{r.periodName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                        {r.status}
                      </span>
                      {r.total_score != null && (
                        <span className="text-sm font-semibold text-gray-900">{r.total_score}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
