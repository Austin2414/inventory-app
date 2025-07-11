/*
  Warnings:

  - You are about to drop the `reclassificationLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reclassificationLog" DROP CONSTRAINT "reclassificationLog_from_material_id_fkey";

-- DropForeignKey
ALTER TABLE "reclassificationLog" DROP CONSTRAINT "reclassificationLog_location_id_fkey";

-- DropForeignKey
ALTER TABLE "reclassificationLog" DROP CONSTRAINT "reclassificationLog_to_material_id_fkey";

-- DropTable
DROP TABLE "reclassificationLog";

-- CreateTable
CREATE TABLE "reclassificationlog" (
    "id" SERIAL NOT NULL,
    "from_material_id" INTEGER NOT NULL,
    "to_material_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "location_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reclassificationlog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reclassificationlog" ADD CONSTRAINT "reclassificationlog_from_material_id_fkey" FOREIGN KEY ("from_material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclassificationlog" ADD CONSTRAINT "reclassificationlog_to_material_id_fkey" FOREIGN KEY ("to_material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclassificationlog" ADD CONSTRAINT "reclassificationlog_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
