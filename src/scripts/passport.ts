import {changePassport, readPassport, today, toggleSaved} from '../lib/passport';
import type {Passport, Visit} from '../lib/passport';
import {formatDate, formatPrice, placePath} from '../lib/format';

export function startPassport() {
  const root = document.querySelector<HTMLElement>('[data-passport]')!;
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const form = find<HTMLFormElement>('[data-visit-form]');
  const choose = find<HTMLSelectElement>('[name=place]');
  const date = find<HTMLInputElement>('[name=date]');
  const status = find<HTMLElement>('[data-passport-status]');
  const undo = find<HTMLButtonElement>('[data-undo]');
  const save = find<HTMLButtonElement>('[data-save-place]');
  let removed: Visit | null = null;
  const labels = new Map([...choose.options].slice(1).map(option => [option.value,option.text]));
  date.value = date.max = today();
  const requested = new URLSearchParams(location.search).get('place');
  if (requested && labels.has(requested)) choose.value = requested;

  function listing(id: string) {
    const link = document.createElement('a');
    link.href = placePath(id);
    link.textContent = labels.get(id) ?? 'Archived puff spot';
    return link;
  }
  function removeButton(label: string, action: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button secondary small';
    button.textContent = label;
    button.addEventListener('click',action);
    return button;
  }
  function paragraph(text: string) {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  }
  function render(passport: Passport) {
    const stamps = [...new Set(passport.visits.map(visit => visit.placeId))];
    const cities = new Set(stamps.map(id => [...choose.options].find(option => option.value === id)?.dataset.city).filter(Boolean));
    find('[data-stamp-count]').textContent = stamps.length + (stamps.length === 1 ? ' bakery stamp' : ' bakery stamps') + ' · ' + cities.size + (cities.size === 1 ? ' city' : ' cities');
    find('[data-stamps]').replaceChildren(...stamps.map(id => {
      const li = document.createElement('li');
      li.append(listing(id));
      return li;
    }));
    find('[data-saved-empty]').hidden = !!passport.saved.length;
    find('[data-saved]').replaceChildren(...passport.saved.map(id => {
      const li = document.createElement('li');
      const button = removeButton('Remove from saved', () => {
        if (mutate(book => {book.saved = book.saved.filter(place => place !== id);},'Removed from saved places.')) save.focus();
      });
      button.setAttribute('aria-label','Remove ' + (labels.get(id) ?? 'place') + ' from saved');
      li.append(listing(id),document.createElement('br'),button);
      return li;
    }));
    find('[data-history-empty]').hidden = !!passport.visits.length;
    find('[data-visits]').replaceChildren(...[...passport.visits].sort((a,b) => b.date.localeCompare(a.date)).map(visit => {
      const li = document.createElement('li');
      const button = removeButton('Remove visit', () => {
        removed = visit;
        if (mutate(book => {book.visits = book.visits.filter(item => item.id !== visit.id);},'Visit removed. You can undo it.')) undo.focus();
        else removed = null;
      });
      button.setAttribute('aria-label','Remove visit to ' + (labels.get(visit.placeId) ?? 'place') + ' on ' + formatDate(visit.date));
      li.append(listing(visit.placeId),paragraph(formatDate(visit.date)));
      if (visit.spent) li.append(paragraph(formatPrice(visit.spent.amount,visit.spent.currency)));
      if (visit.note) li.append(paragraph(visit.note));
      li.append(button);
      return li;
    }));
    undo.hidden = removed === null;
  }
  function mutate(update: (passport: Passport) => void, message: string) {
    try {
      render(changePassport(localStorage,update));
      status.textContent = message;
      return true;
    } catch {
      status.textContent = 'Could not update this passport. Check whether this browser allows site storage.';
      return false;
    }
  }

  try {
    render(readPassport(localStorage));
    find('[data-passport-content]').hidden = false;
  } catch {
    status.textContent = 'Could not open this passport. Check whether this browser allows site storage.';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const amount = String(data.get('amount') ?? '');
    const currency = String(data.get('currency') ?? '').trim().toUpperCase();
    if (amount && !/^[A-Z]{3}$/.test(currency)) {
      status.textContent = 'Enter the three-letter currency code for the amount, such as INR.';
      find<HTMLInputElement>('[name=currency]').focus();
      return;
    }
    const visit: Visit = {id:crypto.randomUUID(),placeId:choose.value,date:date.value,note:String(data.get('note') ?? '').trim()};
    if (amount) visit.spent = {amount:Number(amount),currency};
    if (mutate(book => book.visits.push(visit),'Visit logged in your passport.')) {
      form.reset();
      choose.value = visit.placeId;
      date.value = today();
    }
  });
  undo.addEventListener('click', () => {
    if (!removed) return;
    const visit = removed;
    removed = null;
    if (mutate(book => {if (!book.visits.some(item => item.id === visit.id)) book.visits.push(visit);},'Visit restored.')) choose.focus();
    else removed = visit;
  });
  save.addEventListener('click', () => {
    if (!choose.reportValidity()) return;
    if (mutate(book => {if (!book.saved.includes(choose.value)) book.saved.push(choose.value);},'Place saved for later.')) save.focus();
  });
  window.addEventListener('storage', () => {
    try {render(readPassport(localStorage));} catch {}
  });
}

export function enablePlaceBookmark() {
  const button = document.querySelector<HTMLButtonElement>('[data-bookmark]');
  if (!button) return;
  const id = button.dataset.bookmark!;
  const status = document.querySelector<HTMLElement>('[data-bookmark-status]')!;
  try {
    button.setAttribute('aria-pressed',String(readPassport(localStorage).saved.includes(id)));
    button.hidden = false;
  } catch {}
  button.addEventListener('click', () => {
    try {
      const saved = toggleSaved(localStorage,id).saved.includes(id);
      button.setAttribute('aria-pressed',String(saved));
      status.textContent = saved ? 'Saved to your passport.' : 'Removed from saved places.';
    } catch {
      status.textContent = 'Could not save this place. Open your passport to check site storage.';
    }
  });
}
