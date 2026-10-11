import { vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithQuery } from '../test/render';
import { AppProvider, useApp } from './AppContext';

vi.mock('../api/client', () => ({
  bootstrapCurrentUser: vi.fn().mockResolvedValue({
    id: 'user-1',
    email: 'developer@artxp.local',
    locale: 'en',
    timezone: 'UTC',
    created_at: '2026-10-11T00:00:00+00:00',
    profile: {
      goal: null,
      goal_id: null,
      goal_emoji: null,
      self_reported_level: null,
      daily_minutes: null,
      medium_preferences: [],
      style_preferences: [],
    },
  }),
  createPracticeEntry: vi.fn(),
  deletePracticeEntries: vi.fn(),
  listPracticeEntries: vi.fn().mockResolvedValue([]),
  updateProfile: vi.fn(),
}));

function SkillProbe() {
  const { skills, completeExercise } = useApp();
  const gesture = skills.gesture;

  return (
    <div>
      <span>Level {gesture.level}</span>
      <span>XP {gesture.xp}</span>
      <button onClick={() => completeExercise({ skill: 'gesture', xp: 100 })}>
        Complete
      </button>
    </div>
  );
}

describe('AppContext progression', () => {
  it('levels a skill and persists the updated state', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <AppProvider>
        <SkillProbe />
      </AppProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Complete' }));

    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('XP 0')).toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem('artxp_skills')).gesture,
    ).toMatchObject({ level: 2, xp: 0 });
  });
});