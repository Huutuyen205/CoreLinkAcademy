-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fileId" TEXT,
    "position" SMALLINT NOT NULL,
    "text" TEXT NOT NULL,
    "search" TEXT NOT NULL,
    "tsv" tsvector,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_chunks_documentId_fileId_idx" ON "document_chunks"("documentId", "fileId");

-- CreateIndex
CREATE INDEX "document_chunks_tsv_idx" ON "document_chunks" USING GIN ("tsv");

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

