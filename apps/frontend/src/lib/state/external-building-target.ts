export type ExternalBuildingTarget = {
  buildingId: string;
  latitudeDegrees: number;
  longitudeDegrees: number;
};

export type ExternalBuildingTargetParseResult =
  | { status: 'absent' }
  | { status: 'invalid' }
  | { status: 'valid'; target: ExternalBuildingTarget };

const RESERVED_PARAMETERS = ['buildingId', 'lat', 'lon'] as const;

export function parseExternalBuildingTarget(
  fragment: string | URLSearchParams,
): ExternalBuildingTargetParseResult {
  const parameters =
    typeof fragment === 'string'
      ? new URLSearchParams(fragment.replace(/^#/, ''))
      : fragment;
  const hasReservedParameter = RESERVED_PARAMETERS.some((parameter) =>
    parameters.has(parameter),
  );
  if (!hasReservedParameter) return { status: 'absent' };

  const buildingId = parameters.get('buildingId');
  const latitudeText = parameters.get('lat');
  const longitudeText = parameters.get('lon');
  if (
    buildingId === null ||
    buildingId.trim() === '' ||
    latitudeText === null ||
    latitudeText.trim() === '' ||
    longitudeText === null ||
    longitudeText.trim() === ''
  ) {
    return { status: 'invalid' };
  }

  const latitudeDegrees = Number(latitudeText);
  const longitudeDegrees = Number(longitudeText);
  if (
    !Number.isFinite(latitudeDegrees) ||
    latitudeDegrees < -90 ||
    latitudeDegrees > 90 ||
    !Number.isFinite(longitudeDegrees) ||
    longitudeDegrees < -180 ||
    longitudeDegrees > 180
  ) {
    return { status: 'invalid' };
  }

  return {
    status: 'valid',
    target: { buildingId, latitudeDegrees, longitudeDegrees },
  };
}

export class ExternalBuildingTargetLifecycle {
  private pendingTarget: ExternalBuildingTarget | null = null;
  private controlsVisit = false;
  private invalidWarningPending = false;

  initialize(
    fragment: string | URLSearchParams,
    restoredFromLink: boolean,
  ): ExternalBuildingTargetParseResult | { status: 'ignored' } {
    this.pendingTarget = null;
    this.controlsVisit = false;
    this.invalidWarningPending = false;

    if (restoredFromLink) return { status: 'ignored' };

    const result = parseExternalBuildingTarget(fragment);
    if (result.status === 'valid') {
      this.pendingTarget = result.target;
      this.controlsVisit = true;
    } else if (result.status === 'invalid') {
      this.invalidWarningPending = true;
    }
    return result;
  }

  suppressesSessionResume(): boolean {
    return this.controlsVisit;
  }

  consumePendingTarget(): ExternalBuildingTarget | null {
    const target = this.pendingTarget;
    this.pendingTarget = null;
    return target;
  }

  consumeInvalidWarning(): boolean {
    const pending = this.invalidWarningPending;
    this.invalidWarningPending = false;
    return pending;
  }
}

const lifecycle = new ExternalBuildingTargetLifecycle();

export function initializeExternalBuildingTarget(
  fragment: string | URLSearchParams,
  restoredFromLink: boolean,
) {
  return lifecycle.initialize(fragment, restoredFromLink);
}

export function externalTargetSuppressesSessionResume(): boolean {
  return lifecycle.suppressesSessionResume();
}

export function consumePendingExternalBuildingTarget(): ExternalBuildingTarget | null {
  return lifecycle.consumePendingTarget();
}

export function consumeInvalidExternalTargetWarning(): boolean {
  return lifecycle.consumeInvalidWarning();
}
