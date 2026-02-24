export type UserRole = "student" | "facilitator" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
};

export type SessionUser = {
  id: string;
  email: string | null;
  profile: Profile | null;
};
