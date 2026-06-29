import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceStatus } from './attendance.entity';
import { User } from '../user/user.entity';
import { Class } from '../user/class.entity';
import { NotificationService } from '../notification/notification.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock QRCode module
jest.mock('qrcode');

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };

  const mockAttendanceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    softDelete: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockClassRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockNotificationService = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Class),
          useValue: mockClassRepository,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);

    jest.clearAllMocks();
  });

  describe('generateQrCode', () => {
    it('should generate valid QR code for existing student', async () => {
      const mockStudent = {
        id: 'student-123',
        name: '张三',
        role: UserRole.STUDENT,
      };

      mockUserRepository.findOne.mockResolvedValue(mockStudent);
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,test',
      );

      const result = await service.generateQrCode({
        studentId: 'student-123',
      });

      expect(result).toEqual({
        studentId: 'student-123',
        studentName: '张三',
        qrcode: 'STUDENT:student-123:张三',
        url: 'data:image/png;base64,test',
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'student-123', role: UserRole.STUDENT },
      });
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'STUDENT:student-123:张三',
        expect.objectContaining({
          width: 256,
          margin: 2,
        }),
      );
    });

    it('should throw NotFoundException when student does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.generateQrCode({ studentId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use provided student name over database name', async () => {
      const mockStudent = {
        id: 'student-123',
        name: '张三',
        role: UserRole.STUDENT,
      };

      mockUserRepository.findOne.mockResolvedValue(mockStudent);
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(
        'data:image/png;base64,test',
      );

      const result = await service.generateQrCode({
        studentId: 'student-123',
        studentName: '李四',
      });

      expect(result.studentName).toBe('李四');
      expect(result.qrcode).toBe('STUDENT:student-123:李四');
    });
  });

  describe('mobileScan', () => {
    it('should scan and return student info when not recorded', async () => {
      const mockStudent = {
        id: 'student-123',
        name: '张三',
        className: '一年级1班',
      };

      mockUserRepository.findOne.mockResolvedValue(mockStudent);
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      const result = await service.mobileScan(
        { qrcode: 'STUDENT:student-123:张三' },
        'teacher-123',
      );

      expect(result).toEqual({
        student: {
          id: 'student-123',
          name: '张三',
          className: '一年级1班',
        },
        status: 'scanned',
      });
    });

    it('should return existing record when already recorded', async () => {
      const mockStudent = {
        id: 'student-123',
        name: '张三',
        className: '一年级1班',
      };

      const mockExistingRecord = {
        id: 'attendance-123',
        status: AttendanceStatus.PRESENT,
        checkInTime: '08:30:00',
      };

      mockUserRepository.findOne.mockResolvedValue(mockStudent);
      mockAttendanceRepository.findOne.mockResolvedValue(mockExistingRecord);

      const result = await service.mobileScan(
        { qrcode: 'STUDENT:student-123:张三' },
        'teacher-123',
      );

      expect(result).toEqual({
        student: {
          id: 'student-123',
          name: '张三',
          className: '一年级1班',
        },
        status: 'already_recorded',
        existingRecord: {
          id: 'attendance-123',
          status: AttendanceStatus.PRESENT,
          checkInTime: '08:30:00',
        },
      });
    });

    it('should throw BadRequestException for invalid QR code format', async () => {
      await expect(
        service.mobileScan({ qrcode: 'INVALID:FORMAT' }, 'teacher-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when student not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.mobileScan(
          { qrcode: 'STUDENT:non-existent:张三' },
          'teacher-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('mobileBatchSubmit', () => {
    it('should batch submit attendance records', async () => {
      const mockRecords = [
        {
          id: 'attendance-1',
          studentId: 'student-1',
          classId: 'class-1',
          status: AttendanceStatus.PRESENT,
        },
        {
          id: 'attendance-2',
          studentId: 'student-2',
          classId: 'class-1',
          status: AttendanceStatus.ABSENT,
        },
      ];

      mockAttendanceRepository.save.mockResolvedValue(mockRecords);

      const result = await service.mobileBatchSubmit(
        {
          classId: 'class-1',
          attendanceDate: '2024-01-15',
          records: [
            { studentId: 'student-1', status: AttendanceStatus.PRESENT },
            { studentId: 'student-2', status: AttendanceStatus.ABSENT },
          ],
        },
        'teacher-123',
      );

      expect(result.count).toBe(2);
      expect(result.batchId).toBeDefined();
      expect(result.records).toEqual(mockRecords);
      expect(mockAttendanceRepository.save).toHaveBeenCalled();
    });

    it('should include checkInTime and remark in records', async () => {
      const dto = {
        classId: 'class-1',
        attendanceDate: '2024-01-15',
        records: [
          {
            studentId: 'student-1',
            status: AttendanceStatus.LATE,
            checkInTime: '09:15:00',
            remark: '交通堵塞',
          },
        ],
      };

      mockAttendanceRepository.save.mockImplementation((records) =>
        Promise.resolve(
          records.map((r, i) => ({ ...r, id: `attendance-${i}` })),
        ),
      );

      const result = await service.mobileBatchSubmit(dto, 'teacher-123');

      expect(result.count).toBe(1);
      const savedRecord = mockAttendanceRepository.save.mock.calls[0][0][0];
      expect(savedRecord.checkInTime).toBe('09:15:00');
      expect(savedRecord.remark).toBe('交通堵塞');
      expect(savedRecord.teacherId).toBe('teacher-123');
    });
  });

  describe('getTeacherClasses', () => {
    it('should return classes with student count for teacher', async () => {
      const mockTeacher = {
        id: 'teacher-123',
        role: UserRole.TEACHER,
      };

      mockUserRepository.findOne.mockResolvedValue(mockTeacher);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          id: 'class-1',
          name: '一年级1班',
          grade: '一年级',
          studentCount: '25',
        },
        {
          id: 'class-2',
          name: '一年级2班',
          grade: '一年级',
          studentCount: '30',
        },
      ]);

      const result = await service.getTeacherClasses('teacher-123');

      expect(result.classes).toHaveLength(2);
      expect(result.classes[0].studentCount).toBe(25);
      expect(result.classes[1].studentCount).toBe(30);
    });

    it('should return all classes for school director', async () => {
      const mockDirector = {
        id: 'director-123',
        role: UserRole.SCHOOL_DIRECTOR,
      };

      mockUserRepository.findOne.mockResolvedValue(mockDirector);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        {
          id: 'class-1',
          name: '一年级1班',
          grade: '一年级',
          studentCount: '25',
        },
      ]);

      const result = await service.getTeacherClasses('director-123');

      expect(result.classes).toHaveLength(1);
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getTeacherClasses('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('batchCreate', () => {
    it('should create batch attendance records', async () => {
      const mockSavedRecords = [
        { id: 'record-1', studentId: 'student-1' },
        { id: 'record-2', studentId: 'student-2' },
      ];

      mockAttendanceRepository.save.mockResolvedValue(mockSavedRecords);

      const result = await service.batchCreate(
        {
          classId: 'class-1',
          attendanceDate: '2024-01-15',
          records: [
            { studentId: 'student-1', status: AttendanceStatus.PRESENT },
            { studentId: 'student-2', status: AttendanceStatus.ABSENT },
          ],
        },
        'teacher-123',
      );

      expect(result.count).toBe(2);
      expect(result.batchId).toBeDefined();
      expect(result.records).toEqual(mockSavedRecords);
    });
  });

  describe('findByClassAndDate', () => {
    it('should return records and summary for class and date', async () => {
      const mockRecords = [
        { id: 'record-1', status: AttendanceStatus.PRESENT },
        { id: 'record-2', status: AttendanceStatus.ABSENT },
      ];

      mockAttendanceRepository.find.mockResolvedValue(mockRecords);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '2',
        present: '1',
        absent: '1',
        late: '0',
      });

      const result = await service.findByClassAndDate('class-1', '2024-01-15');

      expect(result.classId).toBe('class-1');
      expect(result.date).toBe('2024-01-15');
      expect(result.records).toEqual(mockRecords);
      expect(result.summary).toEqual({
        total: 2,
        present: 1,
        absent: 1,
        late: 0,
      });
    });
  });

  describe('getStats', () => {
    it('should return aggregated stats using SQL', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '100',
        present: '80',
        absent: '10',
        late: '5',
        leaveEarly: '3',
        sickLeave: '2',
        personalLeave: '0',
      });

      const result = await service.getStats(
        'class-1',
        '2024-01-01',
        '2024-01-31',
      );

      expect(result.total).toBe(100);
      expect(result.present).toBe(80);
      expect(result.absent).toBe(10);
      expect(result.late).toBe(5);
      expect(result.attendanceRate).toBe(82);
    });
  });

  describe('getDailyStats', () => {
    it('should return daily stats using SQL aggregation', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '30',
        present: '25',
        absent: '3',
        late: '2',
        leaveEarly: '0',
        sickLeave: '0',
        personalLeave: '0',
      });

      const result = await service.getDailyStats('2024-01-15', 'class-1');

      expect(result.date).toBe('2024-01-15');
      expect(result.total).toBe(30);
      expect(result.present).toBe(25);
      expect(result.absent).toBe(3);
    });
  });

  describe('getMonthlyStats', () => {
    it('should return monthly stats with daily breakdown', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        total: '600',
        present: '550',
        absent: '30',
        late: '15',
        leaveEarly: '5',
        sickLeave: '0',
        personalLeave: '0',
      });
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { date: '2024-01-01', total: '20', present: '18', absent: '2' },
        { date: '2024-01-02', total: '20', present: '19', absent: '1' },
      ]);

      const result = await service.getMonthlyStats(2024, 1, 'class-1');

      expect(result.year).toBe(2024);
      expect(result.month).toBe(1);
      expect(result.total).toBe(600);
      expect(result.present).toBe(550);
      expect(result.dailyStats).toHaveLength(2);
    });
  });

  describe('getClassStats', () => {
    it('should return class stats using SQL aggregation', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue({
        totalRecords: '100',
        present: '85',
        absent: '10',
        late: '3',
        leaveEarly: '2',
        sickLeave: '0',
        personalLeave: '0',
      });

      const result = await service.getClassStats(
        'class-1',
        '2024-01-01',
        '2024-01-31',
      );

      expect(result.classId).toBe('class-1');
      expect(result.totalRecords).toBe(100);
      expect(result.present).toBe(85);
      expect(result.attendanceRate).toBe(85);
    });
  });

  // ==================== AC-04: 连续缺席告警测试 ====================
  describe('checkConsecutiveAbsencesAndAlert (AC-04)', () => {
    it('should return empty result when no absences found', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.checkConsecutiveAbsencesAndAlert(
        'school-1',
        'system',
      );

      expect(result.checkedStudents).toBe(0);
      expect(result.alertedStudents).toBe(0);
      expect(result.alerts).toHaveLength(0);
    });

    it('should alert teacher when student is absent for 3+ consecutive days', async () => {
      // Build dates in HK timezone (matching server environment)
      const now = new Date();
      const toHKDate = (offsetDays) => {
        const d = new Date(now);
        d.setDate(d.getDate() - offsetDays);
        d.setHours(0, 0, 0, 0);
        return d;
      };
      // 3 consecutive school days ending today
      const d1 = toHKDate(0); // today
      const d2 = toHKDate(1); // yesterday
      const d3 = toHKDate(2); // 2 days ago

      // Mock absences: 3 consecutive school days
      mockQueryBuilder.getMany.mockResolvedValue([
        {
          id: 'att-1',
          studentId: 'student-1',
          student: { id: 'student-1', name: '王小明', role: UserRole.STUDENT },
          classId: 'class-1',
          status: AttendanceStatus.ABSENT,
          attendanceDate: d1,
        },
        {
          id: 'att-2',
          studentId: 'student-1',
          student: { id: 'student-1', name: '王小明', role: UserRole.STUDENT },
          classId: 'class-1',
          status: AttendanceStatus.ABSENT,
          attendanceDate: d2,
        },
        {
          id: 'att-3',
          studentId: 'student-1',
          student: { id: 'student-1', name: '王小明', role: UserRole.STUDENT },
          classId: 'class-1',
          status: AttendanceStatus.ABSENT,
          attendanceDate: d3,
        },
      ]);

      mockClassRepository.find.mockResolvedValue([
        { id: 'class-1', name: '1A班', homeroomTeacherId: 'teacher-1' },
      ]);

      mockUserRepository.find.mockResolvedValue([
        { id: 'teacher-1', name: '李老师', role: UserRole.TEACHER },
      ]);

      mockNotificationService.sendNotification.mockResolvedValue({
        id: 'notif-1',
      });

      const result = await service.checkConsecutiveAbsencesAndAlert(
        'school-1',
        'system',
      );

      expect(result.checkedStudents).toBe(1);
      expect(result.alertedStudents).toBe(1);
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].studentName).toBe('王小明');
      expect(result.alerts[0].consecutiveDays).toBeGreaterThanOrEqual(3);
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('连续缺席'),
          recipientIds: ['teacher-1'],
          urgency: 'high',
        }),
        'system',
        'school-1',
      );
    });

    it('should NOT alert when student has less than 3 consecutive absences', async () => {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);

      // Only 1 absence, not consecutive
      mockQueryBuilder.getMany.mockResolvedValue([
        {
          id: 'att-1',
          studentId: 'student-2',
          student: { id: 'student-2', name: '李小红', role: UserRole.STUDENT },
          classId: 'class-1',
          status: AttendanceStatus.ABSENT,
          attendanceDate: lastWeek,
        },
      ]);

      mockClassRepository.find.mockResolvedValue([
        { id: 'class-1', name: '1A班', homeroomTeacherId: 'teacher-1' },
      ]);

      mockUserRepository.find.mockResolvedValue([
        { id: 'teacher-1', name: '李老师', role: UserRole.TEACHER },
      ]);

      const result = await service.checkConsecutiveAbsencesAndAlert(
        'school-1',
        'system',
      );

      expect(result.checkedStudents).toBe(1);
      expect(result.alertedStudents).toBe(0);
      expect(result.alerts).toHaveLength(0);
    });
  });
});
