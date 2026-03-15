/**
 * A/B Testing Framework for Neuromarketing Elements
 *
 * This module provides a simple A/B testing system for landing page experiments.
 * It supports testing different variants of headlines, CTAs, social proof placement,
 * and other neuromarketing elements.
 *
 * Usage:
 * - Use useABTest hook in components to get variant assignments
 * - Track events with trackEvent for conversion tracking
 * - View results in browser console for debugging
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export type ExperimentVariant = 'control' | 'variant_a' | 'variant_b';

export interface Experiment {
  id: string;
  name: string;
  variants: string[];
  description: string;
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: string;
  timestamp: number;
}

// Predefined experiments for neuromarketing testing
export const EXPERIMENTS: Experiment[] = [
  {
    id: 'hero_headline',
    name: 'Hero Headline Copy',
    variants: ['control', 'variant_a', 'variant_b'],
    description: 'Testing different headline formulations for emotional impact'
  },
  {
    id: 'cta_color',
    name: 'CTA Button Color',
    variants: ['control', 'variant_a', 'variant_b'],
    description: 'Testing green vs blue vs orange CTAs for action motivation'
  },
  {
    id: 'social_proof_position',
    name: 'Social Proof Position',
    variants: ['control', 'variant_a'],
    description: 'Testing above-fold vs below-fold social proof placement'
  },
  {
    id: 'trust_signals',
    name: 'Trust Signals',
    variants: ['control', 'variant_a'],
    description: 'Testing different trust signal combinations'
  },
  {
    id: 'value_prop_style',
    name: 'Value Proposition Style',
    variants: ['control', 'variant_a'],
    description: 'Testing benefit-focused vs feature-focused language'
  }
];

// Storage key for experiment assignments
const STORAGE_KEY = 'flux_ab_assignments';

// Get deterministic assignment based on user ID or random
function getAssignment(experimentId: string, userId?: string): string {
  const experiment = EXPERIMENTS.find(e => e.id === experimentId);
  if (!experiment) return 'control';

  // Use simple hash for deterministic assignment
  const seed = userId || `${Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }

  const variantIndex = Math.abs(hash) % experiment.variants.length;
  return experiment.variants[variantIndex];
}

// Load assignments from localStorage
function loadAssignments(): Record<string, ExperimentAssignment> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save assignments to localStorage
function saveAssignments(assignments: Record<string, ExperimentAssignment>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for A/B testing assignments
 * @param experimentId - The experiment to get assignment for
 * @returns The assigned variant
 */
export function useABTest(experimentId: string): string {
  const [variant, setVariant] = useState('control');

  useEffect(() => {
    // Check for existing assignment
    const assignments = loadAssignments();

    if (assignments[experimentId]) {
      setVariant(assignments[experimentId].variant);
      return;
    }

    // Create new assignment
    const newVariant = getAssignment(experimentId);
    const newAssignment: ExperimentAssignment = {
      experimentId,
      variant: newVariant,
      timestamp: Date.now()
    };

    assignments[experimentId] = newAssignment;
    saveAssignments(assignments);
    setVariant(newVariant);

    // Log assignment for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[A/B Test] Assigned ${experimentId} -> ${newVariant}`);
    }
  }, [experimentId]);

  return variant;
}

/**
 * Hook to get all experiment assignments
 * @returns Object mapping experiment IDs to their variants
 */
export function useAllABTests(): Record<string, string> {
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = loadAssignments();
    const result: Record<string, string> = {};

    EXPERIMENTS.forEach(exp => {
      if (stored[exp.id]) {
        result[exp.id] = stored[exp.id].variant;
      } else {
        const variant = getAssignment(exp.id);
        result[exp.id] = variant;
        stored[exp.id] = {
          experimentId: exp.id,
          variant,
          timestamp: Date.now()
        };
      }
    });

    saveAssignments(stored);
    setAssignments(result);
  }, []);

  return assignments;
}

/**
 * Track conversion events for A/B testing analysis
 * @param eventName - Name of the conversion event
 * @param metadata - Additional event metadata
 */
export function trackABEvent(
  eventName: string,
  metadata?: Record<string, string | number>
): void {
  if (typeof window === 'undefined') return;

  const assignments = loadAssignments();
  const eventData = {
    event: eventName,
    experiments: assignments,
    timestamp: Date.now(),
    ...metadata
  };

  // Store for later analysis (in production, send to analytics)
  try {
    const events = JSON.parse(localStorage.getItem('flux_ab_events') || '[]');
    events.push(eventData);
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    localStorage.setItem('flux_ab_events', JSON.stringify(events));
  } catch {
    // Ignore storage errors
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[A/B Test] Event tracked:', eventData);
  }
}

/**
 * Get experiment results (for debugging/analysis)
 * @returns Object with experiment IDs and their variant distributions
 */
export function getExperimentResults(): Record<string, Record<string, number>> {
  if (typeof window === 'undefined') return {};

  const results: Record<string, Record<string, number>> = {};

  try {
    const events = JSON.parse(localStorage.getItem('flux_ab_events') || '[]');
    const assignments = loadAssignments();

    // Count variant assignments
    Object.values(assignments).forEach(assignment => {
      if (!results[assignment.experimentId]) {
        results[assignment.experimentId] = {};
      }
      results[assignment.experimentId][assignment.variant] =
        (results[assignment.experimentId][assignment.variant] || 0) + 1;
    });

    // Count conversion events per variant
    events.forEach((event: Record<string, unknown>) => {
      if (event.experiments) {
        Object.entries(event.experiments as Record<string, string>).forEach(
          ([expId, variant]) => {
            if (!results[expId]) {
              results[expId] = {};
            }
          }
        );
      }
    });
  } catch {
    // Return empty results on error
  }

  return results;
}

/**
 * Reset all A/B test assignments (for testing)
 */
export function resetABTests(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('flux_ab_events');

  if (process.env.NODE_ENV === 'development') {
    console.log('[A/B Test] All assignments and events reset');
  }
}

// Headline variants for different experiments
export const HEADLINE_VARIANTS = {
  hero_headline: {
    control: 'Ship faster with your team in flow',
    variant_a: 'Collaborate effortlessly, deliver faster',
    variant_b: 'Your team, in perfect sync'
  }
};

export const CTA_VARIANTS = {
  cta_color: {
    control: 'bg-emerald-500 hover:bg-emerald-600',
    variant_a: 'bg-blue-600 hover:bg-blue-700',
    variant_b: 'bg-orange-500 hover:bg-orange-600'
  }
};

export const SOCIAL_PROOF_VARIANTS = {
  social_proof_position: {
    control: 'above',  // In hero section
    variant_a: 'below'  // After hero, before features
  }
};
