import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Target, RefreshCw, Check, Calendar, Image, BookOpen, AlertCircle } from 'lucide-react';
import { generateDailyMissions } from '../utils/gemini';
import SkillCard from '../components/SkillCard';

const DIFF_STYLE = {
  easy:   'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
  hard:   'text-rose-400 bg-rose-400/10 border-rose-500/20',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayMissions() {
  try {
    const saved = JSON.parse(localStorage.getItem('artxp_missions') || 'null');
    if (saved?.date === new Date().toDateString()) return saved.data;
  } catch {}
  return null;
}

function getTodayCompleted() {
  try {
    const saved = JSON.parse(localStorage.getItem('artxp_completed') || 'null');
    if (saved?.date === new Date().toDateString()) return saved.data;
  } catch {}
  return [];
}

export default function Dashboard() {
  const { user, skills, streak, settings, completeExercise, totalXP } = useApp();
  const navigate = useNavigate();
  const [missions, setMissions]           = useState(getTodayMissions);
  const [completed, setCompleted]         = useState(getTodayCompleted);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  async function fetchMissions() {
    if (!settings.geminiKey) {
      setError('Add your Gemini API key in Settings to generate missions.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await generateDailyMissions(settings.geminiKey, {
        goal: user.goal,
        skillLevel: user.skillLevel,
        skills,
      });
      setMissions(data);
      localStorage.setItem('artxp_missions', JSON.stringify({ date: new Date().toDateString(), data }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleMission(i) {
    const wasCompleted = completed.includes(i);
    const updated = wasCompleted
      ? completed.filter(x => x !== i)
      : [...completed, i];

    if (!wasCompleted && missions?.[i]) {
      completeExercise({ skill: missions[i].skill, xp: missions[i].xp || 30 });
    }
    setCompleted(updated);
    localStorage.setItem('artxp_completed', JSON.stringify({ date: new Date().toDateString(), data: updated }));
  }

  const completedToday = completed.length;
  const totalMissions  = missions?.length || 0;

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{getGreeting()} ✦</h1>
          <p className="text-slate-400 mt-1">
            {user?.goalEmoji} Working toward{' '}
            <span className="text-violet-400 font-medium">{user?.goal}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 flex-shrink-0">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="font-bold text-white text-xl leading-none">{streak.count}</div>
            <div className="text-xs text-slate-500 leading-none mt-0.5">day streak</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-950/60 to-indigo-950/60 border border-violet-900/40 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-slate-300">Total XP Earned</span>
          <span className="text-amber-400 font-bold text-lg">{totalXP.toLocaleString()} XP</span>
        </div>
        <div className="text-slate-500 text-xs">
          {Object.values(skills).filter(s => s.level > 1).length} skills leveled ·{' '}
          {Object.values(skills).reduce((s, sk) => s + sk.level, 0)} total levels
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={17} className="text-violet-400" />
            <h2 className="font-semibold text-white">Today's Missions</h2>
            {missions && (
              <span className="text-xs text-slate-500">
                {completedToday}/{totalMissions} done
              </span>
            )}
          </div>
          <button
            onClick={fetchMissions}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {missions ? 'Refresh' : 'Generate'}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-950/30 border border-rose-900/40 rounded-xl p-3 mb-3">
            <AlertCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {!missions && !loading && (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-10 text-center">
            <Target size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-4">
              {settings.geminiKey
                ? "Generate your AI-powered daily missions"
                : "Add your Gemini API key in Settings, then generate missions"}
            </p>
            <button
              onClick={fetchMissions}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Generate Missions
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <RefreshCw size={24} className="text-violet-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Crafting your missions...</p>
          </div>
        )}

        {missions && !loading && (
          <div className="space-y-2.5">
            {missions.map((m, i) => {
              const done = completed.includes(i);
              return (
                <div
                  key={i}
                  className={`border rounded-2xl p-4 transition-all ${
                    done
                      ? 'border-emerald-900/50 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleMission(i)}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        done
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-600 hover:border-violet-500'
                      }`}
                    >
                      {done && <Check size={10} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h3 className={`font-semibold text-sm ${done ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {m.title}
                        </h3>
                        {m.difficulty && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFF_STYLE[m.difficulty] || DIFF_STYLE.medium}`}>
                            {m.difficulty}
                          </span>
                        )}
                        <span className="text-xs text-amber-400 font-medium ml-auto">+{m.xp} XP</span>
                        <span className="text-xs text-slate-600">{m.duration}min</span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider text-slate-400">
          Skill Progress
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.keys(skills).map(key => (
            <SkillCard key={key} skillKey={key} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Planner',    icon: Calendar, path: '/planner'    },
          { label: 'References', icon: Image,    path: '/references' },
          { label: 'Log',        icon: BookOpen, path: '/log'        },
        ].map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="bg-slate-900 border border-slate-800 hover:border-violet-800 hover:bg-slate-800/50 rounded-2xl p-4 text-center transition-all group"
          >
            <Icon size={20} className="text-violet-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-xs text-slate-400 font-medium group-hover:text-slate-300">{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
