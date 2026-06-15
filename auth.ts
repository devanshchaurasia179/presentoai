import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
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
            profession: "",
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
          token.isOnboarded = dbUser.isOnboarded
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
      session.user.isOnboarded = token.isOnboarded
      // @ts-expect-error – custom fields
      session.user.createdAt = token.createdAt
      return session
    },
  },
})
