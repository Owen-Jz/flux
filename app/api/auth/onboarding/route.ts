import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { z } from 'zod';

const onboardingStep1Schema = z.object({
  step: z.literal(1),
  data: z.object({
    name: z.string().min(1).max(100),
    image: z.string().optional(),
  }),
});

const onboardingStep2Schema = z.object({
  step: z.literal(2),
  data: z.object({
    workspaceName: z.string().min(1).max(100),
    workspaceIcon: z.string().optional(),
  }),
});

const onboardingStep3Schema = z.object({
  step: z.literal(3),
  data: z.object({
    completed: z.boolean(),
  }),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate step
    const step = body.step;
    if (![1, 2, 3].includes(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    let schema;
    switch (step) {
      case 1:
        schema = onboardingStep1Schema;
        break;
      case 2:
        schema = onboardingStep2Schema;
        break;
      case 3:
        schema = onboardingStep3Schema;
        break;
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();
    const userId = session.user.id;

    if (step === 1) {
      // Update user profile
      await User.findByIdAndUpdate(userId, {
        $set: {
          name: result.data.data.name,
          image: result.data.data.image,
          'tutorialProgress.hasSeenWelcome': true,
        },
      });
    } else if (step === 3) {
      // Mark tutorial as completed
      await User.findByIdAndUpdate(userId, {
        $set: {
          'onboardingProgress.completedTutorial': true,
          'tutorialProgress.hasSeenDashboard': true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Onboarding] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
