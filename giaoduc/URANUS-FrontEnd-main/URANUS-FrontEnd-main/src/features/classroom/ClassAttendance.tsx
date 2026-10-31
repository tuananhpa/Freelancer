import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import classService, { Classroom, AttendanceResponse, RecordAttendanceRequest, AttendanceRecord } from '../../services/class.service';
import { useToast } from '../../context/ToastContext';
import Select from '../../components/ui/Select';
import * as XLSX from 'xlsx';
import UserAvatar from '../../components/common/UserAvatar';

interface ClassContext {
  classroom: Classroom;
  isTeacher: boolean;
}

const ClassAttendance: React.FC = () => {
  const { classroom, isTeacher } = useOutletContext<ClassContext>();
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Local state to keep track of changes before saving
  const [localRecords, setLocalRecords] = useState<Record<string, AttendanceRecord['status']>>({});

  useEffect(() => {
    if (!isTeacher) return;
    fetchAttendance();
  }, [classroom.id, weekNumber, sessionNumber, isTeacher]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await classService.getAttendance(classroom.id, weekNumber, sessionNumber);
      setAttendanceData(data);
      
      const newLocalRecords: Record<string, AttendanceRecord['status']> = {};
      data.records.forEach((r: AttendanceRecord) => {
        newLocalRecords[r.studentId] = r.status;
      });
      setLocalRecords(newLocalRecords);
    } catch (error) {
      toast.error('Không thể tải dữ liệu điểm danh');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setLocalRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const recordsToSave = Object.entries(localRecords)
        .filter(([_, status]) => status !== null)
        .map(([studentId, status]) => ({
          studentId,
          status: status as 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED'
        }));

      if (recordsToSave.length === 0) {
        toast.error('Vui lòng chọn trạng thái điểm danh');
        return;
      }

      const requestData: RecordAttendanceRequest = {
        weekNumber,
        sessionNumber,
        records: recordsToSave
      };

      await classService.recordAttendance(classroom.id, requestData);
      toast.success('Đã lưu điểm danh thành công');
      fetchAttendance(); // Refresh to get consistent state
    } catch (error) {
      toast.error('Lỗi khi lưu điểm danh');
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    if (!attendanceData || attendanceData.records.length === 0) {
      toast.info('Không có dữ liệu để xuất');
      return;
    }

    const exportData = attendanceData.records.map(r => {
      const currentStatus = localRecords[r.studentId];
      let statusText = 'Chưa điểm danh';
      if (currentStatus === 'PRESENT') statusText = 'Có mặt';
      else if (currentStatus === 'ABSENT_EXCUSED') statusText = 'Vắng phép';
      else if (currentStatus === 'ABSENT_UNEXCUSED') statusText = 'Vắng không phép';

      return {
        'Học Sinh': r.studentName,
        'Trạng Thái': statusText
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `T${weekNumber}_B${sessionNumber}`);

    const max_width = attendanceData.records.reduce((w, r) => Math.max(w, r.studentName.length), 20);
    worksheet['!cols'] = [ { wch: max_width }, { wch: 20 } ];

    XLSX.writeFile(workbook, `Diem_Danh_${classroom.name}_T${weekNumber}_B${sessionNumber}.xlsx`);
  };

  if (!isTeacher) {
    return <div className="text-center py-10 text-red-500 font-medium">Bạn không có quyền điểm danh.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-camNhat text-camDam flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          Điểm Danh Lớp Học
        </h2>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Select
            value={String(weekNumber)}
            onChange={(v) => setWeekNumber(Number(v))}
            className="input max-w-[150px]"
            options={Array.from({length: 15}, (_, i) => i + 1).map(w => ({ value: String(w), label: `Tuần ${w}` }))}
          />
          <Select
            value={String(sessionNumber)}
            onChange={(v) => setSessionNumber(Number(v))}
            className="input max-w-[150px]"
            options={Array.from({length: 5}, (_, i) => i + 1).map(s => ({ value: String(s), label: `Buổi ${s}` }))}
          />
          <button 
            onClick={handleExportExcel}
            className="btn btn-phu whitespace-nowrap border-cam text-camDam hover:bg-camNhat"
          >
            Xuất Excel
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="btn btn-chinh whitespace-nowrap"
          >
            {saving ? 'Đang lưu...' : 'Lưu Điểm Danh'}
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Đang tải danh sách học sinh...</div>
        ) : !attendanceData || attendanceData.records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Chưa có học sinh nào trong lớp.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-vutruNhat min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 font-semibold text-gray-900">Học sinh</th>
                <th className="px-4 sm:px-6 py-4 font-semibold text-gray-900 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceData.records.map(student => {
                const currentStatus = localRecords[student.studentId];
                return (
                  <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          fullName={student.studentName}
                          avatarUrl={student.avatarUrl}
                          size="md"
                          className="w-10 h-10 font-bold"
                        />
                        <span className="font-medium text-gray-900 text-base">{student.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                        <button
                          onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                          className={`px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition-colors border ${
                            currentStatus === 'PRESENT' 
                              ? 'bg-green-100 text-green-700 border-green-200 shadow-sm' 
                              : 'bg-white text-vutruNhat border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Có mặt
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.studentId, 'ABSENT_EXCUSED')}
                          className={`px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition-colors border ${
                            currentStatus === 'ABSENT_EXCUSED' 
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200 shadow-sm' 
                              : 'bg-white text-vutruNhat border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Vắng phép
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.studentId, 'ABSENT_UNEXCUSED')}
                          className={`px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition-colors border ${
                            currentStatus === 'ABSENT_UNEXCUSED' 
                              ? 'bg-red-100 text-red-700 border-red-200 shadow-sm' 
                              : 'bg-white text-vutruNhat border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          Vắng K.phép
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassAttendance;
