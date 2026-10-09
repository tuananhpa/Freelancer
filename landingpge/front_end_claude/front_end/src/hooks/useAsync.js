import { useCallback, useEffect, useRef, useState } from 'react';

/** Gọi 1 hàm async và quản lý trạng thái loading / error / data. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const alive = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return Promise.resolve()
      .then(fn)
      .then((data) => { if (alive.current) setState({ loading: false, error: null, data }); return data; })
      .catch((error) => { if (alive.current) setState({ loading: false, error, data: null }); });
  }, deps);

  useEffect(() => {
    alive.current = true;
    run();
    return () => { alive.current = false; };
  }, [run]);

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
