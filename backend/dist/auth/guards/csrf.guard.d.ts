import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare function isAllowedOrigin(originOrReferer: string | undefined, rawAllowedCors?: string): boolean;
export declare class CsrfGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
