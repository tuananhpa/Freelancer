import re

with open('src/features/admin/StudentImport.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports and preview states
content = content.replace(
    "import ConfirmDialog from '../../components/ui/ConfirmDialog';",
    "import ConfirmDialog from '../../components/ui/ConfirmDialog';\nimport * as XLSX from 'xlsx';"
)

content = content.replace(
    "const [classroomId, setClassroomId] = useState('');\n\n  // ===================== SAVED STUDENTS STATE =====================",
    "const [classroomId, setClassroomId] = useState('');\n\n  // ===================== PREVIEW STATE =====================\n  const [showPreviewModal, setShowPreviewModal] = useState(false);\n  const [previewData, setPreviewData] = useState<any[]>([]);\n\n  // ===================== SAVED STUDENTS STATE ====================="
)

# 2. Add Add Student states and Edit Classroom state
content = content.replace(
    "const [editForm, setEditForm] = useState({\n    studentCode: '',\n    fullName: '',\n    dateOfBirth: '',\n    phone: '',\n    facility: ''\n  });",
    "const [editForm, setEditForm] = useState({\n    studentCode: '',\n    fullName: '',\n    dateOfBirth: '',\n    phone: '',\n    facility: '',\n    classroomIds: [] as string[]\n  });"
)

content = content.replace(
    "// Delete confirmation\n  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);",
    "// Delete confirmation\n  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);\n\n  // Manual Add Student\n  const [showAddStudentModal, setShowAddStudentModal] = useState(false);\n  const [addStudentForm, setAddStudentForm] = useState({\n    studentCode: '',\n    fullName: '',\n    dateOfBirth: '',\n    phone: '',\n    facility: ''\n  });\n  const [addingStudent, setAddingStudent] = useState(false);\n  const [addStudentError, setAddStudentError] = useState('');"
)

# 3. handlePreview function and handleImport change
handle_preview = """
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
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const rows = json.slice(1).filter((r: any) => r.length > 0);
        
        const parsedPreview = rows.map((r: any) => ({
          studentCode: String(r[0] || ''),
          fullName: String(r[1] || ''),
          dateOfBirth: r[2] ? String(r[2]) : '',
          phone: r[3] ? String(r[3]) : '',
          facility: r[4] ? String(r[4]) : ''
        })).filter((r: any) => r.studentCode && r.fullName);
        
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
"""
content = content.replace("const handleImport = async () => {\n", handle_preview.lstrip())

# 4. handleEditSubmit change and handleAddStudentSubmit
handle_edit = """
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
    } catch (err: any) {
      setAddStudentError(getApiErrorMessage(err, 'Lỗi khi thêm học sinh'));
    } finally {
      setAddingStudent(false);
    }
  };
"""
content = re.sub(r'const handleEditSubmit = async \(e: React\.FormEvent\) => \{.*?setSavingStudent\(false\);\n    \}\n  \};', handle_edit.strip(), content, flags=re.DOTALL)

# 5. Change Import Data button to call handlePreview
content = content.replace('onClick={handleImport}', 'onClick={handlePreview}')

# 6. Change Edit button onClick to load classroomIds
content = content.replace(
    "studentCode: p.studentCode,\n                                  fullName: p.fullName,\n                                  dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',\n                                  phone: p.phone || '',\n                                  facility: p.facility || ''",
    "studentCode: p.studentCode,\n                                  fullName: p.fullName,\n                                  dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',\n                                  phone: p.phone || '',\n                                  facility: p.facility || '',\n                                  classroomIds: p.enrollments?.map(e => e.classroomId) || []"
)

# 7. Add HTML blocks for Modals
add_html = """
                    <div className="flex gap-2 mt-4 justify-center">
                      <button
                        onClick={() => { setActiveTab('import'); setClassroomId(selectedGroup.id); }}
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
"""
content = re.sub(r'<button\s*onClick=\{\(\) => \{ setActiveTab\(\'import\'\); setClassroomId\(selectedGroup\.id\); \}\}\s*className="mt-4 btn btn-chinh px-5 py-2 text-sm"\s*>\s*<UploadCloud size=\{15\} className="inline mr-1" />\s*Import học sinh vào lớp này\s*</button>', add_html.strip(), content, flags=re.DOTALL)


add_html_toolbar = """
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setActiveTab('import'); setClassroomId(selectedGroup.id); }}
                          className="btn border border-gray-200 dark:border-night-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-night-elevated px-4 py-2 text-sm whitespace-nowrap"
                          title="Import Excel"
                        >
                          <UploadCloud size={16} />
                        </button>
                        <button
                          onClick={() => setShowAddStudentModal(true)}
                          className="btn btn-chinh px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1.5"
                        >
                          <Plus size={16} />
                          Thêm HS
                        </button>
                      </div>
"""
content = re.sub(r'</select>\n\s*</div>\n\s*</div>\n\s*<div className="overflow-x-auto">', r'</select>\n                      </div>\n' + add_html_toolbar + r'\n                    </div>\n                    \n                    <div className="overflow-x-auto">', content, flags=re.DOTALL)


modals = """
      {/* ==================== PREVIEW MODAL ==================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
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
            
            <div className="overflow-y-auto p-4 flex-1">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-night-surface shadow-sm z-10">
                  <tr className="bg-gray-50 dark:bg-night-elevated">
                    <th className="text-left p-3 font-semibold text-gray-600 dark:text-night-muted border-b dark:border-night-border rounded-tl-lg">#</th>
                    <th className="text-left p-3 font-semibold text-gray-600 dark:text-night-muted border-b dark:border-night-border">Mã HS</th>
                    <th className="text-left p-3 font-semibold text-gray-600 dark:text-night-muted border-b dark:border-night-border">Họ tên</th>
                    <th className="text-left p-3 font-semibold text-gray-600 dark:text-night-muted border-b dark:border-night-border">Ngày sinh</th>
                    <th className="text-left p-3 font-semibold text-gray-600 dark:text-night-muted border-b dark:border-night-border">Số ĐT</th>
                    <th className="text-left p-3 font-semibold text-gray-600 dark:text-night-muted border-b dark:border-night-border rounded-tr-lg">Cơ sở</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-night-elevated/50 border-b border-gray-50 dark:border-night-border">
                      <td className="p-3 text-gray-400">{i + 1}</td>
                      <td className="p-3 font-mono text-camDam font-medium">{row.studentCode}</td>
                      <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{row.fullName}</td>
                      <td className="p-3 text-gray-600 dark:text-night-muted">{row.dateOfBirth}</td>
                      <td className="p-3 text-gray-600 dark:text-night-muted">{row.phone}</td>
                      <td className="p-3 text-gray-600 dark:text-night-muted">{row.facility}</td>
                    </tr>
                  ))}
                  {previewData.length > 50 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500 italic bg-gray-50/50 dark:bg-night-elevated/20">
                        ... Và {previewData.length - 50} dòng khác
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
        </div>
      )}

      {/* ==================== MODAL: Thêm học sinh thủ công ==================== */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ngày sinh</label>
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
        </div>
      )}

      {/* ==================== EDIT STUDENT MODAL ==================== */}
"""
content = content.replace('{/* ==================== EDIT STUDENT MODAL ==================== */}', modals)

edit_ui = """
                </div>
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
"""
content = re.sub(r'</div>\s*\{editError && \(', edit_ui.strip(), content, flags=re.DOTALL)

with open('src/features/admin/StudentImport.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
