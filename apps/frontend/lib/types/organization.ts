export interface InvitationInfo  {
  email: string;
  organization_name: string;
  role: string;
  message?: string;
};

export interface Organization {
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
}


export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  status?: string;
  joined_at?: string;
}

export interface OrganizationInviteRequest{
  email: string;
  message: string;
}