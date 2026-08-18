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
import { ContactColumnService } from './contact-columns.service';
import { CreateContactColumnDto, ReorderContactColumnsDto, UpdateContactColumnDto } from './dto/contact-column.dto';

@Controller('contact-columns')
export class ContactColumnController {
  constructor(private readonly contactColumnService: ContactColumnService) {}

  @Get()
  findAll() {
    return this.contactColumnService.findAll();
  }

  @Post()
  create(@Body() dto: CreateContactColumnDto) {
    return this.contactColumnService.create(dto);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderContactColumnsDto) {
    return this.contactColumnService.reorder(dto.orderedIds);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactColumnDto,
  ) {
    return this.contactColumnService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactColumnService.remove(id);
  }
}