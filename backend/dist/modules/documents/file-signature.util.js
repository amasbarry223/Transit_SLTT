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
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRealMimeType = detectRealMimeType;
exports.realMimeSatisfies = realMimeSatisfies;
const fs = __importStar(require("fs"));
async function detectRealMimeType(filePath) {
    const fd = await fs.promises.open(filePath, 'r');
    try {
        const buf = Buffer.alloc(16);
        const { bytesRead } = await fd.read(buf, 0, 16, 0);
        const b = buf.subarray(0, bytesRead);
        if (b.length >= 4 && b.subarray(0, 4).toString('ascii') === '%PDF')
            return 'application/pdf';
        if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
            return 'image/jpeg';
        if (b.length >= 8 &&
            b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
            b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
            return 'image/png';
        }
        if (b.length >= 12 &&
            b.subarray(0, 4).toString('ascii') === 'RIFF' &&
            b.subarray(8, 12).toString('ascii') === 'WEBP') {
            return 'image/webp';
        }
        if (b.length >= 12 && b.subarray(4, 8).toString('ascii') === 'ftyp') {
            const brand = b.subarray(8, 12).toString('ascii');
            const heicBrands = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1']);
            if (heicBrands.has(brand))
                return 'image/heic';
        }
        return null;
    }
    finally {
        await fd.close();
    }
}
function realMimeSatisfies(real, declared) {
    if (!real)
        return false;
    if (real === declared)
        return true;
    if (real === 'image/heic' && declared === 'image/heif')
        return true;
    return false;
}
//# sourceMappingURL=file-signature.util.js.map