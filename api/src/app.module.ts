import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactService } from './modules/contacts/contacts.service';
import { ContactController } from './modules/contacts/contacts.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, ContactController],
  providers: [AppService, ContactService],
})
export class AppModule {}
