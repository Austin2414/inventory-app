-- AlterTable
ALTER TABLE "inventory" ALTER COLUMN "last_updated" DROP DEFAULT;

-- AlterTable
ALTER TABLE "reclassificationlog" ADD COLUMN     "load" TEXT,
ADD COLUMN     "reason" TEXT;
