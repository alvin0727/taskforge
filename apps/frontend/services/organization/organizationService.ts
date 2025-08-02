import organization_adapter from "@/adapters/api/organization_adapter";

async function getInvitationDetails(token: string): Promise<any> {
    const res = await organization_adapter.getInvitationDetails(token);
    return res;
}

export default {
    getInvitationDetails
};