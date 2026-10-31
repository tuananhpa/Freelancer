import { getApiErrorMessage } from '../../services/api';
import UserAvatar from '../../components/common/UserAvatar';
import Select from '../../components/ui/Select';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { studentProfileApi, StudentProfileInfo } from '../../services/studentProfileApi';
import { adminApi } from '../../services/adminApi';
import classService from '../../services/class.service';
import { formatShortDate } from '../../utils/dateUtils';
import { Loader2, BarChart3, Check, UploadCloud, UserCheck, Search, Users, BookOpen, Plus, Trash2, ChevronRight, ArrowLeft, X, Edit, AlertCircle, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { TableContainer } from '../../components/ui/TableContainer';
import { TableActions, TableAction } from '../../components/ui/TableActions';
import { TablePagination } from '../../components/ui/TablePagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FilterBar, FilterField, ActiveFilter } from '../../components/ui/FilterBar';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';

import Portal from '../../components/ui/Portal';
import PageHeader from '../../components/ui/PageHeader';
import { Database, Layers } from 'lucide-react';
interface ImportResult {
  success: number;
  skipped: number;
  profiles: StudentProfileInfo[];
}

interface AdminGroup {
  id: string;
  name: string;
  section?: string;
  subject?: string;
  teacherId?: string;
  teacherName?: string;
  teacherAvatar?: string;
  memberCount: number;
  isAdminGroup: boolean;
  createdAt: string;
}

export default function StudentImport({ defaultTab = 'import' }: { defaultTab?: 'import' | 'classes' }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OFFICE';

  // Tab state
  const [activeTab, setActiveTab] = useState<'import' | 'classes'>(defaultTab);
  const [showImportForm, setShowImportForm] = useState(false);
  const [activeStudentFilters, setActiveStudentFilters] = useState<ActiveFilter[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // ===================== TAB 1: IMPORT =====================
  const [file, setFile] = useState<File | null>(null);
  const [classroomId, setClassroomId] = useState('');
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===================== PREVIEW STATE =====================
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Saved students list state
  const [savedStudents, setSavedStudents] = useState<StudentProfileInfo[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedPage, setSavedPage] = useState(0);
  const [savedSize, setSavedSize] = useState(15);
  const [savedTotalPages, setSavedTotalPages] = useState(0);
  const [savedTotal, setSavedTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // ===================== EDIT/DELETE STUDENT STATE =====================
  const [editingStudent, setEditingStudent] = useState<StudentProfileInfo | null>(null);
  const [editForm, setEditForm] = useState({
    studentCode: '',
    fullName: '',
    dateOfBirth: '',
    phone: '',
    facility: '',
    classroomIds: [] as string[]
  });
  const [savingStudent, setSavingStudent] = useState(false);
  const [editError, setEditError] = useState('');
  
  const [deletingStudent, setDeletingStudent] = useState<StudentProfileInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // ===================== TAB 2: CLASSES =====================
  const [adminGroups, setAdminGroups] = useState<AdminGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupSection, setEditGroupSection] = useState('');
  const [editGroupSubject, setEditGroupSubject] = useState('');
  const [editGroupTeacherId, setEditGroupTeacherId] = useState('');
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [updateGroupError, setUpdateGroupError] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);

  // View students in a selected class
  const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);
  const [groupStudents, setGroupStudents] = useState<StudentProfileInfo[]>([]);
  const [loadingGroupStudents, setLoadingGroupStudents] = useState(false);
  
  // Group Filters
  const [classSearch, setClassSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [classPage, setClassPage] = useState(0);
  const [classPageSize, setClassPageSize] = useState(10);
  const [groupStudentSearch, setGroupStudentSearch] = useState('');
  const [groupStudentStatus, setGroupStudentStatus] = useState('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Delete confirmation
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Manual Add Student
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    studentCode: '',
    fullName: '',
    dateOfBirth: '',
    phone: '',
    facility: ''
  });
  const [addingStudent, setAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState('');

  // ===================== EFFECTS =====================
  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/admin/users?role=TEACHER&size=1000', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.content || []);
      }
    } catch (e) {
      console.error('Lỗi lấy ds giáo viên', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'classes' && adminGroups.length === 0) {
      fetchAdminGroups();
      fetchTeachers();
    }
  }, [activeTab]);

  // Form import can danh sach lop ngay tu dau - truoc day admin phai mo tab
  // "Quan ly lop hoc" truoc, con giao vien thi khong bao gio duoc tai.
  useEffect(() => {
    if (isAdmin) fetchAdminGroups();
    else fetchMyClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    const classId = searchParams.get('classId');
    if (activeTab === 'classes' && adminGroups.length > 0) {
      if (!classId && selectedGroup) {
        setSelectedGroup(null);
      } else if (classId && (!selectedGroup || selectedGroup.id !== classId)) {
        const group = adminGroups.find(g => g.id === classId);
        if (group) {
          fetchGroupStudents(group);
        }
      }
    }
  }, [searchParams, adminGroups, activeTab]);

  const fetchSavedStudents = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const keyword = activeStudentFilters.find(f => f.field === 'keyword')?.value;
      const filters = {
        className: activeStudentFilters.find(f => f.field === 'className')?.value,
        facility: activeStudentFilters.find(f => f.field === 'facility')?.value,
        status: activeStudentFilters.find(f => f.field === 'status')?.value,
        teacherName: activeStudentFilters.find(f => f.field === 'teacherName')?.value,
        fromDate: activeStudentFilters.find(f => f.field === 'dateOfBirth_from')?.value,
        toDate: activeStudentFilters.find(f => f.field === 'dateOfBirth_to')?.value,
      };

      const res = await studentProfileApi.getStudents(keyword || searchKeyword || undefined, savedPage, savedSize, filters);
      setSavedStudents(res.content || []);
      setSavedTotalPages(res.totalPages || 0);
      setSavedTotal(res.totalElements || 0);
    } catch (err) {
      console.error('Error fetching saved students:', err);
    } finally {
      setLoadingSaved(false);
    }
  }, [savedPage, savedSize, searchKeyword, activeStudentFilters]);

  useEffect(() => {
    fetchSavedStudents();
  }, [fetchSavedStudents]);

  const fetchMyClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await classService.getMyClasses();
      const list = res?.data?.content || res?.content || [];
      setClassrooms(list.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleBulkStatusUpdate = async (status: 'ACTIVE' | 'BANNED') => {
    if (selectedUserIds.length === 0) return;
    try {
      await adminApi.bulkUpdateStatus(selectedUserIds, status);
      toast.success(`Đã ${status === 'ACTIVE' ? 'mở khóa' : 'khóa'} ${selectedUserIds.length} tài khoản thành công!`);
      setSelectedUserIds([]);
      if (selectedGroup) fetchGroupStudents(selectedGroup);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi cập nhật trạng thái'));
    }
  };

  const fetchAdminGroups = async () => {
    setLoadingGroups(true);
    try {
      const data = await adminApi.getAdminGroups();
      const list = data?.data || data || [];
      setAdminGroups(list);
      setClassrooms(list.map((g: AdminGroup) => ({ id: g.id, name: g.name })));
    } catch (err) {
      console.error('Error fetching admin groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchGroupStudents = async (group: AdminGroup) => {
    setSelectedGroup(group);
    setLoadingGroupStudents(true);
    setSelectedUserIds([]);
    try {
      const data = await adminApi.getStudentsByClassroom(group.id);
      const list = data?.data || data || [];
      setGroupStudents(list);
    } catch (err) {
      console.error('Error fetching group students:', err);
      setGroupStudents([]);
    } finally {
      setLoadingGroupStudents(false);
    }
  };

  // ===================== HANDLERS =====================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
        setError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      setFile(f);
      setError('');
      setResult(null);
    }
  };

  const handlePreview = () => {
    if (!file) { setError('Vui lòng chọn file Excel'); return; }
    if (!isAdmin && !classroomId) { setError('Vui lòng chọn lớp học cần đồng bộ vào'); return; }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });
        const rows = json.slice(1).filter((r: any) => r.length > 0);
        const normalizeDate = (dateStr: string) => {
          if (!dateStr) return '';
          const str = dateStr.trim();
          if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
              const d = parts[0].padStart(2, '0');
              const m = parts[1].padStart(2, '0');
              let y = parts[2];
              if (y.length === 2) {
                y = parseInt(y) < 50 ? '20' + y : '19' + y;
              }
              return `${d}/${m}/${y}`;
            }
          }
          return str;
        };

        const normalizePhone = (phoneStr: string) => {
          if (!phoneStr) return '';
          let str = phoneStr.trim();
          // Remove any non-digit characters just in case, though Excel usually provides digits
          str = str.replace(/[^\d]/g, '');
          if (str.length > 0 && !str.startsWith('0')) {
            str = '0' + str;
          }
          return str;
        };

        const parsedPreview = rows.map((r: any) => {
          const nameCell = String(r[1] || '');
          const parts = nameCell.includes('-') ? nameCell.split('-') : [nameCell, ''];
          return {
            facility: String(r[0] || '').trim(),
            studentCode: parts[0].trim(),
            fullName: parts.length > 1 ? parts.slice(1).join('-').trim() : nameCell.trim(),
            dateOfBirth: r[2] ? normalizeDate(String(r[2])) : '',
            phone: r[3] ? normalizePhone(String(r[3])) : ''
          };
        }).filter((r: any) => r.studentCode && r.fullName);
        
        setPreviewData(parsedPreview);
        setShowPreviewModal(true);
      } catch (err) {
        setError('Lỗi đọc file Excel trên trình duyệt. Vui lòng thử lại.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    setShowPreviewModal(false);
    if (!file) { setError('Vui lòng chọn file Excel'); return; }
    if (!isAdmin && !classroomId) { setError('Vui lòng chọn lớp học cần đồng bộ vào'); return; }

    setLoading(true);
    setError('');
    try {
      let profiles;
      if (isAdmin) {
        const res = await adminApi.importAdminStudents(file, classroomId || undefined);
        profiles = res?.data || res || [];
      } else {
        profiles = await studentProfileApi.importStudents(file, classroomId);
      }
      setResult({ success: profiles.length, skipped: 0, profiles });
      fetchSavedStudents();
      if (isAdmin) fetchAdminGroups();
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Lỗi khi import. Kiểm tra lại định dạng file.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedPage(0);
    setSearchKeyword(searchInput);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateGroupError('');
    if (!newGroupName.trim()) {
      setCreateGroupError('Vui lòng nhập tên lớp');
      return;
    }
    setCreatingGroup(true);
    try {
      const res = await fetch('/api/classes/admin/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDesc.trim(), subject: newGroupSubject.trim() })
      });
      if (!res.ok) throw res;
      // toast.success('Tạo lớp học thành công!');
      fetchAdminGroups();
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupSubject('');
      setShowCreateModal(false);
    } catch (err: any) {
      setCreateGroupError(getApiErrorMessage(err, 'Lỗi khi tạo lớp học'));
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleEditGroupClick = (group: AdminGroup) => {
    setEditingGroup(group);
    setEditGroupName(group.name || '');
    setEditGroupSection(group.section || '');
    setEditGroupSubject(group.subject || '');
    setEditGroupTeacherId(group.teacherId || '');
    setUpdateGroupError('');
    setShowEditModal(true);
    if (teachers.length === 0) fetchTeachers();
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    setUpdateGroupError('');
    if (!editGroupName.trim()) {
      setUpdateGroupError('Vui lòng nhập tên lớp');
      return;
    }
    setUpdatingGroup(true);
    try {
      const res = await fetch(`/api/classes/admin/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          name: editGroupName.trim(),
          section: editGroupSection.trim(),
          subject: editGroupSubject.trim(),
          teacherId: editGroupTeacherId
        })
      });
      if (!res.ok) throw res;
      // toast.success('Cập nhật thông tin lớp thành công!');
      fetchAdminGroups();
      setShowEditModal(false);
    } catch (err: any) {
      setUpdateGroupError(getApiErrorMessage(err, 'Lỗi khi cập nhật lớp học'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    setDeletingGroupId(groupId);
    try {
      await adminApi.deleteAdminGroup(groupId);
      setAdminGroups(prev => prev.filter(g => g.id !== groupId));
      setClassrooms(prev => prev.filter(c => c.id !== groupId));
      if (selectedGroup?.id === groupId) setSelectedGroup(null);
      toast.success('Đã xóa nhóm lớp');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi xóa lớp'));
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingStudent(true);
    setEditError('');
    try {
      let res = await studentProfileApi.updateProfile(editingStudent.id, {
        studentCode: editForm.studentCode.trim(),
        fullName: editForm.fullName.trim(),
        dateOfBirth: editForm.dateOfBirth || undefined,
        phone: editForm.phone.trim(),
        facility: editForm.facility.trim()
      });
      
      const updatedProfile = await studentProfileApi.updateStudentClassrooms(editingStudent.id, editForm.classroomIds);
      res = { ...res, enrollments: updatedProfile.enrollments };

      // Update local state
      setSavedStudents(prev => prev.map(p => p.id === editingStudent.id ? { ...p, ...res } : p));
      if (activeTab === 'classes' && selectedGroup) {
        if (!editForm.classroomIds.includes(selectedGroup.id)) {
          setGroupStudents(prev => prev.filter(p => p.id !== editingStudent.id));
        } else {
          setGroupStudents(prev => prev.map(p => p.id === editingStudent.id ? { ...p, ...res } : p));
        }
      }
      setEditingStudent(null);
      toast.success('Đã cập nhật thông tin học sinh');
    } catch (err: any) {
      setEditError(getApiErrorMessage(err, 'Lỗi khi lưu thông tin'));
    } finally {
      setSavingStudent(false);
    }
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setAddingStudent(true);
    setAddStudentError('');
    try {
      const res = await studentProfileApi.createOrLinkProfile({
        studentCode: addStudentForm.studentCode.trim(),
        fullName: addStudentForm.fullName.trim(),
        dateOfBirth: addStudentForm.dateOfBirth || undefined,
        phone: addStudentForm.phone.trim(),
        facility: addStudentForm.facility.trim(),
        classroomId: selectedGroup.id
      });
      // Update local state
      if (!groupStudents.some(s => s.id === res.id)) {
        setGroupStudents(prev => [res, ...prev]);
        setAdminGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, memberCount: (g.memberCount || 0) + 1 } : g));
      } else {
        setGroupStudents(prev => prev.map(p => p.id === res.id ? { ...p, ...res } : p));
      }
      if (!savedStudents.some(s => s.id === res.id)) {
        setSavedStudents(prev => [res, ...prev]);
        setSavedTotal(prev => prev + 1);
      } else {
        setSavedStudents(prev => prev.map(p => p.id === res.id ? { ...p, ...res } : p));
      }
      setShowAddStudentModal(false);
      setAddStudentForm({ studentCode: '', fullName: '', dateOfBirth: '', phone: '', facility: '' });
      toast.success('Đã thêm học sinh vào lớp');
    } catch (err: any) {
      setAddStudentError(getApiErrorMessage(err, 'Lỗi khi thêm học sinh'));
    } finally {
      setAddingStudent(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await studentProfileApi.deleteProfile(deletingStudent.id);
      setSavedStudents(prev => prev.filter(p => p.id !== deletingStudent.id));
      if (activeTab === 'classes' && selectedGroup) {
        setGroupStudents(prev => prev.filter(p => p.id !== deletingStudent.id));
      }
      setSavedTotal(prev => prev - 1);
      setDeletingStudent(null);
      toast.success('Đã xóa hồ sơ học sinh');
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi xóa học sinh'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteProfiles = async () => {
    if (selectedProfileIds.length === 0) return;
    const confirmed = await toast.confirm(
      `Bạn có chắc chắn muốn xóa ${selectedProfileIds.length} học sinh đã chọn?`,
      {
        title: 'Xác nhận xóa hàng loạt',
        confirmLabel: 'Xóa học sinh',
      }
    );
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      await studentProfileApi.bulkDeleteProfiles(selectedProfileIds);
      setSavedStudents(prev => prev.filter(p => !selectedProfileIds.includes(p.id)));
      if (activeTab === 'classes' && selectedGroup) {
        setGroupStudents(prev => prev.filter(p => !selectedProfileIds.includes(p.id)));
      }
      setSavedTotal(prev => prev - selectedProfileIds.length);
      setSelectedProfileIds([]);
      toast.success(`Đã xóa ${selectedProfileIds.length} học sinh thành công`);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi xóa hàng loạt'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // ===================== FILTERS =====================
  const adminGroupFilterFields: FilterField[] = useMemo(() => {
    // Lấy danh sách Tên lớp duy nhất
    const uniqueClassNames = Array.from(new Set(adminGroups.map(g => g.name))).sort();
    // Lấy danh sách Khối/Phân ban duy nhất
    const uniqueSections = Array.from(new Set(adminGroups.filter(g => g.section).map(g => g.section!))).sort();
    // Lấy danh sách Giáo viên duy nhất
    const uniqueTeachers = Array.from(new Set(adminGroups.filter(g => g.teacherName).map(g => g.teacherName!))).sort();

    return [
      { 
        key: 'name', 
        label: 'Tên lớp', 
        type: uniqueClassNames.length > 0 ? 'select' : 'text',
        options: uniqueClassNames.map(n => ({ value: n, label: n }))
      },
      { 
        key: 'section', 
        label: 'Khối/Phân ban', 
        type: uniqueSections.length > 0 ? 'select' : 'text',
        options: uniqueSections.map(s => ({ value: s, label: s }))
      },
      { 
        key: 'teacherName', 
        label: 'Giáo viên', 
        type: uniqueTeachers.length > 0 ? 'select' : 'text',
        options: uniqueTeachers.map(t => ({ value: t, label: t }))
      },
    ];
  }, [adminGroups]);

  const filteredAdminGroups = useMemo(() => {
    let result = adminGroups;
    if (classSearch.trim()) {
      const q = classSearch.toLowerCase();
      result = result.filter(g => g.name.toLowerCase().includes(q) || (g.section && g.section.toLowerCase().includes(q)));
    }
    
    // Apply active filters
    activeFilters.forEach(filter => {
      const val = filter.value.toLowerCase();
      if (filter.field === 'name') {
        result = result.filter(g => g.name.toLowerCase().includes(val));
      } else if (filter.field === 'section') {
        result = result.filter(g => g.section && g.section.toLowerCase().includes(val));
      } else if (filter.field === 'teacherName') {
        result = result.filter(g => g.teacherName && g.teacherName.toLowerCase().includes(val));
      }
    });

    return result;
  }, [adminGroups, classSearch, activeFilters]);

  const totalClassPages = Math.ceil(filteredAdminGroups.length / classPageSize);
  
  const paginatedAdminGroups = useMemo(() => {
    const start = classPage * classPageSize;
    return filteredAdminGroups.slice(start, start + classPageSize);
  }, [filteredAdminGroups, classPage, classPageSize]);

  useEffect(() => {
    if (classPage >= totalClassPages && totalClassPages > 0) {
      setClassPage(totalClassPages - 1);
    }
  }, [totalClassPages, classPage]);

  const filteredGroupStudents = useMemo(() => {
    let result = groupStudents;
    if (groupStudentSearch.trim()) {
      const q = groupStudentSearch.toLowerCase();
      result = result.filter(s => 
        (s.studentCode && s.studentCode.toLowerCase().includes(q)) || 
        (s.fullName && s.fullName.toLowerCase().includes(q)) || 
        (s.phone && s.phone.includes(q))
      );
    }
    if (groupStudentStatus === 'HAS_ACCOUNT') {
      result = result.filter(s => s.userId);
    } else if (groupStudentStatus === 'NO_ACCOUNT') {
      result = result.filter(s => !s.userId);
    }
    return result;
  }, [groupStudents, groupStudentSearch, groupStudentStatus]);

  // ===================== RENDER =====================
  return (
    <div className="h-full flex flex-col min-h-0 w-full px-2 lg:px-6 mx-auto gap-4">

      {/* Header */}
      <PageHeader
        className="shrink-0"
        icon={activeTab === 'import' ? Database : Layers}
        title={activeTab === 'import' ? 'Học sinh' : 'Quản lý lớp học'}
        subtitle={activeTab === 'import'
          ? 'Quản lý danh sách học sinh và nhập dữ liệu từ file Excel.'
          : 'Tạo và quản lý các lớp học để phân nhóm học sinh.'}
        actions={activeTab === 'import' && (
          <button 
            onClick={() => setShowImportForm(!showImportForm)} 
            className={`btn px-5 py-2.5 rounded-xl text-sm shadow-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
              showImportForm ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-night-elevated dark:hover:bg-night-elevated/80 dark:text-gray-300' : 'btn-chinh'
            }`}
          >
            {showImportForm ? (
              <><X size={18} /> Đóng form</>
            ) : (
              <><Plus size={18} /> Import học sinh</>
            )}
          </button>
        )}
      />

      {/* Tab Navigation — only for admin */}
      {isAdmin && (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-night-elevated rounded-xl w-fit shrink-0">
          <button
            onClick={() => navigate('/admin/students')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                : 'text-gray-500 dark:text-night-muted hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <UploadCloud size={16} />
            Import học sinh
          </button>
          <button
            onClick={() => { navigate('/admin/classes'); fetchAdminGroups(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'classes'
                ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                : 'text-gray-500 dark:text-night-muted hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <BookOpen size={16} />
            Quản lý lớp học
            {adminGroups.length > 0 && (
              <span className="bg-cam/15 text-cam text-xs px-2 py-0.5 rounded-full font-bold">
                {adminGroups.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ==================== TAB 1: IMPORT ==================== */}
      {activeTab === 'import' && (
        <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto pb-2">
          {showImportForm && (
            <div className="flex flex-col gap-5 animate-fade-in shrink-0">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300 space-y-1 relative">
            <p className="font-semibold mb-2">📋 Yêu cầu định dạng file Excel:</p>
            <p>• Cột 1: Cơ sở (VD: Cơ sở 1)</p>
            <p>• Cột 2: Mã số + Tên học sinh (VD: <strong>25110194 - NGUYỄN VĂN A</strong>)</p>
            <p>• Cột 3: Ngày sinh (VD: <strong>14/07/2009</strong>)</p>
            <p>• Cột 4: Số điện thoại</p>
            <p>• Cột 5: Tên lớp học (chỉ để tham khảo, hệ thống sẽ map theo lớp bạn chọn bên dưới)</p>
            <a href="/template_import_student.xlsx" download className="mt-3 bg-white dark:bg-night-surface text-blue-600 dark:text-blue-400 hover:bg-blue-50 border border-blue-200 dark:border-blue-700 px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-2 shadow-sm transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Tải file format mẫu
            </a>
          </div>

          {/* Form */}
          <div className="card flex flex-col gap-5">
            {/* Class selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {isAdmin ? '1. Chọn lớp học để gắn học sinh vào (tùy chọn)' : '1. Chọn lớp học để đồng bộ *'}
              </label>
              {(loadingClasses || loadingGroups) ? (
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />Đang tải danh sách lớp...
                </div>
              ) : (
                <div className="flex gap-3 items-center flex-wrap">
                  <Select
                    value={classroomId}
                    onChange={v => setClassroomId(v)}
                    className="input w-full max-w-sm"
                    options={[
                      { value: '', label: isAdmin ? '-- Không gắn vào lớp nào (import toàn cục) --' : '-- Chọn lớp học --' },
                      ...classrooms.map(c => ({ value: c.id, label: c.name })),
                    ]}
                  />
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => { navigate('/admin/classes'); }}
                      className="text-sm text-cam hover:text-camDam font-semibold flex items-center gap-1 whitespace-nowrap"
                    >
                      <Plus size={15} />Tạo lớp mới
                    </button>
                  )}
                </div>
              )}
              {isAdmin && classroomId && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                  <Check size={12} /> Học sinh sẽ được thêm vào lớp đã chọn (không mất lớp cũ)
                </p>
              )}
              {isAdmin && !classroomId && (
                <p className="text-xs text-gray-400 mt-1.5">Nếu không chọn lớp, học sinh sẽ được import vào hệ thống mà không gắn lớp nào</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {isAdmin ? '2. Chọn file Excel *' : '2. Chọn file Excel *'}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  file ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-night-border hover:border-camDam hover:bg-camNhat/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl text-center">
                    <div className="flex justify-center mb-2"><BarChart3 size={32} className="text-blue-400" /></div>
                    <p className="font-semibold text-green-700 dark:text-green-400">{file.name}</p>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">{(file.size / 1024).toFixed(1)} KB - Click để đổi file</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center mb-3"><UploadCloud size={40} className="text-gray-400" /></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Click để chọn file Excel</p>
                    <p className="text-sm text-gray-400 dark:text-night-muted mt-1">Hỗ trợ .xlsx, .xls</p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">{error}</div>
            )}

            <button
              onClick={handlePreview}
              disabled={loading || !file || (!isAdmin && !classroomId)}
              className="btn btn-chinh w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
              ) : (
                <><Check className="w-5 h-5" /> Bắt đầu Import</>
              )}
            </button>
          </div>

          {/* Import Results */}
          {result && (
            <div className="card flex flex-col gap-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-night-border">
                <UserCheck className="w-8 h-8 text-green-500" />
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">Import thành công!</h2>
                  <p className="text-sm text-gray-500 dark:text-night-muted">
                    Đã xử lý <strong className="text-green-600">{result.success}</strong> học sinh
                    {classroomId
                      ? ' và liên kết vào lớp đã chọn.'
                      : isAdmin ? ' vào hệ thống (không gắn lớp).' : ' và liên kết vào lớp học đã chọn.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          </div>
          )}

          {/* Saved Students List */}
          <div className={`flex-1 flex flex-col ${showImportForm ? 'min-h-[480px]' : 'min-h-0'} bg-white dark:bg-night-surface rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-night-border overflow-hidden`}>
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-night-border shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-cam/10 flex items-center justify-center text-cam">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800 dark:text-white leading-tight">
                    Danh sách học sinh đã lưu
                  </h2>
                  <div className="flex items-center gap-3 mt-0.5">
                    {savedTotal > 0 && <p className="text-sm font-medium text-gray-500">{savedTotal} học sinh</p>}
                    <button
                      onClick={() => {
                        const newFilters = activeStudentFilters.filter(f => f.field !== 'status');
                        newFilters.push({ id: Math.random().toString(36).substring(7), field: 'status', operator: 'eq', value: 'PENDING' });
                        setActiveStudentFilters(newFilters);
                        setSavedPage(0);
                      }}
                      className="text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-colors border text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200"
                      title="Lọc học sinh chưa có tài khoản"
                    >
                      Lọc chưa đăng ký
                    </button>
                    {selectedProfileIds.length > 0 && (
                      <div className="flex items-center gap-2 border-l border-gray-300 dark:border-night-border pl-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Đã chọn {selectedProfileIds.length}</span>
                        <button 
                          onClick={handleBulkDeleteProfiles} 
                          disabled={isBulkDeleting}
                          className="btn border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 text-xs disabled:opacity-50 flex items-center gap-1"
                        >
                          {isBulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Xóa hàng loạt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 p-4 border-b border-gray-100 dark:border-night-border">
              <div className="w-full">
                <FilterBar 
                  fields={[{ key: 'keyword', label: 'Tên/Mã/SĐT', type: 'text' }, { key: 'className', label: 'Tên lớp', type: 'text' }, { key: 'teacherName', label: 'Tên giáo viên', type: 'text' }, { key: 'facility', label: 'Cơ sở', type: 'text' }, { key: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'PENDING', label: 'Chưa đăng ký' }, { value: 'BANNED', label: 'Bị khóa' }] }, { key: 'dateOfBirth', label: 'Ngày sinh', type: 'date_range', fromKey: 'dateOfBirth_from', toKey: 'dateOfBirth_to' }]}
                  activeFilters={activeStudentFilters}
                  onChange={(filters) => {
                    setActiveStudentFilters(filters);
                    setSavedPage(0);
                  }}
                />
              </div>
            </div>

            <TableContainer className="flex-1 min-h-0 !border-0 !shadow-none !rounded-none">
              <Table className="min-w-[800px]">
                <Thead>
                  <Tr>
                    <Th className="w-10 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 w-4 h-4 text-cam focus:ring-cam cursor-pointer"
                        checked={savedStudents.length > 0 && selectedProfileIds.length === savedStudents.length}
                        onChange={e => {
                          if (e.target.checked) setSelectedProfileIds(savedStudents.map(s => s.id));
                          else setSelectedProfileIds([]);
                        }}
                      />
                    </Th>
                    <Th>#</Th>
                    <Th>Mã HS</Th>
                    <Th>Họ tên</Th>
                    <Th>Ngày sinh</Th>
                    <Th>SĐT</Th>
                    <Th>Cơ sở</Th>
                    <Th>Lớp</Th>
                    <Th>Trạng thái</Th>
                    <Th className="text-right">Hành động</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loadingSaved ? (
                    <Tr>
                      <Td colSpan={10} className="text-center text-gray-400 py-8">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Đang tải...
                      </Td>
                    </Tr>
                  ) : savedStudents.length === 0 ? (
                    <Tr>
                      <Td colSpan={10} className="text-center text-gray-400 py-8">
                        {searchKeyword ? 'Không tìm thấy học sinh nào.' : 'Chưa có học sinh nào được import. Hãy upload file Excel ở trên.'}
                      </Td>
                    </Tr>
                  ) : (
                    savedStudents.map((p, i) => (
                      <Tr key={p.id}>
                        <Td className="text-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 w-4 h-4 text-cam focus:ring-cam cursor-pointer"
                            checked={selectedProfileIds.includes(p.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedProfileIds([...selectedProfileIds, p.id]);
                              else setSelectedProfileIds(selectedProfileIds.filter(id => id !== p.id));
                            }}
                          />
                        </Td>
                        <Td className="text-gray-400">{savedPage * savedSize + i + 1}</Td>
                        <Td className="font-mono text-camDam font-semibold">{p.studentCode}</Td>
                        <Td className="font-medium text-gray-800 dark:text-white">{p.fullName}</Td>
                        <Td className="text-gray-600 dark:text-night-muted">{formatShortDate(p.dateOfBirth)}</Td>
                        <Td className="text-gray-500 dark:text-night-muted">{p.phone || '-'}</Td>
                        <Td className="text-gray-500 dark:text-night-muted">{p.facility || '-'}</Td>
                        <Td>
                          {p.enrollments?.length > 0
                            ? (
                              <div className="flex flex-wrap gap-1">
                                {p.enrollments.map(e => (
                                  <span key={e.classroomId} className="text-xs bg-cam/10 text-cam px-2 py-0.5 rounded-full font-medium">
                                    {e.classroomName}
                                  </span>
                                ))}
                              </div>
                            )
                            : <span className="text-gray-300">-</span>
                          }
                        </Td>
                        <Td>
                          {p.userId ? (
                            <StatusBadge status="active">Đã đăng ký</StatusBadge>
                          ) : (
                            <StatusBadge status="warning">Chưa đăng ký</StatusBadge>
                          )}
                        </Td>
                        <Td>
                          <TableActions>
                            <TableAction
                              icon={UserCheck}
                              label={!p.userId ? 'Chưa có tài khoản' : p.userStatus === 'ACTIVE' ? 'Đang hoạt động (Click để khóa)' : 'Đang khóa (Click để kích hoạt)'}
                              variant={!p.userId ? 'neutral' : p.userStatus === 'ACTIVE' ? 'success' : 'danger'}
                              disabled={!p.userId}
                              onClick={async () => {
                                if (!p.userId) {
                                  toast.info('Học sinh này chưa đăng ký tài khoản!');
                                  return;
                                }
                                const newStatus = p.userStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
                                try {
                                  await adminApi.bulkUpdateStatus([p.userId], newStatus);
                                  toast.success(`Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'khóa'} tài khoản thành công!`);
                                  fetchSavedStudents();
                                } catch (e) {
                                  toast.error('Lỗi khi cập nhật trạng thái tài khoản');
                                }
                              }}
                            />
                            <TableAction
                              icon={Edit}
                              label="Sửa thông tin"
                              variant="primary"
                              onClick={() => {
                                setEditingStudent(p);
                                setEditForm({
                                  studentCode: p.studentCode,
                                  fullName: p.fullName,
                                  dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
                                  phone: p.phone || '',
                                  facility: p.facility || '',
                                  classroomIds: p.enrollments?.map(e => e.classroomId) || []
                                });
                                setEditError('');
                              }}
                            />
                            <TableAction
                              icon={Trash2}
                              label="Xóa học sinh"
                              variant="danger"
                              onClick={() => setDeletingStudent(p)}
                            />
                          </TableActions>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-surface/50">
              <TablePagination
                currentPage={savedPage}
                totalPages={savedTotalPages}
                onPageChange={setSavedPage}
                pageSize={savedSize}
                totalElements={savedTotal}
                onPageSizeChange={(size) => {
                  setSavedSize(size);
                  setSavedPage(0);
                }}
                pageSizeOptions={[15, 30, 50, 100]}
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: CLASS MANAGEMENT ==================== */}
      {activeTab === 'classes' && isAdmin && (
        <div className="flex-1 min-h-0 flex flex-col gap-6">
          {selectedGroup ? (
            /* ---- Class detail: students in this group ---- */
            <div className="flex-1 min-h-0 flex flex-col gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setSearchParams({})}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-cam transition-colors font-medium"
                >
                  <ArrowLeft size={16} />
                  Quay lại
                </button>
                <span className="text-gray-300">|</span>
                <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-cam" />
                  {selectedGroup.name}
                </h2>
                <button
                  onClick={() => handleEditGroupClick(selectedGroup)}
                  className="p-1.5 ml-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Sửa lớp"
                >
                  <Edit size={16} />
                </button>
              </div>

              <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-night-surface rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-night-border overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between border-b border-gray-100 dark:border-night-border shrink-0">
                  {/* Left: Title & Count & Bulk Actions */}
                  <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <p className="text-base font-semibold text-gray-800 dark:text-white">Danh sách học sinh</p>
                    {groupStudents.length > 0 && (
                      <span className="text-sm font-semibold text-cam bg-cam/10 px-3 py-1 rounded-full whitespace-nowrap">
                        {groupStudents.length} học sinh
                      </span>
                    )}
                    {groupStudents.length > 0 && (
                      <button 
                        onClick={() => setGroupStudentStatus('NO_ACCOUNT')}
                        className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-colors border ${
                          groupStudents.filter(p => !p.userId).length > 0
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            : 'text-gray-500 bg-gray-50 hover:bg-gray-100 border-gray-200 dark:bg-night-surface dark:border-night-border dark:text-gray-400'
                        }`}
                        title="Lọc học sinh chưa có tài khoản"
                      >
                        {groupStudents.filter(p => !p.userId).length} chưa đăng ký
                      </button>
                    )}
                    {selectedUserIds.length > 0 && (
                      <div className="flex items-center gap-2 border-l border-gray-300 dark:border-night-border pl-3 ml-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Đã chọn {selectedUserIds.length}</span>
                        <button onClick={() => handleBulkStatusUpdate('BANNED')} className="btn border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 text-xs whitespace-nowrap">Cấm</button>
                        <button onClick={() => handleBulkStatusUpdate('ACTIVE')} className="btn border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1 text-xs whitespace-nowrap">Mở khóa</button>
                      </div>
                    )}
                  </div>
                  
                  {/* Right: Search, Filter, Actions */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Mã HS, Tên, SĐT..." 
                        value={groupStudentSearch}
                        onChange={e => setGroupStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-night-surface border border-gray-200 dark:border-night-border focus:border-cam rounded-xl outline-none text-sm dark:text-white transition-colors"
                      />
                    </div>
                    <Select
                      value={groupStudentStatus}
                      onChange={v => setGroupStudentStatus(v)}
                      className="w-full sm:w-auto py-2 px-3 bg-gray-50 dark:bg-night-surface border border-gray-200 dark:border-night-border focus:border-cam rounded-xl outline-none text-sm dark:text-white cursor-pointer transition-colors"
                      options={[
                        { value: 'ALL', label: 'Tất cả tài khoản' },
                        { value: 'HAS_ACCOUNT', label: 'Đã có tài khoản' },
                        { value: 'NO_ACCOUNT', label: 'Chưa có tài khoản' },
                      ]}
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <button
                        onClick={() => { navigate('/admin/students'); setClassroomId(selectedGroup.id); }}
                        className="flex-1 sm:flex-none btn border border-gray-200 dark:border-night-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-night-elevated px-4 py-2 text-sm whitespace-nowrap transition-colors"
                        title="Import Excel"
                      >
                        <UploadCloud size={16} className="mx-auto" />
                      </button>
                      <button
                        onClick={() => setShowAddStudentModal(true)}
                        className="flex-1 sm:flex-none btn btn-chinh px-4 py-2 text-sm whitespace-nowrap flex items-center justify-center gap-1.5"
                      >
                        <Plus size={16} />
                        Thêm HS
                      </button>
                    </div>
                  </div>
                </div>

                {loadingGroupStudents ? (
                  <div className="flex-1 min-h-0 flex items-center justify-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin inline mr-2" />Đang tải...
                  </div>
                ) : groupStudents.length > 0 && filteredGroupStudents.length === 0 ? (
                  <div className="flex-1 min-h-0 flex items-center justify-center text-gray-400">
                    Không tìm thấy học sinh nào phù hợp.
                  </div>
                ) : groupStudents.length === 0 ? (
                  <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center">
                    <Users size={40} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Chưa có học sinh nào trong lớp này.</p>
                    <p className="text-gray-400 text-xs mt-1">Hãy import học sinh và chọn lớp <strong>"{selectedGroup.name}"</strong></p>
                    <div className="flex gap-2 mt-4 justify-center">
                      <button
                        onClick={() => { navigate('/admin/students'); setClassroomId(selectedGroup.id); }}
                        className="btn border border-cam text-cam hover:bg-cam/10 px-5 py-2 text-sm"
                      >
                        <UploadCloud size={15} className="inline mr-1" />
                        Import bằng Excel
                      </button>
                      <button
                        onClick={() => setShowAddStudentModal(true)}
                        className="btn btn-chinh px-5 py-2 text-sm"
                      >
                        <Plus size={15} className="inline mr-1" />
                        Thêm thủ công
                      </button>
                    </div>
                  </div>
                ) : (
                  <TableContainer className="flex-1 min-h-0 !border-0 !shadow-none !rounded-none">
                    <Table>
                      <Thead>
                        <Tr>
                          <Th className="w-10 text-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 w-4 h-4 text-cam focus:ring-cam"
                              checked={filteredGroupStudents.filter(s => s.userId).length > 0 && selectedUserIds.length === filteredGroupStudents.filter(s => s.userId).length}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedUserIds(filteredGroupStudents.filter(s => s.userId).map(s => s.userId!));
                                } else {
                                  setSelectedUserIds([]);
                                }
                              }}
                            />
                          </Th>
                          <Th>#</Th>
                          <Th>Mã HS</Th>
                          <Th>Họ tên</Th>
                          <Th>Ngày sinh</Th>
                          <Th>SĐT</Th>
                          <Th>Tất cả lớp</Th>
                          <Th>TK</Th>
                          <Th className="text-right">Hành động</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredGroupStudents.map((p, i) => (
                          <Tr key={p.id}>
                            <Td className="text-center">
                              {p.userId && (
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 w-4 h-4 text-cam focus:ring-cam cursor-pointer"
                                  checked={selectedUserIds.includes(p.userId)}
                                  onChange={e => {
                                    if (e.target.checked) setSelectedUserIds([...selectedUserIds, p.userId!]);
                                    else setSelectedUserIds(selectedUserIds.filter(id => id !== p.userId));
                                  }}
                                />
                              )}
                            </Td>
                            <Td className="text-gray-400">{i + 1}</Td>
                            <Td className="font-mono text-camDam font-semibold">{p.studentCode}</Td>
                            <Td className="font-medium text-gray-800 dark:text-white">{p.fullName}</Td>
                            <Td className="text-gray-600 dark:text-night-muted">{formatShortDate(p.dateOfBirth)}</Td>
                            <Td className="text-gray-500 dark:text-night-muted">{p.phone || '-'}</Td>
                            <Td>
                              {p.enrollments?.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {p.enrollments.map(e => (
                                    <span key={e.classroomId} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      e.classroomId === selectedGroup.id
                                        ? 'bg-cam text-white'
                                        : 'bg-gray-100 dark:bg-night-elevated text-gray-600 dark:text-night-muted'
                                    }`}>
                                      {e.classroomName}
                                    </span>
                                  ))}
                                </div>
                              ) : <span className="text-gray-300">-</span>}
                            </Td>
                            <Td>
                              {p.userId ? (
                                <StatusBadge status="active">Có</StatusBadge>
                              ) : (
                                <StatusBadge status="warning">Không</StatusBadge>
                              )}
                            </Td>
                            <Td className="text-right">
                              <TableActions>
                                <TableAction
                                  icon={UserCheck}
                                  label={!p.userId ? 'Chưa có tài khoản' : p.userStatus === 'ACTIVE' ? 'Đang hoạt động (Click để khóa)' : 'Đang khóa (Click để kích hoạt)'}
                                  variant={!p.userId ? 'neutral' : p.userStatus === 'ACTIVE' ? 'success' : 'danger'}
                                  disabled={!p.userId}
                                  onClick={async () => {
                                    if (!p.userId) {
                                      toast.info('Học sinh này chưa đăng ký tài khoản!');
                                      return;
                                    }
                                    const newStatus = p.userStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
                                    try {
                                      await adminApi.bulkUpdateStatus([p.userId], newStatus);
                                      toast.success(`Đã ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'khóa'} tài khoản thành công!`);
                                      if (selectedGroup) {
                                        fetchGroupStudents(selectedGroup);
                                      }
                                    } catch (e) {
                                      toast.error('Lỗi khi cập nhật trạng thái');
                                    }
                                  }}
                                />
                                <TableAction
                                  icon={Edit}
                                  label="Sửa thông tin"
                                  variant="primary"
                                  onClick={() => {
                                    setEditingStudent(p);
                                    setEditForm({
                                      studentCode: p.studentCode,
                                      fullName: p.fullName,
                                      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
                                      phone: p.phone || '',
                                      facility: p.facility || '',
                                      classroomIds: p.enrollments?.map(e => e.classroomId) || []
                                    });
                                    setEditError('');
                                  }}
                                />
                                <TableAction
                                  icon={Trash2}
                                  label="Xóa học sinh"
                                  variant="danger"
                                  onClick={() => setDeletingStudent(p)}
                                />
                              </TableActions>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </div>
            </div>
          ) : (
            /* ---- Group list view ---- */
            <div className="flex-1 min-h-0 flex flex-col gap-4">
              <div className="flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-night-muted">
                    {adminGroups.length > 0 ? `${filteredAdminGroups.length} lớp học phù hợp` : 'Chưa có lớp học nào'}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Tìm lớp học nhanh..." 
                        value={classSearch}
                        onChange={e => setClassSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border focus:border-cam rounded-xl outline-none text-sm dark:text-white"
                      />
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn btn-chinh flex items-center gap-2 px-5 py-2.5 text-sm"
                    >
                      <Plus size={16} />
                      Tạo lớp mới
                    </button>
                  </div>
                </div>
                
                <div className="mb-6 flex flex-col md:flex-row gap-4 bg-white dark:bg-night-surface p-4 sm:p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-night-border items-center justify-between shrink-0">
                  <div className="w-full">
                    <FilterBar 
                      fields={adminGroupFilterFields}
                      activeFilters={activeFilters}
                      onChange={setActiveFilters}
                    />
                  </div>
                </div>
              </div>

              {loadingGroups ? (
                <div className="card py-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin inline mr-2" />Đang tải...
                </div>
              ) : adminGroups.length > 0 && filteredAdminGroups.length === 0 ? (
                <div className="card py-12 text-center text-gray-400">
                  Không tìm thấy lớp học nào phù hợp.
                </div>
              ) : adminGroups.length === 0 ? (
                <div className="card py-16 text-center">
                  <BookOpen size={48} className="text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-600 dark:text-gray-400 mb-2">Chưa có lớp học</h3>
                  <p className="text-sm text-gray-400 dark:text-night-muted mb-6">
                    Tạo lớp học để phân nhóm học sinh khi import từ Excel
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-chinh px-6 py-2.5 mx-auto"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Tạo lớp đầu tiên
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginatedAdminGroups.map(group => (
                      <div
                        key={group.id}
                        className="card hover:shadow-md transition-all duration-200 group/card relative border border-gray-100 dark:border-night-border"
                      >
                        <div className="flex items-start justify-between gap-3 min-w-0">
                        <div
                          className="flex-1 flex items-start gap-3 cursor-pointer min-w-0"
                          onClick={() => setSearchParams({ classId: group.id })}
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 dark:text-white group-hover/card:text-cam transition-colors">
                              {group.name}
                            </h3>
                            {group.section && (
                              <p className="text-xs text-gray-400 dark:text-night-muted mt-0.5">{group.section}</p>
                            )}
                            {group.subject && (
                              <p className="text-xs text-gray-500 dark:text-night-muted mt-1">
                                Môn học: {group.subject}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <UserAvatar fullName={group.teacherName || 'Chưa phân công'} avatarUrl={group.teacherAvatar} size="sm" className="w-5 h-5 text-[10px]" />
                              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                {group.teacherName || 'Chưa phân công'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500 dark:text-night-muted flex items-center gap-1">
                                <Users size={12} />
                                {group.memberCount || 0} học sinh
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setSearchParams({ classId: group.id })}
                            className="p-2 rounded-lg text-gray-400 hover:text-cam hover:bg-cam/10 transition-colors"
                            title="Xem học sinh"
                          >
                            <ChevronRight size={18} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleEditGroupClick(group); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Sửa lớp"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                            disabled={deletingGroupId === group.id}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Xóa lớp"
                          >
                            {deletingGroupId === group.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {adminGroups.length > 0 && (
                <TablePagination
                  currentPage={classPage}
                  totalPages={totalClassPages}
                  onPageChange={setClassPage}
                  pageSize={classPageSize}
                  totalElements={filteredAdminGroups.length}
                  onPageSizeChange={(size) => {
                    setClassPageSize(size);
                    setClassPage(0);
                  }}
                  pageSizeOptions={[10, 20, 50, 100]}
                />
              )}


            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL: Tạo lớp mới ==================== */}
      {showCreateModal && (
        <Portal><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-surface rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-night-border animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-cam" />
                Tạo lớp học mới
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); setCreateGroupError(''); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên lớp học *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="VD: TIẾNG ANH 12A1, Lớp Toán Nâng Cao..."
                  className="input w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Niên khóa <span className="font-normal text-gray-400">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  placeholder="VD: 2026-2027"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Môn học
                </label>
                <input
                  type="text"
                  value={newGroupSubject}
                  onChange={e => setNewGroupSubject(e.target.value)}
                  placeholder="VD: Toán học"
                  className="input w-full"
                />
              </div>

              {createGroupError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {createGroupError}
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateGroupError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-night-border text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-night-elevated transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="flex-1 btn btn-chinh py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creatingGroup
                    ? <><Loader2 size={16} className="animate-spin" />Đang tạo...</>
                    : <><Check size={16} />Tạo lớp</>}
                </button>
              </div>
            </form>
          </div>
        </div></Portal>
      )}

      {/* ==================== MODAL: Sửa thông tin lớp ==================== */}
      {showEditModal && editingGroup && (
        <Portal><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-surface rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-night-border animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Edit size={20} className="text-blue-500" />
                Sửa thông tin lớp học
              </h3>
              <button
                onClick={() => { setShowEditModal(false); setUpdateGroupError(''); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateGroup} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên lớp học *
                </label>
                <input
                  type="text"
                  required
                  value={editGroupName}
                  onChange={e => setEditGroupName(e.target.value)}
                  placeholder="VD: TOÁN 12A..."
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Niên khóa
                </label>
                <input
                  type="text"
                  value={editGroupSection}
                  onChange={e => setEditGroupSection(e.target.value)}
                  placeholder="VD: 2026-2027"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Môn học
                </label>
                <input
                  type="text"
                  value={editGroupSubject}
                  onChange={e => setEditGroupSubject(e.target.value)}
                  placeholder="VD: Toán học"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Giáo viên phụ trách
                </label>
                <Select
                  value={editGroupTeacherId}
                  onChange={v => setEditGroupTeacherId(v)}
                  className="input w-full"
                  options={[
                    { value: '', label: '-- Trống --' },
                    ...teachers.map(t => ({ value: t.id, label: `${t.fullName} ${t.email ? `(${t.email})` : ''}` })),
                  ]}
                />
              </div>

              {updateGroupError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {updateGroupError}
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setUpdateGroupError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-night-border text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-night-elevated transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingGroup}
                  className="flex-1 btn btn-chinh py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updatingGroup
                    ? <><Loader2 size={16} className="animate-spin" />Đang lưu...</>
                    : <><Check size={16} />Lưu thay đổi</>}
                </button>
              </div>
            </form>
          </div>
        </div></Portal>
      )}

      {/* ==================== PREVIEW MODAL ==================== */}
      {showPreviewModal && (
        <Portal><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-night-surface rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-surface">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                  <UploadCloud size={20} className="text-cam" /> Xác nhận Import Dữ Liệu
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tìm thấy <strong className="text-cam">{previewData.length}</strong> dòng hợp lệ.
                </p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-night-elevated"
              >
                <X size={20} />
              </button>
            </div>
            
            <TableContainer className="flex-1 min-h-0 !border-0 !shadow-none !rounded-none">
              <Table>
                <Thead>
                  <Tr>
                    <Th>#</Th>
                    <Th>Mã HS</Th>
                    <Th>Họ tên</Th>
                    <Th>Ngày sinh</Th>
                    <Th>Số ĐT</Th>
                    <Th>Cơ sở</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {previewData.slice(0, 50).map((row, i) => (
                    <Tr key={i}>
                      <Td className="text-gray-400">{i + 1}</Td>
                      <Td className="font-mono text-camDam font-medium">{row.studentCode}</Td>
                      <Td className="font-medium text-gray-800 dark:text-gray-200">{row.fullName}</Td>
                      <Td className="text-gray-600 dark:text-night-muted">{row.dateOfBirth}</Td>
                      <Td className="text-gray-600 dark:text-night-muted">{row.phone}</Td>
                      <Td className="text-gray-600 dark:text-night-muted">{row.facility}</Td>
                    </Tr>
                  ))}
                  {previewData.length > 50 && (
                    <Tr>
                      <Td colSpan={6} className="text-center text-gray-500 italic bg-gray-50/50 dark:bg-night-elevated/20">
                        ... Và {previewData.length - 50} dòng khác
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            <div className="p-5 border-t border-gray-100 dark:border-night-border flex justify-end gap-3 bg-gray-50/50 dark:bg-night-surface">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-night-border font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-night-elevated transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="btn btn-chinh px-6 py-2.5 flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Xác nhận Import
              </button>
            </div>
          </div>
        </div></Portal>
      )}

      {/* ==================== MODAL: Thêm học sinh thủ công ==================== */}
      {showAddStudentModal && (
        <Portal><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-surface rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-night-border animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <UserCheck size={20} className="text-cam" />
                Thêm học sinh thủ công
              </h3>
              <button
                onClick={() => { setShowAddStudentModal(false); setAddStudentError(''); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Nhập mã HS để thêm học sinh đã có trên hệ thống vào lớp này, hoặc tạo mới hoàn toàn.
            </p>

            <form onSubmit={handleAddStudentSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Mã Học Sinh *</label>
                <input
                  type="text"
                  value={addStudentForm.studentCode}
                  onChange={e => setAddStudentForm(prev => ({ ...prev, studentCode: e.target.value }))}
                  className="input w-full uppercase"
                  placeholder="VD: HS12345"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Họ và Tên *</label>
                <input
                  type="text"
                  value={addStudentForm.fullName}
                  onChange={e => setAddStudentForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="input w-full"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ngày sinh (dd/mm/yyyy)</label>
                  <input
                    type="date"
                    value={addStudentForm.dateOfBirth}
                    onChange={e => setAddStudentForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Cơ sở</label>
                  <input
                    type="text"
                    value={addStudentForm.facility}
                    onChange={e => setAddStudentForm(prev => ({ ...prev, facility: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Số điện thoại</label>
                <input
                  type="text"
                  value={addStudentForm.phone}
                  onChange={e => setAddStudentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="input w-full"
                />
              </div>

              {addStudentError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {addStudentError}
                </div>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => { setShowAddStudentModal(false); setAddStudentError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-night-border text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-night-elevated transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="flex-1 btn btn-chinh py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addingStudent
                    ? <><Loader2 size={16} className="animate-spin" />Đang lưu...</>
                    : <><Check size={16} />Lưu học sinh</>}
                </button>
              </div>
            </form>
          </div>
        </div></Portal>
      )}

      {/* ==================== EDIT STUDENT MODAL ==================== */}
      {editingStudent && (
        <Portal><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-night-surface rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-night-border">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Edit size={18} className="text-cam" /> Sửa thông tin học sinh
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Mã Học Sinh *</label>
                <input
                  type="text"
                  value={editForm.studentCode}
                  onChange={e => setEditForm(prev => ({ ...prev, studentCode: e.target.value }))}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Họ và Tên *</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="input w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Ngày sinh (dd/mm/yyyy)</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cơ sở</label>
                  <input
                    type="text"
                    value={editForm.facility}
                    onChange={e => setEditForm(prev => ({ ...prev, facility: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="input w-full"
                />
              </div>

              <div className="mt-2 border-t border-gray-100 dark:border-night-border pt-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Danh sách lớp học (tạm thời)
                </label>
                <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-night-elevated rounded-xl p-3 border border-gray-200 dark:border-night-border">
                  {adminGroups.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Chưa có lớp học nào.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {adminGroups.map(group => (
                        <label key={group.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-night-surface rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-night-border">
                          <input
                            type="checkbox"
                            checked={editForm.classroomIds.includes(group.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setEditForm(prev => ({
                                ...prev,
                                classroomIds: checked 
                                  ? [...prev.classroomIds, group.id]
                                  : prev.classroomIds.filter(id => id !== group.id)
                              }));
                            }}
                            className="w-4 h-4 text-cam bg-gray-100 border-gray-300 rounded focus:ring-cam dark:focus:ring-cam/50 dark:ring-offset-night-elevated dark:bg-night-surface dark:border-night-border"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{group.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {editError}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-night-border font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-night-elevated transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="flex-1 btn btn-chinh flex justify-center items-center gap-2"
                >
                  {savingStudent ? <><Loader2 size={16} className="animate-spin" /> Lưu...</> : <><Check size={16} /> Lưu</>}
                </button>
              </div>
            </form>
          </div>
        </div></Portal>
      )}

      {/* ==================== DELETE STUDENT CONFIRM ==================== */}
      <ConfirmDialog
        isOpen={!!deletingStudent}
        title="Xóa học sinh?"
        message={`Bạn có chắc chắn muốn xóa học sinh "${deletingStudent?.fullName}" (Mã: ${deletingStudent?.studentCode}) không? Dữ liệu này không thể khôi phục.`}
        confirmText={isDeleting ? 'Đang xóa...' : 'Xóa'}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingStudent(null)}
        isDestructive={true}
      />
    </div>
  );
};




