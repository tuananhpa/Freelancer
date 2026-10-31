import React from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { FileText, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface PdfViewerProps {
  url: string | null;
  loading?: boolean;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, loading }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const zoomPluginInstance = zoomPlugin({
    enableShortcuts: true,
  });

  if (loading) {
    return (
      // Khong ep min-h-[600px] o day nua - cha (ExamPdfEditor) co the chi
      // danh it cho hon 600px cho PdfViewer khi co them khoi audio ben duoi,
      // ep cung khien noi dung tran ra ngoai khung soan de (h-[800px] co dinh).
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 border rounded-xl">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500 font-medium">Đang tải tài liệu...</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">Chưa có file PDF nào được tải lên</p>
        <p className="text-gray-400 text-sm mt-2">Vui lòng tải lên đề thi định dạng PDF để tiếp tục</p>
      </div>
    );
  }

  const { ZoomInButton, ZoomOutButton } = zoomPluginInstance;

  return (
    <div className="border rounded-xl overflow-hidden h-full min-h-[600px] shadow-sm flex flex-col relative" style={{ touchAction: 'pan-x pan-y pinch-zoom' }}>
      
      {/* Floating Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2 bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
        <div title="Phóng to" className="flex items-center justify-center p-1">
          <ZoomInButton />
        </div>
        <div className="h-px bg-gray-200 w-full" />
        <div title="Thu nhỏ" className="flex items-center justify-center p-1">
          <ZoomOutButton />
        </div>
      </div>

      <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
        <Viewer
          fileUrl={url.startsWith('https://corsproxy.io/?url=') ? decodeURIComponent(url.split('url=')[1]) : url}
          plugins={[defaultLayoutPluginInstance, zoomPluginInstance]}
        />
      </Worker>
    </div>
  );
};

export default PdfViewer;
