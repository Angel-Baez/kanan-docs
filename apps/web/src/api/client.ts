const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // Documents
  documents: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<unknown[]>(`/documents${qs}`);
    },
    get: (id: string) => request<unknown>(`/documents/${id}`),
    create: (body: unknown) =>
      request<unknown>('/documents', { method: 'POST', body: JSON.stringify(body) }),
    replace: (id: string, body: unknown) =>
      request<unknown>(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    patchFields: (id: string, fields: unknown) =>
      request<unknown>(`/documents/${id}/fields`, {
        method: 'PATCH',
        body: JSON.stringify(fields),
      }),
    patchMeta: (id: string, meta: unknown) =>
      request<unknown>(`/documents/${id}/meta`, {
        method: 'PATCH',
        body: JSON.stringify(meta),
      }),
    delete: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
    pdfUrl: (id: string) => `${BASE}/documents/${id}/pdf`,
  },

  // Clients
  clients: {
    list: () => request<unknown[]>('/clients'),
    get: (id: string) => request<unknown>(`/clients/${id}`),
    create: (body: unknown) =>
      request<unknown>('/clients', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) =>
      request<unknown>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    projects: (id: string) => request<unknown[]>(`/clients/${id}/projects`),
  },

  // Projects
  projects: {
    list: () => request<unknown[]>('/projects'),
    get: (id: string) => request<unknown>(`/projects/${id}`),
    create: (body: unknown) =>
      request<unknown>('/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) =>
      request<unknown>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    documents: (id: string) => request<unknown[]>(`/projects/${id}/documents`),
  },
};
