/**
 * Test Data Generation Script
 * Generates daily attendance and parent-student links for testing
 */

const { Client } = require('pg');

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'school_admin',
  user: 'school_admin',
  password: 'school_admin123'
};

// Today's date
const TODAY = '2026-06-25';

// Random time generators
function randomTime(baseMinutes, range) {
  const minutes = Math.floor(Math.random() * range) + baseMinutes;
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  const sec = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function generateMorningTime() {
  return randomTime(460, 51); // 7:40 - 8:30
}

function generateAfternoonTime() {
  return randomTime(900, 31); // 15:00 - 15:30
}

function generateLateTime() {
  return randomTime(480, 31); // 8:00 - 8:30
}

function generateEarlyLeaveTime() {
  return randomTime(840, 61); // 14:00 - 15:00
}

// Assign status distribution to students
function getStudentStatus(index, totalInClass) {
  // Distribute: 60% present, 15% late, 10% leave_early, 15% absent
  const ratio = index / totalInClass;
  
  if (ratio < 0.6) {
    return { status: 'present', checkIn: generateMorningTime(), checkOut: generateAfternoonTime() };
  } else if (ratio < 0.75) {
    return { status: 'late', checkIn: generateLateTime(), checkOut: generateAfternoonTime() };
  } else if (ratio < 0.85) {
    return { status: 'leave_early', checkIn: generateMorningTime(), checkOut: generateEarlyLeaveTime() };
  } else {
    return { status: 'absent', checkIn: null, checkOut: null };
  }
}

async function main() {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✓ Connected to database\n');
    
    const stats = {
      attendance: { present: 0, late: 0, leave_early: 0, absent: 0, total: 0 },
      parentLinks: { total: 0 }
    };
    
    // ============================================
    // Step 1: Get all students with their classes
    // ============================================
    console.log('📊 Step 1: Fetching students and classes...\n');
    
    const studentsResult = await client.query(`
      SELECT u.id, u.username, u.name, u.class_name, c.id as class_id
      FROM users u
      LEFT JOIN classes c ON u.class_name = c.name
      WHERE u.role = 'student'
      ORDER BY u.class_name, u.username
    `);
    
    const students = studentsResult.rows;
    console.log(`   Found ${students.length} students\n`);
    
    // ============================================
    // Step 2: Clear old attendance records for today
    // ============================================
    console.log('🗑️  Step 2: Clearing old attendance records for today...\n');
    
    const deleteResult = await client.query(
      'DELETE FROM attendances WHERE attendance_date = $1',
      [TODAY]
    );
    console.log(`   Deleted ${deleteResult.rowCount} old records\n`);
    
    // ============================================
    // Step 3: Generate attendance records
    // ============================================
    console.log('📝 Step 3: Generating attendance records...\n');
    
    // Group students by class
    const studentsByClass = {};
    for (const student of students) {
      const className = student.class_name || '无班级';
      if (!studentsByClass[className]) {
        studentsByClass[className] = [];
      }
      studentsByClass[className].push(student);
    }
    
    // Generate attendance for each class
    for (const [className, classStudents] of Object.entries(studentsByClass)) {
      console.log(`   📚 ${className} (${classStudents.length} students)`);
      
      for (let i = 0; i < classStudents.length; i++) {
        const student = classStudents[i];
        const { status, checkIn, checkOut } = getStudentStatus(i, classStudents.length);
        
        await client.query(`
          INSERT INTO attendances 
          (student_id, class_id, attendance_date, check_in_time, check_out_time, status, attendance_type, remark, created_by, updated_by, sync_source)
          VALUES ($1, $2, $3, $4, $5, $6, 'check_in', '自动化测试数据', 'system', 'system', 'MANUAL')
        `, [
          student.id,
          student.class_id,
          TODAY,
          checkIn,
          checkOut,
          status
        ]);
        
        stats.attendance[status]++;
        stats.attendance.total++;
        console.log(`      ✓ ${student.username} (${student.name}) → ${status}`);
      }
      console.log('');
    }
    
    // ============================================
    // Step 4: Create parent-student links
    // ============================================
    console.log('👨‍👩‍👧‍👦 Step 4: Creating parent-student links...\n');
    
    // Get all parents
    const parentsResult = await client.query(`
      SELECT id, username, name
      FROM users
      WHERE role = 'parent'
      ORDER BY username
    `);
    const parents = parentsResult.rows;
    console.log(`   Found ${parents.length} parents\n`);
    
    // Create links: assign each parent to a student
    // parent_chen → stu001 (陈小明) - same surname
    // parent_li → stu002 (李小红) - same surname
    // parent004 → stu003 (王大文)
    // parent005 → stu004 (赵小丽)
    // parent006 → stu006 (孙小华)
    // parent007 → stu007 (周小强)
    // parent008 → stu008 (吴小美)
    // parent1 → student1 (测试学生)
    
    const parentStudentPairs = [
      { parentUsername: 'parent_chen', studentUsername: 'stu001', relationship: 'father', isPrimary: true },
      { parentUsername: 'parent_li', studentUsername: 'stu002', relationship: 'mother', isPrimary: true },
      { parentUsername: 'parent004', studentUsername: 'stu003', relationship: 'father', isPrimary: true },
      { parentUsername: 'parent005', studentUsername: 'stu004', relationship: 'mother', isPrimary: true },
      { parentUsername: 'parent006', studentUsername: 'stu006', relationship: 'mother', isPrimary: true },
      { parentUsername: 'parent007', studentUsername: 'stu007', relationship: 'father', isPrimary: true },
      { parentUsername: 'parent008', studentUsername: 'stu008', relationship: 'father', isPrimary: true },
      { parentUsername: 'parent1', studentUsername: 'student1', relationship: 'guardian', isPrimary: true },
      // Add some secondary parents
      { parentUsername: 'parent_chen', studentUsername: 'stu012', relationship: 'father', isPrimary: false },
      { parentUsername: 'parent_li', studentUsername: 'stu010', relationship: 'mother', isPrimary: false },
    ];
    
    for (const pair of parentStudentPairs) {
      const parent = parents.find(p => p.username === pair.parentUsername);
      const student = students.find(s => s.username === pair.studentUsername);
      
      if (!parent) {
        console.log(`   ⚠️  Parent ${pair.parentUsername} not found, skipping`);
        continue;
      }
      if (!student) {
        console.log(`   ⚠️  Student ${pair.studentUsername} not found, skipping`);
        continue;
      }
      
      try {
        await client.query(`
          INSERT INTO parent_student_links 
          (parent_id, student_id, relationship, is_primary, verified_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [parent.id, student.id, pair.relationship, pair.isPrimary]);
        
        stats.parentLinks.total++;
        console.log(`   ✓ ${parent.name} → ${student.name} (${pair.relationship}${pair.isPrimary ? ', primary' : ''})`);
      } catch (err) {
        console.log(`   ⚠️  Link already exists: ${parent.name} → ${student.name}`);
      }
    }
    console.log('');
    
    // ============================================
    // Step 5: Verification
    // ============================================
    console.log('🔍 Step 5: Verifying data...\n');
    
    // Verify attendance
    const attendanceVerify = await client.query(`
      SELECT 
        u.username,
        u.name as student_name,
        COALESCE(u.class_name, '无班级') as class_name,
        a.status,
        a.check_in_time,
        a.check_out_time
      FROM attendances a
      JOIN users u ON a.student_id = u.id
      WHERE a.attendance_date = $1
      ORDER BY u.class_name, u.username
    `, [TODAY]);
    
    console.log(`   ✅ Attendance records: ${attendanceVerify.rows.length}`);
    console.log('');
    
    // Verify parent-student links
    const linksVerify = await client.query(`
      SELECT 
        p.username as parent_username,
        p.name as parent_name,
        s.username as student_username,
        s.name as student_name,
        psl.relationship,
        psl.is_primary
      FROM parent_student_links psl
      JOIN users p ON psl.parent_id = p.id
      JOIN users s ON psl.student_id = s.id
      ORDER BY p.username
    `);
    
    console.log(`   ✅ Parent-student links: ${linksVerify.rows.length}`);
    console.log('');
    
    // ============================================
    // Summary
    // ============================================
    console.log('═'.repeat(60));
    console.log('📊 GENERATION COMPLETE');
    console.log('═'.repeat(60));
    console.log('');
    console.log('📅 Date:', TODAY);
    console.log('');
    console.log('📋 Attendance Records:');
    console.log(`   ✅ Present:      ${stats.attendance.present}`);
    console.log(`   ⏰ Late:         ${stats.attendance.late}`);
    console.log(`   🚪 Leave Early:  ${stats.attendance.leave_early}`);
    console.log(`   ❌ Absent:       ${stats.attendance.absent}`);
    console.log(`   📊 Total:        ${stats.attendance.total}`);
    console.log('');
    console.log('👨‍👩‍👧‍👦 Parent-Student Links:');
    console.log(`   📊 Total:        ${stats.parentLinks.total}`);
    console.log('');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();