import { PortsService } from './ports.service';
import { CreatePortDto } from './dto/create-port.dto';
import { UpdatePortDto } from './dto/update-port.dto';
export declare class PortsController {
    private readonly portsService;
    constructor(portsService: PortsService);
    findAll(): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }>;
    create(body: CreatePortDto): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }>;
    update(id: string, body: UpdatePortDto): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        nom: string;
        actif: boolean;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        ville: string | null;
        pays: string | null;
    }>;
}
