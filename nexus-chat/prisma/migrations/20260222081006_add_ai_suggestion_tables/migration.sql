-- CreateTable
CREATE TABLE "ai_suggestion_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "usage_date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_suggestion_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_suggestion_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "suggestion_id" TEXT NOT NULL,
    "suggestion_content" TEXT,
    "feedback_type" TEXT NOT NULL,
    "conversation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_suggestion_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_suggestion_usage_user_id_idx" ON "ai_suggestion_usage"("user_id");

-- CreateIndex
CREATE INDEX "ai_suggestion_usage_usage_date_idx" ON "ai_suggestion_usage"("usage_date");

-- CreateIndex
CREATE UNIQUE INDEX "ai_suggestion_usage_user_id_usage_date_key" ON "ai_suggestion_usage"("user_id", "usage_date");

-- CreateIndex
CREATE INDEX "ai_suggestion_feedback_user_id_idx" ON "ai_suggestion_feedback"("user_id");

-- CreateIndex
CREATE INDEX "ai_suggestion_feedback_created_at_idx" ON "ai_suggestion_feedback"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_suggestion_feedback_user_id_suggestion_id_key" ON "ai_suggestion_feedback"("user_id", "suggestion_id");

-- AddForeignKey
ALTER TABLE "ai_suggestion_usage" ADD CONSTRAINT "ai_suggestion_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_suggestion_feedback" ADD CONSTRAINT "ai_suggestion_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
