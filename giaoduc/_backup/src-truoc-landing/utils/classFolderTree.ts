import { ClassFolder } from '../services/class.service';

/**
 * Chu de trong lop la mot cay nhieu cap (CHUONG I / BAI 01 / LUYEN TAP).
 * API tra ve danh sach phang kem parentId; cac ham duoi day dung lai cay tu do.
 * De o file rieng vi ca trang bai tap lan cac modal chon chu de deu can.
 */

export interface FolderNode extends ClassFolder {
  /** Goc la 0. */
  depth: number;
  children: FolderNode[];
}

/** Long toi da bay nhieu cap - phai khop voi MAX_FOLDER_DEPTH ben backend. */
export const MAX_FOLDER_DEPTH = 4;

const byCreatedAt = (a: ClassFolder, b: ClassFolder) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

/**
 * Chu de co parentId tro toi mot chu de khong con ton tai (vi du vua bi xoa o
 * tab khac) van phai hien ra, neu khong giao vien se tuong bai tap bi mat.
 * Nhung truong hop do duoc keo len lam chu de goc.
 */
export const buildFolderTree = (folders: ClassFolder[]): FolderNode[] => {
  const ids = new Set(folders.map((f) => f.id));
  const childrenOf = new Map<string, ClassFolder[]>();
  const roots: ClassFolder[] = [];

  folders.forEach((f) => {
    const parentId = f.parentId && ids.has(f.parentId) && f.parentId !== f.id ? f.parentId : null;
    if (parentId) {
      const list = childrenOf.get(parentId) ?? [];
      list.push(f);
      childrenOf.set(parentId, list);
    } else {
      roots.push(f);
    }
  });

  const attach = (folder: ClassFolder, depth: number, seen: Set<string>): FolderNode => {
    // seen chan du lieu hong tao vong lap vo han khi duyet.
    seen.add(folder.id);
    const children = (childrenOf.get(folder.id) ?? [])
      .filter((c) => !seen.has(c.id))
      .sort(byCreatedAt)
      .map((c) => attach(c, depth + 1, seen));
    return { ...folder, depth, children };
  };

  return roots.sort(byCreatedAt).map((f) => attach(f, 0, new Set()));
};

/** Duyet cay theo thu tu hien thi, tra ve danh sach phang kem do sau. */
export const flattenTree = (nodes: FolderNode[]): FolderNode[] =>
  nodes.flatMap((n) => [n, ...flattenTree(n.children)]);

/** Ten co thut le theo cap, dung cho cac o <select> chon chu de. */
export const indentedLabel = (node: FolderNode) =>
  `${'    '.repeat(node.depth)}${node.depth > 0 ? '└ ' : ''}${node.name}`;

/** Duong dan day du, vi du "CHUONG I / BAI 01 / LUYEN TAP". */
export const folderPath = (folders: ClassFolder[], folderId: string): string => {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const parts: string[] = [];
  let current = byId.get(folderId);
  let guard = 0;
  while (current && guard++ <= MAX_FOLDER_DEPTH + 1) {
    parts.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return parts.join(' / ');
};

/**
 * Cac chu de KHONG duoc chon lam cha cua folderId: chinh no va toan bo nhanh con.
 * Chon nham se cat roi ca nhanh khoi cay.
 */
export const descendantIds = (nodes: FolderNode[], folderId: string): Set<string> => {
  const blocked = new Set<string>();
  const collect = (node: FolderNode) => {
    blocked.add(node.id);
    node.children.forEach(collect);
  };
  const find = (list: FolderNode[]): FolderNode | undefined => {
    for (const n of list) {
      if (n.id === folderId) return n;
      const hit = find(n.children);
      if (hit) return hit;
    }
    return undefined;
  };
  const target = find(nodes);
  if (target) collect(target);
  return blocked;
};
