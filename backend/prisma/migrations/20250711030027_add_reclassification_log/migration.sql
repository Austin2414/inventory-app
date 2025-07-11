-- CreateTable
CREATE TABLE "reclassification_log" (
    "id" SERIAL NOT NULL,
    "from_material_id" INTEGER NOT NULL,
    "to_material_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "location_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reclassification_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reclassification_log" ADD CONSTRAINT "reclassification_log_from_material_id_fkey" FOREIGN KEY ("from_material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclassification_log" ADD CONSTRAINT "reclassification_log_to_material_id_fkey" FOREIGN KEY ("to_material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reclassification_log" ADD CONSTRAINT "reclassification_log_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
