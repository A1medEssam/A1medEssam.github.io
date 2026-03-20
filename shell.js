// ╔══════════════════════════════════════════════════════════════╗
// ║  AhmedOS Shell — /bin/bash compatible interpreter            ║
// ╚══════════════════════════════════════════════════════════════╝

'use strict';

class Shell {
  constructor(terminal) {
    this.term    = terminal;  // Terminal app reference
    this.history = [];
    this.histIdx = -1;
    this.env     = {
      USER:  'ahmed',
      HOME:  '/home/ahmed',
      SHELL: '/bin/bash',
      TERM:  'xterm-256color',
      PATH:  '/bin:/usr/bin',
    };
  }

  get prompt() {
    const cwd = window.FS.cwd;
    const home = '/home/ahmed';
    const display = cwd.startsWith(home) ? '~' + cwd.slice(home.length) : cwd;
    return `<span class="sh-user">ahmed@AhmedOS</span><span class="sh-sep">:</span><span class="sh-path">${display}</span><span class="sh-dollar">$</span>`;
  }

  exec(raw) {
    const line = raw.trim();
    if (!line) return '';
    this.history.unshift(line);
    this.histIdx = -1;

    // variable expansion
    const expanded = line.replace(/\$(\w+)/g, (_, k) => this.env[k] || '');
    const [cmd, ...args] = this._tokenize(expanded);

    switch (cmd) {
      case 'help':    return this._help();
      case 'ls':      return this._ls(args);
      case 'cd':      return this._cd(args);
      case 'pwd':     return `<span class="sh-out">${window.FS.cwd}</span>`;
      case 'cat':     return this._cat(args);
      case 'echo':    return `<span class="sh-out">${args.join(' ')}</span>`;
      case 'clear':   return '__CLEAR__';
      case 'ps':      return this._ps(args);
      case 'top':     return this._top();
      case 'kill':    return this._kill(args);
      case 'uname':   return this._uname(args);
      case 'free':    return this._free();
      case 'uptime':  return this._uptime();
      case 'whoami':  return `<span class="sh-out">ahmed</span>`;
      case 'open':    return this._open(args);
      case 'man':     return this._man(args);
      case 'env':     return this._env();
      case 'export':  return this._export(args);
      case 'history': return this._historyCmd();
      case 'date':    return `<span class="sh-out">${new Date().toString()}</span>`;
      case 'sleep':   return `<span class="sh-dim">[sleeping ${args[0] || 1}s...]</span>`;
      case 'neofetch':return this._neofetch();
      case 'exit':    return '__EXIT__';
      default:
        // try to run as file
        if (line.startsWith('./')) return this._runFile(line, args);
        return `<span class="sh-err">bash: ${cmd}: command not found</span>`;
    }
  }

  _tokenize(line) {
    const tokens = [];
    let cur = '', inQ = false, q = '';
    for (const ch of line) {
      if ((ch === '"' || ch === "'") && !inQ) { inQ = true; q = ch; }
      else if (ch === q && inQ) { inQ = false; }
      else if (ch === ' ' && !inQ) { if (cur) tokens.push(cur); cur = ''; }
      else cur += ch;
    }
    if (cur) tokens.push(cur);
    return tokens;
  }

  _help() {
    return [
      `<span class="sh-head">── AhmedOS Shell Commands ────────────────────────────</span>`,
      `  <span class="sh-cmd">ls</span> [path]          list directory contents`,
      `  <span class="sh-cmd">cd</span> [path]          change directory`,
      `  <span class="sh-cmd">pwd</span>               print working directory`,
      `  <span class="sh-cmd">cat</span> [file]         read file contents`,
      `  <span class="sh-cmd">ps</span> [aux]           list processes`,
      `  <span class="sh-cmd">top</span>               open Activity Monitor`,
      `  <span class="sh-cmd">kill</span> [pid]         terminate process`,
      `  <span class="sh-cmd">free</span>              memory usage`,
      `  <span class="sh-cmd">uname</span> [-a]         system info`,
      `  <span class="sh-cmd">uptime</span>            system uptime`,
      `  <span class="sh-cmd">open</span> [app]         open application`,
      `  <span class="sh-cmd">man</span> [topic]        manual pages`,
      `  <span class="sh-cmd">neofetch</span>          system info + ascii art`,
      `  <span class="sh-cmd">echo</span> [text]        print text`,
      `  <span class="sh-cmd">env</span>               environment variables`,
      `  <span class="sh-cmd">history</span>           command history`,
      `  <span class="sh-cmd">clear</span>             clear terminal`,
      `<span class="sh-head">─────────────────────────────────────────────────────</span>`,
      `  Apps: <span class="sh-cmd">open about</span> | <span class="sh-cmd">open nile</span> | <span class="sh-cmd">open projects</span>`,
      `        <span class="sh-cmd">open activity</span> | <span class="sh-cmd">open finder</span> | <span class="sh-cmd">open connect</span>`,
    ].join('\n');
  }

  _ls(args) {
    const long   = args.includes('-l') || args.includes('-la') || args.includes('-al');
    const all    = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const pathArg = args.find(a => !a.startsWith('-')) || '';
    const path   = pathArg || window.FS.cwd;
    const entries = window.FS.ls(path);
    if (!entries) return `<span class="sh-err">ls: cannot access '${path}': No such file or directory</span>`;

    const shown = all ? entries : entries.filter(e => !e.name.startsWith('.'));

    if (long) {
      const lines = [`<span class="sh-dim">total ${shown.length}</span>`];
      for (const e of shown) {
        const perm = e.type === 'dir' ? 'drwxr-xr-x' : `-${e.mode === '755' ? 'rwxr-xr-x' : 'rw-r--r--'}`;
        const col  = e.type === 'dir' ? 'sh-dir' : (e.mode === '755' ? 'sh-exec' : 'sh-out');
        lines.push(`<span class="sh-dim">${perm}  1 ahmed ahmed  ${String(e.size||0).padStart(5)}  ${(e.mtime||'').slice(0,10)}</span>  <span class="${col}">${e.name}${e.type === 'dir' ? '/' : ''}</span>`);
      }
      return lines.join('\n');
    }

    // short format — grouped
    const dirs  = shown.filter(e => e.type === 'dir').map(e => `<span class="sh-dir">${e.name}/</span>`);
    const execs = shown.filter(e => e.type === 'file' && e.mode === '755').map(e => `<span class="sh-exec">${e.name}</span>`);
    const files = shown.filter(e => e.type === 'file' && e.mode !== '755').map(e => `<span class="sh-out">${e.name}</span>`);
    return [...dirs, ...execs, ...files].join('  ');
  }

  _cd(args) {
    const path = args[0] || '~';
    if (!window.FS.cd(path)) return `<span class="sh-err">bash: cd: ${path}: No such file or directory</span>`;
    return '';
  }

  _cat(args) {
    if (!args.length) return `<span class="sh-err">cat: missing operand</span>`;
    const path = args[0];
    const content = window.FS.read(path);
    if (content === null) {
      const node = window.FS.stat(path);
      if (node?.type === 'dir' || node?.type === 'proc' && !path.includes('.')) {
        return `<span class="sh-err">cat: ${path}: Is a directory</span>`;
      }
      return `<span class="sh-err">cat: ${path}: No such file or directory</span>`;
    }
    return `<span class="sh-out" style="white-space:pre">${this._escape(content)}</span>`;
  }

  _ps(args) {
    const pm = window.Kernel?.pm;
    if (!pm) return '<span class="sh-err">ps: kernel not ready</span>';
    const all = args.includes('aux') || args.includes('-aux') || args.includes('a');
    const procs = pm.list();
    const lines = [
      `<span class="sh-head">  PID  PPID  PRI  %CPU   RSS   STATE    COMMAND</span>`,
    ];
    for (const p of procs) {
      const state = p.state.slice(0,1).toUpperCase();
      const cpu   = p.cpuPct.toFixed(1).padStart(5);
      const mem   = `${p.memMB}MB`.padStart(5);
      const name  = p.name;
      const color = p.state === 'running' ? 'sh-green' : 'sh-dim';
      lines.push(
        `  <span class="${color}">${String(p.pid).padStart(4)}  ${String(p.ppid).padStart(4)}  ${String(p.priority).padStart(3)}  ${cpu}  ${mem}   ${state.padEnd(8)} ${name}</span>`
      );
    }
    return lines.join('\n');
  }

  _top() {
    window.WM?.openApp('activity');
    return `<span class="sh-dim">Opening Activity Monitor...</span>`;
  }

  _kill(args) {
    const pid = parseInt(args[args.length - 1]);
    if (isNaN(pid)) return `<span class="sh-err">kill: invalid pid</span>`;
    const pm = window.Kernel?.pm;
    if (!pm) return '<span class="sh-err">kill: kernel not ready</span>';
    const ok = pm.kill(pid);
    if (!ok) return `<span class="sh-err">kill: (${pid}) - No such process or permission denied</span>`;
    window.WM?.closeByPid(pid);
    return `<span class="sh-dim">Process ${pid} terminated</span>`;
  }

  _uname(args) {
    const full = args.includes('-a') || args.includes('--all');
    if (full) return `<span class="sh-out">AhmedOS 1.0.0 #1 SMP x86_64-js GNU/JS</span>`;
    return `<span class="sh-out">AhmedOS</span>`;
  }

  _free() {
    const mem = window.Kernel?.pm?.mem;
    if (!mem) return '<span class="sh-err">free: unavailable</span>';
    const fmt = v => String(v * 1024).padStart(8);
    return [
      `<span class="sh-head">               total        used        free</span>`,
      `<span class="sh-out">Mem:    ${fmt(mem.totalMB)}  ${fmt(mem.usedMB)}  ${fmt(mem.freeMB)}</span>`,
      `<span class="sh-out">Swap:      2097152           0     2097152</span>`,
    ].join('\n');
  }

  _uptime() {
    const s = Math.floor((Date.now() - window._bootTime) / 1000);
    const m = Math.floor(s / 60), sec = s % 60;
    const pm = window.Kernel?.pm;
    const nProc = pm ? pm.processes.size : 0;
    return `<span class="sh-out"> ${new Date().toLocaleTimeString()}  up ${m}m ${sec}s,  1 user,  load average: ${(Math.random()*0.8+0.1).toFixed(2)}, ${(Math.random()*0.5).toFixed(2)}, ${(Math.random()*0.3).toFixed(2)}</span>`;
  }

  _open(args) {
    const app = args[0];
    if (!app) return `<span class="sh-err">open: missing argument</span>`;
    window.WM?.openApp(app);
    return `<span class="sh-dim">Launching ${app}...</span>`;
  }

  _man(args) {
    const topic = args[0];
    if (!topic) return `<span class="sh-err">What manual page do you want?</span>`;
    const pages = {
      ahmed: `<span class="sh-head">AHMED(1)              User Commands             AHMED(1)\n\nNAME\n       ahmed - NLP & Intelligent Systems Engineer\n\nSYNOPSIS\n       ahmed [--research] [--build] [--ship]\n\nDESCRIPTION\n       Ahmed Essam is an AI researcher and systems engineer\n       based in New Cairo, Egypt. Specializes in Arabic NLP,\n       multimodal AI, spatial computing, and HPC.\n\n       Graduated E-JUST, AI & Data Science, BSc. 2025.\n       Heading toward MSc. in AI research.\n\nPROJECTS\n       NILE(1), AraSQL(1), arabic-memes(1)\n\nAUTHOR\n       ahmed.essam1418@gmail.com\n       github.com/A1medEssam</span>`,
      ls:    `<span class="sh-head">LS(1)\n\nNAME\n       ls - list directory contents\n\nSYNOPSIS\n       ls [-la] [path]\n\nOPTIONS\n       -l    long format\n       -a    show hidden files\n       -la   both</span>`,
      ps:    `<span class="sh-head">PS(1)\n\nNAME\n       ps - report process status\n\nSYNOPSIS\n       ps [aux]\n\nOPTIONS\n       aux   show all processes</span>`,
    };
    return pages[topic] || `<span class="sh-err">No manual entry for ${topic}</span>`;
  }

  _env() {
    return Object.entries(this.env)
      .map(([k,v]) => `<span class="sh-out">${k}=${v}</span>`)
      .join('\n');
  }

  _export(args) {
    for (const a of args) {
      const [k, v] = a.split('=');
      if (k && v !== undefined) this.env[k] = v;
    }
    return '';
  }

  _historyCmd() {
    return this.history.slice(0, 20).map((cmd, i) =>
      `<span class="sh-dim">${String(i+1).padStart(4)}  </span><span class="sh-out">${cmd}</span>`
    ).join('\n');
  }

  _runFile(path, args) {
    const content = window.FS.read(path.replace('./', window.FS.cwd + '/'));
    if (!content) return `<span class="sh-err">bash: ${path}: No such file or executable</span>`;
    // look for open command in script
    const openMatch = content.match(/open (\w+)/);
    if (openMatch) {
      window.WM?.openApp(openMatch[1]);
      return `<span class="sh-dim">Executing ${path}...\nLaunching ${openMatch[1]}...</span>`;
    }
    return `<span class="sh-dim">Executing ${path}...</span>`;
  }

  _neofetch() {
    const mem = window.Kernel?.pm?.mem;
    const used = mem ? `${mem.usedMB}MB / ${mem.totalMB}MB` : '?';
    const procs = window.Kernel?.pm?.processes.size || 0;
    return [
      `<span class="sh-user">         ▗▄▄▄▖      </span>  <span class="sh-user">ahmed</span><span class="sh-dim">@</span><span class="sh-user">AhmedOS</span>`,
      `<span class="sh-user">        ▐███████▌    </span>  <span class="sh-dim">───────────────────</span>`,
      `<span class="sh-user">       ▐█████████▌   </span>  OS: AhmedOS 1.0.0`,
      `<span class="sh-user">      ▐███████████▌  </span>  Kernel: 1.0.0-js`,
      `<span class="sh-user">     ▐█████████████▌ </span>  Shell: /bin/bash`,
      `<span class="sh-user">    ▐███████████████▌</span>  Processes: ${procs}`,
      `<span class="sh-dim">    ▝▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▘</span>  Memory: ${used}`,
      `                     CPU: x86_64-js V8`,
      `                     Location: New Cairo, Egypt`,
    ].join('\n');
  }

  _escape(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}

window.Shell = Shell;
