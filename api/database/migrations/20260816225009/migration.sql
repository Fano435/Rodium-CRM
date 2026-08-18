-- CreateEnum
CREATE TYPE "ColumnType" AS ENUM ('TEXT', 'NUMBER', 'DATE');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "customFields" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "contact_columns" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "type" "ColumnType" NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_columns_pkey" PRIMARY KEY ("id")
);
