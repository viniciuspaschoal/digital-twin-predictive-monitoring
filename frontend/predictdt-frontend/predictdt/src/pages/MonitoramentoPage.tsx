import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { Activity, RefreshCw, TrendingUp, Gauge } from 'lucide-react';
import {
  sensorService,
  equipamentoService,
  logMedidaService,
  sensorEquipamentoService,
} from '../services';
import type { Sensor } from '../types';
import StatusBadge from '../components/ui/StatusBadge';

const MONITORAMENTO_REFRESH_STORAGE_KEY = 'predictdt_monitoramento_refresh_interval';

const REFRESH_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: '2 min', value: 2 * 60 * 1000 },
  { label: '5 min', value: 5 * 60 * 1000 },
  { label: '10 min', value: 10 * 60 * 1000 },
  { label: '30 min', value: 30 * 60 * 1000 },
];

function getInitialRefreshInterval() {
  const stored = Number(localStorage.getItem(MONITORAMENTO_REFRESH_STORAGE_KEY));
  return REFRESH_OPTIONS.some((option) => option.value === stored) ? stored : 0;
}

function SensorChart({
  sensorId,
  sensorDescricao,
  color,
  unit,
  allLogs,
}: {
  sensorId: string;
  sensorDescricao: string;
  color: string;
  unit: string;
  allLogs?: { id: string; medida: number; dtMedida: string; descricaoSensor?: string }[];
}) {
  const filtered = useMemo(() => {
    if (!allLogs) return [];
    return allLogs
      .filter((l) => l.descricaoSensor?.toLowerCase() === sensorDescricao.toLowerCase())
      .slice(-50)
      .map((l) => ({
        time: new Date(l.dtMedida).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        valor: l.medida,
      }));
  }, [allLogs, sensorDescricao]);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span className="text-sm font-medium text-gray-300">{sensorDescricao}</span>
        <span
          className="text-xs text-gray-600 font-mono ml-auto"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {unit}
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
          Sem dados disponíveis
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id={`grad-${sensorId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2333" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <Tooltip
              contentStyle={{
                background: '#161B22',
                border: '1px solid #30363D',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke={color}
              fill={`url(#grad-${sensorId})`}
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function MonitoramentoPage() {
  const [selectedEquipamento, setSelectedEquipamento] = useState<string>('');
  const [refreshInterval, setRefreshInterval] = useState(getInitialRefreshInterval);

  const { data: equipamentos, refetch: refetchEquipamentos } = useQuery({
    queryKey: ['equipamentos-all'],
    queryFn: () => equipamentoService.listAll(),
    refetchInterval: refreshInterval || false,
    refetchIntervalInBackground: false,
  });

  const { data: vinculos, refetch: refetchVinculos } = useQuery({
    queryKey: ['vinculos-all'],
    queryFn: () => sensorEquipamentoService.listAll(),
    refetchInterval: refreshInterval || false,
    refetchIntervalInBackground: false,
  });

  const { data: allSensores, refetch: refetchSensores } = useQuery({
    queryKey: ['sensores-all'],
    queryFn: () => sensorService.listAll(),
    refetchInterval: refreshInterval || false,
    refetchIntervalInBackground: false,
  });

  const { data: logs, refetch: refetchLogs, isFetching } = useQuery({
    queryKey: ['logs-all'],
    queryFn: () => logMedidaService.list().then((r) => r.data),
    refetchInterval: refreshInterval || false,
    refetchIntervalInBackground: false,
  });

  const selectedRefreshLabel = REFRESH_OPTIONS.find((option) => option.value === refreshInterval)?.label ?? 'Manual';

  const updateRefreshInterval = (value: number) => {
    setRefreshInterval(value);
    localStorage.setItem(MONITORAMENTO_REFRESH_STORAGE_KEY, String(value));
  };

  const refreshMonitoramento = () => {
    refetchEquipamentos();
    refetchVinculos();
    refetchSensores();
    refetchLogs();
  };

  const COLORS = ['#007C73', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#22c55e'];

  const linkedSensors: Sensor[] = useMemo(() => {
    if (!selectedEquipamento || !vinculos || !allSensores) return [];
    const ids = vinculos
      .filter((v) => v.idEquipamento === selectedEquipamento)
      .map((v) => v.idSensor);
    return allSensores.filter((s) => ids.includes(s.id));
  }, [selectedEquipamento, vinculos, allSensores]);

  const equip = equipamentos?.find((e) => e.id === selectedEquipamento);

  return (
    <div className="flex flex-col gap-6 animate-fade-in" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Monitoramento
          </h1>
          <p className="text-sm text-gray-400 mt-1">Acompanhe as leituras dos sensores em tempo real</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border p-1" style={{ borderColor: '#30363D', background: '#0D1117' }}>
            {REFRESH_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateRefreshInterval(option.value)}
                className="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: refreshInterval === option.value ? 'rgba(0,124,115,0.18)' : 'transparent',
                  color: refreshInterval === option.value ? '#00A89C' : '#9ca3af',
                  border: refreshInterval === option.value ? '1px solid rgba(0,124,115,0.35)' : '1px solid transparent',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                title={option.value === 0 ? 'Atualização automática desligada' : `Atualizar automaticamente a cada ${option.label}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={refreshMonitoramento}
            disabled={isFetching}
            className="btn-ghost"
            title={`Atualizar monitoramento agora. Automático: ${selectedRefreshLabel}`}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : undefined} />
            Atualizar agora
          </button>
        </div>
      </div>

      <div className="glass-card p-4">
        <label className="block text-xs text-gray-400 mb-2">Selecionar Equipamento</label>
        <select
          className="input-field max-w-sm"
          value={selectedEquipamento}
          onChange={(e) => setSelectedEquipamento(e.target.value)}
          style={{ background: '#1C2333' }}
        >
          <option value="">— Selecione —</option>
          {equipamentos?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.descricao}
            </option>
          ))}
        </select>
      </div>

      {equip && (
        <div className="glass-card p-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,124,115,0.15)' }}
          >
            <Activity size={20} style={{ color: '#007C73' }} />
          </div>
          <div>
            <p className="font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {equip.descricao}
            </p>
            <div className="mt-1">
              <StatusBadge active={equip.ativo} />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp size={14} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {linkedSensors.length} sensor(es) vinculado(s)
            </span>
          </div>
        </div>
      )}

      {selectedEquipamento && linkedSensors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {linkedSensors.map((s, i) => (
            <SensorChart
              key={s.id}
              sensorId={s.id}
              sensorDescricao={s.descricao}
              color={COLORS[i % COLORS.length]}
              unit={s.unidadeMedida}
              allLogs={logs}
            />
          ))}
        </div>
      ) : selectedEquipamento ? (
        <div className="glass-card p-12 text-center text-gray-500">
          <Gauge size={32} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum sensor vinculado a este equipamento</p>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-gray-500">
          <Activity size={32} className="mx-auto mb-3 opacity-30" />
          <p>Selecione um equipamento para visualizar o monitoramento</p>
        </div>
      )}
    </div>
  );
}
