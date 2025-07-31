import api from "@/lib/axios";
import { User } from "@/lib/types/user";

export async function Login(email: string, password: string): Promise<any> {
  const res = await api.post(`/users/login`, { email, password });
  return res.data;
}


export default {
  Login,
}