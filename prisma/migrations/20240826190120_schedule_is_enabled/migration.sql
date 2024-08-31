-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WeeklySchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dayOfWeek" INTEGER NOT NULL,
    "secondsIn" INTEGER NOT NULL,
    "playlistID" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_WeeklySchedule" ("createdAt", "dayOfWeek", "id", "playlistID", "secondsIn", "updatedAt") SELECT "createdAt", "dayOfWeek", "id", "playlistID", "secondsIn", "updatedAt" FROM "WeeklySchedule";
DROP TABLE "WeeklySchedule";
ALTER TABLE "new_WeeklySchedule" RENAME TO "WeeklySchedule";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
