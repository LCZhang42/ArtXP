import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import OpenRouterVisionTest from '../components/OpenRouterVisionTest';
import { Settings as SettingsIcon, Key, Eye, EyeOff, RotateCcw, ExternalLink, Check } from 'lucide-react';

export default function Settings() {
  const { settings, setSettings, user, resetProgress } = useApp();

  const [form, setForm]               = useState({ geminiKey: settings.geminiKey || '', pixabayKey: settings.pixabayKey || '' });

  useEffect(() => {
    setForm({ geminiKey: settings.geminiKey || '', pixabayKey: settings.pixabayKey || '' });
  }, [settings]);
  const [showGemini, setShowGemini]   = useState(false);
  const [showPixabay, setShowPixabay] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleSave() {
    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleReset() {
    if (confirmReset) {
      await resetProgress();
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon size={22} className="text-violet-400" />
          Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">API keys and account options</p>
      </div>

      <OpenRouterVisionTest />

      {user && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Your Profile</h2>
          <div className="space-y-2.5 text-sm">
            {[
              { label: 'Goal',       value: `${user.goalEmoji} ${user.goal}` },
              { label: 'Level',      value: <span className="capitalize">{user.skillLevel}</span> },
              { label: 'Daily time', value: `${user.dailyMinutes} minutes` },
              { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-200 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Legacy API Keys</h2>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-white">Gemini API Key</label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              Get free key <ExternalLink size={10} />
            </a>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 focus-within:border-violet-500 rounded-xl px-3 py-2.5 transition-colors">
              <Key size={13} className="text-slate-600 flex-shrink-0" />
              <input
                type={showGemini ? 'text' : 'password'}
                name="geminiKey"
                autoComplete="off"
                value={form.geminiKey}
                onChange={e => setForm(f => ({ ...f, geminiKey: e.target.value }))}
                placeholder="AIza..."
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowGemini(v => !v)}
              className="text-slate-600 hover:text-slate-400 transition-colors px-2"
            >
              {showGemini ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Legacy direct Gemini integration. Stored only in this browser until the Phase 2 OpenRouter migration.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-white">Pixabay API Key</label>
            <a
              href="https://pixabay.com/service/about/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              Get free key <ExternalLink size={10} />
            </a>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-800 border border-slate-700 focus-within:border-violet-500 rounded-xl px-3 py-2.5 transition-colors">
              <Key size={13} className="text-slate-600 flex-shrink-0" />
              <input
                type={showPixabay ? 'text' : 'password'}
                name="pixabayKey"
                autoComplete="off"
                value={form.pixabayKey}
                onChange={e => setForm(f => ({ ...f, pixabayKey: e.target.value }))}
                placeholder="Your Pixabay API Key"
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowPixabay(v => !v)}
              className="text-slate-600 hover:text-slate-400 transition-colors px-2"
            >
              {showPixabay ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            Powers the Reference Finder. Stored only in this browser and excluded from migration exports.
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}
        >
          {saved ? <><Check size={15} /> Saved!</> : 'Save Settings'}
        </button>
      </div>

      <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-4">Danger Zone</h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300 font-semibold">Reset all progress</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Deletes all XP, streaks, practice log, and settings. Cannot be undone.
            </p>
          </div>
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold transition-all flex-shrink-0 ${
              confirmReset
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-rose-950/40 border border-rose-900/40 text-rose-400 hover:bg-rose-900/30'
            }`}
          >
            <RotateCcw size={12} />
            {confirmReset ? 'Confirm?' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}
