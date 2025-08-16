import api from "@/lib/axios";
import { DashboardResponse } from "@/lib/types/dashboard";

export const getDashboardData = async (orgId: String): Promise<DashboardResponse> => {
    const response = await api.get(`/dashboard/summary/${orgId}`);
    return response.data;
};

export default {
    getDashboardData,
};
