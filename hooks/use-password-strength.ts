'use client';

import { useState, useEffect } from 'react';
import { calculatePasswordStrength, PasswordStrength } from '@/lib/password-strength';

export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<PasswordStrength>('empty');
  const [score, setScore] = useState(0);
  const [requirements, setRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasSymbol: false,
    hasUppercase: false,
  });

  useEffect(() => {
    const result = calculatePasswordStrength(password);
    setStrength(result.strength);
    setScore(result.score);
    setRequirements(result.requirements);
  }, [password]);

  return { strength, score, requirements };
}
