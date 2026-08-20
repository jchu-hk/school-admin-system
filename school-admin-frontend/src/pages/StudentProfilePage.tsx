import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { getToken } from '../utils/tokenService';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useI18n } from '../i18n';

interface StudentProfile {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  enrollmentDate: string;
  enrollmentStatus: string;
  healthInfo?: {
    allergies?: string[];
    medicalConditions?: string[];
    emergencyContact?: string;
    emergencyPhone?: string;
  };
  academicSummary?: {
    totalSubjects: number;
    averageScore: number;
    attendanceRate: number;
  };
  archiveStatus: string;
  archivedAt?: string;
  archivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

function profileStatusOptions(sp: Translations['studentProfile']) {
  return [
    { value: 'active', label: sp.active },
    { value: 'archived', label: sp.archived },
    { value: 'graduated', label: sp.graduated },
    { value: 'transferred', label: sp.transferred },
    { value: 'suspended', label: sp.suspended },
  ];
}

export default function StudentProfilePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const statusOptions = profileStatusOptions(t.studentProfile);
  const PAGE_SIZE = 20;

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', PAGE_SIZE.toString());
      if (statusFilter) params.append('status', statusFilter);

      const response = await apiClient.get<{ data: StudentProfile[]; total: number }>(
        `/student-profiles?${params.toString()}`
      );

      setProfiles(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
      if (isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, navigate]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleArchive = async () => {
    if (!selectedProfile) return;
    setActionLoading(true);
    try {
      await apiClient.post(
        `/student-profiles/${selectedProfile.id}/archive`,
        { reason: archiveReason }
      );
      setShowArchiveModal(false);
      setSelectedProfile(null);
      fetchProfiles();
    } catch (error) {
      console.error('Failed to archive:', error);
      alert(t.studentProfile.archiveFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchive = async (profileId: string) => {
    setActionLoading(true);
    try {
      await apiClient.post(
        `/student-profiles/${profileId}/unarchive`
      );
      fetchProfiles();
    } catch (error) {
      console.error('Failed to unarchive:', error);
      alert(t.studentProfile.unarchiveFailed);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.studentName?.toLowerCase().includes(term) ||
      p.studentId?.toLowerCase().includes(term) ||
      p.className?.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'graduated': return 'bg-blue-100 text-blue-800';
      case 'transferred': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t.studentProfile.title}</h1>
          <p className="text-gray-600 mt-1">{t.studentProfile.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.studentProfile.search}</label>
              <input
                type="text"
                placeholder={t.studentProfile.searchPlaceholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.studentProfile.status}</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">{t.common.all}</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setPage(1) || fetchProfiles()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t.studentProfile.refresh}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">{t.studentProfile.loading}</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || statusFilter ? t.studentProfile.noMatch : t.studentProfile.noData}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.studentProfile.studentName}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.studentProfile.studentId}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.studentProfile.className}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.studentProfile.enrollmentDate}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.studentProfile.enrollmentStatus}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.studentProfile.archiveStatus}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.studentProfile.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProfiles.map(profile => (
                    <tr key={profile.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{profile.studentName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{profile.studentId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{profile.className || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {profile.enrollmentDate ? new Date(profile.enrollmentDate).toLocaleDateString('zh-HK') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(profile.enrollmentStatus || 'active')}`}>
                          {statusOptions.find(o => o.value === profile.enrollmentStatus)?.label || profile.enrollmentStatus || t.studentProfile.active}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(profile.archiveStatus)}`}>
                          {statusOptions.find(o => o.value === profile.archiveStatus)?.label || profile.archiveStatus || t.studentProfile.active}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedProfile(profile)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {t.studentProfile.detail}
                          </button>
                          {profile.archiveStatus === 'active' ? (
                            <button
                              onClick={() => { setSelectedProfile(profile); setShowArchiveModal(true); }}
                              className="text-gray-600 hover:text-gray-800"
                              disabled={actionLoading}
                            >
                              {t.studentProfile.archive}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnarchive(profile.id)}
                              className="text-orange-600 hover:text-orange-800"
                              disabled={actionLoading}
                            >
                              {t.studentProfile.unarchive}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Archive Modal */}
      {showArchiveModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{t.studentProfile.archiveTitle}</h3>
            <p className="mb-4 text-gray-600">
              {t.studentProfile.archiveStudent} <strong>{selectedProfile.studentName}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.studentProfile.archiveReason}</label>
              <textarea
                value={archiveReason}
                onChange={e => setArchiveReason(e.target.value)}
                placeholder={t.studentProfile.archiveReasonPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowArchiveModal(false); setSelectedProfile(null); }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t.studentProfile.cancel}
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading || !archiveReason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? t.studentProfile.archiving : t.studentProfile.confirmArchive}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedProfile && !showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">{t.studentProfile.detailTitle}</h3>
              <button onClick={() => setSelectedProfile(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">{t.studentProfile.basicInfo}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">{t.studentProfile.studentName}:</span> {selectedProfile.studentName || '-'}</div>
                  <div><span className="text-gray-500">{t.studentProfile.studentId}:</span> {selectedProfile.studentId || '-'}</div>
                  <div><span className="text-gray-500">{t.studentProfile.className}:</span> {selectedProfile.className || '-'}</div>
                  <div><span className="text-gray-500">{t.studentProfile.enrollmentDate}:</span> {selectedProfile.enrollmentDate ? new Date(selectedProfile.enrollmentDate).toLocaleDateString('zh-HK') : '-'}</div>
                  <div><span className="text-gray-500">{t.studentProfile.enrollmentStatus}:</span> {statusOptions.find(o => o.value === selectedProfile.enrollmentStatus)?.label || selectedProfile.enrollmentStatus || '-'}</div>
                  <div><span className="text-gray-500">{t.studentProfile.archiveStatus}:</span> {statusOptions.find(o => o.value === selectedProfile.archiveStatus)?.label || selectedProfile.archiveStatus || '-'}</div>
                </div>
              </div>

              {/* Health Info */}
              {selectedProfile.healthInfo && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">{t.studentProfile.healthInfo}</h4>
                  <div className="text-sm space-y-1">
                    {selectedProfile.healthInfo.allergies?.length ? (
                      <div><span className="text-gray-500">{t.studentProfile.allergies}:</span> {selectedProfile.healthInfo.allergies.join(', ')}</div>
                    ) : null}
                    {selectedProfile.healthInfo.medicalConditions?.length ? (
                      <div><span className="text-gray-500">{t.studentProfile.medicalConditions}:</span> {selectedProfile.healthInfo.medicalConditions.join(', ')}</div>
                    ) : null}
                    {selectedProfile.healthInfo.emergencyContact ? (
                      <div><span className="text-gray-500">{t.studentProfile.emergencyContact}:</span> {selectedProfile.healthInfo.emergencyContact} ({selectedProfile.healthInfo.emergencyPhone})</div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Academic Summary */}
              {selectedProfile.academicSummary && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">{t.studentProfile.academicSummary}</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-700">{selectedProfile.academicSummary.totalSubjects}</div>
                      <div className="text-gray-500">{t.studentProfile.subjectCount}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">{selectedProfile.academicSummary.averageScore}%</div>
                      <div className="text-gray-500">{t.studentProfile.averageScore}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">{selectedProfile.academicSummary.attendanceRate}%</div>
                      <div className="text-gray-500">{t.studentProfile.attendanceRate}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Archive Info */}
              {selectedProfile.archiveStatus === 'archived' && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-medium mb-2">{t.studentProfile.archiveInfo}</h4>
                  <div className="text-sm text-gray-600">
                    <div>{t.studentProfile.archivedAt}: {selectedProfile.archivedAt ? new Date(selectedProfile.archivedAt).toLocaleString('zh-HK') : '-'}</div>
                    <div>{t.studentProfile.archivedBy}: {selectedProfile.archivedBy || '-'}</div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400">
                {t.studentProfile.created}: {new Date(selectedProfile.createdAt).toLocaleString('zh-HK')} | {t.studentProfile.updated}: {new Date(selectedProfile.updatedAt).toLocaleString('zh-HK')}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedProfile(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t.studentProfile.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}