# Socket Events

## Client → Server

### create-room

```json
{
  "playerName": "Ali"
}
```

Creates a new room.

---

### join-room

```json
{
  "roomCode": "ABC123",
  "playerName": "Ali"
}
```

Joins an existing room.

---

### leave-room

```json
{
  "roomCode": "ABC123"
}
```

Leaves the room.

---

### start-game

```json
{}
```

Host starts the game.

---

### play-card

```json
{
  "card": {
    "suit": "clubs",
    "rank": "A"
  }
}
```

Player plays one card.

---

### disconnect

Automatically emitted by Socket.IO.

---

## Server → Client

### room-created

```json
{
  "roomCode": "ABC123"
}
```

---

### player-joined

```json
{
  "player": {}
}
```

---

### player-left

```json
{
  "playerId": "..."
}
```

---

### game-started

```json
{
  "gameState": {}
}
```

---

### turn-changed

```json
{
  "playerId": "..."
}
```

---

### card-played

```json
{
  "playerId": "...",
  "card": {}
}
```

---

### trick-ended

```json
{
  "winnerId": "..."
}
```

---

### game-ended

```json
{
  "winnerId": "...",
  "bhabhiId": "..."
}
```

---

### error

```json
{
  "message": "..."
}
```