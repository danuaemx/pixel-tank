# Pixel Tank Arena (React + TypeScript)

Juego de tanques programables con estilo pixel, audio 8-bit y simulación automática por turnos.

## Ejecutar

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run build
```

## Funcionalidades implementadas

- Menú principal con acceso a `Tutorial`, `Configuración`, `Programar estrategia` y `Partida rápida (default)`.
- Configuración personalizable:
  - Número de tanques: `2` a `6`.
  - Tamaño de tablero: `6x6` a `15x15`.
  - Líneas pasivas permitidas por turno.
- Editor drag-and-drop de estrategias por tanque.
- Motor de comandos:
  - `MOVER(DIR)`
  - `DISPARAR(DIR)`
  - `COLOCAR_MINA`
  - `BOMBA(DIR,DIST)`
  - `RAD(DIR)`
  - `IF(COND)`
  - `ESPERA`
  - `LABEL`
  - `JUMP[COND,LABEL]`
- Registros por tanque:
  - `RAD`
  - `DAÑO_DIR`
  - `DIR_MOV`
  - `SALUD`
- Reglas principales:
  - Vida inicial: `100`.
  - Minas: `3` por tanque, daño `-40`.
  - Bombas: `2` por tanque, daño `-30` en 3x3 y `-15` residual alrededor.
  - Disparo ilimitado, daño `-20` instantáneo en el turno.
  - Colisiones (borde/pared/tanque): `-10`.
  - Estaciones de reparación: curan y se reubican cada 5 rondas.
  - Puntuación por eliminaciones y salud final, con bonus de eficiencia para código más corto.
- Animaciones visuales para disparo, explosión, impacto, curación y minas.
- Sonidos y música 8-bit generados con Web Audio API.
