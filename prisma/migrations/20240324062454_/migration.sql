/*
  Warnings:

  - You are about to drop the column `jsonObject` on the `Settings` table. All the data in the column will be lost.
  - Added the required column `key` to the `Settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `Settings` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
