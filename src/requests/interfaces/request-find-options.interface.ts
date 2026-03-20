import { RequestStatus } from 'prisma/generated/client';

/**
 * Interface for internal service lookup options.
 * Helps decouple the generic findRequestOrThrow logic from specific call sites.
 */
export interface RequestFindOptions {
  userId?: string;
  hospitalId?: string;
  expectedStatus?: RequestStatus;
  notFoundMessage?: string;
  statusErrorMessage?: string;
}
