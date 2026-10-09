import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
const noop = () => {};
const UploadContext = createContext({ busy: false, start: noop, finish: noop });
export function MediaUploadProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const start = useCallback(() => setCount((n) => n + 1), []);
  const finish = useCallback(() => setCount((n) => Math.max(0, n - 1)), []);
  const value = useMemo(
    () => ({ busy: count > 0, start, finish }),
    [count, start, finish],
  );
  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}
export const useMediaUploadState = () => useContext(UploadContext);
