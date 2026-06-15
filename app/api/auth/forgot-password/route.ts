import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { renderMailTemplate } from "@/mail/render";

// ---------- validation ----------
const reqBodySchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ---------- helpers ----------
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendResetOTPEmail(email: string, otp: string, name: string): Promise<void> {
  const transporter = createTransporter();

  const html = await renderMailTemplate("password-reset", {
    name,
    email,
    otp,
    expiresIn: "10 minutes",
  });

  await transporter.sendMail({
    from: `"PresentoAI" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your PresentoAI password",
    text: `Your password reset code is: ${otp}\n\nThis code expires in 10 minutes. If you didn't request a password reset, ignore this email.`,
    html,
  });
}

// ---------- POST /api/auth/forgot-password ----------
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

    const { email } = parsed.data;

    // Look up the user — always respond with a generic message to avoid
    // leaking whether an email is registered (security best practice).
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Replace any existing reset OTP for this email
      await prisma.emailOTP.deleteMany({ where: { email, purpose: "PASSWORD_RESET" } });
      await prisma.emailOTP.create({
        data: { email, otp: hashedOTP, purpose: "PASSWORD_RESET", expiresAt },
      });

      const name = user.name ?? email.split("@")[0];
      await sendResetOTPEmail(email, otp, name);
    }

    // Return the same response whether user exists or not
    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a reset code has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return NextResponse.json(
      { error: "Failed to send reset code. Please try again." },
      { status: 500 }
    );
  }
}
