/** Payload encodé dans le JWT access token */
export interface JwtPayload {
  sub: string;       // profile.id
  email: string;
  role: string;
  permissions: string[];
  annexeIds: string[];
  nom: string;
}

/** Utilisateur courant injecté par @CurrentUser() dans les controllers */
export interface CurrentUserType {
  id: string;
  email: string;
  nom: string;
  role: string;
  permissions: string[];
  annexeIds: string[];
}
