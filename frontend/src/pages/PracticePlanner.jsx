import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, RefreshCw, Check, Clock, ChevronDown, ChevronUp, AlertCircle, Sparkles, Image, X, ExternalLink, Bookmark } from 'lucide-react';
import { generateWeeklyPlan } from '../utils/gemini';
import { searchReferences, buildReferenceQuery } from '../utils/pixabay';

const SKILL_BADGE = {
  gesture:     'bg-violet-500/10 border-violet-500/30 text-violet-400',
  anatomy:     'bg-pink-500/10 border-pink-500/30 text-pink-400',
  perspective: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  composition: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  lighting:    'bg-amber-500/10 border-amber-500/30 text-amber-400',
  linework:    'bg-orange-500/10 border-orange-500/30 text-orange-400',
};

function getPlanCompleted() {
  try { return JSON.parse(localStorage.getItem('artxp_plan_done') || '{}'); } catch { return {}; }
}

export default function PracticePlanner() {
  const { user, plan, setPlan, settings, completeExercise, savedRefs, addSavedRef, removeSavedRef } = useApp();
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [expandedDay, setExpandedDay] = useState(0);
  const [done, setDone]               = useState(getPlanCompleted);
  const [refs, setRefs]               = useState({});   // key: `${dayIdx}-${exIdx}` → { loading, data, error }
  const [refPages, setRefPages]       = useState({});   // key → current page number
  const [lightbox, setLightbox]       = useState(null); // selected photo object
  const [similar, setSimilar]         = useState({ loading: false, data: null });

  useEffect(() => {
    if (!lightbox || !settings.pixabayKey) {
      setSimilar({ loading: false, data: null });
      return;
    }
    const query = lightbox.description.split(',').slice(0, 3).map(t => t.trim()).join(' ');
    setSimilar({ loading: true, data: null });
    searchReferences(settings.pixabayKey, query, 7)
      .then(data => setSimilar({ loading: false, data: data.filter(p => p.id !== lightbox.id).slice(0, 6) }))
      .catch(() => setSimilar({ loading: false, data: [] }));
  }, [lightbox, settings.pixabayKey]);

  async function fetchRefs(dayIdx, exIdx, exercise) {
    const key = `${dayIdx}-${exIdx}`;
    if (refs[key]?.loading) return;
    if (!settings.pixabayKey) {
      setRefs(r => ({ ...r, [key]: { error: 'Add your Pixabay API key in Settings.' } }));
      return;
    }
    const nextPage = (refPages[key] || 0) + 1;
    setRefPages(p => ({ ...p, [key]: nextPage }));
    setRefs(r => ({ ...r, [key]: { loading: true } }));
    try {
      const query = buildReferenceQuery(exercise.name, exercise.skill);
      const data  = await searchReferences(settings.pixabayKey, query, 4, exercise.skill, nextPage);
      setRefs(r => ({ ...r, [key]: { data } }));
    } catch (e) {
      setRefs(r => ({ ...r, [key]: { error: e.message } }));
    }
  }

  async function generate() {
    if (!settings.geminiKey) {
      setError('Add your Gemini API key in Settings first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await generateWeeklyPlan(settings.geminiKey, {
        goal:         user.goal,
        skillLevel:   user.skillLevel,
        dailyMinutes: user.dailyMinutes,
      });
      setPlan(data);
      setDone({});
      localStorage.removeItem('artxp_plan_done');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExercise(dayIdx, exIdx, exercise) {
    const key = `${dayIdx}-${exIdx}`;
    const updated = { ...done };
    if (updated[key]) {
      delete updated[key];
    } else {
      updated[key] = true;
      completeExercise({ skill: exercise.skill, xp: exercise.xp || 30 });
    }
    setDone(updated);
    localStorage.setItem('artxp_plan_done', JSON.stringify(updated));
  }

  const totalEx   = plan?.days?.reduce((s, d) => s + d.exercises.length, 0) || 0;
  const doneCount = Object.keys(done).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar size={22} className="text-violet-400" />
            Practice Planner
          </h1>
          <p className="text-slate-400 text-sm mt-1">7-day personalized roadmap for {user?.goalEmoji} {user?.goal}</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {plan ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-950/30 border border-rose-900/40 rounded-xl p-3">
          <AlertCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {!plan && !loading && (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Sparkles size={36} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No plan yet</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-xs mx-auto">
            Generate a personalized 7-day practice plan based on your goals and skill level.
          </p>
          <button
            onClick={generate}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Generate My Plan
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <RefreshCw size={28} className="text-violet-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Building your personalized roadmap...</p>
        </div>
      )}

      {plan && !loading && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400 font-medium">Week progress</span>
              <span className="text-violet-400 font-semibold">{doneCount} / {totalEx} exercises</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-700"
                style={{ width: totalEx ? `${(doneCount / totalEx) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {plan.days?.map((day, dayIdx) => {
              const allDone  = day.exercises.every((_, ei) => done[`${dayIdx}-${ei}`]);
              const anyDone  = day.exercises.some((_, ei) => done[`${dayIdx}-${ei}`]);
              const expanded = expandedDay === dayIdx;
              const totalMin = day.exercises.reduce((s, e) => s + (e.duration || 0), 0);

              return (
                <div
                  key={dayIdx}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    allDone  ? 'border-emerald-900/50 bg-emerald-950/10' :
                    anyDone  ? 'border-violet-900/50 bg-slate-900' :
                               'border-slate-800 bg-slate-900'
                  }`}
                >
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left"
                    onClick={() => setExpandedDay(expanded ? null : dayIdx)}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      allDone ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {allDone ? <Check size={15} /> : dayIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{day.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {day.exercises.length} exercises · {totalMin}min
                      </div>
                    </div>
                    {expanded
                      ? <ChevronUp  size={16} className="text-slate-600 flex-shrink-0" />
                      : <ChevronDown size={16} className="text-slate-600 flex-shrink-0" />
                    }
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-slate-800/60 pt-3">
                      {day.exercises.map((ex, exIdx) => {
                        const key        = `${dayIdx}-${exIdx}`;
                        const isComplete = done[key];
                        return (
                          <div
                            key={exIdx}
                            className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                              isComplete ? 'bg-emerald-950/20' : 'bg-slate-800/40 hover:bg-slate-800/70'
                            }`}
                          >
                            <button
                              onClick={() => toggleExercise(dayIdx, exIdx, ex)}
                              className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                isComplete
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-slate-600 hover:border-violet-500'
                              }`}
                            >
                              {isComplete && <Check size={10} className="text-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className={`font-medium text-sm ${isComplete ? 'text-slate-500 line-through' : 'text-white'}`}>
                                  {ex.name}
                                </span>
                                {ex.skill && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-md border ${SKILL_BADGE[ex.skill] || 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                                    {ex.skill}
                                  </span>
                                )}
                                <span className="text-xs text-amber-400 font-medium">+{ex.xp || 30} XP</span>
                                <span className="text-xs text-slate-600 flex items-center gap-0.5">
                                  <Clock size={10} /> {ex.duration}min
                                </span>
                                <button
                                  onClick={() => fetchRefs(dayIdx, exIdx, ex)}
                                  disabled={refs[key]?.loading}
                                  title={refs[key]?.data ? 'Refresh references' : 'Find references'}
                                  className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-violet-400 disabled:opacity-50 transition-colors"
                                >
                                  {refs[key]?.loading
                                    ? <><RefreshCw size={10} className="animate-spin" /> Loading…</>
                                    : refs[key]?.data
                                    ? <><RefreshCw size={10} /> {refs[key].data.length} refs</>
                                    : <><Image size={10} /> Find Refs</>}
                                </button>
                              </div>
                              <p className="text-slate-500 text-xs leading-relaxed">{ex.description}</p>

                              {refs[key]?.error && (
                                <p className="text-rose-400 text-xs mt-2">{refs[key].error}</p>
                              )}

                              {refs[key]?.data?.length > 0 && (
                                <div className="grid grid-cols-4 gap-1.5 mt-3">
                                  {refs[key].data.map(photo => (
                                    <button
                                      key={photo.id}
                                      onClick={() => setLightbox({ ...photo, _context: ex.name })}
                                      className="relative rounded-lg overflow-hidden aspect-video bg-slate-700 hover:ring-2 hover:ring-violet-500/60 transition-all group"
                                    >
                                      <img
                                        src={photo.thumbUrl}
                                        alt={photo.description}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        loading="lazy"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{lightbox.description}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  by{' '}
                  <a href={lightbox.authorUrl} target="_blank" rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 transition-colors">
                    {lightbox.author}
                  </a>
                  {' '}on Pixabay
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                {(() => {
                  const isSaved = savedRefs.some(r => r.id === lightbox.id);
                  return (
                    <button
                      onClick={() => isSaved ? removeSavedRef(lightbox.id) : addSavedRef(lightbox, lightbox._context || '')}
                      title={isSaved ? 'Remove from saved' : 'Save reference'}
                      className={`transition-colors p-1 ${isSaved ? 'text-violet-400 hover:text-violet-300' : 'text-slate-500 hover:text-violet-400'}`}
                    >
                      <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  );
                })()}
                <a href={lightbox.url} target="_blank" rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors p-1">
                  <ExternalLink size={15} />
                </a>
                <button onClick={() => setLightbox(null)} className="text-slate-500 hover:text-white transition-colors p-1">
                  <X size={17} />
                </button>
              </div>
            </div>
            <img src={lightbox.url} alt={lightbox.description}
              className="w-full max-h-[55vh] object-contain bg-slate-950" />
            {(similar.loading || similar.data?.length > 0) && (
              <div className="px-4 py-3 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Similar images</p>
                {similar.loading ? (
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-28 rounded-lg bg-slate-800 animate-pulse" style={{ height: '72px' }} />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {similar.data.map(photo => (
                      <button
                        key={photo.id}
                        onClick={() => setLightbox(photo)}
                        className="flex-shrink-0 w-28 rounded-lg overflow-hidden bg-slate-800 hover:ring-2 hover:ring-violet-500/60 transition-all"
                        style={{ height: '72px' }}
                      >
                        <img src={photo.thumbUrl} alt={photo.description} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
