import organization_adapter from "@/adapters/api/organizationAdapter";

export async function getInvitationDetails(token: string): Promise<any> {
    const res = await organization_adapter.getInvitationDetails(token);
    return res;
}

export async function acceptInvitation(token: string): Promise<any> {
    const res = await organization_adapter.acceptInvitation(token);
    return res;
}

export default {
    getInvitationDetails,
    acceptInvitation
};