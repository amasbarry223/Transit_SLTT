import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PERMISSIONS_KEY } from '../../shared/decorators';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { [K in keyof UsersService]: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      resetPassword: vi.fn(),
      delete: vi.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get(UsersController);
  });

  it("chaque route exige la permission 'utilisateurs:manage'", () => {
    const reflector = new Reflector();
    for (const handler of [
      controller.findAll,
      controller.findOne,
      controller.create,
      controller.update,
      controller.resetPassword,
      controller.remove,
    ]) {
      const required = reflector.get<string[]>(PERMISSIONS_KEY, handler);
      expect(required).toEqual(['utilisateurs:manage']);
    }
  });

  it('transmet l’acteur courant au service pour create/update/resetPassword/remove', async () => {
    const actor = { id: 'a1', email: 'a@a.com', nom: 'A', role: 'ADMIN', permissions: ['*'], annexeIds: [] };

    await controller.create({ email: 'x@x.com', nom: 'X' } as any, actor);
    expect(service.create).toHaveBeenCalledWith({ email: 'x@x.com', nom: 'X' }, actor);

    await controller.update('id-1', { nom: 'Y' } as any, actor);
    expect(service.update).toHaveBeenCalledWith('id-1', { nom: 'Y' }, actor);

    await controller.resetPassword('id-1', { password: 'longpass1' } as any, actor);
    expect(service.resetPassword).toHaveBeenCalledWith('id-1', 'longpass1', actor);

    await controller.remove('id-1', actor);
    expect(service.delete).toHaveBeenCalledWith('id-1', actor);
  });
});
