import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OpenRouterVisionTest from './OpenRouterVisionTest';
import { testOpenRouterVision } from '../api/client';

vi.mock('../api/client', () => ({
  testOpenRouterVision: vi.fn(),
}));

describe('OpenRouterVisionTest', () => {
  it('sends the key without persisting or rendering it', async () => {
    const user = userEvent.setup();
    testOpenRouterVision.mockResolvedValue({
      analysis: {
        summary: 'A figure study.',
        observations: [
          {
            area: 'composition',
            observation: 'The subject is centered.',
            confidence: 0.9,
          },
        ],
      },
      model: 'test/vision-model',
      usage: { total_tokens: 30, cost: 0.001 },
      latency_ms: 120,
      persisted: false,
    });
    render(<OpenRouterVisionTest />);

    const secret = 'sk-or-v1-browser-secret';
    await user.type(screen.getByPlaceholderText('sk-or-v1-...'), secret);
    const file = new File(['image-bytes'], 'study.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/choose a jpeg/i), file);
    await user.click(screen.getByRole('button', { name: 'Run isolated vision test' }));

    expect(await screen.findByText('Connection succeeded')).toBeInTheDocument();
    expect(testOpenRouterVision).toHaveBeenCalledWith({
      apiKey: secret,
      model: 'google/gemini-3.8-flash',
      image: file,
    });
    expect(JSON.stringify({ ...localStorage })).not.toContain(secret);
    expect(document.body.textContent).not.toContain(secret);
  });
});