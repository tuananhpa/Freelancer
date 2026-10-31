-- Cho phep gui hinh anh trong chat ho tro.
-- Anh duoc luu tren Cloudinary, o day chi giu URL.
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000);

-- Tin nhan chi co anh thi content rong, nen bo rang buoc NOT NULL cua content.
ALTER TABLE support_messages ALTER COLUMN content DROP NOT NULL;
