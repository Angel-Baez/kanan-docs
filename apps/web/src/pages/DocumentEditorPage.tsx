import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { KananDocument, ThemeMode } from '@kanan/shared';
import { api } from '../api/client.ts';
import { DocumentProvider, useDocument } from '../context/DocumentContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { AppNav } from '../components/nav/AppNav.tsx';
import { ThemeSwitcher } from '../components/nav/ThemeSwitcher.tsx';
import { TemplateResolver } from '../templates/TemplateResolver.tsx';

function EditorInner({ doc }: { doc: KananDocument }) {
  const { saveStatus } = useDocument();
  const { setTheme } = useTheme();

  // Aplica el tema guardado solo al montar; no re-ejecutar en cada re-render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTheme(doc.theme); }, []);

  const handleExportPdf = () => {
    window.open(api.documents.pdfUrl(doc._id), '_blank');
  };

  const handleThemeChange = (t: ThemeMode) => {
    api.documents.patchMeta(doc._id, { theme: t }).catch(console.error);
  };

  return (
    <>
      <AppNav
        saveStatus={saveStatus}
        showPrint
        onExportPdf={handleExportPdf}
      />
      <ThemeSwitcher onAfterChange={handleThemeChange} />
      {/* .kanan-canvas isolates kanan.css from Tailwind preflight */}
      <div className="kanan-canvas">
        <main>
          <TemplateResolver templateId={doc.templateId} />
        </main>
      </div>
    </>
  );
}

export function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<KananDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.documents.get(id)
      .then((d) => setDoc(d as KananDocument))
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return (
    <div className="flex items-center justify-center min-h-screen text-terracota font-mono text-sm">
      Error: {error}
    </div>
  );
  if (!doc) return (
    <div className="flex items-center justify-center gap-2 min-h-screen text-piedra font-mono text-xs">
      <Loader2 className="w-4 h-4 animate-spin" />
      Cargando documento…
    </div>
  );

  return (
    <DocumentProvider initial={doc}>
      <EditorInner doc={doc} />
    </DocumentProvider>
  );
}
