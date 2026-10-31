-- V1.74: Create Content Resources, Bookmarks, and Likes for URANUS Library

CREATE TABLE IF NOT EXISTS content_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL, -- DOCUMENT, VIDEO, EXAM, SLIDE, AUDIO
    grade VARCHAR(50) NOT NULL,         -- KHOI_1 ... KHOI_12, KHAC
    subject VARCHAR(50) NOT NULL,       -- TOAN, VAN, TIENG_ANH, VAT_LY, HOA_HOC, SINH_HOC, TIN_HOC, KHTN, GDCD, KHAC
    curriculum_book VARCHAR(100),       -- KET_NOI_TRI_THUC, CANH_DIEU, CHAN_TROI_SANG_TAO, KHAC
    
    author_name VARCHAR(255),           -- Tên Giáo viên / Người soạn
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES content_folders(id) ON DELETE SET NULL,
    
    file_url TEXT,                      -- File PDF / Word / PPTX / MP3 URL
    external_url TEXT,                  -- YouTube URL hoặc Slide link
    file_name VARCHAR(255),
    file_size BIGINT,
    file_format VARCHAR(50),            -- pdf, docx, pptx, mp3, mp4, youtube
    
    -- Tích hợp Đề thi cho Bài nghe
    attached_exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
    audio_transcript TEXT,              -- Lời thoại bài nghe
    
    learning_outcomes TEXT,             -- Yêu cầu cần đạt
    tags VARCHAR(500),                  -- Thẻ từ khóa
    
    is_public BOOLEAN DEFAULT true,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    bookmark_count BIGINT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_resources_type_grade ON content_resources(resource_type, grade, subject);
CREATE INDEX IF NOT EXISTS idx_content_resources_public ON content_resources(is_public);
CREATE INDEX IF NOT EXISTS idx_content_resources_uploader ON content_resources(uploader_id);

CREATE TABLE IF NOT EXISTS resource_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES content_resources(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES content_folders(id) ON DELETE SET NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_resource_bookmark UNIQUE (user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS resource_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES content_resources(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_resource_like UNIQUE (user_id, resource_id)
);

-- Seed sample high-quality resources
INSERT INTO content_resources (
    id, title, description, resource_type, grade, subject, curriculum_book, author_name, uploader_id,
    external_url, learning_outcomes, tags, is_public, view_count, like_count, bookmark_count
) VALUES 
(
    '477e71ab-e8c3-4980-8ec4-20449b22d101',
    'Lớp 12 TSA ONLINE | BÀI 1: NỘI QUY VÀ VECTOR TRONG KHÔNG GIAN',
    'Bài giảng video chi tiết phương pháp giải toán hình học không gian và các dạng bài vector trong đề thi ĐGNL TSA/HSA.',
    'VIDEO',
    'KHOI_12',
    'TOAN',
    'KET_NOI_TRI_THUC',
    'Thầy Dương Xuân Tuyên',
    (SELECT id FROM users WHERE role IN ('ADMIN', 'TEACHER') LIMIT 1),
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    '- Nắm vững định nghĩa vector trong không gian\n- Thành thạo các phép toán cộng trừ vector và tích vô hướng\n- Ứng dụng giải bài toán hình học thực tế',
    '#toan12 #tsa #vector #dgnl',
    true,
    1420,
    88,
    45
),
(
    '477e71ab-e8c3-4980-8ec4-20449b22d102',
    'Đề cương ôn tập kiểm tra giữa kỳ 1 Tiếng Anh 10 Global Success',
    'Tổng hợp ngữ pháp trọng tâm Unit 1-3 và hệ thống bài tập trắc nghiệm có đáp án giải chi tiết.',
    'DOCUMENT',
    'KHOI_10',
    'TIENG_ANH',
    'KET_NOI_TRI_THUC',
    'Cô Nguyễn Thị Bích Hiền',
    (SELECT id FROM users WHERE role IN ('ADMIN', 'TEACHER') LIMIT 1),
    'https://res.cloudinary.com/demo/image/upload/sample.pdf',
    '- Hệ thống hóa kiến thức thì hiện tại đơn, hiện tại tiếp diễn, tương lai đơn\n- Mở rộng vốn từ vựng chủ đề Family Life và Humans & The Environment',
    '#tienganh10 #globalsuccess #decuong #giuaky1',
    true,
    850,
    52,
    30
),
(
    '477e71ab-e8c3-4980-8ec4-20449b22d103',
    'Bài luyện nghe IELTS Listening Part 1 - Apartment Rental Inquiry (Audio + Trắc nghiệm)',
    'File audio luyện nghe chuẩn giọng Anh - Anh kèm bộ câu hỏi trắc nghiệm kiểm tra kỹ năng bắt keyword và điền số liệu.',
    'AUDIO',
    'KHOI_12',
    'TIENG_ANH',
    'KHAC',
    'Thầy Mạnh Dương',
    (SELECT id FROM users WHERE role IN ('ADMIN', 'TEACHER') LIMIT 1),
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    '- Luyện kỹ năng nghe bắt số điện thoại, địa chỉ và ngày tháng\n- Tránh các bẫy distractors trong hội thoại',
    '#ielts #listening #tienganh12 #part1',
    true,
    620,
    41,
    26
);
