import { PartialType } from '@nestjs/mapped-types';
import { CreateClientDto } from './create-client.dto';

/** Tous les champs de CreateClientDto, optionnels — mise à jour partielle. */
export class UpdateClientDto extends PartialType(CreateClientDto) {}
