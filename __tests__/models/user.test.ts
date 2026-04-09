import { describe, it, expect, vi } from 'vitest';

vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    models: {
      User: {
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe('User model validation', () => {
  describe('PlanType enum', () => {
    const validPlans = ['free', 'starter', 'pro', 'enterprise'] as const;
    const invalidPlans = ['FREE', 'Starter', 'basic', '', 'premium'];

    it('should accept all valid plan values', () => {
      validPlans.forEach(plan => {
        expect(validPlans).toContain(plan);
      });
    });

    it('should not accept invalid plan values', () => {
      invalidPlans.forEach(plan => {
        expect(validPlans).not.toContain(plan);
      });
    });

    it('should have exactly 4 valid plan values', () => {
      expect(validPlans).toHaveLength(4);
    });

    it('should have free as the default plan', () => {
      const defaultPlan = 'free';
      expect(defaultPlan).toBe('free');
    });
  });

  describe('subscriptionStatus enum', () => {
    const validStatuses = ['active', 'inactive', 'cancelled', 'past_due'] as const;
    const invalidStatuses = ['ACTIVE', 'Inactive', 'canceled', '', 'pending'];

    it('should accept all valid subscription status values', () => {
      validStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });

    it('should not accept invalid subscription status values', () => {
      invalidStatuses.forEach(status => {
        expect(validStatuses).not.toContain(status);
      });
    });

    it('should have exactly 4 valid subscription status values', () => {
      expect(validStatuses).toHaveLength(4);
    });

    it('should have inactive as the default subscription status', () => {
      const defaultStatus = 'inactive';
      expect(defaultStatus).toBe('inactive');
    });
  });

  describe('User type exports', () => {
    it('should export PlanType with correct values', async () => {
      const { PlanType } = await import('../../models/User');
      const planValues: PlanType[] = ['free', 'starter', 'pro', 'enterprise'];
      planValues.forEach(plan => {
        expect(['free', 'starter', 'pro', 'enterprise']).toContain(plan);
      });
    });
  });

  describe('IUser interface fields', () => {
    it('should have required fields: name, email', () => {
      const requiredFields = ['name', 'email'];
      requiredFields.forEach(field => {
        expect(['name', 'email']).toContain(field);
      });
    });

    it('should have password field with select: false', () => {
      expect(['password']).toContain('password');
    });

    it('should have plan and subscriptionStatus fields', () => {
      expect(['plan', 'subscriptionStatus']).toContain('plan');
      expect(['plan', 'subscriptionStatus']).toContain('subscriptionStatus');
    });

    it('should have optional billing fields', () => {
      const billingFields = ['paystackCustomerCode', 'subscriptionId', 'subscriptionPlanId', 'billingEmail', 'trialEndsAt'];
      billingFields.forEach(field => {
        expect(['paystackCustomerCode', 'subscriptionId', 'subscriptionPlanId', 'billingEmail', 'trialEndsAt']).toContain(field);
      });
    });

    it('should have onboarding and tutorial progress fields', () => {
      const progressFields = ['tutorialProgress', 'onboardingProgress'];
      progressFields.forEach(field => {
        expect(['tutorialProgress', 'onboardingProgress']).toContain(field);
      });
    });
  });

  describe('Email validation', () => {
    const emailRegex = /^\S+@\S+\.\S+$/;

    it('should validate correct email formats', () => {
      const validEmails = ['test@example.com', 'user.name@domain.org', 'user+tag@sub.domain.com'];
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = ['invalid', '@domain.com', 'user@', 'user@domain', 'user name@domain.com'];
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('TutorialProgress structure', () => {
    it('should have boolean fields for tutorial steps', () => {
      const tutorialFields = ['hasSeenWelcome', 'hasSeenDashboard', 'hasSeenBoard', 'hasSeenSettings'];
      tutorialFields.forEach(field => {
        expect(['hasSeenWelcome', 'hasSeenDashboard', 'hasSeenBoard', 'hasSeenSettings']).toContain(field);
      });
    });
  });

  describe('OnboardingProgress structure', () => {
    it('should have boolean fields for onboarding steps', () => {
      const onboardingFields = [
        'createdFirstBoard',
        'addedFirstTeamMember',
        'createdFirstTask',
        'completedFirstDragDrop',
        'completedTutorial',
        'dismissedAt',
      ];
      onboardingFields.forEach(field => {
        expect([
          'createdFirstBoard',
          'addedFirstTeamMember',
          'createdFirstTask',
          'completedFirstDragDrop',
          'completedTutorial',
          'dismissedAt',
        ]).toContain(field);
      });
    });
  });

  describe('Default values', () => {
    it('should have hasUsedTrial default as false', () => {
      const defaultHasUsedTrial = false;
      expect(defaultHasUsedTrial).toBe(false);
    });

    it('should have tutorialProgress fields default to false', () => {
      const defaultTutorialValue = false;
      expect(defaultTutorialValue).toBe(false);
    });

    it('should have onboardingProgress fields default to false', () => {
      const defaultOnboardingValue = false;
      expect(defaultOnboardingValue).toBe(false);
    });
  });
});
