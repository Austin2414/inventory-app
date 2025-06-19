-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'lb',

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "location_id" INTEGER NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_slips" (
    "id" SERIAL NOT NULL,
    "slip_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "from_name" TEXT,
    "to_name" TEXT,
    "date_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "truck_number" TEXT,
    "trailer_number" TEXT,
    "po_number" TEXT,
    "seal_number" TEXT,
    "location_id" INTEGER NOT NULL,

    CONSTRAINT "packing_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_slip_items" (
    "id" SERIAL NOT NULL,
    "packing_slip_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "gross_weight" DOUBLE PRECISION NOT NULL,
    "tare_weight" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "ticket_number" TEXT,

    CONSTRAINT "packing_slip_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_material_id_location_id_key" ON "inventory"("material_id", "location_id");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_slips" ADD CONSTRAINT "packing_slips_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_slip_items" ADD CONSTRAINT "packing_slip_items_packing_slip_id_fkey" FOREIGN KEY ("packing_slip_id") REFERENCES "packing_slips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_slip_items" ADD CONSTRAINT "packing_slip_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
