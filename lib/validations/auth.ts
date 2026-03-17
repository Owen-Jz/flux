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
    .min(6, 'Password must be at least 6 characters (8+ with numbers & symbols for stronger security)')
    .refine((password) => {
      // Show suggestion but don't require strong password
      const hasNumber = /\d/.test(password);
      const hasSymbol = /[!@#$%^&*]/.test(password);
      return hasNumber || hasSymbol;
    }, 'Adding numbers and symbols makes your password stronger'),
});

export const validateEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
