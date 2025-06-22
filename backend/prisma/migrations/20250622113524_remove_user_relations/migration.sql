/*
  Warnings:

  - You are about to drop the column `user_id` on the `packing_slips` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "packing_slips" DROP CONSTRAINT "packing_slips_user_id_fkey";

-- AlterTable
ALTER TABLE "packing_slips" DROP COLUMN "user_id";
