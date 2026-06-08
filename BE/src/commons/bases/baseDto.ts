import { ApiProperty } from '@nestjs/swagger';

export class GetAllDto {
  @ApiProperty({
    description: `Page size`,
    name: 'pageSize',
    required: false,
  })
  pageSize?: number;

  @ApiProperty({
    description: `Page number`,
    name: 'pageNumber',
    required: false,
  })
  pageNumber?: number;

  @ApiProperty({
    description: `Sort`,
    name: 'order',
    required: false,
  })
  order?: string;

  @ApiProperty({
    description: `Filter`,
    name: 'where',
    required: false,
  })
  where?: string;

  @ApiProperty({
    description: `Select`,
    name: 'select',
    required: false,
  })
  select?: string;

  @ApiProperty({
    description: `Relation`,
    name: 'relation',
    required: false,
  })
  relation?: string;

  @ApiProperty({
    description: `Province`,
    name: 'province',
    required: false,
  })
  province?: string;

  @ApiProperty({
    description: `district`,
    name: 'district',
    required: false,
  })
  district?: string;

  @ApiProperty({
    description: `ward`,
    name: 'ward',
    required: false,
  })
  ward?: string;
}
