import api from '../lib/api';
import type {
  TopicoMqtt,
  Equipamento,
  Sensor,
  SensorEquipamento,
  LogMedida,
  PaginatedResponse,
  AlertaAnomalia,
  AlertaContexto,
  AlertaExplicacao,
} from '../types';

// Helper to fetch ALL pages (the API doesn't have a /all endpoint)
async function fetchAll<T>(path: string): Promise<T[]> {
  const result: T[] = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages) {
    const { data } = await api.get<PaginatedResponse<T>>(path, { params: { page, size: 100 } });
    result.push(...data.content);
    totalPages = data.totalPages;
    page++;
  }
  return result;
}

// ── Tópicos MQTT ──────────────────────────────────────────────
export const topicoService = {
  list: (page = 0, size = 10) =>
    api.get<PaginatedResponse<TopicoMqtt>>('/topico-mqtt', { params: { page, size } }),
  listAll: () => fetchAll<TopicoMqtt>('/topico-mqtt'),
  getById: (id: string) => api.get<TopicoMqtt>(`/topico-mqtt/${id}`),
  create: (data: { descricao: string; ativo: boolean }) =>
    api.post<TopicoMqtt>('/topico-mqtt', data),
  update: (id: string, data: { descricao: string; ativo: boolean }) =>
    api.put<TopicoMqtt>(`/topico-mqtt/${id}`, data),
  delete: (id: string) => api.delete(`/topico-mqtt/${id}`),
};

// ── Equipamentos ─────────────────────────────────────────────
export const equipamentoService = {
  list: (page = 0, size = 10) =>
    api.get<PaginatedResponse<Equipamento>>('/equipamento', { params: { page, size } }),
  listAll: () => fetchAll<Equipamento>('/equipamento'),
  getById: (id: string) => api.get<Equipamento>(`/equipamento/${id}`),
  create: (data: { descricao: string; ativo: boolean }) =>
    api.post<Equipamento>('/equipamento', data),
  update: (id: string, data: { descricao: string; ativo: boolean }) =>
    api.put<Equipamento>(`/equipamento/${id}`, data),
  delete: (id: string) => api.delete(`/equipamento/${id}`),
};

// ── Sensores ─────────────────────────────────────────────────
export const sensorService = {
  list: (page = 0, size = 10) =>
    api.get<PaginatedResponse<Sensor>>('/sensores', { params: { page, size } }),
  listAll: () => fetchAll<Sensor>('/sensores'),
  getById: (id: string) => api.get<Sensor>(`/sensores/${id}`),
  create: (data: {
    descricao: string;
    unidadeMedida: string;
    topicoId: string;
    topicoAuxiliar?: string;
  }) => api.post<Sensor>('/sensores', data),
  update: (
    id: string,
    data: {
      descricao: string;
      unidadeMedida: string;
      topicoId?: string;
      topicoAuxiliar?: string;
      ativo?: boolean;
    }
  ) => api.put<Sensor>(`/sensores/${id}`, data),
  delete: (id: string) => api.delete(`/sensores/${id}`),
};

// ── SensorEquipamento ────────────────────────────────────────
export const sensorEquipamentoService = {
  list: (page = 0, size = 10) =>
    api.get<PaginatedResponse<SensorEquipamento>>('/sensor-equipamento', {
      params: { page, size },
    }),
  listAll: () => fetchAll<SensorEquipamento>('/sensor-equipamento'),
  getById: (id: string) => api.get<SensorEquipamento>(`/sensor-equipamento/${id}`),
  create: (data: { idSensor: string; idEquipamento: string }) =>
    api.post<SensorEquipamento>('/sensor-equipamento', data),
  delete: (id: string) => api.delete(`/sensor-equipamento/${id}`),
};

// ── LogMedidas ───────────────────────────────────────────────
export const logMedidaService = {
  list: () => api.get<LogMedida[]>('/log-medida'),
  getById: (id: string) => api.get<LogMedida>(`/log-medida/${id}`),
  create: (data: { sensorId: string; medida: number }) =>
    api.post<LogMedida>('/log-medida', data),
};

// ── Alertas de Anomalia ───────────────────────────────────────
export const alertaService = {
  getAbertos: () =>
    api.get<AlertaAnomalia[]>('/alertas-anomalia/status/ABERTO'),
  getAbertosPaginado: (page = 0, size = 20) =>
    api.get<PaginatedResponse<AlertaAnomalia>>('/alertas-anomalia/status/ABERTO/paginado', {
      params: { page, size },
    }),
  getAll: () =>
    api.get<AlertaAnomalia[]>('/alertas-anomalia'),
  getAllPaginado: (page = 0, size = 20) =>
    api.get<PaginatedResponse<AlertaAnomalia>>('/alertas-anomalia/paginado', {
      params: { page, size },
    }),
  reconhecer: (alertaId: string) =>
    api.patch<AlertaAnomalia>(`/alertas-anomalia/${alertaId}/reconhecer`),
  resolver: (alertaId: string) =>
    api.patch<AlertaAnomalia>(`/alertas-anomalia/${alertaId}/resolver`),
  ignorar: (alertaId: string) =>
    api.patch<AlertaAnomalia>(`/alertas-anomalia/${alertaId}/ignorar`),
  resolverAbertos: () =>
    api.patch<string>('/alertas-anomalia/resolver-abertos'),
  getContexto: (alertaId: string) =>
    api.get<AlertaContexto>(`/alertas-anomalia/${alertaId}/contexto`),
  getExplicacao: (alertaId: string) =>
    api.get<AlertaExplicacao>(`/alertas-anomalia/${alertaId}/explicacao`),
};

// ── Grandezas e Tipos (dropdowns) ────────────────────────────
export const grandezaService = {
  list: () => api.get<{ id: string; descricao: string }[]>('/grandezas-medida'),
};

export const tipoEquipamentoService = {
  list: () => api.get<{ id: string; descricao: string }[]>('/tipos-equipamento'),
};
