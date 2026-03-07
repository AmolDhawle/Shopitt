import { PrismaClient } from "../../../../generated/prisma/client/client.js";
declare global {
    namespace globalThis {
        var prismadb: PrismaClient | undefined;
    }
}
declare const prisma: PrismaClient<import("../../../../generated/prisma/client/index.js").Prisma.PrismaClientOptions, never, import("../../../../generated/prisma/client/runtime/library.js").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma-client.d.ts.map