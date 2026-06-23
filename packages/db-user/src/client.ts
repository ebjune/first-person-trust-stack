import { PrismaClient } from "../node_modules/.prisma/client-user/index.js";

// Singleton PrismaClient for the user database.
// Import `userDb` wherever you need to query fps_user.
const globalForPrisma = globalThis as unknown as {
  userDb: PrismaClient | undefined;
};

export const userDb =
  globalForPrisma.userDb ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.userDb = userDb;
}
