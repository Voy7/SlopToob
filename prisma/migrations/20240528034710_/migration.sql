-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlayHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL,
    "isBumper" BOOLEAN NOT NULL DEFAULT false,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PlayHistory" ("createdAt", "id", "isBumper", "path", "totalDuration") SELECT "createdAt", "id", "isBumper", "path", "totalDuration" FROM "PlayHistory";
DROP TABLE "PlayHistory";
ALTER TABLE "new_PlayHistory" RENAME TO "PlayHistory";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
