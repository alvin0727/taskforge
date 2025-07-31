import UserAdapter from "@/adapters/api/userAdapter";
import { User } from "@/lib/types/user";

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

export default {
  login,
  verifyOTP,
  getProfile,
};
