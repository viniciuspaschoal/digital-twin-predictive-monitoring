import { useRef, useState, Suspense, useMemo, useEffect, useCallback, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  Cpu, Activity, TrendingUp, AlertTriangle, Power, Gauge, Upload, RefreshCw,
  Thermometer, Zap, Droplets, Radio, Users, Plus, Trash2, Link2, Unlink,
} from 'lucide-react';
import {
  equipamentoService,
  sensorEquipamentoService,
  sensorService,
  logMedidaService,
  alertaService,
} from '../services';
import type { Equipamento, Sensor, SensorEquipamento, LogMedida, AlertaAnomalia } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { connectAlertasWebSocket } from '../services/alertWebSocket';
import { mergeAlertasAbertos } from '../utils/alertEvents';
import {
  extractCameraView,
  extractEquipmentMap,
  getModelo3DFileUrl,
  modelo3dService,
  type Modelo3D,
} from '../services/modelo3dService';

// ═══════════════════════════════════════════════════════════
// 3D — Default fallback motor (when no custom GLB)
// ═══════════════════════════════════════════════════════════
function DefaultMotor({
  position, color, scale,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4;
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 1.4, 32]} />
        <meshStandardMaterial color={color === '#cbd5e1' ? '#cbd5e1' : color} metalness={0.7} roughness={0.3} emissive={color} emissiveIntensity={color === '#cbd5e1' ? 0 : 0.2} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 32]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
        <meshStandardMaterial color="#6b7280" metalness={1} roughness={0.1} />
      </mesh>
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <mesh
          key={deg}
          position={[
            Math.cos((deg * Math.PI) / 180) * 0.65,
            0,
            Math.sin((deg * Math.PI) / 180) * 0.65,
          ]}
          rotation={[0, (-deg * Math.PI) / 180, 0]}
          castShadow
        >
          <boxGeometry args={[0.05, 1.2, 0.15]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 3D — Custom GLB model loader
// ═══════════════════════════════════════════════════════════
const glbLoadDebugCounts = new Map<string, number>();

// Dev fallback vazio — vínculos reais vêm do backend via equipmentMap.
const GLB_EQUIPMENT_MAP_DEV_FALLBACK: Record<string, string> = {};

const GLB_EQUIPMENT_MAP_STORAGE_KEY = 'predictdt.glb.equipmentMap';

const GLB_CAMERA_VIEW_STORAGE_KEY = 'predictdt.glb.cameraView';

type CameraViewPreset = {
  position: [number, number, number];
  target: [number, number, number];
};

function normalizeObjectName(name: string) {
  return name.trim().toUpperCase();
}

function findEquipmentNode(object: THREE.Object3D | null): THREE.Object3D | null {
  let current = object;

  while (current) {
    const name = current.name ?? '';
    const userData = current.userData ?? {};

    if (
      userData.equipamentoId ||
      userData.equipmentId ||
      name.startsWith('EQP_')
    ) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

function CameraViewController({
  preset,
  editMode,
  onSaveRef,
}: {
  preset: CameraViewPreset | null;
  editMode: boolean;
  onSaveRef?: MutableRefObject<(() => CameraViewPreset | null) | null>;
}) {
  const { camera, controls, invalidate } = useThree();

  useEffect(() => {
    invalidate();
  }, [editMode, invalidate]);

  useEffect(() => {
    if (!preset) return;

    camera.position.set(...preset.position);

    const orbitControls = controls as { target?: THREE.Vector3; update?: () => void } | undefined;
    orbitControls?.target?.set(...preset.target);
    orbitControls?.update?.();

    invalidate();
  }, [camera, controls, invalidate, preset]);

  useEffect(() => {
    if (!onSaveRef) return undefined;

    onSaveRef.current = () => {
      const orbitControls = controls as { target?: THREE.Vector3 } | undefined;

      return {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: orbitControls?.target
          ? [orbitControls.target.x, orbitControls.target.y, orbitControls.target.z]
          : [0, 0, 0],
      };
    };

    return () => {
      onSaveRef.current = null;
    };
  }, [camera, controls, onSaveRef]);

  return null;
}

function GLBAdjustPreviewModel({
  url,
  cameraViewPreset,
}: {
  url: string;
  cameraViewPreset: CameraViewPreset | null;
}) {
  const { scene } = useGLTF(url);
  const { camera, controls, invalidate } = useThree();
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const originalBox = new THREE.Box3().setFromObject(model);
    const originalCenter = originalBox.getCenter(new THREE.Vector3());
    model.position.sub(originalCenter);
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);

    model.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    if (!cameraViewPreset && camera instanceof THREE.PerspectiveCamera) {
      const distance = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.35;
      camera.position.set(center.x, center.y + maxDim * 0.35, center.z + distance);
      camera.near = Math.max(distance / 100, 0.01);
      camera.far = distance * 100;
      camera.updateProjectionMatrix();

      const orbitControls = controls as { target?: THREE.Vector3; update?: () => void } | undefined;
      orbitControls?.target?.set(0, 0, 0);
      orbitControls?.update?.();
    }

    invalidate();
  }, [camera, cameraViewPreset, controls, invalidate, model]);

  return <primitive object={model} />;
}

function CustomPlantGLB({
  url,
  equipamentos,
  selectedEquipId,
  onSelectEquip,
  cameraViewPreset,
  isLinkMode,
  equipmentMap,
  onRequestLinkEquipment,
  onUnlinkedObjectClick,
}: {
  url: string;
  equipamentos: Equipamento[];
  selectedEquipId?: string;
  onSelectEquip: (equip: Equipamento) => void;
  cameraViewPreset: CameraViewPreset | null;
  isLinkMode: boolean;
  equipmentMap: Record<string, string>;
  onRequestLinkEquipment: (objectName: string) => void;
  onUnlinkedObjectClick?: (objectName: string) => void;
}) {
  const [hoveredEquip, setHoveredEquip] = useState<{ equip: Equipamento; position: [number, number, number] } | null>(null);
  const [modelBounds, setModelBounds] = useState<{ minX: number; width: number; topY: number } | null>(null);
  const { scene } = useGLTF(url);
  const { camera, controls, invalidate } = useThree();

  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const loadCount = (glbLoadDebugCounts.get(url) ?? 0) + 1;
    glbLoadDebugCounts.set(url, loadCount);

    const originalBox = new THREE.Box3().setFromObject(model);
    const originalCenter = originalBox.getCenter(new THREE.Vector3());
    model.position.sub(originalCenter);
    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);

    setModelBounds({
      minX: box.min.x,
      width: Math.max(size.x, 0.001),
      topY: box.max.y,
    });

    if (!cameraViewPreset && camera instanceof THREE.PerspectiveCamera) {
      const distance = (maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.35;
      camera.position.set(center.x, center.y + maxDim * 0.35, center.z + distance);
      camera.near = Math.max(distance / 100, 0.01);
      camera.far = distance * 100;
      camera.updateProjectionMatrix();

      const orbitControls = controls as { target?: THREE.Vector3; update?: () => void } | undefined;
      orbitControls?.target?.set(0, 0, 0);
      orbitControls?.update?.();
    }

    invalidate();

    const objectNames: string[] = [];
    const normalizedNameCount = new Map<string, number>();
    let meshCount = 0;

    model.traverse((object) => {
      console.log({
        name: object.name,
        type: object.type,
        userData: object.userData,
        parent: object.parent?.name,
      });

      objectNames.push(object.name || object.type);
      if ((object as THREE.Mesh).isMesh) {
        meshCount += 1;
        object.castShadow = true;
        object.receiveShadow = true;
      }

      const normalized = (object.name || object.type)
        .replace(/\.\d+$/u, '')
        .replace(/[_-]?\d+$/u, '')
        .toLowerCase();
      normalizedNameCount.set(normalized, (normalizedNameCount.get(normalized) ?? 0) + 1);
    });

    const nomesParecidos = [...normalizedNameCount.entries()]
      .filter(([, count]) => count > 1)
      .map(([name, count]) => `${name} (${count})`);

    console.groupCollapsed(`[PredictDT GLB] carregamento #${loadCount}`);
    console.info('Filhos diretos em gltf.scene:', scene.children.length);
    console.info('Malhas no clone renderizado:', meshCount);
    console.info('Objetos principais:', scene.children.map((child) => child.name || child.type));
    console.info('Primeiros objetos encontrados:', objectNames.slice(0, 25));
    if (nomesParecidos.length > 0) {
      console.warn(
        'Possiveis objetos duplicados/parecidos dentro do proprio GLB. Nao removi automaticamente; revise no Blender e exporte apenas os objetos necessarios.',
        nomesParecidos.slice(0, 25)
      );
    }
    console.groupEnd();

    return () => {
      document.body.style.cursor = 'auto';
      console.info('[PredictDT GLB] cleanup do modelo customizado');
    };
  }, [camera, cameraViewPreset, controls, invalidate, model, scene, url]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    console.log('Objeto clicado:', event.object.name);
    console.log('Parent:', event.object.parent?.name);

    const equipmentNode = findEquipmentNode(event.object);
    console.log('Equipment node encontrado:', equipmentNode?.name);
    console.log('Equipment map:', equipmentMap);
    console.log('Equipamentos carregados:', equipamentos);

    if (!equipmentNode) {
      console.warn('Objeto clicado não pertence a nenhum grupo EQP_:', {
        clickedObject: event.object.name,
        parent: event.object.parent?.name,
      });
      return;
    }

    const objectName = normalizeObjectName(
      String(
        equipmentNode.userData?.equipamentoId ||
        equipmentNode.userData?.equipmentId ||
        equipmentNode.name ||
        ''
      )
    );

    // Modo vinculação: abrir modal de seleção de equipamento
    if (isLinkMode) {
      onRequestLinkEquipment(objectName);
      return;
    }

    // Modo normal: buscar equipamento vinculado
    const equipamentoId =
      equipmentMap[objectName] ?? GLB_EQUIPMENT_MAP_DEV_FALLBACK[objectName];

    if (!equipamentoId) {
      console.warn('Grupo 3D ainda não vinculado:', objectName);
      onUnlinkedObjectClick?.(objectName);
      return;
    }

    const equipamento = equipamentos.find(
      (equip) => String(equip.id) === String(equipamentoId)
    );

    if (!equipamento) {
      console.warn('ID mapeado não encontrado na lista de equipamentos:', {
        objectName,
        equipamentoId,
        idsDisponiveis: equipamentos.map((equip) => equip.id),
      });
      return;
    }

    onSelectEquip(equipamento);
    invalidate();
  };

  const getTooltipPosition = useCallback((object: THREE.Object3D) => {
    const objectBox = new THREE.Box3().setFromObject(object);
    const objectCenter = objectBox.getCenter(new THREE.Vector3());
    return [
      objectCenter.x,
      objectBox.max.y + 0.25,
      objectCenter.z,
    ] as [number, number, number];
  }, []);

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();

    const equipmentNode = findEquipmentNode(event.object);

    if (!equipmentNode) {
      document.body.style.cursor = 'auto';
      setHoveredEquip(null);
      invalidate();
      return;
    }

    // Em modo vinculação, sempre mostra cursor de link
    if (isLinkMode) {
      document.body.style.cursor = 'crosshair';
      invalidate();
      return;
    }

    const objectName = normalizeObjectName(
      String(
        equipmentNode.userData?.equipamentoId ||
        equipmentNode.userData?.equipmentId ||
        equipmentNode.name ||
        ''
      )
    );

    const equipamentoId =
      equipmentMap[objectName] ?? GLB_EQUIPMENT_MAP_DEV_FALLBACK[objectName];

    if (!equipamentoId) {
      document.body.style.cursor = 'auto';
      setHoveredEquip(null);
      invalidate();
      return;
    }

    const equip = equipamentos.find(
      (e) => String(e.id) === String(equipamentoId)
    ) ?? null;

    if (equip) {
      document.body.style.cursor = 'pointer';
      setHoveredEquip({
        equip,
        position: getTooltipPosition(equipmentNode),
      });
      invalidate();
      return;
    }

    document.body.style.cursor = 'auto';
    setHoveredEquip(null);
    invalidate();
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = 'auto';
    setHoveredEquip(null);
    invalidate();
  };

  return (
    <group>
      <primitive
        object={model}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {isLinkMode && (
        <Html
          position={[0, (modelBounds?.topY ?? 0) + 0.6, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(245,158,11,0.92)',
              border: '1px solid #f59e0b',
              borderRadius: 6,
              padding: '5px 12px',
              color: '#000',
              fontSize: 11,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
            }}
          >
            🔗 Clique em uma peça para vincular
          </div>
        </Html>
      )}
      {hoveredEquip && hoveredEquip.equip.id !== selectedEquipId && (
        <Html position={hoveredEquip.position} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: '#007C73',
              border: '1px solid #007C73',
              borderRadius: 6,
              padding: '4px 10px',
              color: 'white',
              fontSize: 11,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,124,115,0.3)',
            }}
          >
            {hoveredEquip.equip.descricao}
          </div>
        </Html>
      )}
      {selectedEquipId && modelBounds && (
        <Html position={[0, modelBounds.topY + 0.25, 0]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(0,124,115,0.92)',
              border: '1px solid rgba(0,124,115,0.9)',
              borderRadius: 6,
              padding: '5px 10px',
              color: 'white',
              fontSize: 11,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 16px rgba(0,124,115,0.25)',
            }}
          >
            {equipamentos.find((equip) => equip.id === selectedEquipId)?.descricao}
          </div>
        </Html>
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 3D — Interactive Motor Wrapper (handles click + hover)
// ═══════════════════════════════════════════════════════════
function MotorInteractive({
  position, label, color, onClick, isSelected,
}: {
  position: [number, number, number];
  label: string;
  color: string;
  onClick: () => void;
  isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null!);
  const scale = hovered ? 1.12 : isSelected ? 1.08 : 1;

  // Gentle bobbing when selected
  useFrame((state) => {
    if (groupRef.current && isSelected) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    } else if (groupRef.current) {
      groupRef.current.position.y = position[1];
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      {/* Invisible hit-box that guarantees click works */}
      <mesh visible={false}>
        <boxGeometry args={[2, 3, 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Model */}
      <group scale={[scale, scale, scale]}>
        <DefaultMotor position={[0, 0, 0]} color={isSelected || hovered ? color : '#cbd5e1'} scale={1} />
      </group>

      {/* Floating label — only shows on hover, hides when selected to avoid bleeding into modal */}
      {hovered && !isSelected && (
        <Html position={[0, 1.8, 0]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: '#007C73',
              border: '1px solid #007C73',
              borderRadius: 6,
              padding: '4px 10px',
              color: 'white',
              fontSize: 11,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,124,115,0.3)',
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

function IndustrialPlatform() {
  return (
    <group>
      <mesh position={[0, -1.4, 0]} receiveShadow>
        <boxGeometry args={[8, 0.15, 4]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, -1.32, 0]}>
        <boxGeometry args={[7.8, 0.01, 3.8]} />
        <meshStandardMaterial color="#007C73" opacity={0.12} transparent />
      </mesh>
      <mesh position={[0, -0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 4, 16]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.4} />
      </mesh>
      {[-3.5, 3.5].map((x) =>
        [-1.8, 1.8].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -1.7, z]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.3} />
          </mesh>
        ))
      )}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// Chart for ONE sensor (used inside modal)
// ═══════════════════════════════════════════════════════════
function SensorChart({
  sensor, allLogs, color,
}: {
  sensor: Sensor;
  allLogs?: LogMedida[];
  color: string;
}) {
  const data = useMemo(() => {
    if (!allLogs) return [];
    return allLogs
      .filter((l) => l.descricaoSensor?.toLowerCase() === sensor.descricao.toLowerCase())
      .slice(-50)
      .map((l) => ({
        time: new Date(l.dtMedida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        valor: l.medida,
      }));
  }, [allLogs, sensor.descricao]);

  const latest = data[data.length - 1];
  const min = data.length ? Math.min(...data.map((d) => d.valor)) : null;
  const max = data.length ? Math.max(...data.map((d) => d.valor)) : null;
  const avg = data.length ? data.reduce((a, b) => a + b.valor, 0) / data.length : null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          <span className="text-sm font-medium text-gray-200">{sensor.descricao}</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(0,124,115,0.1)', color: '#00A89C', fontFamily: 'JetBrains Mono, monospace' }}>
            {sensor.unidadeMedida}
          </span>
        </div>
        <StatusBadge active={sensor.ativo} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'ATUAL', val: latest?.valor },
          { label: 'MÍN', val: min },
          { label: 'MÁX', val: max },
          { label: 'MÉD', val: avg },
        ].map((s) => (
          <div key={s.label} className="rounded p-2" style={{ background: '#0d1117', border: '1px solid #1C2333' }}>
            <div className="text-[10px] text-gray-600 mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
            <div className="text-sm font-mono font-semibold" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>
              {s.val != null ? s.val.toFixed(1) : '—'}
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-gray-600 text-xs">Sem dados disponíveis</div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${sensor.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2333" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: 8, fontSize: 12 }} itemStyle={{ color }} />
            <Area type="monotone" dataKey="valor" stroke={color} fill={`url(#grad-${sensor.id})`} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Equipment Detail Modal (opens on motor click)
// ═══════════════════════════════════════════════════════════
function EquipmentDetailModal({
  equip, sensors, allLogs, onClose,
}: {
  equip: Equipamento;
  sensors: Sensor[];
  allLogs?: LogMedida[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { success, error } = useToast();

  const toggleMut = useMutation({
    mutationFn: () => equipamentoService.update(equip.id, { descricao: equip.descricao, ativo: !equip.ativo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipamentos-all'] });
      qc.invalidateQueries({ queryKey: ['equipamentos'] });
      success('Status atualizado!');
    },
    onError: (e: { message: string }) => error('Erro ao atualizar', e.message),
  });

  const COLORS = ['#007C73', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#22c55e'];

  return (
    <Modal open onClose={onClose} title="" size="lg">
      <div className="flex flex-col gap-5 -mt-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: '#30363D' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,124,115,0.15)' }}>
              <Cpu size={22} style={{ color: '#007C73' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {equip.descricao}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge active={equip.ativo} />
                <span className="text-xs text-gray-500 font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  ID: {equip.id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
          <button
            className={equip.ativo ? 'btn-danger' : 'btn-primary'}
            onClick={() => toggleMut.mutate()}
            disabled={toggleMut.isPending}
          >
            <Power size={14} />
            {equip.ativo ? 'Desativar' : 'Ativar'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sensores Vinculados', value: sensors.length, icon: <Gauge size={14} style={{ color: '#007C73' }} />, color: '#007C73' },
            { label: 'Sensores Ativos', value: sensors.filter((s) => s.ativo).length, icon: <Activity size={14} style={{ color: '#22c55e' }} />, color: '#22c55e' },
            {
              label: 'Status',
              value: equip.ativo ? 'Online' : 'Offline',
              icon: <TrendingUp size={14} style={{ color: equip.ativo ? '#22c55e' : '#ef4444' }} />,
              color: equip.ativo ? '#22c55e' : '#ef4444',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-lg p-3" style={{ background: '#0d1117', border: '1px solid #1C2333' }}>
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span className="text-[11px] text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ fontFamily: 'JetBrains Mono, monospace', color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Leituras em Tempo Real
          </h3>
          {sensors.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: '#0d1117', border: '1px dashed #30363D' }}>
              <AlertTriangle size={24} className="mx-auto mb-2" style={{ color: '#f59e0b', opacity: 0.7 }} />
              <p className="text-sm text-gray-400">Nenhum sensor vinculado a este equipamento</p>
              <p className="text-xs text-gray-600 mt-1">
                Vincule sensores na página <span style={{ color: '#007C73', fontWeight: 600 }}>Equipamentos</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sensors.map((s, i) => (
                <SensorChart key={s.id} sensor={s} allLogs={allLogs} color={COLORS[i % COLORS.length]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// Dashboard Stats Top — matches screenshot cards
// ═══════════════════════════════════════════════════════════
function DashboardStats({
  equipamentos,
  totalSensoresAtivos,
  alertasCriticos = 0,
  onAlertasClick,
}: {
  equipamentos: Equipamento[];
  totalSensoresAtivos: number;
  alertasCriticos?: number;
  onAlertasClick: () => void;
}) {
  const ativos = equipamentos.filter((e) => e.ativo).length;

  const cards = [
    {
      label: 'EQUIPAMENTOS',
      value: equipamentos.length,
      sub: `${ativos} ativos`,
      icon: <Users size={20} style={{ color: '#007C73' }} />,
      iconBg: 'rgba(0,124,115,0.12)',
      accent: '#007C73',
    },
    {
      label: 'EQUIP. ATIVOS',
      value: ativos,
      sub: null,
      icon: <Cpu size={20} style={{ color: '#22c55e' }} />,
      iconBg: 'rgba(34,197,94,0.1)',
      accent: '#22c55e',
    },
    {
      label: 'SENSORES ATIVOS',
      value: totalSensoresAtivos,
      sub: null,
      icon: <Radio size={20} style={{ color: '#3b82f6' }} />,
      iconBg: 'rgba(59,130,246,0.1)',
      accent: '#3b82f6',
    },
    {
      label: 'ALERTAS CRÍTICOS',
      value: alertasCriticos,
      sub: alertasCriticos === 0 ? 'Sem alertas' : `${alertasCriticos} aberto(s)`,
      icon: <AlertTriangle size={20} style={{ color: alertasCriticos > 0 ? '#f87171' : '#f59e0b' }} />,
      iconBg: alertasCriticos > 0 ? 'rgba(248,113,113,0.12)' : 'rgba(245,158,11,0.1)',
      accent: alertasCriticos > 0 ? '#f87171' : '#f59e0b',
      onClick: onAlertasClick,
    },
  ];

  return (
    <div className="dashboard-stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="dashboard-stat-card glass-card-hover p-3 flex flex-col justify-between gap-2"
          onClick={c.onClick}
          onKeyDown={(e) => {
            if (c.onClick && (e.key === 'Enter' || e.key === ' ')) c.onClick();
          }}
          role={c.onClick ? 'button' : undefined}
          tabIndex={c.onClick ? 0 : undefined}
          style={{ cursor: c.onClick ? 'pointer' : 'default' }}
          title={c.onClick ? 'Abrir tela de alertas' : undefined}
        >
          <div className="flex items-start justify-between">
            <span
              className="text-[11px] font-semibold tracking-widest"
              style={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {c.label}
            </span>
            <div
              className="dashboard-stat-icon w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: c.iconBg }}
            >
              {c.icon}
            </div>
          </div>
          <div>
            <span
              className="dashboard-stat-value text-2xl font-bold"
              style={{ color: c.accent, fontFamily: 'JetBrains Mono, monospace' }}
            >
              {c.value}
            </span>
            {c.sub && (
              <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {c.sub}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Live Panel — right side of 3D viewer
// ═══════════════════════════════════════════════════════════
const LIVE_METRIC_LIMIT = 3;
const LIVE_SENSORS_STORAGE_KEY = 'predictdt_live_sensor_cards';

interface LiveSensorOption {
  id: string;
  sensorName: string;
  equipmentName: string;
  equipmentId?: string;
  title: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
}

type LiveMetricId = 'temp' | 'vazao' | 'corr' | 'pres' | 'vibr';
const LIVE_METRICS_STORAGE_KEY = 'predictdt_live_metrics';
const DEFAULT_LIVE_METRICS: LiveMetricId[] = ['temp', 'vazao', 'corr'];

const LIVE_METRICS: Record<LiveMetricId, {
  title: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
  aliases: string[];
}> = {
  temp: {
    title: 'Temperatura',
    unit: '°C',
    color: '#f59e0b',
    icon: <Thermometer size={18} />,
    aliases: ['temp', 'temperatura'],
  },
  vazao: {
    title: 'Vazao atual',
    unit: 'L/h',
    color: '#22c55e',
    icon: <Droplets size={18} />,
    aliases: ['vaz', 'flow'],
  },
  corr: {
    title: 'Corrente',
    unit: 'A',
    color: '#f97316',
    icon: <Zap size={18} />,
    aliases: ['corr', 'corrente', 'amp'],
  },
  pres: {
    title: 'Pressao',
    unit: 'bar',
    color: '#3b82f6',
    icon: <Gauge size={18} />,
    aliases: ['pres', 'pressao', 'pressure'],
  },
  vibr: {
    title: 'Vibracao',
    unit: 'mm/s',
    color: '#8b5cf6',
    icon: <Activity size={18} />,
    aliases: ['vibr', 'vibracao'],
  },
};

const LIVE_METRIC_IDS = Object.keys(LIVE_METRICS) as LiveMetricId[];

function getInitialLiveMetrics(): LiveMetricId[] {
  try {
    const stored = localStorage.getItem(LIVE_METRICS_STORAGE_KEY);
    if (!stored) return DEFAULT_LIVE_METRICS;

    const parsed = JSON.parse(stored) as string[];
    const valid = parsed.filter((id): id is LiveMetricId =>
      LIVE_METRIC_IDS.includes(id as LiveMetricId)
    );

    return [...new Set(valid)].slice(0, LIVE_METRIC_LIMIT);
  } catch {
    return DEFAULT_LIVE_METRICS;
  }
}

function getInitialLiveSensors(): string[] {
  try {
    const stored = localStorage.getItem(LIVE_SENSORS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as string[];
    return [...new Set(parsed.filter(Boolean))].slice(0, LIVE_METRIC_LIMIT);
  } catch {
    return [];
  }
}

function getSensorVisual(sensor: Sensor) {
  const ref = `${sensor.descricao} ${sensor.unidadeMedida}`.toLowerCase();

  if (ref.includes('temp') || ref.includes('°c')) {
    return { color: '#f59e0b', icon: <Thermometer size={18} /> };
  }

  if (ref.includes('vaz') || ref.includes('l/h') || ref.includes('flow')) {
    return { color: '#22c55e', icon: <Droplets size={18} /> };
  }

  if (ref.includes('corr') || ref.includes('amp') || ref.includes(' a')) {
    return { color: '#f97316', icon: <Zap size={18} /> };
  }

  if (ref.includes('press') || ref.includes('bar')) {
    return { color: '#3b82f6', icon: <Gauge size={18} /> };
  }

  if (ref.includes('vibr')) {
    return { color: '#8b5cf6', icon: <Activity size={18} /> };
  }

  return { color: '#00A89C', icon: <Radio size={18} /> };
}

function LivePanel({
  selectedEquip, equipamentos, vinculos, allSensores, allLogs,
}: {
  selectedEquip: Equipamento | null;
  equipamentos: Equipamento[];
  vinculos: SensorEquipamento[];
  allSensores: Sensor[];
  allLogs?: LogMedida[];
}) {
  const [wsStatus, setWsStatus] = useState<'connecting' | 'open' | 'closed'>('closed');
  const [wsData, setWsData] = useState<Record<string, number>>({});
  const [messageCount, setMessageCount] = useState(0);
  const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>(getInitialLiveSensors);
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const linkedSensors = useMemo(() => {
    if (!selectedEquip) return [];
    const ids = vinculos.filter((v) => v.idEquipamento === selectedEquip.id).map((v) => v.idSensor);
    return allSensores.filter((s) => ids.includes(s.id));
  }, [selectedEquip, vinculos, allSensores]);

  const availableSensors = useMemo<LiveSensorOption[]>(() => {
    const sensorById = new Map(allSensores.map((sensor) => [sensor.id, sensor]));
    const equipmentById = new Map(equipamentos.map((equip) => [equip.id, equip]));
    const options = vinculos
      .map((vinculo): LiveSensorOption | null => {
        const sensor = sensorById.get(vinculo.idSensor);
        if (!sensor) return null;

        const equipamento = equipmentById.get(vinculo.idEquipamento);
        const equipmentName = vinculo.descricaoEquipamento || equipamento?.descricao || 'Sem equipamento';
        const sensorName = vinculo.descricaoSensor || sensor.descricao;
        const visual = getSensorVisual(sensor);

        return {
          id: sensor.id,
          sensorName,
          equipmentName,
          equipmentId: vinculo.idEquipamento,
          title: `${sensorName} - ${equipmentName}`,
          unit: sensor.unidadeMedida,
          color: visual.color,
          icon: visual.icon,
        };
      })
      .filter((option): option is LiveSensorOption => Boolean(option));

    if (options.length > 0) return options;

    return allSensores.map((sensor) => {
      const visual = getSensorVisual(sensor);
      return {
        id: sensor.id,
        sensorName: sensor.descricao,
        equipmentName: 'Sem equipamento',
        title: `${sensor.descricao} - Sem equipamento`,
        unit: sensor.unidadeMedida,
        color: visual.color,
        icon: visual.icon,
      };
    });
  }, [allSensores, equipamentos, vinculos]);

  const availableSensorIds = useMemo(
    () => new Set(availableSensors.map((sensor) => sensor.id)),
    [availableSensors]
  );

  useEffect(() => {
    setSelectedSensorIds((prev) => {
      const valid = prev.filter((id) => availableSensorIds.has(id));

      if (valid.length > 0 || availableSensors.length === 0) {
        return valid;
      }

      return availableSensors.slice(0, LIVE_METRIC_LIMIT).map((sensor) => sensor.id);
    });
  }, [availableSensorIds, availableSensors]);

  // WebSocket Integration
  useEffect(() => {
    wsRef.current?.close();
    setWsStatus('connecting');

    const ws = new WebSocket(`ws://localhost:8765`);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('open');
    ws.onclose = () => setWsStatus('closed');
    ws.onmessage = (evt) => {
      try {
        const p = JSON.parse(evt.data);
        const val = p.medida ?? p.valor ?? p.value;
        const sensorId = p.sensor_id || p.sensorId || p.idSensor || p.sensor?.id;
        
        if (val == null || !sensorId) return;

        setWsData((prev) => {
          const next = { ...prev };
          next[sensorId] = val;
          return next;
        });

        setMessageCount((prev) => Math.min(prev + 1, 999));
      } catch (e) { console.error("Erro WS:", e); }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LIVE_SENSORS_STORAGE_KEY, JSON.stringify(selectedSensorIds));
    } catch {
      // ignore storage errors
    }
  }, [selectedSensorIds]);

  const live = wsStatus === 'open';
  const reading = wsData;
  const selectedMetrics = selectedSensorIds.reduce<Array<LiveSensorOption & { val?: number }>>((acc, id) => {
    const sensor = availableSensors.find((option) => option.id === id);
    if (sensor) acc.push({ ...sensor, val: reading[id] });
    return acc;
  }, []);
  const canAddMetric = selectedSensorIds.length < LIVE_METRIC_LIMIT;

  const addMetric = (id: string) => {
    setSelectedSensorIds((prev) => {
      if (prev.includes(id) || prev.length >= LIVE_METRIC_LIMIT) return prev;
      return [...prev, id];
    });
    setMetricModalOpen(false);
  };

  const removeMetric = (id: string) => {
    setSelectedSensorIds((prev) => prev.filter((sensorId) => sensorId !== id));
  };


  return (
    <div className="live-panel flex flex-col h-full" style={{ background: '#0D1117', borderLeft: '1px solid #30363D', minWidth: 0 }}>
      {/* Status Header */}
      <div className="px-3 py-2 border-b border-[#30363D] flex items-center justify-between bg-[#161B22]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${live ? 'bg-green-500' : 'bg-red-500'}`} 
               style={{ boxShadow: live ? '0 0 8px #22c55e' : 'none' }} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
            {live ? 'Transmissão Ativa' : 'Desconectado'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono">{messageCount} msgs</span>
          <button
            onClick={() => setMetricModalOpen(true)}
            disabled={!canAddMetric}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
            style={{
              background: canAddMetric ? 'rgba(0,124,115,0.12)' : 'rgba(75,85,99,0.08)',
              color: canAddMetric ? '#00A89C' : '#4b5563',
              border: canAddMetric ? '1px solid rgba(0,124,115,0.28)' : '1px solid rgba(75,85,99,0.12)',
              cursor: canAddMetric ? 'pointer' : 'not-allowed',
            }}
            title={canAddMetric ? 'Adicionar leitura' : 'Limite de 3 leituras'}
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Configurable values */}
      <div className="live-panel-content p-3 grid grid-cols-1 gap-2 overflow-y-auto">
        {selectedMetrics.map((m) => (
          <div key={m.id} className="live-metric-card relative overflow-hidden rounded-lg p-3 border border-[#30363D] bg-[#0d1117]">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0" style={{ color: '#6b7280' }}>
                {m.icon}
                <span className="text-[10px] font-bold tracking-wider uppercase truncate">{m.title}</span>
              </div>
              <button
                onClick={() => removeMetric(m.id)}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
                style={{ background: 'transparent', color: '#4b5563', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                  e.currentTarget.style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#4b5563';
                }}
                title="Remover leitura"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="live-metric-value text-3xl font-bold font-mono tracking-tighter" style={{ color: m.val != null ? m.color : '#21262d' }}>
                {m.val != null ? Number(m.val).toFixed(1) : '--.-'}
              </span>
              <span className="text-xs text-gray-600 font-medium">{m.unit}</span>
            </div>
            {/* Mini sparkline indicator */}
            <div className="absolute bottom-0 left-0 w-full h-1 opacity-20" style={{ background: m.color }} />
          </div>
        ))}

        {canAddMetric && (
          <button
            onClick={() => setMetricModalOpen(true)}
            className="live-add-card rounded-lg border border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors"
            style={{
              background: 'rgba(13,17,23,0.45)',
              borderColor: '#30363D',
              color: '#6b7280',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,124,115,0.6)';
              e.currentTarget.style.color = '#00A89C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#30363D';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <Plus size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Adicionar leitura
            </span>
          </button>
        )}
      </div>

      <Modal
        open={metricModalOpen}
        onClose={() => setMetricModalOpen(false)}
        title="Selecionar leitura"
        size="sm"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {selectedSensorIds.length}/{LIVE_METRIC_LIMIT} cards em tempo real
          </p>

          <div className="grid grid-cols-1 gap-2">
            {availableSensors.map((metric) => {
              const selected = selectedSensorIds.includes(metric.id);
              const disabled = selected || selectedSensorIds.length >= LIVE_METRIC_LIMIT;

              return (
                <button
                  key={metric.id}
                  onClick={() => addMetric(metric.id)}
                  disabled={disabled}
                  className="w-full rounded-lg p-3 flex items-center justify-between gap-3 text-left transition-colors"
                  style={{
                    background: selected ? 'rgba(0,124,115,0.08)' : '#0d1117',
                    border: selected ? '1px solid rgba(0,124,115,0.35)' : '1px solid #1C2333',
                    color: disabled && !selected ? '#4b5563' : '#e5e7eb',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${metric.color}18`, color: metric.color }}
                    >
                      {metric.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {metric.title}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        Unidade: {metric.unit}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: selected ? '#00A89C' : '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                    {selected ? 'Adicionado' : 'Adicionar'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Main Dashboard Page
// ═══════════════════════════════════════════════════════════
const GLB_STORAGE_KEY = 'predictdt_custom_glb';

function clearLegacyModelStorage() {
  localStorage.removeItem(GLB_STORAGE_KEY);
  localStorage.removeItem(GLB_CAMERA_VIEW_STORAGE_KEY);
  localStorage.removeItem(GLB_EQUIPMENT_MAP_STORAGE_KEY);
}

function getErrorMessage(err: unknown) {
  return err && typeof err === 'object' && 'message' in err
    ? String((err as { message?: unknown }).message ?? '')
    : undefined;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedEquip, setSelectedEquip] = useState<Equipamento | null>(null);
  const [modelo3dId, setModelo3dId] = useState<string | null>(null);
  const [customGlbUrl, setCustomGlbUrl] = useState<string | undefined>(() => {
    return localStorage.getItem(GLB_STORAGE_KEY) || undefined;
  });
  const [isUploadingModelo3d, setIsUploadingModelo3d] = useState(false);
  const [isSavingCameraView, setIsSavingCameraView] = useState(false);
  const [isSavingVinculo, setIsSavingVinculo] = useState(false);
  const [modelAdjustModalOpen, setModelAdjustModalOpen] = useState(false);
  const [cameraViewPreset, setCameraViewPreset] = useState<CameraViewPreset | null>(() => {
    try {
      const raw = localStorage.getItem(GLB_CAMERA_VIEW_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const cameraViewSaveRef = useRef<(() => CameraViewPreset | null) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Vinculação 3D ────────────────────────────────────────────
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [selected3DObjectName, setSelected3DObjectName] = useState<string | null>(null);
  const [isEquipmentLinkModalOpen, setIsEquipmentLinkModalOpen] = useState(false);
  const [is3DLinksModalOpen, setIs3DLinksModalOpen] = useState(false);
  const [equipmentMap, setEquipmentMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(GLB_EQUIPMENT_MAP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');

  // ── Alertas de anomalia ──────────────────────────────────────
  const [alertas, setAlertas] = useState<AlertaAnomalia[]>([]);
  const [refreshingDashboard, setRefreshingDashboard] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const fetchAlertas = useCallback(async () => {
    try {
      const { data } = await alertaService.getAbertos();
      data.forEach((a) => seenIds.current.add(a.id));
      setAlertas(data);
    } catch {
      // silently ignore polling errors
    }
  }, []);

  const handleAlertasWs = useCallback((incoming: AlertaAnomalia[]) => {
    const novos = incoming.filter((a) => !seenIds.current.has(a.id));

    novos.forEach((a) => {
      seenIds.current.add(a.id);
    });

    setAlertas((prev) => mergeAlertasAbertos(prev, incoming));
  }, []);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  useEffect(() => {
    return connectAlertasWebSocket((alerta) => {
      handleAlertasWs([alerta]);
    });
  }, [handleAlertasWs]);

  const { data: equipamentos = [], refetch: refetchEquipamentos } = useQuery({
    queryKey: ['equipamentos-all'],
    queryFn: () => equipamentoService.listAll(),
  });

  const { data: vinculos = [], refetch: refetchVinculos } = useQuery({
    queryKey: ['vinculos-all'],
    queryFn: () => sensorEquipamentoService.listAll(),
  });

  const { data: allSensores = [], refetch: refetchSensores } = useQuery({
    queryKey: ['sensores-all'],
    queryFn: () => sensorService.listAll(),
  });

  const { data: allLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['logs-all'],
    queryFn: () => logMedidaService.list().then((r) => r.data),
  });

  const totalSensoresAtivos = useMemo(() => allSensores.filter((s) => s.ativo).length, [allSensores]);

  const linkedSensors = useMemo(() => {
    if (!selectedEquip) return [];
    const ids = vinculos.filter((v) => v.idEquipamento === selectedEquip.id).map((v) => v.idSensor);
    return allSensores.filter((s) => ids.includes(s.id));
  }, [selectedEquip, vinculos, allSensores]);

  const filteredEquipamentos = useMemo(() => {
    const term = equipmentSearchTerm.trim().toLowerCase();
    if (!term) return equipamentos;
    return equipamentos.filter((equip) =>
      [equip.id, equip.descricao]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [equipamentos, equipmentSearchTerm]);

  const linked3DEntries = useMemo(() => Object.entries(equipmentMap), [equipmentMap]);

  const { success: toastSuccess, info: toastInfo, error: toastError } = useToast();

  const applyModelo3D = useCallback((modelo: Modelo3D) => {
    setModelo3dId(modelo.id);
    setCustomGlbUrl(getModelo3DFileUrl(modelo.url));
    setCameraViewPreset(modelo.cameraView ?? null);
    setEquipmentMap(modelo.equipmentMap ?? {});
    clearLegacyModelStorage();
  }, []);

  useEffect(() => {
    let active = true;

    modelo3dService.getModelo3DAtivo()
      .then(({ data }) => {
        if (!active) return;
        applyModelo3D(data);
      })
      .catch((err: { status?: number }) => {
        if (!active || err.status === 404) return;
        toastError('Erro ao carregar modelo 3D', 'Mantendo modelo padrão ou fallback local.');
      });

    return () => {
      active = false;
    };
  }, [applyModelo3D, toastError]);

  async function handleLink3DObjectToEquipment(equipamentoId: string) {
    if (!selected3DObjectName) return;
    if (!modelo3dId) {
      toastInfo('Importe um modelo 3D antes de vincular equipamentos.');
      return;
    }

    const objectName = selected3DObjectName;
    setIsSavingVinculo(true);

    try {
      const optimisticMap = {
        ...equipmentMap,
        [objectName]: String(equipamentoId),
      };
      const { data } = await modelo3dService.vincularEquipamento(
        modelo3dId,
        objectName,
        String(equipamentoId)
      );
      const nextMap = extractEquipmentMap(data, optimisticMap);

      setEquipmentMap(nextMap);
      setIsEquipmentLinkModalOpen(false);
      setSelected3DObjectName(null);
      setEquipmentSearchTerm('');

      const equip = equipamentos.find((e) => String(e.id) === String(equipamentoId));
      toastSuccess(
        'Vínculo 3D salvo',
        `${objectName} → ${equip?.descricao ?? equipamentoId}`
      );
    } catch (err: unknown) {
      toastError('Erro ao salvar vínculo 3D', getErrorMessage(err));
    } finally {
      setIsSavingVinculo(false);
    }
  }

  async function handleRemoveLink(objectName: string) {
    if (!modelo3dId) {
      toastInfo('Importe um modelo 3D antes de remover vínculos.');
      return;
    }

    const nextMap = { ...equipmentMap };
    delete nextMap[objectName];

    setIsSavingVinculo(true);
    try {
      const { data } = await modelo3dService.removerVinculo(modelo3dId, objectName);
      setEquipmentMap(extractEquipmentMap(data, nextMap));
      toastInfo('Vínculo removido', `${objectName} desvinculado.`);
    } catch (err: unknown) {
      toastError('Erro ao remover vínculo 3D', getErrorMessage(err));
    } finally {
      setIsSavingVinculo(false);
    }
  }

  const motorColors = ['#007C73', '#00A89C'];
  const motors = equipamentos.slice(0, 2);

  // GLB upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      alert('Por favor, selecione um arquivo .glb ou .gltf');
      return;
    }

    setIsUploadingModelo3d(true);
    try {
      const { data } = await modelo3dService.uploadModelo3D(file);
      applyModelo3D(data);
      toastSuccess('Modelo 3D importado com sucesso', data.fileName);
      setModelAdjustModalOpen(true);
    } catch (err: unknown) {
      toastError('Erro ao importar modelo 3D', getErrorMessage(err));
    } finally {
      setIsUploadingModelo3d(false);
      e.target.value = '';
    }
  };

  const resetModel = () => {
    setModelo3dId(null);
    setCustomGlbUrl(undefined);
    setCameraViewPreset(null);
    setEquipmentMap({});
    setModelAdjustModalOpen(false);
    clearLegacyModelStorage();
    toastInfo('Modelo 3D removido da visualização local', 'O backend não possui endpoint de desativação nesta versão.');
  };

  const saveCameraView = async () => {
    if (!modelo3dId) {
      toastInfo('Importe um modelo 3D antes de salvar a visualização.');
      return;
    }

    const preset = cameraViewSaveRef.current?.();
    if (!preset) return;

    setIsSavingCameraView(true);
    try {
      const { data } = await modelo3dService.saveCameraView(modelo3dId, preset);
      setCameraViewPreset(extractCameraView(data, preset));
      toastSuccess('Visualização salva');
      setModelAdjustModalOpen(false);
    } catch (err: unknown) {
      toastError('Erro ao salvar visualização', getErrorMessage(err));
    } finally {
      setIsSavingCameraView(false);
    }
  };

  const resetCameraView = () => {
    setCameraViewPreset(null);
    toastInfo('Visualização resetada localmente', 'Salve uma nova visualização para atualizar o backend.');
  };

  const closeModelAdjustModal = () => {
    setModelAdjustModalOpen(false);
  };

  const refreshDashboard = async () => {
    setRefreshingDashboard(true);
    try {
      await Promise.all([
        refetchEquipamentos(),
        refetchVinculos(),
        refetchSensores(),
        refetchLogs(),
        fetchAlertas(),
      ]);
    } finally {
      setRefreshingDashboard(false);
    }
  };

  return (
    <div className="dashboard-page flex flex-col h-full min-h-0 gap-4 animate-fade-in" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="dashboard-heading flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Visão geral do sistema de monitoramento preditivo</p>
        </div>
        <div className="dashboard-actions flex flex-wrap items-center gap-2">
          <button
            className="btn-ghost"
            onClick={refreshDashboard}
            disabled={refreshingDashboard}
            title="Atualizar dados do dashboard"
          >
            <RefreshCw size={14} className={refreshingDashboard ? 'animate-spin' : undefined} />
            Atualizar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            className="btn-ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingModelo3d}
            title="Carregar modelo 3D customizado (.glb)"
          >
            <Upload size={14} className={isUploadingModelo3d ? 'animate-pulse' : undefined} />
            {isUploadingModelo3d ? 'Importando...' : customGlbUrl ? 'Trocar modelo' : 'Carregar modelo 3D'}
          </button>
          {customGlbUrl && (
            <button
              className="btn-ghost"
              onClick={() => setModelAdjustModalOpen(true)}
              title="Ajustar modelo 3D"
            >
              <Gauge size={14} />
              Ajustar modelo 3D
            </button>
          )}
          {customGlbUrl && (
            <button
              className={isLinkMode ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setIsLinkMode((prev) => !prev)}
              title={isLinkMode ? 'Sair do modo de vinculação 3D' : 'Ativar modo de vinculação 3D'}
              style={isLinkMode ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)' } : undefined}
            >
              {isLinkMode ? <Unlink size={14} /> : <Link2 size={14} />}
              {isLinkMode ? 'Sair do modo vinculação' : 'Modo vinculação 3D'}
            </button>
          )}
          {customGlbUrl && (
            <button
              className="btn-ghost"
              onClick={() => setIs3DLinksModalOpen(true)}
              title="Gerenciar vínculos entre objetos 3D e equipamentos"
            >
              <Link2 size={14} />
              Gerenciar vínculos 3D ({linked3DEntries.length})
            </button>
          )}
        </div>
      </div>

      {isLinkMode && (
        <div
          className="rounded-lg px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b' }}
        >
          <Link2 size={16} style={{ flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <strong>Modo vinculação ativo:</strong> clique em uma bomba do modelo 3D para vincular a um equipamento cadastrado.
          </span>
        </div>
      )}

      <DashboardStats
        equipamentos={equipamentos}
        totalSensoresAtivos={totalSensoresAtivos}
        alertasCriticos={alertas.filter((a) => a.severidade === 'CRITICA' || a.severidade === 'ALTA').length}
        onAlertasClick={() => navigate('/alertas')}
      />

      <div
        className="dashboard-twin-shell rounded-xl overflow-hidden border"
        style={{ borderColor: '#30363D' }}
      >
        {/* ── 3D Canvas ── */}
        <div
          className="dashboard-canvas-panel relative"
          style={{ background: 'radial-gradient(ellipse at 50% 60%, #ffffff 0%, #f3f4f6 100%)' }}
        >
          {/* Overlays (pointer-events disabled so they don't block clicks) */}
          <div className="absolute top-4 left-4 flex flex-col gap-1" style={{ zIndex: 10, pointerEvents: 'none' }}>
            <div className="text-xs font-mono" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6b7280' }}>
              DIGITAL TWIN v1.0
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 4px rgba(34,197,94,0.8)' }} />
              <span className="text-xs font-mono" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#16a34a' }}>
                LIVE
              </span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 text-xs" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#9ca3af', zIndex: 10, pointerEvents: 'none' }}>
            {motors.length === 0 ? 'Nenhum equipamento encontrado' : '👆 Clique nos motores para ver detalhes'}
          </div>

          {customGlbUrl && (
            <div className="absolute top-4 right-4 px-2 py-1 rounded text-[10px] font-mono" style={{ background: 'rgba(0,124,115,0.1)', color: '#007C73', border: '1px solid rgba(0,124,115,0.3)', fontFamily: 'JetBrains Mono, monospace', zIndex: 10 }}>
              MODELO CUSTOMIZADO
            </div>
          )}

          <Canvas
            frameloop="demand"
            dpr={[1, 1.5]}
            camera={{ position: [4, 2.5, 6], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
          >
            <color attach="background" args={['#ffffff']} />
            <ambientLight intensity={0.85} />
            <directionalLight
              position={[5, 8, 5]}
              intensity={1.2}
              color="#ffffff"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <directionalLight position={[-5, 4, -3]} intensity={0.4} color="#007C73" />
            <hemisphereLight args={['#ffffff', '#e5e7eb', 0.6]} />
            <CameraViewController
              preset={cameraViewPreset}
              editMode={false}
            />

            {customGlbUrl ? (
              <Suspense fallback={<Html center><div style={{ color: '#6b7280', fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', textAlign: 'center', pointerEvents: 'none' }}>Carregando modelo GLB...</div></Html>}>
                <CustomPlantGLB
                  url={customGlbUrl}
                  equipamentos={equipamentos}
                  selectedEquipId={selectedEquip?.id}
                  onSelectEquip={setSelectedEquip}
                  cameraViewPreset={cameraViewPreset}
                  isLinkMode={isLinkMode}
                  equipmentMap={equipmentMap}
                  onRequestLinkEquipment={(objectName) => {
                    setSelected3DObjectName(objectName);
                    setIsEquipmentLinkModalOpen(true);
                  }}
                  onUnlinkedObjectClick={(objectName) => {
                    toastInfo('Objeto 3D sem equipamento vinculado', objectName);
                  }}
                />
              </Suspense>
            ) : motors.length === 0 ? (
              <Html center>
                <div style={{ color: '#6b7280', fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', textAlign: 'center', pointerEvents: 'none' }}>
                  Sem equipamentos cadastrados
                </div>
              </Html>
            ) : (
              <>
                <IndustrialPlatform />
                {motors.map((equip, i) => (
                  <MotorInteractive
                    key={equip.id}
                    position={[i === 0 ? -2 : 2, -0.5, 0]}
                    label={equip.descricao}
                    color={motorColors[i]}
                    onClick={() => setSelectedEquip(equip)}
                    isSelected={selectedEquip?.id === equip.id}
                  />
                ))}
              </>
            )}

            <OrbitControls
              enabled
              enablePan={false}
              enableZoom
              enableRotate={false}
              enableDamping={false}
              minDistance={1}
              maxDistance={50}
              maxPolarAngle={Math.PI / 2.1}
              makeDefault
            />
          </Canvas>
        </div>

        {/* ── Live Panel ── */}
        <LivePanel
          selectedEquip={selectedEquip}
          equipamentos={equipamentos}
          vinculos={vinculos}
          allSensores={allSensores}
          allLogs={allLogs}
        />
      </div>

      {selectedEquip && (
        <EquipmentDetailModal
          equip={selectedEquip}
          sensors={linkedSensors}
          allLogs={allLogs}
          onClose={() => setSelectedEquip(null)}
        />
      )}

      {customGlbUrl && (
        <Modal
          open={modelAdjustModalOpen}
          onClose={closeModelAdjustModal}
          title="Ajustar modelo 3D"
          size="sm"
        >
          <div className="flex flex-col gap-4">
            <div
              className="rounded-lg overflow-hidden border"
              style={{ borderColor: '#30363D', height: 420, background: '#ffffff' }}
            >
              <Canvas
                frameloop="demand"
                dpr={[1, 1.5]}
                camera={{ position: [4, 2.5, 6], fov: 50 }}
                style={{ width: '100%', height: '100%' }}
              >
                <color attach="background" args={['#ffffff']} />
                <ambientLight intensity={0.85} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
                <directionalLight position={[-5, 4, -3]} intensity={0.4} color="#007C73" />
                <hemisphereLight args={['#ffffff', '#e5e7eb', 0.6]} />
                <CameraViewController
                  preset={cameraViewPreset}
                  editMode={modelAdjustModalOpen}
                  onSaveRef={cameraViewSaveRef}
                />
                <Suspense fallback={<Html center><div style={{ color: '#6b7280', fontSize: 13, fontFamily: 'Space Grotesk, sans-serif', textAlign: 'center', pointerEvents: 'none' }}>Carregando modelo GLB...</div></Html>}>
                  <GLBAdjustPreviewModel
                    url={customGlbUrl}
                    cameraViewPreset={cameraViewPreset}
                  />
                </Suspense>
                <OrbitControls
                  enabled
                  enablePan
                  enableZoom
                  enableRotate
                  enableDamping={false}
                  minDistance={1}
                  maxDistance={50}
                  maxPolarAngle={Math.PI}
                  makeDefault
                />
              </Canvas>
            </div>

            <div
              className="rounded-lg p-3"
              style={{ background: '#0d1117', border: '1px solid #1C2333' }}
            >
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Visualização
              </div>
              <div className="text-sm font-semibold text-gray-200" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {cameraViewPreset ? 'Posição salva' : 'Enquadramento automático'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                className="btn-primary"
                onClick={saveCameraView}
                disabled={isSavingCameraView}
              >
                <Upload size={14} className={isSavingCameraView ? 'animate-pulse' : undefined} />
                {isSavingCameraView ? 'Salvando...' : 'Salvar posição'}
              </button>
              <button
                className="btn-ghost"
                onClick={resetCameraView}
                disabled={!cameraViewPreset}
              >
                <RefreshCw size={14} />
                Resetar visualização
              </button>
              <button
                className="btn-ghost"
                onClick={resetModel}
              >
                <RefreshCw size={14} />
                Voltar ao modelo padrão
              </button>
            </div>
          </div>
        </Modal>
      )}
      <Modal
        open={is3DLinksModalOpen}
        onClose={() => setIs3DLinksModalOpen(false)}
        title="Vínculos 3D"
        size="lg"
      >
        <div className="flex flex-col gap-3">
          {linked3DEntries.length === 0 ? (
            <div
              className="rounded-lg border px-4 py-8 text-center"
              style={{ background: '#0d1117', borderColor: '#1C2333' }}
            >
              <p className="text-sm text-gray-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Nenhum vínculo 3D cadastrado.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[62vh] overflow-y-auto pr-1">
              {linked3DEntries.map(([objectName, equipId]) => {
                const equip = equipamentos.find((e) => String(e.id) === String(equipId));
                return (
                  <div
                    key={objectName}
                    className="rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    style={{ background: '#0d1117', border: '1px solid #1C2333' }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-300 truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {objectName}
                      </p>
                      <p className="text-sm font-semibold text-white truncate mt-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        {equip?.descricao ?? equipId}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveLink(objectName)}
                      className="btn-ghost flex-shrink-0 justify-center"
                      disabled={isSavingVinculo}
                      title="Remover vínculo"
                      style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.28)', cursor: isSavingVinculo ? 'not-allowed' : 'pointer' }}
                    >
                      <Unlink size={14} />
                      Remover vínculo
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modal de vinculação 3D ── */}
      <Modal
        open={isEquipmentLinkModalOpen}
        onClose={() => {
          setIsEquipmentLinkModalOpen(false);
          setSelected3DObjectName(null);
          setEquipmentSearchTerm('');
        }}
        title="Vincular objeto 3D a equipamento"
        size="md"
      >
        <div className="flex flex-col gap-4">
          {/* Grupo detectado */}
          <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Link2 size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Grupo 3D detectado</p>
              <p className="text-sm font-bold text-white font-mono" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selected3DObjectName}</p>
            </div>
          </div>

          {/* Busca */}
          <input
            value={equipmentSearchTerm}
            onChange={(e) => setEquipmentSearchTerm(e.target.value)}
            placeholder="Buscar equipamento por nome ou ID..."
            className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
            style={{
              background: '#0d1117',
              border: '1px solid #30363D',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,124,115,0.6)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#30363D'; }}
          />

          {/* Lista de equipamentos */}
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredEquipamentos.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Nenhum equipamento encontrado.
              </div>
            ) : (
              filteredEquipamentos.map((equip) => {
                const jaVinculado = Object.values(equipmentMap).includes(String(equip.id));
                return (
                  <div
                    key={String(equip.id)}
                    className="rounded-lg p-3 flex items-center justify-between gap-3"
                    style={{
                      background: jaVinculado ? 'rgba(0,124,115,0.06)' : '#0d1117',
                      border: jaVinculado ? '1px solid rgba(0,124,115,0.3)' : '1px solid #1C2333',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: equip.ativo ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)' }}
                      >
                        <Cpu size={15} style={{ color: equip.ativo ? '#22c55e' : '#6b7280' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                          {equip.descricao}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          ID: {equip.id.slice(0, 16)}…
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLink3DObjectToEquipment(String(equip.id))}
                      disabled={isSavingVinculo}
                      className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
                      style={{
                        background: jaVinculado ? 'rgba(0,124,115,0.15)' : 'rgba(0,124,115,0.12)',
                        color: jaVinculado ? '#00A89C' : '#007C73',
                        border: jaVinculado ? '1px solid rgba(0,168,156,0.35)' : '1px solid rgba(0,124,115,0.28)',
                        cursor: isSavingVinculo ? 'not-allowed' : 'pointer',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {isSavingVinculo ? 'Salvando...' : jaVinculado ? 'Reassociar' : 'Vincular'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
}
