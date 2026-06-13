import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        // Upsert user into our own User model
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            avatar: user.image ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name ?? null,
            avatar: user.image ?? null,
          },
        })
      }
      return true
    },
    async jwt({ token, user }) {
      // On first sign-in, user object is present — fetch full record from DB
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.name
          token.picture = dbUser.avatar
          token.aiCredits = dbUser.aiCredits
          token.role = dbUser.role
          token.createdAt = dbUser.createdAt.toISOString()
        }
      }
      return token
    },
    async session({ session, token }) {
      // Expose full user data to the session
      session.user.id = token.id as string
      session.user.email = token.email as string
      session.user.name = token.name as string
      session.user.image = token.picture as string
      // @ts-expect-error – custom fields
      session.user.aiCredits = token.aiCredits
      // @ts-expect-error – custom fields
      session.user.role = token.role
      // @ts-expect-error – custom fields
      session.user.createdAt = token.createdAt
      return session
    },
  },
})
