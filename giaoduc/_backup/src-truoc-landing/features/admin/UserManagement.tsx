import React, { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../../services/adminApi';
import { studentProfileApi } from '../../services/studentProfileApi';
import { formatShortDate } from '../../utils/dateUtils';
import { getApiErrorMessage } from '../../services/api';
import { validateEmailSyntax } from '../../utils/validators';
import Select from '../../components/ui/Select';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { User } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TableContainer } from '../../components/ui/TableContainer';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { TableActions, TableAction } from '../../components/ui/TableActions';
import { TablePagination } from '../../components/ui/TablePagination';
import Alert from '../../components/ui/Alert';
import { UserPlus, ArrowUp, ArrowDown, Eye, Edit, Trash2, KeyRound, GraduationCap, CheckSquare, Square, Search, X, Check } from 'lucide-react';
import { FilterBar, FilterField, ActiveFilter } from '../../components/ui/FilterBar';
import { useToast } from '../../context/ToastContext';

import Portal from '../../components/ui/Portal';
import PageHeader from '../../components/ui/PageHeader';
import { UsersRound } from 'lucide-react';
const UserManagement = () => {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const userFilterFields: FilterField[] = [
    { key: 'search', label: 'Tên/Email/SĐT', type: 'text' },
    { 
      key: 'role', 
      label: 'Vai trò', 
      type: 'select',
      options: [
        { value: 'STUDENT', label: 'Học sinh' },
        { value: 'TEACHER', label: 'Giáo viên' },
        { value: 'TEACHING_ASSISTANT', label: 'Trợ giảng' },
        { value: 'OFFICE', label: 'Văn phòng' },
        { value: 'ADMIN', label: 'Admin' }
      ]
    },
    { 
      key: 'status', 
      label: 'Trạng thái', 
      type: 'select',
      options: [
        { value: 'ACTIVE', label: 'ACTIVE' },
        { value: 'INACTIVE', label: 'INACTIVE' },
        { value: 'BANNED', label: 'BANNED' }
      ]
    }
  ];

  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Details modal state
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [teacherAssignedClasses, setTeacherAssignedClasses] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Assign teacher classrooms modal state
  const [assigningTeacher, setAssigningTeacher] = useState<User | null>(null);
  const [assigningClassIds, setAssigningClassIds] = useState<string[]>([]);
  const [assigningSearch, setAssigningSearch] = useState('');
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  // Create teacher modal state
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'TEACHER' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const [allClassrooms, setAllClassrooms] = useState<any[]>([]);
  const [editingUserClassrooms, setEditingUserClassrooms] = useState<string[]>([]);

  // Edit student code modal state
  const [editingStudentCodeUser, setEditingStudentCodeUser] = useState<User | null>(null);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [editingStudentCodeLoading, setEditingStudentCodeLoading] = useState(false);
  const [editingStudentCodeError, setEditingStudentCodeError] = useState('');

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, activeFilters, sortField, sortDirection, pageSize]);

  useEffect(() => {
    fetchAllClassrooms();
  }, []);

  const fetchAllClassrooms = async () => {
    try {
      const data = await adminApi.getAllClassrooms();
      setAllClassrooms(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lớp học:', error);
    }
  };

  const handleOpenAssignTeacherModal = async (u: User) => {
    setAssigningTeacher(u);
    setAssigningSearch('');
    setAssigningLoading(true);
    try {
      const classIds = await adminApi.getUserClassrooms(u.id);
      setAssigningClassIds(classIds);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lớp học của giáo viên:', error);
      setAssigningClassIds([]);
      toast.error('Không thể tải danh sách lớp học của giáo viên.');
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleSaveTeacherClassrooms = async () => {
    if (!assigningTeacher) return;
    try {
      setSavingAssign(true);
      await adminApi.updateUserClassrooms(assigningTeacher.id, assigningClassIds);
      toast.success(`Đã cập nhật phân công ${assigningClassIds.length} lớp cho ${assigningTeacher.fullName}`);
      setAssigningTeacher(null);
    } catch (error: any) {
      console.error('Lỗi khi cập nhật phân công lớp học:', error);
      toast.error(getApiErrorMessage(error, 'Cập nhật phân công lớp học thất bại.'));
    } finally {
      setSavingAssign(false);
    }
  };

  const filteredAssignClassrooms = useMemo(() => {
    if (!assigningSearch.trim()) return allClassrooms;
    const q = assigningSearch.toLowerCase().trim();
    return allClassrooms.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.section && c.section.toLowerCase().includes(q)) ||
      (c.inviteCode && c.inviteCode.toLowerCase().includes(q)) ||
      (c.teacherName && c.teacherName.toLowerCase().includes(q))
    );
  }, [allClassrooms, assigningSearch]);

  const handleViewClick = async (u: User) => {
    setViewingUser(u);
    setTeacherAssignedClasses([]);
    if (u.role === 'STUDENT') {
      try {
        setDetailsLoading(true);
        const details = await studentProfileApi.getProfileByUserId(u.id);
        setStudentDetails(details);
      } catch (error) {
        console.error('Lỗi tải thông tin học sinh:', error);
        setStudentDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    } else if (u.role === 'TEACHER' || u.role === 'TEACHING_ASSISTANT') {
      try {
        setDetailsLoading(true);
        const classIds = await adminApi.getUserClassrooms(u.id);
        const assigned = allClassrooms.filter(c => classIds.includes(c.id));
        setTeacherAssignedClasses(assigned);
      } catch (error) {
        console.error('Lỗi tải lớp học giáo viên:', error);
        setTeacherAssignedClasses([]);
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  const handleEditClick = async (u: User) => {
    setEditingUser({ ...u }); // copy object
    setEditingPassword('');
    if (['STUDENT', 'TEACHER', 'TEACHING_ASSISTANT'].includes(u.role)) {
      try {
        const classIds = await adminApi.getUserClassrooms(u.id);
        setEditingUserClassrooms(classIds);
      } catch (error) {
        console.error('Lỗi khi tải lớp học của người dùng:', error);
        setEditingUserClassrooms([]);
      }
    } else {
      setEditingUserClassrooms([]);
    }
  };

  const fetchUsers = async (page: number) => {
    try {
      setLoading(true);
      const sortParam = `${sortField},${sortDirection}`;
      
      const searchVal = activeFilters.find(f => f.field === 'search')?.value || '';
      const roleVal = activeFilters.find(f => f.field === 'role')?.value || '';
      const statusVal = activeFilters.find(f => f.field === 'status')?.value || '';

      const data = await adminApi.getAllUsers(page, pageSize, searchVal, roleVal, statusVal, sortParam);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setSelectedUserIds(new Set()); // Reset selection when fetching new data
    } catch (error) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
    } finally {
      setLoading(false);
    }
  };

  const [editingPassword, setEditingPassword] = useState('');

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const emailError = validateEmailSyntax(editingUser.email);
    if (emailError) { toast.warning(emailError); return; }
    
    try {
      await adminApi.updateUser(editingUser.id, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        phone: editingUser.phone,
        password: editingPassword || undefined,
        role: editingUser.role,
        status: editingUser.status
      });
      if (['STUDENT', 'TEACHER', 'TEACHING_ASSISTANT'].includes(editingUser.role)) {
        await adminApi.updateUserClassrooms(editingUser.id, editingUserClassrooms);
      }
      setEditingUser(null);
      fetchUsers(currentPage);
      toast.success('Cập nhật người dùng thành công.');
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      toast.error('Cập nhật thất bại.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    const confirmed = await toast.confirm(
      'Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này? Thao tác này sẽ xóa toàn bộ dữ liệu liên quan và không thể hoàn tác.',
      {
        title: 'Xác nhận xóa vĩnh viễn',
        confirmLabel: 'Xóa vĩnh viễn',
      }
    );
    if (!confirmed) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('Đã xóa người dùng');
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error);
      toast.error('Xóa thất bại. Có thể do ràng buộc dữ liệu liên quan.');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkUpdateStatus = async (status: 'ACTIVE' | 'BANNED' | 'INACTIVE') => {
    if (selectedUserIds.size === 0) return;
    const actionText = status === 'BANNED' ? 'cấm' : status === 'ACTIVE' ? 'mở khóa' : 'vô hiệu hóa';
    const confirmed = await toast.confirm(
      `Bạn có chắc chắn muốn ${actionText} ${selectedUserIds.size} người dùng đã chọn?`,
      {
        title: `Xác nhận ${actionText} hàng loạt`,
        confirmLabel: 'Xác nhận',
      }
    );
    if (!confirmed) return;
    try {
      setLoading(true);
      await adminApi.bulkUpdateStatus(Array.from(selectedUserIds), status);
      toast.success(`Đã ${actionText} ${selectedUserIds.size} người dùng thành công!`);
      fetchUsers(currentPage);
      setSelectedUserIds(new Set());
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái hàng loạt:', error);
      toast.error('Thao tác hàng loạt thất bại.');
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    
    const emailError = validateEmailSyntax(teacherForm.email);
    if (emailError) { setCreateError(emailError); return; }
    
    if (teacherForm.password.length < 6) { setCreateError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }
    setCreateLoading(true);
    try {
      await adminApi.createUser({
        fullName: teacherForm.fullName,
        email: teacherForm.email,
        phone: teacherForm.phone || undefined,
        password: teacherForm.password,
        role: teacherForm.role as any,
        status: 'ACTIVE' as any,
        authProvider: 'LOCAL' as any,
      });
      setCreateSuccess('Tạo tài khoản thành công!');
      setTeacherForm({ fullName: '', email: '', phone: '', password: '', role: 'TEACHER' });
      fetchUsers(currentPage);
    } catch (err: any) {
      setCreateError(getApiErrorMessage(err, 'Tạo tài khoản thất bại. Email có thể đã tồn tại.'));
    } finally {
      setCreateLoading(false);
    }
  };

    const getRoleBadge = (role: string) => {
      switch (role) {
        case 'ADMIN': return <Badge variant="danger">ADMIN</Badge>;
        case 'TEACHER': return <Badge variant="primary">GIÁO VIÊN</Badge>;
        case 'TEACHING_ASSISTANT': return <Badge variant="info">TRỢ GIẢNG</Badge>;
        case 'STUDENT': return <Badge variant="success">HỌC SINH</Badge>;
        case 'OFFICE': return <Badge variant="warning">VĂN PHÒNG</Badge>;
        default: return <Badge variant="neutral">UNASSIGNED</Badge>;
      }
    };

    const getStatusBadge = (status?: string) => {
      switch (status) {
        case 'ACTIVE': return <StatusBadge status="active">ACTIVE</StatusBadge>;
        case 'INACTIVE': return <StatusBadge status="warning">INACTIVE</StatusBadge>;
        case 'BANNED': return <StatusBadge status="danger">BANNED</StatusBadge>;
        default: return <StatusBadge status="neutral">UNKNOWN</StatusBadge>;
      }
    };

    const handleSort = (field: string) => {
      if (sortField === field) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    };

    const renderSortIcon = (field: string) => {
      if (sortField !== field) return null;
      return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

  return (
    <div className="h-full flex flex-col min-h-0 max-w-7xl mx-auto w-full">
      <PageHeader
        className="mb-6 shrink-0"
        icon={UsersRound}
        title="Quản lý người dùng"
        subtitle="Xem và phân quyền cho người dùng trong hệ thống."
        actions={
          <Button variant="primary" onClick={() => { setShowCreateTeacher(true); setCreateError(''); setCreateSuccess(''); }}>
            <UserPlus size={18} className="mr-2" />
            Tạo tài khoản mới
          </Button>
        }
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4 bg-white dark:bg-night-surface p-4 sm:p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-night-border items-center justify-between shrink-0">
        <div className="w-full">
          <FilterBar 
            fields={userFilterFields}
            activeFilters={activeFilters}
            onChange={(newFilters) => {
              setActiveFilters(newFilters);
              setCurrentPage(0);
            }}
          />
        </div>
      </div>

      {selectedUserIds.size > 0 && (
        <div className="mb-4 p-4 bg-primary/10 dark:bg-primary/20 border-2 border-primary/20 rounded-2xl flex items-center justify-between animate-fade-in">
          <div className="text-primary font-bold">
            Đã chọn {selectedUserIds.size} người dùng
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => handleBulkUpdateStatus('ACTIVE')}>Mở khóa</Button>
            <Button variant="danger" size="sm" onClick={() => handleBulkUpdateStatus('BANNED')}>Cấm tài khoản</Button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-night-surface rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-night-border overflow-hidden">
        <TableContainer className="flex-1 min-h-0 !border-0 !shadow-none !rounded-none">
          <Table className="min-w-[800px]">
          <Thead>
            <Tr>
              <Th className="w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={users.length > 0 && selectedUserIds.size === users.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </Th>
              <Th className="w-16 text-center">STT</Th>
              <Th>Mã HS</Th>
              <Th className="cursor-pointer hover:text-cam transition-colors select-none" onClick={() => handleSort('fullName')}>
                <div className="flex items-center gap-1">Tên {renderSortIcon('fullName')}</div>
              </Th>
              <Th className="cursor-pointer hover:text-cam transition-colors select-none" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-1">Email {renderSortIcon('email')}</div>
              </Th>
              <Th className="cursor-pointer hover:text-cam transition-colors select-none" onClick={() => handleSort('role')}>
                <div className="flex items-center gap-1">Vai trò {renderSortIcon('role')}</div>
              </Th>
              <Th className="cursor-pointer hover:text-cam transition-colors select-none" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Trạng thái {renderSortIcon('status')}</div>
              </Th>
              <Th className="text-center">Đăng nhập</Th>
              <Th className="text-right">Thao tác</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan={9} className="py-10 text-center text-gray-500">
                  <LoadingOverlay text="Đang tải dữ liệu..." />
                </Td>
              </Tr>
            ) : users.length === 0 ? (
              <Tr>
                <Td colSpan={9} className="py-10 text-center text-gray-500">Chưa có người dùng nào.</Td>
              </Tr>
            ) : (
              users.map((u, index) => (
                <Tr key={u.id}>
                  <Td className="text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedUserIds.has(u.id)}
                      onChange={() => handleSelectUser(u.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </Td>
                  <Td className="text-center font-medium text-gray-400">{currentPage * pageSize + index + 1}</Td>
                  <Td className="font-mono font-bold text-cam">{u.studentCode || <span className="text-gray-300 font-normal">-</span>}</Td>
                  <Td className="font-bold text-gray-800 dark:text-gray-200">{u.fullName}</Td>
                  <Td className="text-gray-500">{u.email}</Td>
                  <Td>{getRoleBadge(u.role)}</Td>
                  <Td>{getStatusBadge(u.status)}</Td>
                  <Td className="text-center text-gray-500 text-xs font-bold uppercase">{u.authProvider}</Td>
                  <Td className="text-right">
                    <TableActions>
                      <TableAction icon={Eye} label="Xem chi tiết" onClick={() => handleViewClick(u)} />
                      {(u.role === 'TEACHER' || u.role === 'TEACHING_ASSISTANT') && (
                        <TableAction 
                          icon={GraduationCap} 
                          label="Phân công lớp giảng dạy" 
                          variant="primary" 
                          onClick={() => handleOpenAssignTeacherModal(u)} 
                        />
                      )}
                      {u.role === 'STUDENT' && (
                        <TableAction icon={KeyRound} label="Chỉnh sửa mã học sinh" onClick={() => {
                          setEditingStudentCodeUser(u);
                          setNewStudentCode(u.studentCode || '');
                          setEditingStudentCodeError('');
                        }} />
                      )}
                      <TableAction icon={Edit} label="Sửa" variant="primary" onClick={() => handleEditClick(u)} />
                      <TableAction icon={Trash2} label="Xóa" variant="danger" onClick={() => handleDeleteUser(u.id)} />
                    </TableActions>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
        </TableContainer>

        {users.length > 0 && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-surface/50">
            <TablePagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalElements={totalPages * pageSize} // Estimate since we don't have total elements in standard pageable response without full object, but users usually have it if mapped. The original uses totalPages only. Wait, original didn't pass totalElements, but TablePagination requires it. I will leave it undefined if it's optional, or use `users.length` or `totalPages*pageSize`. Actually, I'll update TablePagination to make totalElements optional, or just pass a placeholder string/number. Wait, I added totalElements to TablePagination in `TablePagination.tsx`. Let's pass undefined and I will check `TablePagination.tsx`. Let's pass `totalPages * pageSize`.
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(0);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </div>

      {editingUser && (
        <Portal><div className="fixed inset-0 z-[100] bg-vutru/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in relative">
            <h2 className="text-2xl font-bold text-vutru font-heading mb-6">Sửa người dùng</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Tên</label>
                <input 
                  type="text" 
                  value={editingUser.fullName || ''} 
                  onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Email</label>
                <input 
                  type="email" 
                  value={editingUser.email || ''} 
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none transition-colors" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Số điện thoại</label>
                <input 
                  type="text" 
                  value={editingUser.phone || ''} 
                  onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none transition-colors" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Mật khẩu mới (Tùy chọn)</label>
                <input 
                  type="password" 
                  value={editingPassword}
                  onChange={(e) => setEditingPassword(e.target.value)}
                  placeholder="Để trống nếu không muốn đổi mật khẩu"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none transition-colors" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Vai trò</label>
                <Select
                  value={editingUser.role}
                  onChange={(v) => setEditingUser({...editingUser, role: v as any})}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-night-border focus:outline-none theme-input-focus"
                  options={[
                    { value: 'UNASSIGNED', label: 'UNASSIGNED' },
                    { value: 'STUDENT', label: 'STUDENT' },
                    { value: 'TEACHER', label: 'TEACHER' },
                    { value: 'TEACHING_ASSISTANT', label: 'TEACHING_ASSISTANT' },
                    { value: 'OFFICE', label: 'OFFICE' },
                    { value: 'ADMIN', label: 'ADMIN' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Trạng thái</label>
                <Select
                  value={editingUser.status || 'ACTIVE'}
                  onChange={(v) => setEditingUser({...editingUser, status: v as any})}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-night-border focus:outline-none theme-input-focus"
                  options={[
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'INACTIVE', label: 'INACTIVE' },
                    { value: 'BANNED', label: 'BANNED' },
                  ]}
                />
              </div>

              {['STUDENT', 'TEACHER', 'TEACHING_ASSISTANT'].includes(editingUser.role) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-vutruNhat">
                      {editingUser.role === 'STUDENT' ? 'Lớp học tham gia' : 'Lớp học phân công giảng dạy'} ({editingUserClassrooms.length}/{allClassrooms.length})
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUserClassrooms(allClassrooms.map(c => c.id))}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-gray-300 text-xs">|</span>
                      <button
                        type="button"
                        onClick={() => setEditingUserClassrooms([])}
                        className="text-xs font-semibold text-gray-500 hover:underline cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-night-border rounded-xl p-3 bg-gray-50 dark:bg-night-surface space-y-1.5">
                    {allClassrooms.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có lớp học nào trên hệ thống.</p>
                    ) : (
                      allClassrooms.map(c => (
                        <label key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-night-elevated cursor-pointer transition-colors">
                          <input 
                            type="checkbox" 
                            checked={editingUserClassrooms.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingUserClassrooms([...editingUserClassrooms, c.id]);
                              } else {
                                setEditingUserClassrooms(editingUserClassrooms.filter(id => id !== c.id));
                              }
                            }}
                            className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <span className="text-sm text-vutru dark:text-gray-200 font-medium">
                            {c.name} {c.section ? `- ${c.section}` : ''} {c.subject ? `(${c.subject})` : ''}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)} type="button">Hủy</Button>
                <Button variant="primary" type="submit">Lưu thay đổi</Button>
              </div>
            </form>
          </div>
        </div></Portal>
      )}

      {/* Create Teacher Modal */}
      {showCreateTeacher && (
        <Portal><div className="fixed inset-0 z-[100] bg-vutru/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-night-card rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in relative">
            <h2 className="text-2xl font-bold text-vutru font-heading mb-2">Tạo tài khoản mới</h2>
            <p className="text-sm text-vutruNhat mb-6">Tài khoản sẽ được kích hoạt ngay và có thể đăng nhập bằng email.</p>
            {createError && <Alert variant="error" className="mb-4">{createError}</Alert>}
            {createSuccess && <Alert variant="success" className="mb-4">{createSuccess}</Alert>}
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Họ tên *</label>
                <input
                  type="text"
                  value={teacherForm.fullName}
                  onChange={e => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-night-border focus:outline-none theme-input-focus dark:bg-night-surface dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Email *</label>
                <input
                  type="email"
                  value={teacherForm.email}
                  onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  placeholder="teacher@example.com"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-night-border focus:outline-none theme-input-focus dark:bg-night-surface dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  value={teacherForm.phone}
                  onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                  placeholder="0912 345 678"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-night-border focus:outline-none theme-input-focus dark:bg-night-surface dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Vai trò *</label>
                <Select
                  value={teacherForm.role}
                  onChange={v => setTeacherForm({ ...teacherForm, role: v })}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-night-border focus:outline-none theme-input-focus dark:bg-night-surface dark:text-white"
                  options={[
                    { value: 'TEACHER', label: 'Giáo viên (TEACHER)' },
                    { value: 'TEACHING_ASSISTANT', label: 'Trợ giảng (TEACHING_ASSISTANT)' },
                    { value: 'STUDENT', label: 'Học sinh (STUDENT)' },
                    { value: 'OFFICE', label: 'Văn phòng (OFFICE)' },
                    { value: 'ADMIN', label: 'Quản trị viên (ADMIN)' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Mật khẩu *</label>
                <input
                  type="password"
                  value={teacherForm.password}
                  onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-night-border focus:outline-none theme-input-focus dark:bg-night-surface dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateTeacher(false)} type="button">Hủy</Button>
                <Button variant="primary" type="submit" isLoading={createLoading}>Tạo tài khoản</Button>
              </div>
            </form>
          </div>
        </div></Portal>
      )}

      {/* Edit Student Code Modal */}
      {editingStudentCodeUser && (
        <Portal><div className="fixed inset-0 z-[100] bg-vutru/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-night-card rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in relative">
            <h2 className="text-2xl font-bold text-vutru font-heading mb-6">Chỉnh sửa mã học sinh</h2>
            
            <div className="mb-4 space-y-2">
              <p className="text-sm">Học sinh: <span className="font-bold">{editingStudentCodeUser.fullName}</span></p>
              <p className="text-sm">Email: <span className="font-bold">{editingStudentCodeUser.email}</span></p>
              <p className="text-sm">Mã học sinh hiện tại: <span className="font-bold font-mono text-cam">{editingStudentCodeUser.studentCode || 'Chưa có'}</span></p>
            </div>

            {editingStudentCodeError && <Alert variant="error" className="mb-4">{editingStudentCodeError}</Alert>}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setEditingStudentCodeError('');
              const trimmed = newStudentCode.trim();
              if (!trimmed) {
                setEditingStudentCodeError('Mã học sinh không được để trống.');
                return;
              }
              if (trimmed === editingStudentCodeUser.studentCode) {
                setEditingStudentCodeUser(null);
                return;
              }
              const confirmed = await toast.confirm(
                `Bạn có chắc muốn thay đổi mã học sinh từ ${editingStudentCodeUser.studentCode || 'trống'} sang ${trimmed} không?`,
                {
                  title: 'Xác nhận đổi mã học sinh',
                  confirmLabel: 'Đổi mã',
                }
              );
              if (!confirmed) return;
              
              setEditingStudentCodeLoading(true);
              try {
                await adminApi.updateStudentCode(editingStudentCodeUser.id, trimmed);
                toast.success('Cập nhật mã học sinh thành công.');
                setEditingStudentCodeUser(null);
                fetchUsers(currentPage);
              } catch (err: any) {
                setEditingStudentCodeError(getApiErrorMessage(err, 'Lỗi khi cập nhật mã học sinh.'));
              } finally {
                setEditingStudentCodeLoading(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-vutruNhat mb-2">Mã học sinh mới</label>
                <input 
                  type="text" 
                  value={newStudentCode} 
                  onChange={(e) => setNewStudentCode(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none transition-colors dark:bg-night-surface dark:border-night-border dark:text-white"
                  placeholder="Nhập mã học sinh mới..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingStudentCodeUser(null)} type="button">Hủy</Button>
                <Button variant="primary" type="submit" isLoading={editingStudentCodeLoading} disabled={!newStudentCode.trim() || newStudentCode.trim() === editingStudentCodeUser.studentCode}>Lưu thay đổi</Button>
              </div>
            </form>
          </div>
        </div></Portal>
      )}

      {/* View Details Modal */}
      {viewingUser && (
        <Portal><div className="fixed inset-0 z-[100] bg-vutru/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-night-card rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-vutru font-heading mb-6">Chi tiết Người dùng</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-100 dark:border-night-border pb-6">
                {viewingUser.avatarUrl ? (
                  <img src={viewingUser.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 dark:bg-night-surface rounded-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                    {viewingUser.fullName?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-vutru">{viewingUser.fullName}</h3>
                  <p className="text-gray-500">{viewingUser.email}</p>
                  <div className="mt-2 flex gap-2">
                    {getRoleBadge(viewingUser.role)}
                    {getStatusBadge(viewingUser.status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Số điện thoại</label>
                  <p className="font-medium text-vutru">{viewingUser.phone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Phương thức đăng nhập</label>
                  <p className="font-medium text-vutru">{viewingUser.authProvider}</p>
                </div>
              </div>

              {viewingUser.role === 'STUDENT' && (
                <div className="mt-6 border-t border-gray-100 dark:border-night-border pt-6">
                  <h4 className="text-lg font-bold text-vutru mb-4">Hồ sơ Học sinh</h4>
                  {detailsLoading ? (
                    <LoadingOverlay text="Đang tải hồ sơ..." />
                  ) : studentDetails ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Mã số học sinh</label>
                          <p className="font-medium text-vutru bg-gray-50 dark:bg-night-surface px-3 py-1 rounded inline-block">{studentDetails.studentCode}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Cơ sở</label>
                          <p className="font-medium text-vutru">{studentDetails.facility || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 block mb-1">Ngày sinh</label>
                          <p className="font-medium text-vutru">
                            {formatShortDate(studentDetails.dateOfBirth)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-500 block mb-2">Các lớp đang tham gia ({studentDetails.enrollments?.length || 0})</label>
                        {studentDetails.enrollments?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {studentDetails.enrollments.map((e: any) => (
                              <Badge key={e.classroomId} variant="neutral">{e.classroomName}</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">Chưa tham gia lớp học nào.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Alert variant="warning">Không tìm thấy hồ sơ học sinh cho tài khoản này.</Alert>
                  )}
                </div>
              )}

              {(viewingUser.role === 'TEACHER' || viewingUser.role === 'TEACHING_ASSISTANT') && (
                <div className="mt-6 border-t border-gray-100 dark:border-night-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-vutru">Lớp học phân công giảng dạy ({teacherAssignedClasses.length})</h4>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        const target = viewingUser;
                        setViewingUser(null);
                        setTeacherAssignedClasses([]);
                        handleOpenAssignTeacherModal(target);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <GraduationCap size={15} />
                      <span>Phân công lại</span>
                    </Button>
                  </div>
                  {detailsLoading ? (
                    <LoadingOverlay text="Đang tải danh sách lớp..." />
                  ) : teacherAssignedClasses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {teacherAssignedClasses.map((c: any) => (
                        <Badge key={c.id} variant="neutral">
                          {c.name} {c.section ? `(${c.section})` : ''} {c.subject ? `• ${c.subject}` : ''}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Chưa được phân công phụ trách lớp học nào.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100 dark:border-night-border">
              <Button variant="outline" onClick={() => { setViewingUser(null); setStudentDetails(null); setTeacherAssignedClasses([]); }}>Đóng</Button>
            </div>
          </div>
        </div></Portal>
      )}

      {/* Assign Teacher Classrooms Modal */}
      {assigningTeacher && (
        <Portal><div className="fixed inset-0 z-[100] bg-vutru/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-night-card rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl animate-fade-in relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-night-border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cam/10 text-cam rounded-2xl">
                  <GraduationCap size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-vutru font-heading">Phân công lớp giảng dạy</h2>
                    {getRoleBadge(assigningTeacher.role)}
                  </div>
                  <p className="text-sm text-vutruNhat">
                    {assigningTeacher.fullName} • <span className="font-mono text-gray-500">{assigningTeacher.email}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAssigningTeacher(null)} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-night-surface transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 flex flex-col py-4 space-y-4">
              {/* Instructions and Stats */}
              <div className="bg-cam/5 dark:bg-cam/10 border border-cam/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-vutru dark:text-gray-200">
                    Phân công vào tất cả các lớp hoặc tích chọn từng lớp
                  </p>
                  <p className="text-xs text-vutruNhat mt-0.5">
                    Tài khoản được phân công sẽ có toàn quyền xem bài, chấm điểm và tạo tài liệu ở các lớp này.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Badge variant={assigningClassIds.length === allClassrooms.length && allClassrooms.length > 0 ? "success" : "neutral"}>
                    Đã chọn {assigningClassIds.length} / {allClassrooms.length} lớp
                  </Badge>
                </div>
              </div>

              {/* Action Buttons & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={assigningSearch}
                    onChange={(e) => setAssigningSearch(e.target.value)}
                    placeholder="Tìm theo tên lớp, môn học, ca học..."
                    className="w-full pl-9 pr-12 py-2 text-sm rounded-xl border border-gray-200 dark:border-night-border focus:outline-none theme-input-focus dark:bg-night-surface dark:text-white"
                  />
                  {assigningSearch && (
                    <button
                      onClick={() => setAssigningSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = allClassrooms.map(c => c.id);
                      setAssigningClassIds(allIds);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <CheckSquare size={15} />
                    <span>Chọn tất cả ({allClassrooms.length})</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAssigningClassIds([])}
                    className="flex items-center gap-1.5 text-gray-500"
                  >
                    <Square size={15} />
                    <span>Bỏ chọn</span>
                  </Button>
                </div>
              </div>

              {/* Classrooms List */}
              <div className="flex-1 min-h-[220px] max-h-[350px] overflow-y-auto border border-gray-200 dark:border-night-border rounded-2xl p-3 bg-gray-50/50 dark:bg-night-surface/50 space-y-2">
                {assigningLoading ? (
                  <div className="py-12 flex justify-center">
                    <LoadingOverlay text="Đang tải danh sách phân công lớp..." />
                  </div>
                ) : filteredAssignClassrooms.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    {assigningSearch ? 'Không tìm thấy lớp học nào phù hợp với tìm kiếm.' : 'Chưa có lớp học nào trong hệ thống.'}
                  </div>
                ) : (
                  filteredAssignClassrooms.map((cls) => {
                    const isSelected = assigningClassIds.includes(cls.id);
                    const isCurrentPrimary = cls.teacherId === assigningTeacher.id;

                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          setAssigningClassIds(prev => 
                            prev.includes(cls.id) 
                              ? prev.filter(id => id !== cls.id)
                              : [...prev, cls.id]
                          );
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected 
                            ? 'bg-cam/10 border-cam/40 shadow-sm dark:bg-cam/15 dark:border-cam/50' 
                            : 'bg-white dark:bg-night-card border-gray-200/80 dark:border-night-border hover:border-gray-300 dark:hover:border-night-elevated'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by container click
                            className="w-4 h-4 text-cam focus:ring-cam border-gray-300 rounded cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-vutru dark:text-gray-100 truncate">
                                {cls.name}
                              </span>
                              {cls.section && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-night-surface text-gray-600 dark:text-gray-300 font-medium">
                                  {cls.section}
                                </span>
                              )}
                              {cls.subject && (
                                <Badge variant="primary" className="!text-[11px] !py-0.5">
                                  {cls.subject}
                                </Badge>
                              )}
                              {isCurrentPrimary && (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                  GV phụ trách chính
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                              {cls.inviteCode && <span>Mã mời: <strong className="font-mono text-gray-500 dark:text-gray-400">{cls.inviteCode}</strong></span>}
                              {cls.memberCount !== undefined && <span>{cls.memberCount} học sinh</span>}
                              {cls.teacherName && !isCurrentPrimary && (
                                <span className="text-gray-500 truncate">GV: {cls.teacherName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-cam text-white flex items-center justify-center shadow-sm">
                              <Check size={14} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-night-border">
              <span className="text-xs text-gray-400">
                Đã phân công: <strong className="text-cam font-bold">{assigningClassIds.length}</strong> / {allClassrooms.length} lớp
              </span>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setAssigningTeacher(null)} 
                  disabled={savingAssign}
                >
                  Hủy
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveTeacherClassrooms} 
                  isLoading={savingAssign}
                >
                  Lưu phân công ({assigningClassIds.length} lớp)
                </Button>
              </div>
            </div>
          </div>
        </div></Portal>
      )}
    </div>
  );
};

export default UserManagement;
