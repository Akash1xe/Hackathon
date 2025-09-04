// File: c:\hackathon\src\app\api\auth\[...nextauth]\route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import dbConnect from "@/lib/dbConnect";
import User from "@/model/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await dbConnect();
        
        // Find user by email
        const user = await User.findOne({ email: credentials.email });
        
        // Check if user exists
        if (!user) {
          throw new Error("No user found with this email");
        }
        
        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }
        
        // Return the user object (will be encoded in the JWT)
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image || null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Pass user role and ID to the token when user is first authenticated
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass token properties to the client session
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',   // Custom sign-in page
    signOut: '/',            // Redirect after sign-out
    error: '/auth/error',    // Error page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };