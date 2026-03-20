// ╔══════════════════════════════════════════════════════════════╗
// ║  AhmedOS Virtual Filesystem                                  ║
// ║  Inode-based VFS · /proc · /home · /bin · /etc               ║
// ╚══════════════════════════════════════════════════════════════╝

'use strict';

class Inode {
  constructor({ name, type = 'file', content = '', children = null, mode = '644' }) {
    this.name     = name;
    this.type     = type;   // 'file' | 'dir' | 'proc' | 'link'
    this.content  = content;
    this.children = children || (type === 'dir' ? {} : null);
    this.mode     = mode;
    this.size     = content.length;
    this.mtime    = new Date().toISOString();
    this.owner    = type === 'dir' && name === 'root' ? 'root' : 'ahmed';
  }
}

class ProcFS {
  constructor() {
    this._entries = {};
    this._uptime  = Date.now();
  }

  addEntry(pid, pcb) {
    this._entries[pid] = pcb;
  }

  removeEntry(pid) {
    delete this._entries[pid];
  }

  read(path) {
    // /proc/[pid]/status
    const parts = path.split('/').filter(Boolean);
    if (parts[0] !== 'proc') return null;
    if (parts.length === 1) {
      return Object.keys(this._entries).concat(['cpuinfo','meminfo','uptime','version']).join('\n');
    }
    const key = parts[1];
    if (key === 'cpuinfo') return `processor\t: 0\nmodel name\t: AhmedOS Virtual CPU @ 3.2GHz\ncores\t\t: 4\nflags\t\t: js-v8 wasm simd`;
    if (key === 'meminfo') {
      const pm = window.Kernel?.pm;
      const mem = pm?.mem;
      if (!mem) return 'MemTotal: 4096 MB';
      return [
        `MemTotal:  ${mem.totalMB} MB`,
        `MemFree:   ${mem.freeMB} MB`,
        `MemUsed:   ${mem.usedMB} MB`,
        `Cached:    ${Math.floor(mem.usedMB * 0.3)} MB`,
        `SwapTotal: 2048 MB`,
        `SwapFree:  2048 MB`,
      ].join('\n');
    }
    if (key === 'uptime') {
      const s = Math.floor((Date.now() - this._uptime) / 1000);
      return `${s} seconds`;
    }
    if (key === 'version') return `AhmedOS version 1.0.0 (ahmed@AhmedOS) #1 SMP`;
    const pid = parseInt(key);
    const pcb = this._entries[pid];
    if (!pcb) return null;
    if (parts[2] === 'status') {
      return [
        `Name:   ${pcb.name}`,
        `State:  ${pcb.state.charAt(0).toUpperCase()} (${pcb.state})`,
        `Pid:    ${pcb.pid}`,
        `PPid:   ${pcb.ppid}`,
        `VmRSS:  ${pcb.memMB * 1024} kB`,
        `Threads: 1`,
        `Priority: ${pcb.priority}`,
      ].join('\n');
    }
    if (parts[2] === 'cmdline') return `/bin/${pcb.name}`;
    if (parts[2] === 'maps') {
      const base = (0x2000 + pcb.pid * 0x100).toString(16);
      return `${base}000-${base}fff r-xp /bin/${pcb.name}`;
    }
    return `[dir: status, cmdline, maps]`;
  }
}

class VirtualFileSystem {
  constructor() {
    this.proc  = new ProcFS();
    this._root = this._build();
    this._cwd  = '/home/ahmed';
  }

  _build() {
    return {
      '/': new Inode({ name: '/', type: 'dir', mode: '755' }),
      '/proc': new Inode({ name: 'proc', type: 'dir', mode: '555' }),
      '/bin': new Inode({ name: 'bin', type: 'dir', mode: '755' }),
      '/etc': new Inode({ name: 'etc', type: 'dir', mode: '755' }),
      '/home': new Inode({ name: 'home', type: 'dir', mode: '755' }),
      '/home/ahmed': new Inode({ name: 'ahmed', type: 'dir', mode: '755' }),

      // ── /etc ──────────────────────────────────────────────────
      '/etc/hostname': new Inode({ name: 'hostname', content: 'AhmedOS\n' }),
      '/etc/os-release': new Inode({ name: 'os-release', content:
        'NAME="AhmedOS"\nVERSION="1.0.0"\nID=ahmedos\nHOME_URL="https://A1medEssam.github.io"\nBUILD_DATE="2025"\n'
      }),
      '/etc/passwd': new Inode({ name: 'passwd', content:
        'root:x:0:0:root:/root:/bin/bash\nahmed:x:1000:1000:Ahmed Essam,NLP Engineer:/home/ahmed:/bin/bash\n'
      }),
      '/etc/motd': new Inode({ name: 'motd', content:
        '\n  Welcome to AhmedOS 1.0.0\n  NLP · Intelligent Systems · Spatial Computing\n  Type "help" for available commands.\n\n'
      }),

      // ── /home/ahmed ───────────────────────────────────────────
      '/home/ahmed/about.txt': new Inode({ name: 'about.txt', content:
        'AHMED ESSAM\n' +
        '===========\n' +
        'Role:      NLP & Intelligent Systems Engineer\n' +
        'Location:  New Cairo, Egypt\n' +
        'Education: E-JUST · AI & Data Science · BSc. 2025\n' +
        'Next:      MSc. [Incoming]\n' +
        'Email:     ahmed.essam1418@gmail.com\n' +
        'GitHub:    github.com/A1medEssam\n\n' +
        'LANGUAGES\n---------\n' +
        'Arabic   ████████████  native\n' +
        'English  ██████████░░  C1 Advanced\n' +
        'German   ███████░░░░░  B2\n' +
        'Japanese ██░░░░░░░░░░  N5\n'
      }),
      '/home/ahmed/story.txt': new Inode({ name: 'story.txt', content:
        'I got obsessed early with a specific frustration:\n' +
        'models that look impressive on benchmarks and collapse\n' +
        'the moment the problem drifts out-of-distribution.\n\n' +
        'That gap between claimed capability and actual robustness\n' +
        '— that is where I live.\n\n' +
        'I read papers to argue with them, not to cite them.\n' +
        'I build by breaking things first.\n' +
        'CUDA kernels and Blender rigs.\n' +
        'Red Team ops and Arabic NLP.\n' +
        'Not scattered — genuinely interested in all of it.\n'
      }),
      '/home/ahmed/.bashrc': new Inode({ name: '.bashrc', content:
        '# AhmedOS .bashrc\nexport PS1="ahmed@AhmedOS:~$ "\nexport PATH="/bin:/usr/bin"\nalias ll="ls -la"\nalias cls="clear"\n'
      }),
      '/home/ahmed/.profile': new Inode({ name: '.profile', content:
        '# User profile\nexport EDITOR=nano\nexport LANG=en_US.UTF-8\n'
      }),

      // ── projects/ ────────────────────────────────────────────
      '/home/ahmed/projects': new Inode({ name: 'projects', type: 'dir', mode: '755' }),
      '/home/ahmed/projects/README.md': new Inode({ name: 'README.md', content:
        '# Ahmed Essam — Projects\n\nTotal: 9 projects | 2 internships\n\nRun any project:\n  $ ./NILE/run.sh\n  $ open projects/NILE\n'
      }),

      '/home/ahmed/projects/NILE': new Inode({ name: 'NILE', type: 'dir', mode: '755' }),
      '/home/ahmed/projects/NILE/README.md': new Inode({ name: 'README.md', content:
        '# NILE — Narrating Immersive Legacies of Egypt\n\n' +
        'Graduation Project · E-JUST · 2025\n\n' +
        'A next-generation multimodal spatial computing virtual museum.\n' +
        'Users interact with Ancient Egyptian artifacts using natural Arabic speech.\n' +
        'Sub-second RAG pipeline. Neural TTS/STT. Unity XR architecture.\n\n' +
        'Collaborators:\n' +
        '  - Egyptian Ministry of Tourism & Antiquities\n' +
        '  - Yorescape (US startup)\n' +
        '  - Faculty of Archaeology, Alexandria University\n\n' +
        'Stack: Python · Unity · C# · LangChain · RAG · TTS/STT · VR\n' +
        'Status: ★ SHIPPED\n'
      }),
      '/home/ahmed/projects/NILE/run.sh': new Inode({ name: 'run.sh', mode: '755', content:
        '#!/bin/bash\n# Launch NILE application\necho "Starting NILE..."\nopen nile\n'
      }),

      '/home/ahmed/projects/AraSQL': new Inode({ name: 'AraSQL', type: 'dir', mode: '755' }),
      '/home/ahmed/projects/AraSQL/README.md': new Inode({ name: 'README.md', content:
        '# AraSQL — Arabic Text-to-SQL Translator\n\nConverts Arabic natural language to executable SQL.\nCombines T5, SQLCoder, and embedding-based schema matching.\nStatus: ✓ Complete\n'
      }),

      '/home/ahmed/projects/arabic-memes': new Inode({ name: 'arabic-memes', type: 'dir', mode: '755' }),
      '/home/ahmed/projects/arabic-memes/README.md': new Inode({ name: 'README.md', content:
        '# Arabic Offensive Memes Classifier\n\nDataset creation, annotation, model training.\nPaper targeting EMNLP 2025.\nStack: PyTorch · BERT · NLP\nStatus: ⟶ Submitting 2025\n'
      }),

      '/home/ahmed/projects/pix2pix-ascii': new Inode({ name: 'pix2pix-ascii', type: 'dir', mode: '755' }),
      '/home/ahmed/projects/pix2pix-ascii/README.md': new Inode({ name: 'README.md', content:
        '# Pix2Pix ASCII Art Generator\n\nConditional GANs converting images to ASCII art.\nThe output is genuinely uncanny.\nStack: GANs · PyTorch · OpenCV\nStatus: ✓ Complete\n'
      }),

      '/home/ahmed/projects/gesture-ai': new Inode({ name: 'gesture-ai', type: 'dir', mode: '755' }),
      '/home/ahmed/projects/gesture-ai/README.md': new Inode({ name: 'README.md', content:
        '# Gesture Presentation AI\n\nControl PowerPoint with hand gestures.\nAuto-pauses when confusion detected on presenter face.\nStack: MediaPipe · OpenCV · Python\nStatus: ✓ Complete\n'
      }),

      '/home/ahmed/projects/web-rag': new Inode({ name: 'web-rag', type: 'dir', mode: '755' }),
      '/home/ahmed/projects/web-rag/README.md': new Inode({ name: 'README.md', content:
        '# Web Scraping RAG\n\nEnd-to-end Arabic NLP pipeline.\nSelenium → Qdrant → Gemini with cultural-context tuning.\nStatus: ✓ Complete\n'
      }),

      '/home/ahmed/projects/blockchain-sc': new Inode({ name: 'blockchain-sc', type: 'dir', mode: '755' }),
      '/home/ahmed/projects/blockchain-sc/README.md': new Inode({ name: 'README.md', content:
        '# Blockchain Supply Chain DApp\n\nDecentralized tamper-proof product tracking.\nEthereum smart contracts · React frontend.\nStatus: ✓ Complete\n'
      }),

      // ── /bin ─────────────────────────────────────────────────
      '/bin/ls':    new Inode({ name: 'ls',    mode: '755', content: '[builtin]' }),
      '/bin/cd':    new Inode({ name: 'cd',    mode: '755', content: '[builtin]' }),
      '/bin/cat':   new Inode({ name: 'cat',   mode: '755', content: '[builtin]' }),
      '/bin/pwd':   new Inode({ name: 'pwd',   mode: '755', content: '[builtin]' }),
      '/bin/ps':    new Inode({ name: 'ps',    mode: '755', content: '[builtin]' }),
      '/bin/top':   new Inode({ name: 'top',   mode: '755', content: '[builtin — opens Activity Monitor]' }),
      '/bin/kill':  new Inode({ name: 'kill',  mode: '755', content: '[builtin]' }),
      '/bin/echo':  new Inode({ name: 'echo',  mode: '755', content: '[builtin]' }),
      '/bin/clear': new Inode({ name: 'clear', mode: '755', content: '[builtin]' }),
      '/bin/help':  new Inode({ name: 'help',  mode: '755', content: '[builtin]' }),
      '/bin/uname': new Inode({ name: 'uname', mode: '755', content: '[builtin]' }),
      '/bin/open':  new Inode({ name: 'open',  mode: '755', content: '[builtin — opens app window]' }),
      '/bin/man':   new Inode({ name: 'man',   mode: '755', content: '[builtin — manual pages]' }),
      '/bin/free':  new Inode({ name: 'free',  mode: '755', content: '[builtin — memory info]' }),
      '/bin/uptime':new Inode({ name: 'uptime',mode: '755', content: '[builtin]' }),
    };
  }

  resolve(path) {
    if (!path.startsWith('/')) path = this._cwd + '/' + path;
    // normalize ..
    const parts = path.split('/').filter(Boolean);
    const resolved = [];
    for (const p of parts) {
      if (p === '..') resolved.pop();
      else if (p !== '.') resolved.push(p);
    }
    return '/' + resolved.join('/');
  }

  stat(path) {
    const abs = this.resolve(path);
    // proc virtual
    if (abs.startsWith('/proc')) return { type: 'proc', path: abs };
    return this._root[abs] || null;
  }

  read(path) {
    const abs = this.resolve(path);
    if (abs.startsWith('/proc')) return this.proc.read(abs);
    const node = this._root[abs];
    if (!node) return null;
    if (node.type === 'dir') return null;
    return node.content;
  }

  ls(path) {
    const abs = this.resolve(path || this._cwd);
    if (abs === '/proc' || abs.startsWith('/proc/')) {
      if (abs === '/proc') {
        const pm = window.Kernel?.pm;
        const pids = pm ? Array.from(pm.processes.keys()).map(String) : [];
        return [...pids, 'cpuinfo', 'meminfo', 'uptime', 'version']
          .map(n => ({ name: n, type: abs === '/proc' && !isNaN(n) ? 'dir' : 'file' }));
      }
      return [
        { name: 'status', type: 'file' },
        { name: 'cmdline', type: 'file' },
        { name: 'maps', type: 'file' },
      ];
    }
    const entries = [];
    const prefix  = abs === '/' ? '' : abs;
    const depth   = abs.split('/').filter(Boolean).length;

    for (const key of Object.keys(this._root)) {
      if (!key.startsWith(prefix + '/')) continue;
      const rest  = key.slice(prefix.length + 1);
      if (rest.includes('/')) continue;  // deeper level
      const node  = this._root[key];
      entries.push({ name: node.name || rest, type: node.type, mode: node.mode, size: node.size, mtime: node.mtime });
    }
    return entries;
  }

  cd(path) {
    let target = path;
    if (path === '~' || path === '') target = '/home/ahmed';
    const abs = this.resolve(target);
    if (abs.startsWith('/proc')) { this._cwd = abs; return true; }
    const node = this._root[abs];
    if (!node || node.type !== 'dir') return false;
    this._cwd = abs;
    return true;
  }

  get cwd() { return this._cwd; }
}

window.VirtualFileSystem = VirtualFileSystem;
window.FS = new VirtualFileSystem();
