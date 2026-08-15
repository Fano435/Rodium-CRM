-- CreateEnum
CREATE TYPE "StatutContact" AS ENUM ('PROSPECT', 'CONTACTE', 'QUALIFIE', 'CLIENT', 'PERDU');

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT,
    "telephone" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutContact" NOT NULL DEFAULT 'PROSPECT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);
