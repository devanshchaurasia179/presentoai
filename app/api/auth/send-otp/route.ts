import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { renderMailTemplate } from "@/mail/render";

// ---------- validation ----------
const reqBodySchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must be at most 20 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ---------- helpers ----------
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const transporter = createTransporter();

  const html = await renderMailTemplate("otp-verification", {
    name: email.split("@")[0],   // friendly name fallback
    email,
    otp,
    expiresIn: "10 minutes",
  });

  await transporter.sendMail({
    from: `"PresentoAI" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your PresentoAI verification code",
    text: `Your one-time password is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html,
  });
}

// ---------- POST /api/auth/send-otp ----------
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

    const { email, password } = parsed.data;

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password + generate OTP in parallel
    const otp = generateOTP();
    const [hashedPassword, hashedOTP] = await Promise.all([
      bcrypt.hash(password, 12),
      bcrypt.hash(otp, 10),
    ]);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any previous OTP for this email, then insert the new one
    await prisma.emailOTP.deleteMany({ where: { email } });

    await prisma.emailOTP.create({
      data: {
        email,
        otp: hashedOTP,
        hashedPassword,
        expiresAt,
      },
    });

    // Send the OTP email
    await sendOTPEmail(email, otp);

    return NextResponse.json(
      { message: "OTP sent successfully. Please check your email." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[send-otp] Error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
