import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ---------- validation ----------
const reqBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must be at most 20 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ---------- POST /api/auth/reset-password ----------
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

    const { email, otp, newPassword } = parsed.data;

    // Fetch the most recent reset OTP for this email
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

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await prisma.emailOTP.deleteMany({ where: { email, purpose: "PASSWORD_RESET" } });
      return NextResponse.json(
        { error: "Reset code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValidOTP) {
      return NextResponse.json(
        { error: "Invalid reset code." },
        { status: 401 }
      );
    }

    // Ensure the user still exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await prisma.emailOTP.deleteMany({ where: { email, purpose: "PASSWORD_RESET" } });
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    // Hash the new password and update the user
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Clean up the used OTP record
    await prisma.emailOTP.deleteMany({ where: { email, purpose: "PASSWORD_RESET" } });

    return NextResponse.json(
      { message: "Password reset successfully. You can now sign in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
