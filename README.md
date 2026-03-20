# AhmedOS v1.0.0

> A simulated Unix-like operating system built as a browser application — real OS architecture, real concepts, running on V8.

**[Live Demo →](https://A1medEssam.github.io)**

---

## What is this?

AhmedOS is a fully functional portfolio OS simulator built from scratch. It implements real operating system concepts — not cosmetically, but architecturally. Every window is a process. Every file lives in an inode-based virtual filesystem. A round-robin scheduler runs continuously, allocating time slices and maintaining a Gantt chart. Memory is tracked per-segment with a live memory map.

The OS is also the portfolio. Open a terminal, navigate the filesystem, read the README files, launch apps. This is not a portfolio that *looks like* an OS — it's an OS that *contains* a portfolio.

---

## Architecture

```
AhmedOS/
├── index.html      ← Boot sequence, login, desktop, window manager
├── kernel.js       ← ProcessManager, Scheduler, MemoryManager, EventBus
├── fs.js           ← VirtualFileSystem (/proc, /home, /bin, /etc)
├── shell.js        ← Shell interpreter (bash-compatible)
└── apps/
    └── apps.js     ← Application registry (Terminal, Finder, NILE, Activity Monitor...)
```

### Kernel (`kernel.js`)

The kernel implements four core subsystems:

**EventBus** — publish/subscribe IPC between all system components. Windows communicate with each other and with the kernel through typed events (`process:spawn`, `process:kill`, `scheduler:tick`, `window:close`). This is the same pattern as Linux's notification chains.

**ProcessManager** — every application window spawns a real process with a full Process Control Block (PCB): PID, PPID, priority (0–39, Linux-compatible nice values), memory allocation, CPU%, state machine (RUNNING → SLEEPING → ZOMBIE), and uptime. System processes (swapper PID 0, init PID 1, wm PID 2, kschedule PID 3) are pre-initialized at boot.

**Scheduler** — pure round-robin with configurable time quanta (default 100ms). Maintains a ready queue, performs context switches on each tick, records a Gantt history of the last 30 time slices. The Activity Monitor visualizes this in real time.

**MemoryManager** — 4096MB virtual address space divided into segments (kernel, system, user). Each process gets an allocated segment at spawn; segments are freed on kill. Tracks used/free MB and exposes a segment map for the memory visualization.

### Virtual Filesystem (`fs.js`)

Inode-based VFS modeled after Linux's ext4. Every file and directory is an `Inode` with name, type, permissions (Unix octal), owner, mtime, and content.

```
/
├── proc/               ← Live: reads from running kernel
│   ├── cpuinfo         ← Virtual CPU info
│   ├── meminfo         ← Live memory stats
│   ├── uptime          ← Seconds since boot
│   ├── version         ← Kernel version string
│   └── [pid]/          ← Per-process: status, cmdline, maps
│       ├── status
│       ├── cmdline
│       └── maps
├── bin/                ← All shell commands as executable inodes
├── etc/
│   ├── hostname
│   ├── os-release
│   ├── passwd
│   └── motd
└── home/
    └── ahmed/
        ├── about.txt
        ├── story.txt
        ├── .bashrc
        ├── .profile
        └── projects/
            ├── NILE/           ← Graduation project (VR museum)
            ├── AraSQL/         ← Arabic NL→SQL translator
            ├── arabic-memes/   ← EMNLP 2025 paper
            ├── pix2pix-ascii/  ← GAN-based ASCII art
            ├── gesture-ai/     ← Gesture-controlled PowerPoint
            ├── web-rag/        ← Arabic NLP RAG pipeline
            └── blockchain-sc/  ← Decentralized supply chain DApp
```

The `/proc` filesystem is **live** — reading `/proc/meminfo` returns current kernel memory stats, and `/proc/[pid]/status` returns the actual PCB fields of that running process.

### Shell (`shell.js`)

A bash-compatible interpreter with:
- Tokenizer supporting quoted strings and `$VAR` expansion
- Full `ls -la`, `cd`, `cat`, `ps aux`, `top`, `kill`, `uname -a`, `free`, `uptime`
- `man` with real manual pages (including `man ahmed`)
- `neofetch` with live system stats
- `open [app]` launches any application window
- `./NILE/run.sh` executes shell scripts (parses `open` commands inside)
- Command history with ↑↓ navigation
- `export` / `env` for environment variable management

---

## Shell Commands Reference

```bash
# Navigation
ls -la /home/ahmed/projects/    # long listing with permissions
cd NILE && cat README.md        # navigate and read
cat /proc/meminfo               # live memory stats
cat /proc/1/status              # init process PCB
cat /etc/motd                   # message of the day

# Process management
ps aux                          # all processes with CPU%/MEM/STATE
top                             # opens Activity Monitor
kill 104                        # terminate process by PID

# System info
uname -a                        # full system string
free                            # memory table
uptime                          # boot time + load average
neofetch                        # system + ASCII art

# Launch apps
open about                      # About Ahmed
open nile                       # NILE flagship project
open projects                   # project grid (Finder)
open activity                   # Activity Monitor
open research                   # research threads
open connect                    # all social links

# The easter egg
man ahmed                       # manual page for Ahmed Essam
```

---

## Applications

| App | Description |
|-----|-------------|
| **Terminal** | Full shell interpreter, command history, tab-navigable |
| **Finder** | Project grid — click NILE to open the flagship window |
| **NILE** | Dedicated window for the graduation project with pharaonic theme |
| **Activity Monitor** | Live Gantt chart, process table with CPU/MEM, memory segment map |
| **About** | Personal bio, education, languages |
| **Research** | Active research threads with tags |
| **Stack** | Full technology stack with highlighted core skills |
| **Connect** | Email, GitHub, X/Twitter, Medium, Kaggle, LinkedIn |

---

## Boot Sequence

1. **BIOS POST** — hardware detection, memory test, bootloader selection
2. **Kernel loading** — decompression, base address assignment
3. **Kernel init** — ProcessManager, MemoryManager, Scheduler, EventBus, VFS
4. **System processes** — swapper (PID 0), init (PID 1), wm (PID 2), kschedule (PID 3)
5. **Login manager** — username/password prompt (any input works)
6. **Desktop** — window manager, dock, menubar, Spotlight (Cmd/Ctrl+K)

---

## Technologies

| Layer | Technologies |
|-------|-------------|
| **OS Architecture** | Process scheduling (round-robin), Virtual filesystem (inode-based), Memory management (segmentation), IPC (pub/sub EventBus) |
| **Frontend** | Vanilla JavaScript (ES2020), HTML5 Canvas, CSS3 (backdrop-filter, variables, animations) |
| **Rendering** | Apple-style dark UI, frosted glass (backdrop-filter blur + saturate), spring animations |
| **Audio** | Web Audio API — synthesized sounds (no audio files), AudioContext oscillators |
| **Persistence** | localStorage session restore across page reloads |
| **Performance** | RAF animation loop, canvas dot-grid, SVG logo watermark |

---

## Design

The visual direction is **Apple macOS dark mode** — the most refined desktop aesthetic available:

- **Colors**: Pure black `#000` base, `rgba(30,30,35,0.96)` window surfaces, `#0A84FF` accent (Apple Blue), `#BF5AF2` secondary (Apple Purple)
- **Typography**: System font stack (`-apple-system`, `SF Pro Display`) for UI; `JetBrains Mono` for terminal
- **Windows**: `backdrop-filter: blur(24px) saturate(180%)` frosted glass, 14px border radius, traffic light buttons (🔴🟡🟢)
- **Dock**: Spring animation `cubic-bezier(.34,1.2,.64,1)`, tooltip on hover, running-process indicator dot
- **Logo**: Geometric A/pyramid monogram — the A doubles as a pyramid (Egyptian heritage), dashed crossbar (data/code), neural nodes at vertices, E-mark from three horizontal bars (initials AE)

---

## OS Concepts Demonstrated

This project demonstrates the following OS concepts studied at E-JUST:

- **Process management** — PCB structure, process states, spawn/kill/zombie lifecycle
- **CPU scheduling** — Round-robin with time quanta, ready queue management, context switch simulation, Gantt visualization
- **Memory management** — Segmented address space, allocation/deallocation, free list tracking, memory map visualization
- **Virtual filesystem** — Inode abstraction, path resolution, directory traversal, `/proc` dynamic filesystem
- **IPC** — Event-driven publish/subscribe, decoupled component communication
- **Shell** — Command parsing, tokenization, environment variables, process execution, built-in vs external commands
- **Boot process** — POST simulation, bootloader, kernel initialization, init system, login manager

---

## Running Locally

No build step. No dependencies.

```bash
git clone https://github.com/A1medEssam/A1medEssamV8.github.io
cd A1medEssamV8.github.io
# Serve with any static file server
python3 -m http.server 8080
# open http://localhost:8080
```

Or just visit the [live demo](https://A1medEssam.github.io).

---

## Project Context

AhmedOS was built as a portfolio presentation layer for Ahmed Essam's work in AI, NLP, and intelligent systems. It demonstrates OS-level systems thinking applied to a frontend context — the same architectural concepts (scheduling, IPC, VFS, memory management) implemented in JavaScript running on V8, the same way those concepts would be implemented in C on bare metal, just with the browser as the hardware abstraction layer.

---

## Author

**Ahmed Essam**  
NLP & Intelligent Systems Engineer  
E-JUST · AI & Data Science · BSc. 2025  
New Cairo, Egypt

[GitHub](https://github.com/A1medEssam) · [Email](mailto:ahmed.essam1418@gmail.com) · [LinkedIn](https://linkedin.com/in/a1medessam)
