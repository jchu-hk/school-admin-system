#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 手动修复剩余的ESLint错误
const manualFixes = {
  'apps/backend/src/modules/attendance/attendance.service.ts': {
    before: /import \{[^}]+\} from ['"]typeorm['"];/,
    after: "import { Repository } from 'typeorm';",
  },
  'apps/backend/src/modules/attendance/attendance.service.ts': {
    before: /import \{\s*Injectable,\s*BadRequestException,\s*NotFoundException\s*\} from ['"]@nestjs\/common['"];/,
    after: "import { Injectable, NotFoundException } from '@nestjs/common';",
  },
  'apps/backend/src/modules/attendance/dto/batch-attendance.dto.ts': {
    before: /IsUUID,\s*/,
    after: '',
  },
  'apps/backend/src/modules/attendance/dto/create-attendance.dto.ts': {
    before: /IsInt,\s*IsBoolean,\s*/,
    after: '',
  },
  'apps/backend/src/modules/attendance/dto/update-attendance.dto.ts': {
    before: /IsInt,\s*/,
    after: '',
  },
  'apps/backend/src/modules/bus/bus.controller.ts': {
    before: /Request,\s*/,
    after: '',
  },
  'apps/backend/src/modules/bus/bus.controller.ts': {
    before: /BusRecordStatus,\s*/,
    after: '',
  },
  'apps/backend/src/modules/bus/bus.service.ts': {
    before: /BusDirection,\s*/,
    after: '',
  },
  'apps/backend/src/modules/bus/dto/bus.dto.ts': {
    before: /IsNumber,\s*/,
    after: '',
  },
  'apps/backend/src/modules/dashboard/dashboard.service.ts': {
    line: 382,
    before: /\s+const user =/,
    after: '  const',
  },
  'apps/backend/src/modules/fee/fee.controller.ts': {
    before: /FeeCollectionQueryDto,\s*FeeItemQueryDto,\s*/,
    after: '',
  },
  'apps/backend/src/modules/fee/fee.service.ts': {
    line: 262,
    before: /\bconst collection =/,
    after: '  const',
  },
  'apps/backend/src/modules/inquiry/inquiry.controller.ts': {
    before: /InquiryQueryDto,\s*/,
    after: '',
  },
  'apps/backend/src/modules/leave/leave-ai-verification.controller.ts': {
    before: /Query,\s*multer,\s*/,
    after: '',
  },
  'apps/backend/src/modules/leave/leave-ai-verification.service.ts': {
    before: /Between,\s*/,
    after: '',
  },
  'apps/backend/src/modules/leave/leave-ai-verification.service.ts': {
    line: 354,
    before: /\s+const currentType =/,
    after: '  const',
  },
  'apps/backend/src/modules/leave/leave.service.ts': {
    line: 69,
    before: /createLeaveDto,\s*/,
    after: '',
  },
  'apps/backend/src/modules/leave/leave.service.ts': {
    line: 101,
    before: /id,\s*/,
    after: '',
  },
  'apps/backend/src/modules/lunch/lunch.service.ts': {
    before: /Between,\s*MoreThanOrEqual,\s*/,
    after: '',
  },
  'apps/backend/src/modules/permission/permission.service.ts': {
    line: 42,
    before: /userId:\s*string,\s*/,
    after: '',
  },
  'apps/backend/src/modules/role/role.service.ts': {
    line: 45,
    before: /userId: string,/,
    after: '',
  },
  'apps/backend/src/modules/role/role.service.ts': {
    line: 45,
    before: /roleName: string,/,
    after: '',
  },
  'apps/backend/src/modules/scholarship/dto/create-application.dto.ts': {
    before: /IsNumber,\s*Min,\s*/,
    after: '',
  },
  'apps/backend/src/modules/tuition/tuition.controller.ts': {
    before: /ApiQuery,\s*/,
    after: '',
  },
  'apps/backend/src/modules/tuition/tuition.controller.ts': {
    before: /TuitionPaymentQueryDto,\s*TuitionStandardQueryDto,\s*/,
    after: '',
  },
  'apps/backend/src/modules/tuition/tuition.controller.ts': {
    line: 180,
    before: /req,/,
    after: '',
  },
  'apps/backend/src/modules/leave/leave-ai-verification.controller.ts': {
    line: 65,
    before: /req,/,
    after: '',
  },
  'apps/backend/src/modules/leave/leave-ai-verification.controller.ts': {
    line: 133,
    before: /req,/,
    after: '',
  },
  'apps/backend/src/modules/fee/fee.controller.ts': {
    line: 173,
    before: /req,/,
    after: '',
  },
  'apps/backend/src/modules/abac/abac-cache.service.ts': {
    line: 237,
    before: /key,/,
    after: '',
  },
  'apps/backend/src/modules/abac/abac-cache.service.ts': {
    line: 248,
    before: /key,/,
    after: '',
  },
  'apps/backend/src/modules/abac/abac-cache.service.ts': {
    line: 248,
    before: /value,/,
    after: '',
  },
  'apps/backend/src/modules/abac/abac-cache.service.ts': {
    line: 261,
    before: /key,/,
    after: '',
  },
  'apps/backend/src/modules/abac/abac.module.ts': {
    before: /APP_GUARD,\s*AbacGuard,\s*/,
    after: '',
  },
};

function applyFixes(filePath, fixes) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const [i, fix] of fixes.entries()) {
    if (fix.line) {
      // 行级别修复
      const lines = content.split('\n');
      if (fix.line <= lines.length) {
        const originalLine = lines[fix.line - 1];
        lines[fix.line - 1] = lines[fix.line - 1].replace(fix.before, fix.after);
        if (originalLine !== lines[fix.line - 1]) {
          changed = true;
          console.log(`  Line ${fix.line}: "${originalLine}" -> "${lines[fix.line - 1]}"`);
        }
      }
      content = lines.join('\n');
    } else if (fix.before && fix.after) {
      // 模式修复
      const newContent = content.replace(fix.before, fix.after);
      if (newContent !== content) {
        changed = true;
        console.log(`  Applied pattern fix: ${fix.before} -> ${fix.after}`);
      }
      content = newContent;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
  }
}

// 按文件分组修复
const fixGroups = {};
for (const [key, fix] of Object.entries(manualFixes)) {
  if (!fixGroups[key]) {
    fixGroups[key] = [];
  }
  fixGroups[key].push(fix);
}

console.log('🔧 Applying manual fixes...\n');
for (const [filePath, fixes] of Object.entries(fixGroups)) {
  const fullPath = path.join('/workspace/projects/workspace', filePath);
  console.log(`\n📝 ${filePath}:`);
  applyFixes(fullPath, fixes);
}

console.log('\n✨ All manual fixes applied!');