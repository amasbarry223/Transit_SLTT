import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';

class LienRattachementDto {
  @IsString()
  operationId!: string;

  @IsString()
  clientId!: string;
}

export class RattacherOperationsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => LienRattachementDto)
  liens!: LienRattachementDto[];
}
