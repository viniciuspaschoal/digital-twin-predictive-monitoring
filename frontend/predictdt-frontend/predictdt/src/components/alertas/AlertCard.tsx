import { AlertTriangle, Cpu, Gauge, Clock, TrendingUp, TrendingDown, Activity, CheckCircle, Eye, Ban } from 'lucide-react';
import type { AlertaAnomalia, SeveridadeAlerta, TipoAnomalia } from '../../types';

// ── Severity config ──────────────────────────────────────────
const SEVERITY: Record<SeveridadeAlerta, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  BAIXA:   { label: 'BAIXA',   color: '#60a5fa', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  glow: 'rgba(59,130,246,0.15)'  },
  MEDIA:   { label: 'MÉDIA',   color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.3)',   glow: 'rgba(251,191,36,0.15)'  },
  ALTA:    { label: 'ALTA',    color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.3)',   glow: 'rgba(251,146,60,0.15)'  },
  CRITICA: { label: 'CRÍTICA', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.35)', glow: 'rgba(248,113,113,0.2)'  },
};

const TIPO_LABEL: Record<TipoAnomalia, string> = {
  ACIMA_DO_PADRAO:  'Acima do padrão',
  ABAIXO_DO_PADRAO: 'Abaixo do padrão',
  FORA_DO_PADRAO:   'Fora do padrão',
};

const TIPO_ICON: Record<TipoAnomalia, React.ReactNode> = {
  ACIMA_DO_PADRAO:  <TrendingUp  size={13} />,
  ABAIXO_DO_PADRAO: <TrendingDown size={13} />,
  FORA_DO_PADRAO:   <Activity    size={13} />,
};

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto',
  RECONHECIDO: 'Reconhecido',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Resolvido',
  IGNORADO: 'Ignorado',
};

function fmt(n: number, decimals = 2) {
  return Number(n).toFixed(decimals);
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  alerta: AlertaAnomalia;
  isNew?: boolean;
  onClick?: () => void;
  onRecognize?: () => void;
  onResolve?: () => void;
  onIgnore?: () => void;
  actionLoading?: boolean;
}

export default function AlertCard({
  alerta,
  isNew = false,
  onClick,
  onRecognize,
  onResolve,
  onIgnore,
  actionLoading = false,
}: Props) {
  const sev = SEVERITY[alerta.severidade];
  const recognized = alerta.statusAlerta === 'RECONHECIDO';
  const statusLabel = STATUS_LABEL[alerta.statusAlerta] ?? alerta.statusAlerta;

  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className="w-full text-left rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: recognized ? 'rgba(59,130,246,0.07)' : sev.bg,
        border: `1px solid ${recognized ? 'rgba(59,130,246,0.55)' : sev.border}`,
        boxShadow: recognized
          ? '0 0 0 1px rgba(59,130,246,0.18), 0 0 22px rgba(59,130,246,0.16), 0 4px 14px rgba(0,0,0,0.28)'
          : isNew
            ? `0 0 20px ${sev.glow}, 0 4px 16px rgba(0,0,0,0.4)`
            : '0 4px 16px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        outline: 'none',
        opacity: 1,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          {/* Severity badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold flex-shrink-0"
            style={{
              background: 'rgba(0,0,0,0.3)',
              color: sev.color,
              fontFamily: 'JetBrains Mono, monospace',
              border: `1px solid ${sev.border}`,
            }}
          >
            <AlertTriangle size={10} />
            {sev.label}
          </div>

          {/* Tipo anomalia */}
          <div
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md min-w-0"
            style={{
              color: sev.color,
              background: 'rgba(0,0,0,0.2)',
              fontFamily: 'JetBrains Mono, monospace',
              opacity: 0.85,
            }}
          >
            {TIPO_ICON[alerta.tipoAnomalia]}
            {TIPO_LABEL[alerta.tipoAnomalia]}
          </div>

          <div
            className="text-[10px] px-2 py-0.5 rounded-md flex-shrink-0"
            style={{
              color: recognized ? '#93c5fd' : sev.color,
              background: recognized ? 'rgba(59,130,246,0.14)' : 'rgba(0,0,0,0.2)',
              fontFamily: 'JetBrains Mono, monospace',
              border: recognized ? '1px solid rgba(59,130,246,0.32)' : '1px solid transparent',
              maxWidth: '100%',
            }}
          >
            {statusLabel}
          </div>
        </div>

        {/* NEW badge */}
        {isNew && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 animate-pulse"
            style={{
              background: sev.color,
              color: '#0D1117',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            NOVO
          </span>
        )}
      </div>

      {/* Sensor + Equipment */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Gauge size={13} style={{ color: sev.color, flexShrink: 0 }} />
          <span
            className="text-sm font-semibold text-white truncate"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {alerta.descricaoSensor}
          </span>
        </div>
        {alerta.descricaoEquipamento && (
          <div className="flex items-center gap-2">
            <Cpu size={12} style={{ color: '#6b7280', flexShrink: 0 }} />
            <span
              className="text-xs text-gray-400 truncate"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {alerta.descricaoEquipamento}
            </span>
          </div>
        )}
      </div>

      {/* Reading vs limits */}
      <div
        className="grid grid-cols-3 gap-2 rounded-lg p-2.5"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[9px] tracking-wider"
            style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
          >
            MÍN
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {fmt(alerta.limiteMinReferencia)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[9px] tracking-wider"
            style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
          >
            LEITURA
          </span>
          <span
            className="text-sm font-bold"
            style={{ color: sev.color, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {fmt(alerta.medida)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[9px] tracking-wider"
            style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
          >
            MÁX
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: '#f97316', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {fmt(alerta.limiteMaxReferencia)}
          </span>
        </div>
      </div>

      {/* Score + datetime */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
        >
          <span>Score:</span>
          <span style={{ color: sev.color, fontWeight: 700 }}>{fmt(alerta.scoreDesvio)}σ</span>
        </div>
        <div
          className="flex items-center gap-1 text-[10px]"
          style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}
        >
          <Clock size={10} />
          {fmtDate(alerta.dtOcorrencia)}
        </div>
      </div>

      {/* CTA */}
      {onClick && (
        <div
          className="text-center text-[10px] pt-1 border-t"
          style={{
            color: sev.color,
            borderColor: sev.border,
            fontFamily: 'JetBrains Mono, monospace',
            opacity: 0.7,
          }}
        >
          Clique para ver análise da IA →
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRecognize?.();
          }}
          disabled={actionLoading || recognized}
          className="rounded-lg px-2 py-1.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
          style={{
            background: recognized ? 'rgba(156,163,175,0.08)' : 'rgba(59,130,246,0.08)',
            color: recognized ? '#6b7280' : '#93c5fd',
            border: recognized ? '1px solid rgba(156,163,175,0.12)' : '1px solid rgba(59,130,246,0.22)',
            cursor: actionLoading || recognized ? 'not-allowed' : 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <Eye size={11} />
          Reconhecer
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onResolve?.();
          }}
          disabled={actionLoading}
          className="rounded-lg px-2 py-1.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
          style={{
            background: 'rgba(34,197,94,0.1)',
            color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.24)',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <CheckCircle size={11} />
          Resolver
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onIgnore?.();
          }}
          disabled={actionLoading}
          className="rounded-lg px-2 py-1.5 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
          style={{
            background: 'rgba(107,114,128,0.08)',
            color: '#9ca3af',
            border: '1px solid rgba(107,114,128,0.2)',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <Ban size={11} />
          Ignorar
        </button>
      </div>
    </div>
  );
}
