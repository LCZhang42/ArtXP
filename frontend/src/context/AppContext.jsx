import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  bootstrapCurrentUser,
  createPracticeEntry,
  deletePracticeEntries,
  listPracticeEntries,
  updateProfile,
} from '../api/client';
import {
  clearLegacyProfile,
  downloadLegacySnapshot,
  readLegacyProfile,
} from '../api/legacy';

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

function profileToUser(me) {
  if (!me?.profile?.goal) return null;
  return {
    id: me.id,
    email: me.email,
    goal: me.profile.goal,
    goalId: me.profile.goal_id,
    goalEmoji: me.profile.goal_emoji,
    skillLevel: me.profile.self_reported_level,
    dailyMinutes: me.profile.daily_minutes,
    createdAt: me.created_at,
  };
}

function apiEntryToLocal(entry) {
  return {
    id: entry.id,
    date: entry.practiced_at,
    note: entry.note,
    exercise: entry.exercise,
    skill: entry.skill,
    image: entry.image_url,
    artworkId: entry.artwork_id,
    xp: entry.xp_earned,
  };
}

export function AppProvider({ children }) {
  const queryClient = useQueryClient();
  const [legacyProfile, setLegacyProfile] = useState(() => readLegacyProfile());

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: bootstrapCurrentUser,
    retry: false,
  });

  const practiceQuery = useQuery({
    queryKey: ['practice-entries'],
    queryFn: listPracticeEntries,
    enabled: Boolean(meQuery.data),
    retry: false,
  });

  const user = profileToUser(meQuery.data);

  const [skills, setSkills] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_skills')) || INITIAL_SKILLS; } catch { return INITIAL_SKILLS; }
  });

  const [streak, setStreak] = useState(() => {
    try { return JSON.parse(localStorage.getItem('artxp_streak')) || { count: 0, lastDate: null }; } catch { return { count: 0, lastDate: null }; }
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

  useEffect(() => { localStorage.setItem('artxp_skills', JSON.stringify(skills)); }, [skills]);
  useEffect(() => { localStorage.setItem('artxp_streak', JSON.stringify(streak)); }, [streak]);
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

  async function addPracticeEntry(entry) {
    const saved = await createPracticeEntry(entry);
    queryClient.setQueryData(
      ['practice-entries'],
      previous => [saved, ...(previous || [])],
    );
    completeExercise({ skill: entry.skill, xp: saved.xp_earned });
    return saved;
  }

  async function setUser(userData) {
    const me = await updateProfile({
      goal: userData.goal,
      goal_id: userData.goalId,
      goal_emoji: userData.goalEmoji,
      self_reported_level: userData.skillLevel,
      daily_minutes: userData.dailyMinutes,
    });
    queryClient.setQueryData(['me'], me);
    return me;
  }

  async function importLegacyProfile() {
    if (!legacyProfile) return;
    await setUser({
      goal: legacyProfile.goal,
      goalId: legacyProfile.goalId,
      goalEmoji: legacyProfile.goalEmoji,
      skillLevel: legacyProfile.skillLevel,
      dailyMinutes: legacyProfile.dailyMinutes,
    });
    clearLegacyProfile();
    setLegacyProfile(null);
  }

  function dismissLegacyProfile() {
    setLegacyProfile(null);
  }

  function setPlan(data) {
    setPlanState(data);
  }

  function setSettings(data) {
    setSettingsState(data);
  }

  async function resetProgress() {
    await deletePracticeEntries();
    queryClient.setQueryData(['practice-entries'], []);
    await updateProfile({
      goal: null,
      goal_id: null,
      goal_emoji: null,
      self_reported_level: null,
      daily_minutes: null,
    });
    queryClient.setQueryData(['me'], me => me ? {
      ...me,
      profile: {
        ...me.profile,
        goal: null,
        goal_id: null,
        goal_emoji: null,
        self_reported_level: null,
        daily_minutes: null,
      },
    } : me);
    setSkills(INITIAL_SKILLS);
    setStreak({ count: 0, lastDate: null });
    setPlanState(null);
    setSettingsState({ geminiKey: '', pixabayKey: '' });
    setSavedRefs([]);
    Object.keys(localStorage)
      .filter(k => k.startsWith('artxp_'))
      .forEach(k => localStorage.removeItem(k));
  }

  const practiceLog = useMemo(
    () => (practiceQuery.data || []).map(apiEntryToLocal),
    [practiceQuery.data],
  );

  const totalXP = Object.values(skills).reduce(
    (sum, s) => sum + (s.level - 1) * XP_PER_LEVEL + s.xp,
    0
  );

  return (
    <AppContext.Provider value={{
      user, setUser,
      authLoading: meQuery.isPending,
      authError: meQuery.error,
      retryConnection: meQuery.refetch,
      legacyProfile,
      importLegacyProfile,
      dismissLegacyProfile,
      exportLegacyData: downloadLegacySnapshot,
      skills, addXP,
      streak,
      practiceLog,
      practiceLoading: practiceQuery.isPending,
      practiceError: practiceQuery.error,
      addPracticeEntry,
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
