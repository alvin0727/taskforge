export interface UserProfile {
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  timezone: string;
  language: string;
  theme: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
  last_login: string | null;
  profile: UserProfile;
}

export interface RequestSignupPersonal {
  email: string;
  name: string;
  password: string;
}

export interface RequestSignupTeam {
  email: string;
  name: string;
  password: string;
  organization_name: string;
  organization_description: string;
}

export interface RequestSignupWithInvitation {
  email: string;
  name: string;
  password: string;
  invitation_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
export interface VerifyOTPRequest {
  email: string;
  otp: string;
}
