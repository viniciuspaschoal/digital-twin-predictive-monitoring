import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Sun, Moon, User, Wifi, Activity } from 'lucide-react';
import { alertaService } from '../../services';
import { connectAlertasWebSocket, type AlertasWebSocketStatus } from '../../services/alertWebSocket';
import type { AlertaAnomalia } from '../../types';
import { mergeAlertasAbertos } from '../../utils/alertEvents';
import AlertModal from '../alertas/AlertModal';
import { useToast } from '../../contexts/ToastContext';

function fmtAlertDate(dt: string) {
  return new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function severityColor(severidade: AlertaAnomalia['severidade']) {
  if (severidade === 'CRITICA') return '#f87171';
  if (severidade === 'ALTA') return '#fb923c';
  if (severidade === 'MEDIA') return '#fbbf24';
  return '#60a5fa';
}

function toastTypeForSeverity(severidade: AlertaAnomalia['severidade']) {
  return severidade === 'CRITICA' || severidade === 'ALTA' ? 'error' : 'info';
}

function severityLabel(severidade: AlertaAnomalia['severidade']) {
  if (severidade === 'CRITICA') return 'critico';
  if (severidade === 'ALTA') return 'alto';
  if (severidade === 'MEDIA') return 'medio';
  return 'baixo';
}

type PythonGatewayStatus = 'connected' | 'connecting' | 'disconnected';

// ── CONNECTION STATUS DROPDOWN (CORRIGIDO PARA CAMADA SUPERIOR) ──────────────────
function ConnectionsDropdown({
  onAlertasReceived,
}: {
  onAlertasReceived?: (alertas: AlertaAnomalia[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // WebSocket status — tenta conexão com o Gateway Python
  const [wsState, setWsState] = useState<AlertasWebSocketStatus>('disconnected');
  const [pythonState, setPythonState] = useState<PythonGatewayStatus>('connecting');
  const [pythonLastMessage, setPythonLastMessage] = useState<string>('-');

  useEffect(() => {
    return connectAlertasWebSocket(
      (alerta) => onAlertasReceived?.([alerta]),
      setWsState
    );
  }, [onAlertasReceived]);

  useEffect(() => {
    let active = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let ws: WebSocket | null = null;

    const formatNow = () => new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const connectPythonGateway = () => {
      if (!active) return;

      setPythonState('connecting');

      try {
        ws = new WebSocket('ws://localhost:8765');

        ws.onopen = () => {
          setPythonState('connected');
          setPythonLastMessage(formatNow());
        };

        ws.onmessage = () => {
          setPythonLastMessage(formatNow());
        };

        ws.onerror = () => {
          setPythonState('disconnected');
        };

        ws.onclose = () => {
          if (!active) return;

          setPythonState('disconnected');
          reconnectTimer = setTimeout(connectPythonGateway, 5000);
        };
      } catch {
        setPythonState('disconnected');
        reconnectTimer = setTimeout(connectPythonGateway, 5000);
      }
    };

    connectPythonGateway();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  // Fecha o dropdown ao clicar fora por segurança de interface
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const wsColor   = wsState === 'connected' ? '#22c55e' : wsState === 'reconnecting' ? '#f59e0b' : '#ef4444';
  const wsLabel   = wsState === 'connected' ? 'Conectado' : wsState === 'reconnecting' ? 'Reconectando...' : 'Desconectado';
  const pythonColor = pythonState === 'connected' ? '#22c55e' : pythonState === 'connecting' ? '#f59e0b' : '#ef4444';
  const pythonLabel = pythonState === 'connected' ? 'Conectado' : pythonState === 'connecting' ? 'Conectando...' : 'Desconectado';

  return (
    // relative e z-50 para garantir que o ponto de ancoragem do botão lidere a fila de camadas
    <div ref={ref} className="relative z-50 inline-block">
      <button
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all hover:bg-[rgba(59,130,246,0.15)]"
        style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.25)',
          color: '#60a5fa',
          fontFamily: 'JetBrains Mono, monospace',
          cursor: 'pointer',
        }}
      >
        <Activity size={12} />
        CONEXÕES
      </button>

      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          // CORREÇÃO: "absolute right-0 top-full mt-1" + zIndex: 9999 inline para flutuar SOBERANO sobre os cards
          className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-100"
          style={{
            width: 280,
            background: '#161B22',
            border: '1px solid #30363D',
            boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            zIndex: 9999, // Força o browser a colocar o drop por cima de grids, e-charts ou tabelas
          }}
        >
          {/* Header do Dropdown */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#30363D' }}>
            <span className="text-xs font-bold tracking-widest" style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
              STATUS DAS CONEXÕES
            </span>
          </div>

          {/* Estado do WebSocket */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#1C2333' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 flex-shrink-0">
                  <Wifi size={14} style={{ color: wsColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Backend Java</p>
                  <p className="text-[11px] truncate" style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>http://localhost:8080/ws</p>
                  <p className="text-[11px] truncate" style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>/topic/alertas</p>
                  <p className="text-[11px]" style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>estado: {wsState}</p>
                </div>
              </div>
              <span className="text-xs font-semibold flex-shrink-0 mt-0.5" style={{ color: wsColor, fontFamily: 'JetBrains Mono, monospace' }}>
                {wsLabel}
              </span>
            </div>
          </div>

          {/* Estado do Gateway Python */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#1C2333' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 flex-shrink-0">
                  <Activity size={14} style={{ color: pythonColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Gateway Python</p>
                  <p className="text-[11px] truncate" style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>ws://localhost:8765</p>
                  <p className="text-[11px]" style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>estado: {pythonState}</p>
                  <p className="text-[11px]" style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>ultima msg: {pythonLastMessage}</p>
                </div>
              </div>
              <span className="text-xs font-semibold flex-shrink-0 mt-0.5" style={{ color: pythonColor, fontFamily: 'JetBrains Mono, monospace' }}>
                {pythonLabel}
              </span>
            </div>
          </div>

          {/* Rodapé de Mensagem */}
          <div className="px-4 py-2.5">
            <p className="text-[11px]" style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>
              Última mensagem: —
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN HEADER (CONSTRUTOR COM CONTEXTO DE EMPILHAMENTO ISOLADO) ──────────────────
export default function Header() {
  const [dark, setDark] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [alertas, setAlertas] = useState<AlertaAnomalia[]>([]);
  const [alertaAtivo, setAlertaAtivo] = useState<AlertaAnomalia | null>(null);
  const seenAlertIds = useRef<Set<string>>(new Set());
  const unseenAlertIds = useRef<Set<string>>(new Set());
  const notificationRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;

    alertaService.getAbertos()
      .then(({ data }) => {
        if (!active) return;

        data.forEach((alerta) => seenAlertIds.current.add(alerta.id));
        setAlertas(data);
        setNotificationCount(0);
      })
      .catch(() => {
        // notification count is best-effort only
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAlertaAsSeen = useCallback((alertaId: string) => {
    unseenAlertIds.current.delete(alertaId);
    setNotificationCount(unseenAlertIds.current.size);
  }, []);

  const openAlerta = useCallback((alerta: AlertaAnomalia) => {
    markAlertaAsSeen(alerta.id);
    setAlertaAtivo(alerta);
    setNotificationOpen(false);
  }, [markAlertaAsSeen]);

  const handleAlertasReceived = useCallback((incoming: AlertaAnomalia[]) => {
    const novos = incoming.filter((alerta) => {
      if (alerta.statusAlerta && alerta.statusAlerta !== 'ABERTO') {
        seenAlertIds.current.delete(alerta.id);
        unseenAlertIds.current.delete(alerta.id);
        return false;
      }

      if (seenAlertIds.current.has(alerta.id)) {
        return false;
      }

      seenAlertIds.current.add(alerta.id);
      unseenAlertIds.current.add(alerta.id);
      return true;
    });

    if (novos.length > 0) {
      setNotificationCount(Math.min(unseenAlertIds.current.size, 99));

      if (!window.location.pathname.startsWith('/alertas')) {
        novos.forEach((alerta) => {
          const color = severityColor(alerta.severidade);
          const medida = Number.isFinite(Number(alerta.medida))
            ? Number(alerta.medida).toFixed(2)
            : String(alerta.medida);

          toast(
            toastTypeForSeverity(alerta.severidade),
            `Novo alerta ${severityLabel(alerta.severidade)} detectado`,
            `${alerta.descricaoSensor} apresentou leitura ${medida} fora do intervalo esperado.`,
            {
              durationMs: 8000,
              actionLabel: 'Ver analise',
              accentColor: color,
              onAction: () => openAlerta(alerta),
              onClick: () => openAlerta(alerta),
            }
          );
        });
      }
    }

    setAlertas((prev) => mergeAlertasAbertos(prev, incoming));
  }, [openAlerta, toast]);

  const handleBellClick = () => {
    setNotificationOpen((open) => !open);
  };

  return (
    <>
    <header
      // CORREÇÃO PAI: "relative z-40" isola o cabeçalho em uma camada superior a todo o <main> ou grid do dashboard
      className="flex items-center justify-between px-5 border-b flex-shrink-0 relative z-40"
      style={{
        height: 48,
        background: 'rgba(13,17,23,0.98)',
        borderColor: '#1C2333',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Lado Esquerdo — Brand & Identidade Visual */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-md bg-white flex items-center justify-center flex-shrink-0"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
          aria-hidden="true"
        >
          <img
            src="/logo_client_improov.png"
            alt=""
            className="w-6 h-6 object-contain"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 leading-none" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Cliente
          </span>
          <span className="font-bold text-white text-sm leading-tight truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            IMPROV Equipamentos
          </span>
        </div>
      </div>

      {/* Lado Direito — Badges Técnicos e Ações */}
      <div className="flex items-center gap-2">

        {/* Dropdown de Conexões Injetado */}
        <ConnectionsDropdown onAlertasReceived={handleAlertasReceived} />

        {/* Alternador de Tema */}
        <button
          onClick={() => setDark((d) => !d)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1C2333')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Alternar tema"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Central de Notificacoes (Bell) */}
        <div ref={notificationRef} className="relative z-50">
          <button
            onClick={handleBellClick}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative"
            style={{ background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1C2333')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Notificacoes"
          >
            <Bell size={15} />
            {notificationCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: '#f87171',
                  color: '#0D1117',
                  border: '1px solid #0D1117',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div
              className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-100"
              style={{
                width: 360,
                maxHeight: 460,
                background: '#161B22',
                border: '1px solid #30363D',
                boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
                zIndex: 9999,
              }}
            >
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#30363D' }}>
                <span className="text-xs font-bold tracking-widest" style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                  ALERTAS ABERTOS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>
                  {alertas.length}
                </span>
              </div>

              <div className="max-h-[390px] overflow-y-auto">
                {alertas.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs" style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                    Nenhuma notificacao de alerta
                  </div>
                ) : (
                  alertas.map((alerta) => {
                    const color = severityColor(alerta.severidade);

                    return (
                      <button
                        key={alerta.id}
                        onClick={() => openAlerta(alerta)}
                        className="w-full text-left px-4 py-3 border-b transition-colors"
                        style={{
                          background: 'transparent',
                          borderColor: '#1C2333',
                          color: '#e5e7eb',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold tracking-widest" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>
                                {alerta.severidade}
                              </span>
                              <div className="flex items-center gap-2">
                                {unseenAlertIds.current.has(alerta.id) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: color, color: '#0D1117', fontFamily: 'JetBrains Mono, monospace' }}>
                                    NOVO
                                  </span>
                                )}
                                <span className="text-[10px]" style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}>
                                  {fmtAlertDate(alerta.dtOcorrencia)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-semibold truncate mt-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {alerta.descricaoSensor}
                            </p>
                            {alerta.descricaoEquipamento && (
                              <p className="text-xs truncate mt-0.5" style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                                {alerta.descricaoEquipamento}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Perfil do Operador */}
        <div
          className="flex items-center gap-2 pl-2 border-l"
          style={{ borderColor: '#1C2333' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,124,115,0.15)', border: '1px solid rgba(0,124,115,0.3)' }}
          >
            <User size={13} style={{ color: '#007C73' }} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Operador Industrial
            </span>
            <span className="text-[10px]" style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
              Sessão local
            </span>
          </div>
        </div>
      </div>
    </header>
    {alertaAtivo && (
      <AlertModal
        alerta={alertaAtivo}
        onClose={() => setAlertaAtivo(null)}
      />
    )}
    </>
  );
}
