import React, { useState } from 'react';
import { Database, LockKeyhole, Mail } from 'lucide-react';
import { authService } from '../../services/authService';

export const LoginScreen = ({ onLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.login(email.trim(), password);
      await onLoggedIn();
    } catch (err) {
      setError(err?.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071A35] px-5 py-10 text-[#101828]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-[#173a5c] bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden min-h-[560px] flex-col justify-between bg-[#0C2038] p-10 text-white lg:flex">
            <img src="/images/syskode-logo-light.png" alt="Syskode" className="h-11 w-48 object-contain object-left" />
            <div>
              <div className="mb-5 h-1 w-16 rounded-full bg-[#00AEEF]" />
              <h2 className="max-w-sm text-4xl font-bold leading-tight">Project Hub</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#bcd2e3]">
                Leads, proposals, projects, QA, billing, renewals and delivery work in one Syskode workspace.
              </p>
            </div>
            <p className="text-xs text-[#8fb1c9]">Syskode Technologies W.L.L.</p>
          </div>

          <div className="p-7 sm:p-10 lg:p-12">
            <img src="/images/syskode-logo-dark.png" alt="Syskode" className="mb-7 h-9 w-40 object-contain object-left lg:hidden" />
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0788C9]">Secure Workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071A35]">Sign in to Project Hub</h1>
            <p className="mt-2 text-sm leading-6 text-[#667085]">Use your Syskode account to access the live shared workspace.</p>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#cfe6f3] bg-[#EEF9FF] px-3 py-2.5 text-xs font-medium text-[#075f91]">
              <Database className="h-4 w-4" />
              Supabase PostgreSQL + secure authenticated session
            </div>

            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#344054]">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#98A2B3]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@syskode.com"
                    className="w-full rounded-xl border border-[#D8E7F0] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/15"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[#344054]">Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-[#98A2B3]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#D8E7F0] bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/15"
                  />
                </div>
              </label>

              {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#0788C9] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066FA5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in to Dashboard'}
              </button>
            </form>

            <p className="mt-6 text-[11px] leading-relaxed text-[#98A2B3]">
              User accounts are created in Supabase Authentication. Roles are controlled from the profiles table and cannot be escalated from the browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
