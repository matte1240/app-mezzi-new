ALTER TABLE "Document"
ADD COLUMN "validFrom" TIMESTAMP(3),
ADD COLUMN "validTo" TIMESTAMP(3);

ALTER TABLE "Deadline"
ADD COLUMN "sourceDocumentId" TEXT;

CREATE INDEX "Deadline_sourceDocumentId_idx" ON "Deadline"("sourceDocumentId");

ALTER TABLE "Deadline"
ADD CONSTRAINT "Deadline_sourceDocumentId_fkey"
FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
