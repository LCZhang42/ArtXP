import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useApp } from './AppContext';

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
    render(
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
