import api from "@/lib/axios";
import * as OrganizationTypes from "@/lib/types/organization";

export async function getInvitationDetails(token: string): Promise<any> {
  const res = await api.get(`/organizations/invitations/${token}`);
  return res.data;
}

export async function acceptInvitation(token: string): Promise<any> {
  const res = await api.post(`/organizations/accept-invitation/${token}`);
  return res.data;
}

export async function inviteMember(orgId: string, data: OrganizationTypes.OrganizationInviteRequest): Promise<{ message: string }> {
  const res = await api.post(`/organizations/${orgId}/invite`, data);
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

export async function getOrganizationMembers(orgId: string): Promise<{ members: OrganizationTypes.OrganizationMember[] }> {
  const res = await api.get(`/organizations/${orgId}/members`);
  return res.data;
}

export async function getOrganizationTask(orgId: String, data: OrganizationTypes.GetOrganizationTasksRequest): Promise<OrganizationTypes.GetOrganizationTasksResponse> {
  const res = await api.post(`/organizations/${orgId}/tasks/search`, data);
  return res.data;
}

export async function getOrganizationActivities(orgId: string, data: OrganizationTypes.GetOrganizationActivitiesRequest): Promise<OrganizationTypes.GetOrganizationActivitiesResponse> {
  const res = await api.post(`/organizations/${orgId}/activities`, data);
  return res.data;
}

export default {
  getInvitationDetails,
  acceptInvitation,
  inviteMember,
  getMyOrganizations,
  switchOrganization,
  getOrganizationMembers,
  getOrganizationTask,
  getOrganizationActivities
};