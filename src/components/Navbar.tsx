import { Compass, Menu, X } from 'lucide-react';
import { useState } from 'react';

export type AppRoute = 'home' | 'survey' | 'thank-you' | 'dashboard';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute, sectionAnchor?: string) => void;
  isAdminAuthenticated: boolean;
}

export function Navbar({ currentRoute, onNavigate, isAdminAuthenticated }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (route: AppRoute, anchor?: string) => {
    setMobileOpen(false);
    onNavigate(route, anchor);
  };

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
      active
        ? 'text-[#0B1D3A] border-blue-600'
        : 'text-slate-600 border-transparent hover:text-[#0B1D3A] hover:border-slate-300'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand mark */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer group"
        >
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0B1D3A] to-[#2563EB] text-white flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-[#0B1D3A] whitespace-nowrap">
            Find Your Path
          </span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          <button
            type="button"
            onClick={() => handleLinkClick('home')}
            className={`${navLinkClass(currentRoute === 'home')} cursor-pointer`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'objectives')}
            className={`${navLinkClass(false)} cursor-pointer`}
          >
            Objectives
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('survey')}
            className={`${navLinkClass(currentRoute === 'survey')} cursor-pointer`}
          >
            Survey
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('dashboard')}
            className={`${navLinkClass(currentRoute === 'dashboard')} cursor-pointer`}
          >
            {isAdminAuthenticated ? 'Dashboard' : 'Admin Dashboard'}
          </button>
        </nav>

        {/* Zone 3: Single primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick('survey')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] hover:from-[#122C59] hover:to-[#2563EB] rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Survey
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          <button
            type="button"
            onClick={() => handleLinkClick('home')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-blue-50 flex items-center justify-between cursor-pointer"
          >
            <span>Home</span>
            <span className="font-ml text-xs text-slate-500">ഹോം</span>
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('home', 'objectives')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-blue-50 flex items-center justify-between cursor-pointer"
          >
            <span>Research Objectives</span>
            <span className="font-ml text-xs text-slate-500">ഗവേഷണ ലക്ഷ്യങ്ങൾ</span>
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('survey')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-blue-50 flex items-center justify-between cursor-pointer"
          >
            <span>Survey</span>
            <span className="font-ml text-xs text-slate-500">സർവേ</span>
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('dashboard')}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-blue-50 flex items-center justify-between cursor-pointer"
          >
            <span>Admin Dashboard</span>
            <span className="font-ml text-xs text-slate-500">അഡ്മിൻ ഡാഷ്‌ബോർഡ്</span>
          </button>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleLinkClick('survey')}
              className="w-full px-4 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#0B1D3A] to-[#1D4ED8] cursor-pointer"
            >
              Start Survey · സർവേ ആരംഭിക്കുക
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
