import { validate } from 'class-validator';
import { CreateRequestDto } from './create-request.dto';
import { BloodGroup, UrgencyLevel } from 'prisma/generated/client';

describe('CreateRequestDto', () => {
  let dto: CreateRequestDto;

  beforeEach(() => {
    dto = new CreateRequestDto();
    dto.patient_name = 'John Doe';
    dto.blood_group = BloodGroup.A_POS;
    dto.units_required = 2;
    dto.contact_phone = '1234567890';
    dto.urgency = UrgencyLevel.high;
    dto.reason = 'Surgery';
  });

  it('should pass if required_date is in the future', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
    dto.required_date = futureDate.toISOString();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if required_date is in the past', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday
    dto.required_date = pastDate.toISOString();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('IsFutureDate');
  });

  it('should fail if required_date is today (just now)', async () => {
    // Note: Our validator uses > new Date(), so exact "now" or past seconds fail.
    const now = new Date();
    now.setSeconds(now.getSeconds() - 10); // 10 seconds ago
    dto.required_date = now.toISOString();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail if required_date is an invalid date string', async () => {
    dto.required_date = 'invalid-date';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  describe('units_required', () => {
    it('should fail if units_required is less than 1', async () => {
      dto.units_required = 0;
      dto.required_date = new Date(Date.now() + 86400000).toISOString();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should fail if units_required is greater than 50', async () => {
      dto.units_required = 51;
      dto.required_date = new Date(Date.now() + 86400000).toISOString();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should pass if units_required is exactly 50', async () => {
      dto.units_required = 50;
      dto.required_date = new Date(Date.now() + 86400000).toISOString();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
