import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  Loader2,
  Send,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  EMPTY_SURVEY_ANSWERS,
  Q7_CONDITIONAL_MAP,
  SURVEY_QUESTIONS,
  SURVEY_SECTIONS,
  type SurveyAnswers,
  type SurveyQuestion,
} from '../data/surveySchema';

interface SurveyViewProps {
  onSubmitted: () => void;
}

const DRAFT_STORAGE_KEY = 'fyp_survey_draft_v1';

function loadDraft(): SurveyAnswers {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return EMPTY_SURVEY_ANSWERS;
    const parsed = JSON.parse(raw) as Partial<SurveyAnswers>;
    return { ...EMPTY_SURVEY_ANSWERS, ...parsed };
  } catch {
    return EMPTY_SURVEY_ANSWERS;
  }
}

export function SurveyView({ onSubmitted }: SurveyViewProps) {
  const [answers, setAnswers] = useState<SurveyAnswers>(() => loadDraft());
  const [step, setStep] = useState<number>(1); // 1..4 sections, 5 = review
  const [missingIds, setMissingIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Ignore storage quota errors
    }
  }, [answers]);

  const currentSection = useMemo(
    () => SURVEY_SECTIONS.find((s) => s.id === step) ?? null,
    [step]
  );

  const sectionQuestions = useMemo(
    () => SURVEY_QUESTIONS.filter((q) => q.sectionId === step),
    [step]
  );

  const totalRequiredCount = answers.q6 === 'Other' ? 19 : 20;

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const q of SURVEY_QUESTIONS) {
      if (q.id === 'q7') {
        if (answers.q6 && answers.q6 !== 'Other' && answers.q7) {
          count += 1;
        }
      } else if (q.id === 'q3') {
        if (answers.q3.trim().length >= 2) count += 1;
      } else {
        const val = answers[q.id];
        if (typeof val === 'string' && val.length > 0) count += 1;
      }
    }
    return count;
  }, [answers]);

  const progressPercent =
    step === 5 ? 100 : Math.round((answeredCount / totalRequiredCount) * 100);

  const handleRadioSelect = (questionId: keyof SurveyAnswers, value: string) => {
    setMissingIds((prev) => prev.filter((id) => id !== questionId));
    setSubmitError(null);

    if (questionId === 'q6') {
      const nextSub = Q7_CONDITIONAL_MAP[value];
      setAnswers((prev) => ({
        ...prev,
        q6: value,
        q7SubId: nextSub ? nextSub.subId : null,
        q7: null,
      }));
      return;
    }

    if (questionId === 'q7') {
      const cond = Q7_CONDITIONAL_MAP[answers.q6];
      setAnswers((prev) => ({
        ...prev,
        q7SubId: cond ? cond.subId : null,
        q7: value,
      }));
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleDistrictChange = (value: string) => {
    setMissingIds((prev) => prev.filter((id) => id !== 'q3'));
    setSubmitError(null);
    setAnswers((prev) => ({ ...prev, q3: value }));
  };

  const validateSection = (sectionNumber: number): string[] => {
    const qs = SURVEY_QUESTIONS.filter((q) => q.sectionId === sectionNumber);
    const missing: string[] = [];

    for (const q of qs) {
      if (q.id === 'q3') {
        if (answers.q3.trim().length < 2) {
          missing.push('q3');
        }
      } else if (q.id === 'q7') {
        if (answers.q6 && answers.q6 !== 'Other' && !answers.q7) {
          missing.push('q7');
        } else if (!answers.q6) {
          missing.push('q7');
        }
      } else {
        const val = answers[q.id];
        if (!val) {
          missing.push(q.id);
        }
      }
    }
    return missing;
  };

  const scrollToTopOrElement = (elementId?: string) => {
    if (elementId) {
      const el = document.getElementById(`question-card-${elementId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    const missing = validateSection(step);
    if (missing.length > 0) {
      setMissingIds(missing);
      scrollToTopOrElement(missing[0]);
      return;
    }
    setMissingIds([]);
    setStep((prev) => Math.min(5, prev + 1));
    scrollToTopOrElement();
  };

  const handleBack = () => {
    setMissingIds([]);
    setSubmitError(null);
    setStep((prev) => Math.max(1, prev - 1));
    scrollToTopOrElement();
  };

  const handleJumpToSection = (targetSection: number) => {
    setMissingIds([]);
    setSubmitError(null);
    setStep(targetSection);
    scrollToTopOrElement();
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    for (let s = 1; s <= 4; s += 1) {
      const missing = validateSection(s);
      if (missing.length > 0) {
        setStep(s);
        setMissingIds(missing);
        setTimeout(() => scrollToTopOrElement(missing[0]), 60);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          q3: answers.q3.trim(),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setSubmitError(data.error || 'Could not save your survey response. Please try again.');
        return;
      }

      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore storage error
      }
      onSubmitted();
    } catch {
      setSubmitError('Network error while submitting your response. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderConditionalQ7 = (question: SurveyQuestion) => {
    const isMissing = missingIds.includes('q7');
    const selectedField = answers.q6;
    const subquestion = selectedField ? Q7_CONDITIONAL_MAP[selectedField] : undefined;

    return (
      <div
        key={question.id}
        id="question-card-q7"
        className={`rounded-2xl bg-white border p-5 sm:p-7 transition-colors ${
          isMissing ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200/90'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
              Question 7
            </span>
            {subquestion ? (
              <>
                <h3 className="mt-1.5 font-display text-lg font-semibold text-[#0B1D3A] leading-snug">
                  {subquestion.titleEn}
                </h3>
                <p className="mt-1.5 font-ml text-[15px] text-slate-600 leading-relaxed">
                  {subquestion.titleMl}
                </p>
              </>
            ) : selectedField === 'Other' ? (
              <>
                <h3 className="mt-1.5 font-display text-lg font-semibold text-[#0B1D3A] leading-snug">
                  Field-specific knowledge question not applicable
                </h3>
                <p className="mt-1.5 font-ml text-[15px] text-slate-600 leading-relaxed">
                  നിങ്ങൾ ചോദ്യം 6-ൽ "Other (മറ്റുള്ളവ)" തിരഞ്ഞെടുത്തതിനാൽ ഈ ചോദ്യം ബാധകമല്ല.
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-1.5 font-display text-lg font-semibold text-[#0B1D3A] leading-snug">
                  {question.en}
                </h3>
                <p className="mt-1.5 font-ml text-[15px] text-slate-600 leading-relaxed">
                  {question.ml}
                </p>
              </>
            )}
          </div>
        </div>

        {!selectedField && (
          <div className="mt-5 rounded-xl bg-blue-50/70 border border-blue-200/80 p-4 text-sm text-blue-900">
            <p className="font-medium">
              Please select your preferred career field in Question 6 above to display the matching
              Question 7 subquestion.
            </p>
            <p className="font-ml text-xs text-blue-800 mt-1">
              ചോദ്യം 7 കാണുന്നതിനായി ദയവായി മുകളിലെ ചോദ്യം 6-ൽ ഒരു കരിയർ മേഖല തിരഞ്ഞെടുക്കുക.
            </p>
          </div>
        )}

        {selectedField === 'Other' && (
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">
              No field-specific subquestion applies for &ldquo;Other&rdquo;. Please continue to
              Question 8 below.
            </p>
            <p className="font-ml text-xs text-slate-600 mt-1">
              &ldquo;മറ്റുള്ളവ&rdquo; തിരഞ്ഞെടുത്തതിനാൽ പ്രത്യേക മേഖല ചോദ്യം ബാധകമല്ല. ദയവായി ചോദ്യം
              8-ലേക്ക് തുടരുക.
            </p>
          </div>
        )}

        {subquestion && (
          <div className="mt-5 space-y-3" role="radiogroup" aria-label={subquestion.titleEn}>
            {subquestion.options.map((opt) => {
              const selected = answers.q7 === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3.5 rounded-xl border p-4 cursor-pointer transition-all ${
                    selected
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="q7"
                    value={opt.value}
                    checked={selected}
                    onChange={() => handleRadioSelect('q7', opt.value)}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium text-[#0B1D3A] leading-snug">
                      {opt.en}
                    </span>
                    <span className="block font-ml text-sm text-slate-600 mt-0.5 leading-snug">
                      {opt.ml}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {isMissing && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Please answer Question 7 before continuing. · തുടരുന്നതിന് മുൻപ് ചോദ്യം 7-ന് ഉത്തരം നൽകുക.
            </span>
          </p>
        )}
      </div>
    );
  };

  const renderQuestion = (question: SurveyQuestion) => {
    if (question.type === 'conditional-q7') {
      return renderConditionalQ7(question);
    }

    const isMissing = missingIds.includes(question.id);

    if (question.type === 'text') {
      return (
        <div
          key={question.id}
          id={`question-card-${question.id}`}
          className={`rounded-2xl bg-white border p-5 sm:p-7 transition-colors ${
            isMissing ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200/90'
          }`}
        >
          <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
            Question {question.number}
          </span>
          <label
            htmlFor="input-q3-district"
            className="block mt-1.5 font-display text-lg font-semibold text-[#0B1D3A] leading-snug"
          >
            {question.en}
          </label>
          <p className="mt-1.5 font-ml text-[15px] text-slate-600 leading-relaxed">
            {question.ml}
          </p>

          <div className="mt-5">
            <input
              id="input-q3-district"
              type="text"
              value={answers.q3}
              onChange={(e) => handleDistrictChange(e.target.value)}
              placeholder={`${question.placeholderEn} / ${question.placeholderMl}`}
              maxLength={120}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-[15px] text-[#0B1D3A] placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
            />
          </div>

          {isMissing && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Please enter your district name. · ദയവായി നിങ്ങളുടെ ജില്ലയുടെ പേര് നൽകുക.
              </span>
            </p>
          )}
        </div>
      );
    }

    const selectedValue = answers[question.id] as string;

    return (
      <div
        key={question.id}
        id={`question-card-${question.id}`}
        className={`rounded-2xl bg-white border p-5 sm:p-7 transition-colors ${
          isMissing ? 'border-red-400 ring-1 ring-red-200' : 'border-slate-200/90'
        }`}
      >
        <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
          Question {question.number}
        </span>
        <h3 className="mt-1.5 font-display text-lg font-semibold text-[#0B1D3A] leading-snug">
          {question.en}
        </h3>
        <p className="mt-1.5 font-ml text-[15px] text-slate-600 leading-relaxed">
          {question.ml}
        </p>

        <div className="mt-5 space-y-3" role="radiogroup" aria-label={question.en}>
          {question.options?.map((opt) => {
            const selected = selectedValue === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3.5 rounded-xl border p-4 cursor-pointer transition-all ${
                  selected
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/60'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value}
                  checked={selected}
                  onChange={() => handleRadioSelect(question.id, opt.value)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium text-[#0B1D3A] leading-snug">
                    {opt.en}
                  </span>
                  <span className="block font-ml text-sm text-slate-600 mt-0.5 leading-snug">
                    {opt.ml}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {isMissing && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Please select an option to continue. · തുടരുന്നതിന് ഒരു ഉത്തരം തിരഞ്ഞെടുക്കുക.
            </span>
          </p>
        )}
      </div>
    );
  };

  const renderAnswerOptionLabel = (question: SurveyQuestion, rawVal: string | null) => {
    if (question.id === 'q7') {
      if (answers.q6 === 'Other') {
        return {
          en: 'Not applicable ("Other" selected in Question 6)',
          ml: 'ബാധകമല്ല (ചോദ്യം 6-ൽ "മറ്റുള്ളവ" തിരഞ്ഞെടുത്തു)',
        };
      }
      const cond = Q7_CONDITIONAL_MAP[answers.q6];
      const opt = cond?.options.find((o) => o.value === rawVal);
      return {
        en: opt ? `${cond.subId}. ${opt.en}` : rawVal || '—',
        ml: opt ? opt.ml : '',
      };
    }

    if (question.id === 'q3') {
      return { en: answers.q3.trim(), ml: '' };
    }

    const opt = question.options?.find((o) => o.value === rawVal);
    return {
      en: opt?.en || rawVal || '—',
      ml: opt?.ml || '',
    };
  };

  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#EAF2FF]/70 via-[#F8FBFF] to-white py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress & Section Indicator Header */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-600 mb-3">
            <span>
              {step <= 4 ? `Section ${step} of 4` : 'Review & Submit'}
              <span aria-hidden="true"> · </span>
              <span className="font-ml">
                {step <= 4 ? `വിഭാഗം ${step} / 4` : 'പരിശോധിച്ച് സമർപ്പിക്കുക'}
              </span>
            </span>
            <span className="font-mono tabular-nums text-[#0B1D3A] font-semibold">
              {answeredCount} / {totalRequiredCount} Answered ({progressPercent}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0B1D3A] to-[#2563EB] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive 4-Section Stepper */}
          <div className="mt-4 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((s) => {
              const isActive = step === s;
              const isCompleted =
                s <= 4 ? validateSection(s).length === 0 && step > s : false;
              const canJump = s < step || (s <= 4 && validateSection(s).length === 0);

              return (
                <button
                  key={s}
                  type="button"
                  disabled={!canJump && !isActive}
                  onClick={() => canJump && handleJumpToSection(s)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0B1D3A] text-white'
                      : isCompleted
                      ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 cursor-pointer'
                      : canJump
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                      : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  <span className="truncate">{s <= 4 ? `Sec ${s}` : 'Review'}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section Header Banner */}
        {step <= 4 && currentSection && (
          <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] text-white p-6 sm:p-7 mb-6 shadow-sm">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              {currentSection.en}
            </h1>
            <p className="mt-1 font-ml text-base text-blue-100">{currentSection.ml}</p>
            <p className="mt-3 text-sm text-blue-100/90">{currentSection.descriptionEn}</p>
            <p className="font-ml text-xs text-blue-200/90 mt-0.5">
              {currentSection.descriptionMl}
            </p>
          </div>
        )}

        {/* Questions List for Current Section */}
        {step <= 4 && (
          <div className="space-y-5">{sectionQuestions.map((q) => renderQuestion(q))}</div>
        )}

        {/* Step 5: Review Before Submission */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] text-white p-6 sm:p-7 shadow-sm">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                Review Your Answers Before Submitting
              </h1>
              <p className="mt-1 font-ml text-base text-blue-100">
                സമർപ്പിക്കുന്നതിന് മുൻപ് നിങ്ങളുടെ ഉത്തരങ്ങൾ പരിശോധിക്കുക
              </p>
              <p className="mt-2.5 text-sm text-blue-100/90">
                Your responses are completely anonymous. Once submitted, private answers are never
                displayed publicly.
              </p>
            </div>

            {SURVEY_SECTIONS.map((sec) => {
              const secQuestions = SURVEY_QUESTIONS.filter((q) => q.sectionId === sec.id);
              return (
                <div
                  key={sec.id}
                  className="rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="font-display text-base font-bold text-[#0B1D3A]">
                        {sec.en}
                      </h2>
                      <p className="font-ml text-xs text-slate-500 mt-0.5">{sec.ml}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJumpToSection(sec.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Edit · തിരുത്തുക</span>
                    </button>
                  </div>

                  <dl className="mt-4 divide-y divide-slate-100">
                    {secQuestions.map((q) => {
                      const rawVal = answers[q.id] as string | null;
                      const display = renderAnswerOptionLabel(q, rawVal);
                      const qLabelEn =
                        q.id === 'q7' && answers.q6 !== 'Other' && Q7_CONDITIONAL_MAP[answers.q6]
                          ? Q7_CONDITIONAL_MAP[answers.q6].titleEn
                          : q.en;
                      return (
                        <div key={q.id} className="py-3.5 first:pt-0 last:pb-0">
                          <dt className="text-xs font-medium text-slate-500">
                            <span className="font-mono text-blue-700 mr-1.5">Q{q.number}.</span>
                            {qLabelEn}
                          </dt>
                          <dd className="mt-1 text-sm font-semibold text-[#0B1D3A]">
                            {display.en}
                            {display.ml && (
                              <span className="block font-ml text-xs font-normal text-slate-600 mt-0.5">
                                {display.ml}
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              );
            })}
          </div>
        )}

        {/* Validation / Submission Error Banner */}
        {(missingIds.length > 0 || submitError) && (
          <div
            role="alert"
            className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-sm text-red-800"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              {submitError ? (
                <p className="font-medium">{submitError}</p>
              ) : (
                <>
                  <p className="font-semibold">
                    Please complete all required questions in this section before continuing.
                  </p>
                  <p className="font-ml text-xs text-red-700 mt-0.5">
                    തുടരുന്നതിന് മുൻപ് ഈ വിഭാഗത്തിലെ എല്ലാ ചോദ്യങ്ങൾക്കും ഉത്തരം നൽകുക.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation Controls */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
              <span className="font-ml text-xs text-slate-500">· പിന്നിലേക്ക്</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] hover:from-[#122C59] hover:to-[#2563EB] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{step === 4 ? 'Review Answers' : 'Next Section'}</span>
              <span className="font-ml text-xs text-blue-100">
                · {step === 4 ? 'പരിശോധിക്കുക' : 'അടുത്തത്'}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] hover:from-[#122C59] hover:to-[#2563EB] text-white font-semibold text-sm shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>Submit Survey</span>
                  <span className="font-ml text-xs text-blue-100">· സർവേ സമർപ്പിക്കുക</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
