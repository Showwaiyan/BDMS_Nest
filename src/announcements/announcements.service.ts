import { Injectable } from '@nestjs/common';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { paginate, paginatedResult } from '../common/helpers/paginate.helper';
import { AnnouncementsQueryDto } from './dto/query/announcements.dto';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '../../prisma/generated/client';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private readonly selectAnnouncement: Prisma.AnnouncementSelect = {
    id: true,
    title: true,
    content: true,
    created_at: true,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createAnnouncementDto: CreateAnnouncementDto) {
    return { data: 'This action adds a new announcement' };
  }

  async findAll(query: AnnouncementsQueryDto) {
    const { page, limit } = query;
    const { skip, take } = paginate(page, limit);

    const [announcements, totalAnnouncements] = await Promise.all([
      this.databaseService.announcement.findMany({
        skip,
        take,
        select: this.selectAnnouncement,
      }),
      this.databaseService.announcement.count(),
    ]);

    return {
      data: paginatedResult(announcements, totalAnnouncements, page, limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} announcement`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateAnnouncementDto: UpdateAnnouncementDto) {
    return `This action updates a #${id} announcement`;
  }

  remove(id: number) {
    return `This action removes a #${id} announcement`;
  }
}
