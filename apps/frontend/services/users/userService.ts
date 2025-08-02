import UserAdapter from "@/adapters/api/userAdapter";
import { User, RequestSignupPersonal, RequestSignupTeam, RequestSignupWithInvitation } from "@/lib/types/user";

async function login(email: string, password: string): Promise<any> {
  const res = await UserAdapter.login(email, password);
  return res;
}

async function verifyOTP(email: string, otp: string): Promise<{ message: string; user: User }> {
  const res = await UserAdapter.verifyOTP(email, otp);
  return res;
}

async function getProfile(): Promise<User> {
  const res = await UserAdapter.getProfile();
  return res;
}

async function signupPersonal(data: RequestSignupPersonal): Promise<any> {
  const res = await UserAdapter.signupPersonal(data);
  return res;
}

async function signupTeam(data: RequestSignupTeam): Promise<any> {
  const res = await UserAdapter.signupTeam(data);
  return res;
}

async function signupWithInvitation(data: RequestSignupWithInvitation): Promise<any> {
  const res = await UserAdapter.signupWithInvitation(data);
  return res;
}

async function verifyEmail(token: string): Promise<any> {
  const res = await UserAdapter.verifyEmail(token);
  return res;
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