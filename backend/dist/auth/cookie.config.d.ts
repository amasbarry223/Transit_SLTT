export declare const ACCESS_TOKEN_COOKIE = "transit_sltt_at";
export declare const REFRESH_TOKEN_COOKIE = "transit_sltt_rt";
export declare const CSRF_COOKIE = "transit_sltt_csrf";
export declare function accessCookieOptions(): {
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    domain: string;
};
export declare function accessCookieMaxAge(): number;
export declare function refreshCookieOptions(apiPrefix: string): {
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    domain: string;
};
export declare function refreshCookieMaxAge(): number;
export declare function csrfCookieOptions(): {
    httpOnly: boolean;
    path: string;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    domain: string;
};
