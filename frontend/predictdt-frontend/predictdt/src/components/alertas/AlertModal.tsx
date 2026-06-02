import { useState, useEffect, type ReactNode } from 'react';
import {
  X,
  AlertTriangle,
  Brain,
  ShieldAlert,
  Wrench,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  Eye,
  Ban,
} from 'lucide-react';

import type {
  AlertaAnomalia,
  AlertaExplicacao,
  SeveridadeAlerta,
  TipoAnomalia,
} from '../../types';

import { alertaService } from '../../services';

const SEVERITY: Record<
  SeveridadeAlerta,
  { label: string; color: string; border: string; bg: string }
> = {
  BAIXA: {
    label: 'BAIXA',
    color: '#60a5fa',
    border: 'rgba(59,130,246,0.3)',
    bg: 'rgba(59,130,246,0.06)',
  },
  MEDIA: {
    label: 'MÉDIA',
    color: '#fbbf24',
    border: 'rgba(251,191,36,0.3)',
    bg: 'rgba(251,191,36,0.06)',
  },
  ALTA: {
    label: 'ALTA',
    color: '#fb923c',
    border: 'rgba(251,146,60,0.3)',
    bg: 'rgba(251,146,60,0.06)',
  },
  CRITICA: {
    label: 'CRÍTICA',
    color: '#f87171',
    border: 'rgba(248,113,113,0.35)',
    bg: 'rgba(248,113,113,0.06)',
  },
};

const TIPO_LABEL: Record<TipoAnomalia, string> = {
  ACIMA_DO_PADRAO: 'Acima do padrão',
  ABAIXO_DO_PADRAO: 'Abaixo do padrão',
  FORA_DO_PADRAO: 'Fora do padrão',
};

const TIPO_ICON: Record<TipoAnomalia, ReactNode> = {
  ACIMA_DO_PADRAO: <TrendingUp size={14} />,
  ABAIXO_DO_PADRAO: <TrendingDown size={14} />,
  FORA_DO_PADRAO: <Activity size={14} />,
};

function fmt(n: number, d = 2) {
  return Number(n).toFixed(d);
}

/*
 * Cache em memória para explicações de alerta.
 *
 * Evita chamar o backend/Gemini toda vez que o usuário abre
 * o mesmo alerta durante a mesma sessão da página.
 */
const explicacaoMemoryCache = new Map<string, AlertaExplicacao>();

/*
 * Prefixo usado no sessionStorage.
 *
 * O sessionStorage mantém a explicação salva mesmo se o usuário trocar de tela
 * ou recarregar a página durante a mesma sessão do navegador.
 */
const SESSION_CACHE_PREFIX = 'predictdt_explicacao_alerta_';

function getExplicacaoFromCache(alertaId: string): AlertaExplicacao | null {
  const memoryValue = explicacaoMemoryCache.get(alertaId);

  if (memoryValue) {
    return memoryValue;
  }

  const sessionValue = sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${alertaId}`);

  if (!sessionValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(sessionValue) as AlertaExplicacao;
    explicacaoMemoryCache.set(alertaId, parsed);
    return parsed;
  } catch {
    sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${alertaId}`);
    return null;
  }
}

function saveExplicacaoInCache(alertaId: string, explicacao: AlertaExplicacao) {
  explicacaoMemoryCache.set(alertaId, explicacao);

  try {
    sessionStorage.setItem(
      `${SESSION_CACHE_PREFIX}${alertaId}`,
      JSON.stringify(explicacao)
    );
  } catch {
    /*
     * Se o sessionStorage estiver cheio ou indisponível,
     * mantemos pelo menos o cache em memória.
     */
  }
}

// ── Stat box ─────────────────────────────────────────────────
function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-lg p-2.5"
      style={{ background: '#0d1117', border: '1px solid #1C2333' }}
    >
      <span
        className="text-[9px] tracking-widest uppercase"
        style={{ color: '#4b5563', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {label}
      </span>
      <span
        className="text-sm font-bold"
        style={{
          color: color ?? '#e5e7eb',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Section block ─────────────────────────────────────────────
function Section({
  icon,
  title,
  color,
  children,
}: {
  icon: ReactNode;
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: '#0d1117', border: '1px solid #1C2333' }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-bold tracking-wider uppercase"
          style={{ color, fontFamily: 'JetBrains Mono, monospace' }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────
interface Props {
  alerta: AlertaAnomalia;
  onClose: () => void;
  onRecognize?: () => void;
  onResolve?: () => void;
  onIgnore?: () => void;
  actionLoading?: boolean;
}

export default function AlertModal({
  alerta,
  onClose,
  onRecognize,
  onResolve,
  onIgnore,
  actionLoading = false,
}: Props) {
  const sev = SEVERITY[alerta.severidade];
  const recognized = alerta.statusAlerta === 'RECONHECIDO';

  const [explicacao, setExplicacao] = useState<AlertaExplicacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [causasOpen, setCausasOpen] = useState(true);

  /*
   * Carrega a explicação do alerta.
   *
   * Fluxo:
   * 1. Tenta buscar no cache em memória.
   * 2. Tenta buscar no sessionStorage.
   * 3. Se não existir cache, chama o backend.
   * 4. Salva a resposta em cache.
   *
   * Isso evita chamadas repetidas ao Gemini para o mesmo alerta.
   */
  useEffect(() => {
    let ativo = true;

    async function carregarExplicacao() {
      setLoadError(null);

      const explicacaoCacheada = getExplicacaoFromCache(alerta.id);

      if (explicacaoCacheada) {
        setExplicacao(explicacaoCacheada);
        setLoading(false);
        return;
      }

      setLoading(true);
      setExplicacao(null);

      try {
        const response = await alertaService.getExplicacao(alerta.id);

        if (!ativo) {
          return;
        }

        saveExplicacaoInCache(alerta.id, response.data);
        setExplicacao(response.data);
      } catch {
        if (!ativo) {
          return;
        }

        setLoadError('Não foi possível carregar a análise da IA.');
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarExplicacao();

    return () => {
      ativo = false;
    };
  }, [alerta.id]);

  // Fecha o modal ao pressionar ESC.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="h-full overflow-y-auto flex flex-col"
        style={{
          width: 520,
          background: '#0D1117',
          borderLeft: `1px solid ${sev.border}`,
          boxShadow: `-8px 0 40px rgba(0,0,0,0.6)`,
          animation: 'slideInRight 0.25s ease-out',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: '#1C2333', background: sev.bg }}
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  color: sev.color,
                  border: `1px solid ${sev.border}`,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <AlertTriangle size={10} />
                SEVERIDADE {sev.label}
              </div>

              <div
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md"
                style={{
                  color: sev.color,
                  background: 'rgba(0,0,0,0.25)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {TIPO_ICON[alerta.tipoAnomalia]}
                {TIPO_LABEL[alerta.tipoAnomalia]}
              </div>
            </div>

            <h2
              className="text-base font-bold text-white leading-tight truncate"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {alerta.descricaoSensor}
            </h2>

            {alerta.descricaoEquipamento && (
              <p
                className="text-xs truncate"
                style={{
                  color: '#6b7280',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {alerta.descricaoEquipamento}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{
              color: '#6b7280',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1C2333';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col gap-4 p-5 flex-1">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Leitura"
              value={fmt(alerta.medida)}
              color={sev.color}
            />
            <Stat
              label="Mín ref."
              value={fmt(alerta.limiteMinReferencia)}
              color="#60a5fa"
            />
            <Stat
              label="Máx ref."
              value={fmt(alerta.limiteMaxReferencia)}
              color="#f97316"
            />
            <Stat
              label="Média ref."
              value={fmt(alerta.mediaReferencia)}
            />
            <Stat
              label="Desvio σ"
              value={fmt(alerta.desvioPadraoReferencia)}
            />
            <Stat
              label="Score"
              value={`${fmt(alerta.scoreDesvio)}σ`}
              color={sev.color}
            />
          </div>

          {/* ── IA explanation ── */}
          {loading ? (
            <div
              className="rounded-xl p-8 flex flex-col items-center gap-3"
              style={{ background: '#0d1117', border: '1px solid #1C2333' }}
            >
              <Loader2
                size={22}
                className="animate-spin"
                style={{ color: '#007C73' }}
              />
              <p
                className="text-xs text-center"
                style={{
                  color: '#6b7280',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                Consultando análise da IA...
              </p>
            </div>
          ) : loadError ? (
            <div
              className="rounded-xl p-5 flex items-center gap-3"
              style={{
                background: '#0d1117',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertTriangle
                size={18}
                style={{ color: '#ef4444', flexShrink: 0 }}
              />
              <p className="text-sm text-gray-400">{loadError}</p>
            </div>
          ) : explicacao ? (
            <>
              {/* Title from backend */}
              <div
                className="rounded-lg px-4 py-2.5"
                style={{
                  background: `${sev.color}10`,
                  border: `1px solid ${sev.border}`,
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: sev.color,
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}
                >
                  {explicacao.titulo}
                </p>
              </div>

              {/* Gemini IA main text */}
              <Section
                icon={<Brain size={13} />}
                title="Análise da IA"
                color="#a78bfa"
              >
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: '#d1d5db',
                    fontFamily: 'DM Sans, sans-serif',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {explicacao.explicacaoIa}
                </p>

                {explicacao.observacao && (
                  <p
                    className="text-[10px] mt-1"
                    style={{
                      color: '#4b5563',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {explicacao.observacao}
                  </p>
                )}
              </Section>

              {/* Possíveis causas */}
              {explicacao.possiveisCausas?.length > 0 && (
                <Section
                  icon={<Lightbulb size={13} />}
                  title="Possíveis Causas"
                  color="#fbbf24"
                >
                  <button
                    onClick={() => setCausasOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-xs w-full"
                    style={{
                      color: '#6b7280',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {causasOpen ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                    {causasOpen
                      ? 'Recolher'
                      : `Ver ${explicacao.possiveisCausas.length} causa(s)`}
                  </button>

                  {causasOpen && (
                    <ul className="flex flex-col gap-1.5 mt-1">
                      {explicacao.possiveisCausas.map((causa, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                          style={{
                            color: '#d1d5db',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          <span
                            className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{
                              background: 'rgba(251,191,36,0.12)',
                              color: '#fbbf24',
                            }}
                          >
                            {index + 1}
                          </span>
                          {causa}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              )}

              {/* Risco operacional */}
              {explicacao.riscoOperacional && (
                <Section
                  icon={<ShieldAlert size={13} />}
                  title="Risco Operacional"
                  color="#f87171"
                >
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: '#d1d5db',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {explicacao.riscoOperacional}
                  </p>
                </Section>
              )}

              {/* Recomendação */}
              {explicacao.recomendacaoInicial && (
                <Section
                  icon={<Wrench size={13} />}
                  title="Recomendação Inicial"
                  color="#34d399"
                >
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: '#d1d5db',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {explicacao.recomendacaoInicial}
                  </p>
                </Section>
              )}
            </>
          ) : null}
        </div>

        {(onRecognize || onResolve || onIgnore) && (
          <div
            className="px-5 py-4 border-t flex flex-col sm:flex-row gap-2 flex-shrink-0"
            style={{ borderColor: '#1C2333', background: '#0D1117' }}
          >
            {onRecognize && (
              <button
                type="button"
                onClick={onRecognize}
                disabled={actionLoading || recognized}
                className="btn-ghost flex-1 justify-center"
                style={{
                  color: recognized ? '#6b7280' : '#93c5fd',
                  borderColor: recognized ? 'rgba(107,114,128,0.18)' : 'rgba(59,130,246,0.3)',
                  cursor: actionLoading || recognized ? 'not-allowed' : 'pointer',
                }}
              >
                <Eye size={14} />
                Reconhecer
              </button>
            )}
            {onResolve && (
              <button
                type="button"
                onClick={onResolve}
                disabled={actionLoading}
                className="btn-primary flex-1 justify-center"
                style={{ background: '#16a34a', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
              >
                <CheckCircle size={14} />
                Resolver
              </button>
            )}
            {onIgnore && (
              <button
                type="button"
                onClick={onIgnore}
                disabled={actionLoading}
                className="btn-ghost flex-1 justify-center"
                style={{
                  color: '#9ca3af',
                  borderColor: 'rgba(107,114,128,0.24)',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <Ban size={14} />
                Ignorar
              </button>
            )}
          </div>
        )}
        </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
