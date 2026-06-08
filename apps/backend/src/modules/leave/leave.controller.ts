import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { Leave, LeaveStatus } from './leave.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { ApproveLeaveDto, RejectLeaveDto } from './dto/approve-leave.dto';

@Controller('leaves')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  create(@Body() createLeaveDto: CreateLeaveDto): Promise<Leave> {
    return this.leaveService.create(createLeaveDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('applicantId') applicantId?: string,
    @Query('status') status?: LeaveStatus,
  ): Promise<{ leaves: Leave[]; total: number }> {
    return this.leaveService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      applicantId,
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Leave> {
    return this.leaveService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.update(id, updateLeaveDto);
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveLeaveDto: ApproveLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.approve(id, approveLeaveDto);
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectLeaveDto: RejectLeaveDto,
  ): Promise<Leave> {
    return this.leaveService.reject(id, rejectLeaveDto);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('cancelledBy') cancelledBy: string,
  ): Promise<Leave> {
    return this.leaveService.cancel(id, cancelledBy);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.leaveService.remove(id);
  }

  @Get('stats/substitute-teacher/:id')
  getSubstituteTeacherStats(
    @Param('id', ParseUUIDPipe) substituteTeacherId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ totalClassHours: number; totalLeaves: number }> {
    return this.leaveService.getSubstituteTeacherStats(
      substituteTeacherId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('stats/leaves')
  getLeaveStats(
    @Query('applicantId') applicantId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalLeaves: number;
    totalDays: number;
    byType: Record<string, number>;
  }> {
    return this.leaveService.getLeaveStats(
      applicantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
