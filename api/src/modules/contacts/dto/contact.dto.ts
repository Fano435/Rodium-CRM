import { IsString, IsOptional, IsInt, Min, IsEnum, IsObject } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { StatutContact } from '../../../../generated/prisma/enums';

export class CreateContactDto {
  @IsString()
  nom!: string;

  @IsOptional()
  @IsString()
  entreprise?: string;

  @IsString()
  telephone!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsEnum(StatutContact)
  statut?: StatutContact;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string | number | null>;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}
