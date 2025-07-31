import api from "@/lib/axios";
import { User } from "@/lib/types/user";

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

export default {
  login,
  verifyOTP,
  getProfile,
};