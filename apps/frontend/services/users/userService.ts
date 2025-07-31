import UserAdapter from "@/adapters/api/userAdapter";
import { User } from "@/lib/types/user";

async function login(email: string, password: string): Promise<any> {
  const res = await UserAdapter.Login(email, password);
  return res;
}

export default {
  login,
};
