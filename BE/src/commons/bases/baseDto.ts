import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetAllDto {
  @ApiProperty({
    description: `Page size`,
    name: 'pageSize',
    required: false,
  })
  @IsOptional()
  pageSize?: number;

  @ApiProperty({
    description: `Page number`,
    name: 'pageNumber',
    required: false,
  })
  @IsOptional()
  pageNumber?: number;

  @ApiProperty({
    description: `Sort`,
    name: 'order',
    required: false,
  })
  @IsOptional()
  @IsString()
  order?: string;

  @ApiProperty({
    description: `Filter`,
    name: 'where',
    required: false,
  })
  @IsOptional()
  @IsString()
  where?: string;

  @ApiProperty({
    description: `Select`,
    name: 'select',
    required: false,
  })
  @IsOptional()
  @IsString()
  select?: string;

  @ApiProperty({
    description: `Relation`,
    name: 'relation',
    required: false,
  })
  @IsOptional()
  @IsString()
  relation?: string;

  @ApiProperty({
    description: `Province`,
    name: 'province',
    required: false,
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({
    description: `district`,
    name: 'district',
    required: false,
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({
    description: `ward`,
    name: 'ward',
    required: false,
  })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  workUnit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  roleId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  withDeleted?: boolean;
}
