import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Tag, Progress } from 'antd'
import { DownloadOutlined, EditOutlined, DeleteOutlined, CheckOutlined, RollbackOutlined } from '@ant-design/icons'

const { Option } = Select
const { TextArea } = Input

interface SubjectGrade {
  subject: string
  score: number
  grade: string
  classRank: number
  classAvg: number
  teacherComment?: string
}

interface GradeRecord {
  id: string
  studentId: string
  studentName: string
  teacherId: string
  teacherName: string
  classId: string
  className: string
  academicYear: string
  term: string
  examName: string
  subjects: SubjectGrade[]
  overallScore: number
  classRank: number
  gradeRank: number
  conductGrade: string
  attendanceRate: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  submittedAt?: string
  canRevokeUntil?: string
  createdAt: string
}

const GradeManagementPage: React.FC = () => {
  const [records, setRecords] = useState<GradeRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [revokeModalVisible, setRevokeModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<GradeRecord | null>(null)
  const [form] = Form.useForm()
  const [revokeForm] = Form.useForm()
  const [revokeReason, setRevokeReason] = useState('')

  // 初始化加载
  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      // TODO: 替换为实际API调用
      // const response = await fetch('/api/grades/records', {
      //   headers: { Authorization: `Bearer ${token}` }
      // })
      // const data = await response.json()
      // setRecords(data.data)

      // 模拟数据
      setRecords([
        {
          id: '1',
          studentId: 'student-1',
          studentName: '张小明',
          teacherId: 'teacher-1',
          teacherName: '李老师',
          classId: 'class-1',
          className: '1A班',
          academicYear: '2025-2026',
          term: '1',
          examName: '期中考试',
          subjects: [
            { subject: '中文', score: 85, grade: 'A', classRank: 5, classAvg: 72.3 },
            { subject: '英文', score: 78, grade: 'B', classRank: 10, classAvg: 70.5 },
            { subject: '数学', score: 92, grade: 'A', classRank: 2, classAvg: 75.8 },
          ],
          overallScore: 85,
          classRank: 5,
          gradeRank: 25,
          conductGrade: 'A',
          attendanceRate: '98%',
          status: 'pending_approval',
          submittedAt: '2026-06-25T10:00:00Z',
          createdAt: '2026-06-25T09:30:00Z',
        },
      ])
    } catch (error) {
      message.error('获取成绩记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: GradeRecord) => {
    setSelectedRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      // TODO: 替换为实际API调用
      if (selectedRecord) {
        // await fetch(`/api/grades/records/${selectedRecord.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(values)
        // })
        message.success('更新成功')
      } else {
        // await fetch('/api/grades/records', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(values)
        // })
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchRecords()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleRevoke = async () => {
    if (!revokeReason) {
      message.error('请填写撤回理由')
      return
    }

    try {
      // TODO: 替换为实际API调用
      // await fetch(`/api/grades/records/${selectedRecord?.id}/revoke`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reason: revokeReason })
      // })
      message.success('撤回成功')
      setRevokeModalVisible(false)
      setRevokeReason('')
      fetchRecords()
    } catch (error) {
      message.error('撤回失败')
    }
  }

  const handleDownloadPdf = async (record: GradeRecord) => {
    try {
      // TODO: 替换为实际API调用
      // const response = await fetch(`/api/grades/pdf/download/${record.id}`)
      // const blob = await response.blob()
      // const url = window.URL.createObjectURL(blob)
      // const a = document.createElement('a')
      // a.href = url
      // a.download = `成绩单_${record.studentName}.pdf`
      // a.click()
      message.success('PDF下载中...')
    } catch (error) {
      message.error('下载失败')
    }
  }

  const canRevoke = (record: GradeRecord): boolean => {
    if (record.status !== 'pending_approval') return false
    if (!record.canRevokeUntil) return false
    return new Date() < new Date(record.canRevokeUntil)
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: 'default',
      pending_approval: 'processing',
      approved: 'success',
      rejected: 'error',
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      draft: '草稿',
      pending_approval: '待审批',
      approved: '已通过',
      rejected: '已拒绝',
    }
    return texts[status] || status
  }

  const columns = [
    {
      title: '学生',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: '班级',
      dataIndex: 'className',
      key: 'className',
    },
    {
      title: '考试',
      dataIndex: 'examName',
      key: 'examName',
    },
    {
      title: '总分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      render: (score: number) => `${score}分`,
    },
    {
      title: '班级排名',
      dataIndex: 'classRank',
      key: 'classRank',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: GradeRecord) => (
        <Space size="small">
          {record.status === 'draft' && (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadPdf(record)}
            >
              下载PDF
            </Button>
          )}
          {record.status === 'pending_approval' && canRevoke(record) && (
            <Button
              type="link"
              danger
              icon={<RollbackOutlined />}
              onClick={() => {
                setSelectedRecord(record)
                setRevokeModalVisible(true)
              }}
            >
              撤回
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>成绩管理</h2>
        <Button type="primary" onClick={handleCreate}>
          创建成绩记录
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        loading={loading}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />

      {/* 创建/编辑模态框 */}
      <Modal
        title={selectedRecord ? '编辑成绩记录' : '创建成绩记录'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="studentId"
            label="学生"
            rules={[{ required: true, message: '请选择学生' }]}
          >
            <Select placeholder="选择学生">
              <Option value="student-1">张小明</Option>
              <Option value="student-2">李小红</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="examName"
            label="考试名称"
            rules={[{ required: true, message: '请输入考试名称' }]}
          >
            <Input placeholder="如：期中考试" />
          </Form.Item>

          <Form.Item label="各科成绩">
            <Form.List name="subjects">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'subject']}
                        rules={[{ required: true, message: '科目名称' }]}
                      >
                        <Input placeholder="科目" style={{ width: 120 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'score']}
                        rules={[{ required: true, message: '分数' }]}
                      >
                        <InputNumber placeholder="分数" min={0} max={100} style={{ width: 100 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'grade']}
                        rules={[{ required: true, message: '等级' }]}
                      >
                        <Select placeholder="等级" style={{ width: 80 }}>
                          <Option value="A">A</Option>
                          <Option value="B">B</Option>
                          <Option value="C">C</Option>
                          <Option value="D">D</Option>
                          <Option value="F">F</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'classRank']}>
                        <InputNumber placeholder="排名" min={1} style={{ width: 80 }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'classAvg']}>
                        <InputNumber placeholder="平均分" style={{ width: 80 }} />
                      </Form.Item>
                      <Button type="link" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block>
                    + 添加科目
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 撤回模态框 */}
      <Modal
        title="撤回成绩记录"
        open={revokeModalVisible}
        onOk={handleRevoke}
        onCancel={() => setRevokeModalVisible(false)}
      >
        <p style={{ marginBottom: '16px', color: '#ff4d4f' }}>
          ⚠️ 撤回后将触发审计告警并通知校务主任，请确认是否继续？
        </p>
        <Form form={revokeForm}>
          <Form.Item label="撤回理由" required>
            <TextArea
              rows={4}
              placeholder="请详细说明撤回原因..."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GradeManagementPage