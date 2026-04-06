export type UserRole = 'ADMIN' | 'PROFESSIONAL' | 'PATIENT' | 'SUPERADMIN';

export type User = {
    user_id: string;
    email: string | null;
    full_name: string | null;
    organization_id: string | null;
    roles: UserRole[];
    created_at: string;
}
