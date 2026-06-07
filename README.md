# Pixel Tanks

Juego de tanques programables con estética pixel, simulación por turnos y audio retro hecho con Web Audio API.

## Resumen

Cada tanque ejecuta un programa propio por turnos. El objetivo es sobrevivir, destruir oponentes y sumar más puntos al final de la partida. La interfaz está pensada para editar estrategias, ajustar reglas de juego y ejecutar simulaciones tanto rápidas como configuradas a mano.

## Requisitos

- Node.js 18 o superior.
- npm.

## Instalación y ejecución

```bash
npm install
```

### Modo desarrollo (Web)

```bash
npm run dev
```

Arranca Vite con recarga en caliente para desarrollar la interfaz y probar cambios de forma inmediata.

### Modo desarrollo (Escritorio - Tauri)

```bash
npm run tauri dev
```

---

## Compilación para Escritorio (Tauri v2)

Puedes compilar la aplicación para usarla de forma nativa en tu sistema operativo sin depender del navegador.

### Requisitos previos (Solo Linux/Ubuntu/Kubuntu)
Para poder compilar y ejecutar el motor Webview y los códecs de audio del juego en Linux, instala primero las dependencias del sistema:

```bash
sudo apt update
sudo apt install -y build-essential curl wget file libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-libav
```

### Comando de compilación
Una vez cumplidos los requisitos, ejecuta:

```bash
npm run tauri build
```

*   **En Windows**: Generará un instalador `.msi` y un ejecutable `.exe` independiente en la carpeta `src-tauri/target/release/bundle/msi/`.
*   **En Linux**: Generará un ejecutable portable `.AppImage` y un instalador `.deb` en la carpeta `src-tauri/target/release/bundle/appimage/` y `src-tauri/target/release/bundle/deb/` respectivamente.

---

### Producción local (Web)

```bash
npm run build
npm run preview
```

`npm run build` genera la compilación optimizada. `npm run preview` sirve esa compilación como si fuera producción para validar el resultado final.

## Scripts disponibles

- `npm run dev`: arranca Vite en modo desarrollo.
- `npm run build`: compila TypeScript y genera la versión de producción.
- `npm run preview`: prueba la compilación localmente.
- `npm run lint`: ejecuta ESLint sobre el proyecto.

## Cómo se juega

1. Entra al menú principal y elige `Configuración`, `Programar estrategia` o `Partida rápida`.
2. Ajusta la cantidad de tanques, el tamaño del tablero, el límite de líneas pasivas, las bombas, las minas y la cantidad máxima de rondas.
3. Abre el editor de programas y arma la secuencia de comandos para cada tanque.
4. Inicia la simulación y mira cómo el motor resuelve los turnos automáticamente.
5. Al finalizar, el juego calcula el puntaje total y declara un ganador.

## Funcionalidades

- Menú principal con acceso a configuración, tutorial, créditos, programación y partida rápida.
- Configuración de partida con opciones para:
  - Número de tanques.
  - Tamaño del tablero.
  - Límite de líneas pasivas.
  - Rondas máximas.
  - Bombas y minas por tanque.
  - Tamaño de letra de la interfaz.
  - Volumen base.
- Editor visual para cargar, reordenar y limpiar programas por tanque.
- Simulación automática por turnos con:
  - colisiones contra borde, pared y otros tanques,
  - minas y bombas,
  - estaciones de reparación que curan y se reubican,
  - puntuación por eliminaciones y salud final,
  - final de partida con ganador.
- Interfaz pixel art con paneles, barras, iconos y efectos animados.
- Sonidos y música 8-bit generados con Web Audio API.

## Comandos del juego

La programación usa estos comandos:

| Comando | Descripción |
| --- | --- |
| `MOVER` | Avanza una casilla en N, S, E u O. |
| `DISPARAR` | Ataca en línea recta y daña al primer objetivo que encuentre. |
| `COLOCAR_MINA` | Deja una mina en la casilla actual. |
| `BOMBA` | Ejecuta un ataque radial a distancia configurable. |
| `RAD` | Lee información de la dirección seleccionada y guarda el resultado en un registro. |
| `IF` | Evalúa una condición y, si falla, salta la siguiente instrucción. |
| `ESPERA` | No ejecuta acción, útil para controlar el orden o consumir turno. |

### Registros y condiciones

- Registros disponibles: `RAD`, `RAD_DIR`, `DANO_DIR`, `DIR_MOV`, `SALUD`.
- Condiciones: `TRUE`, `REGISTER_COMPARE`, `DAÑO`, `DIR_MOV_EQ`.

### Efectos de juego

- Vida inicial: `100`.
- Colisión contra borde, pared u otro tanque: `-10`.
- Disparo: daño instantáneo de `-20`.
- Mina: daño de `-40`.
- Bomba: daño radial con reducción por zona.
- Estación de reparación: cura `10` puntos y puede moverse cada 5 rondas.
- Eliminar objetivos aporta recuperación y puntuación extra.

## Audio y música

La carpeta [public/music](public/music) contiene las pistas usadas por la app:

- `Menu.mp3`
- `otras_pantallas.mp3`
- `programar_sad.mp3`
- `programar_happy_ganar.mp3`
- `jugar_1.mp3`
- `jugar_2.mp3`
- `jugar_3.mp3`

Durante la partida se rotan aleatoriamente `jugar_1`, `jugar_2` y `jugar_3`. Cuando la partida termina y hay ganador, la música de victoria usa `programar_happy_ganar.mp3`.

## Créditos de música

- "42 Monster RPG 2 music tracks" de Nooskewl Games, publicado en OpenGameArt. El propio autor pide un shout-out si se usan sus obras.
- "5 Chiptunes Action" de Juhani Junkala, publicado en OpenGameArt bajo licencia CC0.

## Estructura principal

- `src/main.tsx`: punto de entrada de React.
- `src/App.tsx`: coordina pantallas, navegación, estado global y audio.
- `src/audio.ts`: motor de sonido y música.
- `src/game-core/`: motor de simulación, tipos, utilidades y configuración inicial.
- `src/app/screens/`: pantallas de menú, configuración, tutorial, créditos y editor.
- `src/components/`: componentes reutilizables de la interfaz.

## Notas

- La app guarda localmente el tamaño de letra y el volumen base.
- El volumen base se calibra internamente para que la música no quede demasiado alta.
- La versión de producción se obtiene con `npm run build` y se prueba con `npm run preview`.
