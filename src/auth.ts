import NextAuth from "next-auth"
import Line from "next-auth/providers/line"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    providers: [
        Line({
            clientId: process.env.LINE_CHANNEL_ID,
            clientSecret: process.env.LINE_CHANNEL_SECRET,
            authorization: { params: { scope: "profile openid email" } },
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                // Add custom fields to session
                // @ts-ignore
                session.user.id = user.id;
                // @ts-ignore
                session.user.role = user.role;
            }
            return session;
        },
    },
})
