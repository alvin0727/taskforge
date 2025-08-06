import { OrganizationMember } from "@/lib/types/organization";
import { create } from "zustand";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  type: string;
  role: string;
  joined_at: string;
  is_active: boolean;
  members_count: number;
  is_owner: boolean;
};

type OrganizationStore = {
  organizations: Organization[];
  activeOrg: Organization | null;
  total: number;
  members: OrganizationMember[];
  setOrganizations: (orgs: Organization[], total: number) => void;
  setActiveOrg: (org: Organization) => void;
  setMembers: (members: OrganizationMember[]) => void;
};

export const useOrganizationStore = create<OrganizationStore>((set) => ({
  organizations: [],
  activeOrg: null,
  total: 0,
  members: [],
  setOrganizations: (orgs, total) => set({ organizations: orgs, total }),
  setActiveOrg: (org) => set({ activeOrg: org }),
  setMembers: (members) => set({ members })
}));