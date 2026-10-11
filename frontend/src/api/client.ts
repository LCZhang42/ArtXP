import type { components } from './schema';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export type MeResponse = components['schemas']['MeResponse'];
export type ProfilePatch = components['schemas']['ProfilePatch'];
export type PracticeEntryResponse =
  components['schemas']['PracticeEntryResponse'];
export type UploadIntentRequest =
  components['schemas']['UploadIntentRequest'];
export type UploadIntentResponse =
  components['schemas']['UploadIntentResponse'];

export interface NewPracticeEntry {
  note: string;
  exercise: string;
  skill: string;
  file?: File | null;
  practicedAt?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const error = (await response.json()) as { detail?: string };
      if (typeof error.detail === 'string') message = error.detail;
    } catch {
      // Keep the status-based fallback for non-JSON errors.
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getCurrentUser(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/me');
}

export async function createDevelopmentSession(): Promise<void> {
  await apiRequest<void>('/auth/dev-session', {
    method: 'POST',
    body: JSON.stringify({ email: 'developer@artxp.local' }),
  });
}

export async function bootstrapCurrentUser(): Promise<MeResponse> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      import.meta.env.DEV
    ) {
      await createDevelopmentSession();
      return getCurrentUser();
    }
    throw error;
  }
}

export async function updateProfile(
  profile: ProfilePatch,
): Promise<MeResponse> {
  return apiRequest<MeResponse>('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  });
}

export async function listPracticeEntries(): Promise<
  PracticeEntryResponse[]
> {
  return apiRequest<PracticeEntryResponse[]>('/practice-entries');
}

export async function deletePracticeEntries(): Promise<void> {
  await apiRequest<void>('/practice-entries', { method: 'DELETE' });
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function uploadArtwork(
  file: File,
  skill: string,
): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are supported.');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Images must be 20 MB or smaller.');
  }

  const sha256 = toHex(
    await crypto.subtle.digest('SHA-256', await file.arrayBuffer()),
  );
  const intent: UploadIntentRequest = {
    filename: file.name,
    content_type: file.type as UploadIntentRequest['content_type'],
    size_bytes: file.size,
    sha256,
    context: { skill, source: 'practice_log' },
  };
  const slot = await apiRequest<UploadIntentResponse>(
    '/artworks/upload-intents',
    {
      method: 'POST',
      body: JSON.stringify(intent),
    },
  );
  const upload = await fetch(slot.upload_url, {
    method: slot.method,
    headers: slot.headers,
    body: file,
  });
  if (!upload.ok) {
    throw new Error(`Artwork upload failed with status ${upload.status}.`);
  }
  await apiRequest(
    `/artworks/${slot.artwork_id}/complete-upload`,
    { method: 'POST' },
  );
  return slot.artwork_id;
}

export async function createPracticeEntry(
  entry: NewPracticeEntry,
): Promise<PracticeEntryResponse> {
  const artworkId = entry.file
    ? await uploadArtwork(entry.file, entry.skill)
    : null;
  return apiRequest<PracticeEntryResponse>('/practice-entries', {
    method: 'POST',
    body: JSON.stringify({
      artwork_id: artworkId,
      note: entry.note,
      exercise: entry.exercise,
      skill: entry.skill,
      practiced_at: entry.practicedAt ?? null,
    }),
  });
}