-- CreateTable
CREATE TABLE "fine_configurations" (
    "id" TEXT NOT NULL,
    "dailyRate" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fine_configurations_pkey" PRIMARY KEY ("id")
);
