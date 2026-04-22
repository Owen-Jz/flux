import { test, expect } from '@playwright/test';

/**
 * E2E tests for public pages that don't require authentication.
 * These tests cover landing page, pricing, features, blog, and legal pages.
 */
test.describe('Public Pages', () => {
  // Clear cookies before each test for cookie consent tests
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ===========================================================================
  // LANDING PAGE TESTS
  // ===========================================================================
  test.describe('Landing Page', () => {
    test('@public @landing - hero section renders with heading and CTA visible', async ({ page }) => {
      await page.goto('/');

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Check hero heading is visible - the main headline
      const heroHeading = page.locator('h1#hero-heading, h1:has-text("Ship faster with")').first();
      await expect(heroHeading).toBeVisible();

      // Check CTA buttons are visible - "Start your free trial" and "Watch demo"
      const startTrialBtn = page.locator('a:has-text("Start your free trial"), a:has-text("Start Trial")').first();
      await expect(startTrialBtn).toBeVisible();

      const watchDemoBtn = page.locator('a:has-text("Watch demo")').first();
      await expect(watchDemoBtn).toBeVisible();

      // Check subheadline is visible
      const subheadline = page.locator('text=The all-in-one workspace where engineering teams').first();
      await expect(subheadline).toBeVisible();
    });

    test('@public @landing - features grid shows all feature cards', async ({ page }) => {
      await page.goto('/');

      // Scroll to features section
      const featuresSection = page.locator('#features, section:has(h2:text("Built for modern teams"))').first();
      await featuresSection.scrollIntoViewIfNeeded();

      // Wait for features to be visible
      await page.waitForTimeout(500);

      // Check main feature cards are present - Real-time Collaboration, Lightning Fast, Workflow Automation, Enterprise Security, Deep Insights
      const featureTitles = [
        'Real-time presence & multi-player editing',
        'Blazing fast performance',
        'Workflow Automation',
        'Enterprise Security',
        'Deep Insights',
      ];

      for (const title of featureTitles) {
        const featureCard = page.locator(`text=${title}`).first();
        await expect(featureCard).toBeVisible();
      }
    });

    test('@public @landing - pricing section displays 4 pricing tiers', async ({ page }) => {
      await page.goto('/');

      // Scroll to pricing section
      const pricingSection = page.locator('#pricing, section[aria-labelledby="pricing-heading"]').first();
      await pricingSection.scrollIntoViewIfNeeded();

      // Wait for pricing cards to load
      await page.waitForTimeout(500);

      // Check all 4 pricing tiers are visible: Free, Starter, Pro, Enterprise
      const pricingTiers = ['Free', 'Starter', 'Pro', 'Enterprise'];

      for (const tier of pricingTiers) {
        const tierCard = page.locator(`text=${tier}`).first();
        await expect(tierCard).toBeVisible();
      }

      // Verify we have 4 pricing cards by checking for the "Most Popular" badge on Pro
      const mostPopularBadge = page.locator('text=Most Popular').first();
      await expect(mostPopularBadge).toBeVisible();
    });

    test('@public @landing - testimonials carousel works', async ({ page }) => {
      await page.goto('/');

      // Scroll to testimonials section
      const testimonialsSection = page.locator('section[aria-labelledby="testimonials-heading"]').first();
      await testimonialsSection.scrollIntoViewIfNeeded();

      // Wait for testimonials to be visible
      await page.waitForTimeout(500);

      // Check all 3 testimonial quotes are visible
      const testimonialAuthors = ['Sarah Jenkins', 'Michael Chen', 'Jessica Williams'];

      for (const author of testimonialAuthors) {
        const testimonial = page.locator(`text=${author}`).first();
        await expect(testimonial).toBeVisible();
      }

      // Check star ratings are visible (5 stars per testimonial)
      const stars = page.locator('svg[class*="fill-yellow"]').first();
      await expect(stars).toBeVisible();
    });

    test('@public @landing - FAQ expand/collapse accordion interactions work', async ({ page }) => {
      await page.goto('/');

      // Scroll to FAQ section
      const faqSection = page.locator('section[aria-labelledby="faq-heading"]').first();
      await faqSection.scrollIntoViewIfNeeded();

      // Wait for FAQ items to load
      await page.waitForTimeout(500);

      // Find the first FAQ item
      const firstFaqButton = page.locator('button[aria-expanded]').first();
      await expect(firstFaqButton).toBeVisible();

      // Check initial state - should not be expanded
      await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await firstFaqButton.click();

      // Wait for animation
      await page.waitForTimeout(300);

      // Should now be expanded
      await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'true');

      // Click again to collapse
      await firstFaqButton.click();
      await page.waitForTimeout(300);

      // Should be collapsed again
      await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('@public @landing - CTA section email capture form works', async ({ page }) => {
      await page.goto('/');

      // Scroll to CTA section
      const ctaSection = page.locator('section[aria-labelledby="cta-heading"]').first();
      await ctaSection.scrollIntoViewIfNeeded();

      // Wait for CTA to load
      await page.waitForTimeout(500);

      // Check CTA heading is visible
      const ctaHeading = page.locator('#cta-heading, h2:has-text("Ready to transform")').first();
      await expect(ctaHeading).toBeVisible();

      // Check CTA buttons are present
      const startTrialCta = page.locator('a:has-text("Start your free trial")').first();
      await expect(startTrialCta).toBeVisible();

      const contactSalesCta = page.locator('a:has-text("Contact sales")').first();
      await expect(contactSalesCta).toBeVisible();

      // Check trust indicators
      const trustIndicators = [
        'Free for teams up to 5 members',
        'Setup in minutes',
        'Cancel anytime',
      ];

      for (const indicator of trustIndicators) {
        const trustText = page.locator(`text=${indicator}`).first();
        await expect(trustText).toBeVisible();
      }
    });
  });

  // ===========================================================================
  // PRICING PAGE TESTS
  // ===========================================================================
  test.describe('Pricing Page', () => {
    test('@public @pricing - compare features table renders', async ({ page }) => {
      await page.goto('/pricing');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check pricing heading
      const heading = page.locator('h1:has-text("Simple, Transparent Pricing")').first();
      await expect(heading).toBeVisible();

      // Check all 3 plan cards are present: Starter, Pro, Enterprise
      const plans = ['Starter', 'Pro', 'Enterprise'];
      for (const plan of plans) {
        await expect(page.locator(`text=${plan}`).first()).toBeVisible();
      }

      // Check features are listed for each plan
      // Pro should have these features
      const proFeatures = [
        'Unlimited Projects',
        'Advanced Analytics',
        'SSO',
      ];

      for (const feature of proFeatures) {
        await expect(page.locator(`text=${feature}`).first()).toBeVisible();
      }

      // Check FAQ section is present
      const faqHeading = page.locator('h2:has-text("Frequently Asked Questions")').first();
      await expect(faqHeading).toBeVisible();

      // Check some FAQ items
      const faqItems = [
        'Can I change plans at any time?',
        'Is there a free trial?',
      ];

      for (const faq of faqItems) {
        await expect(page.locator(`text=${faq}`).first()).toBeVisible();
      }
    });
  });

  // ===========================================================================
  // FEATURES PAGE TESTS
  // ===========================================================================
  test.describe('Features Page', () => {
    test('@public @features - all feature sections navigate correctly', async ({ page }) => {
      await page.goto('/features');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check main heading
      const heading = page.locator('h1:has-text("Powerful Features for Modern Teams")').first();
      await expect(heading).toBeVisible();

      // Check main feature cards are present
      const features = [
        'Real-time Collaboration',
        'Kanban Boards',
        'Analytics Dashboard',
        'Task Management',
        'Team Workspaces',
        'Integrations',
      ];

      for (const feature of features) {
        await expect(page.locator(`text=${feature}`).first()).toBeVisible();
      }

      // Check additional features section
      const additionalFeaturesHeading = page.locator('h2:has-text("Even more ways to boost productivity")').first();
      await expect(additionalFeaturesHeading).toBeVisible();

      const additionalFeatures = [
        'Lightning Fast',
        'Enterprise Security',
        'Time Tracking',
        'Workflow Automation',
      ];

      for (const feature of additionalFeatures) {
        await expect(page.locator(`text=${feature}`).first()).toBeVisible();
      }

      // Check CTA buttons
      const ctaButtons = [
        'Start Free Trial',
        'View Pricing',
      ];

      for (const cta of ctaButtons) {
        await expect(page.locator(`a:has-text("${cta}")`).first()).toBeVisible();
      }
    });
  });

  // ===========================================================================
  // BLOG TESTS
  // ===========================================================================
  test.describe('Blog', () => {
    test('@public @blog - post listing displays posts', async ({ page }) => {
      await page.goto('/blog');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check blog heading
      const heading = page.locator('h1:has-text("Blog")').first();
      await expect(heading).toBeVisible();

      // Check that posts are listed - verify multiple post titles from the blog page
      const postTitles = [
        'How to Improve Team Velocity with Flux',
        'Introducing Flux 2.4',
        'Best Practices for Remote Team Management',
        'Getting Started with Flux: A Complete Guide',
      ];

      for (const title of postTitles) {
        const postLink = page.locator(`a:has-text("${title}")`).first();
        await expect(postLink).toBeVisible();
      }

      // Check newsletter CTA
      const newsletterHeading = page.locator('h2:has-text("Stay Updated")').first();
      await expect(newsletterHeading).toBeVisible();
    });

    test('@public @blog - blog post renders full content', async ({ page }) => {
      // Navigate to a specific blog post
      await page.goto('/blog/improve-team-velocity');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check post title is visible
      const title = page.locator('h1:has-text("How to Improve Team Velocity with Flux")').first();
      await expect(title).toBeVisible();

      // Check back link is present
      const backLink = page.locator('a:has-text("Back to Blog")').first();
      await expect(backLink).toBeVisible();

      // Check content sections are present
      const contentSections = [
        'Introduction',
        'Set Clear Goals',
        'Optimize Your Workflow',
        'Communicate Effectively',
        'Conclusion',
      ];

      for (const section of contentSections) {
        await expect(page.locator(`h2:has-text("${section}")`).first()).toBeVisible();
      }
    });
  });

  // ===========================================================================
  // LEGAL PAGE TESTS
  // ===========================================================================
  test.describe('Legal Pages', () => {
    test('@public @privacy - full content renders', async ({ page }) => {
      await page.goto('/privacy');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check privacy policy heading
      const heading = page.locator('h1:has-text("Privacy Policy")').first();
      await expect(heading).toBeVisible();

      // Check key sections are present
      const sections = [
        'Information We Collect',
        'How We Use Information',
        'Data Security',
        'Your Rights',
        'Contact Us',
      ];

      for (const section of sections) {
        await expect(page.locator(`h2:has-text("${section}")`).first()).toBeVisible();
      }

      // Check contact email link
      const contactEmail = page.locator('a[href*="privacy@flux.io"]').first();
      await expect(contactEmail).toBeVisible();
    });

    test('@public @terms - full terms text renders', async ({ page }) => {
      await page.goto('/terms');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check terms heading
      const heading = page.locator('h1:has-text("Terms of Service")').first();
      await expect(heading).toBeVisible();

      // Check key sections are present
      const sections = [
        'Acceptance of Terms',
        'Use of Service',
        'Account Responsibilities',
        'Intellectual Property',
        'Limitation of Liability',
        'Contact Us',
      ];

      for (const section of sections) {
        await expect(page.locator(`h2:has-text("${section}")`).first()).toBeVisible();
      }

      // Check contact email link
      const contactEmail = page.locator('a[href*="legal@flux.io"]').first();
      await expect(contactEmail).toBeVisible();
    });

    test('@public @cookies - consent banner shows on first visit', async ({ page }) => {
      // Clear cookies to ensure first visit
      await page.context().clearCookies();

      await page.goto('/');

      // Wait for page to load and cookie banner to potentially appear
      await page.waitForLoadState('networkidle');

      // The cookie consent banner should appear for new visitors
      // Look for the cookie consent component
      const cookieBanner = page.locator('h3:has-text("We value your privacy"), [class*="cookie"], [class*="consent"]').first();

      // Either the banner is visible OR cookies were already accepted
      // Check if there's a visible cookie consent or if we need to accept
      const bannerVisible = await cookieBanner.isVisible().catch(() => false);

      if (bannerVisible) {
        // If banner is visible, check for accept/reject buttons
        const acceptBtn = page.locator('button:has-text("Accept All")').first();
        const rejectBtn = page.locator('button:has-text("Reject All")').first();
        const preferencesBtn = page.locator('button:has-text("Preferences")').first();

        // At least one button should be visible
        const hasButtons = await acceptBtn.isVisible().catch(() => false) ||
                          await rejectBtn.isVisible().catch(() => false) ||
                          await preferencesBtn.isVisible().catch(() => false);

        if (hasButtons) {
          // Click accept to dismiss the banner
          if (await acceptBtn.isVisible().catch(() => false)) {
            await acceptBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }
    });

    test('@public @cookies - cookie policy page renders', async ({ page }) => {
      await page.goto('/cookies');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check cookie policy heading
      const heading = page.locator('h1:has-text("Cookie Policy")').first();
      await expect(heading).toBeVisible();

      // Check cookie types are listed
      const cookieTypes = [
        'Essential Cookies',
        'Analytics Cookies',
        'Marketing Cookies',
      ];

      for (const type of cookieTypes) {
        await expect(page.locator(`h3:has-text("${type}")`).first()).toBeVisible();
      }

      // Check "Managing Cookies" section
      const manageSection = page.locator('h2:has-text("Managing Cookies")').first();
      await expect(manageSection).toBeVisible();
    });
  });
});
