import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Radio } from 'lucide-react';
import { topicoService } from '../services';
import type { TopicoMqtt } from '../types';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../contexts/ToastContext';

function TopicoForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<TopicoMqtt>;
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
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Descrição / Tópico</label>
        <input
          className="input-field"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: unisal/projeto3"
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

export default function TopicosPage() {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; item?: TopicoMqtt }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<TopicoMqtt | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['topicos', page],
    queryFn: () => topicoService.list(page, 10).then((r) => r.data),
  });

  // Client-side filter since API has no search param
  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data.content;
    return data.content.filter((t) => t.descricao.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const createMut = useMutation({
    mutationFn: topicoService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topicos'] });
      success('Tópico criado!');
      setModal({ open: false });
    },
    onError: (e: { message: string }) => error('Erro ao criar', e.message),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { descricao: string; ativo: boolean } }) =>
      topicoService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topicos'] });
      success('Tópico atualizado!');
      setModal({ open: false });
    },
    onError: (e: { message: string }) => error('Erro ao atualizar', e.message),
  });
  const deleteMut = useMutation({
    mutationFn: topicoService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['topicos'] });
      success('Tópico excluído!');
      setDeleteTarget(null);
    },
    onError: (e: { message: string }) => error('Erro ao excluir', e.message),
  });

  const columns = [
    {
      key: 'descricao',
      label: 'Descrição',
      render: (row: TopicoMqtt) => (
        <div className="flex items-center gap-2">
          <Radio size={14} style={{ color: '#007C73' }} />
          <span className="font-mono text-xs" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {row.descricao}
          </span>
        </div>
      ),
    },
    { key: 'ativo', label: 'Status', render: (row: TopicoMqtt) => <StatusBadge active={row.ativo} /> },
    {
      key: 'dtInclusao',
      label: 'Criado em',
      render: (row: TopicoMqtt) => (
        <span className="text-xs text-gray-500 font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {row.dtInclusao ? new Date(row.dtInclusao).toLocaleDateString('pt-BR') : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Tópicos MQTT
          </h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie os tópicos de mensageria do broker MQTT</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          <Plus size={16} /> Novo Tópico
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        totalPages={data?.totalPages}
        currentPage={page}
        onPageChange={setPage}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar por descrição..."
        emptyText="Nenhum tópico MQTT cadastrado"
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
        title={modal.item ? 'Editar Tópico' : 'Novo Tópico MQTT'}
        size="sm"
      >
        <TopicoForm
          initial={modal.item}
          onSubmit={(d) =>
            modal.item ? updateMut.mutate({ id: modal.item.id, data: d }) : createMut.mutate(d)
          }
          loading={createMut.isPending || updateMut.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Tópico"
        message={`Tem certeza que deseja excluir o tópico "${deleteTarget?.descricao}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
