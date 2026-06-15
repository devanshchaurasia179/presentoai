"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Step = "email" | "otp" | "new-password" | "done"

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Field values
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // ── Password strength ─────────────────────────────────────────────────
  const passwordChecks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  }
  const passwordStrong = Object.values(passwordChecks).every(Boolean)

  // ── Step 1: send reset OTP ────────────────────────────────────────────
  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  // ── Resend OTP ────────────────────────────────────────────────────────
  async function handleResend() {
    setError("")
    setSuccessMsg("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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

  // ── Step 2: verify OTP → only advance if the code is valid ──────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Invalid code.")
        return
      }
      setSuccessMsg("")
      setStep("new-password")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Step 3: reset password ────────────────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!passwordStrong) {
      setError("Please meet all password requirements.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        // If OTP is wrong/expired, send back to OTP step
        if (res.status === 401 || res.status === 404 || res.status === 410) {
          setStep("otp")
          setOtp("")
        }
        setError(data.error ?? "Something went wrong.")
        return
      }
      setStep("done")
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

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h1 className="text-white text-2xl font-bold">Forgot your password?</h1>
                <p className="text-gray-400 text-sm mt-1">
                  No worries. Enter your email and we&apos;ll send you a reset code.
                </p>
              </div>

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

                {error && <ErrorBanner message={error} />}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {isLoading && <Spinner />}
                  {isLoading ? "Sending code…" : "Send reset code"}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <>
              <button
                onClick={() => { setStep("email"); setError(""); setOtp("") }}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-5 transition-colors group cursor-pointer"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-pink-500/15 border border-pink-500/30 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
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
                    Reset code
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
                  {isLoading && <Spinner />}
                  {isLoading ? "Verifying…" : "Continue"}
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

          {/* ── Step 3: New password ── */}
          {step === "new-password" && (
            <>
              <button
                onClick={() => { setStep("otp"); setError("") }}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-5 transition-colors group cursor-pointer"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-violet-500/15 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <h1 className="text-white text-2xl font-bold">Set new password</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="new-password">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
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
                  {newPassword.length > 0 && (
                    <ul className="mt-2.5 flex flex-col gap-1">
                      <PasswordCheck ok={passwordChecks.length} label="At least 8 characters" />
                      <PasswordCheck ok={passwordChecks.upper} label="One uppercase letter" />
                      <PasswordCheck ok={passwordChecks.number} label="One number" />
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                    className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:ring-1 ${
                      confirmPassword && newPassword !== confirmPassword
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
                  {isLoading && <Spinner />}
                  {isLoading ? "Resetting…" : "Reset password"}
                </button>
              </form>
            </>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (
            <div className="flex flex-col items-center text-center py-4">
              {/* Success icon */}
              <div className="w-16 h-16 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-white text-2xl font-bold mb-2">Password reset!</h1>
              <p className="text-gray-400 text-sm mb-8 max-w-xs">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push("/signin")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Go to sign in
              </button>
            </div>
          )}
        </div>

        {/* Back to sign in link */}
        {step !== "done" && (
          <p className="text-center text-gray-500 text-sm mt-5">
            Remember your password?{" "}
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

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
