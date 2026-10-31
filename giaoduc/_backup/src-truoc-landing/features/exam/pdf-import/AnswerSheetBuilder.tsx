import React, { useState } from 'react';
import { Plus, Minus, Trash2, Settings, GripVertical, ChevronDown, ChevronUp, Calculator, Scale } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { getDefaultTfScoringConfig, TfScoringConfig, TfScoringThreshold, getStatementLabel } from '../examQuestionTypes';
import DistributePointsModal from '../../../components/exam/DistributePointsModal';

export interface TfStatement {
  id?: string;
  label: string; // 'a', 'b', 'c', 'd'
  content: string;
  isCorrect: boolean;
}

export interface AnswerSheetItem {
  id: string;
  orderIndex: number;
  type: 'ABCD' | 'TRUE_FALSE' | 'ESSAY';
  points: number;
  correctAnswer?: string; // ABCD: "A", ESSAY: text|||text, TRUE_FALSE: không dùng nữa (dùng statements)
  // TRUE_FALSE multi-statement fields
  statements?: TfStatement[]; // 4 ý a/b/c/d
  scoringConfig?: TfScoringConfig;
  optionsCount?: number;
  options?: { id?: string; content: string; isCorrect: boolean }[];
  explanation?: string;
}

/** Tạo 4 mệnh đề mặc định cho câu TRUE_FALSE */
function makeDefaultStatements(count = 4): TfStatement[] {
  return Array.from({ length: count }, (_, i) => ({
    label: getStatementLabel(i),
    content: '',
    isCorrect: true,
  }));
}

interface AnswerSheetBuilderProps {
  sheetItems: AnswerSheetItem[];
  setSheetItems: React.Dispatch<React.SetStateAction<AnswerSheetItem[]>>;
}

const AnswerSheetBuilder: React.FC<AnswerSheetBuilderProps> = ({ sheetItems, setSheetItems }) => {
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkType, setBulkType] = useState<'ABCD' | 'TRUE_FALSE' | 'ESSAY'>('ABCD');
  const [expandedScoringIds, setExpandedScoringIds] = useState<Record<string, boolean>>({});
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);

  const toggleScoring = (id: string) =>
    setExpandedScoringIds(prev => ({ ...prev, [id]: !prev[id] }));

  const handleApplyDistributedPoints = (updatedPoints: { id: string; points: number }[]) => {
    const pointMap = new Map(updatedPoints.map(p => [p.id, p.points]));
    setSheetItems(prev => prev.map(item => {
      const newPoint = pointMap.get(item.id);
      if (newPoint !== undefined) {
        return { ...item, points: newPoint };
      }
      return item;
    }));
  };

  const addBulkItems = () => {
    const newItems: AnswerSheetItem[] = [];
    const startIndex = sheetItems.length;

    for (let i = 0; i < bulkCount; i++) {
      if (bulkType === 'TRUE_FALSE') {
        newItems.push({
          id: Date.now().toString() + Math.random().toString(),
          orderIndex: startIndex + i,
          type: 'TRUE_FALSE',
          points: 1,
          statements: makeDefaultStatements(4),
          scoringConfig: getDefaultTfScoringConfig(4),
        });
      } else {
        newItems.push({
          id: Date.now().toString() + Math.random().toString(),
          orderIndex: startIndex + i,
          type: bulkType,
          points: 1,
          optionsCount: bulkType === 'ABCD' ? 4 : undefined,
          correctAnswer: bulkType === 'ABCD' ? 'A' : undefined,
        });
      }
    }
    setSheetItems([...sheetItems, ...newItems]);
  };

  const removeItem = (id: string) => {
    const newItems = sheetItems.filter(item => item.id !== id).map((item, index) => ({
      ...item,
      orderIndex: index
    }));
    setSheetItems(newItems);
  };

  const updateItem = (id: string, field: keyof AnswerSheetItem, value: any) => {
    setSheetItems((prev: AnswerSheetItem[]) =>
      prev.map((item: AnswerSheetItem) => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const updateStatement = (itemId: string, stmtIdx: number, field: keyof TfStatement, value: any) => {
    setSheetItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const newStmts = (item.statements || []).map((s, i) =>
        i === stmtIdx ? { ...s, [field]: value } : s
      );
      return { ...item, statements: newStmts };
    }));
  };

  const addStatement = (itemId: string) => {
    setSheetItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const cur = item.statements || [];
      const newStmts = [...cur, { label: getStatementLabel(cur.length), content: '', isCorrect: true }];
      return {
        ...item,
        statements: newStmts,
        scoringConfig: getDefaultTfScoringConfig(newStmts.length),
      };
    }));
  };

  const removeStatement = (itemId: string, stmtIdx: number) => {
    setSheetItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const newStmts = (item.statements || []).filter((_, i) => i !== stmtIdx)
        .map((s, i) => ({ ...s, label: getStatementLabel(i) }));
      return {
        ...item,
        statements: newStmts,
        scoringConfig: getDefaultTfScoringConfig(newStmts.length),
      };
    }));
  };

  const updateScoringThreshold = (itemId: string, thresholdIdx: number, ratio: number) => {
    setSheetItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const sc = item.scoringConfig as { type: 'PARTIAL'; thresholds: TfScoringThreshold[] };
      if (!sc || sc.type !== 'PARTIAL') return item;
      return {
        ...item,
        scoringConfig: {
          ...sc,
          thresholds: sc.thresholds.map((t, i) => i === thresholdIdx ? { ...t, ratio } : t),
        },
      };
    }));
  };

  const setScoringType = (itemId: string, type: 'ALL_OR_NOTHING' | 'PARTIAL') => {
    setSheetItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const stmtCount = (item.statements || []).length;
      return {
        ...item,
        scoringConfig: type === 'ALL_OR_NOTHING'
          ? { type: 'ALL_OR_NOTHING' }
          : getDefaultTfScoringConfig(stmtCount),
      };
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(sheetItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSheetItems(items.map((item, idx) => ({ ...item, orderIndex: idx })));
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> Cấu hình Phiếu trả lời
        </h3>
        <p className="text-xs text-gray-500 mt-1">Định nghĩa các ô nhập đáp án cho học sinh.</p>
      </div>

      <div className="p-4 border-b bg-white flex flex-col gap-3">
        <div className="text-sm font-medium text-gray-700">Thêm nhanh câu hỏi</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="100"
            value={bulkCount}
            onChange={e => setBulkCount(parseInt(e.target.value) || 1)}
            className="w-16 p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Select
            value={bulkType}
            onChange={(v) => setBulkType(v as any)}
            className="p-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 flex-1"
            options={[
              { value: 'ABCD', label: 'Trắc nghiệm (A, B, C, D...)' },
              { value: 'TRUE_FALSE', label: 'Đúng / Sai (nhiều mệnh đề)' },
              { value: 'ESSAY', label: 'Tự luận / Điền khuyết' },
            ]}
          />
          <Button size="sm" onClick={addBulkItems}>
            <Plus className="w-4 h-4 mr-1" /> Thêm
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
        {sheetItems.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            Chưa có câu hỏi nào trong phiếu.
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sheet-items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {sheetItems.map((item, idx) => (
                    <Draggable key={item.id} draggableId={item.id} index={idx}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-white p-3 rounded-lg border flex flex-col gap-3 shadow-sm hover:border-blue-300 transition-colors"
                        >
                          {/* Row 1: Item config */}
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="w-16 font-semibold text-gray-700">Câu {idx + 1}</div>

                            <div className="flex-1">
                              <Select
                                value={item.type}
                                onChange={(v) => {
                                  const nextType = v as AnswerSheetItem['type'];

                                  if (nextType === 'TRUE_FALSE') {
                                    setSheetItems(prev => prev.map(it => it.id !== item.id ? it : {
                                      ...it,
                                      type: 'TRUE_FALSE',
                                      correctAnswer: undefined,
                                      statements: makeDefaultStatements(4),
                                      scoringConfig: getDefaultTfScoringConfig(4),
                                    }));
                                  } else {
                                    setSheetItems(prev => prev.map(it => it.id !== item.id ? it : {
                                      ...it,
                                      type: nextType,
                                      optionsCount: nextType === 'ABCD' ? (it.optionsCount || 4) : undefined,
                                      statements: undefined,
                                      scoringConfig: undefined,
                                      correctAnswer: nextType === 'ABCD' ? 'A' : '',
                                    }));
                                  }
                                }}
                                className="w-full text-sm p-1.5 border rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                options={[
                                  { value: 'ABCD', label: 'Trắc nghiệm' },
                                  { value: 'TRUE_FALSE', label: 'Đúng / Sai (nhiều ý)' },
                                  { value: 'ESSAY', label: 'Tự luận' },
                                ]}
                              />
                            </div>

                            <div className="w-20">
                              <input
                                type="number"
                                min="0"
                                step="0.25"
                                value={item.points}
                                onChange={e => updateItem(item.id, 'points', parseFloat(e.target.value) || 0)}
                                className="w-full text-sm p-1.5 border rounded-md text-center outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                                title="Điểm"
                              />
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Row 2: Correct Answer Selection */}
                          <div className="pl-10 flex items-start gap-3">
                            <span className="text-xs font-semibold text-gray-500 w-16 pt-1">Đáp án:</span>
                            <div className="flex flex-1 items-center gap-2 flex-wrap">
                              {item.type === 'ABCD' && (
                                <>
                                  {Array.from({ length: item.optionsCount || 4 }, (_, i) => String.fromCharCode(65 + i)).map(opt => (
                                    <button
                                      key={opt}
                                      onClick={() => updateItem(item.id, 'correctAnswer', opt)}
                                      className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                                        item.correctAnswer === opt
                                          ? 'bg-blue-600 text-white border-blue-600 scale-105'
                                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                  <div className="flex items-center gap-1 ml-2 border-l pl-2">
                                    <button
                                      onClick={() => updateItem(item.id, 'optionsCount', Math.max(2, (item.optionsCount || 4) - 1))}
                                      className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                                      disabled={(item.optionsCount || 4) <= 2}
                                      title="Bớt lựa chọn"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => updateItem(item.id, 'optionsCount', Math.min(8, (item.optionsCount || 4) + 1))}
                                      className="p-1 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                                      disabled={(item.optionsCount || 4) >= 8}
                                      title="Thêm lựa chọn"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              )}

                              {item.type === 'ESSAY' && (() => {
                                const ansArr = typeof item.correctAnswer === 'string' ? item.correctAnswer.split('|||') : [''];
                                if (ansArr.length === 0) ansArr.push('');
                                return (
                                  <div className="flex flex-col gap-2 flex-1">
                                    {ansArr.map((ans, ansIdx) => (
                                      <div key={ansIdx} className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          placeholder="Nhập đáp án đúng..."
                                          value={ans}
                                          onChange={(e) => {
                                            const newArr = [...ansArr];
                                            newArr[ansIdx] = e.target.value;
                                            updateItem(item.id, 'correctAnswer', newArr.join('|||'));
                                          }}
                                          className="flex-1 text-sm p-1.5 px-3 border border-gray-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-inner"
                                        />
                                        <button
                                          onClick={() => {
                                            const newArr = [...ansArr];
                                            newArr.splice(ansIdx, 1);
                                            if (newArr.length === 0) newArr.push('');
                                            updateItem(item.id, 'correctAnswer', newArr.join('|||'));
                                          }}
                                          className="text-gray-400 hover:text-red-500 p-1"
                                        >
                                          <Trash2 className="w-4 h-4"/>
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const newArr = [...ansArr, ''];
                                        updateItem(item.id, 'correctAnswer', newArr.join('|||'));
                                      }}
                                      className="self-start text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100"
                                    >
                                      <Plus className="w-3 h-3" /> Thêm đáp án khác
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* TRUE_FALSE: Multi-statement editor */}
                          {item.type === 'TRUE_FALSE' && (
                            <div className="pl-10 flex flex-col gap-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-blue-600">Các mệnh đề Đúng / Sai:</span>
                                <button
                                  type="button"
                                  onClick={() => addStatement(item.id)}
                                  className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                                >
                                  <Plus className="w-3 h-3" /> Thêm ý
                                </button>
                              </div>

                              <div className="space-y-1.5">
                                {(item.statements || []).map((stmt, si) => (
                                  <div key={si} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                    <span className="text-xs font-extrabold text-gray-500 w-5 shrink-0">{stmt.label})</span>
                                    <input
                                      type="text"
                                      placeholder={`Nội dung mệnh đề ${stmt.label})...`}
                                      value={stmt.content}
                                      onChange={e => updateStatement(item.id, si, 'content', e.target.value)}
                                      className="flex-1 text-xs p-1.5 border border-gray-200 rounded outline-none focus:border-blue-400 bg-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateStatement(item.id, si, 'isCorrect', true)}
                                      className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                        stmt.isCorrect
                                          ? 'bg-green-500 border-green-500 text-white'
                                          : 'bg-white border-gray-200 text-gray-400 hover:border-green-300'
                                      }`}
                                    >
                                      Đúng
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateStatement(item.id, si, 'isCorrect', false)}
                                      className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${
                                        !stmt.isCorrect
                                          ? 'bg-red-500 border-red-500 text-white'
                                          : 'bg-white border-gray-200 text-gray-400 hover:border-red-300'
                                      }`}
                                    >
                                      Sai
                                    </button>
                                    {(item.statements || []).length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeStatement(item.id, si)}
                                        className="text-gray-300 hover:text-red-500 p-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Scoring config toggle */}
                              <button
                                type="button"
                                onClick={() => toggleScoring(item.id)}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 mt-1 self-start font-semibold"
                              >
                                <Scale size={13} aria-hidden="true" />
                                <span>Cách tính điểm</span>
                                {expandedScoringIds[item.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              {expandedScoringIds[item.id] && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                                  {/* Scoring type toggle */}
                                  <div className="flex gap-2">
                                    {[
                                      { label: 'Đúng hết mới tính', value: 'ALL_OR_NOTHING' as const },
                                      { label: 'Tính theo ý sai', value: 'PARTIAL' as const },
                                    ].map(opt => {
                                      const current = item.scoringConfig?.type ?? 'ALL_OR_NOTHING';
                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => setScoringType(item.id, opt.value)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                            current === opt.value
                                              ? 'bg-blue-600 border-blue-600 text-white'
                                              : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400'
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {item.scoringConfig?.type === 'PARTIAL' && (
                                    <div className="space-y-1.5">
                                      <p className="text-[11px] text-gray-500">% điểm khi sai X ý (0% = không điểm):</p>
                                      {(item.scoringConfig as { type: 'PARTIAL'; thresholds: TfScoringThreshold[] }).thresholds.map((t, ti) => (
                                        <div key={ti} className="flex items-center gap-2">
                                          <span className="text-xs text-gray-500 w-16 shrink-0">Sai {t.wrongCount} ý:</span>
                                          <input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={5}
                                            value={Math.round(t.ratio * 100)}
                                            onChange={e => updateScoringThreshold(item.id, ti, Number(e.target.value) / 100)}
                                            className="flex-1 accent-blue-600 h-1.5"
                                          />
                                          <span className={`text-xs font-bold w-10 text-right ${t.ratio === 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                            {Math.round(t.ratio * 100)}%
                                          </span>
                                        </div>
                                      ))}
                                      <p className="text-[10px] text-gray-400">
                                        VD chuẩn BGDĐT: Sai 1 ý = 50% · Sai 2 ý = 25% · Sai 3 ý = 10% · Sai ≥4 ý = 0
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Giai thich dap an chi tiet - hoc sinh se thay o man hinh xem lai bai sau khi nop */}
                          <div className="pl-10">
                            <textarea
                              value={item.explanation || ''}
                              onChange={e => updateItem(item.id, 'explanation', e.target.value)}
                              placeholder="Giải thích đáp án chi tiết (không bắt buộc) - hiển thị khi học sinh xem lại bài..."
                              rows={2}
                              className="w-full text-xs p-2 border border-gray-200 rounded-lg outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-amber-50/50 placeholder:text-gray-400 resize-y"
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50 flex flex-wrap justify-between items-center text-sm gap-2">
        <span className="text-gray-600 font-medium">Tổng số câu: {sheetItems.length}</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-bold">
            Tổng điểm: <span className="text-cam">{sheetItems.reduce((acc, curr) => acc + (curr.points || 0), 0).toFixed(2)}</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDistributeModalOpen(true)}
            disabled={sheetItems.length === 0}
            className="px-3 py-1.5 bg-white border border-gray-300 text-vutru hover:text-cam hover:border-cam/50 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
            title="Chia đều điểm cho các câu trong phiếu trả lời"
          >
            <Calculator size={14} className="text-cam" />
            <span>Chia đều điểm</span>
          </button>
        </div>
      </div>

      <DistributePointsModal
        isOpen={isDistributeModalOpen}
        onClose={() => setIsDistributeModalOpen(false)}
        questions={sheetItems.map(item => ({
          id: item.id,
          points: item.points || 0,
          questionType: item.type === 'ABCD' ? 'MULTIPLE_CHOICE' : item.type === 'TRUE_FALSE' ? 'TRUE_FALSE' : 'ESSAY',
        }))}
        onApply={handleApplyDistributedPoints}
        defaultTotalPoints={10}
      />
    </div>
  );
};

export default AnswerSheetBuilder;
