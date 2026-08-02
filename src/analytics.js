const POSTHOG_KEY =
  import.meta.env.VITE_POSTHOG_KEY ||
  'phc_vDUbmgQWxCsA3cQt5rAcocKBnbcduZi4RbpXpMkMJeTg';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const PUBLIC_HOSTS = new Set([
  'whistlerbusinesssolutions.com',
  'www.whistlerbusinesssolutions.com',
]);

const isPublicProductionPage =
  PUBLIC_HOSTS.has(window.location.hostname) &&
  !window.location.pathname.startsWith('/dashboard');

let posthogClient = null;
const pendingEvents = [];

const initializePostHog = async () => {
  const { default: posthog } = await import('posthog-js');
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
    },
  });
  posthogClient = posthog;
  pendingEvents.splice(0).forEach(([eventName, properties]) => {
    posthog.capture(eventName, properties);
  });
};

if (isPublicProductionPage) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initializePostHog, { timeout: 2000 });
  } else {
    window.setTimeout(initializePostHog, 0);
  }
}

export const captureEvent = (eventName, properties = {}) => {
  if (!isPublicProductionPage) return;
  if (posthogClient) {
    posthogClient.capture(eventName, properties);
  } else {
    pendingEvents.push([eventName, properties]);
  }
};
