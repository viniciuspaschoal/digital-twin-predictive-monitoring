import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Gauge, Thermometer, Activity, Zap, RefreshCw } from 'lucide-react';
import { sensorService, topicoService } from '../services';
import type { Sensor } from '../types';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../contexts/ToastContext';

const sensorIcon = (descricao: string) => {
  const d = descricao.toLowerCase();
  if (d.includes('temp')) return <Thermometer size={14} style={{ color: '#f59e0b' }} />;
  if (d.includes('vibr')) return <Activity size={14} style={{ color: '#8b5cf6' }} />;
  if (d.includes('press') || d.includes('pres')) return <Zap size={14} style={{ color: '#3b82f6' }} />;
  return <Gauge size={14} style={{ color: '#007C73' }} />;
};

interface SensorFormData {
  descricao: string;
  unidadeMedida: string;
  topicoId: string;
  topicoAuxiliar: string;
}

type SensorUpdateData = {
  descricao: string;
  unidadeMedida: string;
  topicoId?: string;
  topicoAuxiliar?: string;
};

type SensorRecord = Partial<Sensor> & Record<string, unknown>;

function normalizeTopic(value?: string | null) {
  return String(value ?? '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function getStringField(source: SensorRecord | undefined, keys: string[]) {
  if (!source) return '';

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
}

function getNestedTopicField(source: SensorRecord | undefined, key: 'id' | 'descricao') {
  const nested = source?.topico ?? source?.topicoMqtt;
  if (nested && typeof nested === 'object') {
    const value = (nested as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
}

function buildInitialSensorForm(initial: Partial<Sensor> | undefined, topicos?: Array<{ id: string; descricao: string }>): SensorFormData {
  const source = initial as SensorRecord | undefined;
  const explicitTopicId =
    initial?.topicoId ||
    getStringField(source, ['idTopico', 'idTopicoMqtt', 'topicoMqttId', 'topico_id']) ||
    getNestedTopicField(source, 'id');

  const topicText =
    initial?.topicoCompleto ||
    getStringField(source, ['topico', 'topicoDescricao', 'descricaoTopico', 'topicoMqtt']) ||
    getNestedTopicField(source, 'descricao');

  let topicoId = explicitTopicId;
  let topicoAuxiliar = initial?.topicoAuxiliar ?? getStringField(source, ['topicoAux', 'auxiliarTopico']);

  if (!topicoId && topicText && topicos?.length) {
    const normalizedTopicText = normalizeTopic(topicText);
    const matchedTopic = [...topicos]
      .sort((a, b) => normalizeTopic(b.descricao).length - normalizeTopic(a.descricao).length)
      .find((topico) => {
        const normalizedDescricao = normalizeTopic(topico.descricao);
        return (
          normalizedTopicText === normalizedDescricao ||
          normalizedTopicText.startsWith(`${normalizedDescricao}/`) ||
          normalizedDescricao.endsWith(`/${normalizedTopicText}`)
        );
      });

    if (matchedTopic) {
      topicoId = matchedTopic.id;

      if (!topicoAuxiliar) {
        const normalizedBase = normalizeTopic(matchedTopic.descricao);
        if (normalizedTopicText.startsWith(`${normalizedBase}/`)) {
          topicoAuxiliar = topicText.trim().slice(matchedTopic.descricao.trim().replace(/^\/+|\/+$/g, '').length + 1);
        }
      }
    }
  }

  if (topicoId && !topicoAuxiliar && topicText && topicos?.length) {
    const topic = topicos.find((item) => item.id === topicoId);
    const normalizedTopicText = normalizeTopic(topicText);
    const normalizedBase = normalizeTopic(topic?.descricao);

    if (topic && normalizedTopicText.startsWith(`${normalizedBase}/`)) {
      topicoAuxiliar = topicText.trim().slice(topic.descricao.trim().replace(/^\/+|\/+$/g, '').length + 1);
    }
  }

  return {
    descricao: initial?.descricao ?? '',
    unidadeMedida: initial?.unidadeMedida ?? '',
    topicoId,
    topicoAuxiliar,
  };
}

function SensorForm({
  initial,
  onSubmit,
  loading,
  isEdit,
}: {
  initial?: Partial<Sensor>;
  onSubmit: (data: SensorFormData) => void;
  loading: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState<SensorFormData>({
    descricao: '',
    unidadeMedida: '',
    topicoId: '',
    topicoAuxiliar: '',
  });

  const { data: topicos } = useQuery({
    queryKey: ['topicos-all'],
    queryFn: () => topicoService.listAll(),
  });

  useEffect(() => {
    setForm(buildInitialSensorForm(initial, topicos));
  }, [initial, topicos]);

  const set = (key: keyof SensorFormData, val: string) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição</label>
        <input
          className="input-field"
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="Ex: dht11_temperatura"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Unidade de Medida</label>
        <input
          className="input-field"
          value={form.unidadeMedida}
          onChange={(e) => set('unidadeMedida', e.target.value)}
          placeholder="Ex: °C, Pa, Boolean"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Tópico MQTT</label>
        <select
          className="input-field"
          value={form.topicoId}
          onChange={(e) => set('topicoId', e.target.value)}
          required={!isEdit}
          style={{ background: '#1C2333' }}
        >
          <option value="">Selecione um tópico...</option>
          {topicos?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.descricao}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Tópico Auxiliar <span className="text-gray-600">(opcional)</span>
        </label>
        <input
          className="input-field"
          value={form.topicoAuxiliar}
          onChange={(e) => set('topicoAuxiliar', e.target.value)}
          placeholder="Ex: pressao_status"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

export default function SensoresPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; item?: Sensor }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<Sensor | null>(null);

  const { data, isLoading, refetch: refetchSensores, isFetching } = useQuery({
    queryKey: ['sensores', page],
    queryFn: () => sensorService.list(page, 10).then((r) => r.data),
  });

  const { data: allSensores, refetch: refetchAllSensores, isFetching: isFetchingAllSensores } = useQuery({
    queryKey: ['sensores-all'],
    queryFn: () => sensorService.listAll(),
  });

  const { data: editSensor, isFetching: isFetchingEditSensor } = useQuery({
    queryKey: ['sensor', modal.item?.id],
    queryFn: () => sensorService.getById(modal.item!.id).then((r) => r.data),
    enabled: !!modal.item?.id,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data?.content ?? [];

    return (allSensores ?? []).filter((s) =>
      [s.descricao, s.unidadeMedida, s.topicoCompleto, s.id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [allSensores, data, search]);

  const refreshSensores = async () => {
    await Promise.all([
      refetchSensores(),
      refetchAllSensores(),
      qc.invalidateQueries({ queryKey: ['topicos-all'] }),
    ]);
  };

  const createMut = useMutation({
    mutationFn: sensorService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensores'] });
      qc.invalidateQueries({ queryKey: ['sensores-all'] });
      success('Sensor criado!');
      setModal({ open: false });
    },
    onError: (e: { message: string }) => error('Erro ao criar', e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SensorUpdateData }) =>
      sensorService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensores'] });
      qc.invalidateQueries({ queryKey: ['sensores-all'] });
      qc.invalidateQueries({ queryKey: ['sensor'] });
      success('Sensor atualizado!');
      setModal({ open: false });
    },
    onError: (e: { message: string }) => error('Erro ao atualizar', e.message),
  });
  const deleteMut = useMutation({
    mutationFn: sensorService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensores'] });
      qc.invalidateQueries({ queryKey: ['sensores-all'] });
      success('Sensor excluído!');
      setDeleteTarget(null);
    },
    onError: (e: { message: string }) => error('Erro ao excluir', e.message),
  });

  const columns = [
    {
      key: 'descricao',
      label: 'Sensor',
      render: (row: Sensor) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(28,35,51,0.8)' }}>
            {sensorIcon(row.descricao)}
          </div>
          <span className="text-sm text-gray-200">{row.descricao}</span>
        </div>
      ),
    },
    {
      key: 'unidadeMedida',
      label: 'Unidade',
      render: (row: Sensor) => (
        <span
          className="font-mono text-xs px-2 py-0.5 rounded"
          style={{
            background: 'rgba(0,124,115,0.1)',
            color: '#00A89C',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {row.unidadeMedida}
        </span>
      ),
    },
    { key: 'ativo', label: 'Status', render: (row: Sensor) => <StatusBadge active={row.ativo} /> },
    {
      key: 'topicoCompleto',
      label: 'Tópico',
      render: (row: Sensor) => (
        <span className="text-xs text-gray-500 font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {row.topicoCompleto ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Sensores
          </h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie os sensores de monitoramento industrial</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          <Plus size={16} /> Novo Sensor
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading || (Boolean(search.trim()) && isFetchingAllSensores)}
        totalPages={search.trim() ? 1 : data?.totalPages}
        currentPage={search.trim() ? 0 : page}
        onPageChange={search.trim() ? undefined : setPage}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar sensor..."
        toolbarActions={(
          <button
            className="btn-ghost"
            onClick={refreshSensores}
            disabled={isFetching || isFetchingAllSensores}
            title="Atualizar sensores"
          >
            <RefreshCw size={14} className={isFetching || isFetchingAllSensores ? 'animate-spin' : undefined} />
            Atualizar
          </button>
        )}
        emptyText="Nenhum sensor cadastrado"
        actions={(row) => (
          <>
            <button className="btn-ghost py-1.5 px-2" onClick={() => setModal({ open: true, item: row })}>
              <Pencil size={14} />
            </button>
            <button className="btn-danger py-1.5 px-2" onClick={() => setDeleteTarget(row)}>
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.item ? 'Editar Sensor' : 'Novo Sensor'}
      >
        {modal.item && isFetchingEditSensor && (
          <div className="mb-4 rounded-lg px-3 py-2 text-xs text-gray-400" style={{ background: '#0d1117', border: '1px solid #30363D' }}>
            Carregando dados atuais do banco...
          </div>
        )}
        <SensorForm
          initial={editSensor ?? modal.item}
          isEdit={!!modal.item}
          onSubmit={(d) =>
            modal.item
              ? updateMut.mutate({
                  id: modal.item.id,
                  data: {
                    descricao: d.descricao,
                    unidadeMedida: d.unidadeMedida,
                    topicoId: d.topicoId || undefined,
                    topicoAuxiliar: d.topicoAuxiliar || undefined,
                  },
                })
              : createMut.mutate(d)
          }
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Sensor"
        message={`Tem certeza que deseja excluir "${deleteTarget?.descricao}"?`}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
