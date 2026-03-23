import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { reportsApi, ApiReport } from '../../services/api';

export function ViewerReports() {
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.list().then(setReports).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r =>
    r.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    r.periodName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ESG Reports</h1>
        <p className="text-gray-600">Browse all submitted ESG reports</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by company or period..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-1">{r.companyName}</h3>
              <p className="text-xs text-gray-500 mb-4">{r.periodName} · {r.questionnaireName}</p>
              {r.total_score != null ? (
                <div className="grid grid-cols-3 gap-2">
                  {[['E', r.eScore, 'green'], ['S', r.sScore, 'blue'], ['G', r.gScore, 'purple']].map(([k, v, c]) => (
                    <div key={k as string} className={`text-center bg-${c as string}-50 rounded-lg py-2`}>
                      <p className={`text-xs text-${c as string}-600 font-medium`}>{k as string}</p>
                      <p className={`text-lg font-bold text-${c as string}-700`}>{(v as number)?.toFixed(0) ?? '—'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">No scores yet</p>
              )}
              {r.total_score != null && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <span className="text-sm text-gray-500">Total Score: </span>
                  <span className="text-xl font-bold text-gray-900">{r.total_score}</span>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">No reports found.</div>
          )}
        </div>
      )}
    </div>
  );
}
