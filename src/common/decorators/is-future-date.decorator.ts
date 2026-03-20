import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string | Date): boolean {
    if (!value) return false;

    const inputDate = new Date(value);

    // check valid date
    if (isNaN(inputDate.getTime())) {
      return false;
    }

    // compare with current time
    return inputDate.getTime() > Date.now();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a future date`;
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsFutureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsFutureDateConstraint,
    });
  };
}
