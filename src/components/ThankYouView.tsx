import { CheckCircle2, Home } from 'lucide-react';

interface ThankYouViewProps {
  onReturnHome: () => void;
}

export function ThankYouView({ onReturnHome }: ThankYouViewProps) {
  return (
    <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#EAF2FF] via-[#F8FBFF] to-white py-16 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
        </div>

        <h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-[#0B1D3A] tracking-tight">
          Thank You for Your Participation!
        </h1>
        <p className="mt-2 font-ml text-lg font-medium text-blue-800">
          സർവേയിൽ പങ്കെടുത്തതിന് നന്ദി!
        </p>

        <p className="mt-5 text-base text-slate-700 leading-relaxed">
          Your response has been recorded anonymously. Your insights contribute meaningfully to
          understanding student career awareness, guidance needs, and future career discovery.
        </p>
        <p className="mt-2.5 font-ml text-sm sm:text-[15px] text-slate-600 leading-relaxed">
          നിങ്ങളുടെ പ്രതികരണം പേര് വിവരങ്ങൾ ഒന്നും ശേഖരിക്കാതെ സുരക്ഷിതമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്.
          വിദ്യാർത്ഥികളുടെ കരിയർ അവബോധത്തെയും മാർഗ്ഗനിർദ്ദേശ ആവശ്യങ്ങളെയും കുറിച്ചുള്ള ഈ പഠനത്തിന്
          നിങ്ങളുടെ അഭിപ്രായങ്ങൾ വളരെ വിലപ്പെട്ടതാണ്.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onReturnHome}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] hover:from-[#122C59] hover:to-[#2563EB] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Return to Homepage</span>
            <span className="font-ml text-xs text-blue-100">· ഹോം പേജിലേക്ക് മടങ്ങുക</span>
          </button>
        </div>
      </div>
    </section>
  );
}
