import dashboardAdapter from "@/adapters/api/dashboardAdapter";
import { DashboardResponse } from "@/lib/types/dashboard";

export const getDashboardData = async (orgId: String): Promise<DashboardResponse> => {
    return dashboardAdapter.getDashboardData(orgId);
};

export default {
    getDashboardData,
};
