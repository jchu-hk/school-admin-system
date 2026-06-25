import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { GradeRecordsService } from './grade-records.service'
import { GradeRecord, RecordStatus } from './grade-record.entity'
import { GradeReview, ReviewAction, ReviewLevel } from './grade-review.entity'
import { GradeAuditAlert, AlertType, AlertSeverity, AlertStatus } from './grade-audit-alert.entity'
import { Repository, DataSource } from 'typeorm'
import { CreateGradeRecordDto, UpdateGradeRecordDto } from './dto/grade-record.dto'

describe('GradeRecordsService', () => {
  let service: GradeRecordsService
  let gradeRecordRepository: Repository<GradeRecord>
  let gradeReviewRepository: Repository<GradeReview>
  let alertRepository: Repository<GradeAuditAlert>
  let dataSource: DataSource

  const mockGradeRecordRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockGradeReviewRepository = {
    create: jest.fn(),
    save: jest.fn(),
  }

  const mockAlertRepository = {
    create: jest.fn(),
    save: jest.fn(),
  }

  const mockDataSource = {
    transaction: jest.fn((callback) => {
      const queryRunner = {
        manager: {
          save: jest.fn(),
          create: jest.fn(),
        },
      }
      return callback(queryRunner.manager)
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeRecordsService,
        {
          provide: getRepositoryToken(GradeRecord),
          useValue: mockGradeRecordRepository,
        },
        {
          provide: getRepositoryToken(GradeReview),
          useValue: mockGradeReviewRepository,
        },
        {
          provide: getRepositoryToken(GradeAuditAlert),
          useValue: mockAlertRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile()

    service = module.get<GradeRecordsService>(GradeRecordsService)
    gradeRecordRepository = module.get<Repository<GradeRecord>>(getRepositoryToken(GradeRecord))
    gradeReviewRepository = module.get<Repository<GradeReview>>(getRepositoryToken(GradeReview))
    alertRepository = module.get<Repository<GradeAuditAlert>>(getRepositoryToken(GradeAuditAlert))
    dataSource = module.get<DataSource>(DataSource)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a grade record', async () => {
      const dto: CreateGradeRecordDto = {
        studentId: 'student-1',
        teacherId: 'teacher-1',
        classId: 'class-1',
        academicYear: '2025-2026',
        term: '1',
        examName: '期中考试',
        subjects: [
          {
            subject: '中文',
            score: 85,
            grade: 'A',
            classRank: 5,
            classAvg: 72.3,
          },
        ],
        overallScore: 78.5,
        classRank: 8,
        gradeRank: 25,
        conductGrade: 'B+',
        attendanceRate: '95%',
      }

      const mockRecord = { ...dto, id: 'record-1', status: RecordStatus.DRAFT }
      mockGradeRecordRepository.create.mockReturnValue(mockRecord)
      mockGradeRecordRepository.save.mockResolvedValue(mockRecord)

      const result = await service.create(dto, 'user-1')

      expect(result).toEqual(mockRecord)
      expect(mockGradeRecordRepository.create).toHaveBeenCalledWith({
        ...dto,
        status: RecordStatus.DRAFT,
        submittedAt: null,
      })
      expect(mockGradeRecordRepository.save).toHaveBeenCalledWith(mockRecord)
    })
  })

  describe('findOne', () => {
    it('should find a grade record by id', async () => {
      const mockRecord = { id: 'record-1' }
      mockGradeRecordRepository.findOne.mockResolvedValue(mockRecord)

      const result = await service.findOne('record-1')

      expect(result).toEqual(mockRecord)
      expect(mockGradeRecordRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        relations: ['student', 'teacher', 'class', 'approver', 'revoker'],
      })
    })

    it('should throw NotFoundException if record not found', async () => {
      mockGradeRecordRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne('record-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a draft grade record', async () => {
      const mockRecord = {
        id: 'record-1',
        status: RecordStatus.DRAFT,
        overallScore: 78.5,
      }
      const dto: UpdateGradeRecordDto = { overallScore: 80 }

      mockGradeRecordRepository.findOne.mockResolvedValue(mockRecord)
      mockGradeRecordRepository.save.mockResolvedValue({ ...mockRecord, ...dto })

      const result = await service.update('record-1', dto)

      expect(result.overallScore).toBe(80)
      expect(mockGradeRecordRepository.save).toHaveBeenCalled()
    })

    it('should throw BadRequestException if record is not draft', async () => {
      const mockRecord = {
        id: 'record-1',
        status: RecordStatus.PENDING_APPROVAL,
      }

      mockGradeRecordRepository.findOne.mockResolvedValue(mockRecord)

      await expect(service.update('record-1', {})).rejects.toThrow(BadRequestException)
    })
  })

  describe('revoke', () => {
    it('should revoke a pending grade record within 48 hours', async () => {
      const mockRecord = {
        id: 'record-1',
        status: RecordStatus.PENDING_APPROVAL,
        teacherId: 'teacher-1',
        studentId: 'student-1',
        overallScore: 78.5,
        canRevokeUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
        teacher: { name: 'Test Teacher' },
      }

      const mockReview = { id: 'review-1' }
      const mockAlert = { id: 'alert-1' }

      mockGradeRecordRepository.findOne.mockResolvedValue(mockRecord)
      mockGradeReviewRepository.create.mockReturnValue(mockReview)
      mockAlertRepository.create.mockReturnValue(mockAlert)

      const result = await service.revoke('record-1', { reason: 'Need correction' }, 'teacher-1')

      expect(result.status).toBe(RecordStatus.DRAFT)
      expect(result.revokedBy).toBe('teacher-1')
      expect(result.revokedReason).toBe('Need correction')
      expect(mockAlertRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AlertType.GRADE_REVOKED,
          severity: AlertSeverity.HIGH,
        }),
      )
    })

    it('should throw BadRequestException if revoke period expired', async () => {
      const mockRecord = {
        id: 'record-1',
        status: RecordStatus.PENDING_APPROVAL,
        teacherId: 'teacher-1',
        canRevokeUntil: new Date(Date.now() - 48 * 60 * 60 * 1000), // Expired
      }

      mockGradeRecordRepository.findOne.mockResolvedValue(mockRecord)

      await expect(service.revoke('record-1', { reason: 'Test' }, 'teacher-1')).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should throw ForbiddenException if not the teacher', async () => {
      const mockRecord = {
        id: 'record-1',
        status: RecordStatus.PENDING_APPROVAL,
        teacherId: 'teacher-2', // Different user
        canRevokeUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      }

      mockGradeRecordRepository.findOne.mockResolvedValue(mockRecord)

      await expect(service.revoke('record-1', { reason: 'Test' }, 'teacher-1')).rejects.toThrow(
        ForbiddenException,
      )
    })
  })

  describe('getClassStats', () => {
    it('should return class statistics', async () => {
      const mockRecords = [
        {
          id: 'record-1',
          student: { id: 'student-1', name: 'Alice' },
          overallScore: 85,
          classRank: 5,
          gradeRank: 20,
          subjects: [
            { subject: '中文', grade: 'A' },
            { subject: '英文', grade: 'B' },
          ],
        },
        {
          id: 'record-2',
          student: { id: 'student-2', name: 'Bob' },
          overallScore: 75,
          classRank: 10,
          gradeRank: 30,
          subjects: [
            { subject: '中文', grade: 'B' },
            { subject: '英文', grade: 'B' },
          ],
        },
      ]

      mockGradeRecordRepository.find.mockResolvedValue(mockRecords)

      const result = await service.getClassStats({
        classId: 'class-1',
        academicYear: '2025-2026',
        term: '1',
        examName: '期中考试',
      })

      expect(result.totalStudents).toBe(2)
      expect(result.classAverage).toBe(80)
      expect(result.gradeDistribution).toHaveProperty('A')
      expect(result.gradeDistribution).toHaveProperty('B')
      expect(result.students).toHaveLength(2)
    })

    it('should return empty stats if no records found', async () => {
      mockGradeRecordRepository.find.mockResolvedValue([])

      const result = await service.getClassStats({
        classId: 'class-1',
        academicYear: '2025-2026',
        term: '1',
        examName: '期中考试',
      })

      expect(result.totalStudents).toBe(0)
      expect(result.classAverage).toBe(0)
      expect(result.scoreDistribution).toEqual([])
    })
  })
})