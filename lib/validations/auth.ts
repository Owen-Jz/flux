import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((password) => {
      // Enforce minimum complexity requirements
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      return [hasUpperCase, hasLowerCase, hasNumber, hasSymbol].filter(Boolean).length >= 3;
    }, 'Password must contain at least 3 of: uppercase, lowercase, numbers, and symbols'),
  plan: z.enum(['starter', 'pro']).optional(),
});

export const validateEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
