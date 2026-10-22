import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { BonsLivraisonService } from './bons-livraison.service';
import { CreateBonLivraisonDto } from './dto/create-bon-livraison.dto';
import { UpdateBonLivraisonDto } from './dto/update-bon-livraison.dto';
import { CurrentUser, RequirePermission } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

// Pas d'AnnexeGuard : l'annexe n'est jamais fournie par le client, elle est
// reprise du bon de sortie d'origine et contrôlée dans le service.
@Controller('bons-livraison')
export class BonsLivraisonController {
  constructor(private readonly service: BonsLivraisonService) {}

  @Get()
  @RequirePermission('bons:read')
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('annexeId') annexeId?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.service.findAll(user, { annexeId, clientId });
  }

  @Get(':id')
  @RequirePermission('bons:read')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.service.findOne(id, user);
  }

  @Post()
  @RequirePermission('bons:write')
  create(@CurrentUser() user: CurrentUserType, @Body() body: CreateBonLivraisonDto) {
    return this.service.create(user, body);
  }

  @Put(':id')
  @RequirePermission('bons:write')
  update(@Param('id') id: string, @CurrentUser() user: CurrentUserType, @Body() body: UpdateBonLivraisonDto) {
    return this.service.update(id, user, body);
  }

  @Delete(':id')
  @RequirePermission('bons:write')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.service.remove(id, user);
  }
}
