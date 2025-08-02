import api from "@/lib/axios";

export async function getInvitationDetails(token: string): Promise<any> {
  const res = await api.get(`/organizations/invitations/${token}`);
  return res.data;
}

export async function acceptInvitation(token: string): Promise<any> {
  const res = await api.post(`/organizations/accept-invitation/${token}`);
  return res.data;
}

export default {
  getInvitationDetails,
  acceptInvitation
};