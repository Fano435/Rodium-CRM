import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async createContact(data: Prisma.ContactCreateInput) {
    return this.prisma.contact.create({ data });
  }

  async createContacts(data: Prisma.ContactCreateInput[]) {
    return this.prisma.contact.createMany({ data });
  }

  async update(id: number, data: Prisma.ContactUpdateInput) {
    return this.prisma.contact.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.contact.delete({ where: { id } });
  }

  async findAll(
    where?: Prisma.ContactWhereInput,
    orderBy?: Prisma.ContactOrderByWithRelationInput,
  ) {
    return this.prisma.contact.findMany({ where, orderBy });
  }
}
