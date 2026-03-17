import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { validateEmailSchema } from '@/lib/validations/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute
  const ip = getClientIp(request);
  const rateLimitResult = rateLimit(ip, 10, 60);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { available: false, message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = validateEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { available: false, message: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    await connectDB();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: 'An account with this email already exists. Try signing in instead.',
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('[Validate Email] Error:', error);
    return NextResponse.json(
      { available: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
