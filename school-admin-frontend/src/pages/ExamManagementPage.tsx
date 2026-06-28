import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Users,
  XCircle,
  Filter,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  examApi,
  Exam,
  ExamFormData,
  ExamQueryParams,
  ExamStatus,
  ExamType,
  EXAM_TYPE_OPTIONS,
  EXAM_STATUS_OPTIONS,
} from '../api/exam';

const EXAM_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ongoing: { bg: 'bg-orange-100', text: 'text-orange-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
  postponed: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
};

const EXAM_TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  midterm: { bg: 'bg-blue-100', text: 'text-blue-800' },
  final: { bg: 'bg-purple-100', text: 'text-purple-800' },
  quiz: { bg: 'bg-green-100', text: 'text-green-800' },
  test: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  oral: { bg: 'bg-pink-100', text: 'text-pink-800' },
  practical: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  other: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const ExamManagementPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const subjects = ['语文', '英文', '数学', '物理', '化学', '生物', '历史', '地理', '其他'];
  const classNames = ['中一A班', '中一B班', '中二A班', '中二B班', '中三A班', '中四A班', '中四B班', '中五A班'];

  const defaultFormData: ExamFormData = {
    name: '',
    subject: '',
    examDate: '',
    startTime: '',
    endTime: '',
    classroom: '',
    classId: '',
    className: '',
    examType: ExamType.TEST,
    status: ExamStatus.SCHEDULED,
    invigilator: '',
    totalMarks: 100,
    passingMarks: 60,
    remark: '',
  };

  const [formData, setFormData] = useState<ExamFormData>(defaultFormData);

  useEffect(() => {
    fetchExams();
  }, [currentPage, searchKeyword, selectedSubject, selectedClassName, selectedStatus, selectedExamType]);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: ExamQueryParams = {
        page: currentPage,
        pageSize,
        keyword: searchKeyword || undefined,
        subject: selectedSubject || undefined,
        className: selectedClassName || undefined,
        status: selectedStatus || undefined,
        examType: selectedExamType || undefined,
      };

      const response = await examApi.getList(params);
      setExams(response.data);
      setTotalCount(response.total);
    } catch (err: any) {
      setError(err.message || '获取考试列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchExams();
  };

  const handleOpenModal = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        name: exam.name,
        subject: exam.subject,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        classroom: exam.classroom,
        classId: exam.classId || '',
        className: exam.className || '',
        examType: exam.examType,
        status: exam.status,
        invigilator: exam.invigilator || '',
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks || 60,
        remark: exam.remark || '',
      });
    } else {
      setEditingExam(null);
      setFormData(defaultFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExam(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingExam) {
        await examApi.update(editingExam.id, formData);
      } else {
        await examApi.create(formData);
      }
      handleCloseModal();
      fetchExams();
    } catch (err: any) {
      setError(err.message || '保存考试失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingExamId) return;

    try {
      await examApi.delete(deletingExamId);
      setShowDeleteConfirm(false);
      setDeletingExamId(null);
      fetchExams();
    } catch (err: any) {
      setError(err.message || '删除考试失败');
    }
  };

  const getStatusBadge = (status: ExamStatus) => {
    const colors = EXAM_STATUS_COLOR[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    const label = EXAM_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
        {label}
      </span>
    );
  };

  const getTypeBadge = (type: ExamType) => {
    const colors = EXAM_TYPE_COLOR[type] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    const label = EXAM_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">考试管理</h1>
          <p className="text-slate-600">管理学校的考试安排信息</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索考试名称"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有科目</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={selectedClassName}
                onChange={(e) => setSelectedClassName(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有班级</option>
                {classNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有状态</option>
                {EXAM_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">所有类型</option>
                  {EXAM_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleSearch}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>

              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增考试
              </button>
            </div>
          </div>
        </Card>

        {/* 考试列表 */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600">加载中...</p>
              </div>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">暂无考试数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">考试名称</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">科目</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">班级</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">考试日期</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">时间</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">考场</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">监考</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">类型</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">状态</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 font-medium text-slate-900">{exam.name}</td>
                      <td className="py-4 px-4 text-slate-700">{exam.subject}</td>
                      <td className="py-4 px-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          {exam.className || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(exam.examDate)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {exam.startTime} - {exam.endTime}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {exam.classroom}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700">{exam.invigilator || '-'}</td>
                      <td className="py-4 px-4">{getTypeBadge(exam.examType)}</td>
                      <td className="py-4 px-4">{getStatusBadge(exam.status)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(exam)}
                            className="p-2 hover:bg-slate-100 rounded"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4 text-slate-600" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingExamId(exam.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 hover:bg-red-50 rounded"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                共 {totalCount} 条记录，第 {currentPage} / {Math.ceil(totalCount / pageSize)} 页
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage * pageSize >= totalCount}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* 考试表单模态框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingExam ? '编辑考试' : '新增考试'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      考试名称 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="如：2024年度数学期中考试"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      科目 *
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择科目</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      班级 *
                    </label>
                    <select
                      required
                      value={formData.className}
                      onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择班级</option>
                      {classNames.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      考试日期 *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.examDate}
                      onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      考试类型 *
                    </label>
                    <select
                      required
                      value={formData.examType}
                      onChange={(e) => setFormData({ ...formData, examType: e.target.value as ExamType })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {EXAM_TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      开始时间 *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      结束时间 *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      考场 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.classroom}
                      onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="如：A-101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      监考老师
                    </label>
                    <input
                      type="text"
                      value={formData.invigilator}
                      onChange={(e) => setFormData({ ...formData, invigilator: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="如：张老师"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      总分 *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="1000"
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      及格分
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.passingMarks}
                      onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      状态 *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ExamStatus })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {EXAM_STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    备注
                  </label>
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="备注信息..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">确认删除</h3>
                </div>

                <p className="text-slate-600 mb-6">
                  确定要删除这个考试记录吗？此操作不可恢复。
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingExamId(null);
                    }}
                    className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamManagementPage;
