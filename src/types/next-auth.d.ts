import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
    isAdmin?: boolean;
    agentId?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    isActive?: boolean;
  }

  interface Session {
    user: {
      accessToken?: string;
      tokenType?: string;
      expiresIn?: number;
      isAdmin?: boolean;
      agentId?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      isActive?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    tokenType?: string;
    expiresIn?: number;
    isAdmin?: boolean;
    agentId?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    isActive?: boolean;
  }
}
