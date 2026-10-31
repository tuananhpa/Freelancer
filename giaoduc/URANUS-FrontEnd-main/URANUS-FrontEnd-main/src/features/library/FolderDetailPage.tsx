import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { flashcardApi } from '../../services/flashcardApi';
import { folderApi, ContentFolder } from '../../services/folderApi';
import { FlashcardDeck } from '../../types/flashcard';
import { ClipboardList, GalleryVerticalEnd, Folder } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

interface ExamItem {
  id: string;
  title: string;
  examCode?: string;
  questionCount: number;
  isPublished: boolean;
  folderId?: string;
}

const FolderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [folder, setFolder] = useState<ContentFolder | null>(null);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [folderRes, examRes, deckRes] = await Promise.all([
          folderApi.getMyFolders(),
          api.get('/exams/teacher'),
          flashcardApi.getMyDecks(),
        ]);
        const found = folderRes.data?.content?.find((f: any) => f.id === id);
        setFolder(found || null);
        setExams((examRes.data?.content || examRes.data || []).filter((e: ExamItem) => e.folderId === id));
        setDecks((deckRes.data?.content || deckRes.data || []).filter((d: any) => d.folderId === id));
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingOverlay text="Đang tải..." />;

  if (!folder) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-night-muted mb-4">Không tìm thấy folder</p>
        <Link to="/library" className="btn btn-chinh">Quay lại thư viện</Link>
      </div>
    );
  }

  const totalItems = exams.length + decks.length;

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <BackButton fallbackUrl="/library" />
      </div>

      <div className="flex items-start justify-between mt-2 mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cam/15 dark:bg-cam/20 flex items-center justify-center text-camDam dark:text-cam">
            <Folder size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-vutru dark:text-night-text">{folder.name}</h1>
            <p className="text-vutruNhat dark:text-night-muted text-sm mt-1">{totalItems} mục trong folder này</p>
            {folder.description && (
              <p className="text-sm text-vutruNhat dark:text-night-muted mt-2">{folder.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to={`/exams/create?folderId=${id}`} className="btn btn-phu text-sm py-2">
            + Đề thi
          </Link>
          <Link to={`/flashcards/create?folderId=${id}`} className="btn btn-chinh text-sm py-2">
            + Thêm thẻ ghi nhớ
          </Link>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-night-surface rounded-2xl border border-dashed border-gray-300 dark:border-night-border">
          <p className="text-gray-500 dark:text-night-muted mb-4">Folder trống — thêm đề thi hoặc thẻ ghi nhớ vào đây</p>
          <div className="flex gap-3 justify-center">
            <Link to={`/exams/create?folderId=${id}`} className="btn btn-phu text-sm">+ Tạo đề thi</Link>
            <Link to={`/flashcards/create?folderId=${id}`} className="btn btn-chinh text-sm">+ Tạo thẻ ghi nhớ</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {exams.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-vutru dark:text-night-text mb-4 flex items-center gap-2">
                <ClipboardList size={20} className="text-vutru dark:text-night-text" /> Đề thi ({exams.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="card flex justify-between items-center !py-4">
                    <div>
                      <h3 className="font-bold text-vutru dark:text-night-text">{exam.title}</h3>
                      <p className="text-xs text-vutruNhat dark:text-night-muted mt-1">
                        {exam.questionCount} câu · Mã: {exam.examCode}
                        {exam.isPublished ? ' · Đã phát hành' : ' · Bản nháp'}
                      </p>
                    </div>
                    <Link to="/exams" className="btn btn-vien text-xs py-1.5">Xem</Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {decks.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-vutru dark:text-night-text mb-4 flex items-center gap-2">
                <GalleryVerticalEnd size={20} className="text-vutru dark:text-night-text" /> Thẻ ghi nhớ ({decks.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {decks.map((deck) => (
                  <div key={deck.id} className="card flex justify-between items-center !py-4">
                    <div>
                      <h3 className="font-bold text-vutru dark:text-night-text">{deck.title}</h3>
                      <p className="text-xs text-vutruNhat dark:text-night-muted mt-1">
                        {deck.cards?.length ?? 0} thẻ · {deck.visibility === 'PUBLIC' ? 'Công khai' : deck.visibility === 'CLASSROOM' ? 'Lớp học' : 'Riêng tư'}
                      </p>
                    </div>
                    <Link to={`/flashcards/${deck.id}/study`} className="btn btn-chinh text-xs py-1.5">Học</Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderDetailPage;
