"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_config_1 = require("./jwt.config");
const password_utils_1 = require("../common/password.utils");
const BCRYPT_ROUNDS = 12;
function hashRefreshToken(rawToken) {
    return (0, crypto_1.createHash)('sha256').update(rawToken).digest('hex');
}
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async login(email, password) {
        const profile = await this.prisma.profile.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: {
                userAnnexes: { select: { annexeId: true } },
            },
        });
        if (!profile) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        if (!profile.actif) {
            throw new common_1.UnauthorizedException('Ce compte est désactivé');
        }
        const passwordValid = await bcrypt.compare(password, profile.passwordHash);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        void this.prisma.profile
            .update({
            where: { id: profile.id },
            data: { derniereConnexion: new Date() },
        })
            .catch(() => null);
        const annexeIds = profile.userAnnexes.map((ua) => ua.annexeId);
        const payload = {
            sub: profile.id,
            email: profile.email,
            nom: profile.nom,
            role: profile.role,
            permissions: profile.permissions || [],
            annexeIds,
        };
        const accessToken = this.jwt.sign(payload);
        const refreshToken = this.jwt.sign({ sub: profile.id }, {
            secret: (0, jwt_config_1.jwtRefreshSecret)(),
            expiresIn: (0, jwt_config_1.jwtRefreshExpiresIn)(),
        });
        const decodedRefresh = this.jwt.decode(refreshToken);
        const expiresAt = new Date(decodedRefresh.exp * 1000);
        const refreshTokenHash = hashRefreshToken(refreshToken);
        await this.prisma.refreshToken.upsert({
            where: { token: refreshTokenHash },
            create: { userId: profile.id, token: refreshTokenHash, expiresAt },
            update: { expiresAt },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: profile.id,
                nom: profile.nom,
                email: profile.email,
                role: profile.role,
                permissions: profile.permissions || [],
                annexeIds,
            },
        };
    }
    async refreshAccessToken(refreshToken) {
        let payload;
        try {
            payload = this.jwt.verify(refreshToken, {
                secret: (0, jwt_config_1.jwtRefreshSecret)(),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token invalide ou expiré');
        }
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token: hashRefreshToken(refreshToken) },
        });
        if (!stored || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token révoqué ou expiré');
        }
        const profile = await this.prisma.profile.findUnique({
            where: { id: payload.sub },
            include: { userAnnexes: { select: { annexeId: true } } },
        });
        if (!profile || !profile.actif) {
            throw new common_1.UnauthorizedException('Compte inactif');
        }
        const annexeIds = profile.userAnnexes.map((ua) => ua.annexeId);
        const newPayload = {
            sub: profile.id,
            email: profile.email,
            nom: profile.nom,
            role: profile.role,
            permissions: profile.permissions || [],
            annexeIds,
        };
        return { accessToken: this.jwt.sign(newPayload) };
    }
    async logout(refreshToken) {
        await this.prisma.refreshToken
            .delete({ where: { token: hashRefreshToken(refreshToken) } })
            .catch(() => null);
    }
    async hashPassword(password) {
        return bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    async findProfileById(id) {
        return this.prisma.profile.findUnique({
            where: { id },
            select: { id: true, actif: true, role: true },
        });
    }
    async updateProfile(userId, data) {
        if (data.email) {
            const email = data.email.toLowerCase().trim();
            const existing = await this.prisma.profile.findUnique({
                where: { email },
            });
            if (existing && existing.id !== userId) {
                throw new common_1.ConflictException(`L'email ${data.email} est déjà utilisé`);
            }
        }
        const updated = await this.prisma.profile.update({
            where: { id: userId },
            data: {
                nom: data.nom?.trim(),
                email: data.email?.toLowerCase().trim(),
            },
            select: {
                id: true,
                email: true,
                nom: true,
                telephone: true,
                role: true,
                permissions: true,
                actif: true,
                avatarUrl: true,
            },
        });
        return updated;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: userId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Utilisateur introuvable');
        }
        const passwordValid = await bcrypt.compare(currentPassword, profile.passwordHash);
        if (!passwordValid) {
            throw new common_1.BadRequestException('Mot de passe actuel incorrect');
        }
        (0, password_utils_1.assertStrongPassword)(newPassword, 'Le nouveau mot de passe');
        const passwordHash = await this.hashPassword(newPassword);
        await this.prisma.profile.update({
            where: { id: userId },
            data: { passwordHash },
        });
        await this.prisma.refreshToken.deleteMany({ where: { userId } });
        return { success: true, message: 'Mot de passe mis à jour avec succès' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map