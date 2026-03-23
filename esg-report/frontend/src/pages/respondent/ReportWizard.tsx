import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { questionnairesApi, companiesApi, periodsApi, reportsApi, ApiQuestionnaire, ApiCompany, ApiPeriod, ApiReport, ApiAnswer } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

type Step = 'setup' | 'questions' | 'review';

export function ReportWizard() {
  const { reportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('setup');
  const [questionnaires, setQuestionnaires] = useState<ApiQuestionnaire[]>([]);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [periods, setPeriods] = useState<ApiPeriod[]>([]);
  const [selectedQ, setSelectedQ] = useState<number | ''>('');
  const [selectedCompany, setSelectedCompany] = useState<number | ''>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | ''>('');
  const [report, setReport] = useState<ApiReport | null>(null);
  const [questionnaire, setQuestionnaire] = useState<ApiQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<number, ApiAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      questionnairesApi.list(),
      companiesApi.list(),
      periodsApi.list(),
    ]).then(([qs, cs, ps]) => {
      setQuestionnaires(qs);
      setCompanies(cs);
      setPeriods(ps);
      // If user has a company, pre-select it
      if (user?.companyId) {
        const cid = parseInt(user.companyId);
        if (cs.find(c => c.id === cid)) setSelectedCompany(cid);
      }
    }).catch(e => setError(e.message)).finally(() => setLoading(false));

    if (reportId) {
      reportsApi.get(parseInt(reportId)).then(async r => {
        setReport(r);
        setSelectedQ(r.questionnaire);
        setSelectedCompany(r.company);
        setSelectedPeriod(r.period);
        const [q, existingAnswers] = await Promise.all([
          questionnairesApi.get(r.questionnaire),
          reportsApi.getAnswers(parseInt(reportId)),
        ]);
        setQuestionnaire(q);
        const map: Record<number, ApiAnswer> = {};
        existingAnswers.forEach(a => { map[a.question] = a; });
        setAnswers(map);
        setStep('questions');
      }).catch(e => setError(e.message));
    }
  }, [reportId, user]);

  const handleSetupNext = async () => {
    if (!selectedQ || !selectedCompany || !selectedPeriod) {
      setError('Please select all fields.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const q = await questionnairesApi.get(selectedQ as number);
      setQuestionnaire(q);
      if (!report) {
        const r = await reportsApi.create({
          company: selectedCompany as number,
          questionnaire: selectedQ as number,
          period: selectedPeriod as number,
        });
        setReport(r);
      }
      setStep('questions');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerChange = (questionId: number, field: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], question: questionId, [field]: value },
    }));
  };

  const handleSaveAnswers = async () => {
    if (!report) return;
    setSaving(true);
    try {
      const payload = Object.values(answers);
      await reportsApi.saveAnswers(report.id, payload);
      setStep('review');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!report) return;
    setSubmitting(true);
    try {
      await reportsApi.submit(report.id);
      navigate('/respondent/reports');
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{reportId ? 'Edit Report' : 'New ESG Report'}</h1>
        <div className="flex items-center gap-2 text-sm">
          {(['setup', 'questions', 'review'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <span className={`font-medium ${step === s ? 'text-blue-600' : step > s ? 'text-green-600' : 'text-gray-400'}`}>
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {step === 'setup' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Questionnaire</label>
            <select value={selectedQ} onChange={e => setSelectedQ(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
              <option value="">Select questionnaire...</option>
              {questionnaires.map(q => <option key={q.id} value={q.id}>{q.title} ({q.year})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <select value={selectedCompany} onChange={e => setSelectedCompany(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
              <option value="">Select company...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Period</label>
            <select value={selectedPeriod} onChange={e => setSelectedPeriod(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm">
              <option value="">Select period...</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={handleSetupNext} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {saving ? 'Creating...' : 'Next'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 'questions' && questionnaire && (
        <div className="space-y-6">
          {['E', 'S', 'G'].map(cat => {
            const catQuestions = questionnaire.questions?.filter(q => q.category === cat) ?? [];
            if (catQuestions.length === 0) return null;
            const catLabels: Record<string, string> = { E: '🌿 Environmental', S: '👥 Social', G: '🏛 Governance' };
            return (
              <div key={cat} className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{catLabels[cat]}</h2>
                <div className="space-y-5">
                  {catQuestions.map(q => (
                    <div key={q.id}>
                      <p className="text-sm font-medium text-gray-800 mb-2">
                        {q.text} {q.is_required && <span className="text-red-500">*</span>}
                      </p>
                      {q.question_type === 'text' && (
                        <textarea rows={2} value={answers[q.id]?.text_value ?? ''}
                          onChange={e => handleAnswerChange(q.id, 'text_value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" />
                      )}
                      {q.question_type === 'number' && (
                        <input type="number" value={answers[q.id]?.number_value ?? ''}
                          onChange={e => handleAnswerChange(q.id, 'number_value', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                      )}
                      {q.question_type === 'boolean' && (
                        <div className="flex gap-4">
                          {['yes', 'no'].map(v => (
                            <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="radio" name={`q-${q.id}`} value={v}
                                checked={answers[q.id]?.text_value === v}
                                onChange={() => handleAnswerChange(q.id, 'text_value', v)} />
                              {v.charAt(0).toUpperCase() + v.slice(1)}
                            </label>
                          ))}
                        </div>
                      )}
                      {q.question_type === 'scale' && (
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button key={v} type="button"
                              onClick={() => handleAnswerChange(q.id, 'number_value', v)}
                              className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                                answers[q.id]?.number_value === v
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                      {q.question_type === 'choice' && (
                        <div className="space-y-2">
                          {q.options.map(opt => (
                            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input type="radio" name={`q-${q.id}`} value={opt}
                                checked={answers[q.id]?.text_value === opt}
                                onChange={() => handleAnswerChange(q.id, 'text_value', opt)} />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex gap-3">
            <button onClick={() => setStep('setup')}
              className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleSaveAnswers} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? 'Saving...' : 'Save & Review'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Submit</h2>
          <p className="text-gray-600 mb-6">
            Your answers have been saved. Submit the report when you're ready.
            Once submitted, it cannot be edited.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setStep('questions')}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              Back to Questions
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
