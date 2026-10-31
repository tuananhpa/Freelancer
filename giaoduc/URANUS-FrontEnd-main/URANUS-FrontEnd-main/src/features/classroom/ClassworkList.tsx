import { getApiErrorMessage } from '../../services/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { assignmentApi, Assignment } from '../../services/assignmentApi';
import { classExamApi, ClassExamResponse } from '../../services/classExamApi';
import classService, { Classroom, GradebookResponse, ClassFolder } from '../../services/class.service';
import AttachExamModal from './AttachExamModal';
import AttachResourceModal from './AttachResourceModal';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ClassworkCreateModal from './ClassworkCreateModal';
import ClassFolderModal from './ClassFolderModal';
import { buildFolderTree, FolderNode } from '../../utils/classFolderTree';
import MoveResourceModal from './MoveResourceModal';
import DeadlineBadge from '../../components/common/DeadlineBadge';
import { formatScore } from '../../utils/formatUtils';
import {
  FileText,
  PenTool,
  Layers,
  BookOpen,
  Plus,
  Search,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Settings,
  Wrench,
  FolderPlus,
  ArrowRight,
  Filter,
  CheckSquare,
  Award,
  ListTodo,
  Eye,
  Flame,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface ClassworkContext {
  classroom: Classroom;
  isTeacher: boolean;
}

type ClassworkItemType = 'ASSIGNMENT' | 'EXAM' | 'FLASHCARD' | 'VOCAB' | 'LINK' | 'DOCUMENT';

type ClassworkItem = {
  id: string;
  type: ClassworkItemType;
  title: string;
  dueDate: string | null;
  createdAt: string;
  originalAssignment?: Assignment;
  originalExam?: ClassExamResponse;
  originalResource?: any;
  folderId?: string;
  stats: { assigned: number; missing: number; turnedIn: number; graded: number };
};

type StudentStatusFilter = 'ALL' | 'TODO' | 'COMPLETED' | 'GRADED';

const SkeletonRow = () => (
  <div className="p-4 flex items-center justify-between gap-4 animate-pulse bg-white dark:bg-night-surface">
    <div className="flex items-center gap-3.5 flex-1">
      <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-night-border shrink-0" />
      <div className="space-y-1.5 flex-1">
        <div className="h-4 bg-gray-200 dark:bg-night-border rounded w-2/5" />
        <div className="h-3 bg-gray-100 dark:bg-night-border rounded w-1/4" />
      </div>
    </div>
    <div className="h-8 bg-gray-100 dark:bg-night-border rounded-lg w-24 shrink-0" />
  </div>
);

import { parseDeadlineInfo } from '../../utils/dateUtils';

const ClassworkList: React.FC = () => {
  const { classroom, isTeacher } = useOutletContext<ClassworkContext>();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<ClassExamResponse[]>([]);
  const [gradebook, setGradebook] = useState<GradebookResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAttachExamModalOpen, setIsAttachExamModalOpen] = useState(false);
  const [isAttachResourceModalOpen, setIsAttachResourceModalOpen] = useState(false);
  const [resourceModalType, setResourceModalType] = useState<'FLASHCARD' | 'VOCAB'>('FLASHCARD');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editExamData, setEditExamData] = useState<ClassExamResponse | null>(null);
  const [editFolderData, setEditFolderData] = useState<ClassFolder | null>(null);
  // Chu de cha dat san khi bam "Thêm chủ đề con" tu mot chu de cu the.
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [moveResourceItem, setMoveResourceItem] = useState<ClassworkItem | null>(null);

  // Filters & Search
  const [classResources, setClassResources] = useState<any[]>([]);
  const [studentStatusFilter, setStudentStatusFilter] = useState<StudentStatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXAM' | 'ASSIGNMENT' | 'RESOURCE'>('ALL');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState<ClassFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();
  const toast = useToast();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: prev[folderId] === undefined ? false : !prev[folderId],
    }));
  };

  const isExpanded = (folderId: string) => expandedFolders[folderId] !== false;

  useEffect(() => {
    fetchClasswork();
  }, [classroom.id]);

  const fetchClasswork = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, examsRes, foldersRes, resourcesRes] = await Promise.all([
        assignmentApi.getAssignmentsByClassroom(classroom.id, 0, 50),
        classExamApi.getClassExams(classroom.id),
        classService.getClassFolders(classroom.id),
        classService.getClassResources(classroom.id),
      ]);

      // Fetch gradebook for both teacher & student to track personal submission checklist
      try {
        const gb = await classService.getGradebook(classroom.id);
        setGradebook(gb);
      } catch (e) {
        console.error('Failed to load gradebook stats', e);
      }

      setAssignments(assignmentsRes.content || []);
      setExams(examsRes || []);
      setFolders(foldersRes || []);
      setClassResources(resourcesRes || []);
    } catch (error) {
      console.error('Error fetching classwork:', error);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: ClassworkItem) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await toast.confirm(`Bạn có chắc chắn muốn gỡ "${item.title}" khỏi lớp học không?`, {
      title: 'Xác nhận gỡ nội dung',
      confirmLabel: 'Gỡ khỏi lớp',
    });
    if (!confirmed) return;

    try {
      if (item.type === 'EXAM' && item.originalExam) {
        await classExamApi.unlinkExamFromClassroom(item.originalExam.id);
        toast.success('Đã gỡ đề thi khỏi lớp học');
      } else if (item.type === 'ASSIGNMENT' && item.originalAssignment) {
        await assignmentApi.deleteAssignment(item.originalAssignment.id);
        toast.success('Đã xóa bài tập');
      } else if (item.originalResource) {
        await classService.removeResource(classroom.id, item.originalResource.resourceId);
        toast.success('Đã gỡ tài nguyên khỏi lớp học');
      }
      fetchClasswork();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Không thể xóa bài. Vui lòng thử lại.'));
    }
  };

  /** Dem toan bo chu de nam ben trong mot chu de, ke ca cap chau. */
  const folderChildCount = (folderId: string) => {
    const childrenOf = new Map<string, string[]>();
    folders.forEach((f) => {
      if (f.parentId) childrenOf.set(f.parentId, [...(childrenOf.get(f.parentId) ?? []), f.id]);
    });
    let count = 0;
    const stack = [...(childrenOf.get(folderId) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      count++;
      stack.push(...(childrenOf.get(id) ?? []));
    }
    return count;
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    const confirmed = await toast.confirm(
      folderChildCount(folderId) > 0
        ? `Chủ đề này đang chứa ${folderChildCount(folderId)} chủ đề con. Xóa nó sẽ xóa luôn toàn bộ chủ đề con bên trong. Bài tập không bị xóa, chúng sẽ chuyển về "Chưa phân loại".`
        : 'Bạn có chắc chắn muốn xóa chủ đề này? Các bài tập bên trong sẽ được chuyển về "Chưa phân loại".',
      {
        title: 'Xác nhận xóa chủ đề',
        confirmLabel: 'Xóa chủ đề',
      }
    );
    if (!confirmed) return;
    try {
      await classService.deleteClassFolder(classroom.id, folderId);
      toast.success('Đã xóa chủ đề');
      fetchClasswork();
    } catch {
      toast.error('Không thể xóa chủ đề');
    }
  };

  // Find current student submission map
  const myStudentData = useMemo(() => {
    if (!user?.id || !gradebook?.students) return null;
    return gradebook.students.find((s) => s.studentId === user.id) || null;
  }, [user?.id, gradebook]);

  // Build unified list
  const unifiedList = useMemo(() => {
    const list: ClassworkItem[] = [];

    assignments.forEach((a) => {
      let stats = { assigned: 0, missing: 0, turnedIn: 0, graded: 0 };
      if (gradebook) {
        gradebook.students.forEach((s) => {
          const sub = s.grades[a.id];
          if (!sub || sub.status === 'ASSIGNED') stats.assigned++;
          else if (sub.status === 'MISSING') stats.missing++;
          else if (sub.status === 'TURNED_IN') stats.turnedIn++;
          else if (sub.status === 'GRADED') stats.graded++;
        });
      }
      list.push({
        id: `assignment-${a.id}`,
        type: 'ASSIGNMENT',
        title: a.title,
        dueDate: a.dueDate,
        createdAt: a.createdAt,
        originalAssignment: a,
        stats,
      });
    });

    exams.forEach((e) => {
      let stats = { assigned: 0, missing: 0, turnedIn: 0, graded: 0 };
      if (gradebook) {
        gradebook.students.forEach((s) => {
          const sub = s.grades[e.examId];
          if (!sub || sub.status === 'ASSIGNED') stats.assigned++;
          else if (sub.status === 'MISSING') stats.missing++;
          else if (sub.status === 'TURNED_IN') stats.turnedIn++;
          else if (sub.status === 'GRADED') stats.graded++;
        });
      }
      list.push({
        id: `exam-${e.id}`,
        type: 'EXAM',
        title: e.examTitle,
        dueDate: e.closeTime || null,
        createdAt: e.createdAt,
        originalExam: e,
        folderId: e.folderId,
        stats,
      });
    });

    classResources.forEach((r) => {
      // Legacy exams and assignments are already handled via classExamApi and assignmentApi
      if (r.resourceType === 'EXAM' || r.resourceType === 'ASSIGNMENT') return;

      list.push({
        id: `resource-${r.id}`,
        type: r.resourceType as any,
        title: r.title || (r.resourceType === 'FLASHCARD' ? 'Bộ thẻ ghi nhớ' : r.resourceType === 'VOCAB' ? 'Bộ từ vựng' : 'Tài nguyên'),
        dueDate: null,
        createdAt: r.createdAt,
        originalResource: r,
        folderId: r.folderId,
        stats: { assigned: 0, missing: 0, turnedIn: 0, graded: 0 },
      });
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [assignments, exams, classResources, gradebook]);

  // Compute Student Checklist & To-Do Metrics
  const studentMetrics = useMemo(() => {
    let completedCount = 0;
    let gradedCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let dueSoonCount = 0;

    unifiedList.forEach((item) => {
      const isGradable = item.type === 'ASSIGNMENT' || item.type === 'EXAM';
      if (!isGradable) return;

      const subKey = item.type === 'ASSIGNMENT' ? item.originalAssignment?.id : item.originalExam?.examId;
      const sub = myStudentData?.grades[subKey || ''];

      if (sub?.status === 'GRADED') {
        gradedCount++;
        completedCount++;
      } else if (sub?.status === 'TURNED_IN') {
        completedCount++;
      } else if (sub?.status === 'MISSING' || (item.dueDate && new Date(item.dueDate).getTime() < Date.now())) {
        overdueCount++;
        pendingCount++;
      } else {
        pendingCount++;
        if (item.dueDate) {
          const diffMs = new Date(item.dueDate).getTime() - Date.now();
          if (diffMs > 0 && diffMs < 48 * 3600000) {
            dueSoonCount++;
          }
        }
      }
    });

    return {
      totalCount: unifiedList.length,
      gradableCount: unifiedList.filter((i) => i.type === 'ASSIGNMENT' || i.type === 'EXAM').length,
      completedCount,
      gradedCount,
      pendingCount,
      dueSoonCount,
      overdueCount,
    };
  }, [unifiedList, myStudentData]);

  // Filter list by Student Status + Type + Topic + Search
  const filteredList = useMemo(() => {
    let list = unifiedList;

    // Filter by Student Completion Status (if not teacher)
    if (!isTeacher && studentStatusFilter !== 'ALL') {
      list = list.filter((item) => {
        const isGradable = item.type === 'ASSIGNMENT' || item.type === 'EXAM';
        if (!isGradable) {
          // Resources are always accessible under Completed / All
          return studentStatusFilter === 'COMPLETED';
        }

        const subKey = item.type === 'ASSIGNMENT' ? item.originalAssignment?.id : item.originalExam?.examId;
        const sub = myStudentData?.grades[subKey || ''];

        if (studentStatusFilter === 'TODO') {
          // Not turned in & not graded
          return !sub || sub.status === 'ASSIGNED' || sub.status === 'MISSING';
        }
        if (studentStatusFilter === 'COMPLETED') {
          return sub?.status === 'TURNED_IN' || sub?.status === 'GRADED';
        }
        if (studentStatusFilter === 'GRADED') {
          return sub?.status === 'GRADED';
        }
        return true;
      });
    }

    // Filter by Type
    if (typeFilter === 'EXAM') {
      list = list.filter((item) => item.type === 'EXAM');
    } else if (typeFilter === 'ASSIGNMENT') {
      list = list.filter((item) => item.type === 'ASSIGNMENT');
    } else if (typeFilter === 'RESOURCE') {
      list = list.filter((item) => item.type === 'FLASHCARD' || item.type === 'VOCAB' || item.type === 'DOCUMENT' || item.type === 'LINK');
    }

    // Filter by Topic / Folder
    if (selectedFolderId !== 'ALL') {
      list = list.filter((item) => (selectedFolderId === 'UNASSIGNED' ? !item.folderId : item.folderId === selectedFolderId));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.title.toLowerCase().includes(q));
    }
    return list;
  }, [unifiedList, isTeacher, studentStatusFilter, typeFilter, selectedFolderId, searchQuery, myStudentData]);

  // Top Pinned Urgent Classwork (Upcoming tasks nearing deadline)
  const urgentClasswork = useMemo(() => {
    const now = new Date();
    return unifiedList
      .filter((item) => {
        if (item.type !== 'ASSIGNMENT' && item.type !== 'EXAM') return false;
        if (!item.dueDate) return false;
        const due = new Date(item.dueDate);
        if (due <= now) return false; // Expired

        if (!isTeacher && myStudentData) {
          const subKey = item.type === 'ASSIGNMENT' ? item.originalAssignment?.id : item.originalExam?.examId;
          const mySub = myStudentData.grades[subKey || ''];
          if (mySub && (mySub.status === 'TURNED_IN' || mySub.status === 'GRADED' || mySub.score != null)) {
            return false; // Already completed
          }
        }
        return true;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 3);
  }, [unifiedList, isTeacher, myStudentData]);

  // Comparator to sort items by urgency (unsubmitted / urgent deadlines first)
  const compareClassworkUrgency = (a: ClassworkItem, b: ClassworkItem): number => {
    const now = Date.now();
    if (!isTeacher && myStudentData) {
      const aSubKey = a.type === 'ASSIGNMENT' ? a.originalAssignment?.id : itemKey(a);
      const bSubKey = b.type === 'ASSIGNMENT' ? b.originalAssignment?.id : itemKey(b);
      const aSub = myStudentData.grades[aSubKey || ''];
      const bSub = myStudentData.grades[bSubKey || ''];
      const aDone = aSub && (aSub.status === 'TURNED_IN' || aSub.status === 'GRADED' || aSub.score != null);
      const bDone = bSub && (bSub.status === 'TURNED_IN' || bSub.status === 'GRADED' || bSub.score != null);

      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;
    }

    if (a.dueDate && b.dueDate) {
      const aTime = new Date(a.dueDate).getTime();
      const bTime = new Date(b.dueDate).getTime();
      const aFuture = aTime > now;
      const bFuture = bTime > now;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      if (aFuture && bFuture) return aTime - bTime;
      return bTime - aTime;
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };

  function itemKey(item: ClassworkItem): string {
    return item.type === 'ASSIGNMENT' ? item.originalAssignment?.id || '' : item.originalExam?.examId || item.originalExam?.id || '';
  }

  // Cay chu de dung tu danh sach phang API tra ve (moi chu de co parentId).
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  /**
   * Nhom bai tap theo chu de, duyet cay theo thu tu hien thi.
   *
   * Chu de dang thu gon thi ca nhanh con ben duoi bi an theo - neu khong, thu gon
   * "CHUONG I" ma "BAI 01" van nam do se khong con y nghia gi.
   */
  const groupedList = useMemo(() => {
    const groups: {
      folderId: string | null;
      name: string;
      depth: number;
      items: ClassworkItem[];
      /** Tong so bai ke ca cac chu de con - chu de cha thuong khong chua bai nao. */
      totalCount: number;
      childCount: number;
    }[] = [];

    const itemsOf = new Map<string, ClassworkItem[]>();
    folders.forEach((f) => itemsOf.set(f.id, []));
    const unassigned: ClassworkItem[] = [];

    filteredList.forEach((item) => {
      if (item.folderId && itemsOf.has(item.folderId)) {
        itemsOf.get(item.folderId)!.push(item);
      } else {
        unassigned.push(item);
      }
    });

    const totalOf = (node: FolderNode): number =>
      (itemsOf.get(node.id)?.length ?? 0) + node.children.reduce((sum, c) => sum + totalOf(c), 0);

    const walk = (nodes: FolderNode[]) => {
      nodes.forEach((node) => {
        const items = itemsOf.get(node.id) ?? [];
        items.sort(compareClassworkUrgency);
        groups.push({
          folderId: node.id,
          name: node.name,
          depth: node.depth,
          items,
          totalCount: totalOf(node),
          childCount: node.children.length,
        });
        if (isExpanded(node.id)) walk(node.children);
      });
    };
    walk(folderTree);

    if (unassigned.length > 0) {
      unassigned.sort(compareClassworkUrgency);
      groups.push({
        folderId: null,
        name: 'Chưa phân loại',
        depth: 0,
        items: unassigned,
        totalCount: unassigned.length,
        childCount: 0,
      });
    }

    return groups;
  }, [filteredList, folders, folderTree, expandedFolders, myStudentData, isTeacher]);

  const renderClassworkRow = (item: ClassworkItem) => {
    const isExam = item.type === 'EXAM';
    const isAssignment = item.type === 'ASSIGNMENT';
    const isFlashcard = item.type === 'FLASHCARD';
    const isVocab = item.type === 'VOCAB';
    const isGradable = isExam || isAssignment;

    const examId = item.originalExam?.examId || (item.type === 'EXAM' ? item.originalResource?.resourceId : undefined);
    const assignmentId = item.originalAssignment?.id || (item.type === 'ASSIGNMENT' ? item.originalResource?.resourceId : undefined);
    const resourceId = item.originalResource?.resourceId;

    let targetUrl = '#';
    let typeIcon = <FileText size={16} />;
    let typeLabel = 'Tài liệu';

    if (isExam && examId) {
      targetUrl = isTeacher ? `/exams/${examId}/analytics` : `/exams/take/${examId}`;
      typeIcon = <CheckSquare size={16} />;
      typeLabel = 'Đề thi trắc nghiệm';
    } else if (isAssignment && assignmentId) {
      targetUrl = isTeacher ? `/assignments/${assignmentId}/grade` : `/assignments/${assignmentId}/take`;
      typeIcon = <PenTool size={16} />;
      typeLabel = 'Bài tự luận';
    } else if (isFlashcard && resourceId) {
      targetUrl = `/flashcards/${resourceId}`;
      typeIcon = <Layers size={16} />;
      typeLabel = 'Thẻ ghi nhớ';
    } else if (isVocab && resourceId) {
      targetUrl = `/vocabulary/${resourceId}/study`;
      typeIcon = <BookOpen size={16} />;
      typeLabel = 'Bộ từ vựng';
    }

    const dueInfo = parseDeadlineInfo(item.dueDate);

    // Student specific submission status
    const subKey = isAssignment ? assignmentId : examId;
    const mySub = myStudentData?.grades[subKey || ''];
    const maxScore = isAssignment ? item.originalAssignment?.maxScore || 100 : 10;

    const isGraded = mySub?.status === 'GRADED';
    const isTurnedIn = mySub?.status === 'TURNED_IN';
    const isMissing = mySub?.status === 'MISSING' || (dueInfo.isOverdue && !isGraded && !isTurnedIn);
    const isCompleted = isGraded || isTurnedIn;

    return (
      <Link
        key={item.id}
        to={targetUrl}
        className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 hover:bg-gray-50/80 dark:hover:bg-night-elevated/60 transition-colors gap-3 select-none ${
          !isTeacher && isCompleted ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
        }`}
      >
        {/* Left: Checklist Checkmark + Type Icon + Title + Meta */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {/* Checklist indicator for Student */}
          {!isTeacher && isGradable ? (
            <div className="shrink-0 mt-0.5 sm:mt-0">
              {isGraded ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-center shadow-2xs" title="Đã có điểm">
                  <CheckCircle2 size={18} />
                </div>
              ) : isTurnedIn ? (
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/40 flex items-center justify-center shadow-2xs" title="Đã nộp bài (Chờ chấm)">
                  <CheckCircle2 size={18} />
                </div>
              ) : isMissing ? (
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40 flex items-center justify-center shadow-2xs" title="Quá hạn / Thiếu bài">
                  <AlertCircle size={18} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gray-50 text-vutruNhat dark:bg-night-elevated dark:text-night-muted border border-gray-200 dark:border-night-border flex items-center justify-center" title="Chưa làm">
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-500 group-hover:border-cam transition-colors" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted border border-gray-200 dark:border-night-border flex items-center justify-center shrink-0">
              {typeIcon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">
                {typeLabel}
              </span>
              {!isTeacher && isCompleted && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Đã hoàn thành
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-vutru dark:text-night-text group-hover:text-cam transition-colors line-clamp-1">
              {item.title}
            </h4>

            {/* Academic Details Row */}
            <div className="flex items-center gap-2.5 text-[11px] text-vutruNhat dark:text-night-muted mt-0.5 flex-wrap">
              {item.dueDate ? (
                <DeadlineBadge deadline={item.dueDate} variant="compact" />
              ) : (
                <span className="flex items-center gap-1 font-medium text-vutruNhat dark:text-night-muted">
                  <Clock size={11} className="shrink-0" />
                  Không có hạn
                </span>
              )}

              {isExam && item.originalExam?.durationMinutes && (
                <>
                  <span>•</span>
                  <span>{item.originalExam.durationMinutes} phút</span>
                </>
              )}

              {isExam && item.originalExam?.questionCount !== undefined && (
                <>
                  <span>•</span>
                  <span>{item.originalExam.questionCount} câu</span>
                </>
              )}

              {isExam && item.originalExam?.examType && (
                <>
                  <span>•</span>
                  <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-slate-300 text-[10px] font-medium">
                    {item.originalExam.examType === 'ANSWER_SHEET' ? 'Đề PDF' : 'Đề chi tiết'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions / Stats / Student Badges */}
        {isTeacher ? (
          <div className="flex items-center gap-3 sm:pl-4 sm:border-l border-gray-100 dark:border-night-border shrink-0 self-end sm:self-center">
            {/* Teacher Stats Pill */}
            {isGradable ? (
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-vutru dark:text-night-text">
                  {item.stats.turnedIn + item.stats.graded} đã nộp
                </div>
                <div className="text-[10px] text-vutruNhat dark:text-night-muted">
                  {item.stats.missing > 0 ? <span className="text-rose-500 font-semibold">{item.stats.missing} chưa nộp</span> : 'Đầy đủ'}
                </div>
              </div>
            ) : (
              <div className="text-right hidden md:block">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 inline-flex items-center gap-1">
                  {isFlashcard ? <Layers size={11} /> : <BookOpen size={11} />}
                  Tài liệu tự học
                </span>
              </div>
            )}

            {/* Actions for teacher */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cam/10 text-cam hover:bg-cam hover:text-white dark:bg-cam/15 dark:hover:bg-cam dark:text-cam dark:hover:text-white text-xs font-bold transition-all shadow-2xs group-hover:scale-[1.02]">
                <Eye size={13} />
                <span>{isAssignment ? 'Chấm bài' : isExam ? 'Xem chi tiết' : 'Xem nội dung'}</span>
              </span>

              {isExam && examId && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/exams/${examId}/edit`);
                    }}
                    className="p-1.5 text-vutruNhat hover:text-cam hover:bg-cam/10 dark:hover:bg-night-elevated rounded-lg transition-colors"
                    title="Chỉnh sửa nội dung đề thi"
                  >
                    <Pencil size={15} />
                  </button>
                  {item.originalExam && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditExamData(item.originalExam!);
                        setIsAttachExamModalOpen(true);
                      }}
                      className="p-1.5 text-vutruNhat hover:text-cam hover:bg-cam/10 dark:hover:bg-night-elevated rounded-lg transition-colors"
                      title="Cài đặt lịch thi & chuyển chủ đề trong lớp"
                    >
                      <Wrench size={15} />
                    </button>
                  )}
                </>
              )}
              {isAssignment && assignmentId && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMoveResourceItem(item);
                    }}
                    className="p-1.5 text-vutruNhat hover:text-cam hover:bg-cam/10 dark:hover:bg-night-elevated rounded-lg transition-colors"
                    title="Chuyển vào thư mục / Cài đặt chủ đề"
                  >
                    <Wrench size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/classes/${classroom.id}/assignments/${assignmentId}/edit`);
                    }}
                    className="p-1.5 text-vutruNhat hover:text-cam hover:bg-cam/10 dark:hover:bg-night-elevated rounded-lg transition-colors"
                    title="Chỉnh sửa bài tập"
                  >
                    <Pencil size={15} />
                  </button>
                </>
              )}
              {isFlashcard && resourceId && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMoveResourceItem(item);
                    }}
                    className="p-1.5 text-vutruNhat hover:text-cam hover:bg-cam/10 dark:hover:bg-night-elevated rounded-lg transition-colors"
                    title="Chuyển vào thư mục / Cài đặt chủ đề"
                  >
                    <Wrench size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/flashcards/${resourceId}/edit`);
                    }}
                    className="p-1.5 text-vutruNhat hover:text-cam hover:bg-cam/10 dark:hover:bg-night-elevated rounded-lg transition-colors"
                    title="Chỉnh sửa bộ thẻ ghi nhớ"
                  >
                    <Pencil size={15} />
                  </button>
                </>
              )}
              {isVocab && resourceId && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMoveResourceItem(item);
                    }}
                    className="p-1.5 text-vutruNhat hover:text-cam hover:bg-cam/10 dark:hover:bg-night-elevated rounded-lg transition-colors"
                    title="Chuyển vào thư mục / Cài đặt chủ đề"
                  >
                    <Wrench size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/vocabulary/${resourceId}/edit`);
                    }}
                    className="p-1.5 text-vutruNhat hover:text-cam hover:bg-cam/10 dark:hover:bg-night-elevated rounded-lg transition-colors"
                    title="Chỉnh sửa bộ từ vựng"
                  >
                    <Pencil size={15} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={(e) => handleDelete(e, item)}
                className="p-1.5 text-vutruNhat hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-night-elevated rounded-lg transition-colors"
                title="Gỡ khỏi lớp"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:pl-4 shrink-0 self-end sm:self-center">
            {/* Student Checklist & Grade Status Badges */}
            {isGraded ? (
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center gap-1">
                <Award size={13} className="text-emerald-600" /> Điểm: {formatScore(mySub.score)} / {formatScore(maxScore)}
              </span>
            ) : isTurnedIn ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/40 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-blue-600" /> Đã nộp bài
              </span>
            ) : isMissing ? (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 flex items-center gap-1">
                <AlertCircle size={13} /> Quá hạn
              </span>
            ) : dueInfo.isUrgent ? (
              <span className="text-xs font-bold text-camDam dark:text-cam px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cam animate-pulse" /> Sắp đến hạn
              </span>
            ) : isGradable ? (
              <span className="text-xs font-medium text-vutruNhat dark:text-night-muted px-2.5 py-1 rounded-md bg-gray-100 dark:bg-night-elevated border border-gray-200 dark:border-night-border">
                Chưa làm
              </span>
            ) : null}

            <span className="text-xs font-bold text-cam group-hover:text-camDam group-hover:translate-x-0.5 transition-all flex items-center gap-1">
              {isGraded ? 'Xem bài làm' : isTurnedIn ? 'Xem bài nộp' : isGradable ? 'Làm bài' : 'Học ngay'} <ArrowRight size={13} />
            </span>
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Academic Summary Bar (LMS To-Do & Statistics) ── */}
      {!loading && unifiedList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {!isTeacher ? (
            <>
              <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-vutruNhat uppercase tracking-wider">Tổng bài tập</span>
                  <ListTodo size={16} className="text-vutruNhat" />
                </div>
                <div className="font-heading text-2xl font-bold text-vutru dark:text-night-text mt-1">
                  {studentMetrics.gradableCount} bài
                </div>
              </div>

              <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cam uppercase tracking-wider">Cần làm</span>
                  <Clock size={16} className="text-cam" />
                </div>
                <div className="font-heading text-2xl font-bold text-cam mt-1">
                  {studentMetrics.pendingCount} bài
                </div>
              </div>

              <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đã hoàn thành</span>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {studentMetrics.completedCount} bài
                </div>
              </div>

              <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Đã có điểm</span>
                  <Award size={16} className="text-blue-500" />
                </div>
                <div className="font-heading text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {studentMetrics.gradedCount} bài
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                <div className="text-[11px] font-bold text-vutruNhat uppercase tracking-wider">Bài đã giao</div>
                <div className="font-heading text-2xl font-bold text-vutru dark:text-night-text mt-0.5">{unifiedList.length}</div>
              </div>
              <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Đề thi trắc nghiệm</div>
                <div className="font-heading text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{exams.length}</div>
              </div>
              <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                <div className="text-[11px] font-bold text-cam uppercase tracking-wider">Bài tự luận</div>
                <div className="font-heading text-2xl font-bold text-cam mt-0.5">{assignments.length}</div>
              </div>
              <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
                <div className="text-[11px] font-bold text-vutruNhat uppercase tracking-wider">Chủ đề phân loại</div>
                <div className="font-heading text-2xl font-bold text-vutru dark:text-slate-300 mt-0.5">{folders.length}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Top Pinned Component: Bài tập & Đề thi sắp đến hạn cần ưu tiên ── */}
      {!loading && urgentClasswork.length > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-cam/10 to-orange-500/5 dark:from-amber-950/40 dark:via-cam/15 dark:to-orange-950/20 border border-cam/30 dark:border-cam/20 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3.5 border-b border-cam/20 dark:border-cam/15">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cam text-white flex items-center justify-center shadow-xs">
                <Flame className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-vutru dark:text-night-text flex items-center gap-1.5">
                  {isTeacher ? 'Nhiệm vụ đang mở sắp hết hạn' : 'Bài tập & Đề thi sắp đến hạn cần ưu tiên'}
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-cam text-white">
                    {urgentClasswork.length}
                  </span>
                </h3>
                <p className="text-xs text-vutruNhat dark:text-night-muted">
                  {isTeacher
                    ? 'Theo dõi thời hạn nộp bài và đôn đốc học sinh'
                    : 'Ưu tiên hoàn thành các bài tập và đề thi này trước thời hạn'}
                </p>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${urgentClasswork.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''} gap-3`}>
            {urgentClasswork.map((item) => {
              const isExam = item.type === 'EXAM';
              const examId = item.originalExam?.examId || item.originalExam?.id;
              const assignmentId = item.originalAssignment?.id;
              const targetUrl = isExam
                ? (isTeacher ? `/exams/${examId}/analytics` : `/exams/take/${examId}`)
                : (isTeacher ? `/assignments/${assignmentId}/grade` : `/assignments/${assignmentId}/take`);

              const d = new Date(item.dueDate!);
              const now = new Date();
              const diffMs = d.getTime() - now.getTime();
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

              const isToday =
                d.getDate() === now.getDate() &&
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear();

              const tomorrow = new Date(now);
              tomorrow.setDate(now.getDate() + 1);
              const isTomorrow =
                d.getDate() === tomorrow.getDate() &&
                d.getMonth() === tomorrow.getMonth() &&
                d.getFullYear() === tomorrow.getFullYear();

              let badgeText = '';
              let badgeClass = '';
              if (diffHours <= 0) {
                badgeText = 'Quá hạn';
                badgeClass = 'bg-rose-500 text-white';
              } else if (diffHours <= 6) {
                badgeText = `🔥 Còn ${diffHours}h`;
                badgeClass = 'bg-rose-500 text-white animate-pulse';
              } else if (isToday) {
                badgeText = '⚡ Hôm nay';
                badgeClass = 'bg-amber-500 text-white';
              } else if (isTomorrow) {
                badgeText = '📅 Ngày mai';
                badgeClass = 'bg-orange-500 text-white';
              } else if (diffDays <= 6) {
                const weekdays = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                badgeText = `📅 ${weekdays[d.getDay()]}`;
                badgeClass = 'bg-blue-600 text-white';
              } else {
                badgeText = `📅 ${d.getDate()}/${d.getMonth() + 1}`;
                badgeClass = 'bg-gray-700 text-white';
              }

              const timeString = isNaN(d.getTime())
                ? ''
                : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} • ${d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}`;

              return (
                <Link
                  key={`top-urgent-${item.id}`}
                  to={targetUrl}
                  className="p-3.5 rounded-xl bg-white/95 dark:bg-night-surface/95 hover:bg-white dark:hover:bg-night-surface border border-cam/20 dark:border-night-border hover:border-cam/60 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isExam
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {isExam ? <CheckSquare className="w-3.5 h-3.5" /> : <PenTool className="w-3.5 h-3.5" />}
                        {isExam ? 'Đề thi' : 'Bài tập'}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-xs ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </div>

                    <h4 className="font-heading text-sm font-bold text-vutru dark:text-night-text group-hover:text-cam transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-night-border text-xs">
                    <span className="text-vutruNhat dark:text-night-muted flex items-center gap-1 font-medium text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-cam shrink-0" />
                      <span>{timeString}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 font-bold text-cam group-hover:translate-x-1 transition-transform text-xs">
                      {isTeacher ? 'Xem chi tiết' : 'Làm bài ngay'} <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. Teacher Action Bar ── */}
      {isTeacher && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
          <div>
            <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text">Quản lý nội dung học phần</h3>
            <p className="text-xs text-vutruNhat dark:text-night-muted">Giao bài tập, đính kèm đề thi và tổ chức theo chủ đề</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditFolderData(null);
                setNewFolderParentId(null);
                setIsFolderModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-full border-2 border-gray-200 dark:border-night-border hover:bg-gray-100 dark:hover:bg-night-elevated text-vutru dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <FolderPlus size={15} />
              <span>Thêm chủ đề</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-chinh text-xs px-5 py-2.5 flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Giao bài tập mới</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Filters & Search Control ── */}
      <div className="space-y-3 pt-1">
        {/* Student Completion Status Filter Pills (For Student Role) */}
        {!isTeacher && (
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-night-elevated rounded-2xl border border-gray-200 dark:border-night-border overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStudentStatusFilter('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                studentStatusFilter === 'ALL'
                  ? 'bg-white dark:bg-night-surface text-cam shadow-soft border border-gray-200 dark:border-night-border'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              Tất cả ({studentMetrics.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStudentStatusFilter('TODO')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                studentStatusFilter === 'TODO'
                  ? 'bg-white dark:bg-night-surface text-cam shadow-soft border border-gray-200 dark:border-night-border'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              <Clock size={13} className="text-cam" />
              Chưa làm ({studentMetrics.pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStudentStatusFilter('COMPLETED')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                studentStatusFilter === 'COMPLETED'
                  ? 'bg-white dark:bg-night-surface text-emerald-600 dark:text-emerald-400 shadow-soft border border-gray-200 dark:border-night-border'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              <CheckCircle2 size={13} className="text-emerald-500" />
              Đã hoàn thành ({studentMetrics.completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStudentStatusFilter('GRADED')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                studentStatusFilter === 'GRADED'
                  ? 'bg-white dark:bg-night-surface text-blue-600 dark:text-blue-400 shadow-soft border border-gray-200 dark:border-night-border'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              <Award size={13} className="text-blue-500" />
              Đã có điểm ({studentMetrics.gradedCount})
            </button>
          </div>
        )}

        {/* Secondary: Type Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/70 dark:bg-night-elevated/70 rounded-2xl border border-gray-200 dark:border-night-border overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === 'ALL'
                  ? 'bg-white dark:bg-night-surface text-vutru dark:text-night-text shadow-2xs border border-gray-200 dark:border-night-border'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              Tất cả loại bài
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('EXAM')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === 'EXAM'
                  ? 'bg-white dark:bg-night-surface text-blue-600 dark:text-blue-400 shadow-2xs border border-gray-200 dark:border-night-border'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              Đề thi ({exams.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('ASSIGNMENT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === 'ASSIGNMENT'
                  ? 'bg-white dark:bg-night-surface text-camDam dark:text-cam shadow-2xs border border-gray-200 dark:border-night-border'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              Tự luận ({assignments.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('RESOURCE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === 'RESOURCE'
                  ? 'bg-white dark:bg-night-surface text-emerald-600 dark:text-emerald-400 shadow-2xs border border-gray-200 dark:border-night-border'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              Thẻ & Từ vựng ({classResources.length})
            </button>
          </div>

          {/* Search input */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-surface text-xs sm:text-sm focus:outline-none focus:border-cam transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── 4. Grouped Classwork List (Module Accordions) ── */}
      {loading && <LoadingOverlay text="Đang đồng bộ bài tập lớp học..." />}

      {filteredList.length === 0 && folders.length === 0 && !loading ? (
        <div className="text-center py-16 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-8">
          <div className="w-12 h-12 rounded-2xl bg-camNhat/40 text-cam flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="font-heading text-base font-bold text-vutru dark:text-night-text mb-1">
            {!isTeacher && studentStatusFilter === 'TODO'
              ? 'Tuyệt vời! Bạn đã hoàn thành tất cả bài tập'
              : 'Chưa có bài tập nào'}
          </h4>
          <p className="text-xs text-vutruNhat dark:text-night-muted max-w-sm mx-auto">
            {searchQuery
              ? 'Không tìm thấy bài tập phù hợp với từ khóa.'
              : !isTeacher && studentStatusFilter === 'TODO'
              ? 'Không còn bài tập nào cần làm trong học phần này.'
              : 'Hiện tại chưa có bài tập trong bộ lọc đã chọn.'}
          </p>
          {!isTeacher && studentStatusFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setStudentStatusFilter('ALL')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-cam border border-cam/30 bg-cam/5 hover:bg-cam hover:text-white transition-all"
            >
              Xem tất cả bài tập
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedList.map((group) => {
            if (group.items.length === 0 && selectedFolderId === 'ALL' && group.folderId === null) return null;

            const folderKey = group.folderId || 'unassigned';
            const expanded = isExpanded(folderKey);
            const isNested = group.depth > 0;

            return (
              <div
                key={folderKey}
                className="space-y-2"
                /* Thut le theo cap de nhin ra ngay cai nao nam trong cai nao. */
                style={{ marginLeft: group.depth * 22 }}
              >
                {/* Topic / Folder Header */}
                <div
                  onClick={() => toggleFolder(folderKey)}
                  className={`flex items-center justify-between py-2.5 px-4 rounded-xl cursor-pointer select-none transition-colors group/topic ${
                    isNested
                      ? 'bg-gray-50 dark:bg-night-elevated/30 hover:bg-gray-100 dark:hover:bg-night-elevated border-l-2 border-cam/30'
                      : 'bg-gray-100/80 dark:bg-night-elevated/50 hover:bg-gray-100 dark:hover:bg-night-elevated'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ChevronDown
                      size={16}
                      className={`text-vutruNhat transition-transform duration-200 shrink-0 ${expanded ? '' : '-rotate-90'}`}
                    />
                    <h3
                      className={`font-heading font-bold text-vutru dark:text-night-text truncate ${
                        isNested ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
                      }`}
                    >
                      {group.name}
                    </h3>
                    <span className="shrink-0 text-[11px] font-bold text-vutruNhat bg-white dark:bg-night-surface px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-night-border">
                      {/* Chu de cha thuong khong chua bai nao truc tiep - hien ca
                          tong cua nhanh de no khong bi nham la rong. */}
                      {group.childCount > 0 && group.totalCount !== group.items.length
                        ? `${group.items.length} bài · ${group.totalCount} cả nhánh`
                        : `${group.items.length} bài`}
                    </span>
                    {group.childCount > 0 && (
                      <span className="shrink-0 text-[11px] font-semibold text-vutruNhat/80">
                        {group.childCount} chủ đề con
                      </span>
                    )}
                  </div>

                  {/* Teacher actions on folder */}
                  {group.folderId && isTeacher && (
                    <div className="flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditFolderData(null);
                          setNewFolderParentId(group.folderId!);
                          setIsFolderModalOpen(true);
                        }}
                        className="p-1.5 text-vutruNhat hover:text-cam rounded-lg hover:bg-gray-200 dark:hover:bg-night-surface transition-colors"
                        title="Thêm chủ đề con bên trong"
                      >
                        <FolderPlus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditFolderData(folders.find((f) => f.id === group.folderId) || null);
                          setNewFolderParentId(null);
                          setIsFolderModalOpen(true);
                        }}
                        className="p-1.5 text-vutruNhat hover:text-cam rounded-lg hover:bg-gray-200 dark:hover:bg-night-surface transition-colors"
                        title="Sửa tên / chuyển chủ đề"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFolder(e, group.folderId!)}
                        className="p-1.5 text-vutruNhat hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-night-surface transition-colors"
                        title="Xóa chủ đề"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Items Row Container */}
                {expanded && (
                  <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border divide-y divide-gray-100 dark:divide-night-border overflow-hidden shadow-soft">
                    {group.items.length === 0 ? (
                      <div className="p-4 text-center text-xs text-vutruNhat italic">
                        Chưa có bài tập nào trong chủ đề này.
                      </div>
                    ) : (
                      group.items.map((item) => renderClassworkRow(item))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <ClassworkCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        classId={classroom.id}
        selectedFolderId={selectedFolderId !== 'ALL' ? selectedFolderId : undefined}
        onOpenExamPicker={() => setIsAttachExamModalOpen(true)}
        onOpenResourcePicker={(type) => {
          setResourceModalType(type);
          setIsAttachResourceModalOpen(true);
        }}
      />

      <AttachResourceModal
        isOpen={isAttachResourceModalOpen}
        onClose={() => setIsAttachResourceModalOpen(false)}
        classId={classroom.id}
        onSuccess={fetchClasswork}
        resourceType={resourceModalType}
      />

      <AttachExamModal
        isOpen={isAttachExamModalOpen}
        onClose={() => setIsAttachExamModalOpen(false)}
        classId={classroom.id}
        onSuccess={fetchClasswork}
        editData={editExamData}
      />

      <ClassFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        classId={classroom.id}
        editFolder={editFolderData}
        folders={folders}
        defaultParentId={newFolderParentId}
        onSuccess={fetchClasswork}
      />

      <MoveResourceModal
        isOpen={!!moveResourceItem}
        onClose={() => setMoveResourceItem(null)}
        classId={classroom.id}
        item={moveResourceItem}
        folders={folders}
        onSuccess={fetchClasswork}
      />
    </div>
  );
};

export default ClassworkList;
