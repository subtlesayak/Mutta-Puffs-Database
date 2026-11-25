export type PlaceAliases = Readonly<Record<string, string>>;

export function resolvePlaceId(id: string, aliases: PlaceAliases = {}): string {
  return Object.hasOwn(aliases, id) ? aliases[id] : id;
}

export function pagePlaceAliases(): PlaceAliases {
  return JSON.parse(document.body.dataset.placeAliases ?? '{}') as PlaceAliases;
}
