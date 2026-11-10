# EduLead — Demo frontend

Interfaz pública de una demostración de automatización comercial educativa. Permite recorrer una conversación ficticia, visualizar el avance del prospecto y comprobar la integración con una API privada.

## Demo segura

- El canal de WhatsApp está simulado y no envía mensajes reales.
- Los identificadores y nombres utilizados por la demostración son ficticios.
- El backend, las credenciales y las automatizaciones permanecen en un repositorio privado.
- La información de la demo se elimina periódicamente.

## Tecnologías

- React
- TypeScript
- Vite
- Lucide React

La arquitectura privada utiliza FastAPI y PostgreSQL. El código de esos servicios no forma parte de este repositorio público.

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run dev
```

Configura la URL pública de la API:

```env
VITE_API_URL=https://api-demo.example.com
```

## Validación

```bash
npm run lint
npm run build
```

## Despliegue

El proyecto está preparado para Vercel. Configura `VITE_API_URL` como variable de entorno y utiliza `npm run build` con `dist` como directorio de salida.

## Privacidad

No utilices datos personales reales. Este repositorio contiene únicamente la interfaz pública de portafolio.
