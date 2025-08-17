export interface InvitationInfo {
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

export interface OrganizationInviteRequest {
  email: string;
  message: string;
}

export interface GetOrganizationTasksRequest {
  project_id?: string;
  assignee_id?: string;
  status?: string;
  search?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}

export interface OrganizationTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  assignee: string;
  project_color: string;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GetOrganizationTasksResponse {
  tasks: OrganizationTask[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface OrganizationActivity {
  id: string;
  user: string;
  avatar: string;
  item: string;
  created_at: string;
}

export interface GetOrganizationActivitiesResponse {
  activities: OrganizationActivity[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface GetOrganizationActivitiesRequest {
  limit?: number;
  offset?: number;
  project_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}