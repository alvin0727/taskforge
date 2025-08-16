import { OrganizationMember, Organization } from "@/lib/types/organization";
import { create } from "zustand";

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