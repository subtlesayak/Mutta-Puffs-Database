import {path} from '../lib/format';

interface InstallPrompt extends Event {
  prompt(): Promise<unknown>;
  userChoice: Promise<{outcome: string}>;
}

export function enableApp() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    void navigator.serviceWorker.register(path('sw.js')).catch(() => {
      console.warn('The atlas could not enable offline mode.');
    });
  }
  const button = document.querySelector<HTMLButtonElement>('[data-install-app]');
  if (!button) return;
  let prompt: InstallPrompt | null = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    prompt = event as InstallPrompt;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!prompt) return;
    const active = prompt;
    prompt = null;
    button.hidden = true;
    await active.prompt().catch(() => {});
  });
  window.addEventListener('appinstalled', () => {button.hidden = true;});
}
