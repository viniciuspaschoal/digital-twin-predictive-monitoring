# PredictDT — Frontend

Interface de monitoramento preditivo industrial (Digital Twin) para o projeto **digital-twin-predictive-monitoring**.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- React Router DOM (lazy loading)
- TanStack Query (cache + fetch)
- Axios
- Three.js + React Three Fiber + Drei (cena 3D)
- Recharts (gráficos)
- Lucide Icons

## Pré-requisitos

- Node.js 18+
- API Spring Boot rodando em `http://localhost:8080`

## Como rodar

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## ⚠️ Configurar CORS no Spring Boot

A API precisa permitir requisições do frontend. Adicione ao seu Spring:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*");
    }
}
```

## Endpoints consumidos

| Método | Endpoint |
|---|---|
| GET / POST | `/topico-mqtt` |
| GET / PUT / DELETE | `/topico-mqtt/{id}` |
| GET / POST | `/equipamento` |
| GET / PUT / DELETE | `/equipamento/{id}` |
| GET / POST | `/sensores` |
| GET / PUT / DELETE | `/sensores/{id}` |
| GET / POST | `/sensor-equipamento` |
| GET / DELETE | `/sensor-equipamento/{id}` |
| GET / POST | `/log-medida` |
| GET / DELETE | `/log-medida/{id}` |

Todos os GET de listagem usam `?page=0&size=10` (paginação Spring).

## Rotas

| Rota | Página |
|---|---|
| `/` | Dashboard com cena 3D dos motores |
| `/equipamentos` | CRUD de equipamentos |
| `/sensores` | CRUD de sensores |
| `/topicos` | CRUD de tópicos MQTT |
| `/vinculos` | Vínculo Sensor × Equipamento |
| `/monitoramento` | Gráficos de séries temporais |

## Estrutura

```
src/
├── components/
│   ├── layout/       Sidebar + Header
│   └── ui/           DataTable, Modal, ConfirmDialog, StatusBadge
├── contexts/         ToastContext (notificações)
├── layouts/          AppLayout
├── lib/              api.ts (Axios), utils.ts
├── pages/            6 páginas
├── routes/           AppRouter com lazy loading
├── services/         CRUD completo
└── types/            Interfaces TypeScript
```

## Notas

- A busca em listas é **client-side** (a API não tem parâmetro de search).
- O Dashboard exibe os **2 primeiros equipamentos** retornados pela API como motores 3D, com hotspots de sensores (temperatura/vibração/pressão).
- Logs de medição são correlacionados com sensores pelo campo `descricaoSensor`.
- Auto-refresh: 15s no Dashboard e Monitoramento.
