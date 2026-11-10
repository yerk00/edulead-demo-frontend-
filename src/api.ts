import type { Advisor, ChatResult, Lead, Program, Summary } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "No se pudo completar la solicitud");
  }
  return response.json() as Promise<T>;
}

export const api = {
  summary: () => request<Summary>("/api/dashboard/summary"),
  leads: () => request<Lead[]>("/api/leads"),
  lead: (id: number) => request<Lead>(`/api/leads/${id}`),
  programs: () => request<Program[]>("/api/programs"),
  advisors: () => request<Advisor[]>("/api/advisors"),
  updateLead: (id: number, data: Partial<Lead>) =>
    request<Lead>(`/api/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  simulate: (data: { phone: string; name: string; message: string }) =>
    request<ChatResult>("/api/chat/simulate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
