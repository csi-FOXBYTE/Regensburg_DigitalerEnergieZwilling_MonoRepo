export type SubmissionResult = {
  deletionToken: string;
};

export type DeletionReceipt = {
  version: 1;
  auditEventId: string;
  deletedAt: string;
  action: 'SUBMISSION_DELETE' | 'BUILDING_SUBMISSIONS_DELETE';
  actorType: 'ADMIN' | 'PUBLIC_CAPABILITY';
  targetType: 'SUBMISSION' | 'BUILDING';
  targetId: string;
  deletedCount: number;
  verificationSecret: string;
};

export type MapResources = {
  terrainBaseUrl: string;
  tilesBaseUrl: string;
  addressDatabaseUrl: string;
};

export type FeedbackCategory = 'bug' | 'feedback' | 'suggestion';

export type FeedbackInput = {
  category: FeedbackCategory;
  message: string;
  emailAddress?: string;
};

export class SubmissionUnavailableError extends Error {
  constructor() {
    super('Submission unavailable');
    this.name = 'SubmissionUnavailableError';
  }
}

function parseMapResourceUrl(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Malformed map resources response: ${field}`);
  }

  const url = new URL(value, window.location.origin);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Unsupported map resource URL protocol: ${field}`);
  }
  return url.toString();
}

export async function getMapResources(): Promise<MapResources> {
  const res = await fetch('/api/public/map-resources');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const result = (await res.json()) as Record<string, unknown>;
  return {
    terrainBaseUrl: parseMapResourceUrl(
      result.terrainBaseUrl,
      'terrainBaseUrl',
    ),
    tilesBaseUrl: parseMapResourceUrl(result.tilesBaseUrl, 'tilesBaseUrl'),
    addressDatabaseUrl: parseMapResourceUrl(
      result.addressDatabaseUrl,
      'addressDatabaseUrl',
    ),
  };
}

function submissionUrl(token: string, suffix = ''): string {
  return `/api/public/submissions/${encodeURIComponent(token)}${suffix}`;
}

export async function checkSubmissionAvailability(
  token: string,
): Promise<void> {
  const res = await fetch(submissionUrl(token, '/status'), {
    method: 'GET',
    cache: 'no-store',
  });
  if (res.status === 404) throw new SubmissionUnavailableError();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const result = (await res.json()) as { available?: unknown };
  if (result.available !== true) throw new Error('Malformed status response');
}

function parseDeletionReceipt(value: unknown): DeletionReceipt {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Malformed deletion receipt');
  }
  const receipt = value as Partial<DeletionReceipt>;
  if (
    receipt.version !== 1 ||
    typeof receipt.auditEventId !== 'string' ||
    typeof receipt.deletedAt !== 'string' ||
    receipt.action !== 'SUBMISSION_DELETE' ||
    receipt.actorType !== 'PUBLIC_CAPABILITY' ||
    receipt.targetType !== 'SUBMISSION' ||
    typeof receipt.targetId !== 'string' ||
    receipt.targetId.length === 0 ||
    receipt.deletedCount !== 1 ||
    typeof receipt.verificationSecret !== 'string' ||
    receipt.verificationSecret.length !== 43
  ) {
    throw new Error('Malformed deletion receipt');
  }
  return receipt as DeletionReceipt;
}

export async function deleteSubmission(
  token: string,
): Promise<DeletionReceipt> {
  const res = await fetch(submissionUrl(token), {
    method: 'DELETE',
    cache: 'no-store',
  });
  if (res.status === 404) throw new SubmissionUnavailableError();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const result = (await res.json()) as { success?: unknown; receipt?: unknown };
  if (result.success !== true) throw new Error('Malformed deletion response');
  return parseDeletionReceipt(result.receipt);
}

export async function verifyDeletionReceipt(
  receipt: DeletionReceipt,
): Promise<boolean> {
  const res = await fetch('/api/public/submissions/deletion-receipts/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(receipt),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = (await res.json()) as { valid?: unknown };
  if (typeof result.valid !== 'boolean') {
    throw new Error('Malformed deletion receipt verification response');
  }
  return result.valid;
}

export async function submitEnergyData(params: {
  input: unknown;
  configName?: string;
  buildingId: string;
  address: string;
  longitude: number;
  latitude: number;
}): Promise<SubmissionResult> {
  const res = await fetch('/api/public/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const result = (await res.json()) as Partial<SubmissionResult>;
  if (
    typeof result.deletionToken !== 'string' ||
    result.deletionToken.length === 0
  ) {
    throw new Error('Malformed submission response');
  }
  return { deletionToken: result.deletionToken };
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  const emailAddress = input.emailAddress?.trim();
  const body = {
    category: input.category,
    message: input.message,
    ...(emailAddress ? { emailAddress } : {}),
  };

  const res = await fetch('/api/public/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
