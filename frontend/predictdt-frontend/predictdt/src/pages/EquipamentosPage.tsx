import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Cpu, Link as LinkIcon, Gauge, X, AlertCircle, RefreshCw } from 'lucide-react';
import { equipamentoService, sensorService, sensorEquipamentoService } from '../services';
import type { Equipamento, Sensor, SensorEquipamento } from '../types';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../contexts/ToastContext';

// ── Form para criar/editar Equipamento ──────────────────────
function EquipamentoForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<Equipamento>;
  onSubmit: (data: { descricao: string; ativo: boolean }) => void;
  loading: boolean;
}) {
  const [descricao, setDescricao] = useState(initial?.descricao ?? '');
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ descricao, ativo });
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição do Equipamento</label>
        <input
          className="input-field"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Inversor 1"
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-400">Status</label>
        <button
          type="button"
          onClick={() => setAtivo(!ativo)}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{ background: ativo ? '#007C73' : '#4b5563' }}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
              ativo ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
        <span className="text-xs text-gray-400">{ativo ? 'Ativo' : 'Inativo'}</span>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

// ── Modal de gestão de vínculos ─────────────────────────────
function VinculosModal({
  equipamento,
  onClose,
}: {
  equipamento: Equipamento;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [selectedSensorId, setSelectedSensorId] = useState('');
  const [removeTarget, setRemoveTarget] = useState<SensorEquipamento | null>(null);

  const { data: allSensores, isLoading: loadingSensores } = useQuery({
    queryKey: ['sensores-all'],
    queryFn: () => sensorService.listAll(),
  });

  const { data: allVinculos, isLoading: loadingVinculos } = useQuery({
    queryKey: ['vinculos-all'],
    queryFn: () => sensorEquipamentoService.listAll(),
  });

  // Vínculos deste equipamento
  const vinculosDoEquip = useMemo(() => {
    if (!allVinculos) return [];
    return allVinculos.filter((v) => v.idEquipamento === equipamento.id);
  }, [allVinculos, equipamento.id]);

  // IDs de sensores já vinculados (pra remover do dropdown)
  const idsVinculados = useMemo(() => new Set(vinculosDoEquip.map((v) => v.idSensor)), [vinculosDoEquip]);

  // Sensores disponíveis pra vincular
  const sensoresDisponiveis = useMemo(() => {
    if (!allSensores) return [];
    return allSensores.filter((s) => !idsVinculados.has(s.id));
  }, [allSensores, idsVinculados]);

  const createMut = useMutation({
    mutationFn: () =>
      sensorEquipamentoService.create({
        idSensor: selectedSensorId,
        idEquipamento: equipamento.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vinculos-all'] });
      success('Sensor vinculado!');
      setSelectedSensorId('');
    },
    onError: (e: { message: string }) => error('Erro ao vincular', e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => sensorEquipamentoService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vinculos-all'] });
      success('Vínculo removido!');
      setRemoveTarget(null);
    },
    onError: (e: { message: string }) => error('Erro ao remover', e.message),
  });

  const isLoading = loadingSensores || loadingVinculos;
  const noSensoresCadastrados = !isLoading && (!allSensores || allSensores.length === 0);

  return (
    <>
      <Modal open onClose={onClose} title={`Sensores de "${equipamento.descricao}"`} size="md">
        <div className="flex flex-col gap-5">
          {/* Form pra vincular novo sensor */}
          {noSensoresCadastrados ? (
            <div
              className="rounded-lg p-4 flex items-start gap-3"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-medium text-amber-300">Nenhum sensor cadastrado</p>
                <p className="text-xs text-gray-400 mt-1">
                  Para vincular sensores a este equipamento, cadastre primeiro um sensor na página{' '}
                  <span className="text-amber-300 font-medium">Sensores</span>.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Vincular novo sensor
              </label>
              <div className="flex gap-2">
                <select
                  className="input-field flex-1"
                  value={selectedSensorId}
                  onChange={(e) => setSelectedSensorId(e.target.value)}
                  style={{ background: '#1C2333' }}
                  disabled={sensoresDisponiveis.length === 0}
                >
                  <option value="">
                    {sensoresDisponiveis.length === 0
                      ? 'Todos os sensores já estão vinculados'
                      : 'Selecione um sensor...'}
                  </option>
                  {sensoresDisponiveis.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.descricao} ({s.unidadeMedida})
                    </option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  disabled={!selectedSensorId || createMut.isPending}
                  onClick={() => createMut.mutate()}
                >
                  <LinkIcon size={14} />
                  {createMut.isPending ? '...' : 'Vincular'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de vínculos atuais */}
          <div>
            <h4
              className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              Sensores Vinculados ({vinculosDoEquip.length})
            </h4>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : vinculosDoEquip.length === 0 ? (
              <div
                className="rounded-lg p-6 text-center"
                style={{ background: '#0d1117', border: '1px dashed #30363D' }}
              >
                <Gauge size={20} className="mx-auto mb-2 opacity-30" style={{ color: '#6b7280' }} />
                <p className="text-xs text-gray-500">Nenhum sensor vinculado a este equipamento</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {vinculosDoEquip.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: '#1C2333', border: '1px solid #30363D' }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,124,115,0.15)' }}
                    >
                      <Gauge size={14} style={{ color: '#007C73' }} />
                    </div>
                    <span className="text-sm text-gray-200 flex-1">
                      {v.descricaoSensor ?? v.idSensor.slice(0, 8) + '...'}
                    </span>
                    <button
                      className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-500/10"
                      onClick={() => setRemoveTarget(v)}
                      title="Remover vínculo"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remover Vínculo"
        message={`Remover o sensor "${removeTarget?.descricaoSensor}" deste equipamento?`}
        onConfirm={() => removeTarget && deleteMut.mutate(removeTarget.id)}
        onCancel={() => setRemoveTarget(null)}
        loading={deleteMut.isPending}
      />
    </>
  );
}

// ── Page ────────────────────────────────────────────────────
export default function EquipamentosPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; item?: Equipamento }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<Equipamento | null>(null);
  const [vinculosTarget, setVinculosTarget] = useState<Equipamento | null>(null);

  const { data, isLoading, refetch: refetchEquipamentos, isFetching } = useQuery({
    queryKey: ['equipamentos', page],
    queryFn: () => equipamentoService.list(page, 10).then((r) => r.data),
  });

  const { data: allEquipamentos, refetch: refetchAllEquipamentos, isFetching: isFetchingAllEquipamentos } = useQuery({
    queryKey: ['equipamentos-all'],
    queryFn: () => equipamentoService.listAll(),
  });

  // Pra mostrar contagem de sensores vinculados na tabela
  const { data: allVinculos } = useQuery({
    queryKey: ['vinculos-all'],
    queryFn: () => sensorEquipamentoService.listAll(),
  });

  const countSensores = (equipId: string) =>
    allVinculos?.filter((v) => v.idEquipamento === equipId).length ?? 0;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data?.content ?? [];

    return (allEquipamentos ?? []).filter((e) =>
      [e.descricao, e.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [allEquipamentos, data, search]);

  const refreshEquipamentos = async () => {
    await Promise.all([
      refetchEquipamentos(),
      refetchAllEquipamentos(),
      qc.invalidateQueries({ queryKey: ['vinculos-all'] }),
    ]);
  };

  const createMut = useMutation({
    mutationFn: equipamentoService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipamentos'] });
      qc.invalidateQueries({ queryKey: ['equipamentos-all'] });
      success('Equipamento criado!');
      setModal({ open: false });
    },
    onError: (e: { message: string }) => error('Erro ao criar', e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { descricao: string; ativo: boolean } }) =>
      equipamentoService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipamentos'] });
      qc.invalidateQueries({ queryKey: ['equipamentos-all'] });
      success('Equipamento atualizado!');
      setModal({ open: false });
    },
    onError: (e: { message: string }) => error('Erro ao atualizar', e.message),
  });
  const deleteMut = useMutation({
    mutationFn: equipamentoService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipamentos'] });
      qc.invalidateQueries({ queryKey: ['equipamentos-all'] });
      success('Equipamento excluído!');
      setDeleteTarget(null);
    },
    onError: (e: { message: string }) => error('Erro ao excluir', e.message),
  });

  const columns = [
    {
      key: 'descricao',
      label: 'Equipamento',
      render: (row: Equipamento) => (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,124,115,0.15)' }}
          >
            <Cpu size={14} style={{ color: '#007C73' }} />
          </div>
          <span className="text-sm text-gray-200">{row.descricao}</span>
        </div>
      ),
    },
    { key: 'ativo', label: 'Status', render: (row: Equipamento) => <StatusBadge active={row.ativo} /> },
    {
      key: 'sensores',
      label: 'Sensores',
      render: (row: Equipamento) => {
        const count = countSensores(row.id);
        return (
          <span
            className="font-mono text-xs px-2 py-0.5 rounded inline-flex items-center gap-1"
            style={{
              background: count > 0 ? 'rgba(0,124,115,0.1)' : '#1C2333',
              color: count > 0 ? '#00A89C' : '#6b7280',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <Gauge size={11} />
            {count}
          </span>
        );
      },
    },
    {
      key: 'dtInclusao',
      label: 'Criado em',
      render: (row: Equipamento) => (
        <span
          className="text-xs text-gray-500 font-mono"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {row.dtInclusao ? new Date(row.dtInclusao).toLocaleDateString('pt-BR') : '—'}
        </span>
      ),
    },
  ];

  return (
    <div
      className="flex flex-col gap-6 animate-fade-in"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Equipamentos
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie os equipamentos industriais e seus sensores
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          <Plus size={16} /> Novo Equipamento
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading || (Boolean(search.trim()) && isFetchingAllEquipamentos)}
        totalPages={search.trim() ? 1 : data?.totalPages}
        currentPage={search.trim() ? 0 : page}
        onPageChange={search.trim() ? undefined : setPage}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar equipamento..."
        toolbarActions={(
          <button
            className="btn-ghost"
            onClick={refreshEquipamentos}
            disabled={isFetching || isFetchingAllEquipamentos}
            title="Atualizar equipamentos"
          >
            <RefreshCw size={14} className={isFetching || isFetchingAllEquipamentos ? 'animate-spin' : undefined} />
            Atualizar
          </button>
        )}
        emptyText="Nenhum equipamento cadastrado"
        actions={(row) => (
          <>
            <button
              className="btn-ghost py-1.5 px-2"
              onClick={() => setVinculosTarget(row)}
              title="Gerenciar sensores"
            >
              <LinkIcon size={14} />
            </button>
            <button
              className="btn-ghost py-1.5 px-2"
              onClick={() => setModal({ open: true, item: row })}
              title="Editar"
            >
              <Pencil size={14} />
            </button>
            <button
              className="btn-danger py-1.5 px-2"
              onClick={() => setDeleteTarget(row)}
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.item ? 'Editar Equipamento' : 'Novo Equipamento'}
        size="sm"
      >
        <EquipamentoForm
          initial={modal.item}
          onSubmit={(d) =>
            modal.item ? updateMut.mutate({ id: modal.item.id, data: d }) : createMut.mutate(d)
          }
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      {vinculosTarget && (
        <VinculosModal equipamento={vinculosTarget} onClose={() => setVinculosTarget(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Equipamento"
        message={`Tem certeza que deseja excluir "${deleteTarget?.descricao}"?`}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
