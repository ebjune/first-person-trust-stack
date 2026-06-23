-- CreateTable
CREATE TABLE "vta_events" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "did" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "prevHash" VARCHAR(64) NOT NULL,

    CONSTRAINT "vta_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vtc_events" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "cdid" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,
    "hash" VARCHAR(64) NOT NULL,
    "prevHash" VARCHAR(64) NOT NULL,

    CONSTRAINT "vtc_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tsp_events" (
    "id" TEXT NOT NULL,
    "messageId" VARCHAR(255) NOT NULL,
    "fromDid" VARCHAR(255) NOT NULL,
    "toDid" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "tsp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_task_log" (
    "id" TEXT NOT NULL,
    "taskUri" VARCHAR(500) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "durationMs" INTEGER,

    CONSTRAINT "trust_task_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_events" (
    "id" TEXT NOT NULL,
    "presentationId" VARCHAR(255) NOT NULL,
    "verifierDid" VARCHAR(255) NOT NULL,
    "result" VARCHAR(20) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB NOT NULL,

    CONSTRAINT "verification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vta_events_did_timestamp_idx" ON "vta_events"("did", "timestamp");

-- CreateIndex
CREATE INDEX "vta_events_sequence_idx" ON "vta_events"("sequence");

-- CreateIndex
CREATE INDEX "vtc_events_cdid_timestamp_idx" ON "vtc_events"("cdid", "timestamp");

-- CreateIndex
CREATE INDEX "vtc_events_sequence_idx" ON "vtc_events"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "tsp_events_messageId_key" ON "tsp_events"("messageId");

-- CreateIndex
CREATE INDEX "tsp_events_fromDid_timestamp_idx" ON "tsp_events"("fromDid", "timestamp");

-- CreateIndex
CREATE INDEX "tsp_events_toDid_timestamp_idx" ON "tsp_events"("toDid", "timestamp");

-- CreateIndex
CREATE INDEX "trust_task_log_taskUri_timestamp_idx" ON "trust_task_log"("taskUri", "timestamp");

-- CreateIndex
CREATE INDEX "trust_task_log_timestamp_idx" ON "trust_task_log"("timestamp");

-- CreateIndex
CREATE INDEX "verification_events_verifierDid_timestamp_idx" ON "verification_events"("verifierDid", "timestamp");

-- CreateIndex
CREATE INDEX "verification_events_presentationId_idx" ON "verification_events"("presentationId");
