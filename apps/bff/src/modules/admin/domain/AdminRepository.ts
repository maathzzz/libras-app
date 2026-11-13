// A CMS operator. Only one role exists: an active operator may do everything in the CMS.
export interface Admin {
  userId: string;
  email: string;
  name: string;
  active: boolean;
}

export interface AdminRepository {
  // Null when the user is not an operator, active or not.
  findByUserId(userId: string): Promise<Admin | null>;
  // Every operator, active or not, by name.
  list(): Promise<Admin[]>;
  // Adds the operator, or updates and reactivates one that already exists.
  save(admin: Admin): Promise<void>;
}
