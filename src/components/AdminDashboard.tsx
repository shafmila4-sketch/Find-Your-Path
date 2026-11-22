import {
  AlertTriangle,
  Download,
  Filter,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEMO_PREVIEW_SUBMISSIONS } from '../data/demoPreviewData';
import {
  Q7_CONDITIONAL_MAP,
  SURVEY_QUESTIONS,
  type SurveyAnswers,
  type SurveySubmissionRecord,
} from '../data/surveySchema';
import { type ChartDatum, DonutChart, HorizontalBarChart, VerticalBarChart } from './Charts';

interface AdminDashboardProps {
  token: string | null;
  onTokenChange: (token: string | null) => void;
}

interface AuthStatus {
  configured: boolean;
  needsBootstrap: boolean;
  source: 'env' | 'claimed' | 'none';
}

type AnalyticsTab = 'all' | 'demographics' | 'awareness' | 'engagement' | 'perspectives';

function countByQuestionOption(
  records: SurveySubmissionRecord[],
  questionId: keyof SurveyAnswers
): ChartDatum[] {
  const question = SURVEY_QUESTIONS.find((q) => q.id === questionId);
  const counts = new Map<string, number>();

  if (question?.options) {
    for (const opt of question.options) {
      counts.set(opt.value, 0);
    }
  }

  for (const r of records) {
    const val = r[questionId];
    if (typeof val === 'string' && val.length > 0) {
      counts.set(val, (counts.get(val) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

function topCategoryLabel(data: ChartDatum[]): string {
  if (data.length === 0) return '—';
  const sorted = [...data].sort((a, b) => b.count - a.count);
  if (sorted[0].count === 0) return '—';
  return `${sorted[0].label} (${sorted[0].count})`;
}

export function AdminDashboard({ token, onTokenChange }: AdminDashboardProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submittingAuth, setSubmittingAuth] = useState(false);

  const [responses, setResponses] = useState<SurveySubmissionRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Strictly isolated data mode: 'live' (default) vs 'demo' preview
  const [dataMode, setDataMode] = useState<'live' | 'demo'>('live');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('all');

  // Interactive dashboard filters
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [ageFilter, setAgeFilter] = useState<string>('ALL');
  const [fieldFilter, setFieldFilter] = useState<string>('ALL');

  const fetchAuthStatus = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/auth-status');
      const data = (await res.json()) as AuthStatus;
      setAuthStatus(data);
    } catch {
      setAuthError('Unable to check administrator authentication status.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const fetchLiveResponses = useCallback(
    async (authToken: string) => {
      setLoadingData(true);
      setDataError(null);
      try {
        const res = await fetch('/api/admin/responses', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.status === 401) {
          onTokenChange(null);
          setDataError('Your administrator session expired. Please sign in again.');
          return;
        }
        const data = (await res.json()) as {
          responses?: SurveySubmissionRecord[];
          error?: string;
        };
        if (!res.ok) {
          setDataError(data.error || 'Failed to load survey responses.');
          return;
        }
        setResponses(Array.isArray(data.responses) ? data.responses : []);
      } catch {
        setDataError('Network error while loading research responses.');
      } finally {
        setLoadingData(false);
      }
    },
    [onTokenChange]
  );

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  useEffect(() => {
    if (token) {
      fetchLiveResponses(token);
    }
  }, [token, fetchLiveResponses]);

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passcodeInput.trim().length < 8) {
      setAuthError('Passcode must be at least 8 characters long.');
      return;
    }
    if (passcodeInput !== confirmPasscodeInput) {
      setAuthError('Passcodes do not match.');
      return;
    }

    setSubmittingAuth(true);
    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput.trim() }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Unable to set administrator passcode.');
        await fetchAuthStatus();
        return;
      }
      setPasscodeInput('');
      setConfirmPasscodeInput('');
      onTokenChange(data.token);
      await fetchAuthStatus();
    } catch {
      setAuthError('Network error while configuring administrator passcode.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passcodeInput.trim()) {
      setAuthError('Please enter the administrator passcode.');
      return;
    }

    setSubmittingAuth(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcodeInput.trim() }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Invalid administrator passcode.');
        return;
      }
      setPasscodeInput('');
      onTokenChange(data.token);
    } catch {
      setAuthError('Network error while signing in.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleExportCsv = async () => {
    if (!token || dataMode !== 'live') return;
    setExportingCsv(true);
    setDataError(null);
    try {
      const res = await fetch('/api/admin/export.csv', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onTokenChange(null);
        return;
      }
      if (!res.ok) {
        setDataError('Failed to export CSV.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `find-your-path-responses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDataError('Failed to download CSV export.');
    } finally {
      setExportingCsv(false);
    }
  };

  // Source dataset strictly isolated between live DB responses and demo preview
  const activeBaseDataset = dataMode === 'demo' ? DEMO_PREVIEW_SUBMISSIONS : responses;

  const filteredRecords = useMemo(() => {
    return activeBaseDataset.filter((r) => {
      if (areaFilter !== 'ALL' && r.q4 !== areaFilter) return false;
      if (ageFilter !== 'ALL' && r.q1 !== ageFilter) return false;
      if (fieldFilter !== 'ALL' && r.q6 !== fieldFilter) return false;
      return true;
    });
  }, [activeBaseDataset, areaFilter, ageFilter, fieldFilter]);

  const totalCount = filteredRecords.length;

  // Aggregations
  const ageData = useMemo(() => countByQuestionOption(filteredRecords, 'q1'), [filteredRecords]);
  const genderData = useMemo(() => countByQuestionOption(filteredRecords, 'q2'), [filteredRecords]);
  const areaData = useMemo(() => countByQuestionOption(filteredRecords, 'q4'), [filteredRecords]);
  const statusData = useMemo(() => countByQuestionOption(filteredRecords, 'q5'), [filteredRecords]);
  const fieldData = useMemo(() => countByQuestionOption(filteredRecords, 'q6'), [filteredRecords]);

  const districtData = useMemo(() => {
    const map = new Map<string, { display: string; count: number }>();
    for (const r of filteredRecords) {
      const clean = r.q3.trim();
      const key = clean.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { display: clean, count: 1 });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .map((item) => ({ label: item.display, count: item.count }));
  }, [filteredRecords]);

  const q7Breakdown = useMemo(() => {
    const categories = Object.values(Q7_CONDITIONAL_MAP).map((sub) => {
      const matching = filteredRecords.filter((r) => r.q7SubId === sub.subId);
      const options: ChartDatum[] = sub.options.map((opt) => ({
        label: opt.value === sub.correctValue ? `${opt.en} (Expected)` : opt.en,
        count: matching.filter((r) => r.q7 === opt.value).length,
        highlight: opt.value === sub.correctValue,
      }));
      return {
        subId: sub.subId,
        fieldValue: sub.fieldValue,
        titleEn: sub.titleEn,
        total: matching.length,
        options,
      };
    });
    const otherSkippedCount = filteredRecords.filter((r) => r.q6 === 'Other').length;
    return { categories, otherSkippedCount };
  }, [filteredRecords]);

  const q8Data = useMemo(() => countByQuestionOption(filteredRecords, 'q8'), [filteredRecords]);
  const q9Data = useMemo(() => countByQuestionOption(filteredRecords, 'q9'), [filteredRecords]);
  const q10Data = useMemo(() => countByQuestionOption(filteredRecords, 'q10'), [filteredRecords]);
  const q11Data = useMemo(() => countByQuestionOption(filteredRecords, 'q11'), [filteredRecords]);
  const q12Data = useMemo(() => countByQuestionOption(filteredRecords, 'q12'), [filteredRecords]);
  const q13Data = useMemo(() => countByQuestionOption(filteredRecords, 'q13'), [filteredRecords]);
  const q14Data = useMemo(() => countByQuestionOption(filteredRecords, 'q14'), [filteredRecords]);
  const q15Data = useMemo(() => countByQuestionOption(filteredRecords, 'q15'), [filteredRecords]);
  const q16Data = useMemo(() => countByQuestionOption(filteredRecords, 'q16'), [filteredRecords]);
  const q17Data = useMemo(() => countByQuestionOption(filteredRecords, 'q17'), [filteredRecords]);
  const q18Data = useMemo(() => countByQuestionOption(filteredRecords, 'q18'), [filteredRecords]);
  const q19Data = useMemo(() => countByQuestionOption(filteredRecords, 'q19'), [filteredRecords]);
  const q20Data = useMemo(() => countByQuestionOption(filteredRecords, 'q20'), [filteredRecords]);

  // Unauthenticated gate: Admin Login or First-Run Setup
  if (!token) {
    return (
      <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#EAF2FF] via-[#F8FBFF] to-white py-14 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-7 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#0B1D3A] flex items-center justify-center">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>

          {authLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking administrator access...</span>
            </div>
          ) : authStatus?.needsBootstrap ? (
            <form onSubmit={handleBootstrap} className="mt-5">
              <h1 className="font-display text-xl font-bold text-[#0B1D3A]">
                Set Up Administrator Access
              </h1>
              <p className="font-ml text-xs text-slate-600 mt-1">
                അഡ്മിൻ ഡാഷ്‌ബോർഡ് സുരക്ഷിതമാക്കാൻ ഒരു പാസ്‌കോഡ് നൽകുക
              </p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Create the initial administrator passcode to protect survey analytics and CSV
                exports. Only authorized researchers with this passcode can view submissions.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="bootstrap-passcode"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    New Administrator Passcode (min. 8 characters)
                  </label>
                  <input
                    id="bootstrap-passcode"
                    type="password"
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Enter strong passcode"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-[#0B1D3A] focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bootstrap-confirm"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Confirm Passcode
                  </label>
                  <input
                    id="bootstrap-confirm"
                    type="password"
                    value={confirmPasscodeInput}
                    onChange={(e) => setConfirmPasscodeInput(e.target.value)}
                    placeholder="Re-enter passcode"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-[#0B1D3A] focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                </div>
              </div>

              {authError && (
                <p className="mt-4 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingAuth}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] hover:from-[#122C59] hover:to-[#2563EB] text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {submittingAuth ? 'Saving Passcode...' : 'Claim Admin Access & Open Dashboard'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="mt-5">
              <h1 className="font-display text-xl font-bold text-[#0B1D3A]">
                Administrator Sign In
              </h1>
              <p className="font-ml text-xs text-slate-600 mt-1">
                അഡ്മിൻ ഡാഷ്‌ബോർഡിലേക്ക് പ്രവേശിക്കുക
              </p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Public respondents cannot view individual submissions or research analytics. Enter
                the administrator passcode to continue.
              </p>

              <div className="mt-5">
                <label
                  htmlFor="admin-passcode"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Administrator Passcode
                </label>
                <input
                  id="admin-passcode"
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter passcode"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-[#0B1D3A] focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                />
              </div>

              {authError && (
                <p className="mt-4 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingAuth}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] hover:from-[#122C59] hover:to-[#2563EB] text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {submittingAuth ? 'Verifying...' : 'Sign In to Analytics Dashboard'}
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  const showSection = (section: AnalyticsTab) => activeTab === 'all' || activeTab === section;

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#F8FBFF] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Top Bar */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Authorized Research Analytics</span>
            </div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#0B1D3A] tracking-tight">
              Find Your Path — Analytics Dashboard
            </h1>
            <p className="font-ml text-xs text-slate-500 mt-1">
              ഗവേഷണ സർവേ വിവരങ്ങളുടെ തത്സമയ വിശകലനവും CSV എക്സ്പോർട്ടും
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Strictly separated Live vs Demo Preview mode toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/70">
              <button
                type="button"
                onClick={() => setDataMode('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  dataMode === 'live'
                    ? 'bg-white text-[#0B1D3A] shadow-sm'
                    : 'text-slate-600 hover:text-[#0B1D3A]'
                }`}
              >
                Live Research Data ({responses.length})
              </button>
              <button
                type="button"
                onClick={() => setDataMode('demo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  dataMode === 'demo'
                    ? 'bg-amber-100 text-amber-950 shadow-sm'
                    : 'text-slate-600 hover:text-[#0B1D3A]'
                }`}
              >
                Preview Demo Data
              </button>
            </div>

            <button
              type="button"
              onClick={() => fetchLiveResponses(token)}
              disabled={loadingData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exportingCsv || dataMode !== 'live' || responses.length === 0}
              title={
                dataMode !== 'live'
                  ? 'Switch to Live Research Data to export actual submissions'
                  : 'Export all actual survey submissions as CSV'
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] hover:from-[#122C59] hover:to-[#2563EB] text-white text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            <button
              type="button"
              onClick={() => onTokenChange(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Unmistakable DEMO DATA isolation notice */}
        {dataMode === 'demo' && (
          <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 sm:p-5 flex items-start gap-3 text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold tracking-tight">
                DEMO DATA PREVIEW — Illustrative Sample Dataset Only
              </p>
              <p className="text-xs text-amber-900 mt-1">
                You are currently viewing separated sample DEMO DATA for dashboard layout preview.
                These records are not stored in the research database, never mix with actual
                submissions, and CSV export is disabled in demo mode. Switch back to{' '}
                <strong>Live Research Data</strong> to view real respondent submissions.
              </p>
            </div>
          </div>
        )}

        {dataError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {dataError}
          </div>
        )}

        {/* Filter Bar + Section Tabs */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'All Analytics' },
                { id: 'demographics', label: 'Demographics (Q1–Q5)' },
                { id: 'awareness', label: 'Career Awareness (Q6–Q10)' },
                { id: 'engagement', label: 'Engagement (Q11–Q15)' },
                { id: 'perspectives', label: 'Perspectives (Q16–Q20)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#0B1D3A] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Filter:</span>
            </span>

            <select
              aria-label="Filter by area type"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="ALL">All Areas</option>
              <option value="Urban">Urban</option>
              <option value="Rural">Rural</option>
              <option value="Semi-urban">Semi-urban</option>
            </select>

            <select
              aria-label="Filter by age group"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="ALL">All Age Groups</option>
              <option value="15–19 years">15–19 years</option>
              <option value="20–24 years">20–24 years</option>
              <option value="25–29 years">25–29 years</option>
              <option value="30 years and above">30 years and above</option>
            </select>

            <select
              aria-label="Filter by career interest"
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="ALL">All Career Fields</option>
              <option value="Science and Healthcare">Science and Healthcare</option>
              <option value="Technology and IT">Technology and IT</option>
              <option value="Commerce and Finance">Commerce and Finance</option>
              <option value="Teaching and Education">Teaching and Education</option>
              <option value="Government Sector">Government Sector</option>
              <option value="Arts and Humanities">Arts and Humanities</option>
              <option value="Other">Other</option>
            </select>

            {(areaFilter !== 'ALL' || ageFilter !== 'ALL' || fieldFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setAreaFilter('ALL');
                  setAgeFilter('ALL');
                  setFieldFilter('ALL');
                }}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Empty State for Live Data when 0 responses yet */}
        {dataMode === 'live' && !loadingData && responses.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200/90 p-10 text-center">
            <h2 className="font-display text-xl font-bold text-[#0B1D3A]">
              No Live Survey Submissions Recorded Yet
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
              Real respondent submissions will appear here immediately as participants complete the
              survey. We never fabricate or insert fake records into the database. You can also
              inspect the dashboard charts using the separated{' '}
              <strong>Preview Demo Data</strong> toggle above.
            </p>
            <button
              type="button"
              onClick={() => setDataMode('demo')}
              className="mt-5 px-5 py-2.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Switch to Demo Data Preview
            </button>
          </div>
        ) : (
          <>
            {/* Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#0B1D3A] to-[#1D4ED8] text-white p-5">
                <p className="text-xs font-medium text-blue-100">
                  {dataMode === 'demo' ? 'Demo Sample Size' : 'Total Responses'}
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold tabular-nums">
                  {totalCount}
                </p>
                <p className="mt-1 text-xs text-blue-200 tabular-nums">
                  of {activeBaseDataset.length} stored
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
                <p className="text-xs font-medium text-slate-500">Top Age Distribution</p>
                <p className="mt-2 font-display text-base font-bold text-[#0B1D3A] leading-snug">
                  {topCategoryLabel(ageData)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Question 1</p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
                <p className="text-xs font-medium text-slate-500">Top Education / Status</p>
                <p className="mt-2 font-display text-base font-bold text-[#0B1D3A] leading-snug">
                  {topCategoryLabel(statusData)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Question 5</p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
                <p className="text-xs font-medium text-slate-500">Districts Represented</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-[#0B1D3A] tabular-nums">
                  {districtData.length}
                </p>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  Top: {topCategoryLabel(districtData)}
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200/90 p-5">
                <p className="text-xs font-medium text-slate-500">Top Career Interest</p>
                <p className="mt-2 font-display text-base font-bold text-[#0B1D3A] leading-snug">
                  {topCategoryLabel(fieldData)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Question 6</p>
              </div>
            </div>

            {/* Section 1: Demographic Analytics */}
            {showSection('demographics') && (
              <div className="space-y-4">
                <div className="pt-2">
                  <h2 className="font-display text-xl font-bold text-[#0B1D3A]">
                    Demographic Analytics (Q1–Q5)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Age groups, gender, districts, area type, and educational/employment status.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VerticalBarChart
                    title="Q1. Age Group Distribution"
                    subtitle="Age brackets across respondents"
                    data={ageData}
                    total={totalCount}
                  />
                  <DonutChart
                    title="Q2. Gender Distribution"
                    subtitle="Self-reported gender breakdown"
                    data={genderData}
                    total={totalCount}
                  />
                  <HorizontalBarChart
                    title="Q3. District Distribution"
                    subtitle="Respondent-entered districts (case-normalized)"
                    data={districtData}
                    total={totalCount}
                  />
                  <DonutChart
                    title="Q4. Residential Area Type"
                    subtitle="Urban, rural, and semi-urban distribution"
                    data={areaData}
                    total={totalCount}
                  />
                </div>
                <HorizontalBarChart
                  title="Q5. Current Educational or Employment Status"
                  subtitle="Distribution across school, higher education, job seekers, and employed participants"
                  data={statusData}
                  total={totalCount}
                />
              </div>
            )}

            {/* Section 2: Career Awareness Analytics */}
            {showSection('awareness') && (
              <div className="space-y-4">
                <div className="pt-2">
                  <h2 className="font-display text-xl font-bold text-[#0B1D3A]">
                    Career Awareness & Conditional Knowledge Analytics (Q6–Q10)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Preferred career fields, Question 7 subquestions (A–F), qualification
                    awareness, non-traditional familiarity, and choice influences.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <HorizontalBarChart
                    title="Q6. Preferred Career Field"
                    subtitle="Primary career field respondents want to explore"
                    data={fieldData}
                    total={totalCount}
                  />
                  <HorizontalBarChart
                    title="Q10. Main Factor Influencing Career Choice"
                    subtitle="Primary motivators behind career selection"
                    data={q10Data}
                    total={totalCount}
                  />
                </div>

                {/* Question 7 Conditional Subquestions Breakdown */}
                <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-display text-base font-bold text-[#0B1D3A]">
                        Q7. Conditional Career Knowledge Responses (Subquestions A–F)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Each category reflects only respondents who selected the matching career
                        field in Question 6.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-slate-600 tabular-nums">
                      &ldquo;Other&rdquo; (No Q7): {q7Breakdown.otherSkippedCount}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {q7Breakdown.categories.map((cat) => (
                      <div
                        key={cat.subId}
                        className="rounded-xl border border-slate-200 bg-[#F8FBFF] p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono font-bold text-blue-700">
                              Subquestion {cat.subId}
                            </span>
                            <span className="font-mono tabular-nums text-slate-600">
                              n = {cat.total}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm font-semibold text-[#0B1D3A] leading-snug">
                            {cat.titleEn}
                          </p>
                        </div>

                        <div className="mt-4 space-y-2.5">
                          {cat.options.map((opt) => {
                            const pct =
                              cat.total > 0 ? Math.round((opt.count / cat.total) * 100) : 0;
                            return (
                              <div key={opt.label}>
                                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                                  <span
                                    className={
                                      opt.highlight
                                        ? 'font-semibold text-blue-900'
                                        : 'text-slate-700'
                                    }
                                  >
                                    {opt.label}
                                  </span>
                                  <span className="font-mono tabular-nums text-slate-600 shrink-0">
                                    {opt.count} ({pct}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${opt.count === 0 ? 0 : Math.max(4, pct)}%`,
                                      backgroundColor: opt.highlight ? '#1D4ED8' : '#64748B',
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VerticalBarChart
                    title="Q8. Awareness of Required Qualifications & Skills"
                    data={q8Data}
                    total={totalCount}
                  />
                  <VerticalBarChart
                    title="Q9. Familiarity Beyond Traditional Professions"
                    data={q9Data}
                    total={totalCount}
                  />
                </div>
              </div>
            )}

            {/* Section 3: Respondent Engagement Analytics */}
            {showSection('engagement') && (
              <div className="space-y-4">
                <div className="pt-2">
                  <h2 className="font-display text-xl font-bold text-[#0B1D3A]">
                    Respondent Engagement Analytics (Q11–Q15)
                  </h2>
                  <p className="text-xs text-slate-500">
                    School-level career familiarity, information channels, guidance access, and
                    missed opportunities.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VerticalBarChart
                    title="Q11. Career Familiarity During School Days"
                    data={q11Data}
                    total={totalCount}
                  />
                  <HorizontalBarChart
                    title="Q12. Usual Sources of Career Information"
                    data={q12Data}
                    total={totalCount}
                  />
                  <VerticalBarChart
                    title="Q13. Frequency of Career Discussions at School"
                    data={q13Data}
                    total={totalCount}
                  />
                  <DonutChart
                    title="Q14. Received Personalised Career Guidance"
                    data={q14Data}
                    total={totalCount}
                  />
                </div>

                <DonutChart
                  title="Q15. Missed or Delayed Opportunity Due to Lack of Information"
                  data={q15Data}
                  total={totalCount}
                />
              </div>
            )}

            {/* Section 4: Career Perspectives & Expectations */}
            {showSection('perspectives') && (
              <div className="space-y-4">
                <div className="pt-2">
                  <h2 className="font-display text-xl font-bold text-[#0B1D3A]">
                    Career Perspectives & Platform Expectations (Q16–Q20)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Challenges faced, parental influence, helpful support, desired features, and
                    willingness to adopt a career platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <HorizontalBarChart
                    title="Q16. Biggest Challenge in Choosing a Career"
                    data={q16Data}
                    total={totalCount}
                  />
                  <VerticalBarChart
                    title="Q17. Parental / Family Influence on Career Decisions"
                    data={q17Data}
                    total={totalCount}
                  />
                  <HorizontalBarChart
                    title="Q18. Most Helpful Type of Support"
                    data={q18Data}
                    total={totalCount}
                  />
                  <HorizontalBarChart
                    title="Q19. Most Useful Career Platform Features"
                    data={q19Data}
                    total={totalCount}
                  />
                </div>

                <VerticalBarChart
                  title="Q20. Willingness to Use a Personalised Career Guidance Platform"
                  data={q20Data}
                  total={totalCount}
                />
              </div>
            )}

            {/* Recent Anonymous Submissions Table */}
            <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-[#0B1D3A]">
                    Submitted Anonymous Responses ({filteredRecords.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dataMode === 'demo'
                      ? 'Showing isolated DEMO DATA records'
                      : 'Showing central database submissions (newest first)'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4 whitespace-nowrap">Submitted</th>
                      <th className="py-3 px-4 whitespace-nowrap">Age (Q1)</th>
                      <th className="py-3 px-4 whitespace-nowrap">District (Q3)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Area (Q4)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status (Q5)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Field (Q6)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Q7 Sub / Answer</th>
                      <th className="py-3 px-4 whitespace-nowrap">Platform Use (Q20)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {new Date(r.submittedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-800 whitespace-nowrap">{r.q1}</td>
                        <td className="py-3 px-4 font-medium text-[#0B1D3A] whitespace-nowrap">
                          {r.q3}
                        </td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{r.q4}</td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{r.q5}</td>
                        <td className="py-3 px-4 text-slate-800 whitespace-nowrap">{r.q6}</td>
                        <td className="py-3 px-4 text-slate-800 whitespace-nowrap">
                          {r.q7SubId ? (
                            <span>
                              <strong className="font-mono text-blue-700 mr-1.5">
                                {r.q7SubId}:
                              </strong>
                              {r.q7}
                            </span>
                          ) : (
                            <span className="text-slate-400">N/A (Other)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-800 whitespace-nowrap">{r.q20}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
