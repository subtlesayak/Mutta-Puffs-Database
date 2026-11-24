export type Accuracy = 'estimated' | 'source_pin' | 'verified' | 'unknown';
export type Verification = 'unverified' | 'needs_details' | 'verified';
export type Provider = 'google_maps' | 'apple_maps' | 'openstreetmap';

export interface Location {
  latitude: number | null;
  longitude: number | null;
  accuracy: Accuracy;
  locality: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  location: Location;
  verification: {status: Verification; last_verified: string | null; reference: string | null};
  source: {kind: 'original_maps_export' | 'community'; reference: string | null; source_row: number | null; import_key: string | null};
  map_links: Partial<Record<Provider, string>>;
  note: string | null;
  photos: {url: string; alt: string; credit: string; license: string; source: string; captured_on?: string}[];
}

export interface City {
  id: string;
  name: string;
  state: string | null;
  country: string | null;
  centre: [number, number] | null;
  count: number;
  place_ids: string[];
}

export interface Review {
  id: string;
  place_id: string;
  visited_on: string;
  source: string;
  scores: {pastry: number; filling: number; egg: number; freshness: number; value: number};
  note: string;
}

export interface Observation {
  id: string;
  place_id: string;
  observed_on: string;
  source: string;
  price?: {amount: number; currency: string};
  egg_portion?: 'whole' | 'half' | 'other' | 'eggless';
  fresh_batch_times?: string[];
  availability?: 'available' | 'sold_out' | 'no_longer_sold';
}

export interface Trail {id: string; name: string; description: string; place_ids: string[]}
export interface PuffScore {count: number; score: number; adjusted: number; breakdown: Review['scores']}
export interface ReportedPrice {amount: number; currency: string; observed_on: string; source: string}
export interface PlaceMetrics {score?: PuffScore; price?: ReportedPrice}
export interface PriceMonth {month: string; median: number; shop_count: number; first_observed: string; last_observed: string; index: number | null}
export interface Atlas {
  schema_version: 1;
  places: Place[];
  cities: City[];
  reviews: Review[];
  observations: Observation[];
  trails: Trail[];
  place_metrics: Record<string, PlaceMetrics>;
  leaderboard: {
    ranking: (PuffScore & {place_id: string})[];
    status: 'ready' | 'collecting_reviews';
    policy: {weights: Review['scores']; minimum_reviews: number; prior_score: number; prior_reviews: number};
  };
  price_index: {
    minimum_shops: number;
    series: {city_id: string; currency: string; baseline: string | null; months: PriceMonth[]}[];
  };
  stats: {
    places: number; mappable: number; countries: Record<string, number>; states: Record<string, number>;
    districts: Record<string, number>; accuracy: Partial<Record<Accuracy, number>>;
    verification: Partial<Record<Verification, number>>; reviews: number; observations: number; cities: number; notes: number;
    archive: {rows: number; linked: number; mappable: number; notes: number; india_districts: Record<string, number>; city_areas: Record<string, number>; place_types: Record<string, number>};
    duplicate_candidates: {place_ids: [string, string]; distance_km: number | null}[];
  };
}
