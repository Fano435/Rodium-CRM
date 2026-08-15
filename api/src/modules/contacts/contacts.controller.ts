import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ContactService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto/create-contact.dto';
import { Prisma } from '../../../generated/prisma/client';
import { FindContactsDto } from './dto/find-contacts.dto';

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
  findAll(@Query() query: FindContactsDto) {
    const where =
      query.filterField && query.filterValue !== undefined
        ? { [query.filterField]: query.filterValue }
        : undefined;

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order ?? 'asc' }
      : undefined;

    return this.contactService.findAll(where, orderBy);
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
