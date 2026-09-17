import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { CurrentUserType } from './auth.types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    private setAuthCookies;
    private setCsrfCookie;
    private clearAuthCookies;
    login(loginDto: LoginDto, res: Response): Promise<{
        user: {
            id: string;
            nom: string;
            email: string;
            role: import("@prisma/client").$Enums.RoleUtilisateur;
            permissions: string[];
            annexeIds: any[];
        };
    }>;
    refresh(req: Request, res: Response): Promise<{
        success: boolean;
    }>;
    logout(req: Request, res: Response): Promise<void>;
    me(user: CurrentUserType): Promise<CurrentUserType>;
    updateProfile(user: CurrentUserType, body: {
        nom?: string;
        email?: string;
    }): Promise<{
        id: string;
        email: string;
        nom: string;
        telephone: string;
        role: import("@prisma/client").$Enums.RoleUtilisateur;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        actif: boolean;
        avatarUrl: string;
    }>;
    changePassword(user: CurrentUserType, body: {
        currentPassword?: string;
        newPassword?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
