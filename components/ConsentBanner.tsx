'use client';

import { useEffect, useState } from 'react';

const KEY = 'cookie_consent_v1';

function applyConsent(granted: boolean) {
  const v = granted ? 'granted' : 'denied';
  const w = window as unknown as { dataLayer?: IArguments[] };
  if (!w.dataLayer) w.dataLayer = [];
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    (w.dataLayer as IArguments[]).push(arguments);
  }
  (gtag as (...args: unknown[]) => void)('consent', 'update', {
    ad_storage: v,
    ad_user_data: v,
    ad_personalization: v,
    analytics_storage: v,
  });
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      // storage unavailable (private mode)
    }
    if (stored === 'granted' || stored === 'denied') {
      applyConsent(stored === 'granted');
    } else {
      setVisible(true);
    }
  }, []);

  const choose = (granted: boolean) => {
    try {
      localStorage.setItem(KEY, granted ? 'granted' : 'denied');
    } catch {
      // ignore
    }
    applyConsent(granted);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-gray-900 px-4 py-3 text-sm text-gray-100 shadow-lg"
    >
      <span>
        We use cookies for analytics.{' '}
        <a href="/privacy" className="text-blue-300 underline">
          Privacy Policy
        </a>
      </span>
      <button
        onClick={() => choose(false)}
        className="rounded-md bg-gray-700 px-4 py-2 font-semibold"
      >
        Reject non-essential
      </button>
      <button
        onClick={() => choose(true)}
        className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white"
      >
        Accept all
      </button>
    </div>
  );
}
