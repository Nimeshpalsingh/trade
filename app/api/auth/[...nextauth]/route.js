import { API_URL } from "../../../utils/apiConfig";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "DUMMY_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "DUMMY_CLIENT_SECRET",
    }),
  ],
  pages: {
    signIn: '/login', // Custom login page
  },
  secret: process.env.NEXTAUTH_SECRET || "some-random-secret-key-12345",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // Initial sign in
        try {
          const res = await fetch(`${API_URL}/google-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.apiToken = data.token;
          }
        } catch (error) {
          console.error("Failed to authenticate with backend:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.apiToken = token.apiToken;
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
