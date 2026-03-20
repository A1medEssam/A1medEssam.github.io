// ╔══════════════════════════════════════════════════════════════╗
// ║  AhmedOS Kernel v1.0.0                                       ║
// ║  Process Management · Scheduling · Memory · IPC              ║
// ╚══════════════════════════════════════════════════════════════╝

'use strict';

// ── EventBus (IPC) ──────────────────────────────────────────────
const EventBus = {
  _listeners: {},
  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
    return () => this.off(event, cb);
  },
  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(l => l !== cb);
  },
  emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
    (this._listeners['*'] || []).forEach(cb => cb({ event, data }));
  }
};

// ── Process States ───────────────────────────────────────────────
const ProcessState = {
  RUNNING:  'running',
  SLEEPING: 'sleeping',
  STOPPED:  'stopped',
  ZOMBIE:   'zombie',
};

// ── Process Control Block ────────────────────────────────────────
class PCB {
  constructor({ pid, name, priority = 20, memMB = 32, color = '#0A84FF' }) {
    this.pid       = pid;
    this.ppid      = 1;          // parent = init
    this.name      = name;
    this.state     = ProcessState.SLEEPING;
    this.priority  = priority;   // 0-39 like Linux nice
    this.nice      = 0;
    this.memMB     = memMB;
    this.cpuPct    = 0;
    this.color     = color;
    this.startTime = Date.now();
    this.ticks     = 0;          // scheduler ticks consumed
    this.quantum   = 0;          // current time quantum remaining
    this.syscalls  = 0;
    this.windowId  = null;
  }

  get uptimeSeconds() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  get uptimeStr() {
    const s = this.uptimeSeconds;
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  }
}

// ── Memory Manager ───────────────────────────────────────────────
class MemoryManager {
  constructor(totalMB = 4096) {
    this.totalMB  = totalMB;
    this.usedMB   = 512;    // kernel overhead
    this.segments = new Map();  // pid → segment
    this._initKernelSegments();
  }

  _initKernelSegments() {
    this.segments.set(0, { name: 'kernel',    base: 0x0000, size: 256, type: 'kernel' });
    this.segments.set(1, { name: 'init',      base: 0x1000, size: 64,  type: 'system' });
    this.segments.set(2, { name: 'wm',        base: 0x1100, size: 128, type: 'system' });
    this.segments.set(3, { name: 'scheduler', base: 0x1200, size: 64,  type: 'system' });
  }

  alloc(pid, name, sizeMB) {
    const base = 0x2000 + pid * 0x100;
    this.segments.set(pid, { name, base, size: sizeMB, type: 'user' });
    this.usedMB += sizeMB;
    return base;
  }

  free(pid) {
    const seg = this.segments.get(pid);
    if (seg && seg.type === 'user') {
      this.usedMB -= seg.size;
      this.segments.delete(pid);
    }
  }

  get freeMB()   { return this.totalMB - this.usedMB; }
  get usedPct()  { return (this.usedMB / this.totalMB * 100).toFixed(1); }

  getMap() {
    return Array.from(this.segments.entries())
      .map(([pid, seg]) => ({ pid, ...seg }))
      .sort((a, b) => a.base - b.base);
  }
}

// ── Round-Robin Scheduler ────────────────────────────────────────
class Scheduler {
  constructor() {
    this.queue     = [];       // ready queue
    this.current   = null;
    this.quantum   = 100;      // ms per time slice
    this.ticks     = 0;
    this.history   = [];       // [{pid, name, color, duration}] last 20
    this._timer    = null;
  }

  enqueue(pcb) {
    pcb.state   = ProcessState.RUNNING;
    pcb.quantum = this.quantum;
    if (!this.queue.find(p => p.pid === pcb.pid)) {
      this.queue.push(pcb);
    }
    if (!this._timer) this._start();
  }

  dequeue(pid) {
    this.queue = this.queue.filter(p => p.pid !== pid);
    if (this.current?.pid === pid) this.current = null;
    if (this.queue.length === 0 && this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _start() {
    this._timer = setInterval(() => this._tick(), this.quantum);
  }

  _tick() {
    if (this.queue.length === 0) return;
    this.ticks++;

    // rotate
    const prev = this.current;
    const idx  = prev ? (this.queue.findIndex(p => p.pid === prev.pid) + 1) % this.queue.length : 0;
    this.current = this.queue[idx] || this.queue[0];

    if (prev && prev.pid !== this.current.pid) {
      prev.cpuPct = 0;
      this.history.push({ pid: prev.pid, name: prev.name, color: prev.color, duration: this.quantum });
      if (this.history.length > 30) this.history.shift();
    }

    if (this.current) {
      this.current.ticks++;
      this.current.cpuPct = 10 + Math.random() * 25;
    }

    EventBus.emit('scheduler:tick', {
      current: this.current,
      queue:   this.queue,
      ticks:   this.ticks,
      history: this.history,
    });
  }

  getGantt() { return this.history.slice(-20); }
}

// ── Process Manager ──────────────────────────────────────────────
class ProcessManager {
  constructor() {
    this._nextPid  = 100;
    this.processes = new Map();
    this.mem       = new MemoryManager();
    this.scheduler = new Scheduler();
    this._initSystemProcesses();
  }

  _initSystemProcesses() {
    // PID 0 = swapper/idle
    const idle = new PCB({ pid: 0, name: 'swapper', priority: 39, memMB: 0, color: '#636366' });
    idle.state = ProcessState.SLEEPING;
    this.processes.set(0, idle);
    // PID 1 = init
    const init = new PCB({ pid: 1, name: 'init', priority: 20, memMB: 4, color: '#636366' });
    init.state = ProcessState.RUNNING;
    this.processes.set(1, init);
    // PID 2 = wm (window manager)
    const wm = new PCB({ pid: 2, name: 'wm', priority: 10, memMB: 64, color: '#0A84FF' });
    wm.state = ProcessState.RUNNING;
    this.processes.set(2, wm);
    this.scheduler.enqueue(wm);
    // PID 3 = scheduler daemon
    const sched = new PCB({ pid: 3, name: 'kschedule', priority: 1, memMB: 8, color: '#636366' });
    sched.state = ProcessState.RUNNING;
    this.processes.set(3, sched);
    this.scheduler.enqueue(sched);
  }

  spawn({ name, priority = 20, memMB = 64, color = '#0A84FF', windowId = null }) {
    const pid = this._nextPid++;
    const pcb = new PCB({ pid, name, priority, memMB, color });
    pcb.windowId = windowId;
    pcb.state    = ProcessState.RUNNING;
    this.processes.set(pid, pcb);
    this.mem.alloc(pid, name, memMB);
    this.scheduler.enqueue(pcb);
    EventBus.emit('process:spawn', pcb);
    // write /proc entry
    window.FS?.proc.addEntry(pid, pcb);
    return pid;
  }

  kill(pid) {
    const pcb = this.processes.get(pid);
    if (!pcb || pid < 10) return false;  // protect system procs
    pcb.state = ProcessState.ZOMBIE;
    this.scheduler.dequeue(pid);
    this.mem.free(pid);
    EventBus.emit('process:kill', { pid, name: pcb.name });
    window.FS?.proc.removeEntry(pid);
    setTimeout(() => this.processes.delete(pid), 500);
    return true;
  }

  list() {
    return Array.from(this.processes.values()).sort((a, b) => a.pid - b.pid);
  }

  get(pid) { return this.processes.get(pid); }
}

// ── Export ───────────────────────────────────────────────────────
window.EventBus      = EventBus;
window.ProcessState  = ProcessState;
window.PCB           = PCB;
window.MemoryManager = MemoryManager;
window.Scheduler     = Scheduler;
window.ProcessManager = ProcessManager;
window.Kernel = {
  version: '1.0.0',
  arch:    'x86_64-js',
  name:    'AhmedOS',
  init() {
    this.pm = new ProcessManager();
    console.log(`[kernel] AhmedOS ${this.version} initialized — ${this.pm.mem.totalMB}MB RAM`);
    return this;
  }
};
