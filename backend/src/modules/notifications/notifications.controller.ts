import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../shared/decorators';
import type { CurrentUserType } from '../../auth/auth.types';

/** Aucune permission métier : chaque utilisateur ne lit et ne modifie que
 *  SES notifications — le userId vient toujours du JWT, jamais de la requête. */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserType, @Query('limit') limit?: number) {
    return this.notificationsService.listForUser(user.id, limit);
  }

  // Déclarée avant ':id/lue' par lisibilité ; les deux chemins ne se
  // recouvrent pas ("lues" n'a qu'un segment).
  @Patch('lues')
  markAllRead(@CurrentUser() user: CurrentUserType) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch(':id/lue')
  markRead(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.notificationsService.markRead(id, user.id);
  }
}
