export declare class HealthController {
    check(): {
        status: string;
        service: string;
        uptime: number;
        timestamp: string;
        nodeEnv: string;
    };
    root(): {
        status: string;
        service: string;
        version: string;
    };
}
