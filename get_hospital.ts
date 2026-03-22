import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const hospital = await prisma.hospital.findFirst();
  console.log("HOSPITAL_ID:", hospital?.id);
}
main().catch(console.error).finally(() => prisma.$disconnect());
