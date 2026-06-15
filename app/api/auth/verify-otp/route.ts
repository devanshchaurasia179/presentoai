import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

// ---------- validation ----------
const reqBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

// ---------- JWT helpers ----------
function getJWTSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function mintToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ id: userId, email, isOnboarded: false })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(userId)
    .sign(getJWTSecret());
}

// ---------- POST /api/auth/verify-otp ----------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const parsed = reqBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;

    // Look up the OTP record
    const otpRecord = await prisma.emailOTP.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No verification code found for this email. Please request a new one." },
        { status: 404 }
      );
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await prisma.emailOTP.deleteMany({ where: { email } });
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Verify OTP
    const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValidOTP) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 401 }
      );
    }

    // OTP is valid — check the user doesn't already exist (race condition guard)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await prisma.emailOTP.deleteMany({ where: { email } });
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Create the user with the hashed password stored in the OTP record
    const newUser = await prisma.user.create({
      data: {
        email,
        password: otpRecord.hashedPassword,
        isOnboarded: false,
        profession: "", // filled in during onboarding
      },
    });

    // Clean up the OTP record
    await prisma.emailOTP.deleteMany({ where: { email } });

    // Mint a JWT and set it as an HttpOnly cookie
    const token = await mintToken(newUser.id, newUser.email);

    const response = NextResponse.json(
      {
        message: "Email verified successfully.",
        redirectTo: "/onboarding",
        user: {
          id: newUser.id,
          email: newUser.email,
          isOnboarded: newUser.isOnboarded,
        },
      },
      { status: 201 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[verify-otp] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
