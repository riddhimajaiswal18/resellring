import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const run = useCallback(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then((data) => live && setState({ data, loading: false, error: null }))
        .catch((e) => live && setState({ data: null, loading: false, error: e.message }));
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => run(), [run]);
  return { ...state, reload: run };
}

let metaPromise;
export const useMeta = () => useFetch(() => (metaPromise ||= api.meta()), []);
