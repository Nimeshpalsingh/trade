import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect everything except /login and /api/auth
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|api/auth).*)"],
};
