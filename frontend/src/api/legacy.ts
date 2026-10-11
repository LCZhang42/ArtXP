export interface LegacySnapshot {
  exportedAt: string;
  source: 'artxp-browser-local-storage';
  data: Record<string, unknown>;
  excludedKeys: string[];
}

const LEGACY_KEYS = [
  'artxp_user',
  'artxp_skills',
  'artxp_streak',
  'artxp_log',
  'artxp_plan',
  'artxp_plan_done',
  'artxp_saved_refs',
  'artxp_missions',
  'artxp_completed',
];

export function readLegacyProfile(): Record<string, unknown> | null {
  try {
    const value = localStorage.getItem('artxp_user');
    return value ? (JSON.parse(value) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function createLegacySnapshot(): LegacySnapshot {
  const data: Record<string, unknown> = {};
  for (const key of LEGACY_KEYS) {
    const value = localStorage.getItem(key);
    if (value === null) continue;
    try {
      data[key] = JSON.parse(value) as unknown;
    } catch {
      data[key] = value;
    }
  }
  return {
    exportedAt: new Date().toISOString(),
    source: 'artxp-browser-local-storage',
    data,
    excludedKeys: ['artxp_settings'],
  };
}

export function downloadLegacySnapshot(): void {
  const blob = new Blob(
    [JSON.stringify(createLegacySnapshot(), null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `artxp-local-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function clearLegacyProfile(): void {
  localStorage.removeItem('artxp_user');
}