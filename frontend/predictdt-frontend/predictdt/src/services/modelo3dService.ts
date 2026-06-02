import api from '../lib/api';

export type CameraViewPayload = {
  position: [number, number, number];
  target: [number, number, number];
};

export type Modelo3D = {
  id: string;
  fileName: string;
  url: string;
  cameraView: CameraViewPayload | null;
  equipmentMap: Record<string, string>;
  ativo: boolean;
  dtInclusao?: string;
  dtAlteracao?: string;
};

type EquipmentMapResponse = Record<string, string> | { equipmentMap?: Record<string, string> } | null | undefined;
type CameraViewResponse = CameraViewPayload | { cameraView?: CameraViewPayload };

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/u, '')}/${path.replace(/^\/+/u, '')}`;
}

export function getModelo3DFileUrl(url: string) {
  if (/^https?:\/\//iu.test(url)) return url;
  return joinUrl(String(api.defaults.baseURL ?? ''), url);
}

export function extractEquipmentMap(response: EquipmentMapResponse, fallback: Record<string, string>): Record<string, string> {
  if (!response || typeof response !== 'object') return fallback;
  if ('equipmentMap' in response && response.equipmentMap && typeof response.equipmentMap === 'object') {
    return response.equipmentMap;
  }
  return response as Record<string, string>;
}

export function extractCameraView(response: CameraViewResponse, fallback: CameraViewPayload) {
  if ('cameraView' in response && response.cameraView) return response.cameraView;
  if ('position' in response && 'target' in response) return response;
  return fallback;
}

export const modelo3dService = {
  getModelo3DAtivo: () =>
    api.get<Modelo3D>('/modelos-3d/ativo'),

  uploadModelo3D: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<Modelo3D>('/modelos-3d', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  saveCameraView: (modeloId: string, cameraView: CameraViewPayload) =>
    api.put<CameraViewResponse>(`/modelos-3d/${modeloId}/camera-view`, cameraView),

  getEquipmentMap: (modeloId: string) =>
    api.get<Record<string, string>>(`/modelos-3d/${modeloId}/equipment-map`),

  vincularEquipamento: (modeloId: string, objectName: string, equipamentoId: string) =>
    api.put<EquipmentMapResponse>(
      `/modelos-3d/${modeloId}/equipment-map/${encodeURIComponent(objectName)}`,
      { equipamentoId }
    ),

  removerVinculo: (modeloId: string, objectName: string) =>
    api.delete<EquipmentMapResponse>(
      `/modelos-3d/${modeloId}/equipment-map/${encodeURIComponent(objectName)}`
    ),
};
