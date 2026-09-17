"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertStrongPassword = assertStrongPassword;
const common_1 = require("@nestjs/common");
function assertStrongPassword(password, label = 'Le mot de passe') {
    if (!password || password.length < 8) {
        throw new common_1.BadRequestException(`${label} doit contenir au moins 8 caractères.`);
    }
    if (!/[a-z]/.test(password)) {
        throw new common_1.BadRequestException(`${label} doit contenir au moins une minuscule.`);
    }
    if (!/[A-Z]/.test(password)) {
        throw new common_1.BadRequestException(`${label} doit contenir au moins une majuscule.`);
    }
    if (!/[0-9]/.test(password)) {
        throw new common_1.BadRequestException(`${label} doit contenir au moins un chiffre.`);
    }
}
//# sourceMappingURL=password.utils.js.map