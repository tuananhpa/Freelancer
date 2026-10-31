import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CardDraft, CardSeparator, TermSeparator } from '../../types/flashcard';
import { parseCsvFile, parseImportText } from '../../utils/importParser';
import { useToast } from '../../context/ToastContext';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cards: CardDraft[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const toast = useToast();
  const [text, setText] = useState('');
  const [termSeparator, setTermSeparator] = useState<TermSeparator>('tab');
  const [cardSeparator, setCardSeparator] = useState<CardSeparator>('newline');
  const [customTermSeparator, setCustomTermSeparator] = useState('');
  const [customCardSeparator, setCustomCardSeparator] = useState('');

  const preview = useMemo(
    () => parseImportText(text, termSeparator, cardSeparator, customTermSeparator, customCardSeparator),
    [text, termSeparator, cardSeparator, customTermSeparator, customCardSeparator]
  );

  if (!isOpen) return null;

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const cards = parseCsvFile(content);
      if (cards.length > 0) {
        onImport(cards);
        onClose();
      } else {
        toast.error('Không thể đọc file CSV. Định dạng: thuật ngữ,định nghĩa (mỗi dòng một thẻ).');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = () => {
    if (preview.length === 0) {
      toast.warning('Không có thẻ nào để nhập. Kiểm tra lại định dạng dữ liệu.');
      return;
    }
    onImport(preview);
    setText('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-vutru/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-night-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-cam/10 dark:border-night-border my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-night-border">
          <div>
            <h2 className="text-xl font-bold text-vutru">Nhập dữ liệu</h2>
            <p className="text-sm text-vutruNhat mt-0.5">
              Sao chép dữ liệu từ Word, Excel, Google Docs hoặc tải file CSV
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-kem dark:hover:bg-night-elevated text-vutruNhat hover:text-vutru transition-colors text-xl"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-vutru mb-2">Dán dữ liệu vào đây</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'Từ 1\tĐịnh nghĩa 1\nTừ 2\tĐịnh nghĩa 2\nTừ 3\tĐịnh nghĩa 3'}
              className="w-full h-40 px-4 py-3 rounded-xl border border-gray-200 dark:border-night-border bg-kem/50 dark:bg-night-elevated focus:outline-none focus:ring-2 focus:ring-cam/30 focus:border-cam resize-none font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <fieldset>
              <legend className="text-sm font-semibold text-vutru mb-2">Giữa thuật ngữ và định nghĩa</legend>
              <div className="space-y-2">
                {[
                  { value: 'tab', label: 'Tab' },
                  { value: 'comma', label: 'Dấu phẩy (,)' },
                  { value: 'colon', label: 'Dấu hai chấm (:)' },
                  { value: 'custom', label: 'Tùy chỉnh' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-vutruNhat cursor-pointer">
                    <input
                      type="radio"
                      name="termSep"
                      checked={termSeparator === opt.value}
                      onChange={() => setTermSeparator(opt.value as TermSeparator)}
                      className="accent-cam"
                    />
                    {opt.label}
                  </label>
                ))}
                {termSeparator === 'custom' && (
                  <input
                    value={customTermSeparator}
                    onChange={(e) => setCustomTermSeparator(e.target.value)}
                    placeholder="Ký tự phân cách"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-night-border text-sm"
                  />
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-vutru mb-2">Giữa các thẻ</legend>
              <div className="space-y-2">
                {[
                  { value: 'newline', label: 'Xuống dòng' },
                  { value: 'semicolon', label: 'Dấu chấm phẩy (;)' },
                  { value: 'custom', label: 'Tùy chỉnh' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm text-vutruNhat cursor-pointer">
                    <input
                      type="radio"
                      name="cardSep"
                      checked={cardSeparator === opt.value}
                      onChange={() => setCardSeparator(opt.value as CardSeparator)}
                      className="accent-cam"
                    />
                    {opt.label}
                  </label>
                ))}
                {cardSeparator === 'custom' && (
                  <input
                    value={customCardSeparator}
                    onChange={(e) => setCustomCardSeparator(e.target.value)}
                    placeholder="Ký tự phân cách"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-night-border text-sm"
                  />
                )}
              </div>
            </fieldset>
          </div>

          <div>
            <label className="block text-sm font-semibold text-vutru mb-2">
              Hoặc tải file CSV
            </label>
            <label className="btn btn-phu text-sm cursor-pointer">
              Chọn file CSV
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />
            </label>
            <p className="text-xs text-vutruNhat mt-2">Định dạng: thuật ngữ,định nghĩa — mỗi dòng một thẻ</p>
          </div>

          <div className="rounded-xl border border-cam/15 dark:border-cam/20 bg-camNhat/40 dark:bg-cam/10 p-4">
            <h3 className="text-sm font-bold text-vutru mb-3">
              Xem trước — {preview.length} thẻ
            </h3>
            {preview.length === 0 ? (
              <p className="text-sm text-vutruNhat">Chưa có dữ liệu để xem trước.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-2">
                {preview.slice(0, 8).map((card) => (
                  <div key={card.id} className="flex gap-3 text-sm bg-white dark:bg-night-elevated rounded-lg px-3 py-2 border border-transparent dark:border-night-border">
                    <span className="font-semibold text-camDam flex-1 truncate">{card.frontContent}</span>
                    <span className="text-vutruNhat">→</span>
                    <span className="text-vutru flex-1 truncate">{card.backContent}</span>
                  </div>
                ))}
                {preview.length > 8 && (
                  <p className="text-xs text-vutruNhat text-center">...và {preview.length - 8} thẻ khác</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-night-border bg-kem/30 dark:bg-night-elevated">
          <button onClick={onClose} className="btn btn-vien text-sm">
            Hủy
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0}
            className="btn btn-chinh text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Nhập {preview.length > 0 ? `${preview.length} thẻ` : ''}
          </button>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
};

export default ImportModal;
