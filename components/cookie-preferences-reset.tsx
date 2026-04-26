"use client";

export function CookiePreferencesReset() {
  return (
    <div className="mt-12 p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl text-center">
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Want to change your cookie preferences?
      </p>
      <button
        onClick={() => {
          document.cookie = 'flux_cookie_consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
          document.cookie = 'flux_cookie_preferences=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
          window.location.reload();
        }}
        className="px-6 py-3 bg-[var(--brand-primary)] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
      >
        Reset Cookie Preferences
      </button>
    </div>
  );
}
