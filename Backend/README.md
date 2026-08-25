# AndraFin Backend

Backend inicial para AndraFin usando Node.js, Express, Mongoose y MongoDB Atlas.

## Inicio rapido

1. Copia `.env.example` como `.env`.
2. Coloca tu `MONGO_URI` y `JWT_SECRET`.
3. Ejecuta:

```bash
npm install
npm run dev
```

4. Prueba:

- `http://localhost:5000/`
- `http://localhost:5000/api/health`

## Estructura

```text
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js
```

Los modelos, autenticacion JWT, movimientos, cuentas, prestamos, deudas y notificaciones se agregaran sobre esta base.
