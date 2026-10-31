import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { Course, Lesson } from '../../../services/courseApi';

interface CurriculumTabProps {
  course: Course;
  onDragEnd: (result: DropResult) => Promise<void>;
  onAddSection: () => void;
  onDeleteSection: (secId: string) => void;
  onAddLesson: (secId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onGoToOverview: () => void;
}

const CurriculumTab: React.FC<CurriculumTabProps> = ({
  course,
  onDragEnd,
  onAddSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onGoToOverview
}) => {
  if (course.id === 'draft') {
    return (
      <div className="text-center py-20 bg-kem rounded-3xl border-2 border-dashed border-cam/20">
        <LayoutGrid className="w-16 h-16 text-cam/40 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-vutru mb-2">Chưa lưu khóa học</h3>
        <p className="text-gray-500 mb-6">Bạn cần Lưu thông tin cơ bản trước khi tạo chương trình giảng dạy.</p>
        <button 
          onClick={onGoToOverview}
          className="px-6 py-2.5 rounded-full font-bold text-white bg-cam"
        >
          Quay lại Tổng quan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="course" type="section">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
              
              {course.sections?.map((section, sIdx) => (
                <Draggable key={section.id} draggableId={section.id} index={sIdx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-gray-50 rounded-2xl border ${snapshot.isDragging ? 'border-cam shadow-lg' : 'border-gray-200'} overflow-hidden transition-all`}
                    >
                      {/* Section Header */}
                      <div className="bg-gray-100 p-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div {...provided.dragHandleProps} className="text-gray-400 hover:text-cam cursor-grab">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-vutru">Phần {sIdx + 1}: {section.title}</h3>
                        </div>
                        <button onClick={() => onDeleteSection(section.id)} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Lessons List */}
                      <Droppable droppableId={section.id} type="lesson">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="p-4 space-y-2 min-h-[50px]">
                            {section.lessons?.map((lesson, lIdx) => (
                              <Draggable key={lesson.id} draggableId={lesson.id} index={lIdx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`bg-white rounded-xl border p-3 flex items-center justify-between group ${snapshot.isDragging ? 'border-cam shadow-md' : 'border-gray-200 hover:border-cam/30'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div {...provided.dragHandleProps} className="text-gray-300 hover:text-cam cursor-grab">
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-kem text-cam text-xs font-bold">
                                        {lIdx + 1}
                                      </div>
                                      <span className="font-medium text-vutru text-sm">{lesson.title}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => onEditLesson(lesson)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-cam bg-cam/10 hover:bg-cam/20"
                                      >
                                        Chỉnh sửa
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            
                            <button 
                              onClick={() => onAddLesson(section.id)}
                              className="w-full mt-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-bold text-sm hover:border-cam hover:text-cam hover:bg-cam/5 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" /> Thêm Bài học
                            </button>
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="mt-8">
        <button 
          onClick={onAddSection}
          className="btn bg-vutru text-white hover:bg-vutru/90 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" /> Thêm Phần mới
        </button>
      </div>
    </div>
  );
};

export default CurriculumTab;
