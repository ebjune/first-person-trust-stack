-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "primaryDid" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vtas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "did" VARCHAR(255) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "custodyMode" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_vtas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vtc_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cdid" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL,

    CONSTRAINT "vtc_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "issuerDid" VARCHAR(255) NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "credentialData" JSONB NOT NULL,

    CONSTRAINT "wallet_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "did" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_primaryDid_key" ON "users"("primaryDid");

-- CreateIndex
CREATE UNIQUE INDEX "user_vtas_did_key" ON "user_vtas"("did");

-- CreateIndex
CREATE INDEX "user_vtas_userId_idx" ON "user_vtas"("userId");

-- CreateIndex
CREATE INDEX "vtc_memberships_cdid_idx" ON "vtc_memberships"("cdid");

-- CreateIndex
CREATE UNIQUE INDEX "vtc_memberships_userId_cdid_key" ON "vtc_memberships"("userId", "cdid");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_credentials_credentialId_key" ON "wallet_credentials"("credentialId");

-- CreateIndex
CREATE INDEX "wallet_credentials_userId_status_idx" ON "wallet_credentials"("userId", "status");

-- CreateIndex
CREATE INDEX "wallet_credentials_issuerDid_idx" ON "wallet_credentials"("issuerDid");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_token_idx" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "activity_log_userId_timestamp_idx" ON "activity_log"("userId", "timestamp");

-- AddForeignKey
ALTER TABLE "user_vtas" ADD CONSTRAINT "user_vtas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vtc_memberships" ADD CONSTRAINT "vtc_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_credentials" ADD CONSTRAINT "wallet_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
