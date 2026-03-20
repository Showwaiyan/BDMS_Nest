import { randomInt } from 'crypto';

export const generateRequestCode = () => {
  return `REQ-${randomInt(100000, 1000000)}`;
};
