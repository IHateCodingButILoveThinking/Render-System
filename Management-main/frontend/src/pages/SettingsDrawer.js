import React from 'react';
import { Globe, LogOut, User, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function SettingsDrawer({ ctx }) {
  const {
    showSettingsMenu,
    setShowSettingsMenu,
    text,
    lang,
    displayName,
    toggleLanguage,
    handleLogout,
  } = ctx;

  return (
    <AnimatePresence>
      {showSettingsMenu ? (
        <>
          <motion.button
            type="button"
            onClick={() => setShowSettingsMenu(false)}
            className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[2px]"
            aria-label="Close settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[60] w-[min(86vw,340px)] overflow-hidden border-l border-emerald-200/60 bg-[linear-gradient(180deg,#eef9f4_0%,#f8fcff_42%,#eef8ff_100%)] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            initial={{ x: 96, opacity: 0, scale: 0.985 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 72, opacity: 0, scale: 0.992 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute inset-x-3 top-3 h-36 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.24),transparent_52%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_48%)]" />
            <div className="pointer-events-none absolute left-4 right-4 top-16 overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/35 px-3 py-3">
              <svg viewBox="0 0 280 110" className="h-20 w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="settingsLake" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#93c5fd" />
                    <stop offset="55%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#6ee7b7" />
                  </linearGradient>
                </defs>
                <path d="M0 76h280v34H0z" fill="url(#settingsLake)" />
                <path d="M6 76l40-38 34 38z" fill="#4d7c0f" opacity="0.86" />
                <path d="M44 76l44-48 36 48z" fill="#3f6212" opacity="0.9" />
                <path d="M98 76l42-34 34 34z" fill="#166534" opacity="0.92" />
                <path d="M142 76l36-44 30 44z" fill="#15803d" opacity="0.88" />
                <path d="M182 76l36-28 32 28z" fill="#0f766e" opacity="0.92" />
                <path d="M224 76l26-20 24 20z" fill="#0f766e" opacity="0.74" />
                <path d="M18 92c15-7 30-7 45 0" stroke="#dbeafe" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M78 92c15-7 30-7 45 0" stroke="#dbeafe" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M138 92c15-7 30-7 45 0" stroke="#dbeafe" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M198 92c15-7 30-7 45 0" stroke="#dbeafe" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

            <div className="relative mb-32 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">
                {text.settings || 'Settings'}
              </h2>
              <button
                type="button"
                onClick={() => setShowSettingsMenu(false)}
                className="rounded-full border border-white/70 bg-white/75 p-2 text-zinc-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-zinc-800"
                aria-label="Close"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-4 overflow-hidden rounded-[1.75rem] border border-emerald-100/80 bg-white/78 p-3 shadow-[0_18px_45px_rgba(148,163,184,0.12)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-sky-300 to-cyan-300" />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-100 to-emerald-100 text-sky-700 shadow-sm">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {text.usernameLabel || (lang === 'zh' ? '用户名' : 'Username')}
                  </p>
                  <p className="mt-1 truncate text-sm font-black text-zinc-900">{displayName}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-700/80">
                    {lang === 'zh' ? '山水主题设置' : 'Landscape-style settings'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative space-y-2">
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  setShowSettingsMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white/88 px-3 py-3 text-left text-sm font-semibold text-zinc-700 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(125,211,252,0.16)]"
              >
                <Globe className="h-4 w-4" />
                {text.switchLanguage || 'Switch Language'} ({lang === 'en' ? '中文' : 'EN'})
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-2xl border border-rose-200/90 bg-white/88 px-3 py-3 text-left text-sm font-semibold text-rose-600 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-[0_12px_30px_rgba(251,113,133,0.12)]"
              >
                <LogOut className="h-4 w-4" />
                {text.logout}
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
