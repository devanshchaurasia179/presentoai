-- Clear stale OTP rows so we can add NOT NULL column safely
DELETE FROM "EmailOTP";

-- AlterTable
ALTER TABLE "EmailOTP" ADD COLUMN "hashedPassword" TEXT NOT NULL DEFAULT '';

-- Remove the default once the column exists (enforce NOT NULL at app level)
ALTER TABLE "EmailOTP" ALTER COLUMN "hashedPassword" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "id" SET DEFAULT concat('fld_', replace(cast(gen_random_uuid() as text), '-', ''));

-- AlterTable
ALTER TABLE "Presentation" ALTER COLUMN "id" SET DEFAULT concat('prs_', replace(cast(gen_random_uuid() as text), '-', ''));

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT concat('usr_', replace(cast(gen_random_uuid() as text), '-', ''));
