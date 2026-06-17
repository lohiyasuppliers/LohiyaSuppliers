import type { AppRole } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    id: string;
    role: AppRole;
    company?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: AppRole;
      company?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    company?: string | null;
  }
}

export type {};
