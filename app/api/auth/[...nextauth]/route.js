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
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
