import { hasAnalyticsConsent, hasMarketingConsent } from "@/hooks/use-cookie-consent";

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private initialized = false;

  init() {
    if (typeof window === "undefined") return;
    if (this.initialized) return;
    this.initialized = true;

    this.processQueue();
  }

  private processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) this.sendEvent(event);
    }
  }

  private sendEvent(event: AnalyticsEvent) {
    if (!hasAnalyticsConsent()) return;

    // Send to analytics endpoint
    if (typeof window !== "undefined") {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {
        // Silently fail analytics
      });
    }
  }

  track(event: string, properties?: Record<string, string | number | boolean>) {
    const analyticsEvent: AnalyticsEvent = { event, properties };
    if (!this.initialized || typeof window === "undefined") {
      this.queue.push(analyticsEvent);
    } else {
      this.sendEvent(analyticsEvent);
    }
  }

  trackPageView(page: string, title?: string) {
    this.track("page_view", {
      page,
      title: title || document.title,
    });
  }

  trackButtonClick(buttonName: string, location: string) {
    this.track("button_click", {
      button_name: buttonName,
      location,
    });
  }

  trackSignup(method: "email" | "google") {
    this.track("signup_completed", {
      method,
    });
  }

  trackLogin(method: "email" | "google") {
    this.track("login_completed", {
      method,
    });
  }

  trackPricingView(plan: string) {
    this.track("pricing_viewed", {
      plan,
    });
  }

  trackCTAClick(ctaName: string, location: string) {
    this.track("cta_clicked", {
      cta_name: ctaName,
      location,
    });
  }
}

class Marketing {
  private initialized = false;

  init() {
    if (typeof window === "undefined") return;
    if (this.initialized) return;
    this.initialized = true;

    this.processPixel();
  }

  private processPixel() {
    if (!hasMarketingConsent()) return;

    // Facebook Pixel, Google Ads, etc. would be initialized here
    // Example: fbq('init', 'pixel-id');
    this.trackConversion("page_view");
  }

  private trackConversion(event: string, data?: Record<string, string>) {
    if (!hasMarketingConsent()) return;

    // Send to marketing tracking endpoint
    if (typeof window !== "undefined") {
      fetch("/api/marketing/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail marketing tracking
      });
    }
  }

  trackLead(source: string, campaign?: string) {
    this.trackConversion("lead", { source, campaign });
  }

  trackSignup(source: string, plan?: string) {
    this.trackConversion("signup", { source, plan });
  }
}

export const analytics = new Analytics();
export const marketing = new Marketing();

// Auto-initialize on client
if (typeof window !== "undefined") {
  analytics.init();
  marketing.init();
}
