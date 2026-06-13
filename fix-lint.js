#!/usr/bin/env node
/**
 * 自动修复 backend 中未使用的 import 和变量
 */
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'apps/backend/src/modules/attendance/attendance.service.ts',
  'apps/backend/src/modules/attendance/dto/batch-attendance.dto.ts',
  'apps/backend/src/modules/attendance/dto/create-attendance.dto.ts',
  'apps/backend/src/modules/attendance/dto/update-attendance.dto.ts',
  'apps/backend/src/modules/auth/dto/verify-otp.dto.ts',
  'apps/backend/src/modules/bus/bus.controller.ts',
  'apps/backend/src/modules/bus/bus.service.ts',
  'apps/backend/src/modules/bus/dto/bus.dto.ts',
  'apps/backend/src/modules/dashboard/dashboard.service.ts',
  'apps/backend/src/modules/fee/fee.controller.ts',
  'apps/backend/src/modules/fee/fee.service.ts',
  'apps/backend/src/modules/inquiry/inquiry-escalation.service.ts',
  'apps/backend/src/modules/inquiry/inquiry.controller.ts',
  'apps/backend/src/modules/inquiry/inquiry.service.ts',
  'apps/backend/src/modules/leave/dto/approve-leave.dto.ts',
  'apps/backend/src/modules/leave/leave-ai-verification.controller.ts',
  'apps/backend/src/modules/leave/leave-ai-verification.service.ts',
  'apps/backend/src/modules/leave/leave.service.ts',
  'apps/backend/src/modules/lunch/lunch.controller.ts',
  'apps/backend/src/modules/lunch/lunch.service.ts',
  'apps/backend/src/modules/otp/services/otp.service.ts',
  'apps/backend/src/modules/permission-approval/services/permission-approval.service.ts',
  'apps/backend/src/modules/permission/permission.service.ts',
  'apps/backend/src/modules/role/role.service.ts',
  'apps/backend/src/modules/scholarship/dto/create-application.dto.ts',
  'apps/backend/src/modules/tuition/dto/tuition.dto.ts',
  'apps/backend/src/modules/tuition/tuition.controller.ts',
];

// 定义需要删除的未使用的import规则
const fixes = {
  'apps/backend/src/modules/attendance/attendance.service.ts': {
    removeImports: ['BadRequestException', 'Between', 'IsNull'],
  },
  'apps/backend/src/modules/attendance/dto/batch-attendance.dto.ts': {
    removeImports: ['IsUUID'],
  },
  'apps/backend/src/modules/attendance/dto/create-attendance.dto.ts': {
    removeImports: ['IsInt', 'IsBoolean'],
  },
  'apps/backend/src/modules/attendance/dto/update-attendance.dto.ts': {
    removeImports: ['IsInt'],
  },
  'apps/backend/src/modules/auth/dto/verify-otp.dto.ts': {
    removeImports: ['IsUUID'],
  },
  'apps/backend/src/modules/bus/bus.controller.ts': {
    removeImports: ['Request', 'BusRecordStatus', 'BusDirection'],
  },
  'apps/backend/src/modules/bus/bus.service.ts': {
    removeImports: ['BusDirection'],
  },
  'apps/backend/src/modules/bus/dto/bus.dto.ts': {
    removeImports: ['IsNumber'],
  },
  'apps/backend/src/modules/inquiry/inquiry-escalation.service.ts': {
    removeImports: ['NotificationType'],
  },
  'apps/backend/src/modules/inquiry/inquiry.controller.ts': {
    removeImports: ['InquiryQueryDto'],
  },
  'apps/backend/src/modules/inquiry/inquiry.service.ts': {
    removeImports: ['IntentType'],
  },
  'apps/backend/src/modules/leave/dto/approve-leave.dto.ts': {
    removeImports: ['LeaveStatus'],
  },
  'apps/backend/src/modules/leave/leave-ai-verification.controller.ts': {
    removeImports: ['Query', 'multer'],
    removeParams: ['req'],
  },
  'apps/backend/src/modules/leave/leave-ai-verification.service.ts': {
    removeImports: ['Between', 'LessThanOrEqual', 'LeaveStatus'],
    removeVars: ['currentType', 'totalChecks'],
  },
  'apps/backend/src/modules/leave/leave.service.ts': {
    removeImports: ['Between'],
    removeVars: ['leave'],
  },
  'apps/backend/src/modules/lunch/lunch.controller.ts': {
    removeImports: ['LunchOrderStatus'],
  },
  'apps/backend/src/modules/lunch/lunch.service.ts': {
    removeImports: ['Between', 'MoreThanOrEqual', 'LessThanOrEqual'],
  },
  'apps/backend/src/modules/otp/services/otp.service.ts': {
    removeImports: ['LessThan'],
  },
  'apps/backend/src/modules/permission-approval/services/permission-approval.service.ts': {
    removeVars: ['userRoles'],
  },
  'apps/backend/src/modules/permission/permission.service.ts': {
    removeParams: ['userId'],
  },
  'apps/backend/src/modules/role/role.service.ts': {
    removeParams: ['userId', 'roleName'],
  },
  'apps/backend/src/modules/scholarship/dto/create-application.dto.ts': {
    removeImports: ['IsNumber', 'Min'],
  },
  'apps/backend/src/modules/tuition/dto/tuition.dto.ts': {
    removeImports: ['IsInt'],
  },
  'apps/backend/src/modules/tuition/tuition.controller.ts': {
    removeImports: ['ApiQuery', 'TuitionArrears', 'TuitionPaymentQueryDto', 'TuitionStandardQueryDto'],
    removeParams: ['req'],
  },
};

// 需要手动修复的复杂情况（由于需要修改函数签名和逻辑）
const manualFixes = [
  'apps/backend/src/modules/dashboard/dashboard.service.ts',
  'apps/backend/src/modules/fee/fee.controller.ts',
  'apps/backend/src/modules/fee/fee.service.ts',
];

function removeUnusedImports(content, importsToRemove) {
  if (!importsToRemove || importsToRemove.length === 0) return content;

  let lines = content.split('\n');
  const importMap = {};

  // 找到所有的import行
  lines.forEach((line, index) => {
    const importMatch = line.match(/import\s+(?:{([^}]+)}|[^{}]+?)\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const namedImports = importMatch[1];
      const fromModule = importMatch[2];
      importMap[fromModule] = { line: index, namedImports, raw: line };
    }
  });

  // 删除未使用的import
  importsToRemove.forEach(imp => {
    for (const [module, info] of Object.entries(importMap)) {
      if (info.namedImports && info.namedImports.includes(imp)) {
        const parts = info.namedImports.split(',').map(p => p.trim()).filter(p => p && p !== imp);
        if (parts.length === 0) {
          // 如果整个import都为空，删除这行
          lines[info.line] = null;
        } else {
          // 否则更新这行
          lines[info.line] = info.raw.replace(info.namedImports, parts.join(', '));
        }
        break;
      }
    }
  });

  return lines.filter(line => line !== null).join('\n');
}

function removeUnusedVariables(content, varsToRemove) {
  if (!varsToRemove || varsToRemove.length === 0) return content;

  let result = content;

  varsToRemove.forEach(v => {
    // 删除 const unusedVar = ...; 模式
    result = result.replace(new RegExp(`\\bconst\\s+${v}\\s*=\\s*[^;]+;\\s*\\n`, 'g'), '');
    // 删除 let unusedVar = ...; 模式
    result = result.replace(new RegExp(`\\blet\\s+${v}\\s*=\\s*[^;]+;\\s*\\n`, 'g'), '');
  });

  return result;
}

function removeUnusedParams(content, paramsToRemove) {
  if (!paramsToRemove || paramsToRemove.length === 0) return content;

  let result = content;

  paramsToRemove.forEach(param => {
    // 匹配函数参数并移除
    result = result.replace(
      new RegExp(`([\\w\\s,]+)(?:,\\s*)?${param}\\s*:\\s*[^,)]+(?:,\\s*)?`, 'g'),
      (match, before) => {
        // 确保这确实是函数参数的一部分
        if (match.match(/\b(?:function|=>|\([^)]*\))/)) {
          // 移除参数，保持语法正确
          return before.replace(/,\s*$/, '');
        }
        return match;
      }
    );
  });

  return result;
}

function fixFile(filePath, fixSpec) {
  console.log(`\n🔧 Fixing ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf-8');

  // 移除未使用的imports
  if (fixSpec.removeImports) {
    content = removeUnusedImports(content, fixSpec.removeImports);
  }

  // 移除未使用的变量
  if (fixSpec.removeVars) {
    content = removeUnusedVariables(content, fixSpec.removeVars);
  }

  // 移除未使用的参数（需要更复杂的处理）
  if (fixSpec.removeParams) {
    console.log(`   ⚠️  Manual fix needed for params: ${fixSpec.removeParams.join(', ')}`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`   ✅ Fixed`);
}

// 自动修复简单文件
Object.entries(fixes).forEach(([file, spec]) => {
  const fullPath = path.join('/workspace/projects/workspace', file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath, spec);
  }
});

console.log('\n📝 Manual fixes needed for:');
manualFixes.forEach(file => {
  console.log(`   - ${file}`);
});
console.log('\n✨ Auto-fix complete!');