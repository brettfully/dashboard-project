import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

function getRoleRoute(role?: string): string {
  switch (role) {
    case "SDR": return "/data-entry/sdr"
    case "ACCOUNT_EXECUTIVE": return "/data-entry/ae"
    case "SALES_MANAGER":
    case "COMPANY_ADMIN": return "/data-entry/manager"
    default: return "/overview"
  }
}

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = (req.auth.user as { role?: string })?.role
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith("/data-entry/sdr") && role !== "SDR") {
    return NextResponse.redirect(new URL(getRoleRoute(role), req.url))
  }
  if (pathname.startsWith("/data-entry/ae") && role !== "ACCOUNT_EXECUTIVE") {
    return NextResponse.redirect(new URL(getRoleRoute(role), req.url))
  }
  if (pathname.startsWith("/data-entry/manager") && role !== "SALES_MANAGER" && role !== "COMPANY_ADMIN") {
    return NextResponse.redirect(new URL(getRoleRoute(role), req.url))
  }
})

export const config = {
  matcher: ["/((?!login|register|api|_next/static|_next/image|favicon.ico).*)"],
}
