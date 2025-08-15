import organization_adapter from "@/adapters/api/organizationAdapter";
import { OrganizationInviteRequest, OrganizationMember } from "@/lib/types/organization";

export async function getInvitationDetails(token: string): Promise<any> {
    const res = await organization_adapter.getInvitationDetails(token);
    return res;
}

export async function acceptInvitation(token: string): Promise<any> {
    const res = await organization_adapter.acceptInvitation(token);
    return res;
}

export async function inviteMember(orgId: string, data: OrganizationInviteRequest): Promise<{ message: string }> {
    const res = await organization_adapter.inviteMember(orgId, data);
    return res;
}

export async function getMyOrganizations(): Promise<any> {
    const res = await organization_adapter.getMyOrganizations();
    return res;
}

export async function switchOrganization(orgId: string): Promise<any> {
    const res = await organization_adapter.switchOrganization(orgId);
    return res;
}

export async function getOrganizationMembers(orgSlug: string): Promise<{ members: OrganizationMember[] }> {
    const res = await organization_adapter.getOrganizationMembers(orgSlug);
    return res;
}

export default {
    getInvitationDetails,
    acceptInvitation,
    getMyOrganizations,
    switchOrganization,
    getOrganizationMembers,
    inviteMember
};