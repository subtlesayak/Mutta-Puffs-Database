import raw from '../../.atlas/data.json';
import type {Atlas} from './types';

// This build input is generated and validated by scripts/build_atlas.py.
export const atlas = raw as unknown as Atlas;
export const byId = new Map(atlas.places.map(place => [place.id, place]));
