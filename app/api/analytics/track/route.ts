import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In production, you'd validate and store this
    // For now, just log it (you can connect to MongoDB below)
    console.log("[Analytics]", JSON.stringify(body));

    // Optionally store in database (uncomment to enable)
    // await connectDB();
    // await AnalyticsEvent.create({
    //   event: body.event,
    //   properties: body.properties,
    //   url: body.url,
    //   userAgent: body.userAgent,
    //   timestamp: new Date(body.timestamp),
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
