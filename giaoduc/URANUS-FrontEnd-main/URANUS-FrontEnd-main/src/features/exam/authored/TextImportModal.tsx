import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import DOMPurify from 'dompurify';

import Portal from '../../../components/ui/Portal';
export interface ImportedQuestion {
  id: string;
  content: string;
  points: number;
  questionType: string;
  options: { id: string; content: string; isCorrect: boolean }[];
  explanation?: string;
}

export interface ImportedPassage {
  id: string;
  passageText: string;
  groupTitle?: string;
  questions: ImportedQuestion[];
}

interface TextImportModalProps {
  onClose: () => void;
  onImport: (questions: ImportedQuestion[], passages: ImportedPassage[]) => void;
}

const TextImportModal: React.FC<TextImportModalProps> = ({ onClose, onImport }) => {
  const [inputText, setInputText] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<ImportedQuestion[]>([]);
  const [previewPassages, setPreviewPassages] = useState<ImportedPassage[]>([]);
  const toast = useToast();

  useEffect(() => {
    // Simple parser
    const parseText = (text: string) => {
      const questions: ImportedQuestion[] = [];
      const passages: ImportedPassage[] = [];

      if (!text.trim()) {
        setPreviewQuestions([]);
        setPreviewPassages([]);
        return;
      }

      // 1. Split by passage groups if any (naive approach: match "Đọc đoạn văn:" or "Passage:")
      const passageRegex = /^(?:đọc đoạn|read the|passage|text\s*\d*):([\s\S]*?)(?=(?:đọc đoạn|read the|passage|text\s*\d*):|$)/gim;
      
      let textWithoutPassages = text;
      let match;
      while ((match = passageRegex.exec(text)) !== null) {
        const fullPassageBlock = match[0];
        const passageContentBlock = match[1].trim();
        textWithoutPassages = textWithoutPassages.replace(fullPassageBlock, '');

        // Extract passage text vs questions inside
        const questionSplit = passageContentBlock.split(/^(?:câu|question|q\.?)?\s*\d+[.):：]\s*/im);
        const passageText = questionSplit[0].trim();
        
        const currentPassage: ImportedPassage = {
          id: Date.now().toString() + Math.random().toString(),
          passageText,
          groupTitle: 'Đọc đoạn văn và trả lời câu hỏi',
          questions: []
        };

        for (let i = 1; i < questionSplit.length; i++) {
          const qBlock = questionSplit[i];
          const qParsed = parseQuestionBlock(qBlock);
          if (qParsed) currentPassage.questions.push(qParsed);
        }

        if (currentPassage.questions.length > 0) {
          passages.push(currentPassage);
        }
      }

      // 2. Parse standalone questions
      const standaloneSplit = textWithoutPassages.split(/^(?:câu|question|q\.?)?\s*\d+[.):：]\s*/im);
      for (let i = 1; i < standaloneSplit.length; i++) {
        const qBlock = standaloneSplit[i];
        const qParsed = parseQuestionBlock(qBlock);
        if (qParsed) questions.push(qParsed);
      }

      setPreviewQuestions(questions);
      setPreviewPassages(passages);
    };

    const timer = setTimeout(() => {
      parseText(inputText);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputText]);

  const parseQuestionBlock = (block: string): ImportedQuestion | null => {
    // block starts right after "Câu X:"
    // split by A. B. C. D.
    const optionRegex = /^[A-D][.):]\s*/im;
    const parts = block.split(optionRegex);
    
    if (parts.length < 2) return null; // No options found
    
    let content = parts[0].trim();
    let explanation = '';
    
    // Check for explanation at the end (e.g. Giải thích: ...)
    const explanationMatch = block.match(/^(?:giải thích|explanation|hd|hướng dẫn):([\s\S]*)$/im);
    if (explanationMatch) {
        explanation = explanationMatch[1].trim();
        // Remove explanation from the last option
        const lastPart = parts[parts.length - 1];
        parts[parts.length - 1] = lastPart.replace(explanationMatch[0], '').trim();
    }

    const options = [];
    for (let i = 1; i < parts.length; i++) {
      let optText = parts[i].trim();
      let isCorrect = false;

      // Check if it's the correct answer (starts with * or has "Đúng:")
      if (optText.startsWith('*') || optText.startsWith('→')) {
        isCorrect = true;
        optText = optText.substring(1).trim();
      }

      // Alternative: if there's an explicit "đáp án: A" somewhere? Handled loosely here.

      options.push({
        id: Date.now().toString() + Math.random().toString(),
        content: optText,
        isCorrect
      });
    }

    return {
      id: Date.now().toString() + Math.random().toString(),
      content: content,
      points: 1,
      questionType: 'MULTIPLE_CHOICE',
      options,
      explanation
    };
  };

  const handleImport = () => {
    if (previewQuestions.length === 0 && previewPassages.length === 0) {
      toast.error('Không tìm thấy câu hỏi nào hợp lệ.');
      return;
    }
    onImport(previewQuestions, previewPassages);
    onClose();
  };

  return (
    <Portal><div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden m-4">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Nhập đề từ văn bản (Regex Parser)</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-4 border-r border-gray-200 flex flex-col h-full overflow-hidden">
            <p className="text-sm text-gray-600 mb-2">Dán nội dung đề thi vào đây. Cú pháp hỗ trợ: Câu 1., 1., 1), A., B., *A. (đáp án đúng), Giải thích: ...</p>
            <textarea
              className="flex-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              placeholder="Câu 1. Thủ đô của Việt Nam là gì?&#10;A. TP.HCM&#10;*B. Hà Nội&#10;C. Đà Nẵng&#10;D. Cần Thơ&#10;Giải thích: Hà Nội là thủ đô của VN từ 1945."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-1/2 p-4 h-full overflow-y-auto bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Xem trước kết quả</h3>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                Tìm thấy: {previewQuestions.length + previewPassages.reduce((sum, p) => sum + p.questions.length, 0)} câu hỏi
              </span>
            </div>
            
            <div className="space-y-4">
              {previewPassages.map((p, pIdx) => (
                <div key={p.id} className="border border-indigo-200 bg-indigo-50/30 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-700 mb-2">{p.groupTitle}</h4>
                  <div className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{p.passageText}</div>
                  <div className="space-y-3 pl-4 border-l-2 border-indigo-200">
                    {p.questions.map((q, qIdx) => (
                      <div key={q.id} className="bg-white p-3 rounded border">
                        <div className="font-medium mb-2">Câu {qIdx + 1}: {q.content}</div>
                        <div className="space-y-1">
                          {q.options.map((o, oIdx) => (
                            <div key={o.id} className={`text-sm px-2 py-1 rounded ${o.isCorrect ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600'}`}>
                              {String.fromCharCode(65 + oIdx)}. {o.content} {o.isCorrect && <CheckCircle className="inline w-4 h-4 ml-1" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {previewQuestions.map((q, idx) => (
                <div key={q.id} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="font-medium mb-3">Câu {idx + 1}: {q.content}</div>
                  <div className="space-y-2">
                    {q.options.map((o, oIdx) => (
                      <div key={o.id} className={`text-sm px-3 py-2 rounded border ${o.isCorrect ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-gray-50 border-gray-100'}`}>
                        {String.fromCharCode(65 + oIdx)}. {o.content} {o.isCorrect && <CheckCircle className="inline w-4 h-4 ml-1 text-green-600" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="mt-3 text-sm bg-blue-50 text-blue-800 p-2 rounded">
                      <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
              
              {previewQuestions.length === 0 && previewPassages.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                  Nhập nội dung bên trái để xem trước
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleImport} disabled={previewQuestions.length === 0 && previewPassages.length === 0}>
            Nhập đề thi
          </Button>
        </div>
      </div>
    </div></Portal>
  );
};

export default TextImportModal;
