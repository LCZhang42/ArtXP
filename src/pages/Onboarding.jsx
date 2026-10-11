import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

const GOALS = [
  { id: 'cute-animals',     label: 'Cute Animals',     emoji: '🐱', description: 'Adorable creatures & pets'       },
  { id: 'anime-characters', label: 'Anime / Manga',    emoji: '⭐', description: 'Japanese animation style'        },
  { id: 'portraits',        label: 'Portraits',        emoji: '👤', description: 'Human faces & expressions'       },
  { id: 'comics',           label: 'Comics',           emoji: '💬', description: 'Panels & sequential art'         },
  { id: 'concept-art',      label: 'Concept Art',      emoji: '🎨', description: 'Environment & character design'  },
  { id: 'realism',          label: 'Realism',          emoji: '🖊️',  description: 'Realistic drawing & shading'    },
];

const LEVELS = [
  { id: 'beginner',     label: 'Beginner',     desc: 'Just starting out, little to no experience'  },
  { id: 'intermediate', label: 'Intermediate', desc: 'Some experience, want to level up'           },
  { id: 'advanced',     label: 'Advanced',     desc: 'Solid foundations, refining specific skills' },
];

const TIMES = [
  { id: 15, label: '15 min', desc: 'Quick daily sketches'     },
  { id: 30, label: '30 min', desc: 'Focused practice session' },
  { id: 45, label: '45 min', desc: 'Deep skill building'      },
  { id: 60, label: '60 min', desc: 'Intensive daily training' },
];

const STEPS = [
  { title: 'What do you want to draw?',  subtitle: 'Choose your main artistic goal'    },
  { title: "What's your current level?", subtitle: 'We\'ll tailor your learning path'  },
  { title: 'How much time per day?',     subtitle: 'Consistency is more important than duration' },
];

export default function Onboarding() {
  const { setUser } = useApp();
  const [step, setStep]               = useState(0);
  const [selectedGoal, setSelectedGoal]   = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedTime, setSelectedTime]   = useState(null);

  function canProceed() {
    if (step === 0) return selectedGoal !== null;
    if (step === 1) return selectedLevel !== null;
    if (step === 2) return selectedTime !== null;
    return false;
  }

  function handleFinish() {
    const goal = GOALS.find(g => g.id === selectedGoal);
    setUser({
      goal:         goal.label,
      goalId:       selectedGoal,
      goalEmoji:    goal.emoji,
      skillLevel:   selectedLevel,
      dailyMinutes: selectedTime,
      createdAt:    new Date().toISOString(),
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-11 h-11 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50">
            <Zap size={22} className="text-white" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">ArtXP</span>
        </div>
        <p className="text-slate-500 text-sm">Your personal art learning companion</p>
      </div>

      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i < step  ? 'bg-violet-400 w-8' :
              i === step ? 'bg-violet-600 w-10' :
                           'bg-slate-800 w-5'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{STEPS[step].title}</h2>
          <p className="text-slate-400 text-sm mt-1">{STEPS[step].subtitle}</p>
        </div>

        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map(goal => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`relative p-4 rounded-2xl border text-left transition-all ${
                  selectedGoal === goal.id
                    ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-900/30'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                {selectedGoal === goal.id && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-violet-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
                <div className="text-2xl mb-2">{goal.emoji}</div>
                <div className={`font-semibold text-sm ${selectedGoal === goal.id ? 'text-white' : 'text-slate-200'}`}>
                  {goal.label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{goal.description}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {LEVELS.map(level => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  selectedLevel === level.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className={`font-semibold ${selectedLevel === level.id ? 'text-white' : 'text-slate-200'}`}>
                    {level.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{level.desc}</div>
                </div>
                {selectedLevel === level.id && (
                  <Check size={16} className="text-violet-400 flex-shrink-0 ml-3" />
                )}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {TIMES.map(time => (
              <button
                key={time.id}
                onClick={() => setSelectedTime(time.id)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  selectedTime === time.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className={`text-xl font-bold ${selectedTime === time.id ? 'text-white' : 'text-slate-200'}`}>
                  {time.label}
                </div>
                <div className="text-xs text-slate-500 mt-1">{time.desc}</div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-0 disabled:pointer-events-none transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-900/30"
            >
              Continue
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-900/30"
            >
              <Sparkles size={15} />
              Start Learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
