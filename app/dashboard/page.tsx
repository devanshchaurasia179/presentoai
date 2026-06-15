import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/signin")
  }

  type ExtendedUser = {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    aiCredits?: number
    role?: string
    createdAt?: string
  }

  const user = session.user as ExtendedUser

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3h16.5M3.75 21h16.5" />
              </svg>
            </div>
            <span className="text-white font-bold tracking-tight group-hover:text-indigo-300 transition-colors">PresentoAI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard" active>Dashboard</NavLink>
            <NavLink href="/dashboard/presentations">Presentations</NavLink>
            <NavLink href="/dashboard/folders">Folders</NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {/* AI Credits badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-950 border border-indigo-800 rounded-full px-3 py-1">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-indigo-300 text-xs font-semibold">{user.aiCredits ?? 0} credits</span>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "Avatar"}
                  width={34}
                  height={34}
                  className="rounded-full ring-2 ring-indigo-500"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="hidden md:block text-gray-300 text-sm font-medium">{user.name ?? user.email}</span>
            </div>

            {/* Sign out */}
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button
                type="submit"
                className="text-gray-400 hover:text-red-400 transition-colors text-sm font-medium cursor-pointer"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Welcome banner */}
        <div className="bg-gradient-to-br from-indigo-900/60 to-violet-900/40 border border-indigo-800/50 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">
              Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="text-indigo-300 text-sm mt-1">Ready to create something amazing today?</p>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Presentation
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon="🗂️" label="Presentations" value="0" />
          <StatCard icon="📁" label="Folders" value="0" />
          <StatCard icon="✨" label="AI Credits" value={String(user.aiCredits ?? 0)} accent />
        </div>

        {/* Recent presentations placeholder */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[260px]">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3h16.5M3.75 21h16.5" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-lg mb-1">No presentations yet</h2>
          <p className="text-gray-500 text-sm max-w-xs">
            Create your first AI-powered presentation to get started.
          </p>
          <button className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm cursor-pointer">
            Create presentation
          </button>
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      {children}
    </Link>
  )
}

function StatCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border flex items-center gap-4 ${
      accent
        ? "bg-indigo-950/60 border-indigo-800/60"
        : "bg-gray-900 border-gray-800"
    }`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <div className={`text-2xl font-bold ${accent ? "text-indigo-300" : "text-white"}`}>{value}</div>
        <div className="text-gray-400 text-sm">{label}</div>
      </div>
    </div>
  )
}
