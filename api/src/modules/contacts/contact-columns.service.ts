import {
  Injectable
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactColumnService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.contactColumn.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async create(data: Omit<Prisma.ContactColumnCreateInput, 'order'>) {
    const last = await this.prisma.contactColumn.findFirst({
      orderBy: { order: 'desc' },
    });

    return this.prisma.contactColumn.create({
      data: {
        ...data,
        order: last ? last.order + 1 : 0,
      },
    });
  }

  update(id: number, data: Prisma.ContactColumnUpdateInput) {
    return this.prisma.contactColumn.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.contactColumn.delete({
      where: { id },
    });
  }

  async reorder(orderedIds: number[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.contactColumn.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return this.findAll();
  }
}
