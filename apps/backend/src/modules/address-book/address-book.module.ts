import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressBook } from './address-book.entity';
import { AddressBookController } from './address-book.controller';
import { AddressBookService } from './address-book.service';

@Module({
  imports: [TypeOrmModule.forFeature([AddressBook])],
  controllers: [AddressBookController],
  providers: [AddressBookService],
  exports: [AddressBookService],
})
export class AddressBookModule {}
