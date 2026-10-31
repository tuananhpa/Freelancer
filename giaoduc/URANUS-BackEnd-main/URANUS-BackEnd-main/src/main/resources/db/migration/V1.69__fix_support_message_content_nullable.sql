-- V1.68 da co lenh nay nhung tren production cot content van con NOT NULL,
-- lam tin nhan chi co anh bi tu choi khi insert. Chay lai cho chac.
-- Lenh nay chay lai duoc nhieu lan ma khong gay loi.
ALTER TABLE support_messages ALTER COLUMN content DROP NOT NULL;

-- Du sao code cung ghi chuoi rong thay vi null, day chi la de schema hai moi
-- truong khop nhau.
