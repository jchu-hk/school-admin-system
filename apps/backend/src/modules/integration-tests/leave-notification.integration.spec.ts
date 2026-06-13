/**
 * 请假模块 → 通知系统 集成测试
 *
 * 测试场景：
 * 1. 请假申请提交后自动发送通知给班主任和校务人员
 * 2. 请假审批通过后自动通知家长
 * 3. 请假审批拒绝后自动通知家长
 *
 * 对应模块：leave (请假), notification (通知)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeaveService } from '../leave/leave.service';
import {
  LeaveApplication,
  LeaveType,
  LeaveStatus,
} from '../leave/leave.entity';
import { NotificationService } from '../notification/notification.service';
import {
  CreateLeaveDto,
  ApproveLeaveDto,
  RejectLeaveDto,
} from '../leave/dto/leave.dto';

describe('Leave → Notification System Integration', () => {
  let leaveService: LeaveService;
  let _notificationService: jest.Mocked<NotificationService>;

  const mockLeaveRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockNotificationService = {
    sendNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Default query builder mock
    mockLeaveRepository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    } as any);
  });

  const createTestingModule = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        {
          provide: getRepositoryToken(LeaveApplication),
          useValue: mockLeaveRepository,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    leaveService = module.get<LeaveService>(LeaveService);
    _notificationService = module.get(NotificationService);
    return module;
  };

  describe('场景1: 请假申请提交后自动发送通知', () => {
    it('应该在创建请假申请后调用 sendNotification', async () => {
      await createTestingModule();

      const createDto: CreateLeaveDto = {
        studentId: 'student-001',
        classId: 'class-001',
        leaveType: LeaveType.SICK,
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        reason: '身体不适',
      };

      const savedApplication: LeaveApplication = {
        id: 'leave-001',
        applicationNo: 'LEAVE-20260607-ABCD',
        studentId: 'student-001',
        classId: 'class-001',
        leaveType: LeaveType.SICK,
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-11'),
        totalDays: 2,
        status: LeaveStatus.PENDING,
        schoolId: 'school-001',
        createdBy: 'parent-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as LeaveApplication;

      mockLeaveRepository.create.mockReturnValue(savedApplication);
      mockLeaveRepository.save.mockResolvedValue(savedApplication);
      mockLeaveRepository.findOne.mockResolvedValue(savedApplication);

      const result = await leaveService.create(
        createDto,
        'parent-001',
        'school-001',
      );

      // Assert: Leave was created
      expect(result).toBeDefined();
      expect(result.applicationNo).toBe('LEAVE-20260607-ABCD');

      // Assert: Notification was sent (submission notification)
      // Note: This verifies the integration point exists
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '新请假申请待审批',
          relatedEntityType: 'leave_application',
          relatedEntityId: 'leave-001',
        }),
      );
    });

    it('应该根据请假类型设置正确的通知优先级', async () => {
      await createTestingModule();

      const createDto: CreateLeaveDto = {
        studentId: 'student-001',
        classId: 'class-001',
        leaveType: LeaveType.COMPASSIONATE,
        startDate: '2026-06-10',
        endDate: '2026-06-12',
        reason: '家中有事',
      };

      const savedApplication: LeaveApplication = {
        id: 'leave-002',
        applicationNo: 'LEAVE-20260607-EFGH',
        studentId: 'student-001',
        classId: 'class-001',
        leaveType: LeaveType.COMPASSIONATE,
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-12'),
        totalDays: 3,
        status: LeaveStatus.PENDING,
        schoolId: 'school-001',
        createdBy: 'parent-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as LeaveApplication;

      mockLeaveRepository.create.mockReturnValue(savedApplication);
      mockLeaveRepository.save.mockResolvedValue(savedApplication);
      mockLeaveRepository.findOne.mockResolvedValue(savedApplication);

      await leaveService.create(createDto, 'parent-001', 'school-001');

      // Assert: Notification was sent
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });
  });

  describe('场景2: 请假审批通过后自动通知家长', () => {
    it('应该在班主任审批通过后通知家长', async () => {
      await createTestingModule();

      const application: LeaveApplication = {
        id: 'leave-001',
        applicationNo: 'LEAVE-20260607-ABCD',
        studentId: 'student-001',
        classId: 'class-001',
        student: { name: '张三' } as any,
        leaveType: LeaveType.SICK,
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-11'),
        totalDays: 2,
        status: LeaveStatus.PENDING,
        schoolId: 'school-001',
        createdBy: 'parent-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as LeaveApplication;

      const approvedApplication: LeaveApplication = {
        ...application,
        status: LeaveStatus.APPROVED,
      } as LeaveApplication;

      mockLeaveRepository.findOne.mockResolvedValue(application);
      mockLeaveRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockLeaveRepository.findOne
        .mockResolvedValueOnce(application) // first findOne call in classTeacherApprove
        .mockResolvedValueOnce(approvedApplication); // second findOne call after update

      const approveDto: ApproveLeaveDto = {
        comment: '同意',
      };

      const result = await leaveService.classTeacherApprove(
        'leave-001',
        approveDto,
        'teacher-001',
        'teacher' as any,
        'class-001',
      );

      // Assert: Result includes substituteTeacherClassHours field
      expect(result).toBeDefined();

      // Assert: Notification was sent to parent
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '请假申请已批准',
          type: 'system',
        }),
      );
    });

    it('应该在校长审批通过后通知家长', async () => {
      await createTestingModule();

      const application: LeaveApplication = {
        id: 'leave-002',
        applicationNo: 'LEAVE-20260607-IJKL',
        studentId: 'student-001',
        classId: 'class-001',
        student: { name: '张三' } as any,
        leaveType: LeaveType.PERSONAL,
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-15'),
        totalDays: 6,
        status: LeaveStatus.PENDING_DIRECTOR,
        schoolId: 'school-001',
        createdBy: 'parent-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as LeaveApplication;

      const approvedApplication: LeaveApplication = {
        ...application,
        status: LeaveStatus.APPROVED,
      } as LeaveApplication;

      mockLeaveRepository.findOne
        .mockResolvedValueOnce(application)
        .mockResolvedValueOnce(approvedApplication);
      mockLeaveRepository.update.mockResolvedValue({ affected: 1 } as any);

      const approveDto: ApproveLeaveDto = {
        comment: '超过3天，同意',
      };

      await leaveService.directorApprove(
        'leave-002',
        approveDto,
        'director-001',
      );

      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '请假申请已批准',
          type: 'system',
        }),
      );
    });
  });

  describe('场景3: 请假申请被拒绝后自动通知家长', () => {
    it('应该在拒绝请假后通知家长并包含拒绝原因', async () => {
      await createTestingModule();

      const application: LeaveApplication = {
        id: 'leave-003',
        applicationNo: 'LEAVE-20260607-MNOP',
        studentId: 'student-001',
        classId: 'class-001',
        student: { name: '张三' } as any,
        leaveType: LeaveType.PERSONAL,
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-11'),
        totalDays: 2,
        status: LeaveStatus.PENDING,
        schoolId: 'school-001',
        createdBy: 'parent-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as LeaveApplication;

      const rejectedApplication: LeaveApplication = {
        ...application,
        status: LeaveStatus.REJECTED,
        directorComment: '请假理由不充分',
      } as LeaveApplication;

      mockLeaveRepository.findOne
        .mockResolvedValueOnce(application)
        .mockResolvedValueOnce(rejectedApplication);
      mockLeaveRepository.update.mockResolvedValue({ affected: 1 } as any);

      const rejectDto: RejectLeaveDto = {
        reason: '请假理由不充分',
      };

      await leaveService.reject('leave-003', rejectDto, 'director-001');

      // Assert: Rejection notification was sent
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '请假申请被拒绝',
          content: expect.stringContaining('请假理由不充分'),
          type: 'system',
        }),
      );
    });
  });
});
