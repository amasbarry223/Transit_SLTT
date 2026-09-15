import { IsOptional, IsString } from 'class-validator';

export class CreatePortDto {
  @IsString()
  code!: string;

  @IsString()
  nom!: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  pays?: string;
}
