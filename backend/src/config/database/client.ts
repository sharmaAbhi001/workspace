import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/ApiError.js";


const adapter = new PrismaPg({
    connectionString:process.env.DATABASE_URL,
    connectionTimeoutMillis:30_000,
});


const globalForPrisma = globalThis as unknown as {
    prisma ?: PrismaClient
}


export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log:[
        {level:"warn", emit:"event"},
        {level:"error",emit: "event"},
    ]
});

if(process.env.NODE_ENV !== 'production'){
    globalForPrisma.prisma = prisma
};


export const withTransaction = <T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> => {
    return prisma.$transaction(fn);
  };

  export const connectDatabase = async (): Promise<void> => {
    try {
        await prisma.$connect();
    console.log("Database connected successfully");
    } catch (error) {
        new ApiError("database coneection",500,)
    }
};


  export const disconnectDatabase = async (): Promise<void> => {
    await prisma.$disconnect();
  };