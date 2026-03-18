import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementsService } from './announcements.service';
import { DatabaseService } from '../database/database.service';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        {
          provide: DatabaseService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
