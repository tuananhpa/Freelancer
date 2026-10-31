import React, { useEffect, useState } from 'react';
import { auditApi, AuditLog } from '../../services/auditApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/ui/Pagination';

import Portal from '../../components/ui/Portal';
import PageHeader from '../../components/ui/PageHeader';
import { ScrollText } from 'lucide-react';
const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await auditApi.getLogs(page);
      setLogs(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Không thể tải lịch sử kiểm toán');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <PageHeader
        icon={ScrollText}
        title="Nhật ký hệ thống"
        subtitle="Tra cứu ai đã thao tác gì, lúc nào trong hệ thống."
        actions={<Button onClick={fetchLogs} isLoading={isLoading}>Làm mới</Button>}
      />

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-kem border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold text-vutru">Thời gian</th>
                <th className="p-4 font-bold text-vutru">Người dùng</th>
                <th className="p-4 font-bold text-vutru">Hành động</th>
                <th className="p-4 font-bold text-vutru">Thực thể</th>
                <th className="p-4 font-bold text-vutru">ID</th>
                <th className="p-4 font-bold text-vutru">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="p-4 text-sm font-medium">{log.userEmail}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{log.entityName}</td>
                  <td className="p-4 text-xs font-mono text-vutruNhat">{log.entityId.substring(0, 8)}...</td>
                  <td className="p-4 text-sm">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="text-cam font-bold hover:underline"
                    >
                      Xem JSON
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-vutruNhat">Không có dữ liệu kiểm toán.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* JSON Viewer Modal */}
      {selectedLog && (
        <Portal><div className="fixed inset-0 z-50 flex items-center justify-center bg-vutru/50 p-4">
          <Card className="w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chi tiết thay đổi</h2>
              <button onClick={() => setSelectedLog(null)} className="text-vutruNhat hover:text-red-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold text-vutruNhat mb-2">Trạng thái cũ</h3>
                <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto border border-gray-200">
                  {selectedLog.previousState ? JSON.stringify(selectedLog.previousState, null, 2) : 'null'}
                </pre>
              </div>
              <div>
                <h3 className="font-bold text-cam mb-2">Trạng thái mới</h3>
                <pre className="bg-green-50 p-4 rounded-xl text-xs overflow-x-auto border border-green-200">
                  {selectedLog.newState ? JSON.stringify(selectedLog.newState, null, 2) : 'null'}
                </pre>
              </div>
            </div>
          </Card>
        </div></Portal>
      )}
    </div>
  );
};

export default AuditLogs;
