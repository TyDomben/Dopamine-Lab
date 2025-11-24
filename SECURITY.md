# 🛡️ HOOKED - Security & Anti-Exploit Documentation

## Overview

HOOKED implements comprehensive validation and anti-exploit systems to prevent manipulation while maintaining game balance. The game is designed to be unbreakable even by players actively trying to exploit it.

> *"You can try to break it. The game knows. And it's watching."*

---

## 🔒 Validation Systems

### 1. Resource Validation

**Protects Against:** Overflow, underflow, NaN injection, Infinity exploits

```typescript
✓ Maximum resource value: 1 quadrillion (1e15)
✓ Minimum resource value: 0
✓ Maximum production rate: 1 trillion/sec
✓ NaN/Infinity detection and correction
✓ Automatic clamping on all resource operations
```

**How it works:**
- Every resource change is validated before applying
- Invalid values (NaN, Infinity, negative) are automatically corrected
- Resources are capped to prevent overflow crashes
- All arithmetic operations use safe math

**Try to break it:**
```javascript
// These all fail gracefully:
addResources({ dopamine: Infinity })        // Capped to 1e15
addResources({ dopamine: -1000000 })        // Clamped to 0
addResources({ dopamine: NaN })             // Corrected to 0
addResources({ dopamine: 1e100 })           // Capped to 1e15
```

---

### 2. Node Placement Validation

**Protects Against:** Performance death, overlap exploits, position injection

```typescript
✓ Maximum nodes: 100
✓ Minimum node spacing: 50px
✓ Canvas boundaries: -1000 to 5000 (x,y)
✓ Position validation (no NaN/Infinity)
✓ Overlap detection
```

**How it works:**
- Node count is hard-capped at 100
- Positions are validated and clamped to canvas bounds
- Overlapping nodes are rejected
- Invalid positions default to (0,0)

**Try to break it:**
```javascript
// These all fail:
addNode({ x: Infinity, y: 0 })              // Clamped to max bounds
addNode({ x: 100, y: 100 }) // x 101        // Rejected (max nodes)
addNode({ x: 100, y: 100 }) // duplicate    // Rejected (too close)
```

---

### 3. Connection Validation

**Protects Against:** Infinite loops, circular dependency crashes, connection spam

```typescript
✓ Maximum total connections: 300
✓ Maximum connections per node: 10
✓ Maximum circuit depth: 20
✓ Maximum feedback loops: 5
✓ No self-loops allowed
✓ No duplicate connections
```

**How it works:**
- Connections are validated before creation
- Circuit depth is calculated to prevent infinite recursion
- Feedback loops are counted and limited
- Self-connections are blocked
- Duplicate connections are rejected

**Try to break it:**
```javascript
// These all fail:
connectNodes(nodeA, nodeA)                  // Rejected (self-loop)
connectNodes(nodeA, nodeB) // x2            // Rejected (duplicate)
// Deep chain exploit                       // Rejected (max depth: 20)
// Circular dependencies x 6                // Rejected (max loops: 5)
```

---

### 4. Rate Limiting

**Protects Against:** Autoclickers, spam bots, rapid-fire exploits

```typescript
✓ Maximum clicks/sec: 20
✓ Maximum node placements/sec: 5
✓ Maximum unlocks/sec: 3
✓ Action throttling per type
✓ Suspicious APM detection (>120)
```

**How it works:**
- Each action type is independently rate-limited
- Timestamps are tracked for sliding window detection
- Exceeding limits triggers anti-cheat warnings
- Actions beyond limit are silently dropped

**Try to break it:**
```javascript
// Autoclicker at 100 clicks/sec
// Result: Only 20/sec processed, flagged as suspicious

// Rapid node spam
// Result: Capped at 5/sec, cheat score increases
```

---

### 5. Time Manipulation Protection

**Protects Against:** Time warping, system clock exploits, offline time abuse

```typescript
✓ Maximum delta time: 1000ms (1 second)
✓ Maximum offline time: 24 hours
✓ Delta time validation (no negative/NaN)
✓ Tab switching protection
```

**How it works:**
- Delta time is capped on every tick
- Large jumps (system clock changes) are rejected
- Offline time calculations are capped
- Negative time is corrected to 0

**Try to break it:**
```javascript
// Change system clock +1 year forward
// Result: Delta time capped at 1000ms per tick

// Leave tab for 1 week
// Result: Only 24 hours of idle gains processed
```

---

### 6. Prestige Validation

**Protects Against:** Prestige spam, multiplier exploits, exponential overflow

```typescript
✓ Minimum prestige interval: 5 seconds
✓ Maximum prestige level: 1000
✓ Maximum multiplier: 1 million (1e6)
✓ Resource validation before prestige
✓ Multiplier growth capping
```

**How it works:**
- Prestige cooldown prevents rapid spam
- Multipliers are capped to prevent exponential explosion
- Invalid states block prestige
- All values validated after reset

**Try to break it:**
```javascript
// Spam prestige button
// Result: Cooldown enforced (5sec minimum)

// Prestige 1001 times
// Result: Capped at level 1000

// Multiplier exploit
// Result: All multipliers capped at 1e6
```

---

### 7. Anti-Cheat Detection

**Protects Against:** Save file tampering, console exploits, memory editing

```typescript
✓ Cheat score tracking
✓ Suspicious activity logging
✓ Pattern detection
✓ Save file validation
✓ State integrity checks
```

**How it works:**
- Suspicious actions increase a "cheat score"
- High scores trigger warnings
- Save files are validated on load
- Invalid states are corrected
- Extreme cheating is logged

**Detection triggers:**
- APM > 120
- Rate limit violations
- Prestige spam
- Save file tampering
- Invalid resource values
- Impossible game states

**What happens:**
```
Cheat Score  0-10:  Silent correction
Cheat Score 11-20:  Console warnings
Cheat Score  20+:   Flagged as "likely cheating"
```

> **Note:** The game doesn't ban or punish. It just makes sure you can't break it. This is about robustness, not enforcement.

---

## 🧪 Exploit Testing

### Tested Attack Vectors

✅ **Resource Injection**
- Console commands: `state.resources.dopamine = Infinity`
- Browser DevTools memory editing
- Save file JSON manipulation

✅ **Time Manipulation**
- System clock changes
- Browser time zone exploits
- Tab unfocus/focus timing

✅ **Performance Attacks**
- Spawning 10,000 nodes
- Creating circular dependency hell
- Particle system spam

✅ **Rate Limit Bypasses**
- Autoclickers (up to 1000 clicks/sec)
- Rapid API calls
- Event flooding

✅ **Save File Tampering**
- JSON injection
- Invalid state loading
- Corrupted data recovery

### Test Results

```
✓ All exploits fail gracefully
✓ Game remains stable under attack
✓ No crashes or hangs
✓ Performance degradation handled
✓ Invalid states auto-corrected
```

---

## 📊 Performance Limits

### Why These Limits?

**Technical Constraints:**
```
100 nodes       = ~60 FPS on low-end hardware
300 connections = Reasonable O(n²) complexity
50 particles    = Smooth animations even mobile
```

**Balance Constraints:**
```
1e15 resources     = Readable numbers in scientific notation
1e6 multipliers    = Prevents exponential runaway
20 circuit depth   = Manageable complexity
5 feedback loops   = Interesting without chaos
```

---

## 🔍 Validation Flow

Every action goes through multiple validation layers:

```
User Action
    ↓
[Rate Limiter] ────────────────> Rejected if too fast
    ↓
[Input Validation] ────────────> Sanitized/corrected
    ↓
[Business Logic] ──────────────> Game rules applied
    ↓
[State Reducer] ───────────────> State updated
    ↓
[Final Validation] ────────────> Safety net check
    ↓
[Anti-Cheat Scan] ─────────────> Suspicious activity logged
    ↓
New State
```

---

## 🎯 Design Philosophy

### Why Be Unbreakable?

1. **Respect for Players**
   - Smart players will try to break it
   - Breaking should be part of the challenge
   - The game should survive their attempts

2. **Meta-Commentary**
   - "You can see the manipulation and still can't escape"
   - Extend this to: "You can try to break it and still can't"
   - Knowledge != Power (in this case)

3. **Technical Excellence**
   - Robust code is good code
   - Validation is not overhead, it's design
   - Every edge case handled

4. **Educational Value**
   - Shows how to build resilient systems
   - Demonstrates defense-in-depth
   - Validation as first-class feature

---

## 🛠️ For Developers

### Adding New Features

When adding new game mechanics, follow these patterns:

```typescript
case 'NEW_ACTION': {
  // 1. Rate limiting
  if (!rateLimiter.canPerformAction('ACTION_NAME', MAX_PER_SEC)) {
    antiCheat.reportSuspiciousActivity('ACTION_SPAM', severity);
    return state;
  }

  // 2. Input validation
  const validated = validateInput(action.payload);

  // 3. Boundary checks
  if (state.someArray.length >= LIMITS.MAX_ITEMS) {
    console.warn('[LIMIT] Maximum items reached');
    return state;
  }

  // 4. Business logic
  const newValue = calculateNewValue(validated);

  // 5. Resource validation
  const validatedResources = validateResources(newResources);

  // 6. Return new state
  return {
    ...state,
    someValue: newValue,
    resources: validatedResources,
  };
}
```

### Testing for Exploits

```typescript
// Test suite should include:
✓ Boundary value tests (0, max, max+1)
✓ Invalid input tests (NaN, Infinity, negative)
✓ Rate limit tests (rapid-fire actions)
✓ State corruption tests (invalid JSON)
✓ Performance tests (max nodes/connections)
```

---

## 🎮 For Players

### Can You Break It?

**Go ahead. Try.**

The game expects you to:
- Use browser DevTools
- Edit save files
- Write autoclickers
- Manipulate system time
- Inject resources
- Create impossible states

**What will happen:**
- Your actions will be logged
- Invalid states will be corrected
- You'll see warnings in console
- The game will keep running
- You might get flagged

**But the game won't:**
- Crash
- Hang
- Give you infinite resources
- Let you break progression
- Punish you (it's not that kind of game)

---

## 🧠 The Meta-Joke

**The ultimate irony:**

You can see every psychological trick the game uses.
You can see every validation and anti-cheat measure.
You know *exactly* how it's designed to hook you.
You even know the limits and boundaries.

**And you still can't break it.**

Just like you can see the manipulation and still get manipulated...
You can see the protections and still can't bypass them.

Knowledge isn't power. Not here.

**That's the point.**

---

## 📝 Change Log

### v1.0.0 - Initial Anti-Exploit System

- Resource validation and clamping
- Node placement limits and validation
- Connection validation and circuit depth limits
- Rate limiting system
- Time manipulation protection
- Prestige validation
- Anti-cheat detection system
- Comprehensive state validation
- Save file integrity checks

---

## 🤝 Responsible Disclosure

If you find a way to break the game that bypasses all these systems:

1. **We're impressed.** Seriously.
2. Open an issue with details
3. Include reproduction steps
4. Tag it [EXPLOIT]

We'll fix it, credit you, and probably add more layers.

This is an arms race we're prepared to lose gracefully.

---

*"The game is both unbreakable and completely transparent about being unbreakable. Knowledge still isn't immunity."*

**Made with paranoia and 🛡️**
