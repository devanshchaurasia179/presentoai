"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Step = "credentials" | "otp"

export default function AuthPage() {
  const router = useRouter()

  // UI state
  const [step, setStep] = useState<Step>("credentials")
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Form values
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // ── Password strength ─────────────────────────────────────────────────
  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const passwordStrong = Object.values(passwordChecks).every(Boolean)

  // ── Google sign-in ────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true)
    setError("")
    await signIn("google", { callbackUrl: "/dashboard" })
    setGoogleLoading(false)
  }

  // ── Send OTP (sign-up step 1) ─────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!passwordStrong) {
      setError("Please meet all password requirements.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        return
      }
      setSuccessMsg("We sent a 6-digit code to " + email)
      setStep("otp")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Verify OTP (sign-up step 2) ───────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Invalid code.")
        return
      }
      router.push("/onboarding")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────
  async function handleResend() {
    setError("")
    setSuccessMsg("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to resend.")
      } else {
        setSuccessMsg("New code sent to " + email)
        setOtp("")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3h16.5M3.75 21h16.5" />
              </svg>
            </div>
            <span className="text-white text-xl font-bold tracking-tight group-hover:text-indigo-300 transition-colors">PresentoAI</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">

          {step === "credentials" && (
            <>
              <div className="mb-6">
                <h1 className="text-white text-2xl font-bold">Create your account</h1>
                <p className="text-gray-400 text-sm mt-1">Join PresentoAI and start building stunning presentations.</p>
              </div>

              {/* Google button */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-900 font-semibold py-3 rounded-xl transition-colors mb-6 cursor-pointer"
              >
                {googleLoading ? (
                  <Spinner dark />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">or sign up with email</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              {/* Email form */}
              <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      autoComplete="new-password"
                      className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {/* Strength indicators */}
                  {password.length > 0 && (
                    <ul className="mt-2.5 flex flex-col gap-1">
                      <PasswordCheck ok={passwordChecks.length} label="At least 8 characters" />
                      <PasswordCheck ok={passwordChecks.upper} label="One uppercase letter" />
                      <PasswordCheck ok={passwordChecks.number} label="One number" />
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="confirm">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                    className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:ring-1 ${
                      confirmPassword && password !== confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
                    }`}
                  />
                </div>

                {error && <ErrorBanner message={error} />}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {isLoading ? <Spinner /> : null}
                  {isLoading ? "Sending code…" : "Continue"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <button
                onClick={() => { setStep("credentials"); setError(""); setOtp("") }}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-5 transition-colors group cursor-pointer"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>

              <div className="mb-6">
                <h1 className="text-white text-2xl font-bold">Check your email</h1>
                <p className="text-gray-400 text-sm mt-1">
                  We sent a 6-digit code to{" "}
                  <span className="text-indigo-400 font-medium">{email}</span>
                </p>
              </div>

              {successMsg && (
                <div className="flex items-center gap-2 bg-green-900/40 border border-green-700/50 text-green-300 text-sm rounded-xl px-4 py-3 mb-4">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="otp">
                    Verification code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    required
                    autoComplete="one-time-code"
                    className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>

                {error && <ErrorBanner message={error} />}

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <Spinner /> : null}
                  {isLoading ? "Verifying…" : "Verify & create account"}
                </button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-4">
                Didn&apos;t receive it?{" "}
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Resend code
                </button>
              </p>
            </>
          )}
        </div>

        {/* Sign in link */}
        {step === "credentials" && (
          <p className="text-center text-gray-500 text-sm mt-5">
            Already have an account?{" "}
            <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PasswordCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-green-500" : "bg-gray-700"}`}>
        {ok && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </span>
      <span className={`text-xs ${ok ? "text-green-400" : "text-gray-500"}`}>{label}</span>
    </li>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-900/40 border border-red-700/50 text-red-300 text-sm rounded-xl px-4 py-3">
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      {message}
    </div>
  )
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg className={`w-4 h-4 animate-spin ${dark ? "text-gray-700" : "text-white"}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}
