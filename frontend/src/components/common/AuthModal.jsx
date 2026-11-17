import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, login, register } = useAuth();
  const [tab, setTab] = useState(authModalTab || 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('analyst');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync tab with external trigger
  React.useEffect(() => {
    setTab(authModalTab || 'login');
    setError('');
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAnalystLogin = async () => {
    setError('');
    setLoading(true);
    const demoEmail = 'analyst@truthlens.ai';
    const demoPassword = 'TruthLens2026!';
    try {
      // Attempt login first
      await login(demoEmail, demoPassword);
    } catch {
      // If demo user does not exist yet on fresh DB, register automatically
      try {
        await register('Senior Fact Analyst', demoEmail, demoPassword, 'analyst');
      } catch (regErr) {
        setError(regErr.message || 'Demo session initialization failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-surface rounded-2xl border border-slate-border shadow-elevated p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue mx-auto mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-extrabold text-2xl text-slate-main">
            {tab === 'login' ? 'Sign In to TruthLens' : 'Create Analyst Account'}
          </h3>
          <p className="text-xs text-slate-muted mt-1">
            Access investigations, full evidence dossiers, and persistent archives.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`py-2 rounded-md transition-all ${
              tab === 'login'
                ? 'bg-surface text-slate-main shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`py-2 rounded-md transition-all ${
              tab === 'register'
                ? 'bg-surface text-slate-main shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Vance"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-slate-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-slate-main placeholder-slate-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@newsroom.org"
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-slate-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-slate-main placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-slate-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-slate-main placeholder-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-blue hover:bg-blue-700 disabled:opacity-60 text-white font-heading font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Auto-Fill Option */}
        <div className="mt-5 pt-4 border-t border-slate-border text-center">
          <button
            type="button"
            onClick={handleDemoAnalystLogin}
            disabled={loading}
            className="w-full py-2 px-3 border border-slate-border hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
            <span>Instant Demo Sign-In (Analyst Persona)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

