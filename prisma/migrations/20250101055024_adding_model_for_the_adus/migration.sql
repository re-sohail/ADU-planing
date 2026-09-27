-- CreateTable
CREATE TABLE "Adu" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "area" INTEGER NOT NULL,

    CONSTRAINT "Adu_pkey" PRIMARY KEY ("id")
);
