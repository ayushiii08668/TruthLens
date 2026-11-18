import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Search, 
  BarChart3, 
  History, 
  Bookmark, 
  LogOut, 
  User, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Verify', icon: Search },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/history', label: 'History', icon: History },
    { to: '/saved', label: 'Saved Reports', icon: Bookmark },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="border-b border-slate-border bg-surface sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-2 md:gap-3 lg:gap-6 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight text-slate-main">
                    Truth<span className="text-brand-blue">Lens</span>
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-brand-blue rounded border border-blue-100">
                    AI Verification
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-muted hidden lg:inline-block font-medium tracking-tight">
                  Don't Just Believe It. Verify It.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1 pl-2 lg:pl-4 border-l border-slate-border/80">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-[11px] lg:text-xs font-semibold transition-all ${
                      active
                        ? 'bg-blue-50 text-brand-blue font-bold border border-blue-100/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action / Auth */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="flex items-center gap-1.5 lg:gap-2 pl-2.5 lg:pl-3 py-1 pr-1 bg-slate-50 border border-slate-border rounded-lg text-xs">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-700 max-w-[85px] lg:max-w-[130px] truncate text-[11px] lg:text-xs">
                    {user?.name || user?.email}
                  </span>
                  <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-brand-blue">
                    {user?.role || 'analyst'}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 lg:p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 lg:gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="flex items-center gap-1.5 text-xs font-bold bg-brand-blue hover:bg-blue-700 text-white px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-border bg-surface px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                  active
                    ? 'bg-blue-50 text-brand-blue border border-blue-100'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-border">
            {isAuthenticated ? (
              <div className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs text-rose-600 font-semibold px-2 py-1 rounded hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-xs font-semibold border border-slate-border rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-xs font-bold bg-brand-blue text-white rounded-lg hover:bg-blue-700"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

