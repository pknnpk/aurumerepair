import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isAuthRoute = req.nextUrl.pathname.startsWith('/login')

    if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL('/', req.nextUrl))
    }

    // Protect all other routes except public ones
    // Add logic here if needed, or rely on page-level checks
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
