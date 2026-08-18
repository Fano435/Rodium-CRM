import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ContactService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { Prisma } from '../../../generated/prisma/client';

@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.createContact(dto);
  }

  @Post('bulk')
  createMany(@Body() dtos: CreateContactDto[]) {
    return this.contactService.createContacts(
      dtos as [Prisma.ContactCreateInput],
    );
  }

  @Get()
  findAll() {
    return this.contactService.findAll();
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContactDto) {
    return this.contactService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.remove(id);
  }
}
