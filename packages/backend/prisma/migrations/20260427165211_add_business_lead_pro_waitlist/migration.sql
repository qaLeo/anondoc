-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED');

-- CreateTable
CREATE TABLE "BusinessLead" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "expectedVolume" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "source" TEXT NOT NULL DEFAULT 'pricing_page',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessLead_email_idx" ON "BusinessLead"("email");

-- CreateIndex
CREATE INDEX "BusinessLead_status_idx" ON "BusinessLead"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProWaitlist_email_key" ON "ProWaitlist"("email");

-- CreateIndex
CREATE INDEX "ProWaitlist_email_idx" ON "ProWaitlist"("email");
