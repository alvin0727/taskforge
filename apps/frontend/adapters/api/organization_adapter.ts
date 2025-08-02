import api from "@/lib/axios";

export async function getInvitationDetails(token: string): Promise<any> {
  const res = await api.get(`/organizations/invitation/${token}`);
  return res.data;
}

export default {
  getInvitationDetails
};