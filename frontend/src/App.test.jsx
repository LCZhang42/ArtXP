import { vi } from 'vitest';
import { screen } from '@testing-library/react';

import App from './App';
import { renderWithQuery } from './test/render';

const api = vi.hoisted(() => ({
  bootstrapCurrentUser: vi.fn(),
  createPracticeEntry: vi.fn(),
  deletePracticeEntries: vi.fn(),
  listPracticeEntries: vi.fn().mockResolvedValue([]),
  updateProfile: vi.fn(),
}));

vi.mock('./api/client', () => api);

const EMPTY_ME = {
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
};

describe('App routing', () => {
  beforeEach(() => {
    api.listPracticeEntries.mockResolvedValue([]);
  });

  it('shows onboarding when the server profile is empty', async () => {
    api.bootstrapCurrentUser.mockResolvedValue(EMPTY_ME);
    renderWithQuery(<App />);

    expect(
      await screen.findByRole('heading', { name: 'What do you want to draw?' }),
    ).toBeInTheDocument();
  });

  it('shows the dashboard for a persisted server profile', async () => {
    api.bootstrapCurrentUser.mockResolvedValue({
      ...EMPTY_ME,
      profile: {
        ...EMPTY_ME.profile,
        goal: 'Portraits',
        goal_id: 'portraits',
        goal_emoji: '👤',
        self_reported_level: 'beginner',
        daily_minutes: 30,
      },
    });

    renderWithQuery(<App />);

    expect(
      await screen.findByRole('heading', {
        name: /good (morning|afternoon|evening)/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Portraits')).toBeInTheDocument();
  });
});