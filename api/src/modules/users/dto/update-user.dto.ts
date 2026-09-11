import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/** Tous les champs de CreateUserDto, optionnels — mise à jour partielle.
 *  Le mot de passe reste validé (>= 8 caractères) quand il est fourni. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
