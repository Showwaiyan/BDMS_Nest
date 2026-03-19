import { Prisma } from 'prisma/generated/client';

/**
 * ID only - minimal select for ID-only operations
 * Use in: softDelete, checkExistsByUsername, checkExistsByEmail, updateUserRole, toggleActive
 */
export const USER_ID_ONLY_SELECT: Prisma.UserSelect = {
  id: true,
};

/**
 * Basic user information - safe for client exposure
 * Excludes password and permissions
 * Use in: Paginated lists, public profiles, update responses
 */
export const USER_BASIC_SELECT: Prisma.UserSelect = {
  id: true,
  user_name: true,
  email: true,
  role_id: true,
  hospital_id: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
};

/**
 * My profile view - authenticated user viewing their own profile
 * Includes hospital name and details
 * Use in: GET /users/me
 */
export const USER_ME_PROFILE_SELECT: Prisma.UserSelect = {
  ...USER_BASIC_SELECT,
  hospital: {
    select: {
      id: true,
      name: true,
    },
  },
};

/**
 * Auth validation - complete fields for internal auth logic
 * Includes: password + full permission tree for validation
 * Use in: findByUsername (login), findById (token refresh)
 * NOTE: Password + permissions not sent to client, only used server-side
 */
export const USER_AUTH_INTERNAL_SELECT: Prisma.UserSelect = {
  id: true,
  user_name: true,
  email: true,
  password: true,
  role_id: true,
  hospital_id: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
  role: {
    select: {
      id: true,
      name: true,
      role_permissions: {
        select: {
          permission: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
};
