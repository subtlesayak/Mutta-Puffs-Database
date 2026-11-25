declare module 'geobuf' {
  import type {GeoJSON} from 'geojson';
  import type {PbfReader} from 'pbf';

  export function decode(pbf: PbfReader): GeoJSON;
}
