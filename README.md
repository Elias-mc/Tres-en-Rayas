# ⭕ Tres en Raya — Multijugador en Tiempo Real

<div align="center">

<img width="1735" height="801" alt="image" src="https://github.com/user-attachments/assets/529b4c84-42c2-4d2b-bfce-50f32df6aa16" />


**Juego de Tres en Raya (Tic-Tac-Toe) multijugador online construido con Node.js + Socket.io**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.3-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

[🚀 Demo en vivo](#) · [Reportar un bug](../../issues) · [Ver código fuente](./server.js)

</div>

---

## 📋 Tabla de contenidos

- [Sobre el proyecto](#-sobre-el-proyecto)
- [Características](#-características)
- [Tech Stack](#-tech-stack)
- [Cómo funciona](#-cómo-funciona)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Primeros pasos](#-primeros-pasos)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts disponibles](#-scripts-disponibles)
- [Lógica del juego](#-lógica-del-juego)
- [Eventos Socket.io](#-eventos-socketio)
- [Contacto](#-contacto)

---

## 🚀 Sobre el proyecto

Tres en Raya online en tiempo real donde dos jugadores se enfrentan desde distintos navegadores o dispositivos. Uno crea la sala y comparte el **código único de 6 caracteres**; el otro lo ingresa y la partida comienza al instante.

Toda la lógica del juego (turnos, validación de movimientos, detección de ganador y empate) vive en el **servidor**, evitando cualquier posibilidad de trampa desde el cliente. El frontend es HTML + CSS + JavaScript vanilla — sin frameworks, sin bundlers.

---

## ✨ Características

- **Salas privadas** con código único de 6 caracteres generado aleatoriamente
- **Máximo 2 jugadores** por sala — el servidor rechaza intentos de unirse a salas llenas
- **Asignación automática de símbolo** — el creador es `X`, el segundo jugador es `O`
- **Sistema de turnos validado en el servidor** — movimientos fuera de turno son ignorados
- **Detección de ganador** — verifica las 8 combinaciones ganadoras posibles
- **Detección de empate** — cuando todas las casillas están ocupadas sin ganador
- **Limpieza automática de salas** — la sala se elimina al terminar la partida o al desconectarse un jugador
- **Connection state recovery** — Socket.io recupera la conexión ante caídas momentáneas

---

## 🛠 Tech Stack

| Tecnología | Rol |
|-----------|-----|
| **Node.js** | Runtime del servidor |
| **Express** | Servidor HTTP y servicio del cliente |
| **Socket.io 4** | WebSockets: comunicación en tiempo real y gestión de salas |
| **Morgan** | Logger de requests HTTP en desarrollo |
| **dotenv** | Gestión de variables de entorno |
| **JavaScript ES6+** | Lógica del cliente y del servidor (módulos, eventos, DOM) |
| **HTML5 / CSS3** | Interfaz del juego sin frameworks |

---

## ⚙️ Cómo funciona

```
Jugador 1 (X)                    Servidor                   Jugador 2 (O)
     │                               │                              │
     │── emit("create room") ───────►│ genera código, rooms[code]   │
     │◄─ emit("room created", code) ─│                              │
     │◄─ emit("game symbol", "X") ───│                              │
     │                               │◄── emit("join room", code) ──│
     │                               │─── emit("game symbol", "O") ►│
     │◄─ emit("start game") ─────────│──── emit("start game") ──────►│
     │◄─ emit("game update") ────────│──── emit("game update") ──────►│
     │                               │                              │
     │── emit("move", {index}) ─────►│ valida turno y casilla       │
     │◄─ emit("game update") ────────│──── emit("game update") ──────►│
     │                               │                              │
     │         ... turnos alternos ...                              │
     │                               │                              │
     │◄─ emit("game winner", "X") ───│──── emit("game winner") ──────►│
     │                          delete rooms[code]                  │
```

---

## 📁 Estructura del proyecto

```
Tres-en-Raya/
├── client/
│   └── index.html        # Frontend completo (HTML + CSS + JS en un solo archivo)
├── server.js             # Servidor Express + Socket.io + lógica del juego
├── .env                  # Variables de entorno (no se sube al repo)
├── .env.example          # Plantilla de variables de entorno
├── package.json
└── README.md
```

---

## 🏁 Primeros pasos

### Prerrequisitos

- Node.js `>= 18`
- npm

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Elias-mc/Chat-Virtual.git

# 2. Entrar al directorio
cd Tres-en-Raya

# 3. Instalar dependencias
npm install

# 4. Crear el archivo de entorno
cp .env.example .env

# 5. Iniciar el servidor
npm start
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

> 💡 Para jugar contra vos mismo abrí la misma URL en **dos pestañas o dos navegadores distintos**.

---

## 🔑 Variables de entorno

Creá un archivo `.env` en la raíz:

```env
PORT=3000
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto en el que corre el servidor | `3000` |

---

## 📜 Scripts disponibles

```bash
npm start      # Inicia el servidor en producción
npm run dev    # Inicia con nodemon (hot reload en desarrollo)
```

---

## 🧠 Lógica del juego

Toda la lógica crítica está en el servidor para garantizar integridad:

### Estado de la sala

```js
rooms[roomCode] = {
  board: Array(9).fill(null), // tablero 3x3 aplanado
  turn: 'X',                  // símbolo del turno actual
  players: 1,                 // cantidad de jugadores conectados
}
```

### Validaciones en cada movimiento

1. **¿Existe la sala?** → si no, ignora el evento
2. **¿Es el turno del jugador?** → compara `socket.data.symbol` con `room.turn`
3. **¿Está libre la casilla?** → verifica `room.board[index]`
4. **Coloca la ficha** → actualiza `room.board[index]`
5. **¿Hay ganador?** → recorre las 8 combinaciones ganadoras
6. **¿Hay empate?** → verifica que todas las casillas estén ocupadas
7. **Cambia el turno** → alterna entre `X` y `O`

### Combinaciones ganadoras

```js
const wins = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // filas
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columnas
  [0, 4, 8], [2, 4, 6],             // diagonales
];
```

---

## 📡 Eventos Socket.io

### Cliente → Servidor

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `create room` | `{ username }` | Crea una nueva sala privada |
| `join room` | `{ username, roomCode }` | Intenta unirse a una sala existente |
| `move` | `{ index, roomCode }` | Registra un movimiento en el tablero |

### Servidor → Cliente

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `room created` | `string (code)` | Confirmación de sala creada o unida |
| `room error` | `string (msg)` | Error: sala inexistente o llena |
| `game symbol` | `"X"` \| `"O"` | Símbolo asignado al jugador |
| `start game` | — | La partida empieza (dos jugadores listos) |
| `game update` | `{ board, turn }` | Estado actualizado del tablero y turno |
| `game winner` | `"X"` \| `"O"` | Símbolo del jugador ganador |
| `game draw` | — | La partida terminó en empate |

---

## 📬 Contacto

**Elias Macay**

- 💼 LinkedIn: [linkedin.com/in/elias-macay-b02753386](https://www.linkedin.com/in/elias-macay-b02753386/)
- 🐙 GitHub: [@Elias-mc](https://github.com/Elias-mc)
- 📧 Email: macayzamora1234@gmail.com
- 📍 Buenos Aires, Argentina

---

<div align="center">

Hecho con ❤️ por [Elias Macay](https://github.com/Elias-mc) — 2026

</div>
