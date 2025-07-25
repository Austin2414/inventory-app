-- AlterTable
ALTER TABLE "inventoryAdjustment" ADD COLUMN     "linked_slip_id" INTEGER;

-- AlterTable
ALTER TABLE "reclassificationlog" ADD COLUMN     "linked_slip_id" INTEGER;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" INTEGER,
    "packingSlipId" INTEGER,
    "packingSlipItemId" INTEGER,
    "reclassificationId" INTEGER,
    "manualAdjustmentId" INTEGER,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reclassificationlog" ADD CONSTRAINT "reclassificationlog_linked_slip_id_fkey" FOREIGN KEY ("linked_slip_id") REFERENCES "packing_slips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventoryAdjustment" ADD CONSTRAINT "inventoryAdjustment_linked_slip_id_fkey" FOREIGN KEY ("linked_slip_id") REFERENCES "packing_slips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_packingSlipId_fkey" FOREIGN KEY ("packingSlipId") REFERENCES "packing_slips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_packingSlipItemId_fkey" FOREIGN KEY ("packingSlipItemId") REFERENCES "packing_slip_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_reclassificationId_fkey" FOREIGN KEY ("reclassificationId") REFERENCES "reclassificationlog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_manualAdjustmentId_fkey" FOREIGN KEY ("manualAdjustmentId") REFERENCES "inventoryAdjustment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
