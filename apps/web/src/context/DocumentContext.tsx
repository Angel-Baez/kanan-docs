import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { DocumentFields, KananDocument } from '@kanan/shared';
import { api } from '../api/client.ts';
import { useToast } from './ToastContext.tsx';

// Utility: deep-set by dot-notation path
function setPath(obj: unknown, path: string, value: unknown): unknown {
  const parts = path.split('.');
  const clone = Array.isArray(obj) ? [...(obj as unknown[])] : { ...(obj as object) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    cursor[key] = Array.isArray(cursor[key])
      ? [...cursor[key]]
      : { ...cursor[key] };
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]!] = value;
  return clone;
}

export type SaveStatus = 'idle' | 'saving' | 'saved';

export type DocumentAction =
  | { type: 'LOAD'; fields: DocumentFields }
  | { type: 'SET_FIELD'; path: string; value: unknown }
  | { type: 'ADD_ITEM'; path: string; item: unknown }
  | { type: 'REMOVE_ITEM'; path: string; index: number };

function reducer(state: DocumentFields, action: DocumentAction): DocumentFields {
  switch (action.type) {
    case 'LOAD':
      return action.fields;
    case 'SET_FIELD':
      return setPath(state, action.path, action.value) as DocumentFields;
    case 'ADD_ITEM': {
      const arr = (state as unknown as Record<string, unknown>)[action.path];
      return {
        ...state,
        [action.path]: [...(Array.isArray(arr) ? arr : []), action.item],
      } as DocumentFields;
    }
    case 'REMOVE_ITEM': {
      const arr = (state as unknown as Record<string, unknown>)[action.path];
      if (!Array.isArray(arr)) return state;
      return {
        ...state,
        [action.path]: arr.filter((_, i) => i !== action.index),
      } as DocumentFields;
    }
  }
}

const EMPTY = {} as DocumentFields;

interface DocCtx {
  doc: KananDocument | null;
  fields: DocumentFields;
  saveStatus: SaveStatus;
  dispatch: Dispatch<DocumentAction>;
  setDoc: (d: KananDocument) => void;
}

const DocumentContext = createContext<DocCtx>({
  doc: null,
  fields: EMPTY,
  saveStatus: 'idle',
  dispatch: () => {},
  setDoc: () => {},
});

export function DocumentProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial: KananDocument;
}) {
  const { addToast } = useToast();
  const [doc, setDoc] = useState<KananDocument>(initial);
  const [fields, dispatch] = useReducer(reducer, initial.fields);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const docId = doc._id;

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSaveStatus('saving');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await api.documents.patchFields(docId, fields);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        setSaveStatus('idle');
        addToast(
          err instanceof Error ? err.message : 'Error al guardar el documento',
          'error'
        );
      }
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, docId]);

  return (
    <DocumentContext.Provider value={{ doc, fields, saveStatus, dispatch, setDoc }}>
      {children}
    </DocumentContext.Provider>
  );
}

export const useDocument = () => useContext(DocumentContext);
