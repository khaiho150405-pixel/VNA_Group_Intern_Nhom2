import {
  ClassSerializerInterceptor,
  Get,
  Request,
  UseInterceptors,
  Query,
  Post,
  Req,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { DeleteResult, UpdateResult } from 'typeorm';
import { ResponseInterceptor } from '..';
import { ResponseData } from '../response';

import { GetAllDto } from './baseDto';
import { BaseService } from './baseService';

export class BaseController<T, F extends BaseService<T>> {
  private readonly baseService: F;
  constructor(baseService: F) {
    this.baseService = baseService;
  }

  @Get()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get items' })
  async get(@Query() getAllDto: GetAllDto, @Request() req) {
    return await this.baseService.get(getAllDto, req.doet)
  }

  @Get(':id')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get detail item' })
  async getDetail(
    @Query() getAllDto: GetAllDto,
    @Param('id') id: string,
    @Request() req
  ) {
    return await this.baseService.getDetail(getAllDto, id, req.doet);
  }

  @Post()
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Create item' })
  async post(@Req() req: any, @Body() itemDto: T): Promise<ResponseData<T>> {
    return await this.baseService.post(req.user, itemDto, req.doet);
  }

  @Put(':id')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Edit item' })
  async put(
    @Req() req: any,
    @Param('id') id: string,
    @Body() itemDto: T,
  ): Promise<ResponseData<UpdateResult>> {
    return await this.baseService.put(req.user, id, itemDto);
  }

  @Put(':id/relations')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Edit relations of item' })
  async putRelations(
    @Req() req: any,
    @Param('id') id: string,
    @Body() itemDto: T,
  ): Promise<ResponseData<T>> {
    return await this.baseService.putRelations(req.user, id, itemDto);
  }

  @Delete('/deletes')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Delete items' })
  async deletes(
    @Req() req: any,
    @Body('ids') ids: string[]
  ): Promise<ResponseData<UpdateResult>> {
    return await this.baseService.deletes(req.user, ids, req.doet);
  }

  @Delete('/destroys')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Detroy items' })
  async detroys(
    @Req() req: any,
    @Body('ids') ids: string[]
  ): Promise<ResponseData<DeleteResult>> {
    return await this.baseService.destroys(req.user, ids, req.doet);
  }

  @Delete(':id')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Delete item' })
  async delete(
    @Req() req: any,
    @Param('id') id: string
  ): Promise<ResponseData<UpdateResult>> {
    return await this.baseService.delete(req.user, id);
  }

  @Delete('/destroy/:id')
  @UseInterceptors(ResponseInterceptor, ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Destroy item' })
  async destroy(@Param() id: string) {
    await this.baseService.destroy(id)
  }
}
