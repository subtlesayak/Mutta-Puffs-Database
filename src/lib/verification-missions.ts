import type {Place} from './types.ts';

export const missionLabels = {details:'Add missing details',pin:'Check a map pin'} as const;
export type VerificationMission = keyof typeof missionLabels;
export const missionTypes = Object.keys(missionLabels) as VerificationMission[];

export const isVerificationMission = (value: unknown): value is VerificationMission =>
  typeof value === 'string' && Object.hasOwn(missionLabels,value);

export function placeMissions({location,verification}: Place): VerificationMission[] {
  const result: VerificationMission[] = [];
  if (verification.status === 'needs_details') result.push('details');
  if (location.accuracy === 'estimated' || location.accuracy === 'source_pin') result.push('pin');
  return result;
}

export function missionDraftRoute(place: string, mission: VerificationMission) {
  return 'contribute/?' + new URLSearchParams({kind:'correction',place,mission});
}

export function isHttpsLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !/[\s\\]/.test(value);
  } catch {return false;}
}
