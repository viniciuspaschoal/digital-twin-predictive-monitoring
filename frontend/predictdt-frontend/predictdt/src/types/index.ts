export interface TopicoMqtt {
  id: string;
  descricao: string;
  ativo: boolean;
  dtInclusao?: string;
}

export interface Equipamento {
  id: string;
  descricao: string;
  ativo: boolean;
  dtInclusao?: string;
}

export interface Sensor {
  id: string;
  descricao: string;
  unidadeMedida: string;
  ativo: boolean;
  topicoId?: string;
  topicoAuxiliar?: string;
  topicoCompleto?: string;
  dtInclusao?: string;
  dtBloqueio?: string | null;
}

export interface SensorEquipamento {
  id: string;
  idSensor: string;
  descricaoSensor?: string;
  idEquipamento: string;
  descricaoEquipamento?: string;
}

export interface LogMedida {
  id: string;
  sensorId?: string;
  descricaoSensor?: string;
  medida: number;
  dtMedida: string;
}

// Spring Boot Page format
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
}

// ── Alertas de Anomalia ───────────────────────────────────────
export type SeveridadeAlerta = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TipoAnomalia = 'ACIMA_DO_PADRAO' | 'ABAIXO_DO_PADRAO' | 'FORA_DO_PADRAO';
export type StatusAlerta = 'ABERTO' | 'RECONHECIDO' | 'RESOLVIDO' | 'FECHADO' | 'IGNORADO';

export interface AlertaAnomalia {
  id: string;
  sensorId: string;
  descricaoSensor: string;
  equipamentoId?: string | null;
  descricaoEquipamento?: string | null;
  medida: number;
  mediaReferencia: number;
  desvioPadraoReferencia: number;
  limiteMinReferencia: number;
  limiteMaxReferencia: number;
  scoreDesvio: number;
  tipoAnomalia: TipoAnomalia;
  severidade: SeveridadeAlerta;
  statusAlerta: StatusAlerta;
  descricao: string;
  dtOcorrencia: string;
  dtReconhecimento?: string | null;
}

export interface AlertaContexto {
  alertaId: string;
  sensorDescricao: string;
  grandeza: string;
  unidade: string;
  equipamentosAfetados: string[];
  tipoEquipamento: string;
  tipoRelacao: string;
  mediaReferencia: number;
  desvioPadraoReferencia: number;
  limiteMin: number;
  limiteMax: number;
  medidaAtual: number;
  scoreDesvio: number;
}

export interface AlertaExplicacao {
  alertaId: string;
  titulo: string;
  resumo: string;
  possiveisCausas: string[];
  riscoOperacional: string;
  recomendacaoInicial: string;
  explicacaoIa: string;
  observacao: string;
}
