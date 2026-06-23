import { PrismaClient } from "../node_modules/.prisma/client-infra/index.js";

// Singleton PrismaClient for the infrastructure database.
// Import `infraDb` wherever you need to query fps_infra.
const globalForPrisma = globalThis as unknown as {
  infraDb: PrismaClient | undefined;
};

export const infraDb =
  globalForPrisma.infraDb ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.infraDb = infraDb;
}
