import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { AddressBook } from './address-book.entity';
import { CreateAddressBookDto, UpdateAddressBookDto, AddressBookQueryDto } from './dto/address-book.dto';

@Injectable()
export class AddressBookService {
  constructor(
    @InjectRepository(AddressBook)
    private readonly repo: Repository<AddressBook>,
  ) {}

  async create(dto: CreateAddressBookDto, userId?: string): Promise<AddressBook> {
    const data = { ...dto, createdBy: userId, updatedBy: userId };
    const contact = this.repo.create(data as unknown as Partial<AddressBook>);
    return this.repo.save(contact);
  }

  async findAll(query: AddressBookQueryDto) {
    const { page = 1, pageSize = 20, contactType, department, keyword, isStarred, isActive, schoolId } = query;
    const where: FindOptionsWhere<AddressBook> = {};
    if (contactType) where.contactType = contactType;
    if (department) where.department = department;
    if (isStarred !== undefined) where.isStarred = isStarred;
    if (isActive !== undefined) where.isActive = isActive;
    if (schoolId) where.schoolId = schoolId;
    if (keyword) where.name = Like(`%${keyword}%`);
    const skip = (page - 1) * pageSize;
    const qb = this.repo.createQueryBuilder('ab');
    Object.entries(where).forEach(([key, val]) => {
      qb.andWhere(`ab.${key} = :${key}`, { [key]: val });
    });
    qb.orderBy('ab.is_starred', 'DESC').addOrderBy('ab.name', 'ASC').skip(skip).take(pageSize);
    const [data, total] = await qb.getManyAndCount();
    return { data: data as AddressBook[], total, page, pageSize };
  }

  async findOne(id: string): Promise<AddressBook> {
    const contact = await this.repo.findOne({ where: { id }, relations: ['user'] });
    if (!contact) throw new NotFoundException(`联系人 ID ${id} 不存在`);
    return contact;
  }

  async findByUserId(userId: string): Promise<AddressBook[]> {
    return this.repo.find({ where: { userId, isActive: true }, order: { name: 'ASC' } });
  }

  async findStarred(): Promise<AddressBook[]> {
    return this.repo.find({ where: { isStarred: true, isActive: true }, order: { name: 'ASC' } });
  }

  async update(id: string, dto: UpdateAddressBookDto, userId?: string): Promise<AddressBook> {
    const contact = await this.findOne(id);
    Object.assign(contact, dto);
    if (userId) contact.updatedBy = userId;
    return this.repo.save(contact);
  }

  async toggleStar(id: string): Promise<AddressBook> {
    const contact = await this.findOne(id);
    contact.isStarred = !contact.isStarred;
    return this.repo.save(contact);
  }

  async remove(id: string): Promise<void> {
    const contact = await this.findOne(id);
    await this.repo.remove(contact);
  }

  async getDepartments(schoolId?: string): Promise<string[]> {
    const qb = this.repo.createQueryBuilder('contact');
    qb.where('contact.is_active = :isActive', { isActive: true });
    if (schoolId) qb.andWhere('contact.school_id = :schoolId', { schoolId });
    qb.select('DISTINCT contact.department', 'department');
    const results = await qb.getRawMany();
    return results.map((r: any) => r.department).filter((d: string | null) => d != null);
  }
}