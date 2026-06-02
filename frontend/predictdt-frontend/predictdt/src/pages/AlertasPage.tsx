import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bell, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { alertaService } from '../services';
import { connectAlertasWebSocket } from '../services/alertWebSocket';
import type { AlertaAnomalia, SeveridadeAlerta } from '../types';
import AlertCard from '../components/alertas/AlertCard';
import AlertModal from '../components/alertas/AlertModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';

const PAGE_SIZE = 20;

const severityOrder: Record<SeveridadeAlerta, number> = {
  CRITICA: 0,
  ALTA: 1,
  MEDIA: 2,
  BAIXA: 3,
};

const severityColor: Record<SeveridadeAlerta, string> = {
  CRITICA: '#f87171',
  ALTA: '#fb923c',
  MEDIA: '#fbbf24',
  BAIXA: '#60a5fa',
};

function severityTitle(severidade: SeveridadeAlerta) {
  return severidade === 'CRITICA'
    ? 'Novo alerta crítico detectado'
    : 'Novo alerta detectado';
}

function formatMeasure(value: number) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : String(value);
}

function getResolverTodosMessage(data: unknown) {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.mensagem === 'string') return record.mensagem;
  }
  return 'Alertas abertos resolvidos.';
}

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<AlertaAnomalia[]>([]);
  const [alertaAtivo, setAlertaAtivo] = useState<AlertaAnomalia | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalAlertasAbertos, setTotalAlertasAbertos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [firstPage, setFirstPage] = useState(true);
  const [lastPage, setLastPage] = useState(true);
  const [newAlertIds, setNewAlertIds] = useState<Set<string>>(new Set());
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmResolverTodos, setConfirmResolverTodos] = useState(false);
  const [resolvingAll, setResolvingAll] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const pageRef = useRef(0);
  const { toast, success, error } = useToast();

  const fetchAlertas = useCallback(async (targetPage = pageRef.current, showRefreshing = true) => {
    if (showRefreshing) setRefreshing(true);

    try {
      const { data } = await alertaService.getAbertosPaginado(targetPage, PAGE_SIZE);
      const content = Array.isArray(data.content) ? data.content : [];
      const responsePage = Number.isFinite(Number(data.number)) ? Number(data.number) : targetPage;
      const responseTotalPages = Number.isFinite(Number(data.totalPages)) ? Math.max(Number(data.totalPages), 1) : 1;
      const responseTotalElements = Number.isFinite(Number(data.totalElements)) ? Number(data.totalElements) : content.length;

      setAlertas(content);
      setTotalAlertasAbertos(responseTotalElements);
      setTotalPages(responseTotalPages);
      setPage(responsePage);
      pageRef.current = responsePage;
      setFirstPage(typeof data.first === 'boolean' ? data.first : responsePage <= 0);
      setLastPage(typeof data.last === 'boolean' ? data.last : responsePage >= responseTotalPages - 1);
      content.forEach((alerta) => seenIds.current.add(alerta.id));
    } catch {
      error('Erro ao carregar alertas', 'Não foi possível buscar a página de alertas abertos.');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, [error]);

  useEffect(() => {
    fetchAlertas(0);
  }, [fetchAlertas]);

  const openAlerta = useCallback((alerta: AlertaAnomalia) => {
    seenIds.current.add(alerta.id);
    setNewAlertIds((prev) => {
      const next = new Set(prev);
      next.delete(alerta.id);
      return next;
    });
    setAlertaAtivo(alerta);
  }, []);

  useEffect(() => {
    return connectAlertasWebSocket((alerta) => {
      if (alerta.statusAlerta && alerta.statusAlerta !== 'ABERTO') {
        setAlertas((prev) => prev.filter((item) => item.id !== alerta.id));
        return;
      }

      let isDuplicate = false;
      setAlertas((prev) => {
        if (prev.some((item) => item.id === alerta.id) || seenIds.current.has(alerta.id)) {
          isDuplicate = true;
          return prev;
        }

        if (pageRef.current !== 0) return prev;

        return [alerta, ...prev].slice(0, PAGE_SIZE);
      });

      if (isDuplicate) return;

      seenIds.current.add(alerta.id);
      setNewAlertIds((prev) => new Set(prev).add(alerta.id));
      setTotalAlertasAbertos((prev) => prev + 1);

      const color = severityColor[alerta.severidade];
      toast(
        alerta.severidade === 'CRITICA' || alerta.severidade === 'ALTA' ? 'error' : 'info',
        severityTitle(alerta.severidade),
        `${alerta.descricaoSensor} apresentou leitura ${formatMeasure(alerta.medida)} fora do padrão esperado.`,
        {
          durationMs: 9000,
          actionLabel: 'Ver análise',
          accentColor: color,
          onAction: () => openAlerta(alerta),
          onClick: () => openAlerta(alerta),
        }
      );
    });
  }, [openAlerta, toast]);

  const alertasOrdenados = useMemo(() => {
    return [...alertas].sort((a, b) => {
      const aReconhecido = a.statusAlerta === 'RECONHECIDO' ? 0 : 1;
      const bReconhecido = b.statusAlerta === 'RECONHECIDO' ? 0 : 1;
      if (aReconhecido !== bReconhecido) return aReconhecido - bReconhecido;

      if (a.statusAlerta === 'RECONHECIDO' && b.statusAlerta === 'RECONHECIDO') {
        const reconhecimentoDiff =
          new Date(b.dtReconhecimento ?? b.dtOcorrencia).getTime() -
          new Date(a.dtReconhecimento ?? a.dtOcorrencia).getTime();
        if (reconhecimentoDiff !== 0) return reconhecimentoDiff;
      }

      const dateDiff = new Date(b.dtOcorrencia).getTime() - new Date(a.dtOcorrencia).getTime();
      if (dateDiff !== 0) return dateDiff;
      return severityOrder[a.severidade] - severityOrder[b.severidade];
    });
  }, [alertas]);

  const alertasCriticosPagina = alertas.filter((a) => a.severidade === 'CRITICA' || a.severidade === 'ALTA').length;
  const safePage = Number.isFinite(page) ? page : 0;
  const safeTotalPages = Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;

  const replaceAlerta = (alerta: AlertaAnomalia) => {
    setAlertas((prev) => {
      if (alerta.statusAlerta === 'RECONHECIDO') {
        return [alerta, ...prev.filter((item) => item.id !== alerta.id)];
      }

      return prev.map((item) => (item.id === alerta.id ? alerta : item));
    });
    setAlertaAtivo((prev) => (prev?.id === alerta.id ? alerta : prev));
  };

  const removeAlerta = (alertaId: string) => {
    setAlertas((prev) => prev.filter((item) => item.id !== alertaId));
    setTotalAlertasAbertos((prev) => Math.max(prev - 1, 0));
    setNewAlertIds((prev) => {
      const next = new Set(prev);
      next.delete(alertaId);
      return next;
    });
    setAlertaAtivo((prev) => (prev?.id === alertaId ? null : prev));
  };

  const handleReconhecer = async (alerta: AlertaAnomalia) => {
    if (alerta.statusAlerta === 'RECONHECIDO') return;
    setActionLoadingId(alerta.id);

    try {
      const { data } = await alertaService.reconhecer(alerta.id);
      const updated: Partial<AlertaAnomalia> = data && typeof data === 'object' ? data : {};
      replaceAlerta({
        ...alerta,
        ...updated,
        statusAlerta: updated.statusAlerta ?? 'RECONHECIDO',
        dtReconhecimento: updated.dtReconhecimento ?? alerta.dtReconhecimento ?? new Date().toISOString(),
      });
      success('Alerta reconhecido');
    } catch {
      error('Erro ao reconhecer alerta');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolver = async (alerta: AlertaAnomalia) => {
    setActionLoadingId(alerta.id);

    try {
      await alertaService.resolver(alerta.id);
      removeAlerta(alerta.id);
      success('Alerta resolvido');
      fetchAlertas(pageRef.current, false);
    } catch {
      error('Erro ao resolver alerta');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleIgnorar = async (alerta: AlertaAnomalia) => {
    setActionLoadingId(alerta.id);

    try {
      await alertaService.ignorar(alerta.id);
      removeAlerta(alerta.id);
      success('Alerta ignorado');
      fetchAlertas(pageRef.current, false);
    } catch {
      error('Erro ao ignorar alerta');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolverTodos = async () => {
    setResolvingAll(true);

    try {
      const { data } = await alertaService.resolverAbertos();
      success('Alertas resolvidos', getResolverTodosMessage(data));
      setConfirmResolverTodos(false);
      await fetchAlertas(0, false);
    } catch {
      error('Erro ao resolver alertas abertos');
    } finally {
      setResolvingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Alertas
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Central de avisos e anomalias abertas do sistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchAlertas(safePage)}
            disabled={refreshing}
            className="btn-ghost"
            title="Atualizar alertas"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : undefined} />
            Atualizar
          </button>
          <button
            onClick={() => setConfirmResolverTodos(true)}
            disabled={totalAlertasAbertos === 0 || resolvingAll}
            className="btn-ghost"
            title="Resolver todos os alertas abertos"
            style={{ color: '#9ca3af', borderColor: 'rgba(107,114,128,0.28)' }}
          >
            Resolver todos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card-hover p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-gray-500 font-mono">ABERTOS</p>
            <p className="text-3xl font-bold font-mono text-white">{totalAlertasAbertos}</p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.12)' }}>
            <Bell size={20} style={{ color: totalAlertasAbertos > 0 ? '#f87171' : '#6b7280' }} />
          </div>
        </div>

        <div className="glass-card-hover p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-gray-500 font-mono">CRITICOS / ALTOS</p>
            <p className="text-3xl font-bold font-mono" style={{ color: alertasCriticosPagina > 0 ? '#f87171' : '#22c55e' }}>
              {alertasCriticosPagina}
            </p>
            <p className="text-[10px] text-gray-600 font-mono mt-1">Página atual</p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={20} style={{ color: alertasCriticosPagina > 0 ? '#f87171' : '#f59e0b' }} />
          </div>
        </div>

        <div className="glass-card-hover p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-gray-500 font-mono">STATUS</p>
            <p className="text-xl font-bold" style={{ color: totalAlertasAbertos > 0 ? '#f59e0b' : '#22c55e', fontFamily: 'Space Grotesk, sans-serif' }}>
              {totalAlertasAbertos > 0 ? 'Atencao' : 'Sem alertas'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl p-8 flex flex-col items-center gap-2" style={{ background: 'rgba(22,27,34,0.6)', border: '1px dashed #1C2333' }}>
          <RefreshCw size={22} className="animate-spin" style={{ color: '#007C73' }} />
          <p className="text-sm text-gray-500 font-mono">Carregando alertas...</p>
        </div>
      ) : alertasOrdenados.length === 0 ? (
        <div className="rounded-xl p-8 flex flex-col items-center gap-2" style={{ background: 'rgba(22,27,34,0.6)', border: '1px dashed #1C2333' }}>
          <AlertTriangle size={22} style={{ color: '#1C2333' }} />
          <p className="text-sm text-gray-500 font-mono">Nenhum alerta em aberto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {alertasOrdenados.map((alerta) => (
            <AlertCard
              key={alerta.id}
              alerta={alerta}
              isNew={newAlertIds.has(alerta.id)}
              onClick={() => openAlerta(alerta)}
              onRecognize={() => handleReconhecer(alerta)}
              onResolve={() => handleResolver(alerta)}
              onIgnore={() => handleIgnorar(alerta)}
              actionLoading={actionLoadingId === alerta.id}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border px-4 py-3" style={{ borderColor: '#30363D', background: 'rgba(22,27,34,0.6)' }}>
        <span className="text-xs text-gray-500 font-mono">
          {totalAlertasAbertos} alerta(s) aberto(s)
        </span>
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-ghost px-3 py-1.5"
            onClick={() => fetchAlertas(Math.max(safePage - 1, 0))}
            disabled={firstPage || refreshing}
            style={{ opacity: firstPage ? 0.45 : 1 }}
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <span className="text-xs text-gray-500 font-mono">
            Página {safePage + 1} de {safeTotalPages}
          </span>
          <button
            className="btn-ghost px-3 py-1.5"
            onClick={() => fetchAlertas(safePage + 1)}
            disabled={lastPage || refreshing}
            style={{ opacity: lastPage ? 0.45 : 1 }}
          >
            Próxima
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {alertaAtivo && (
        <AlertModal
          alerta={alertaAtivo}
          onClose={() => setAlertaAtivo(null)}
          onRecognize={() => handleReconhecer(alertaAtivo)}
          onResolve={() => handleResolver(alertaAtivo)}
          onIgnore={() => handleIgnorar(alertaAtivo)}
          actionLoading={actionLoadingId === alertaAtivo.id}
        />
      )}

      <ConfirmDialog
        open={confirmResolverTodos}
        title="Resolver todos os alertas"
        message="Deseja resolver todos os alertas abertos?"
        onConfirm={handleResolverTodos}
        onCancel={() => setConfirmResolverTodos(false)}
        loading={resolvingAll}
      />
    </div>
  );
}
