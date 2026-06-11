import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

/**
 * POST /api/waitlist
 *
 * Accepts an email address and stores it in the waitlist collection.
 * If the email already exists, returns success without error (idempotent).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body?.email;

    // Basic validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();

    // Sanity-check the format server-side
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Dynamically access or create the Waitlist model to avoid build-time
    // schema issues when the model doesn't exist yet.
    const mongoose = await import('mongoose');
    const waitlistSchema = new mongoose.Schema({
      email: { type: String, required: true, lowercase: true, trim: true },
      joinedAt: { type: Date, default: Date.now },
      source: { type: String, default: 'html-landing' },
    }, { timestamps: true });

    const Waitlist =
      mongoose.models.Waitlist ||
      mongoose.model('Waitlist', waitlistSchema);

    // Upsert — safe to call multiple times with the same email
    await Waitlist.findOneAndUpdate(
      { email: emailTrimmed },
      { $setOnInsert: { email: emailTrimmed } },
      { upsert: true, lean: true }
    );

    return NextResponse.json(
      { success: true, message: 'You\'re on the list! We\'ll be in touch.' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[/api/waitlist]', err);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}