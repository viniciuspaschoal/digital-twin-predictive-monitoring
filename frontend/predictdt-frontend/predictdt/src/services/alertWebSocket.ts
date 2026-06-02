import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import type { AlertaAnomalia } from '../types';
import { extractAlertasFromWsPayload } from '../utils/alertEvents';

const ALERTAS_WS_URL = 'http://localhost:8080/ws';
const ALERTAS_TOPIC = '/topic/alertas';

export type AlertasWebSocketStatus = 'connected' | 'reconnecting' | 'disconnected';

type AlertasSubscriber = {
  onAlertaRecebido: (alerta: AlertaAnomalia) => void;
  onStatusChange?: (status: AlertasWebSocketStatus) => void;
};

let client: Client | null = null;
let subscription: StompSubscription | null = null;
let status: AlertasWebSocketStatus = 'disconnected';
const subscribers = new Set<AlertasSubscriber>();

function notifyStatus(nextStatus: AlertasWebSocketStatus) {
  status = nextStatus;
  subscribers.forEach((subscriber) => subscriber.onStatusChange?.(nextStatus));
}

function notifyAlerta(alerta: AlertaAnomalia) {
  subscribers.forEach((subscriber) => subscriber.onAlertaRecebido(alerta));
}

function handleMessage(message: IMessage) {
  if (!message.body) return;

  try {
    const payload = JSON.parse(message.body);
    const alertas = extractAlertasFromWsPayload(payload);
    alertas.forEach(notifyAlerta);
  } catch (error) {
    console.error('Erro ao processar alerta recebido via STOMP:', error);
  }
}

function ensureClient() {
  if (client?.active) return;

  client = new Client({
    webSocketFactory: () => new SockJS(ALERTAS_WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: import.meta.env.DEV ? (message) => console.debug('[alertas-stomp]', message) : undefined,
    onConnect: () => {
      notifyStatus('connected');
      subscription?.unsubscribe();
      subscription = client?.subscribe(ALERTAS_TOPIC, handleMessage) ?? null;
    },
    onDisconnect: () => {
      subscription = null;
      notifyStatus(subscribers.size > 0 ? 'reconnecting' : 'disconnected');
    },
    onStompError: () => notifyStatus('reconnecting'),
    onWebSocketClose: () => {
      subscription = null;
      notifyStatus(subscribers.size > 0 ? 'reconnecting' : 'disconnected');
    },
    onWebSocketError: () => notifyStatus('reconnecting'),
  });

  notifyStatus('reconnecting');
  client.activate();
}

export function connectAlertasWebSocket(
  onAlertaRecebido: (alerta: AlertaAnomalia) => void,
  onStatusChange?: (status: AlertasWebSocketStatus) => void
) {
  const subscriber: AlertasSubscriber = { onAlertaRecebido, onStatusChange };
  subscribers.add(subscriber);
  onStatusChange?.(status);
  ensureClient();

  return () => {
    subscribers.delete(subscriber);

    if (subscribers.size === 0 && client) {
      const clientToDeactivate = client;
      client = null;
      subscription = null;
      notifyStatus('disconnected');
      void clientToDeactivate.deactivate();
    }
  };
}

