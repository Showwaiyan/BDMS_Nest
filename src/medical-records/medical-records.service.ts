import { Injectable } from '@nestjs/common';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(createMedicalRecordDto: CreateMedicalRecordDto) {
    return 'This action adds a new medicalRecord';
  }

  findAll() {
    return `This action returns all medicalRecords`;
  }

  findOne(id: number) {
    return `This action returns a #${id} medicalRecord`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: number, updateMedicalRecordDto: UpdateMedicalRecordDto) {
    return `This action updates a #${id} medicalRecord`;
  }

  remove(id: number) {
    return `This action removes a #${id} medicalRecord`;
  }
}
