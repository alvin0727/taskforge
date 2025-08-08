import api from "@/lib/axios";
import { User, RequestSignupPersonal, RequestSignupTeam, RequestSignupWithInvitation, LoginRequest, VerifyOTPRequest } from "@/lib/types/user";

export async function login(data: LoginRequest): Promise<any> {
  const res = await api.post(`/users/login`, data);
  return res.data;
}

export async function logout(): Promise<any> {
  const res = await api.post(`/users/logout`);
  return res.data;
}

export async function verifyOTP(data: VerifyOTPRequest): Promise<{ message: string; user: User }> {
  const res = await api.post(`/users/verify-otp`, data);
  return res.data;
}
export async function getProfile(): Promise<User> {
  const res = await api.get(`/users/me`);
  return res.data.user;
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
  logout,
  verifyOTP,
  getProfile,
  verifyEmail,
  signupPersonal,
  signupTeam,
  signupWithInvitation
};