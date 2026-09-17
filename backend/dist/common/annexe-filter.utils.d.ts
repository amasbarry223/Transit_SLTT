import type { CurrentUserType } from '../auth/auth.types';
export declare function buildAnnexeScopeFilter(user: CurrentUserType, options?: {
    allowUnassigned?: boolean;
}): Record<string, any>;
export declare function assertAnnexeAccess(user: CurrentUserType, annexeId?: string | null, resourceName?: string): void;
