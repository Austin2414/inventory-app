/*
  Warnings:

  - You are about to drop the `reclassification_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reclassification_log" DROP CONSTRAINT "reclassification_log_from_material_id_fkey";

-- DropForeignKey
ALTER TABLE "reclassification_log" DROP CONSTRAINT "reclassification_log_location_id_fkey";

-- DropForeignKey
ALTER TABLE "reclassification_log" DROP CONSTRAINT "reclassification_log_to_material_id_fkey";

-- DropTable
DROP TABLE "reclassification_log";

-- CreateTable
CREATE TABLE "reclassificationLog" (
    "id" SERIAL NOT NULL,
    "from_material_id" INTEGER NOT NULL,
    "to_material_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "location_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reclassificationLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reclassificationLog" ADD CONSTRAINT "reclassificationLog_from_material_id_fkey" FOREIGN KEY ("from_material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclassificationLog" ADD CONSTRAINT "reclassificationLog_to_material_id_fkey" FOREIGN KEY ("to_material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclassificationLog" ADD CONSTRAINT "reclassificationLog_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
