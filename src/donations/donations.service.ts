import { Injectable } from '@nestjs/common';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { DonationsQueryDto } from './dto/query/donations.dto';
import { paginate, paginatedResult } from '../common/helpers/paginate.helper';

@Injectable()
export class DonationsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createDonationDto: CreateDonationDto) {
    return 'This action adds a new donation';
  }

  findAll(query: DonationsQueryDto) {
    const { page, limit } = query;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { skip, take } = paginate(page, limit);

    const total = 0; // Replace with actual total count from database

    return {
      data: paginatedResult([], total, page, limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} donation`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateDonationDto: UpdateDonationDto) {
    return `This action updates a #${id} donation`;
  }

  remove(id: number) {
    return `This action removes a #${id} donation`;
  }
}
