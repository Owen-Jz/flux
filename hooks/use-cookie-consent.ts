"use client";

import { useState, useEffect, useCallback } from "react";

export type CookieConsent = "accepted" | "rejected" | "pending";

export type CookieCategory = "essential" | "analytics" | "marketing";

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_NAME = "flux_cookie_consent";
const COOKIE_PREFERENCES_NAME = "flux_cookie_preferences";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  // SECURITY FIX: Add Secure flag for HTTPS connections and SameSite=Strict
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict${secure}`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  // SECURITY: Use same cookie attributes as setCookie for proper deletion
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict${secure}`;
}

export function useCookieConsent() {
  const [consent, setConsentState] = useState<CookieConsent>("pending");
  const [preferences, setPreferencesState] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    const storedConsent = getCookie(COOKIE_CONSENT_NAME);
    const storedPreferences = getCookie(COOKIE_PREFERENCES_NAME);

    if (storedConsent === "accepted" || storedConsent === "rejected") {
      setConsentState(storedConsent);
      setHasConsented(true);

      if (storedPreferences) {
        try {
          setPreferencesState(JSON.parse(storedPreferences));
        } catch {
          // Invalid stored preferences, use defaults
        }
      }
    }
  }, []);

  const acceptAll = useCallback(() => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setConsentState("accepted");
    setPreferencesState(prefs);
    setCookie(COOKIE_CONSENT_NAME, "accepted");
    setCookie(COOKIE_PREFERENCES_NAME, JSON.stringify(prefs));
    setHasConsented(true);
  }, []);

  const rejectAll = useCallback(() => {
    const prefs: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setConsentState("rejected");
    setPreferencesState(prefs);
    setCookie(COOKIE_CONSENT_NAME, "rejected");
    setCookie(COOKIE_PREFERENCES_NAME, JSON.stringify(prefs));
    setHasConsented(true);
  }, []);

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    setPreferencesState(prefs);
    setConsentState("accepted");
    setCookie(COOKIE_CONSENT_NAME, "accepted");
    setCookie(COOKIE_PREFERENCES_NAME, JSON.stringify(prefs));
    setHasConsented(true);
  }, []);

  const resetConsent = useCallback(() => {
    setConsentState("pending");
    setHasConsented(false);
    deleteCookie(COOKIE_CONSENT_NAME);
    deleteCookie(COOKIE_PREFERENCES_NAME);
  }, []);

  return {
    consent,
    preferences,
    hasConsented,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
  };
}

export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  const consent = getCookie(COOKIE_CONSENT_NAME);
  if (consent !== "accepted") return false;
  const prefs = getCookie(COOKIE_PREFERENCES_NAME);
  if (!prefs) return false;
  try {
    const parsed = JSON.parse(prefs);
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

export function hasMarketingConsent(): boolean {
  if (typeof document === "undefined") return false;
  const consent = getCookie(COOKIE_CONSENT_NAME);
  if (consent !== "accepted") return false;
  const prefs = getCookie(COOKIE_PREFERENCES_NAME);
  if (!prefs) return false;
  try {
    const parsed = JSON.parse(prefs);
    return parsed.marketing === true;
  } catch {
    return false;
  }
}
