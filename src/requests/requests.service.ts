import { Injectable } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsQueryDto } from './dto/query/requests.dto';
import { paginate, paginatedResult } from 'src/common/helpers/paginate.helper';

@Injectable()
export class RequestsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createRequestDto: CreateRequestDto) {
    return 'This action adds a new request';
  }

  findAll(query: RequestsQueryDto) {
    const { page, limit } = query;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { skip, take } = paginate(page, limit);

    const total = 0; // Replace with actual total count from database

    return {
      data: paginatedResult([], total, page, limit),
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} request`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateRequestDto: UpdateRequestDto) {
    return `This action updates a #${id} request`;
  }

  remove(id: number) {
    return `This action removes a #${id} request`;
  }
}
