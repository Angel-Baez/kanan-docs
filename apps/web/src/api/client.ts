const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',                                           // send cookies
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
  // Auth
  auth: {
    login:  (email: string, password: string) =>
      request<unknown>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    me:     () => request<unknown>('/auth/me'),
    refresh:() => request<unknown>('/auth/refresh', { method: 'POST' }),
  },

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
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<unknown>(`/clients${qs}`);
    },
    get: (id: string) => request<unknown>(`/clients/${id}`),
    create: (body: unknown) =>
      request<unknown>('/clients', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) =>
      request<unknown>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    projects: (id: string) => request<unknown[]>(`/clients/${id}/projects`),
  },

  // Dashboard
  dashboard: {
    summary: () => request<unknown>('/dashboard/summary'),
  },

  // Tasks
  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<unknown[]>(`/tasks${qs}`);
    },
  },

  // Finance
  finance: {
    summary:           () => request<unknown>('/finance/summary'),
    projectFinancials: (id: string) => request<unknown>(`/projects/${id}/financials`),
  },

  // Staff & Payroll
  staff: {
    list:      (params?: { all?: boolean }) => {
      const qs = params?.all ? '?all=true' : '';
      return request<unknown[]>(`/staff${qs}`);
    },
    create: (body: unknown) => request<unknown>('/staff', { method: 'POST', body: JSON.stringify(body) }),
    patch:  (id: string, body: unknown) =>
      request<unknown>(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  },
  payroll: {
    summary: (month: string) => request<unknown>(`/payroll/summary?month=${month}`),
  },

  search: {
    query: (q: string) => request<unknown>(`/search?q=${encodeURIComponent(q)}&limit=20`),
  },

  notifications: {
    list: () => request<unknown>('/notifications'),
  },

  calendar: {
    events: (start: string, end: string) =>
      request<unknown>(`/calendar?start=${start}&end=${end}`),
  },

  settings: {
    getCompany:    () => request<unknown>('/settings/company'),
    updateCompany: (body: unknown) =>
      request<unknown>('/settings/company', { method: 'PUT', body: JSON.stringify(body) }),
    listUsers:     () => request<unknown[]>('/settings/users'),
    createUser:    (body: unknown) =>
      request<unknown>('/settings/users', { method: 'POST', body: JSON.stringify(body) }),
    patchUser:     (id: string, body: unknown) =>
      request<unknown>(`/settings/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    resetPassword: (id: string, password: string) =>
      request<unknown>(`/settings/users/${id}/password`, { method: 'POST', body: JSON.stringify({ password }) }),
    updateMe:      (name: string) =>
      request<unknown>('/settings/me', { method: 'PATCH', body: JSON.stringify({ name }) }),
    changePassword: (current: string, next: string) =>
      request<unknown>('/settings/me/password', { method: 'POST', body: JSON.stringify({ current, next }) }),
  },

  // Projects
  projects: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<unknown[]>(`/projects${qs}`);
    },
    get: (id: string) => request<unknown>(`/projects/${id}`),
    create: (body: unknown) =>
      request<unknown>('/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: unknown) =>
      request<unknown>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    documents: (id: string) => request<unknown[]>(`/projects/${id}/documents`),
  },
};
