import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const reqBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

// POST /api/auth/verify-reset-otp
// Validates the reset OTP without changing the password.
// Returns 200 if valid so the frontend can show the new-password step.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = reqBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;

    const otpRecord = await prisma.emailOTP.findFirst({
      where: { email, purpose: "PASSWORD_RESET" },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No reset code found for this email. Please request a new one." },
        { status: 404 }
      );
    }

    if (new Date() > otpRecord.expiresAt) {
      await prisma.emailOTP.deleteMany({ where: { email, purpose: "PASSWORD_RESET" } });
      return NextResponse.json(
        { error: "Reset code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid reset code." },
        { status: 401 }
      );
    }

    // OTP is valid — keep the record so reset-password can verify it again
    return NextResponse.json({ message: "Code verified." }, { status: 200 });
  } catch (error) {
    console.error("[verify-reset-otp] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
