import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';
import { databaseService } from './services/databaseService';
import { authService } from './services/authService';
import { LoginScreen } from './components/auth/LoginScreen';

function clearLegacySeededCacheOnce() {
    const marker = 'syskode_v10_real_data_only';
    if (localStorage.getItem(marker)) return;
    const businessStores = [
        'syskode_leads_store','syskode_meetings_store','syskode_projects_store','syskode_project_status_logs_store',
        'syskode_members_store','syskode_matrix_store','syskode_tasks_store','syskode_credentials_store','syskode_domains_store',
        'syskode_hosting_store','syskode_ssl_store','syskode_repos_store','syskode_deploys_store','syskode_qa_testcases_store',
        'syskode_activities_store','syskode_comments_store','syskode_notifications_store','syskode_pricings_store',
        'syskode_project_billing_store','syskode_documents_store','syskode_vendors_store'
    ];
    businessStores.forEach(key => localStorage.removeItem(key));
    localStorage.setItem(marker, '1');
}

function LoadingScreen({ message = 'Connecting to database…' }) {
    return (<div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500"/>
        <p className="text-sm font-semibold">{message}</p>
        <p className="mt-1 text-xs text-zinc-500">Syskode Project Hub</p>
      </div>
    </div>);
}
function Root() {
    const [ready, setReady] = useState(false);
    const [loggedIn, setLoggedIn] = useState(!isSupabaseConfigured);
    const [error, setError] = useState('');
    const bootstrap = useCallback(async () => {
        setReady(false);
        setError('');
        try {
            if (isSupabaseConfigured) clearLegacySeededCacheOnce();
            if (isSupabaseConfigured && supabase) {
                const { data } = await supabase.auth.getSession();
                if (!data.session) {
                    setLoggedIn(false);
                    setReady(true);
                    return;
                }
                await authService.loadAuthenticatedProfile();
                setLoggedIn(true);
            }
            await databaseService.initialize();
            setReady(true);
        }
        catch (err) {
            setError(err?.message || 'Unable to initialize the application database.');
            setReady(true);
        }
    }, []);
    useEffect(() => {
        bootstrap();
        if (!isSupabaseConfigured || !supabase)
            return;
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setLoggedIn(false);
                setReady(true);
            }
        });
        return () => listener.subscription.unsubscribe();
    }, [bootstrap]);
    if (!ready)
        return <LoadingScreen />;
    if (isSupabaseConfigured && !loggedIn)
        return <LoginScreen onLoggedIn={bootstrap}/>;
    if (error) {
        return (<div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-xl rounded-2xl border border-rose-900 bg-rose-950/20 p-6">
          <h1 className="font-bold text-rose-300">Database setup needs attention</h1>
          <p className="mt-2 text-sm text-zinc-300">{error}</p>
          <p className="mt-3 text-xs text-zinc-500">Run the SQL migrations in /supabase/migrations in numeric order and verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
          <button onClick={bootstrap} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold">Retry</button>
        </div>
      </div>);
    }
    return <App />;
}
createRoot(document.getElementById('root')).render(<StrictMode>
    <Root />
  </StrictMode>);
