type Event =
  | {name:'directions'; data:{provider:string}}
  | {name:'city_selected'; data:{city:string}}
  | {name:'no_results'}
  | {name:'contribution_handoff'; data:{kind:string}};

const preference = 'mpdb-allow-analytics';
const website = (import.meta.env.PUBLIC_UMAMI_WEBSITE_ID ?? '').trim();
const configuredUrl = (import.meta.env.PUBLIC_UMAMI_SEND_URL ?? '').trim();
let endpoint: URL | undefined;
if (configuredUrl && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(website)) {
  try {
    const url = new URL(configuredUrl);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname.endsWith('/api/send')) endpoint = url;
  } catch {}
}
export const analyticsConfigured = Boolean(endpoint);

function allowed() {
  try {return localStorage.getItem(preference) === 'yes';}
  catch {return false;}
}

export function track(event?: Event) {
  if (!endpoint || !allowed()) return;
  const browser = navigator as Navigator & {globalPrivacyControl?: boolean};
  if (browser.globalPrivacyControl || browser.doNotTrack === '1') return;
  const payload = {website,hostname:location.hostname,url:location.pathname,...event};
  void fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({type:'event',payload}),credentials:'omit',referrerPolicy:'no-referrer',keepalive:true}).catch(() => {});
}

export function startAnalytics() {
  if (!endpoint) return;
  const button = document.querySelector<HTMLButtonElement>('[data-analytics-preference]');
  const notice = document.querySelector<HTMLElement>('[data-analytics-notice]');
  if (button && notice) {
    function renderPreference() {
      const permitted = allowed();
      button!.setAttribute('aria-pressed',String(permitted));
      notice!.textContent = permitted ? 'Usage analytics allowed in this browser.' : 'Usage analytics off in this browser.';
    }
    renderPreference();
    button.addEventListener('click',() => {
      try {
        const enable = !allowed();
        localStorage.setItem(preference,enable ? 'yes' : 'no');
        renderPreference();
        if (enable) track();
      } catch {notice.textContent = 'Could not save the preference. Check your browser’s site storage settings.';}
    });
    window.addEventListener('storage',renderPreference);
  }
  if (!/\/(?:passport|wrapped|contribute|share)\/$/.test(location.pathname)) track();
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const provider = event.target.closest<HTMLElement>('[data-directions]')?.dataset.directions;
    if (provider) track({name:'directions',data:{provider}});
  });
}
