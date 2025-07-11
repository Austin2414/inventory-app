-- CreateTable
CREATE TABLE "inventoryAdjustment" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventoryAdjustment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "inventoryAdjustment" ADD CONSTRAINT "inventoryAdjustment_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventoryAdjustment" ADD CONSTRAINT "inventoryAdjustment_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
