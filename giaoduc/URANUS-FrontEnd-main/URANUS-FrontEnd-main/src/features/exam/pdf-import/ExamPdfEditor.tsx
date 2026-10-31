import React, { useRef, useState } from 'react';
import { UploadCloud, File, Trash2, Headphones, Loader2, ListMusic } from 'lucide-react';
import PdfViewer from './PdfViewer';
import AnswerSheetBuilder, { AnswerSheetItem } from './AnswerSheetBuilder';
import Button from '../../../components/ui/Button';
import { SlimAudioPlayer } from '../../../components/common/LessonMediaPlayer';
import { mediaApi } from '../../../services/mediaApi';
import { useToast } from '../../../context/ToastContext';

export interface ExamAudioTrack {
  label: string;
  url: string;
}

interface ExamPdfEditorProps {
  pdfUrl: string | null;
  setPdfUrl: (url: string | null) => void;
  setPdfFile: (file: File | null) => void;
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  setAudioFile: (file: File | null) => void;
  audioTracks: ExamAudioTrack[];
  setAudioTracks: React.Dispatch<React.SetStateAction<ExamAudioTrack[]>>;
  sheetItems: AnswerSheetItem[];
  setSheetItems: React.Dispatch<React.SetStateAction<AnswerSheetItem[]>>;
}

const ExamPdfEditor: React.FC<ExamPdfEditorProps> = ({ pdfUrl, setPdfUrl, setPdfFile, audioUrl, setAudioUrl, setAudioFile, audioTracks, setAudioTracks, sheetItems, setSheetItems }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const trackInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload - create object URL for local viewing
    const objectUrl = URL.createObjectURL(file);
    setPdfUrl(objectUrl);
    setPdfFile(file);
  };

  const handleRemovePdf = () => {
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setPdfFile(null);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);
    setAudioFile(file);
  };

  const handleRemoveAudio = () => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioFile(null);
  };

  const handleAddTrack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTrack(true);
    try {
      const uploadRes = await mediaApi.uploadFile(file, 'exams');
      setAudioTracks(prev => [...prev, { label: `Part ${prev.length + 1}`, url: uploadRes.url }]);
    } catch (err) {
      toast.error('Không tải lên được file audio. Thử lại nhé.');
    } finally {
      setUploadingTrack(false);
      e.target.value = '';
    }
  };

  const handleTrackLabelChange = (index: number, label: string) => {
    setAudioTracks(prev => prev.map((t, i) => i === index ? { ...t, label } : t));
  };

  const handleRemoveTrack = (index: number) => {
    setAudioTracks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
      {/* Cột trái: PDF Viewer */}
      <div className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <File className="w-5 h-5 text-blue-600" /> Tài liệu Đề thi
          </h3>
          
          <div>
            <input 
              type="file" 
              accept="application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {!pdfUrl ? (
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="w-4 h-4 mr-2" /> Tải lên PDF
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleRemovePdf}>
                <Trash2 className="w-4 h-4 mr-2" /> Gỡ bỏ file
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex-1 p-2 bg-gray-100 overflow-hidden min-h-0">
          <PdfViewer url={pdfUrl} />
        </div>

        {/* File am thanh bai nghe - tuy chon, danh cho de KET/Listening */}
        <div className="border-t bg-gray-50 shrink-0">
          <div className="p-4 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <Headphones className="w-4 h-4 text-blue-600" /> File âm thanh bài nghe (tùy chọn)
            </h3>
            <div>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                ref={audioInputRef}
                onChange={handleAudioFileChange}
              />
              {!audioUrl ? (
                <Button size="sm" variant="outline" onClick={() => audioInputRef.current?.click()}>
                  <UploadCloud className="w-4 h-4 mr-2" /> Tải lên Audio
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleRemoveAudio}>
                  <Trash2 className="w-4 h-4 mr-2" /> Gỡ bỏ file
                </Button>
              )}
            </div>
          </div>
          {audioUrl && (
            // Control mac dinh cua trinh duyet (truoc day dung o day de tranh
            // tran giao dien) van bi che la xau/khong dong bo giao dien - doi
            // sang SlimAudioPlayer, chi cao ~44px co dinh nen van an toan
            // khong tran nhu AudioPlayerCard truoc do.
            <div className="px-4 pb-4">
              <SlimAudioPlayer url={audioUrl} className="w-full" />
            </div>
          )}
        </div>

        {/* Nhiều file audio theo Part - dành cho bài nghe có nhiều part, mỗi part 1 file khác nhau */}
        <div className="border-t bg-gray-50 shrink-0">
          <div className="p-4 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <ListMusic className="w-4 h-4 text-blue-600" /> Audio theo từng Part (tùy chọn — nếu bài nghe có nhiều file)
            </h3>
            <div>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                ref={trackInputRef}
                onChange={handleAddTrack}
              />
              <Button size="sm" variant="outline" disabled={uploadingTrack} onClick={() => trackInputRef.current?.click()}>
                {uploadingTrack ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tải lên...</> : <><UploadCloud className="w-4 h-4 mr-2" /> Thêm Part</>}
              </Button>
            </div>
          </div>
          {audioTracks.length > 0 && (
            <div className="px-4 pb-4 space-y-2">
              {audioTracks.map((track, i) => (
                <div key={i} className="flex items-center gap-2 bg-white border rounded-lg p-2">
                  <input
                    type="text"
                    value={track.label}
                    onChange={(e) => handleTrackLabelChange(i, e.target.value)}
                    className="w-24 shrink-0 text-sm font-bold border border-gray-200 rounded-md px-2 py-1.5 focus:border-cam outline-none"
                    placeholder={`Part ${i + 1}`}
                  />
                  <SlimAudioPlayer url={track.url} className="flex-1" />
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(i)}
                    className="text-red-400 hover:text-red-500 p-1.5 shrink-0"
                    title="Xóa track này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cột phải: Phiếu trả lời */}
      <div className="flex flex-col h-full overflow-hidden">
        <AnswerSheetBuilder sheetItems={sheetItems} setSheetItems={setSheetItems} />
      </div>
    </div>
  );
};

export default ExamPdfEditor;
