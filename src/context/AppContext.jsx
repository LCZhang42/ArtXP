import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const INITIAL_SKILLS = {
  gesture:     { name: 'Gesture',     level: 1, xp: 0 },
  anatomy:     { name: 'Anatomy',     level: 1, xp: 0 },
  perspective: { name: 'Perspective', level: 1, xp: 0 },
  composition: { name: 'Composition', level: 1, xp: 0 },
  lighting:    { name: 'Lighting',    level: 1, xp: 0 },
  linework:    { name: 'Linework',    level: 1, xp: 0 },
};

const XP_PER_LEVEL = 100;

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_user')); } catch { return null; }
  });

  const [skills, setSkills] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_skills')) || INITIAL_SKILLS; } catch { return INITIAL_SKILLS; }
  });

  const [streak, setStreak] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_streak')) || { count: 0, lastDate: null }; } catch { return { count: 0, lastDate: null }; }
  });

  const [practiceLog, setPracticeLog] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_log')) || []; } catch { return []; }
  });

  const [plan, setPlanState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_plan')); } catch { return null; }
  });

  const [savedRefs, setSavedRefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_saved_refs')) || []; } catch { return []; }
  });

  const [settings, setSettingsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_settings')) || { geminiKey: '', pixabayKey: '' }; } catch { return { geminiKey: '', pixabayKey: '' }; }
  });

  useEffect(() => {
    if (user) localStorage.setItem('artxp_user', JSON.stringify(user));
    else localStorage.removeItem('artxp_user');
  }, [user]);

  useEffect(() => { localStorage.setItem('artxp_skills', JSON.stringify(skills)); }, [skills]);
  useEffect(() => { localStorage.setItem('artxp_streak', JSON.stringify(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem('artxp_log', JSON.stringify(practiceLog)); }, [practiceLog]);
  useEffect(() => { if (plan) localStorage.setItem('artxp_plan', JSON.stringify(plan)); }, [plan]);
  useEffect(() => { localStorage.setItem('artxp_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('artxp_saved_refs', JSON.stringify(savedRefs)); }, [savedRefs]);

  function addXP(skillKey, amount) {
    setSkills(prev => {
      const skill = prev[skillKey];
      if (!skill) return prev;
      let newXP = skill.xp + amount;
      let newLevel = skill.level;
      const threshold = XP_PER_LEVEL * newLevel;
      if (newXP >= threshold) {
        newXP -= threshold;
        newLevel += 1;
      }
      return { ...prev, [skillKey]: { ...skill, xp: newXP, level: newLevel } };
    });
  }

  function updateStreak() {
    const today = new Date().toDateString();
    setStreak(prev => {
      if (prev.lastDate === today) return prev;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (prev.lastDate === yesterday.toDateString()) {
        return { count: prev.count + 1, lastDate: today };
      }
      return { count: 1, lastDate: today };
    });
  }

  function completeExercise({ skill, xp = 30 }) {
    updateStreak();
    if (skill) addXP(skill, xp);
  }

  function addSavedRef(photo, context = '') {
    setSavedRefs(prev => {
      if (prev.find(r => r.id === photo.id)) return prev;
      return [{ ...photo, context, savedAt: Date.now() }, ...prev];
    });
  }

  function removeSavedRef(photoId) {
    setSavedRefs(prev => prev.filter(r => r.id !== photoId));
  }

  function addPracticeEntry(entry) {
    const newEntry = { id: Date.now(), date: new Date().toISOString(), ...entry };
    setPracticeLog(prev => [newEntry, ...prev]);
    completeExercise({ skill: entry.skill, xp: 30 });
  }

  function setUser(userData) {
    setUserState(userData);
  }

  function setPlan(data) {
    setPlanState(data);
  }

  function setSettings(data) {
    setSettingsState(data);
  }

  function resetProgress() {
    setUserState(null);
    setSkills(INITIAL_SKILLS);
    setStreak({ count: 0, lastDate: null });
    setPracticeLog([]);
    setPlanState(null);
    Object.keys(localStorage)
      .filter(k => k.startsWith('artxp_'))
      .forEach(k => localStorage.removeItem(k));
  }

  const totalXP = Object.values(skills).reduce(
    (sum, s) => sum + (s.level - 1) * XP_PER_LEVEL + s.xp,
    0
  );

  return (
    <AppContext.Provider value={{
      user, setUser,
      skills, addXP,
      streak,
      practiceLog, addPracticeEntry,
      plan, setPlan,
      settings, setSettings,
      savedRefs, addSavedRef, removeSavedRef,
      completeExercise,
      resetProgress,
      totalXP,
      XP_PER_LEVEL,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// This hook intentionally shares the context module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  return useContext(AppContext);
}
