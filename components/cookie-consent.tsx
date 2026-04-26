"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, CogIcon } from "@heroicons/react/24/outline";
import { useCookieConsent, type CookiePreferences } from "@/hooks/use-cookie-consent";

export function CookieConsent() {
  const { consent, hasConsented, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  if (hasConsented || consent !== "pending") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-6 md:flex md:items-center md:gap-6">
          <div className="flex-1 mb-4 md:mb-0">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
              We value your privacy
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
              By clicking "Accept All", you consent to our use of cookies.{" "}
              <a href="/cookies" className="text-[var(--brand-primary)] hover:underline">
                Learn more
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowPreferences(true)}
              className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors flex items-center justify-center gap-2"
            >
              <CogIcon className="w-4 h-4" />
              Preferences
            </button>
            <button
              onClick={rejectAll}
              className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Reject All
            </button>
            <button
              onClick={acceptAll}
              className="px-6 py-2.5 text-sm font-bold bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl hover:opacity-90 transition-opacity"
            >
              Accept All
            </button>
          </div>
        </div>

        {/* Preferences Modal */}
        <AnimatePresence>
          {showPreferences && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[70]"
                onClick={() => setShowPreferences(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-full max-w-lg bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    Cookie Preferences
                  </h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="p-1 rounded-lg hover:bg-[var(--background-subtle)] transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Essential */}
                  <div className="flex items-start gap-3 p-4 bg-[var(--background-subtle)] rounded-xl">
                    <input
                      type="checkbox"
                      id="essential"
                      checked={prefs.essential}
                      onChange={(e) => setPrefs({ ...prefs, essential: e.target.checked })}
                      disabled
                      className="mt-1 w-4 h-4 rounded border-[var(--border-default)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <div className="flex-1">
                      <label htmlFor="essential" className="font-medium text-[var(--foreground)]">
                        Essential Cookies
                      </label>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Required for the platform to function. These cannot be disabled.
                      </p>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="flex items-start gap-3 p-4 bg-[var(--background-subtle)] rounded-xl">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={prefs.analytics}
                      onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-[var(--border-default)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <div className="flex-1">
                      <label htmlFor="analytics" className="font-medium text-[var(--foreground)]">
                        Analytics Cookies
                      </label>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Help us understand how users interact with our platform by tracking page views and user behavior.
                      </p>
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="flex items-start gap-3 p-4 bg-[var(--background-subtle)] rounded-xl">
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={prefs.marketing}
                      onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-[var(--border-default)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <div className="flex-1">
                      <label htmlFor="marketing" className="font-medium text-[var(--foreground)]">
                        Marketing Cookies
                      </label>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Used to deliver relevant ads and track campaign performance across websites.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      savePreferences({ ...prefs, essential: true });
                      setShowPreferences(false);
                    }}
                    className="flex-1 px-4 py-2.5 text-sm font-bold bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Save Preferences
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
