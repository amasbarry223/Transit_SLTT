export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    permissions: string[];
    annexeIds: string[];
    nom: string;
}
export interface CurrentUserType {
    id: string;
    email: string;
    nom: string;
    role: string;
    permissions: string[];
    annexeIds: string[];
}
