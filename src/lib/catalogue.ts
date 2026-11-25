import raw from '../../.atlas/data.json';
import type {Atlas} from './types';

// This build input is generated and validated by scripts/build_atlas.py.
export const atlas = raw as unknown as Atlas;
export const byId = new Map(atlas.places.map(place => [place.id, place]));
export const placePages = [
  ...atlas.places.map(place => ({id:place.id, props:{place}})),
  ...Object.entries(atlas.place_aliases).map(([id, redirectTo]) => ({
    id, props:{place:byId.get(redirectTo)!,redirectTo},
  })),
];
