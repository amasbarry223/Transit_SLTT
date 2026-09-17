import { UsersService } from './users.service';
import type { CurrentUserType } from '../../auth/auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(actor: CurrentUserType): Promise<{
        role: string;
        id: string;
        email: string;
        nom: string;
        telephone: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        actif: boolean;
        avatarUrl: string;
        derniereConnexion: Date;
        createdAt: Date;
        userAnnexes: {
            annexe: {
                id: string;
                nom: string;
                code: string;
            };
        }[];
    }[]>;
    findOne(id: string, actor: CurrentUserType): Promise<{
        role: string;
        userAnnexes: ({
            annexe: {
                id: string;
                email: string | null;
                nom: string;
                telephone: string | null;
                actif: boolean;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                adresse: string | null;
                ville: string | null;
                pays: string;
                rccm: string | null;
                nif: string | null;
                estSiege: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            annexeId: string;
        })[];
        id: string;
        email: string;
        nom: string;
        telephone: string | null;
        permissions: import("@prisma/client/runtime/library").JsonValue | null;
        actif: boolean;
        avatarUrl: string | null;
        derniereConnexion: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(body: CreateUserDto, actor: CurrentUserType): Promise<{
        role: string;
        id: string;
        email: string;
        nom: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        actif: boolean;
    }>;
    update(id: string, body: UpdateUserDto, actor: CurrentUserType): Promise<{
        role: string;
        id: string;
        email: string;
        nom: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        actif: boolean;
    }>;
    resetPassword(id: string, body: ResetPasswordDto, actor: CurrentUserType): Promise<{
        success: boolean;
    }>;
    remove(id: string, actor: CurrentUserType): Promise<void>;
}
