import { useState, useEffect, useCallback } from 'react';
import { 
  fetchList, 
  fetchDoc, 
  saveDoc, 
  fetchMeta, 
  frappeCall
} from '../services/frappe';
import { 
  ListResource, 
  DocumentResource, 
  DocTypeMeta, 
  FrappeUser 
} from '../types';

// --- Resource Manager: List ---
export function useListResource<T = any>(
  doctype: string, 
  fields: string[] = ["name", "modified"],
  initialFilters: Record<string, any> = {}
): ListResource<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState(initialFilters);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const PAGE_LENGTH = 20;

  const fetchData = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const start = reset ? 0 : page * PAGE_LENGTH;
      const results = await fetchList(doctype, fields, filters, start, PAGE_LENGTH);
      
      if (reset) {
        setData(results);
        setPage(1);
      } else {
        setData(prev => [...(prev || []), ...results]);
        setPage(prev => prev + 1);
      }
      
      if (results.length < PAGE_LENGTH) {
        setHasNextPage(false);
      } else {
        setHasNextPage(true);
      }
    } catch (err: any) {
      if (err.message === "Unauthorized" || err.message === "Permission Denied") {
         // Optional: Trigger global logout logic here if needed
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doctype, fields, filters, page]);

  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, doctype]);

  const setFilters = (newFilters: Record<string, any>) => {
    setFiltersState(newFilters);
  };

  const next = async () => {
    if (!loading && hasNextPage) {
      await fetchData(false);
    }
  };

  const reload = async () => {
    await fetchData(true);
  };

  return {
    data,
    loading,
    error,
    reload,
    next,
    hasNextPage,
    filters,
    setFilters
  };
}

// --- Resource Manager: Document ---
export function useDocumentResource<T = any>(
  doctype: string, 
  name?: string,
  meta?: DocTypeMeta
): DocumentResource<T> {
  const [doc, setDoc] = useState<T | null>(null);
  const [originalDoc, setOriginalDoc] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!name) {
      setDoc({} as T);
      setOriginalDoc({} as T);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const fetched = await fetchDoc(doctype, name);
        setDoc(fetched);
        setOriginalDoc(JSON.stringify(fetched) as any);
        setIsDirty(false);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctype, name]);

  const handleFetchFrom = async (updatedField: string, value: any, currentDoc: any) => {
    if (!meta) return currentDoc;
    const dependentFields = meta.fields.filter(f => 
      f.fetch_from && f.fetch_from.startsWith(`${updatedField}.`)
    );
    if (dependentFields.length === 0 || !value) return currentDoc;

    try {
        const sourceFields = dependentFields.map(f => f.fetch_from!.split('.')[1]);
        const targetDoctype = meta.fields.find(f => f.fieldname === updatedField)?.options;

        if (targetDoctype) {
            // Use GET for get_value to avoid CSRF token errors on read
            const res = await frappeCall('frappe.client.get_value', {
                doctype: targetDoctype,
                filters: value, 
                fieldname: sourceFields
            }, 'GET');
    
            if (res) {
                const newDoc = { ...currentDoc };
                dependentFields.forEach(field => {
                    const sourceCol = field.fetch_from!.split('.')[1];
                    if (res[sourceCol] !== undefined) {
                        newDoc[field.fieldname] = res[sourceCol];
                    }
                });
                return newDoc;
            }
        }
    } catch (e) {
        console.warn("Auto-fetch failed", e);
    }
    return currentDoc;
  };

  const setValue = async (field: string, value: any) => {
    if (!doc) return;
    let newDoc = { ...doc, [field]: value };
    newDoc = await handleFetchFrom(field, value, newDoc);
    setDoc(newDoc);
    setIsDirty(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      const saved = await saveDoc(doctype, doc);
      setDoc(saved);
      setOriginalDoc(saved);
      setIsDirty(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
      if (!doc) return;
      setLoading(true);
      try {
          const res = await frappeCall('frappe.client.submit', { doc });
          setDoc(res);
          setIsDirty(false);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  const del = async () => {
  };

  return {
    doc,
    loading,
    error,
    save,
    submit,
    delete: del,
    setValue,
    isDirty
  };
}

// --- Metadata Hook ---
export function useMeta(doctype: string) {
    const [meta, setMeta] = useState<DocTypeMeta | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const m = await fetchMeta(doctype);
            if (m) setMeta(m);
            setLoading(false);
        };
        load();
    }, [doctype]);

    return { meta, loading };
}

// --- User Hook ---
export function useFrappeUser() {
    const [user, setUser] = useState<FrappeUser | null>(null);
    const [loading, setLoading] = useState(true);

    const checkLogin = useCallback(async () => {
      setLoading(true);
      try {
        // We rely on the browser cookie for API calls, and localStorage for UI state.
        const storedUser = localStorage.getItem('frappe_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            setUser(null);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      checkLogin();
    }, [checkLogin]);

    const hasRole = (role: string) => user?.roles.includes(role) || false;

    return { user, loading, hasRole, refreshUser: checkLogin };
}
