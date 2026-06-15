import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

// ---------- validation ----------
const reqBodySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  profession: z
    .string()
    .min(2, "Profession must be at least 2 characters")
    .max(100, "Profession must be at most 100 characters"),
});

// ---------- JWT helpers ----------
function getJWTSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

interface TokenPayload {
  id: string;
  email: string;
  isOnboarded: boolean;
}

async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getJWTSecret());
  return payload as unknown as TokenPayload;
}

async function mintToken(
  userId: string,
  email: string,
  isOnboarded: boolean
): Promise<string> {
  return new SignJWT({ id: userId, email, isOnboarded })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(userId)
    .sign(getJWTSecret());
}

// ---------- POST /api/auth/onboarding ----------
async function handler(req: NextRequest) {
  try {
    // ── Auth: read and verify the cookie ──────────────────────────────────
    const cookieToken = req.cookies.get("auth-token")?.value;
    if (!cookieToken) {
      return NextResponse.json(
        { error: "Unauthorised. Please sign in." },
        { status: 401 }
      );
    }

    let payload: TokenPayload;
    try {
      payload = await verifyToken(cookieToken);
    } catch {
      return NextResponse.json(
        { error: "Session expired or invalid. Please sign in again." },
        { status: 401 }
      );
    }

    // Guard: already onboarded
    if (payload.isOnboarded) {
      return NextResponse.json(
        { error: "User has already completed onboarding." },
        { status: 409 }
      );
    }

    // ── Validate body ─────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = reqBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, profession } = parsed.data;

    // ── Update user ───────────────────────────────────────────────────────
    const updatedUser = await prisma.user.update({
      where: { id: payload.id },
      data: {
        name,
        profession,
        isOnboarded: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profession: true,
        isOnboarded: true,
        role: true,
        aiCredits: true,
      },
    });

    // ── Re-mint token with isOnboarded: true ──────────────────────────────
    const newToken = await mintToken(
      updatedUser.id,
      updatedUser.email,
      updatedUser.isOnboarded
    );

    const response = NextResponse.json(
      {
        message: "Onboarding complete.",
        redirectTo: "/dashboard",
        user: updatedUser,
      },
      { status: 200 }
    );

    response.cookies.set("auth-token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[onboarding] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// Export both — POST for initial call, PATCH for idiomatic REST if needed
export { handler as POST, handler as PATCH };
