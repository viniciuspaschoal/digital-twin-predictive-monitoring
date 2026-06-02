import type { AlertaAnomalia } from '../types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAlertaAnomalia(value: unknown): value is AlertaAnomalia {
  if (!isObject(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.severidade === 'string' &&
    (
      typeof value.descricaoSensor === 'string' ||
      typeof value.sensorId === 'string'
    )
  );
}

export function extractAlertasFromWsPayload(payload: unknown): AlertaAnomalia[] {
  if (Array.isArray(payload)) {
    return payload.flatMap(extractAlertasFromWsPayload);
  }

  if (isAlertaAnomalia(payload)) {
    return [payload];
  }

  if (!isObject(payload)) {
    return [];
  }

  return [
    payload.alerta,
    payload.alert,
    payload.data,
    payload.payload,
    payload.anomalia,
  ].flatMap(extractAlertasFromWsPayload);
}

export function mergeAlertasAbertos(
  current: AlertaAnomalia[],
  incoming: AlertaAnomalia[]
) {
  const incomingAbertos = new Map<string, AlertaAnomalia>();
  const removedIds = new Set<string>();

  incoming.forEach((alerta) => {
    if (alerta.statusAlerta && alerta.statusAlerta !== 'ABERTO') {
      removedIds.add(alerta.id);
      incomingAbertos.delete(alerta.id);
      return;
    }

    incomingAbertos.set(alerta.id, alerta);
  });

  const currentFiltrados = current.filter(
    (alerta) => !removedIds.has(alerta.id) && !incomingAbertos.has(alerta.id)
  );

  return [...incomingAbertos.values(), ...currentFiltrados];
}
