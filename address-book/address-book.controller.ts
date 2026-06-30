import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AddressBookService } from './address-book.service';
import { AddressBook } from './address-book.entity';
import { CreateAddressBookDto, UpdateAddressBookDto, AddressBookQueryDto } from './dto/address-book.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';

@ApiTags('通讯录')
@Controller('address-book')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AddressBookController {
  constructor(private readonly service: AddressBookService) {}

  @Get()
  @ApiOperation({ summary: '获取通讯录列表' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  findAll(@Query() query: AddressBookQueryDto) {
    return this.service.findAll(query);
  }

  @Get('starred')
  @ApiOperation({ summary: '获取星标联系人' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  findStarred() {
    return this.service.findStarred();
  }

  @Get('departments')
  @ApiOperation({ summary: '获取所有部门列表' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  getDepartments(@Query('schoolId') schoolId?: string) {
    return this.service.getDepartments(schoolId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '根据用户ID获取联系人' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取联系人详情' })
  @ApiResponse({ status: 200, description: '获取联系人详情成功', type: AddressBook })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建联系人' })
  @ApiResponse({ status: 201, description: '联系人创建成功', type: AddressBook })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  create(@Body() dto: CreateAddressBookDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新联系人' })
  @ApiResponse({ status: 200, description: '联系人更新成功', type: AddressBook })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAddressBookDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Patch(':id/star')
  @ApiOperation({ summary: '切换星标状态' })
  @ApiResponse({ status: 200, description: '星标状态更新成功', type: AddressBook })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR, UserRole.SCHOOL_STAFF, UserRole.TEACHER)
  toggleStar(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.toggleStar(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除联系人' })
  @ApiResponse({ status: 204, description: '联系人删除成功' })
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SCHOOL_DIRECTOR)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
