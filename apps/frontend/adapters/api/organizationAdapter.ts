import api from "@/lib/axios";
import { OrganizationMember } from "@/lib/types/organization";

export async function getInvitationDetails(token: string): Promise<any> {
  const res = await api.get(`/organizations/invitations/${token}`);
  return res.data;
}

export async function acceptInvitation(token: string): Promise<any> {
  const res = await api.post(`/organizations/accept-invitation/${token}`);
  return res.data;
}

export async function getMyOrganizations(): Promise<any> {
  const res = await api.get(`/organizations/my-organizations`);
  return res.data;
}

export async function switchOrganization(orgId: string): Promise<any> {
  const res = await api.post(`/organizations/switch/${orgId}`);
  return res.data;
}

export async function getOrganizationMembers(orgSlug: string): Promise<{ members: OrganizationMember[] }> {
  const res = await api.get(`/organizations/${orgSlug}/members`);
  return res.data;
}

export default {
  getInvitationDetails,
  acceptInvitation,
  getMyOrganizations,
  switchOrganization,
  getOrganizationMembers,
};