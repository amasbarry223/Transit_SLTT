import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            nom: string;
            email: string;
            role: import(".prisma/client").$Enums.RoleUtilisateur;
            permissions: string[];
            annexeIds: any[];
        };
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    hashPassword(password: string): Promise<string>;
    findProfileById(id: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.RoleUtilisateur;
        actif: boolean;
    }>;
    updateProfile(userId: string, data: {
        nom?: string;
        email?: string;
    }): Promise<{
        id: string;
        email: string;
        nom: string;
        telephone: string;
        role: import(".prisma/client").$Enums.RoleUtilisateur;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        actif: boolean;
        avatarUrl: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
