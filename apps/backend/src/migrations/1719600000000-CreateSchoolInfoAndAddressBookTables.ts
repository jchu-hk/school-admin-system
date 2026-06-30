import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSchoolInfoAndAddressBookTables1719600000000 implements MigrationInterface {
  name = 'CreateSchoolInfoAndAddressBookTables1719600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create school_info table
    await queryRunner.createTable(
      new Table({
        name: 'school_info',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'name_en',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'fax',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'website',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'school_type',
            type: 'enum',
            enum: ['primary', 'secondary', 'kindergarten', 'international'],
            default: "'primary'",
          },
          {
            name: 'school_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'license_no',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'established_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'principal_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'vice_principal_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'mission',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'photo_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'remarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add index for school_code
    await queryRunner.createIndex(
      'school_info',
      new TableIndex({
        name: 'IDX_school_info_code',
        columnNames: ['school_code'],
      }),
    );

    // Create address_book table
    await queryRunner.createTable(
      new Table({
        name: 'address_book',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'contact_type',
            type: 'enum',
            enum: ['teacher', 'staff', 'parent', 'student', 'other'],
            default: "'other'",
          },
          {
            name: 'department',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'mobile',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'whatsapp',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'home_address',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'emergency_contact_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'emergency_contact_phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'emergency_contact_relation',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'remarks',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_starred',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'school_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add indexes for address_book
    await queryRunner.createIndex(
      'address_book',
      new TableIndex({
        name: 'IDX_address_book_contact_type',
        columnNames: ['contact_type'],
      }),
    );

    await queryRunner.createIndex(
      'address_book',
      new TableIndex({
        name: 'IDX_address_book_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'address_book',
      new TableIndex({
        name: 'IDX_address_book_school_id',
        columnNames: ['school_id'],
      }),
    );

    // Add foreign key for user_id
    await queryRunner.query(`
      ALTER TABLE "address_book" 
      ADD CONSTRAINT "FK_address_book_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE "address_book" DROP CONSTRAINT "FK_address_book_user"
    `);

    // Drop indexes
    await queryRunner.dropIndex(
      'address_book',
      'IDX_address_book_contact_type',
    );
    await queryRunner.dropIndex('address_book', 'IDX_address_book_user_id');
    await queryRunner.dropIndex('address_book', 'IDX_address_book_school_id');
    await queryRunner.dropIndex('school_info', 'IDX_school_info_code');

    // Drop tables
    await queryRunner.dropTable('address_book');
    await queryRunner.dropTable('school_info');
  }
}
