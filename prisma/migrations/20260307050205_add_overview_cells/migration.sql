-- CreateTable
CREATE TABLE "OverviewCell" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "displayAs" TEXT NOT NULL DEFAULT 'number',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OverviewCell_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OverviewCell" ADD CONSTRAINT "OverviewCell_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
