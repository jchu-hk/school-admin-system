import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { GradeRecord } from './grade-record.entity'
import { User } from '../user/user.entity'
import { GeneratePdfDto } from './dto/grade-record.dto'
import PDFDocument from 'pdfkit'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class GradePdfService {
  constructor(
    @InjectRepository(GradeRecord)
    private readonly gradeRecordRepository: Repository<GradeRecord>,
  ) {}

  async generatePdf(dto: GeneratePdfDto, userId: string): Promise<{ url: string; filename: string }> {
    const record = await this.gradeRecordRepository.findOne({
      where: { id: dto.gradeRecordId },
      relations: ['student', 'teacher', 'class'],
    })

    if (!record) {
      throw new NotFoundException('Grade record not found')
    }

    // 检查访问权限（家长只能看自己孩子的，教师可以看自己班级的）
    // TODO: 实现权限检查

    // 创建PDF
    const filename = `成绩单_${record.student.name}_${record.academicYear}_${record.term}_${record.examName}.pdf`
    const filepath = path.join('/tmp', filename)

    await this.createPdf(record, filepath, dto.addWatermark, dto.watermarkText)

    // 更新记录元数据
    record.metadata = {
      ...record.metadata,
      pdfGenerated: true,
      pdfUrl: filepath,
    }
    await this.gradeRecordRepository.save(record)

    return {
      url: `/api/grades/download/${record.id}`,
      filename,
    }
  }

  private async createPdf(record: GradeRecord, filepath: string, addWatermark: boolean, watermarkText: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 72, bottom: 72, left: 72, right: 72 },
        })

        const stream = fs.createWriteStream(filepath)
        doc.pipe(stream)

        // 添加水印
        if (addWatermark) {
          this.addWatermark(doc, watermarkText || '仅供家长个人使用')
        }

        // 标题
        doc.fontSize(20).font('Helvetica-Bold').text('学生成绩单', { align: 'center' })
        doc.moveDown()

        // 学校信息（硬编码，应从配置读取）
        doc.fontSize(12).font('Helvetica').text('XX学校', { align: 'center' })
        doc.moveDown(0.5)

        // 学生信息
        doc.fontSize(14).font('Helvetica-Bold').text('学生信息', { underline: true })
        doc.moveDown(0.5)
        doc.fontSize(11).font('Helvetica')
        doc.text(`学生姓名: ${record.student.name}`, { continued: false })
        doc.text(`学号: ${record.student.username}`)
        doc.text(`班级: ${record.class.name}`)
        doc.text(`学年: ${record.academicYear}`)
        doc.text(`学期: ${record.term}`)
        doc.text(`考试: ${record.examName}`)
        doc.moveDown()

        // 成绩表格
        doc.fontSize(14).font('Helvetica-Bold').text('各科成绩', { underline: true })
        doc.moveDown(0.5)

        const tableTop = doc.y
        const tableLeft = 72
        const colWidths = [100, 80, 80, 80, 120]

        // 表头
        doc.fontSize(11).font('Helvetica-Bold')
        doc.text('科目', tableLeft, tableTop)
        doc.text('分数', tableLeft + colWidths[0], tableTop)
        doc.text('等级', tableLeft + colWidths[0] + colWidths[1], tableTop)
        doc.text('班级排名', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop)
        doc.text('班级平均分', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop)

        let rowY = tableTop + 30
        doc.fontSize(10).font('Helvetica')

        // 各科数据
        record.subjects.forEach((subject) => {
          doc.text(subject.subject, tableLeft, rowY)
          doc.text(String(subject.score), tableLeft + colWidths[0], rowY)
          doc.text(subject.grade, tableLeft + colWidths[0] + colWidths[1], rowY)
          doc.text(String(subject.classRank), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], rowY)
          doc.text(String(subject.classAvg), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], rowY)

          if (subject.teacherComment) {
            rowY += 15
            doc.fontSize(9).text(`评语: ${subject.teacherComment}`, tableLeft, rowY)
            doc.fontSize(10)
            rowY += 5
          }

          rowY += 30
        })

        doc.moveDown()

        // 总体信息
        doc.fontSize(14).font('Helvetica-Bold').text('总体表现', { underline: true })
        doc.moveDown(0.5)
        doc.fontSize(11).font('Helvetica')
        doc.text(`总分: ${record.overallScore}`)
        doc.text(`班级排名: ${record.classRank}`)
        doc.text(`年级排名: ${record.gradeRank}`)
        doc.text(`操行等级: ${record.conductGrade}`)
        doc.text(`出勤率: ${record.attendanceRate}`)
        doc.moveDown()

        // 教师签名
        doc.fontSize(11).font('Helvetica-Bold').text('教师签名: _________________')
        doc.text(`日期: ${new Date().toLocaleDateString('zh-HK')}`)
        doc.moveDown()

        // 生成日期
        doc.fontSize(9).font('Helvetica').text(`生成时间: ${new Date().toLocaleString('zh-HK')}`, { align: 'right' })

        doc.end()

        stream.on('finish', () => resolve())
        stream.on('error', (err) => reject(err))
      } catch (error) {
        reject(error)
      }
    })
  }

  private addWatermark(doc: any, text: string): void {
    doc.save()
    doc.opacity(0.1)
    doc.fontSize(40)
    doc.rotate(45, { origin: [306, 396] })

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        doc.text(text, -100 + i * 150, -100 + j * 150, { width: 300 })
      }
    }

    doc.restore()
  }

  async downloadPdf(id: string, userId: string): Promise<{ filepath: string; filename: string }> {
    const record = await this.gradeRecordRepository.findOne({
      where: { id },
      relations: ['student'],
    })

    if (!record) {
      throw new NotFoundException('Grade record not found')
    }

    // 检查PDF是否已生成
    if (!record.metadata?.pdfGenerated || !record.metadata?.pdfUrl) {
      throw new BadRequestException('PDF not generated yet')
    }

    const filename = `成绩单_${record.student.name}_${record.academicYear}_${record.term}_${record.examName}.pdf`

    return {
      filepath: record.metadata.pdfUrl,
      filename,
    }
  }

  async generateBatchPdf(classId: string, academicYear: string, term: string, examName: string): Promise<{ count: number; zipUrl: string }> {
    // TODO: 实现批量生成PDF并打包成ZIP
    throw new BadRequestException('Batch generation not implemented yet')
  }
}