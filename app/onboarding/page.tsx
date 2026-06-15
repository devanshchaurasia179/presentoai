"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PROFESSIONS = [
  "Student",
  "Teacher / Educator",
  "Business Analyst",
  "Product Manager",
  "Designer",
  "Engineer / Developer",
  "Marketing Professional",
  "Researcher",
  "Consultant",
  "Entrepreneur",
  "Other",
]

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [profession, setProfession] = useState("")
  const [customProfession, setCustomProfession] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const finalProfession = profession === "Other" ? customProfession : profession

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!finalProfession.trim()) {
      setError("Please tell us your profession.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), profession: finalProfession.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        return
      }
      router.push(data.redirectTo ?? "/dashboard")
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

      <div className="relative w-full max-w-lg">
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

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            Account created
          </div>
          <div className="w-8 h-px bg-gray-700" />
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-medium">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">2</span>
            </div>
            Your profile
          </div>
          <div className="w-8 h-px bg-gray-700" />
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 text-[10px] font-bold">3</span>
            </div>
            Dashboard
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-7">
            <h1 className="text-white text-2xl font-bold">Tell us about yourself</h1>
            <p className="text-gray-400 text-sm mt-1">This helps us personalise your experience.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1.5" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                required
                autoComplete="name"
                className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>

            {/* Profession */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="profession">
                What best describes you?
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROFESSIONS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setProfession(p); setCustomProfession("") }}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all cursor-pointer text-left ${
                      profession === p
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {profession === "Other" && (
                <input
                  type="text"
                  value={customProfession}
                  onChange={e => setCustomProfession(e.target.value)}
                  placeholder="Describe your role…"
                  required
                  className="mt-3 w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors"
                />
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-900/40 border border-red-700/50 text-red-300 text-sm rounded-xl px-4 py-3">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !name.trim() || !finalProfession.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              {isLoading && (
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {isLoading ? "Saving…" : "Go to dashboard →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
