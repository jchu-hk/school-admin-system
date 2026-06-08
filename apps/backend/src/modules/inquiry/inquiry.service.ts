import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      .leftJoinAndSelect('inquiry.parent', 'parent')
      .leftJoinAndSelect('inquiry.assignee', 'assignee')
      .where('inquiry.deletedAt IS NULL');

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
      where: { id, deletedAt: null },
      relations: ['parent', 'assignee', 'closer'],
    });

    if (!inquiry) {
      throw new NotFoundException('查询不存在');
    }

    return inquiry;
  }

  async findOneWithReplies(id: string): Promise<{ inquiry: Inquiry; replies: InquiryReply[] }> {
    const inquiry = await this.findOne(id);
    
    const replies = await this.replyRepository.find({
      where: { inquiryId: id, deletedAt: null },
      relations: ['replier'],
      order: { createdAt: 'ASC' },
    });

    return { inquiry, replies };
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

    // 如果分配了处理人，更新状态为处理中
    if (updateDto.assignedTo && inquiry.status === InquiryStatus.PENDING) {
      updateDto.status = InquiryStatus.PROCESSING;
    }

    // 如果状态变为已关闭，设置关闭时间和关闭人
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

  async findReplies(inquiryId: string): Promise<InquiryReply[]> {
    return this.replyRepository.find({
      where: { inquiryId, deletedAt: null },
      relations: ['replier'],
      order: { createdAt: 'ASC' },
    });
  }

  async createReply(createDto: CreateInquiryReplyDto, replierId: string): Promise<InquiryReply> {
    const inquiry = await this.findOne(createDto.inquiryId);

    if (inquiry.status === InquiryStatus.CLOSED) {
      throw new BadRequestException('该查询已关闭，无法回复');
    }

    // 更新查询状态为处理中
    if (inquiry.status === InquiryStatus.PENDING) {
      await this.inquiryRepository.update(createDto.inquiryId, {
        status: InquiryStatus.PROCESSING,
        assignedTo: replierId,
      });
    }

    const reply = this.replyRepository.create({
      inquiryId: createDto.inquiryId,
      replierId,
      content: createDto.content,
    });

    return this.replyRepository.save(reply);
  }

  async close(inquiryId: string, closedBy: string): Promise<Inquiry> {
    const inquiry = await this.findOne(inquiryId);

    if (inquiry.status === InquiryStatus.CLOSED) {
      throw new BadRequestException('该查询已经是关闭状态');
    }

    await this.inquiryRepository.update(inquiryId, {
      status: InquiryStatus.CLOSED,
      closedBy,
      closedAt: new Date(),
    });

    return this.findOne(inquiryId);
  }

  async addRating(
    inquiryId: string,
    parentId: string,
    rating: number,
    comment?: string,
  ): Promise<Inquiry> {
    const inquiry = await this.findOne(inquiryId);

    if (inquiry.parentId !== parentId) {
      throw new BadRequestException('只有查询提交者可以评价');
    }

    if (inquiry.status !== InquiryStatus.CLOSED) {
      throw new BadRequestException('查询未关闭，无法评价');
    }

    if (inquiry.rating !== null && inquiry.rating !== undefined) {
      throw new BadRequestException('已经评价过了');
    }

    await this.inquiryRepository.update(inquiryId, {
      rating,
      ratingComment: comment,
    });

    return this.findOne(inquiryId);
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    closed: number;
    averageRating: number;
  }> {
    const total = await this.inquiryRepository.count({ where: { deletedAt: null } });
    const pending = await this.inquiryRepository.count({ 
      where: { status: InquiryStatus.PENDING, deletedAt: null } 
    });
    const processing = await this.inquiryRepository.count({ 
      where: { status: InquiryStatus.PROCESSING, deletedAt: null } 
    });
    const closed = await this.inquiryRepository.count({ 
      where: { status: InquiryStatus.CLOSED, deletedAt: null } 
    });

    const ratingResult = await this.inquiryRepository
      .createQueryBuilder('inquiry')
      .select('AVG(inquiry.rating)', 'averageRating')
      .where('inquiry.rating IS NOT NULL')
      .andWhere('inquiry.deletedAt IS NULL')
      .getRawOne();

    return {
      total,
      pending,
      processing,
      closed,
      averageRating: ratingResult?.averageRating ? parseFloat(ratingResult.averageRating) : 0,
    };
  }
}
