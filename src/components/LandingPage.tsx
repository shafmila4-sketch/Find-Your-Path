import { ArrowRight, BookOpen, Compass, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { SURVEY_SECTIONS } from '../data/surveySchema';
import type { AppRoute } from './Navbar';

interface LandingPageProps {
  onStartSurvey: () => void;
  onNavigate: (route: AppRoute) => void;
}

const RESEARCH_OBJECTIVES = [
  {
    index: '01',
    en: 'Understand students’ awareness of different career fields.',
    ml: 'വിവിധ കരിയർ മേഖലകളെക്കുറിച്ച് വിദ്യാർത്ഥികൾക്കുള്ള അറിവ് മനസ്സിലാക്കുക.',
  },
  {
    index: '02',
    en: 'Explore how students receive career information and guidance.',
    ml: 'വിദ്യാർത്ഥികൾക്ക് കരിയർ വിവരങ്ങളും മാർഗ്ഗനിർദ്ദേശങ്ങളും എങ്ങനെയാണ് ലഭിക്കുന്നതെന്ന് കണ്ടെത്തുക.',
  },
  {
    index: '03',
    en: 'Identify challenges faced during career decisions.',
    ml: 'കരിയർ തീരുമാനങ്ങൾ എടുക്കുമ്പോൾ വിദ്യാർത്ഥികൾ നേരിടുന്ന വെല്ലുവിളികൾ തിരിച്ചറിയുക.',
  },
  {
    index: '04',
    en: 'Understand the influence of family and social factors.',
    ml: 'കുടുംബത്തിന്റെയും സമൂഹത്തിന്റെയും സ്വാധീനം കരിയർ തിരഞ്ഞെടുപ്പിൽ എത്രത്തോളമുണ്ടെന്ന് മനസ്സിലാക്കുക.',
  },
  {
    index: '05',
    en: 'Identify the support students need to make informed career decisions.',
    ml: 'ശരിയായ കരിയർ തീരുമാനമെടുക്കാൻ വിദ്യാർത്ഥികൾക്ക് ആവശ്യമായ പിന്തുണ എന്താണെന്ന് കണ്ടെത്തുക.',
  },
];

export function LandingPage({ onStartSurvey, onNavigate }: LandingPageProps) {
  const [heroImgError, setHeroImgError] = useState(false);
  const [studyImgError, setStudyImgError] = useState(false);

  return (
    <div className="bg-[#F8FBFF]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#EAF2FF] via-[#F5F9FF] to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wide text-blue-700 mb-3">
                Student Research Study · വിദ്യാർത്ഥി ഗവേഷണ പഠനം
              </p>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-[#0B1D3A] leading-[1.08] text-balance">
                Find Your Path
              </h1>

              <p className="mt-3 text-xl sm:text-2xl font-semibold text-blue-800 text-balance">
                Early Career Discovery for the Next Generation
              </p>
              <p className="mt-1.5 font-ml text-base sm:text-lg text-slate-600">
                പുതുതലമുറയ്ക്കായി നേരത്തെയുള്ള കരിയർ കണ്ടെത്തൽ പഠനം
              </p>

              <p className="mt-6 text-base text-slate-700 leading-relaxed max-w-2xl">
                This student research project investigates whether students and young people have
                sufficient career awareness, guidance, and clear information about diverse career
                opportunities before making critical educational and career decisions.
              </p>
              <p className="mt-2.5 font-ml text-sm sm:text-[15px] text-slate-600 leading-relaxed max-w-2xl">
                പ്രധാനപ്പെട്ട വിദ്യാഭ്യാസ-കരിയർ തീരുമാനങ്ങൾ എടുക്കുന്നതിന് മുൻപ് വിദ്യാർത്ഥികൾക്കും
                യുവാക്കൾക്കും വിവിധ തൊഴിൽ അവസരങ്ങളെക്കുറിച്ച് മതിയായ അറിവും ശരിയായ
                മാർഗ്ഗനിർദ്ദേശവും ലഭിക്കുന്നുണ്ടോ എന്ന് മനസ്സിലാക്കുന്നതിനുള്ള ഗവേഷണ പഠനമാണിത്.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onStartSurvey}
                  className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] hover:from-[#122C59] hover:to-[#2563EB] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Start Survey</span>
                  <span className="text-blue-200 font-normal">|</span>
                  <span className="font-ml text-sm font-medium text-blue-50">സർവേ ആരംഭിക്കുക</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-7 pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-600">
                <span className="font-medium text-slate-800">20 Questions</span>
                <span aria-hidden="true">·</span>
                <span>4 Sections</span>
                <span aria-hidden="true">·</span>
                <span>100% Anonymous</span>
                <span aria-hidden="true">·</span>
                <span className="font-ml">പൂർണ്ണമായും രഹസ്യാത്മകം (പേര് വിവരങ്ങൾ ശേഖരിക്കുന്നില്ല)</span>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="lg:col-span-6 flex">
              <div className="w-full rounded-2xl overflow-hidden border border-slate-200/90 bg-[#0B1D3A] shadow-sm min-h-[280px] lg:min-h-[420px]">
                {!heroImgError ? (
                  <img
                    src="/src/assets/images/hero_career_discovery_1795332442715.jpg"
                    alt="Students collaborating on career discovery and educational planning in a university library"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full min-h-[320px] bg-gradient-to-br from-[#0B1D3A] via-[#153264] to-[#2563EB] flex flex-col items-center justify-center p-8 text-center text-white">
                    <Compass className="w-12 h-12 text-blue-200 mb-4" />
                    <p className="font-display text-xl font-bold">Early Career Discovery</p>
                    <p className="font-ml text-sm text-blue-100 mt-1">
                      വിദ്യാഭ്യാസവും കരിയർ കണ്ടെത്തലും
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Introduction */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-5 flex">
              <div className="w-full rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 min-h-[260px]">
                {!studyImgError ? (
                  <img
                    src="/src/assets/images/career_exploration_study_1795332441830.jpg"
                    alt="Career planning journal and research analytics tablet on a clean study desk"
                    referrerPolicy="no-referrer"
                    onError={() => setStudyImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full min-h-[260px] bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col items-center justify-center p-8 text-center">
                    <BookOpen className="w-10 h-10 text-blue-700 mb-3" />
                    <p className="font-display font-semibold text-[#0B1D3A]">Academic Career Research</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1D3A] tracking-tight text-balance">
                Why This Research Matters
              </h2>
              <p className="mt-1 font-ml text-base font-medium text-blue-800">
                ഈ ഗവേഷണം എന്തുകൊണ്ട് പ്രധാനമാണ്
              </p>

              <p className="mt-5 text-base text-slate-700 leading-relaxed">
                Many students choose courses and career paths with limited exposure beyond a few
                traditional professions. This research explores career awareness, knowledge of
                career fields, educational and career guidance, school-level exposure, family and
                social influences, key decision-making challenges, and expectations for modern
                career guidance platforms.
              </p>
              <p className="mt-3 font-ml text-[15px] text-slate-600 leading-relaxed">
                പരമ്പരാഗതമായ ചുരുക്കം ചില തൊഴിലുകൾക്കപ്പുറമുള്ള കരിയർ സാധ്യതകളെക്കുറിച്ച്
                പല വിദ്യാർത്ഥികൾക്കും വ്യക്തമായ അറിവ് ലഭിക്കാറില്ല. കരിയർ അവബോധം, വിവിധ
                മേഖലകളിലെ അറിവ്, സ്കൂൾ തലത്തിലെ മാർഗ്ഗനിർദ്ദേശം, കുടുംബത്തിന്റെ സ്വാധീനം,
                തീരുമാനങ്ങളെടുക്കുമ്പോഴുള്ള തടസ്സങ്ങൾ, കരിയർ ഗൈഡൻസ് പ്ലാറ്റ്‌ഫോമുകളോടുള്ള
                പ്രതീക്ഷകൾ എന്നിവയാണ് ഈ പഠനത്തിലൂടെ അന്വേഷിക്കുന്നത്.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SURVEY_SECTIONS.map((sec) => (
                  <div
                    key={sec.id}
                    className="rounded-xl border border-slate-200 bg-[#F8FBFF] p-4"
                  >
                    <p className="text-sm font-semibold text-[#0B1D3A]">{sec.en}</p>
                    <p className="font-ml text-xs text-slate-600 mt-1">{sec.ml}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Objectives */}
      <section id="objectives" className="py-16 lg:py-20 bg-[#F8FBFF] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1D3A] tracking-tight text-balance">
              Research Objectives
            </h2>
            <p className="mt-1 font-ml text-base font-medium text-blue-800">
              ഗവേഷണ ലക്ഷ്യങ്ങൾ
            </p>
            <p className="mt-3 text-base text-slate-600">
              Five core areas investigated through our 20-question bilingual research instrument.
            </p>
            <p className="font-ml text-sm text-slate-500 mt-0.5">
              20 ചോദ്യങ്ങളുള്ള ഈ സർവേയിലൂടെ പരിശോധിക്കുന്ന അഞ്ച് പ്രധാന ലക്ഷ്യങ്ങൾ.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESEARCH_OBJECTIVES.map((obj) => (
              <article
                key={obj.index}
                className="rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-blue-300 transition-colors"
              >
                <div>
                  <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                    Objective {obj.index}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-[#0B1D3A] leading-snug">
                    {obj.en}
                  </h3>
                  <p className="mt-2.5 font-ml text-sm text-slate-600 leading-relaxed">
                    {obj.ml}
                  </p>
                </div>
              </article>
            ))}

            {/* Participation CTA Card */}
            <article className="rounded-2xl bg-gradient-to-br from-[#0B1D3A] to-[#1E40AF] p-6 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-200 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Anonymous Contribution</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug">
                  Share Your Career Perspective
                </h3>
                <p className="mt-2 font-ml text-sm text-blue-100 leading-relaxed">
                  നിങ്ങളുടെ അനുഭവങ്ങളും അഭിപ്രായങ്ങളും ഈ പഠനത്തിൽ പങ്കുവെക്കൂ. പേരോ ഫോൺ നമ്പറോ
                  ആവശ്യമില്ല.
                </p>
              </div>
              <button
                type="button"
                onClick={onStartSurvey}
                className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0B1D3A] font-semibold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Start Survey</span>
                <span className="font-ml text-xs text-slate-600">· തുടങ്ങുക</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display font-bold text-[#0B1D3A]">
              Find Your Path – Early Career Discovery for the Next Generation
            </p>
            <p className="font-ml text-xs text-slate-500 mt-1">
              വിദ്യാർത്ഥി ഗവേഷണ പഠനം · പേര് വിവരങ്ങൾ ശേഖരിക്കാത്ത സുരക്ഷിത സർവേ
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="hover:text-[#0B1D3A] cursor-pointer whitespace-nowrap"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('survey')}
              className="hover:text-[#0B1D3A] cursor-pointer whitespace-nowrap"
            >
              Survey
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="hover:text-[#0B1D3A] cursor-pointer whitespace-nowrap"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
