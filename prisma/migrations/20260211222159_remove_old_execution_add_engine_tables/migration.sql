/*
  Warnings:

  - You are about to drop the column `credits_charged` on the `executions` table. All the data in the column will be lost.
  - You are about to drop the column `gpu_used` on the `executions` table. All the data in the column will be lost.
  - You are about to drop the column `notebook_id` on the `executions` table. All the data in the column will be lost.
  - You are about to drop the column `output_url` on the `executions` table. All the data in the column will be lost.
  - You are about to drop the column `started_at` on the `executions` table. All the data in the column will be lost.
  - The `status` column on the `executions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[runpod_job_id]` on the table `executions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endpoint_id` to the `executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tars_model_id` to the `executions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EndpointSource" AS ENUM ('HUB', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ModelCategory" AS ENUM ('IMAGE', 'AUDIO', 'TEXT', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "OutputType" AS ENUM ('IMAGE', 'AUDIO', 'TEXT', 'FILE', 'JSON');

-- CreateEnum
CREATE TYPE "TarsModelStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EngineExecutionStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMED_OUT', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "executions" DROP CONSTRAINT "executions_consumer_id_fkey";

-- DropForeignKey
ALTER TABLE "executions" DROP CONSTRAINT "executions_notebook_id_fkey";

-- DropIndex
DROP INDEX "executions_consumer_id_idx";

-- DropIndex
DROP INDEX "executions_notebook_id_idx";

-- AlterTable
ALTER TABLE "executions" DROP COLUMN "credits_charged",
DROP COLUMN "gpu_used",
DROP COLUMN "notebook_id",
DROP COLUMN "output_url",
DROP COLUMN "started_at",
ADD COLUMN     "endpoint_id" UUID NOT NULL,
ADD COLUMN     "error_code" VARCHAR(50),
ADD COLUMN     "execution_time_ms" INTEGER,
ADD COLUMN     "input_payload" JSONB,
ADD COLUMN     "output_payload" JSONB,
ADD COLUMN     "runpod_job_id" TEXT,
ADD COLUMN     "tars_model_id" UUID NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "EngineExecutionStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ExecutionStatus";

-- CreateTable
CREATE TABLE "runpod_endpoints" (
    "id" UUID NOT NULL,
    "runpod_endpoint_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "source" "EndpointSource" NOT NULL DEFAULT 'HUB',
    "docker_image" TEXT,
    "gpu_type" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runpod_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "base_models" (
    "id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" "ModelCategory" NOT NULL,
    "input_schema" JSONB NOT NULL,
    "output_type" "OutputType" NOT NULL,
    "output_format" VARCHAR(20) NOT NULL,
    "estimated_seconds" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "base_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tars_models" (
    "id" UUID NOT NULL,
    "developer_id" UUID NOT NULL,
    "base_model_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "config_overrides" JSONB,
    "status" "TarsModelStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "tars_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "runpod_endpoints_runpod_endpoint_id_key" ON "runpod_endpoints"("runpod_endpoint_id");

-- CreateIndex
CREATE UNIQUE INDEX "base_models_slug_key" ON "base_models"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tars_models_slug_key" ON "tars_models"("slug");

-- CreateIndex
CREATE INDEX "tars_models_developer_id_idx" ON "tars_models"("developer_id");

-- CreateIndex
CREATE INDEX "tars_models_status_idx" ON "tars_models"("status");

-- CreateIndex
CREATE UNIQUE INDEX "executions_runpod_job_id_key" ON "executions"("runpod_job_id");

-- CreateIndex
CREATE INDEX "executions_consumer_id_created_at_idx" ON "executions"("consumer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "executions_tars_model_id_idx" ON "executions"("tars_model_id");

-- CreateIndex
CREATE INDEX "executions_status_idx" ON "executions"("status");

-- CreateIndex
CREATE INDEX "executions_runpod_job_id_idx" ON "executions"("runpod_job_id");

-- AddForeignKey
ALTER TABLE "base_models" ADD CONSTRAINT "base_models_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "runpod_endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tars_models" ADD CONSTRAINT "tars_models_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "developers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tars_models" ADD CONSTRAINT "tars_models_base_model_id_fkey" FOREIGN KEY ("base_model_id") REFERENCES "base_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_consumer_id_fkey" FOREIGN KEY ("consumer_id") REFERENCES "consumers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_tars_model_id_fkey" FOREIGN KEY ("tars_model_id") REFERENCES "tars_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executions" ADD CONSTRAINT "executions_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "runpod_endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
