import {searchPitStops, type PitStopSearch} from '../lib/routes.ts';

self.onmessage = ({data}: MessageEvent<PitStopSearch>) => {
  self.postMessage(searchPitStops(data));
};
