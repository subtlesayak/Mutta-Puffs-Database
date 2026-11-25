import {changePassport,type Collection,type Passport} from '../lib/passport';
import {placePath,siteUrl} from '../lib/format';
import type {PlaceAliases} from '../lib/place-identity';

export function passportCollections(
  root: HTMLElement,
  choose: HTMLSelectElement,
  labels: Map<string,string>,
  aliases: PlaceAliases,
  refresh: (passport: Passport) => void,
) {
  const form = root.querySelector<HTMLFormElement>('[data-collection-form]')!;
  const collections = root.querySelector<HTMLUListElement>('[data-passport-collections]')!;
  const menu = form.elements.namedItem('collection') as HTMLSelectElement;
  const name = form.elements.namedItem('name') as HTMLInputElement;
  const status = root.querySelector<HTMLElement>('[data-collection-status]')!;
  const undo = root.querySelector<HTMLButtonElement>('[data-undo-collection]')!;
  const copyArea = root.querySelector<HTMLElement>('[data-copy-selection]')!;
  const achievements = root.querySelector<HTMLUListElement>('[data-achievements]')!;
  let removed: Collection | undefined;
  const towns = new Map([...choose.options].map(option=>[option.value,option.dataset.city]));
  const countries = new Map([...choose.options].map(option=>[option.value,option.dataset.country]));

  function action(label: string, callback: () => void) {
    const button = document.createElement('button');
    button.className = 'button secondary small';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click',callback);
    return button;
  }
  function mutate(apply: (passport: Passport) => void, message: string) {
    try {
      refresh(changePassport(localStorage,apply,aliases));
      status.textContent = message;
      return true;
    } catch {
      status.textContent = 'This browser could not update the collection.';
      return false;
    }
  }
  async function share(text: string, label: string) {
    copyArea.hidden = true;
    try {
      if (navigator.share) {await navigator.share({title:label,text}); return;}
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copied to the clipboard.';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      const input = copyArea.querySelector('textarea')!;
      input.value = text;
      copyArea.hidden = false;
      input.focus();
      input.select();
    }
  }
  function visibility() {
    name.disabled = Boolean(menu.value);
    name.closest('label')!.hidden = name.disabled;
  }
  menu.addEventListener('input',visibility);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!choose.reportValidity()) {choose.focus(); return;}
    const collection = menu.value;
    const label = name.value.trim();
    const place = choose.value;
    if (!collection && !label) {name.focus(); return;}
    if (mutate(book => {
      book.collections ??= [];
      const existing = book.collections.find(item=>item.id === collection);
      if (existing) {
        if (!existing.placeIds.includes(place)) existing.placeIds.push(place);
      } else book.collections.push({id:crypto.randomUUID(),name:label,placeIds:[place]});
    },'Place added to the collection.')) name.value = '';
  });
  undo.addEventListener('click', () => {
    if (!removed) return;
    const previous = removed;
    removed = undefined;
    if (mutate(book => {
      book.collections ??= [];
      if (!book.collections.some(item=>item.id === previous.id)) book.collections.push(previous);
    },'Collection restored.')) menu.focus();
    else removed = previous;
  });

  return (book: Passport) => {
    const selected = menu.value;
    const items = book.collections ?? [];
    menu.replaceChildren(new Option('Create a collection',''),...items.map(item=>new Option(item.name,item.id)));
    if (items.some(item=>item.id === selected)) menu.value = selected;
    visibility();
    undo.hidden = removed === undefined;
    collections.replaceChildren(...items.map(item => {
      const row = document.createElement('li');
      const heading = document.createElement('h3');
      heading.textContent = item.name;
      const places = document.createElement('ul');
      for (const id of item.placeIds) {
        const link = document.createElement('a');
        link.href = placePath(id);
        link.textContent = labels.get(id) ?? 'Archived puff spot';
        const li = document.createElement('li');
        li.append(link);
        places.append(li);
      }
      const controls = document.createElement('div');
      controls.className = 'actions';
      controls.append(action('Share collection',() => {
        const lines = item.placeIds.map(id=>(labels.get(id) ?? 'Archived puff spot') + ' ' + new URL(placePath(id),siteUrl).href);
        void share([item.name,...lines].join('\n'),item.name);
      }),action('Remove collection',() => {
        removed = item;
        if (mutate(book => {book.collections = book.collections?.filter(entry=>entry.id !== item.id);},'Collection removed. You can undo it.')) undo.focus();
        else removed = undefined;
      }));
      row.append(heading,places,controls);
      return row;
    }));
    const visited = new Set(book.visits.map(visit=>visit.placeId));
    const cities = new Set([...visited].map(id=>towns.get(id)).filter(Boolean));
    const nations = new Set([...visited].map(id=>countries.get(id)).filter(Boolean));
    const unlocked = [
      {name:'First stamp',description:'Logged a first bakery visit',earned:book.visits.length > 0},
      {name:'Five bakeries',description:'Logged visits to five different bakeries',earned:visited.size >= 5},
      {name:'Three cities',description:'Logged puff visits in at least three cities',earned:cities.size >= 3},
      {name:'Puffs across borders',description:'Logged puff visits in two countries',earned:nations.size >= 2},
    ].filter(item=>item.earned);
    root.querySelector<HTMLElement>('[data-achievements-empty]')!.hidden = unlocked.length > 0;
    achievements.replaceChildren(...unlocked.map(item => {
      const element = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = item.name;
      const description = document.createElement('p');
      description.textContent = item.description;
      const button = action('Share achievement',()=>void share(item.name + ' · ' + item.description + '\n' + siteUrl.href,item.name));
      button.setAttribute('aria-label','Share achievement: ' + item.name);
      element.append(label,description,button);
      return element;
    }));
  };
}
