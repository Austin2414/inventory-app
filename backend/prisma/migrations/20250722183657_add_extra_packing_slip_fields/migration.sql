/*
  Warnings:

  - The `multiPoNotes` column on the `packing_slips` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "packing_slips" ADD COLUMN     "careOf" TEXT,
ADD COLUMN     "carrierName" TEXT,
ADD COLUMN     "customerAddress" TEXT,
ADD COLUMN     "deliveryDateTime" TIMESTAMP(3),
ADD COLUMN     "deliveryNumber" TEXT,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "pickupNumber" TEXT,
ADD COLUMN     "slipGroupId" INTEGER,
DROP COLUMN "multiPoNotes",
ADD COLUMN     "multiPoNotes" TEXT[];
