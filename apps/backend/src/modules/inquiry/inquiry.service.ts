import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry, InquiryReply, InquiryStatus } from './inquiry.entity';
import { CreateInquiryDto, UpdateInquiryDto, CreateInquiryReplyDto } from './dto/inquiry.dto';

@Injectable()
export class InquiryService {
  constructor(
    @InjectRepository(Inquiry)
    private inquiryRepository: Repository<Inquiry>,
    @InjectRepository(InquiryReply)
    private replyRepository: Repository<InquiryReply>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: InquiryStatus,
    inquiryType?: string,
    parentId?: string,
  ): Promise<{ inquiries: Inquiry[]; total: number }> {
    const queryBuilder = this.inquiryRepository.createQueryBuilder('inquiry')
      .leftJoinAndSelect('inquiry.replies', 'replies')
      .leftJoinAndSelect('inquiry.parent', 'parent')
      .leftJoinAndSelect('inquiry.assignee', 'assignee');

    if (status) {
      queryBuilder.andWhere('inquiry.status = :status', { status });
    }

    if (inquiryType) {
      queryBuilder.andWhere('inquiry.inquiryType = :inquiryType', { inquiryType });
    }

    if (parentId) {
      queryBuilder.andWhere('inquiry.parentId = :parentId', { parentId });
    }

    const [inquiries, total] = await queryBuilder
      .orderBy('inquiry.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { inquiries, total };
  }

  async findOne(id: string): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: ['replies', 'parent', 'assignee', 'closer'],
    });

    if (!inquiry) {
      throw new NotFoundException(`咨询不存在: ${id}`);
    }

    return inquiry;
  }

  async create(createDto: CreateInquiryDto): Promise<Inquiry> {
    const inquiry = this.inquiryRepository.create({
      ...createDto,
      status: InquiryStatus.PENDING,
    });

    return this.inquiryRepository.save(inquiry);
  }

  async update(id: string, updateDto: UpdateInquiryDto, updatedBy?: string): Promise<Inquiry> {
    const inquiry = await this.findOne(id);

    // If status is being changed to closed, set closedAt and closedBy
    if (updateDto.status === InquiryStatus.CLOSED && inquiry.status !== InquiryStatus.CLOSED) {
      inquiry.closedAt = new Date();
      inquiry.closedBy = updatedBy;
    }

    Object.assign(inquiry, updateDto);
    return this.inquiryRepository.save(inquiry);
  }

  async remove(id: string): Promise<void> {
    const inquiry = await this.findOne(id);
    await this.inquiryRepository.softRemove(inquiry);
  }

  // Reply methods
  async findReplies(inquiryId: string): Promise<InquiryReply[]> {
    return this.replyRepository.find({
      where: { inquiryId },
      relations: ['replier'],
      order: { createdAt: 'ASC' },
    });
  }

  async createReply(createDto: CreateInquiryReplyDto, replierId: string): Promise<InquiryReply> {
    const inquiry = await this.findOne(createDto.inquiryId);

    // Update inquiry status to processing if it's pending
    if (inquiry.status === InquiryStatus.PENDING) {
      inquiry.status = InquiryStatus.PROCESSING;
      await this.inquiryRepository.save(inquiry);
    }

    const reply = this.replyRepository.create({
      ...createDto,
      replierId,
    });

    return this.replyRepository.save(reply);
  }
}
