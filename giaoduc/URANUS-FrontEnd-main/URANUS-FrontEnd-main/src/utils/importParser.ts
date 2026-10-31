import { CardDraft, CardSeparator, TermSeparator } from '../types/flashcard';

function getTermDelimiter(separator: TermSeparator, custom?: string): string {
  switch (separator) {
    case 'tab':
      return '\t';
    case 'comma':
      return ',';
    case 'colon':
      return ':';
    case 'custom':
      return custom || '\t';
    default:
      return '\t';
  }
}

function getCardDelimiter(separator: CardSeparator, custom?: string): RegExp {
  switch (separator) {
    case 'newline':
      return /\r?\n/;
    case 'semicolon':
      return /;/;
    case 'custom':
      return new RegExp(custom ? escapeRegex(custom) : '\n');
    default:
      return /\r?\n/;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitTermDefinition(line: string, delimiter: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (delimiter === '\t') {
    const tabIndex = trimmed.indexOf('\t');
    if (tabIndex === -1) return null;
    return [trimmed.slice(0, tabIndex).trim(), trimmed.slice(tabIndex + 1).trim()];
  }

  const index = trimmed.indexOf(delimiter);
  if (index === -1) return null;
  const front = trimmed.slice(0, index).trim();
  const back = trimmed.slice(index + delimiter.length).trim();
  if (!front || !back) return null;
  return [front, back];
}

export function parseImportText(
  text: string,
  termSeparator: TermSeparator,
  cardSeparator: CardSeparator,
  customTermSeparator?: string,
  customCardSeparator?: string
): CardDraft[] {
  const termDelim = getTermDelimiter(termSeparator, customTermSeparator);
  const cardDelim = getCardDelimiter(cardSeparator, customCardSeparator);
  const lines = text.split(cardDelim).map((line) => line.trim()).filter(Boolean);

  const cards: CardDraft[] = [];
  lines.forEach((line, index) => {
    const pair = splitTermDefinition(line, termDelim);
    if (pair) {
      cards.push({
        id: `import-${Date.now()}-${index}`,
        frontContent: pair[0],
        backContent: pair[1],
      });
    }
  });

  return cards;
}

export function parseCsvFile(content: string): CardDraft[] {
  return parseImportText(content, 'comma', 'newline');
}
