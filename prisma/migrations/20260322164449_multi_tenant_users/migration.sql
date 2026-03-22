/*
  Warnings:

  - A unique constraint covering the columns `[user_name,hospital_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,hospital_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider_id,hospital_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `hospital_id` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_hospital_id_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_provider_id_key";

-- DropIndex
DROP INDEX "User_user_name_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "hospital_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_user_name_hospital_id_key" ON "User"("user_name", "hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_hospital_id_key" ON "User"("email", "hospital_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_id_hospital_id_key" ON "User"("provider_id", "hospital_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
