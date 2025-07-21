// This file maintains compatibility with your existing schema exports
// You can add additional user-related utilities here

export interface UserFilters {
  username?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface UserSortOptions {
  field: 'id' | 'username' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

// Utility function to validate username
export function isValidUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(username);
}

// Export a users object for compatibility if needed
export const users = {
  validate: {
    username: isValidUsername
  }
};