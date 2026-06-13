import { auth, signIn, signOut } from "@/auth"
import Image from "next/image"

export default async function HomePage() {
  const session = await auth()
  type ExtendedUser = {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    aiCredits?: number
    role?: string
    createdAt?: string
  }

  const user: ExtendedUser | undefined = session?.user as ExtendedUser | undefined

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 rounded-2xl p-10 flex flex-col items-center gap-6 shadow-2xl">
          <h1 className="text-3xl font-bold text-white tracking-tight">PresentoAI</h1>
          <p className="text-gray-400 text-sm">Sign in to get started</p>
          <form
            action={async () => {
              "use server"
              await signIn("google")
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-3 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Avatar"}
              width={64}
              height={64}
              className="rounded-full ring-2 ring-indigo-500"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <h2 className="text-white text-xl font-bold">{user.name ?? "—"}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
        </div>

        {/* User details from DB */}
        <div className="bg-gray-800 rounded-xl divide-y divide-gray-700">
          <DetailRow label="User ID" value={user.id ?? "—"} mono />
          <DetailRow label="Role" value={user.role ?? "—"} badge />
          <DetailRow label="AI Credits" value={String(user.aiCredits ?? 0)} />
          <DetailRow
            label="Member since"
            value={
              user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"
            }
          />
        </div>

        {/* Sign out */}
        <form
          action={async () => {
            "use server"
            await signOut()
          }}
        >
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}

function DetailRow({
  label,
  value,
  mono,
  badge,
}: {
  label: string
  value: string
  mono?: boolean
  badge?: boolean
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <span className="text-gray-400 text-sm">{label}</span>
      {badge ? (
        <span className="bg-indigo-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {value}
        </span>
      ) : (
        <span
          className={`text-white text-sm ${mono ? "font-mono text-xs text-gray-300 truncate max-w-[200px]" : ""}`}
        >
          {value}
        </span>
      )}
    </div>
  )
}
