import { Module } from '@nestjs/common';
import { ContactService } from './modules/contacts/contacts.service';
import { ContactController } from './modules/contacts/contacts.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ContactColumnController } from './modules/contacts/contact-columns.controller';
import { ContactColumnService } from './modules/contacts/contact-columns.service';

@Module({
  imports: [PrismaModule],
  controllers: [ ContactController, ContactColumnController],
  providers: [ ContactService, ContactColumnService],
})
export class AppModule {}
