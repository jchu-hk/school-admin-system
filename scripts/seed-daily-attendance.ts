/**
 * 每日出勤测试数据生成脚本 (TypeScript/Node.js 版本)
 * 
 * 用法:
 *   npx ts-node scripts/seed-daily-attendance.ts
 *   或者编译后: node dist/scripts/seed-daily-attendance.js
 * 
 * 集成到 package.json:
 *   npm run seed:daily
 */

import { Client } from 'pg';

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'school_admin',
  user: process.env.DB_USER || 'school_admin',
  password: process.env.DB_PASSWORD || 'school_admin123',
};

// 颜色输出
const colors = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[1;33m',
  BLUE: '\x1b[0;34m',
  NC: '\x1b[0m',
};

// 班级和学生映射
const CLASS_STUDENTS = [
  {
    className: '1A班',
    classId: '11111111-1111-1111-1111-111111111111',
    students: [
      '29e999e3-7844-46eb-a249-44a18a6f982d', // 陈小明
      '0133b92f-269b-4880-a4ab-ac51a0d2c6e1', // 李小红
    ],
  },
  {
    className: '2A班',
    classId: '22222222-2222-2222-2222-222222222222',
    students: [
      '3512932d-8ef4-435a-b690-d8e6966b6973', // 王大文
      'd66f9810-6c8a-4e4e-9fc9-d566e7aa1e7f', // 赵小丽
    ],
  },
];

// 无班级学生
const UNCLASSIFIED_STUDENTS = [
  '550e8400-e29b-41d4-a716-446655440004', // 测试学生
];

// 生成随机时间
function randomTime(minutes: number, range: number): string {
  const min = Math.floor(Math.random() * range) + minutes;
  const hour = Math.floor(min / 60);
  const minute = min % 60;
  const second = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
}

// 生成早上时间 (07:40 - 08:30)
function generateMorningTime(): string {
  return randomTime(460, 51); // 7:40 = 460 分钟
}

// 生成下午时间 (15:00 - 15:30)
function generateAfternoonTime(): string {
  return randomTime(900, 31); // 15:00 = 900 分钟
}

// 生成迟到时间 (08:00 - 08:30)
function generateLateTime(): string {
  return randomTime(480, 31); // 8:00 = 480 分钟
}

// 状态分布：每个班级的学生状态
function getStudentStatus(index: number): { status: string; checkIn: string; checkOut: string } {
  switch (index) {
    case 0:
    case 1:
      return { status: 'present', checkIn: generateMorningTime(), checkOut: generateAfternoonTime() };
    case 2:
      return { status: 'late', checkIn: generateLateTime(), checkOut: generateAfternoonTime() };
    case 3:
      return { status: 'leave_early', checkIn: generateMorningTime(), checkOut: randomTime(840, 61) }; // 14:00-15:00
    default:
      return { status: 'absent', checkIn: '', checkOut: '' };
  }
}

// 统计类型
interface Stats {
  present: number;
  late: number;
  leave_early: number;
  absent: number;
}

async function main() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  console.log(`${colors.BLUE}========================================${colors.NC}`);
  console.log(`${colors.BLUE}  每日出勤测试数据生成 (Node.js)${colors.NC}`);
  console.log(`${colors.BLUE}  日期: ${today}${colors.NC}`);
  console.log(`${colors.BLUE}========================================${colors.NC}`);
  console.log('');

  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log(`${colors.YELLOW}已连接到数据库${colors.NC}`);
    console.log('');

    // 初始化统计
    const stats: Stats = { present: 0, late: 0, leave_early: 0, absent: 0 };
    let total = 0;

    // 清理当天的旧记录
    console.log(`${colors.YELLOW}清理 ${today} 的旧出勤记录...${colors.NC}`);
    await client.query(`DELETE FROM attendances WHERE attendance_date = $1 AND sync_source = 'MANUAL'`, [today]);
    console.log(`${colors.GREEN}✓ 旧记录已清理${colors.NC}`);
    console.log('');

    // 生成每个班级的出勤记录
    for (const classData of CLASS_STUDENTS) {
      console.log(`${colors.BLUE}处理班级: ${classData.className}${colors.NC}`);
      
      for (let i = 0; i < classData.students.length; i++) {
        const studentId = classData.students[i];
        const { status, checkIn, checkOut } = getStudentStatus(i);
        
        await client.query(
          `INSERT INTO attendances 
           (student_id, class_id, attendance_date, check_in_time, check_out_time, status, attendance_type, remark, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, 'check_in', '自动化生成测试数据', 'system', 'system')`,
          [studentId, classData.classId, today, checkIn || null, checkOut || null, status]
        );
        
        stats[status as keyof Stats]++;
        total++;
        console.log(`    ${colors.GREEN}✓${colors.NC} ${studentId} -> ${status}`);
      }
      console.log('');
    }

    // 处理无班级学生
    console.log(`${colors.BLUE}处理班级: 无班级${colors.NC}`);
    for (const studentId of UNCLASSIFIED_STUDENTS) {
      const checkIn = generateMorningTime();
      const checkOut = generateAfternoonTime();
      
      await client.query(
        `INSERT INTO attendances 
         (student_id, class_id, attendance_date, check_in_time, check_out_time, status, attendance_type, remark, created_by, updated_by)
         VALUES ($1, NULL, $2, $3, $4, 'present', 'check_in', '自动化生成测试数据', 'system', 'system')`,
        [studentId, today, checkIn, checkOut]
      );
      
      stats.present++;
      total++;
      console.log(`    ${colors.GREEN}✓${colors.NC} ${studentId} -> present`);
    }
    console.log('');

    // 输出统计
    console.log(`${colors.BLUE}========================================${colors.NC}`);
    console.log(`${colors.BLUE}  生成完成！${colors.NC}`);
    console.log(`${colors.BLUE}  日期: ${today}${colors.NC}`);
    console.log(`${colors.BLUE}========================================${colors.NC}`);
    console.log('');
    console.log('状态分布:');
    console.log(`  ${colors.GREEN}present${colors.NC} (正常):      ${stats.present} 条`);
    console.log(`  ${colors.YELLOW}late${colors.NC} (迟到):        ${stats.late} 条`);
    console.log(`  ${colors.BLUE}leave_early${colors.NC} (早退):  ${stats.leave_early} 条`);
    console.log(`  ${colors.RED}absent${colors.NC} (缺勤):       ${stats.absent} 条`);
    console.log('');
    console.log(`${colors.GREEN}总计: ${total} 条出勤记录${colors.NC}`);
    console.log('');

    // 验证插入
    console.log(`${colors.YELLOW}验证数据...${colors.NC}`);
    const result = await client.query(
      `SELECT 
        u.name as student_name,
        COALESCE(c.name, '无班级') as class_name,
        a.status,
        a.check_in_time,
        a.check_out_time
      FROM attendances a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN classes c ON a.class_id::uuid = c.id
      WHERE a.attendance_date = $1
      ORDER BY c.name, u.name`,
      [today]
    );
    
    console.table(result.rows);
    console.log('');

    console.log(`${colors.GREEN}✓ 每日出勤测试数据生成完成！${colors.NC}`);

  } catch (error) {
    console.error(`${colors.RED}错误: ${error}${colors.NC}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
