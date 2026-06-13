import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { settingsApi, SystemConfig, SystemLog, SystemUser } from '../api/settings';
import { useI18n } from '../i18n';
import {
  Settings as SettingsIcon,
  Shield,
  Database,
  Activity,
  Users,
  Search,
  Edit2,
  Trash2,
  Save,
  RefreshCw,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

const SystemSettingsPage: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'configs' | 'users' | 'logs'>('configs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 配置管理状态
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [configCategories, setConfigCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);

  // 用户管理状态
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUserStatus, setSelectedUserStatus] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // 日志管理状态
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logLevelFilter, setLogLevelFilter] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('');
  const [logModules, setLogModules] = useState<string[]>([]);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, selectedCategory, searchKeyword, selectedRole, selectedUserStatus, logLevelFilter, logModuleFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'configs') {
        await fetchConfigs();
      } else if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'logs') {
        await fetchLogs();
      }
    } catch (err: any) {
      setError(err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    const params = selectedCategory ? { category: selectedCategory } : {};
    const response = await settingsApi.getConfigs(params);
    setConfigs(response.data);

    // 提取所有类别
    const categories = Array.from(new Set(response.data.map((c) => c.category)));
    setConfigCategories(categories);
  };

  const fetchUsers = async () => {
    const params: any = {};
    if (searchKeyword) params.keyword = searchKeyword;
    if (selectedRole) params.role = selectedRole;
    if (selectedUserStatus) params.status = selectedUserStatus;
    params.page = currentPage;
    params.pageSize = pageSize;

    const response = await settingsApi.getUsers(params);
    setUsers(response.data);
    setTotalCount(response.total);
  };

  const fetchLogs = async () => {
    const params: any = {};
    if (logLevelFilter) params.level = logLevelFilter;
    if (logModuleFilter) params.module = logModuleFilter;
    params.page = currentPage;
    params.pageSize = pageSize;

    const response = await settingsApi.getLogs(params);
    setLogs(response.data);
    setTotalCount(response.total);

    // 提取所有模块
    const modules = Array.from(new Set(response.data.map((l) => l.module)));
    setLogModules(modules);
  };

  const handleSaveConfig = async (config: SystemConfig) => {
    try {
      await settingsApi.updateConfig(config.id, {
        value: config.value,
        description: config.description,
      });
      setShowConfigForm(false);
      setEditingConfig(null);
      fetchConfigs();
    } catch (err: any) {
      setError(err.message || '保存配置失败');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    try {
      await settingsApi.deleteUser(deletingUserId);
      setShowDeleteConfirm(false);
      setDeletingUserId(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || '删除用户失败');
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: 'active' | 'inactive') => {
    try {
      await settingsApi.updateUserStatus(userId, status);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || '更新用户状态失败');
    }
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case 'info':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
      case 'warn':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            WARN
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            ERROR
          </span>
        );
      default:
        return null;
    }
  };

  const getUserStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        启用
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        禁用
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">系统设置</h1>
          <p className="text-slate-600">管理系统配置、用户权限和系统日志</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* 标签页切换 */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('configs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'configs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <SettingsIcon className="w-4 h-4 inline mr-2" />
            基础配置
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            用户管理
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            系统日志
          </button>
        </div>

        {/* 基础配置标签页 */}
        {activeTab === 'configs' && (
          <div>
            <Card className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">所有类别</option>
                    {configCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={fetchConfigs}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              {configs.map((config) => (
                <Card key={config.id} hover className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{config.key}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                          {config.category}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          {config.type}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">当前值:</span>
                        <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                          {config.value}
                        </code>
                      </div>
                    </div>
                    <Button onClick={() => {
                      setEditingConfig(config);
                      setShowConfigForm(true);
                    }} className="p-2">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 用户管理标签页 */}
        {activeTab === 'users' && (
          <div>
            <Card className="mb-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="搜索用户名或邮箱"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && setCurrentPage(1)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">所有角色</option>
                    <option value="admin">管理员</option>
                    <option value="teacher">教师</option>
                    <option value="staff">职员</option>
                  </select>

                  <select
                    value={selectedUserStatus}
                    onChange={(e) => setSelectedUserStatus(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">所有状态</option>
                    <option value="active">启用</option>
                    <option value="inactive">禁用</option>
                  </select>
                </div>

                <div className="flex items-center justify-end">
                  <Button onClick={() => setCurrentPage(1)}>
                    <Filter className="w-4 h-4 mr-2" />
                    应用筛选
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600">加载中...</p>
                  </div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">暂无用户数据</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">用户名</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">邮箱</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">角色</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">状态</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">创建时间</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 font-medium text-slate-900">{user.username}</td>
                          <td className="py-4 px-4 text-slate-700">{user.email}</td>
                          <td className="py-4 px-4 text-slate-700">
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">{getUserStatusBadge(user.status)}</td>
                          <td className="py-4 px-4 text-slate-700">
                            {new Date(user.createdAt).toLocaleString('zh-HK')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {user.status === 'active' ? (
                                <Button
                                  onClick={() => handleUpdateUserStatus(user.id, 'inactive')}
                                  className="p-2 text-orange-600 hover:bg-orange-50"
                                  title="禁用"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleUpdateUserStatus(user.id, 'active')}
                                  className="p-2 text-green-600 hover:bg-green-50"
                                  title="启用"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                onClick={() => {
                                  setDeletingUserId(user.id);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
                    共 {totalCount} 条记录，第 {currentPage} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2"
                    >
                      上一页
                    </Button>
                    <Button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage * pageSize >= totalCount}
                      className="px-3 py-2"
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 系统日志标签页 */}
        {activeTab === 'logs' && (
          <div>
            <Card className="mb-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={logLevelFilter}
                    onChange={(e) => setLogLevelFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">所有级别</option>
                    <option value="info">INFO</option>
                    <option value="warn">WARN</option>
                    <option value="error">ERROR</option>
                  </select>

                  <select
                    value={logModuleFilter}
                    onChange={(e) => setLogModuleFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">所有模块</option>
                    {logModules.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end">
                  <Button onClick={() => setCurrentPage(1)}>
                    <Filter className="w-4 h-4 mr-2" />
                    应用筛选
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600">加载中...</p>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">暂无日志数据</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-shrink-0">{getLogLevelBadge(log.level)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-slate-900">{log.module}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(log.createdAt).toLocaleString('zh-HK')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 break-words">{log.message}</p>
                        {log.userId && (
                          <p className="text-xs text-slate-500 mt-1">用户ID: {log.userId}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {totalCount > pageSize && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    共 {totalCount} 条记录，第 {currentPage} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2"
                    >
                      上一页
                    </Button>
                    <Button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage * pageSize >= totalCount}
                      className="px-3 py-2"
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 配置编辑表单模态框 */}
        {showConfigForm && editingConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">编辑配置</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">配置键</label>
                  <input
                    type="text"
                    value={editingConfig.key}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">配置值</label>
                  <textarea
                    value={editingConfig.value}
                    onChange={(e) => setEditingConfig({ ...editingConfig, value: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">描述</label>
                  <textarea
                    value={editingConfig.description}
                    onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => {
                      setShowConfigForm(false);
                      setEditingConfig(null);
                    }}
                    className="px-6"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={() => handleSaveConfig(editingConfig)}
                    className="px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 删除用户确认模态框 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">确认删除</h3>
                </div>

                <p className="text-slate-600 mb-6">
                  确定要删除这个用户吗？此操作不可恢复。
                </p>

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingUserId(null);
                    }}
                    className="px-6"
                  >
                    取消
                  </Button>
                  <Button onClick={handleDeleteUser} className="px-6 text-red-600 hover:bg-red-50">
                    删除
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettingsPage;