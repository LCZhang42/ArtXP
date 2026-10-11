import { createLegacySnapshot } from './legacy';

describe('legacy data export', () => {
  it('excludes API credentials while retaining migratable data', () => {
    localStorage.setItem('artxp_user', JSON.stringify({ goal: 'Portraits' }));
    localStorage.setItem(
      'artxp_settings',
      JSON.stringify({ geminiKey: 'secret', pixabayKey: 'also-secret' }),
    );

    const snapshot = createLegacySnapshot();

    expect(snapshot.data.artxp_user).toEqual({ goal: 'Portraits' });
    expect(snapshot.data).not.toHaveProperty('artxp_settings');
    expect(snapshot.excludedKeys).toContain('artxp_settings');
    expect(JSON.stringify(snapshot)).not.toContain('secret');
  });
});