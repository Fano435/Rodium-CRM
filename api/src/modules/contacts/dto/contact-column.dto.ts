import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ColumnType } from '../../../../generated/prisma/enums';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class CreateContactColumnDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsEnum(ColumnType)
  type!: ColumnType;
}

export class UpdateContactColumnDto extends PartialType(
  OmitType(CreateContactColumnDto, ['type'] as const),
) {}

export class ReorderContactColumnsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  orderedIds!: number[];
}
