import api from "@/lib/axios";

export async function getInvitationDetails(token: string): Promise<any> {
  const res = await api.get(`/organizations/invitations/${token}`);
  return res.data;
}

export default {
  getInvitationDetails
};