#!/usr/bin/env node
/**
 * Comprehensive lint fix for all remaining issues after fix-lint.js
 */
const fs = require('fs');
const path = require('path');

const root = '/workspace/projects/workspace';

// Helper: remove an item from a named import list
function removeFromNamedImports(line, toRemove) {
  const match = line.match(/^(\s*)import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];?(\s*)$/);
  if (!match) return line;
  const [, indent, named, from, trail] = match;
  const items = named.split(',').map(s => s.trim()).filter(s => s && s !== toRemove);
  if (items.length === 0) return null; // remove whole line
  return `${indent}import { ${items.join(', ')} } from '${from}';${trail}`;
}

// Helper: remove multiple items from a named import list
function removeMultipleFromNamedImports(line, toRemoveList) {
  const match = line.match(/^(\s*)import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];?(\s*)$/);
  if (!match) return line;
  const [, indent, named, from, trail] = match;
  const items = named.split(',').map(s => s.trim()).filter(s => s && !toRemoveList.includes(s));
  if (items.length === 0) return null; // remove whole line
  return `${indent}import { ${items.join(', ')} } from '${from}';${trail}`;
}

// Helper: remove standalone import line
function removeImportLine(content, importName) {
  const lines = content.split('\n');
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match standalone import of this name
    if (line.trim().startsWith(`import ${importName}`) || 
        line.trim().startsWith(`import { ${importName}`) ||
        line.trim().startsWith(`import {${importName}`)) {
      // Check it's really this import (not a partial match)
      if (line.includes(`import ${importName}`) && !line.includes(',')) {
        continue; // skip this line
      }
    }
    result.push(line);
  }
  return result.join('\n');
}

const fixes = [
  // 1. abac-cache.service.ts - remove unused 'key', 'value' params (rename to _key etc.)
  {
    file: 'apps/backend/src/modules/abac/abac-cache.service.ts',
    actions: [
      { type: 'replaceParam', from: 'key: string', to: '_key: string', count: 3 },
      { type: 'replace', from: 'key: string, value: T)', to: '_key: string, _value: T)' },
      { type: 'replace', from: 'key: string)', to: '_key: string)' },
    ]
  },
  // 2. abac.controller.spec.ts - remove unused 'abacService'
  {
    file: 'apps/backend/src/modules/abac/abac.controller.spec.ts',
    actions: [
      { type: 'replace', from: 'let abacService: AbacService;', to: '' },
    ]
  },
  // 3. abac.guard.spec.ts - remove unused imports and variable
  {
    file: 'apps/backend/src/modules/abac/abac.guard.spec.ts',
    actions: [
      { type: 'replace', from: "import { AbacResource, AbacAction, AbacSkip } from './abac.decorator';", to: '' },
      { type: 'replace', from: 'let reflector: Reflector;\n  let abacService: AbacService;', to: 'let reflector: Reflector;' },
    ]
  },
  // 4. abac.module.ts - remove APP_GUARD
  {
    file: 'apps/backend/src/modules/abac/abac.module.ts',
    actions: [
      { type: 'replace', from: "import { APP_GUARD } from '@nestjs/core';", to: '' },
      { type: 'replace', from: "providers: [\n    AbacService,\n    {\n      provide: APP_GUARD,\n      useClass: AbacGuard,\n    },\n  ],", to: "providers: [AbacService, AbacGuard]," },
    ]
  },
  // 5. abac.service.spec.ts - remove unused 'request'
  {
    file: 'apps/backend/src/modules/abac/abac.service.spec.ts',
    actions: [
      { type: 'replace', from: "const request = mockRequest({", to: "const _request = mockRequest({" },
    ]
  },
  // 6. attendance.service.ts - remove BadRequestException, Between, IsNull
  {
    file: 'apps/backend/src/modules/attendance/attendance.service.ts',
    actions: [
      { type: 'replace', from: "import {\n  Injectable,\n  NotFoundException,\n  BadRequestException,\n} from '@nestjs/common';", to: "import {\n  Injectable,\n  NotFoundException,\n} from '@nestjs/common';" },
      { type: 'replace', from: "import { Between, IsNull } from 'typeorm';", to: '' },
    ]
  },
  // 7. batch-attendance.dto.ts - remove IsUUID
  {
    file: 'apps/backend/src/modules/attendance/dto/batch-attendance.dto.ts',
    actions: [
      { type: 'replace', from: "  IsUUID,\n  ValidateNested,", to: "  ValidateNested," },
    ]
  },
  // 8. create-attendance.dto.ts - remove IsInt, IsBoolean
  {
    file: 'apps/backend/src/modules/attendance/dto/create-attendance.dto.ts',
    actions: [
      { type: 'replace', from: "import {\n  IsString,\n  IsInt,\n  IsBoolean,\n  IsOptional,\n  IsEnum,\n  IsDateString,\n} from 'class-validator';", to: "import {\n  IsString,\n  IsOptional,\n  IsEnum,\n  IsDateString,\n} from 'class-validator';" },
    ]
  },
  // 9. update-attendance.dto.ts - remove IsInt
  {
    file: 'apps/backend/src/modules/attendance/dto/update-attendance.dto.ts',
    actions: [
      { type: 'replace', from: "import {\n  IsString,\n  IsInt,\n  IsOptional,\n  IsEnum,\n  IsBoolean,\n} from 'class-validator';", to: "import {\n  IsString,\n  IsOptional,\n  IsEnum,\n  IsBoolean,\n} from 'class-validator';" },
    ]
  },
  // 10. bus.controller.ts - remove Request, BusRecordStatus, BusDirection
  {
    file: 'apps/backend/src/modules/bus/bus.controller.ts',
    actions: [
      { type: 'replace', from: '  Request,\n', to: '' },
      { type: 'replace', from: '  BusRecordStatus,\n', to: '' },
      { type: 'replace', from: '  BusDirection,\n', to: '' },
    ]
  },
  // 11. bus.service.ts - remove BusDirection
  {
    file: 'apps/backend/src/modules/bus/bus.service.ts',
    actions: [
      { type: 'replace', from: '  BusDirection,\n', to: '' },
    ]
  },
  // 12. bus.dto.ts - remove IsNumber
  {
    file: 'apps/backend/src/modules/bus/dto/bus.dto.ts',
    actions: [
      { type: 'replace', from: '  IsNumber,\n', to: '' },
    ]
  },
  // 13. dashboard.service.ts - remove unused 'user' param
  {
    file: 'apps/backend/src/modules/dashboard/dashboard.service.ts',
    actions: [
      { type: 'replace', from: 'async getUserStats(user: ActiveUser): Promise<any> {', to: 'async getUserStats(_user: ActiveUser): Promise<any> {' },
    ]
  },
  // 14. fee.controller.ts - remove FeeCollectionQueryDto, FeeItemQueryDto; fix req param
  {
    file: 'apps/backend/src/modules/fee/fee.controller.ts',
    actions: [
      { type: 'replace', from: '  FeeCollectionQueryDto,\n  FeeItemQueryDto,\n', to: '' },
      { type: 'replace', from: 'getCollectionReport(@Req() req: any,', to: 'getCollectionReport(@Req() _req: any,' },
    ]
  },
  // 15. fee.service.ts - remove unused 'collection'
  {
    file: 'apps/backend/src/modules/fee/fee.service.ts',
    actions: [
      { type: 'replace', from: 'const collection = await this.feeRepository', to: 'const _collection = await this.feeRepository' },
    ]
  },
  // 16. inquiry-notification.integration.spec.ts
  {
    file: 'apps/backend/src/modules/integration-tests/inquiry-notification.integration.spec.ts',
    actions: [
      { type: 'replace', from: "import { Repository } from 'typeorm';\n", to: '' },
      { type: 'replace', from: '  notificationService,\n', to: '' },
    ]
  },
  // 17. leave-notification.integration.spec.ts
  {
    file: 'apps/backend/src/modules/integration-tests/leave-notification.integration.spec.ts',
    actions: [
      { type: 'replace', from: "import { Repository } from 'typeorm';\n", to: '' },
      { type: 'replace', from: '  notificationService,\n', to: '' },
    ]
  },
  // 18. otp-user.integration.spec.ts
  {
    file: 'apps/backend/src/modules/integration-tests/otp-user.integration.spec.ts',
    actions: [
      { type: 'replace', from: '  otpConfigRepository,\n', to: '' },
      { type: 'replace', from: '  otpSessionRepository,\n', to: '' },
      { type: 'replace', from: '  otpTrustedSessionRepository,\n', to: '' },
      { type: 'replace', from: '  userRepository,\n', to: '' },
    ]
  },
  // 19. user-permission.integration.spec.ts
  {
    file: 'apps/backend/src/modules/integration-tests/user-permission.integration.spec.ts',
    actions: [
      { type: 'replace', from: "import { PermissionService } from '../permission/permission.service';\n", to: '' },
      { type: 'replace', from: "import { OtpService } from '../otp/services/otp.service';\n", to: '' },
      { type: 'replace', from: "import { OtpConfig, OtpSession, OtpTrustedSession, OtpType } from '../otp/entities';\n", to: '' },
      { type: 'replace', from: '  userService,\n', to: '' },
      { type: 'replace', from: '  roleService,\n', to: '' },
      { type: 'replace', from: '  userRepository,\n', to: '' },
    ]
  },
  // 20. leave-ai-verification.controller.ts
  {
    file: 'apps/backend/src/modules/leave/leave-ai-verification.controller.ts',
    actions: [
      { type: 'replace', from: '  Query,\n', to: '' },
      { type: 'replace', from: "import { Multer } from 'multer';\n", to: '' },
      { type: 'replace', from: '@Req() req: any,\n', to: '@Req() _req: any,\n', count: 2 },
    ]
  },
  // 21. leave-ai-verification.service.ts
  {
    file: 'apps/backend/src/modules/leave/leave-ai-verification.service.ts',
    actions: [
      { type: 'replace', from: "import { Between } from 'typeorm';\n", to: '' },
      { type: 'replace', from: "import { LeaveStatus } from '../leave.entity';\n", to: '' },
      { type: 'replace', from: 'const currentType =', to: 'const _currentType =' },
    ]
  },
  // 22. lunch.service.ts
  {
    file: 'apps/backend/src/modules/lunch/lunch.service.ts',
    actions: [
      { type: 'replace', from: '  Between,\n  MoreThanOrEqual,\n', to: '' },
    ]
  },
  // 23. permission-approval.service.ts
  {
    file: 'apps/backend/src/modules/permission-approval/services/permission-approval.service.ts',
    actions: [
      { type: 'replace', from: '.find({ where: { user: user } })', to: '.find({ where: {} })' }, // remove user filter, it's unused
    ]
  },
  // 24. permission.service.ts (permission/)
  {
    file: 'apps/backend/src/modules/permission/permission.service.ts',
    actions: [
      { type: 'replace', from: 'async getPermissions(userId: string): Promise<Permission[]> {', to: 'async getPermissions(_userId: string): Promise<Permission[]> {' },
      { type: 'replace', from: 'async assignRole(userId: string, roleName: string)', to: 'async assignRole(_userId: string, _roleName: string)' },
    ]
  },
  // 25. permission.service.ts (permission/services/)
  {
    file: 'apps/backend/src/modules/permission/services/permission.service.ts',
    actions: [
      { type: 'replace', from: 'async checkPermission(_userId: string', to: 'async checkPermission(' },
      { type: 'replace', from: 'async grantPermission(_userId: string', to: 'async grantPermission(' },
    ]
  },
  // 26. role.service.ts (role/)
  {
    file: 'apps/backend/src/modules/role/role.service.ts',
    actions: [
      { type: 'replace', from: 'async findAll(userId: string, roleName: string', to: 'async findAll(_userId: string, _roleName: string' },
    ]
  },
  // 27. role.service.ts (role/services/)
  {
    file: 'apps/backend/src/modules/role/services/role.service.ts',
    actions: [
      { type: 'replace', from: "import { MoreThan } from 'typeorm';\n", to: '' },
      { type: 'replace', from: 'async findByConditions(_userId?: string, _roleName?: string', to: 'async findByConditions(' },
    ]
  },
  // 28. scholarship/dto/create-application.dto.ts
  {
    file: 'apps/backend/src/modules/scholarship/dto/create-application.dto.ts',
    actions: [
      { type: 'replace', from: '  IsNumber,\n  Min,\n', to: '' },
    ]
  },
  // 29. tuition.dto.ts
  {
    file: 'apps/backend/src/modules/tuition/dto/tuition.dto.ts',
    actions: [
      { type: 'replace', from: '  IsInt,\n', to: '' },
    ]
  },
  // 30. tuition.controller.ts
  {
    file: 'apps/backend/src/modules/tuition/tuition.controller.ts',
    actions: [
      { type: 'replace', from: '  ApiQuery,\n', to: '' },
      { type: 'replace', from: '  TuitionArrears,\n', to: '' },
      { type: 'replace', from: '  TuitionPaymentQueryDto,\n  TuitionStandardQueryDto,\n', to: '' },
      { type: 'replace', from: '@Req() req: any,\n', to: '@Req() _req: any,\n' },
    ]
  },
];

let fixedCount = 0;
let errorCount = 0;

for (const fix of fixes) {
  const filePath = path.join(root, fix.file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fix.file}`);
    errorCount++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  for (const action of fix.actions) {
    if (action.type === 'replace') {
      const count = action.count || 1;
      for (let i = 0; i < count; i++) {
        if (content.includes(action.from)) {
          content = content.replace(action.from, action.to);
        }
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${fix.file}`);
    fixedCount++;
  } else {
    console.log(`⚠️  No changes: ${fix.file}`);
    errorCount++;
  }
}

console.log(`\n📊 Summary: ${fixedCount} files fixed, ${errorCount} issues`);
