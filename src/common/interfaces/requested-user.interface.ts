export interface RequestedUser {
  id: string;
  user_name: string;
  role: string;
  permissions: string[];
  hospital_id?: string;
}
