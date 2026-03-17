export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasUppercase: boolean;
}

export function calculatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number; // 0-4
  requirements: PasswordRequirements;
} {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
  };

  let score = 0;
  if (requirements.minLength) score++;
  if (requirements.hasNumber) score++;
  if (requirements.hasSymbol) score++;
  if (requirements.hasUppercase) score++;

  const strength: PasswordStrength =
    score === 0 ? 'empty' : score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';

  return { strength, score, requirements };
}

export const strengthColors: Record<PasswordStrength, string> = {
  empty: 'bg-gray-200',
  weak: 'bg-red-500',
  fair: 'bg-orange-500',
  good: 'bg-yellow-500',
  strong: 'bg-green-500',
};

export const strengthLabels: Record<PasswordStrength, string> = {
  empty: '',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};
