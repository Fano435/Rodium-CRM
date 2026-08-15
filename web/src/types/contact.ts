import { Contact as PrismaContact } from "@generated/prisma/browser";

export type Contact = Omit<PrismaContact, "createdAt"> & {
  createdAt: string;
};
