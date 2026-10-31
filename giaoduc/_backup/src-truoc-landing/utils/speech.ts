/**
 * Lam sach van ban truoc khi doc bang Text-to-Speech.
 *
 * Nguoi soan flashcard/tu vung go tu do vao 1 o "Mat truoc" nen thuong go
 * theo dang "word /phien am/ (tu loai)" - vd "hello /hɛˈloʊ/ (interj.)".
 * Doc thang chuoi nay se doc luon ca dau gach xeo va tu loai viet tat, nghe
 * rat ky. Bo phan trong / / (phien am) va trong ( ) (tu loai, vd "(n.)",
 * "(v.)") truoc khi dua vao SpeechSynthesisUtterance.
 */
export function getSpeakableText(text: string): string {
  return text
    .replace(/\/[^/]*\//g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
