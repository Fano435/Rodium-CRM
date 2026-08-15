import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ContactService } from './modules/contacts/contacts.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly contactService: ContactService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
