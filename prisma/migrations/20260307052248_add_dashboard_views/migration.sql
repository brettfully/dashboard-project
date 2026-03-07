-- AlterTable
ALTER TABLE "OverviewCell" ADD COLUMN     "viewId" TEXT;

-- CreateTable
CREATE TABLE "DashboardView" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardView_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OverviewCell" ADD CONSTRAINT "OverviewCell_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "DashboardView"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardView" ADD CONSTRAINT "DashboardView_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
