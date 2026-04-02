import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Helper to get secure API URL (works on both client and server)
const getSecureApiUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is not set');
  }
  
  // Always force HTTPS in production (VERCEL_ENV is set on Vercel)
  if (url.startsWith('http:') && (process.env.VERCEL_ENV || process.env.NODE_ENV === 'production')) {
    url = url.replace('http:', 'https:');
  }
  
  return url;
};

const nextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          // Call the backend API with secure URL
          const apiUrl = getSecureApiUrl();
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "accept": "application/json",
            },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            // Return null if authentication fails
            return null;
          }

          const data = await response.json();

          // Return user object with token information
          return {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.first_name} ${data.user.last_name}`,
            username: data.user.username,
            accessToken: data.access_token,
            tokenType: data.token_type,
            expiresIn: data.expires_in,
            isAdmin: data.user.is_admin,
            agentId: data.user.agent_id,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            isActive: data.user.is_active,
            role: data.user.role,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.tokenType = user.tokenType;
        token.expiresIn = user.expiresIn;
        token.isAdmin = user.isAdmin;
        token.agentId = user.agentId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.username = user.username;
        token.isActive = user.isActive;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.accessToken = token.accessToken as string;
        session.user.tokenType = token.tokenType as string;
        session.user.expiresIn = token.expiresIn as number;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.agentId = token.agentId as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.username = token.username as string;
        session.user.isActive = token.isActive as boolean;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 hours (matching backend expiration)
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(nextAuthConfig);
