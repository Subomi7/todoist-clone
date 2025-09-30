export interface Project {
  _id: string;           // mongo id string
  id?: string;           // optional alternative id field
  name: string;
  userId?: string;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}