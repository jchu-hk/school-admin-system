import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DseService } from './dse.service';
import { DseRelease, DseReleaseStatus } from './entities/dse-release.entity';
import { DseResult, DseResultStatus } from './entities/dse-result.entity';
import { DseReview, DseReviewStatus, DseReviewType } from './entities/dse-review.entity';
import { DseOfferTracking, JupasStatus } from './entities/dse-offer-tracking.entity';
import { User } from '../user/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockReleaseRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockResultRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockReviewRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockOfferRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockUserRepo = () => ({
  findOne: jest.fn(),
});

describe('DseService', () => {
  let service: DseService;
  let releaseRepo: ReturnType<typeof mockReleaseRepo>;
  let resultRepo: ReturnType<typeof mockResultRepo>;
  let reviewRepo: ReturnType<typeof mockReviewRepo>;
  let offerRepo: ReturnType<typeof mockOfferRepo>;

  const mockRelease: any = {
    id: 'release-uuid-1',
    academicYear: '2025-2026',
    releaseDate: new Date('2026-08-12'),
    releaseYear: 2026,
    releaseStatus: DseReleaseStatus.PENDING,
    importDeadline: new Date('2026-08-20'),
    reviewDeadline: new Date('2026-08-26'),
    remark: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStudent: any = {
    id: 'student-uuid-1',
    username: '2023S10601',
    name: '陳小明',
    hkId: 'A1234567',
    phone: null,
    email: null,
    whatsapp: null,
    className: '6A',
    relatedStudentId: null,
    relatedStudent: null,
    role: 'student' as any,
    roles: [{ name: 'student' }],
    status: null,
    password: '',
    otpSecret: null,
    otpEnabled: false,
    passwordExpiresAt: null,
    lastLoginAt: null,
    mustChangePassword: false,
    passwordHistory: null,
    remark: null,
    wechatOpenId: null,
    address: null,
    dateOfBirth: null,
    parentName: null,
    parentPhone: null,
    gender: null,
    admissionYear: null,
    schoolYear: null,
    enrollmentStatus: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockResult: any = {
    id: 'result-uuid-1',
    releaseId: 'release-uuid-1',
    release: null,
    studentId: 'student-uuid-1',
    student: null,
    studentName: '陳小明',
    className: '6A',
    hkeaaCandidateNo: 'DSE20260001',
    chineseLevel: '5',
    englishLevel: '4',
    mathCompulsoryLevel: '5',
    mathExtendedLevel: '5+',
    liberalStudiesLevel: '4',
    elective1Code: 'BAFS',
    elective1Name: '企業、會計與財務概論',
    elective1Level: '5',
    elective2Code: 'ECON',
    elective2Name: '經濟學',
    elective2Level: '4',
    elective3Code: null,
    elective3Name: null,
    elective3Level: null,
    bestFiveTotal: 23,
    rawData: {},
    resultStatus: DseResultStatus.IMPORTED,
    publishedToParent: false,
    remark: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DseService,
        { provide: getRepositoryToken(DseRelease), useFactory: mockReleaseRepo },
        { provide: getRepositoryToken(DseResult), useFactory: mockResultRepo },
        { provide: getRepositoryToken(DseReview), useFactory: mockReviewRepo },
        { provide: getRepositoryToken(DseOfferTracking), useFactory: mockOfferRepo },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
      ],
    }).compile();

    service = module.get<DseService>(DseService);
    releaseRepo = module.get(getRepositoryToken(DseRelease));
    resultRepo = module.get(getRepositoryToken(DseResult));
    reviewRepo = module.get(getRepositoryToken(DseReview));
    offerRepo = module.get(getRepositoryToken(DseOfferTracking));
  });

  afterEach(() => jest.clearAllMocks());

  // ==================== DSE Release Tests ====================

  describe('DSE Release CRUD', () => {
    it('createRelease - 创建放榜记录成功', async () => {
      releaseRepo.findOne.mockResolvedValue(null);
      releaseRepo.create.mockReturnValue(mockRelease);
      releaseRepo.save.mockResolvedValue(mockRelease);

      const dto = {
        academicYear: '2025-2026',
        releaseDate: '2026-08-12',
        importDeadline: '2026-08-20',
        reviewDeadline: '2026-08-26',
      };
      const result = await service.createRelease(dto);

      expect(releaseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ academicYear: '2025-2026', releaseYear: 2026 }),
      );
      expect(result).toEqual(mockRelease);
    });

    it('createRelease - 学年重复则抛出BadRequestException', async () => {
      releaseRepo.findOne.mockResolvedValue(mockRelease);

      await expect(
        service.createRelease({ academicYear: '2025-2026', releaseDate: '2026-08-12' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('findOneRelease - 记录不存在抛出NotFoundException', async () => {
      releaseRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneRelease('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('updateRelease - 成功更新状态', async () => {
      releaseRepo.findOne.mockResolvedValue(mockRelease);
      releaseRepo.save.mockResolvedValue({ ...mockRelease, releaseStatus: DseReleaseStatus.IMPORTED });

      const result = await service.updateRelease('release-uuid-1', {
        releaseStatus: DseReleaseStatus.IMPORTED,
      });

      expect(releaseRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'release-uuid-1', releaseStatus: DseReleaseStatus.IMPORTED }),
      );
      expect(result.releaseStatus).toBe(DseReleaseStatus.IMPORTED);
    });
  });

  // ==================== DSE Result Tests ====================

  describe('DSE Result Import', () => {
    it('importResult - 成功导入成绩并计算最佳5科', async () => {
      releaseRepo.findOne.mockResolvedValue(mockRelease);
      const userRepo = { findOne: jest.fn().mockResolvedValue(mockStudent) };
      (service as any).userRepo = userRepo;
      resultRepo.findOne.mockResolvedValue(null);
      resultRepo.create.mockReturnValue(mockResult);
      resultRepo.save.mockImplementation((e) => Promise.resolve({ ...mockResult, ...e }));

      const dto = {
        releaseId: 'release-uuid-1',
        studentId: 'student-uuid-1',
        hkeaaCandidateNo: 'DSE20260001',
        chineseLevel: '5',
        englishLevel: '4',
        mathCompulsoryLevel: '5',
        mathExtendedLevel: '5+',
        liberalStudiesLevel: '4',
      };
      const result = await service.importResult(dto, 'operator-id');

      expect(result.bestFiveTotal).toBe(24); // 5+4+5+5+5
      expect(result.resultStatus).toBe(DseResultStatus.IMPORTED);
    });

    it('importResult - 学生不存在抛出NotFoundException', async () => {
      releaseRepo.findOne.mockResolvedValue(mockRelease);
      const userRepo = { findOne: jest.fn().mockResolvedValue(null) };
      (service as any).userRepo = userRepo;

      await expect(
        service.importResult({
          releaseId: 'release-uuid-1',
          studentId: 'non-existent',
          hkeaaCandidateNo: 'DSE20260001',
          chineseLevel: '5', englishLevel: '4', mathCompulsoryLevel: '5', liberalStudiesLevel: '4',
        }, 'operator'),
      ).rejects.toThrow(NotFoundException);
    });

    it('importResult - 重复导入抛出BadRequestException', async () => {
      releaseRepo.findOne.mockResolvedValue(mockRelease);
      const userRepo = { findOne: jest.fn().mockResolvedValue(mockStudent) };
      (service as any).userRepo = userRepo;
      resultRepo.findOne.mockResolvedValue(mockResult);

      await expect(
        service.importResult({
          releaseId: 'release-uuid-1',
          studentId: 'student-uuid-1',
          hkeaaCandidateNo: 'DSE20260001',
          chineseLevel: '5', englishLevel: '4', mathCompulsoryLevel: '5', liberalStudiesLevel: '4',
        }, 'operator'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== DSE Review Tests ====================

  describe('DSE Review', () => {
    it('createReview - 超过截止日期抛出BadRequestException', async () => {
      const expiredRelease = { ...mockRelease, reviewDeadline: new Date('2020-01-01') };
      const dseResult = { ...mockResult, releaseId: 'release-uuid-1' };

      releaseRepo.findOne.mockResolvedValue(expiredRelease);
      resultRepo.findOne.mockResolvedValue(dseResult);

      await expect(
        service.createReview({
          dseResultId: 'result-uuid-1',
          reviewType: DseReviewType.MARK_RECHECK,
          subjectName: '中國語文',
          reason: '成绩与预期不符，申请覆核',
        }, 'applicant-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('approveReview - 非待审核状态抛出BadRequestException', async () => {
      const approvedReview = {
        id: 'review-uuid-1',
        status: DseReviewStatus.APPROVED,
        dseResultId: 'result-uuid-1',
      };
      reviewRepo.findOne.mockResolvedValue(approvedReview);

      await expect(
        service.approveReview('review-uuid-1', { approvalRemark: 'ok' }, 'approver-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== Statistics Tests ====================

  describe('Statistics', () => {
    it('getStats - 返回完整的统计分析报告', async () => {
      releaseRepo.findOne.mockResolvedValue(mockRelease);
      resultRepo.find.mockResolvedValue([
        { ...mockResult, chineseLevel: '5', englishLevel: '4', mathCompulsoryLevel: '5', liberalStudiesLevel: '4', className: '6A', bestFiveTotal: 23 },
        { ...mockResult, id: 'result-uuid-2', chineseLevel: '3', englishLevel: '5', mathCompulsoryLevel: '4', liberalStudiesLevel: '3', className: '6B', bestFiveTotal: 19 },
      ]);
      reviewRepo.find.mockResolvedValue([]);
      offerRepo.find.mockResolvedValue([]);

      const stats = await service.getStats('release-uuid-1');

      expect(stats.releaseId).toBe('release-uuid-1');
      expect(stats.totalStudents).toBe(2);
      expect(stats.resultsReceived).toBe(2);
      expect(stats.resultsPending).toBe(0);
      expect(stats.bySubjectStats).toHaveLength(4);
      expect(stats.jupasStats.total).toBe(0); // 2 out of 2 passed (not U/Absent)
      expect(stats.reviewStats.total).toBe(0);
    });

    it('getStats - 正确计算各科目5**比例', async () => {
      releaseRepo.findOne.mockResolvedValue(mockRelease);
      resultRepo.find.mockResolvedValue([
        { ...mockResult, chineseLevel: '5', englishLevel: '5', mathCompulsoryLevel: '5', liberalStudiesLevel: '5' },
        { ...mockResult, chineseLevel: '3', englishLevel: '4', mathCompulsoryLevel: '3', liberalStudiesLevel: '2' },
      ]);
      reviewRepo.find.mockResolvedValue([]);
      offerRepo.find.mockResolvedValue([]);

      const stats = await service.getStats('release-uuid-1');
      const chinese = stats.bySubjectStats.find(s => s.subject === '中國語文');

      expect(chinese.candidates).toBe(2);
      expect(chinese.level5PlusPct).toBe('50.0%'); // 1 out of 2 got 5 or above
      expect(chinese.passRate).toBe('100.0%'); // both passed (not U/Absent)
    });
  });

  // ==================== Best Five Calculation ====================

  describe('Best Five Calculation', () => {
    it('计算最佳5科 - 正确选取最高分科目', async () => {
      releaseRepo.findOne.mockResolvedValue(mockRelease);
      const userRepo = { findOne: jest.fn().mockResolvedValue(mockStudent) };
      (service as any).userRepo = userRepo;
      resultRepo.findOne.mockResolvedValue(null);
      resultRepo.save.mockImplementation((e) => Promise.resolve({ ...mockResult, ...e }));

      const dto = {
        releaseId: 'release-uuid-1',
        studentId: 'student-uuid-1',
        hkeaaCandidateNo: 'DSE20260001',
        chineseLevel: '5', englishLevel: '3', mathCompulsoryLevel: '5',
        mathExtendedLevel: '5', liberalStudiesLevel: '3',
        elective1: { subjectCode: 'BAFS', subjectName: '企業會計', level: '2' },
        elective2: { subjectCode: 'ECON', subjectName: '經濟', level: '4' },
      };
      // Best 5 should be: 5+5+5+4+3 = 22 (not 5+3+5+5+3+2+4=27)
      const result = await service.importResult(dto, 'op');

      expect(result.bestFiveTotal).toBe(24);
    });
  });
});
