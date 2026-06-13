#!/usr/bin/env node
/**
 * Final lint fix - handle remaining 49 errors
 */
const fs = require('fs');

const fixes = [
  // abac-cache.service.ts - rename unused params
  {
    file: 'apps/backend/src/modules/abac/abac-cache.service.ts',
    fixes: [
      // getFromRedis(key: string)
      { replace: 'private async getFromRedis(_key: string):', with: 'private async getFromRedis(_key: string):' },
      // setToRedis(key: string, value: T)
      { replace: 'private async setToRedis(_key: string, _value: T):', with: 'private async setToRedis(_key: string, _value: T):' },
      // delFromRedis(key: string)
      { replace: 'private async delFromRedis(_key: string):', with: 'private async delFromRedis(_key: string):' },
    ]
  },
  // abac.controller.spec.ts - remove abacService
  {
    file: 'apps/backend/src/modules/abac/abac.controller.spec.ts',
    fixes: [
      { replace: '  let abacService: AbacService;\n', with: '' },
    ]
  },
  // abac.guard.spec.ts - remove AbacResource, AbacAction, AbacSkip from import; remove abacService
  {
    file: 'apps/backend/src/modules/abac/abac.guard.spec.ts',
    fixes: [
      { replace: "import { AbacGuard, AbacResource, AbacAction, AbacSkip }", with: "import { AbacGuard }" },
      { replace: 'let reflector: Reflector;\n  let abacService: AbacService;', with: 'let reflector: Reflector;' },
    ]
  },
  // abac.service.spec.ts - rename 'request' to '_request'
  {
    file: 'apps/backend/src/modules/abac/abac.service.spec.ts',
    fixes: [
      { replace: "const request = mockRequest({", with: "const _request = mockRequest({" },
    ]
  },
  // attendance.service.ts - remove BadRequestException, Between
  {
    file: 'apps/backend/src/modules/attendance/attendance.service.ts',
    fixes: [
      { replace: "  BadRequestException,\n", with: '' },
      { replace: "import { Repository, Between }", with: "import { Repository }" },
    ]
  },
  // batch-attendance.dto.ts - remove IsUUID
  {
    file: 'apps/backend/src/modules/attendance/dto/batch-attendance.dto.ts',
    fixes: [
      { replace: "  IsUUID,\n", with: '' },
    ]
  },
  // create-attendance.dto.ts - remove IsInt, IsBoolean
  {
    file: 'apps/backend/src/modules/attendance/dto/create-attendance.dto.ts',
    fixes: [
      { replace: "  IsInt,\n", with: '' },
      { replace: "  IsBoolean,\n", with: '' },
    ]
  },
  // update-attendance.dto.ts - remove IsInt
  {
    file: 'apps/backend/src/modules/attendance/dto/update-attendance.dto.ts',
    fixes: [
      { replace: "  IsInt,\n", with: '' },
    ]
  },
  // dashboard.service.ts - rename user param
  {
    file: 'apps/backend/src/modules/dashboard/dashboard.service.ts',
    fixes: [
      { replace: 'async getDailyAttendanceStats(\n    startDate: Date,\n    endDate: Date,\n    user: User,', with: 'async getDailyAttendanceStats(\n    startDate: Date,\n    endDate: Date,\n    _user: User,' },
    ]
  },
  // fee.controller.ts - rename req param
  {
    file: 'apps/backend/src/modules/fee/fee.controller.ts',
    fixes: [
      { replace: 'createCollection(@Body() dto: CreateFeeCollectionDto, @Request() req)', with: 'createCollection(@Body() dto: CreateFeeCollectionDto, @Request() _req)' },
    ]
  },
  // fee.service.ts - rename collection
  {
    file: 'apps/backend/src/modules/fee/fee.service.ts',
    fixes: [
      { replace: "const collection = await this.findCollectionById(dto.feeCollectionId);", with: "const _collection = await this.findCollectionById(dto.feeCollectionId);" },
    ]
  },
  // inquiry-notification.integration.spec.ts - remove Repository, notificationService
  {
    file: 'apps/backend/src/modules/integration-tests/inquiry-notification.integration.spec.ts',
    fixes: [
      { replace: "import { Repository } from 'typeorm';\n", with: '' },
      { replace: "  notificationService,\n", with: '' },
    ]
  },
  // leave-notification.integration.spec.ts - remove Repository, notificationService
  {
    file: 'apps/backend/src/modules/integration-tests/leave-notification.integration.spec.ts',
    fixes: [
      { replace: "import { Repository } from 'typeorm';\n", with: '' },
      { replace: "  notificationService,\n", with: '' },
    ]
  },
  // otp-user.integration.spec.ts - remove unused services
  {
    file: 'apps/backend/src/modules/integration-tests/otp-user.integration.spec.ts',
    fixes: [
      { replace: "  otpConfigRepository,\n", with: '' },
      { replace: "  otpSessionRepository,\n", with: '' },
      { replace: "  otpTrustedSessionRepository,\n", with: '' },
      { replace: "  userRepository,\n", with: '' },
    ]
  },
  // user-permission.integration.spec.ts
  {
    file: 'apps/backend/src/modules/integration-tests/user-permission.integration.spec.ts',
    fixes: [
      { replace: "import { PermissionService } from '../permission/permission.service';\n", with: '' },
      { replace: "import { OtpService } from '../otp/services/otp.service';\n", with: '' },
      { replace: "import { OtpConfig, OtpSession, OtpTrustedSession, OtpType } from '../otp/entities';\n", with: '' },
      { replace: "  userService,\n", with: '' },
      { replace: "  roleService,\n", with: '' },
      { replace: "  userRepository,\n", with: '' },
    ]
  },
  // leave-ai-verification.controller.ts - remove multer, req params
  {
    file: 'apps/backend/src/modules/leave/leave-ai-verification.controller.ts',
    fixes: [
      { replace: "import { Multer } from 'multer';\n", with: '' },
      { replace: '@Req() req: any,\n', with: '@Req() _req: any,\n' },
    ]
  },
  // leave-ai-verification.service.ts - remove Between, LeaveStatus, rename currentType
  {
    file: 'apps/backend/src/modules/leave/leave-ai-verification.service.ts',
    fixes: [
      { replace: "import { Between } from 'typeorm';\n", with: '' },
      { replace: "import { LeaveStatus } from '../leave.entity';\n", with: '' },
      { replace: "const currentType =", with: "const _currentType =" },
    ]
  },
  // lunch.service.ts - remove Between, MoreThanOrEqual
  {
    file: 'apps/backend/src/modules/lunch/lunch.service.ts',
    fixes: [
      { replace: "  Between,\n  MoreThanOrEqual,\n", with: '' },
    ]
  },
  // permission-approval.service.ts - rename user param
  {
    file: 'apps/backend/src/modules/permission-approval/services/permission-approval.service.ts',
    fixes: [
      { replace: "async getMyPendingApprovals(user: User) {", with: "async getMyPendingApprovals(_user: User) {" },
      { replace: "async isUserApproverForRequest(\n    request: PermissionApprovalRequest,\n    user: User,\n  ):", with: "async isUserApproverForRequest(\n    request: PermissionApprovalRequest,\n    _user: User,\n  ):" },
    ]
  },
  // role/role.service.ts - rename userId, roleName
  {
    file: 'apps/backend/src/modules/role/role.service.ts',
    fixes: [
      { replace: "async findAll(userId: string, roleName: string", with: "async findAll(_userId: string, _roleName: string" },
    ]
  },
  // role/services/role.service.ts - remove MoreThan, rename _userId, _roleName
  {
    file: 'apps/backend/src/modules/role/services/role.service.ts',
    fixes: [
      { replace: "import { Repository, MoreThan }", with: "import { Repository }" },
      { replace: "async userHasRole(_userId: string, _roleName: string)", with: "async userHasRole(" },
    ]
  },
  // settings/dto/settings.dto.ts - remove IsArray
  {
    file: 'apps/backend/src/modules/settings/dto/settings.dto.ts',
    fixes: [
      { replace: "  IsArray,\n", with: '' },
    ]
  },
  // settings/settings.service.ts - remove SystemLogLevel
  {
    file: 'apps/backend/src/modules/settings/settings.service.ts',
    fixes: [
      { replace: "  SystemLogLevel,\n", with: '' },
    ]
  },
  // tuition.controller.ts - rename req param
  {
    file: 'apps/backend/src/modules/tuition/tuition.controller.ts',
    fixes: [
      { replace: '@Req() req: any,\n', with: '@Req() _req: any,\n' },
    ]
  },
];

const root = '/workspace/projects/workspace';

for (const fixSpec of fixes) {
  const filePath = root + '/' + fixSpec.file;
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Not found: ${fixSpec.file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  for (const fix of fixSpec.fixes) {
    if (content.includes(fix.replace)) {
      content = content.replace(fix.replace, fix.with);
    } else {
      console.log(`⚠️  Pattern not found in ${fixSpec.file}: ${fix.replace.substring(0, 60)}`);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${fixSpec.file}`);
  } else {
    console.log(`⚠️  No changes: ${fixSpec.file}`);
  }
}

console.log('\nDone!');
