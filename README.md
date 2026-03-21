# AhmedOS - AOS

> *The V8 sounds best in a classy car. This is the eighth build, and the one that finally runs.*<br>
> A simulated Unix-like operating system built as a browser application — real OS architecture, real concepts, running on V8.

**[Live Demo →](https://A1medEssam.github.io)**

---

## What is this?

Nobody writes an OS for fun. You write it because something broke in your head the day you realized that "running a program" is not what you thought it was — that there's a whole conversation happening underneath, between software and metal, and you weren't part of it yet.

Most of what I build lives high up the stack - LLMs, multimodal systems, spatial computing. I work close to the top of the stack, mostly. But at some point the question got louder: what's actually down there? What decides which process runs right now? What turns a filesystem into magnetism and back again? Who's managing the metal?

Before this there were smaller projects — each one a test of one concept. A scheduler here. A memory thing there. Some work. Some don't, and I left them on GitHub exactly as they were because that's what learning actually looks like. Cleaning them up would be lying.

AhmedOS is where it all became one thing. First complete attempt. Real scheduler, real VFS, real shell, real memory manager. Also my portfolio — every window is a process, every project lives in an inode, the terminal navigates a real filesystem. Open a terminal, navigate the filesystem, read the README files, launch apps.

It's a demo version, and  there's a next-generation version being planned. The gap is closing.

> One another thing: I would like to acknowledge four key references, which I learned a great deal about operating systems, computer organization and design, and paralel & distributing computing. These are listed in the [Resources](#References) section.

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
- `./NILE/run.sh` executes shell scripts
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
| **Terminal** | Full shell interpreter, command history, ↑↓ navigation |
| **Finder** | Project grid — click NILE to open the flagship window |
| **NILE** | Graduation project window with pharaonic theme |
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
5. **Login manager** — username/password prompt
6. **Desktop** — window manager, dock, menubar, Spotlight (Cmd/Ctrl+K)

---

## OS Concepts Demonstrated

---

## Running Locally

No build step. No dependencies.

```bash
git clone https://github.com/A1medEssam/A1medEssamV8.github.io
cd A1medEssamV8.github.io
python3 -m http.server 8080
```

Or visit the [live demo](https://A1medEssam.github.io).

---

## References 

| | |
|---|---|
| *Operating System Concepts*, 10th Edition, 2018 | Silberschatz, Galvin & Gagne
| *Computer Organization and Design: The Hardware/Software Interface*, 5th Edition, Morgan Kaufmann, 2014 | Patterson & Hennessy |
| *Parallel Programming: Concepts and Practice*, Morgan Kaufmann | Schmidt, Gonzalez-Dominguez, Hundt & Schlarb |

---
## Author

**Ahmed Essam**  
NLP & Intelligent Systems Engineer  
E-JUST · AI & Data Science · BSc. 2025  
New Cairo, Egypt

[GitHub](https://github.com/A1medEssam) · [Email](mailto:ahmed.essam1418@gmail.com) · [LinkedIn](https://linkedin.com/in/a1medessam) · [Kaggle](https://kaggle.com/a1medessam)
