import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const adminCode = body?.adminCode as string | undefined;

  const expected = process.env.ADMIN_ACCESS_CODE;

  if (!expected) {
    return NextResponse.json(
      { error: "Admin access code is not configured" },
      { status: 500 }
    );
  }

  if (!adminCode || adminCode !== expected) {
    return NextResponse.json(
      { error: "Invalid admin access code" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}

