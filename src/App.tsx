import { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { type AppRoute, Navbar } from './components/Navbar';
import { SurveyView } from './components/SurveyView';
import { ThankYouView } from './components/ThankYouView';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const handleNavigate = (nextRoute: AppRoute, anchorId?: string) => {
    setRoute(nextRoute);
    if (anchorId) {
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash === 'survey' || hash === 'dashboard' || hash === 'thank-you' || hash === 'home') {
        setRoute(hash);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF] text-[#0f172a]">
      <Navbar
        currentRoute={route}
        onNavigate={handleNavigate}
        isAdminAuthenticated={Boolean(adminToken)}
      />

      <main className="flex-1">
        {route === 'home' && (
          <LandingPage
            onStartSurvey={() => handleNavigate('survey')}
            onNavigate={handleNavigate}
          />
        )}

        {route === 'survey' && (
          <SurveyView onSubmitted={() => handleNavigate('thank-you')} />
        )}

        {route === 'thank-you' && (
          <ThankYouView onReturnHome={() => handleNavigate('home')} />
        )}

        {route === 'dashboard' && (
          <AdminDashboard token={adminToken} onTokenChange={setAdminToken} />
        )}
      </main>
    </div>
  );
}
