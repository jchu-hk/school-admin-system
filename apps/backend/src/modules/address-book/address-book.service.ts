import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { AddressBook } from './address-book.entity';
import {
  CreateAddressBookDto,
  UpdateAddressBookDto,
  AddressBookQueryDto,
} from './dto/address-book.dto';

@Injectable()
export class AddressBookService {
  constructor(
    @InjectRepository(AddressBook)
    private readonly addressBookRepository: Repository<AddressBook>,
  ) {}

  async create(createDto: CreateAddressBookDto, userId?: string): Promise<AddressBook> {
    const contact = this.addressBookRepository.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    } as any);
    return this.addressBookRepository.save(contact);
  }

  async findAll(query: AddressBookQueryDto) {
    const {
      page = 1,
      pageSize = 20,
      contactType,
      department,
      keyword,
      isStarred,
      isActive,
      schoolId,
    } = query;

    const where: FindOptionsWhere<AddressBook> = {};

    if (contactType) {
      where.contactType = contactType;
    }

    if (department) {
      where.department = department;
    }

    if (isStarred !== undefined) {
      where.isStarred = isStarred;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }

    const skip = (page - 1) * pageSize;
    const rows = await this.addressBookRepository
      .createQueryBuilder('contact')
      .where(where)
      .orderBy('contact.is_starred', 'DESC')
      .addOrderBy('contact.name', 'ASC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return { data: rows[0] as any, total: rows[1], page, pageSize };
  }

  async findOne(id: string): Promise<AddressBook> {
    const contact = await this.addressBookRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!contact) {
      throw new NotFoundException(`联系人 ID ${id} 不存在`);
    }
    return contact;
  }

  async findByUserId(userId: string): Promise<AddressBook[]> {
    return this.addressBookRepository.find({
      where: { userId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findStarred(): Promise<AddressBook[]> {
    return this.addressBookRepository.find({
      where: { isStarred: true, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateDto: UpdateAddressBookDto,
    userId?: string,
  ): Promise<AddressBook> {
    const contact = await this.findOne(id);
    Object.assign(contact, updateDto);
    if (userId) {
      contact.updatedBy = userId;
    }
    return this.addressBookRepository.save(contact);
  }

  async toggleStar(id: string): Promise<AddressBook> {
    const contact = await this.findOne(id);
    contact.isStarred = !contact.isStarred;
    return this.addressBookRepository.save(contact);
  }

  async remove(id: string): Promise<void> {
    const contact = await this.findOne(id);
    await this.addressBookRepository.remove(contact);
  }

  async getDepartments(schoolId?: string): Promise<string[]> {
    const qb = this.addressBookRepository.createQueryBuilder('contact');
    qb.where('contact.is_active = :isActive', { isActive: true });
    if (schoolId) {
      qb.andWhere('contact.school_id = :schoolId', { schoolId });
    }
    qb.select('DISTINCT contact.department', 'department');
    const results = await qb.getRawMany();
    return results
      .map((r: any) => r.department)
      .filter((d: string | null) => d != null);
  }
}
