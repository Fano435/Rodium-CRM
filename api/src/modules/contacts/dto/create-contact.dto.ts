import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
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
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}
