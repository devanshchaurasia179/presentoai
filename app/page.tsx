import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const session = await auth()

  // Redirect signed-in users straight to dashboard
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3h16.5M3.75 21h16.5" />
              </svg>
            </div>
            <span className="text-white font-bold tracking-tight">PresentoAI</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">AI-Powered Presentations</span>
          </div>

          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-5">
            Create stunning slides{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              in seconds
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            PresentoAI turns your ideas into beautiful, professional presentations using the power of AI.
            Just describe it — we&apos;ll do the rest.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base shadow-lg shadow-indigo-600/25"
            >
              Start for free →
            </Link>
            <Link
              href="/signin"
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
            >
              Sign in
            </Link>
          </div>

          <p className="text-gray-600 text-xs mt-5">No credit card required · 10 free AI credits on sign up</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FeatureCard
            emoji="⚡"
            title="AI generation"
            description="Describe your topic, pick a style, and watch PresentoAI build your deck in under a minute."
          />
          <FeatureCard
            emoji="🗂️"
            title="Organised folders"
            description="Keep your presentations tidy with a Windows-style folder tree. Nest, pin, and search with ease."
          />
          <FeatureCard
            emoji="🔒"
            title="Secure by default"
            description="Sign up with Google or email OTP. Your data is yours — encrypted at rest, isolated by account."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center">
        <p className="text-gray-600 text-sm">© {new Date().getFullYear()} PresentoAI. All rights reserved.</p>
      </footer>
    </main>
  )
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
      <div className="text-3xl mb-4">{emoji}</div>
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
