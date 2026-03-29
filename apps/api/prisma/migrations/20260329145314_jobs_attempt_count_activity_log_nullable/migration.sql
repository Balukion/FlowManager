-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_workspace_id_fkey";

-- AlterTable
ALTER TABLE "activity_logs" ALTER COLUMN "workspace_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "attempt_count" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
