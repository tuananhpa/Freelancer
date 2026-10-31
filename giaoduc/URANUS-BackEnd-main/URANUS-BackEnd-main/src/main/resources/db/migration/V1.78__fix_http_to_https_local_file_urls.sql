-- File local storage truoc day duoc luu voi scheme http:// (do
-- ServletUriComponentsBuilder doc nham request noi bo sau reverse proxy),
-- trong khi trang chay https:// - trinh duyet chan tai "mixed content" nen
-- audio/anh/file tai len truoc day khong phat/hien duoc. Doi lai thanh https.
UPDATE content_resources
SET file_url = REPLACE(file_url, 'http://uranuscenter.com', 'https://uranuscenter.com')
WHERE file_url LIKE 'http://uranuscenter.com%';

UPDATE exams
SET pdf_url = REPLACE(pdf_url, 'http://uranuscenter.com', 'https://uranuscenter.com')
WHERE pdf_url LIKE 'http://uranuscenter.com%';

UPDATE exams
SET audio_url = REPLACE(audio_url, 'http://uranuscenter.com', 'https://uranuscenter.com')
WHERE audio_url LIKE 'http://uranuscenter.com%';

UPDATE users
SET avatar_url = REPLACE(avatar_url, 'http://uranuscenter.com', 'https://uranuscenter.com')
WHERE avatar_url LIKE 'http://uranuscenter.com%';

UPDATE classrooms
SET thumbnail = REPLACE(thumbnail, 'http://uranuscenter.com', 'https://uranuscenter.com')
WHERE thumbnail LIKE 'http://uranuscenter.com%';
