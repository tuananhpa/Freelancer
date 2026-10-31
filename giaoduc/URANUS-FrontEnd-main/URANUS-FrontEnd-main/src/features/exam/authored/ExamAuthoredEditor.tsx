import { getApiErrorMessage } from '../../../services/api';
import React, { useState, useEffect } from 'react';

import { Plus, BookOpen, FileText } from 'lucide-react';
import Button from '../../../components/ui/Button';
import QuestionCard, { Question } from './QuestionCard';
import QuestionGroupBlock, { QuestionGroup } from './QuestionGroupBlock';
import TextImportModal, { ImportedQuestion, ImportedPassage } from './TextImportModal';
import SmartImportModal from './SmartImportModal';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

interface ExamAuthoredEditorProps {
  questions: Question[];
  questionGroups: QuestionGroup[];
  setQuestions: (qs: Question[]) => void;
  setQuestionGroups: (qg: QuestionGroup[]) => void;
  activeQuestionId: string | null;
  setActiveQuestionId: (id: string | null) => void;
}

const ExamAuthoredEditor: React.FC<ExamAuthoredEditorProps> = ({
  questions,
  questionGroups,
  setQuestions,
  setQuestionGroups,
  activeQuestionId,
  setActiveQuestionId
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Smart Import State
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [smartData, setSmartData] = useState<{
    questions: any[];
    passages: any[];
    fileName: string;
    fileUrl: string;
    meta: any;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const toast = useToast();

  const handleAddQuestion = () => {
    const newId = Date.now().toString() + Math.random().toString();
    setQuestions([
      ...questions,
      {
        id: newId,
        content: '',
        points: 1,
        skillTag: 'GENERAL',
        questionType: 'MULTIPLE_CHOICE',
        options: []
      }
    ]);
    setActiveQuestionId(newId);
  };

  const handleAddGroup = () => {
    const newId = Date.now().toString() + Math.random().toString();
    const qId = Date.now().toString() + Math.random().toString();
    setQuestionGroups([
      ...questionGroups,
      {
        id: newId,
        groupTitle: 'Đọc đoạn văn và trả lời câu hỏi',
        passageText: '',
        questions: [{
          id: qId,
          content: '',
          points: 1,
          skillTag: 'GENERAL',
          questionType: 'MULTIPLE_CHOICE',
          options: [],
          groupId: newId
        }]
      }
    ]);
    setActiveQuestionId(qId);
  };

  const handleImport = (importedQs: any[], importedPs: any[]) => {
    const newQuestions = importedQs.map((q: any) => ({
      ...q,
      skillTag: 'GENERAL',
    }));
    
    const newGroups = importedPs.map((p: any) => ({
      ...p,
      groupTitle: p.groupTitle || 'Đọc đoạn văn',
      questions: p.questions.map((q: any) => ({ ...q, skillTag: 'GENERAL', groupId: p.id }))
    }));

    setQuestions([...questions, ...newQuestions]);
    setQuestionGroups([...questionGroups, ...newGroups]);
    toast.success(`Đã nhập ${importedQs.length + importedPs.reduce((a,b)=>a+b.questions.length,0)} câu hỏi thành công!`);
    setShowImportModal(false);
    if (smartData?.fileUrl) {
      URL.revokeObjectURL(smartData.fileUrl);
    }
    setShowSmartModal(false);
  };

  const mapSmartImportData = (data: any): { questions: ImportedQuestion[]; passages: ImportedPassage[] } => {
    const passages: ImportedPassage[] = (data.passages || []).map((p: any) => ({
      id: p.id,
      instruction: p.instruction,
      content: p.content,
      questionNumbers: p.questionNumbers
    }));
    const mappedQuestions: ImportedQuestion[] = (data.structuredQuestions || data.questions || []).map((q: any) => ({
      id: Date.now().toString() + Math.random(),
      sourceNumber: q.sourceNumber,
      sectionId: q.sectionId,
      stem: q.stem || q.content,
      content: q.stem || q.content,
      points: q.points || 1,
      skillTag: q.skillTag || 'GENERAL',
      options: (q.options || []).map((o: any) => ({
        id: Date.now().toString() + Math.random(),
        content: o.content,
        isCorrect: o.isCorrect
      }))
    }));
    return { questions: mappedQuestions, passages };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/exams/import-structure', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data;
      const { questions: mappedQs, passages: mappedPs } = mapSmartImportData(data);
      
      if (mappedQs.length === 0) {
        toast.warning('Không tìm thấy câu hỏi nào trong file!');
        return;
      }
      
      setSmartData({
        questions: mappedQs,
        passages: mappedPs,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        meta: {
          parseMethod: data.parseMethod,
          message: data.message,
          totalExtracted: data.totalExtracted,
          mappedWithAnswerKey: data.mappedWithAnswerKey
        }
      });
      setShowSmartModal(true);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi phân tích file!'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Handlers cho độc lập ---
  const handleRemoveQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleAddOption = (qId: string) => {
    setQuestions(questions.map(q => q.id === qId ? {
      ...q,
      options: [...q.options, { id: Date.now().toString() + Math.random(), content: '', isCorrect: q.options.length === 0 }]
    } : q));
  };

  const handleRemoveOption = (qId: string, optId: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      const newOpts = q.options.filter(o => o.id !== optId);
      if (!newOpts.some(o => o.isCorrect) && newOpts.length > 0) newOpts[0].isCorrect = true;
      return { ...q, options: newOpts };
    }));
  };

  const handleOptionChange = (qId: string, optId: string, value: string) => {
    setQuestions(questions.map(q => q.id === qId ? {
      ...q, options: q.options.map(o => o.id === optId ? { ...o, content: value } : o)
    } : q));
  };

  const handleOptionCorrectToggle = (qId: string, optId: string) => {
    setQuestions(questions.map(q => q.id === qId ? {
      ...q, options: q.options.map(o => ({ ...o, isCorrect: o.id === optId }))
    } : q));
  };

  // --- Handlers cho nhóm ---
  const handleRemoveGroup = (gId: string) => {
    setQuestionGroups(questionGroups.filter(g => g.id !== gId));
  };

  const handleGroupChange = (gId: string, field: keyof QuestionGroup, value: any) => {
    setQuestionGroups(questionGroups.map(g => g.id === gId ? { ...g, [field]: value } : g));
  };

  const handleGroupQuestionChange = (gId: string, qId: string, field: keyof Question, value: any) => {
    setQuestionGroups(questionGroups.map(g => {
      if (g.id !== gId) return g;
      return { ...g, questions: g.questions.map(q => q.id === qId ? { ...q, [field]: value } : q) };
    }));
  };

  const handleRemoveGroupQuestion = (gId: string, qId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestionGroups(questionGroups.map(g => {
      if (g.id !== gId) return g;
      return { ...g, questions: g.questions.filter(q => q.id !== qId) };
    }));
  };

  const handleAddGroupQuestion = (gId: string) => {
    const newQId = Date.now().toString() + Math.random();
    setQuestionGroups(questionGroups.map(g => {
      if (g.id !== gId) return g;
      return {
        ...g, questions: [...g.questions, {
          id: newQId, content: '', points: 1, skillTag: 'GENERAL', questionType: 'MULTIPLE_CHOICE', options: [], groupId: gId
        }]
      };
    }));
    setActiveQuestionId(newQId);
  };

  const handleGroupAddOption = (gId: string, qId: string) => {
    setQuestionGroups(questionGroups.map(g => {
      if (g.id !== gId) return g;
      return {
        ...g, questions: g.questions.map(q => q.id === qId ? {
          ...q, options: [...q.options, { id: Date.now().toString() + Math.random(), content: '', isCorrect: q.options.length === 0 }]
        } : q)
      };
    }));
  };

  const handleGroupRemoveOption = (gId: string, qId: string, optId: string) => {
    setQuestionGroups(questionGroups.map(g => {
      if (g.id !== gId) return g;
      return {
        ...g, questions: g.questions.map(q => {
          if (q.id !== qId) return q;
          const newOpts = q.options.filter(o => o.id !== optId);
          if (!newOpts.some(o => o.isCorrect) && newOpts.length > 0) newOpts[0].isCorrect = true;
          return { ...q, options: newOpts };
        })
      };
    }));
  };

  const handleGroupOptionChange = (gId: string, qId: string, optId: string, value: string) => {
    setQuestionGroups(questionGroups.map(g => {
      if (g.id !== gId) return g;
      return {
        ...g, questions: g.questions.map(q => {
          if (q.id !== qId) return q;
          return { ...q, options: q.options.map(o => o.id === optId ? { ...o, content: value } : o) };
        })
      };
    }));
  };

  const handleGroupOptionCorrectToggle = (gId: string, qId: string, optId: string) => {
    setQuestionGroups(questionGroups.map(g => {
      if (g.id !== gId) return g;
      return {
        ...g, questions: g.questions.map(q => {
          if (q.id !== qId) return q;
          return { ...q, options: q.options.map(o => ({ ...o, isCorrect: o.id === optId })) };
        })
      };
    }));
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleAddQuestion} className="flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Thêm câu hỏi
          </Button>
          <Button onClick={handleAddGroup} variant="outline" className="flex items-center text-indigo-700 border-indigo-200 hover:bg-indigo-50 shadow-sm transition-colors">
            <BookOpen className="w-4 h-4 mr-2" /> Thêm nhóm đọc hiểu
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="flex items-center text-orange-600 border-orange-200 hover:bg-orange-50 shadow-sm transition-colors">
            <FileText className="w-4 h-4 mr-2" /> Nhập văn bản
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="outline" className="flex items-center text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-sm transition-colors">
            {isUploading ? (
              <span className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent"></span>
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Nhập từ File (PDF/Word)
          </Button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".pdf,.docx,.doc" 
        />
      </div>

      <div className="space-y-6">
        {/* Render standalone questions */}
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            isActive={activeQuestionId === q.id}
            onActivate={() => setActiveQuestionId(q.id)}
            onChange={(field, value) => handleQuestionChange(q.id, field, value)}
            onRemove={(e) => handleRemoveQuestion(q.id, e)}
            onAddOption={() => handleAddOption(q.id)}
            onRemoveOption={(optId) => handleRemoveOption(q.id, optId)}
            onOptionChange={(optId, value) => handleOptionChange(q.id, optId, value)}
            onOptionCorrectToggle={(optId) => handleOptionCorrectToggle(q.id, optId)}
          />
        ))}

        {/* Render question groups */}
        {questionGroups.map((g, idx) => (
          <QuestionGroupBlock
            key={g.id}
            group={g}
            index={idx}
            activeQuestionId={activeQuestionId}
            onActivateQuestion={setActiveQuestionId}
            onRemoveGroup={() => handleRemoveGroup(g.id)}
            onGroupChange={(field, value) => handleGroupChange(g.id, field, value)}
            onQuestionChange={(qId, field, value) => handleGroupQuestionChange(g.id, qId, field, value)}
            onRemoveQuestion={(qId, e) => handleRemoveGroupQuestion(g.id, qId, e)}
            onAddQuestionToGroup={() => handleAddGroupQuestion(g.id)}
            onAddOption={(qId) => handleGroupAddOption(g.id, qId)}
            onRemoveOption={(qId, optId) => handleGroupRemoveOption(g.id, qId, optId)}
            onOptionChange={(qId, optId, value) => handleGroupOptionChange(g.id, qId, optId, value)}
            onOptionCorrectToggle={(qId, optId) => handleGroupOptionCorrectToggle(g.id, qId, optId)}
          />
        ))}
        
        {questions.length === 0 && questionGroups.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">Chưa có câu hỏi nào. Bạn có thể thêm thủ công hoặc nhập từ văn bản.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={handleAddQuestion}><Plus className="w-4 h-4 mr-2" /> Thêm câu hỏi</Button>
            </div>
          </div>
        )}
      </div>

      {showImportModal && (
        <TextImportModal 
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
      
      {showSmartModal && smartData && (
        <SmartImportModal
          isOpen={showSmartModal}
          onClose={() => {
            if (smartData?.fileUrl) {
              URL.revokeObjectURL(smartData.fileUrl);
            }
            setShowSmartModal(false);
          }}
          onConfirm={handleImport}
          questions={smartData.questions}
          passages={smartData.passages}
          fileName={smartData.fileName}
          fileUrl={smartData.fileUrl}
          meta={smartData.meta}
        />
      )}
    </div>
  );
};

export default ExamAuthoredEditor;
