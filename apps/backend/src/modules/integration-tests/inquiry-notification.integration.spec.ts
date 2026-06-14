/**
 * 家长查询 → 通知系统 集成测试
 *
 * 测试场景：
 * 1. 查询提交后自动通知校务人员
 * 2. 回复后自动通知家长
 *
 * 对应模块：inquiry (家长查询), notification (通知)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InquiryService } from '../inquiry/inquiry.service';
import { NotificationService } from '../notification/notification.service';
import {
  ParentInquiry,
  InquiryCategory,
  InquiryPriority,
  InquiryStatus,
} from '../inquiry/inquiry.entity';
import { InquiryReply, ReplyAuthorType } from '../inquiry/reply.entity';
import { QuickReplyTemplate } from '../inquiry/template.entity';
import { CreateInquiryDto, CreateReplyDto } from '../inquiry/dto/inquiry.dto';

describe('Inquiry → Notification System Integration', () => {
  let inquiryService: InquiryService;
  let _notificationService: jest.Mocked<NotificationService>;

  const mockInquiryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockReplyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockTemplateRepository = {
    find: jest.fn(),
  };

  const mockNotificationService = {
    sendNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  const createTestingModule = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiryService,
        {
          provide: getRepositoryToken(ParentInquiry),
          useValue: mockInquiryRepository,
        },
        {
          provide: getRepositoryToken(InquiryReply),
          useValue: mockReplyRepository,
        },
        {
          provide: getRepositoryToken(QuickReplyTemplate),
          useValue: mockTemplateRepository,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    inquiryService = module.get<InquiryService>(InquiryService);
    _notificationService = module.get(NotificationService);
    return module;
  };

  describe('场景1: 查询提交后自动通知校务人员', () => {
    it('应该在创建家长查询后发送通知给校务人员', async () => {
      await createTestingModule();

      const createDto: CreateInquiryDto = {
        category: InquiryCategory.GENERAL,
        parentId: 'parent-001',
        priority: InquiryPriority.NORMAL,
        subject: '询问校车时间表',
        content: '请问校车周一到周五的发车时间是？',
      };

      const savedInquiry: ParentInquiry = {
        id: 'inquiry-001',
        inquiryNo: 'INQ-20260607-QRST',
        parentId: 'parent-001',
        category: InquiryCategory.GENERAL,
        priority: InquiryPriority.NORMAL,
        subject: '询问校车时间表',
        content: '请问校车周一到周五的发车时间是？',
        status: InquiryStatus.PENDING,
        schoolId: 'school-001',
        parentSubmittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockInquiryRepository.create.mockReturnValue(savedInquiry);
      mockInquiryRepository.save.mockResolvedValue(savedInquiry);
      mockInquiryRepository.findOne.mockResolvedValue(savedInquiry);

      const result = await inquiryService.create(
        createDto,
        'parent-001',
        'school-001',
      );

      expect(result).toBeDefined();
      expect(result.inquiryNo).toBe('INQ-20260607-QRST');

      // Assert: Submission notification was sent
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '新家长查询待处理',
          relatedEntityType: 'parent_inquiry',
          relatedEntityId: 'inquiry-001',
          senderId: 'parent-001',
          schoolId: 'school-001',
        }),
      );
    });

    it('应该为高优先级投诉发送高优先级通知', async () => {
      await createTestingModule();

      const createDto: CreateInquiryDto = {
        category: InquiryCategory.COMPLAINT,
        parentId: 'parent-002',
        priority: InquiryPriority.URGENT,
        subject: '投诉校车延误',
        content: '校车经常延误，影响孩子上学',
      };

      const savedInquiry: ParentInquiry = {
        id: 'inquiry-002',
        inquiryNo: 'INQ-20260607-UVWX',
        category: InquiryCategory.COMPLAINT,
        priority: InquiryPriority.URGENT,
        subject: '投诉校车延误',
        content: '校车经常延误，影响孩子上学',
        status: InquiryStatus.PENDING,
        schoolId: 'school-001',
        parentSubmittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockInquiryRepository.create.mockReturnValue(savedInquiry);
      mockInquiryRepository.save.mockResolvedValue(savedInquiry);
      mockInquiryRepository.findOne.mockResolvedValue(savedInquiry);

      await inquiryService.create(createDto, 'parent-002', 'school-001');

      // Assert: High priority notification was sent
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '新家长查询待处理',
          priority: 'high',
          type: 'system',
        }),
      );
    });
  });

  describe('场景2: 回复后自动通知家长', () => {
    it('应该在添加回复后通知家长', async () => {
      await createTestingModule();

      const existingInquiry: ParentInquiry = {
        id: 'inquiry-001',
        inquiryNo: 'INQ-20260607-QRST',
        category: InquiryCategory.GENERAL,
        subject: '询问校车时间表',
        status: InquiryStatus.PENDING,
        schoolId: 'school-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const replyDto: CreateReplyDto = {
        content: '校车每天早上7:30从总站发车，请注意准时到达站点。',
      };

      const savedReply: InquiryReply = {
        id: 'reply-001',
        inquiryId: 'inquiry-001',
        authorId: 'staff-001',
        authorType: ReplyAuthorType.OFFICER,
        content: '校车每天早上7:30从总站发车，请注意准时到达站点。',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockInquiryRepository.findOne.mockResolvedValue(existingInquiry);
      mockReplyRepository.create.mockReturnValue(savedReply);
      mockReplyRepository.save.mockResolvedValue(savedReply);

      const result = await inquiryService.addReply(
        'inquiry-001',
        replyDto,
        'staff-001',
        ReplyAuthorType.OFFICER,
      );

      expect(result).toBeDefined();

      // Assert: Reply notification was sent to parent
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '您的查询已有新回复',
          recipientIds: ['parent-001'],
          type: 'system',
          relatedEntityType: 'parent_inquiry',
          relatedEntityId: 'inquiry-001',
        }),
      );
    });

    it('应该包含回复内容的标题信息', async () => {
      await createTestingModule();

      const existingInquiry: ParentInquiry = {
        id: 'inquiry-003',
        inquiryNo: 'INQ-20260607-ABCD',
        parentId: 'parent-003',
        category: InquiryCategory.BUS_SCHEDULE,
        subject: '校车路线咨询',
        status: InquiryStatus.PENDING,
        schoolId: 'school-001',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      const replyDto: CreateReplyDto = {
        content: '校车路线已更新，请查看最新路线图。',
      };

      const savedReply: InquiryReply = {
        id: 'reply-002',
        inquiryId: 'inquiry-003',
        authorId: 'staff-002',
        authorType: ReplyAuthorType.OFFICER,
        content: '校车路线已更新，请查看最新路线图。',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      mockInquiryRepository.findOne.mockResolvedValue(existingInquiry);
      mockReplyRepository.create.mockReturnValue(savedReply);
      mockReplyRepository.save.mockResolvedValue(savedReply);

      await inquiryService.addReply(
        'inquiry-003',
        replyDto,
        'staff-002',
        ReplyAuthorType.OFFICER,
      );

      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('校车路线咨询'),
        }),
      );
    });
  });
});
