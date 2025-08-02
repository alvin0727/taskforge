import api from "@/lib/axios";
import { User, RequestSignupPersonal, RequestSignupTeam, RequestSignupWithInvitation } from "@/lib/types/user";

export async function login(email: string, password: string): Promise<any> {
  const res = await api.post(`/users/login`, { email, password });
  return res.data;
}

export async function verifyOTP(email: string, otp: string): Promise<{ message: string; user: User }> {
  const res = await api.post(`/users/verify-otp`, { email, otp });
  return res.data;
}
export async function getProfile(): Promise<User> {
  const res = await api.get(`/users/me`);
  return res.data;
}

export async function signupPersonal(data: RequestSignupPersonal): Promise<any> {
  const res = await api.post(`/users/register/personal`, data);
  return res.data;
}

export async function signupTeam(data: RequestSignupTeam): Promise<any> {
  const res = await api.post(`/users/register/team`, data);
  return res.data;
}

export async function signupWithInvitation(data: RequestSignupWithInvitation): Promise<any> {
  const res = await api.post(`/users/register/join`, data);
  return res.data;
}

export async function verifyEmail(token: string) {
  return api.get(`/users/verify-email?token=${token}`);
}

export default {
  login,
  verifyOTP,
  getProfile,
  verifyEmail,
  signupPersonal,
  signupTeam,
  signupWithInvitation
};