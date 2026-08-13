import { IsOptional, IsIn, IsEnum } from 'class-validator';
import { ContactScalarFieldEnum } from '../../../../generated/prisma/internal/prismaNamespace';

export class FindContactsDto {
  @IsOptional()
  @IsEnum(ContactScalarFieldEnum)
  sortBy?: keyof typeof ContactScalarFieldEnum;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(ContactScalarFieldEnum)
  filterField?: keyof typeof ContactScalarFieldEnum;

  @IsOptional()
  filterValue?: string;
}
