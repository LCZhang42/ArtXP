import { render, screen } from '@testing-library/react';
import App from './App';

const TEST_USER = {
  goal: 'Portraits',
  goalId: 'portraits',
  goalEmoji: '👤',
  skillLevel: 'beginner',
  dailyMinutes: 30,
  createdAt: '2026-10-10T00:00:00.000Z',
};

describe('App routing', () => {
  it('shows onboarding when no local user exists', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'What do you want to draw?' }),
    ).toBeInTheDocument();
  });

  it('shows the dashboard for an existing local user', () => {
    window.localStorage.setItem('artxp_user', JSON.stringify(TEST_USER));

    render(<App />);

    expect(screen.getByText('Portraits')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /good (morning|afternoon|evening)/i }),
    ).toBeInTheDocument();
  });
});
