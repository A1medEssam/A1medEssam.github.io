// ╔══════════════════════════════════════════════════════════════╗
// ║  AhmedOS Applications                                        ║
// ╚══════════════════════════════════════════════════════════════╝

'use strict';

// ── App Registry ────────────────────────────────────────────────
const Apps = {

  // ── Terminal ──────────────────────────────────────────────────
  terminal: {
    id:      'terminal',
    name:    'Terminal',
    icon:    '&#8250;_',
    memMB:   48,
    color:   '#30D158',
    width:   640,
    height:  420,
    minW:    400,
    minH:    280,

    render() {
      return `
        <div id="term-out" style="flex:1;overflow-y:auto;padding:14px 16px;font-size:12px;line-height:1.9;font-family:var(--mono)"></div>
        <div style="display:flex;align-items:center;gap:6px;padding:6px 16px 10px;border-top:1px solid rgba(255,255,255,0.06)">
          <span id="term-ps" style="font-family:var(--mono);font-size:12px;white-space:nowrap"></span>
          <input id="term-in" autocomplete="off" spellcheck="false" style="flex:1;background:transparent;border:none;outline:none;font-family:var(--mono);font-size:12px;color:var(--text);caret-color:var(--accent)"/>
        </div>`;
    },

    mount(el, winId) {
      const out   = el.querySelector('#term-out');
      const input = el.querySelector('#term-in');
      const ps    = el.querySelector('#term-ps');
      const shell = new Shell({ el: out });
      window._shells = window._shells || {};
      window._shells[winId] = shell;

      const updatePS = () => { ps.innerHTML = shell.prompt; };
      updatePS();

      const print = (html) => {
        const d = document.createElement('div');
        d.innerHTML = html;
        out.appendChild(d);
        out.scrollTop = out.scrollHeight;
      };

      // MOTD
      const motd = window.FS.read('/etc/motd');
      print(`<span style="color:var(--text-muted);white-space:pre">${motd}</span>`);
      print(`<span style="color:var(--text-muted)">Type <span style="color:var(--accent)">help</span> for available commands.</span>`);
      print('');

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const raw = input.value.trim();
          input.value = '';
          print(`${shell.prompt} ${raw || ''}`);
          if (!raw) { updatePS(); return; }
          const result = shell.exec(raw);
          if (result === '__CLEAR__') { out.innerHTML = ''; }
          else if (result === '__EXIT__') { window.WM?.closeWin(winId); return; }
          else if (result) print(result);
          print('');
          updatePS();
          window.WM?.sndKey?.();
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          shell.histIdx = Math.min(shell.histIdx + 1, shell.history.length - 1);
          input.value = shell.history[shell.histIdx] || '';
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          shell.histIdx = Math.max(shell.histIdx - 1, -1);
          input.value = shell.histIdx < 0 ? '' : shell.history[shell.histIdx];
        }
        if (e.key !== 'Enter') window.WM?.sndKey?.();
      });

      el.addEventListener('click', () => input.focus());
      input.focus();
    }
  },

  // ── About ─────────────────────────────────────────────────────
  about: {
    id:    'about',
    name:  'About Ahmed',
    icon:  '&#9998;',
    memMB: 24,
    color: '#0A84FF',
    width: 460,
    height:500,

    render() {
      return `
        <div style="padding:28px;overflow-y:auto;height:100%">
          <div style="font-size:22px;font-weight:700;color:var(--accent);letter-spacing:1px;margin-bottom:4px">Ahmed Essam</div>
          <div style="font-size:11px;color:var(--text-muted);letter-spacing:3px;margin-bottom:20px">NLP · INTELLIGENT SYSTEMS · SPATIAL COMPUTING</div>
          <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:18px"></div>
          <p style="font-size:12px;color:var(--text-dim);line-height:1.9;margin-bottom:12px">
            Obsessed with a specific frustration: models that look impressive on benchmarks and collapse the moment the problem drifts.
            <strong style="color:var(--text)">That gap between claimed capability and actual robustness</strong> — that is where I live.
          </p>
          <p style="font-size:12px;color:var(--text-dim);line-height:1.9;margin-bottom:12px">
            I read papers to argue with them, not to cite them. I build by breaking things first.
            <strong style="color:var(--text)">CUDA kernels and Blender rigs. Red Team ops and Arabic NLP.</strong> Not scattered — genuinely interested in all of it.
          </p>
          <p style="font-size:12px;color:var(--text-dim);line-height:1.9;margin-bottom:20px">
            Finishing BSc at E-JUST. Heading toward a master's — not for the credential, for the depth.
          </p>
          <div style="height:1px;background:rgba(255,255,255,0.08);margin-bottom:16px"></div>
          <div style="display:grid;grid-template-columns:90px 1fr;gap:6px 12px;font-size:11px">
            <span style="color:var(--text-muted)">location</span><span style="color:var(--text-dim)">New Cairo, Egypt</span>
            <span style="color:var(--text-muted)">university</span><span style="color:var(--text-dim)">E-JUST · AI & Data Science</span>
            <span style="color:var(--text-muted)">degree</span><span style="color:var(--text-dim)">BSc. 2025</span>
            <span style="color:var(--text-muted)">next</span><span style="color:var(--text-dim)">MSc. [incoming]</span>
            <span style="color:var(--text-muted)">email</span><span style="color:var(--text-dim)">ahmed.essam1418@gmail.com</span>
            <span style="color:var(--text-muted)">languages</span><span style="color:var(--text-dim)">Arabic native · EN C1 · DE B2 · JA N5</span>
          </div>
        </div>`;
    },
    mount() {}
  },

  // ── NILE ──────────────────────────────────────────────────────
  nile: {
    id:    'nile',
    name:  'NILE',
    icon:  '&#9733;',
    memMB: 128,
    color: '#FF9F0A',
    width: 560,
    height:520,

    render() {
      return `
        <div style="height:100%;overflow-y:auto;background:#07050A;position:relative">
          <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(180,140,30,0.12),transparent 60%);pointer-events:none"></div>
          <div style="padding:28px 32px;position:relative">
            <div style="text-align:center;font-size:26px;letter-spacing:12px;color:#C9963A;opacity:.6;margin-bottom:10px">𓂀  𓁹  𓆣</div>
            <div style="text-align:center;font-size:9px;letter-spacing:6px;color:#4A3820;margin-bottom:6px">GRADUATION PROJECT · E-JUST · 2025</div>
            <div style="text-align:center;font-size:24px;font-weight:700;color:#C9963A;letter-spacing:6px;margin-bottom:4px">NILE</div>
            <div style="text-align:center;font-size:9px;letter-spacing:4px;color:#E3B96A;margin-bottom:18px">NARRATING IMMERSIVE LEGACIES OF EGYPT</div>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#3D2800,transparent);margin-bottom:16px"></div>
            <p style="font-size:13px;color:#D4C8A0;line-height:1.9;text-align:center;font-style:italic;margin-bottom:14px">
              You're standing in a museum. A mummy in front of you has been dead for
              <span style="color:#E3B96A">3,000 years</span>. You ask it a question — in Arabic.
              It answers in <span style="color:#E3B96A">under a second</span>.
            </p>
            <p style="font-size:11px;color:#8A7A56;line-height:1.9;margin-bottom:14px">
              A next-generation multimodal spatial computing virtual museum. Shipped. Full VR environment,
              natural Arabic speech interaction, sub-second RAG pipeline, neural TTS/STT, Unity XR architecture.
            </p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
              <div style="background:rgba(201,150,58,.05);border:1px solid #3D2800;border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:18px;font-weight:700;color:#C9963A">&lt;1s</div>
                <div style="font-size:8px;color:#5A4820;letter-spacing:2px;margin-top:2px">RAG LATENCY</div>
              </div>
              <div style="background:rgba(201,150,58,.05);border:1px solid #3D2800;border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:18px;font-weight:700;color:#C9963A">3</div>
                <div style="font-size:8px;color:#5A4820;letter-spacing:2px;margin-top:2px">INSTITUTIONS</div>
              </div>
              <div style="background:rgba(201,150,58,.05);border:1px solid #3D2800;border-radius:8px;padding:12px;text-align:center">
                <div style="font-size:18px;font-weight:700;color:#C9963A">VR</div>
                <div style="font-size:8px;color:#5A4820;letter-spacing:2px;margin-top:2px">XR TOOLKIT</div>
              </div>
            </div>
            <div style="font-size:11px;color:#6A5A38;line-height:1.8;margin-bottom:14px">
              Built with <strong style="color:#8A7A56">Egyptian Ministry of Tourism & Antiquities</strong>,
              US startup <strong style="color:#8A7A56">Yorescape</strong>, and
              <strong style="color:#8A7A56">Faculty of Archaeology, Alexandria University</strong>.
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:16px">
              ${['Python','Unity','C#','LangChain','RAG','TTS/STT','VR','PyTorch'].map(t =>
                `<span style="font-size:9px;padding:3px 10px;border-radius:20px;background:rgba(201,150,58,.04);border:1px solid #3D2800;color:#E3B96A">${t}</span>`
              ).join('')}
            </div>
            <div style="text-align:center">
              <a href="https://github.com/A1medEssam" target="_blank"
                 style="display:inline-block;font-size:11px;color:#E3B96A;border:1px solid #3D2800;border-radius:8px;padding:7px 18px;text-decoration:none">
                view on github ↗
              </a>
            </div>
          </div>
        </div>`;
    },
    mount() {}
  },

  // ── Finder (Projects) ─────────────────────────────────────────
  finder: {
    id:    'finder',
    name:  'Finder',
    icon:  '&#128193;',
    memMB: 56,
    color: '#64D2FF',
    width: 680,
    height:500,

    render() {
      const projects = [
        { name:'NILE', status:'SHIPPED', color:'#FF9F0A', tags:['Unity','LangChain','RAG','VR'], desc:'VR museum · Arabic speech · sub-second RAG · Ministry of Tourism', app:'nile' },
        { name:'Arabic Memes Classifier', status:'EMNLP 2025', color:'#FF453A', tags:['PyTorch','BERT','NLP'], desc:'Offensive Arabic meme detection. Dataset, annotation, model.' },
        { name:'AraSQL', status:'complete', color:'#30D158', tags:['T5','SQLCoder','LLM'], desc:'Arabic NL → SQL. T5 + SQLCoder + schema matching.' },
        { name:'Web Scraping RAG', status:'complete', color:'#30D158', tags:['Selenium','Qdrant','Gemini'], desc:'Arabic NLP: Selenium → Qdrant → Gemini with cultural tuning.' },
        { name:'Pix2Pix ASCII Art', status:'complete', color:'#30D158', tags:['GANs','PyTorch','OpenCV'], desc:'Conditional GANs converting images to ASCII. Genuinely uncanny.' },
        { name:'Gesture AI', status:'complete', color:'#30D158', tags:['MediaPipe','OpenCV'], desc:'Hand gestures control PowerPoint. Auto-pauses on confusion.' },
        { name:'Blockchain Supply Chain', status:'complete', color:'#30D158', tags:['Solidity','React','Ethereum'], desc:'Decentralized DApp for tamper-proof product tracking.' },
        { name:'GraphQL RAG', status:'complete', color:'#30D158', tags:['Apollo','GraphQL','SQL Server'], desc:'Schema-aware GraphQL RAG with enterprise SQL Server.' },
      ];

      const cards = projects.map(p => `
        <div class="proj-card" onclick="window.WM?.openApp('${p.app||''}')" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;transition:all .18s;cursor:${p.app?'pointer':'default'}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:12px;color:var(--accent);font-weight:500">${p.app === 'nile' ? '★ ' : '📁 '}${p.name}</div>
            <span style="font-size:9px;padding:2px 8px;border-radius:10px;background:${p.color}22;border:1px solid ${p.color}55;color:${p.color}">${p.status}</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.6;margin-bottom:8px">${p.desc}</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${p.tags.map(t => `<span style="font-size:9px;padding:1px 6px;border-radius:4px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--text-muted)">${t}</span>`).join('')}</div>
        </div>`).join('');

      return `
        <div style="padding:4px 14px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px;color:var(--text-muted)">
          /home/ahmed/projects — ${projects.length} items
        </div>
        <div style="padding:14px;overflow-y:auto;height:calc(100% - 32px);display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${cards}
        </div>`;
    },
    mount(el) {
      el.querySelectorAll('.proj-card').forEach(c => {
        c.addEventListener('mouseenter', () => { c.style.borderColor = 'rgba(255,255,255,0.2)'; c.style.background = 'rgba(255,255,255,0.06)'; });
        c.addEventListener('mouseleave', () => { c.style.borderColor = 'rgba(255,255,255,0.08)'; c.style.background = 'rgba(255,255,255,0.03)'; });
      });
    }
  },

  // ── Activity Monitor ──────────────────────────────────────────
  activity: {
    id:    'activity',
    name:  'Activity Monitor',
    icon:  '&#9641;',
    memMB: 32,
    color: '#BF5AF2',
    width: 700,
    height:520,
    _interval: null,

    render() {
      return `
        <div style="display:flex;flex-direction:column;height:100%">
          <!-- CPU Scheduler Gantt -->
          <div style="padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,0.06)">
            <div style="font-size:9px;letter-spacing:3px;color:var(--text-muted);margin-bottom:8px">CPU SCHEDULER — ROUND ROBIN</div>
            <div id="gantt" style="height:24px;border-radius:6px;overflow:hidden;display:flex;background:rgba(255,255,255,0.04)"></div>
            <div id="sched-info" style="font-size:10px;color:var(--text-muted);margin-top:5px">Quantum: 100ms</div>
          </div>
          <!-- Process Table -->
          <div style="padding:10px 16px 6px;border-bottom:1px solid rgba(255,255,255,0.06)">
            <div style="font-size:9px;letter-spacing:3px;color:var(--text-muted);margin-bottom:8px">PROCESSES</div>
            <div style="display:grid;grid-template-columns:48px 1fr 60px 60px 70px 80px;gap:4px;font-size:10px;color:var(--text-muted);padding:0 4px;margin-bottom:4px">
              <span>PID</span><span>NAME</span><span>CPU%</span><span>MEM</span><span>STATE</span><span>UPTIME</span>
            </div>
            <div id="proc-table" style="font-size:11px;max-height:160px;overflow-y:auto"></div>
          </div>
          <!-- Memory Map -->
          <div style="padding:10px 16px;flex:1">
            <div style="font-size:9px;letter-spacing:3px;color:var(--text-muted);margin-bottom:8px">MEMORY MAP — <span id="mem-pct">...</span></div>
            <div id="mem-map" style="height:36px;display:flex;border-radius:6px;overflow:hidden;gap:1px"></div>
            <div id="mem-legend" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:10px;color:var(--text-muted)"></div>
            <!-- Memory bar -->
            <div style="margin-top:12px">
              <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-bottom:4px">
                <span>RAM Usage</span><span id="mem-nums"></span>
              </div>
              <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
                <div id="mem-bar" style="height:100%;background:linear-gradient(90deg,#0A84FF,#BF5AF2);border-radius:3px;transition:width .5s"></div>
              </div>
            </div>
          </div>
        </div>`;
    },

    mount(el, winId) {
      const gantt    = el.querySelector('#gantt');
      const schedInfo = el.querySelector('#sched-info');
      const procTbl  = el.querySelector('#proc-table');
      const memMap   = el.querySelector('#mem-map');
      const memLeg   = el.querySelector('#mem-legend');
      const memPct   = el.querySelector('#mem-pct');
      const memBar   = el.querySelector('#mem-bar');
      const memNums  = el.querySelector('#mem-nums');

      const SEG_COLORS = ['#0A84FF','#30D158','#FF9F0A','#FF453A','#BF5AF2','#64D2FF','#FF6961','#FFD60A'];

      const refresh = () => {
        const pm  = window.Kernel?.pm;
        if (!pm) return;
        const mem = pm.mem;

        // Gantt
        const hist = pm.scheduler.getGantt();
        if (hist.length) {
          const total = hist.reduce((s,h) => s + h.duration, 0);
          gantt.innerHTML = hist.map(h =>
            `<div title="${h.name}" style="flex:${h.duration/total};background:${h.color};opacity:.85;min-width:2px"></div>`
          ).join('');
          const cur = pm.scheduler.current;
          schedInfo.textContent = `Quantum: 100ms  ·  Current: ${cur?.name||'idle'} (PID ${cur?.pid||0})  ·  Ticks: ${pm.scheduler.ticks}`;
        }

        // Process table
        const procs = pm.list();
        procTbl.innerHTML = procs.map(p => {
          const stateCol = p.state==='running' ? '#30D158' : p.state==='zombie' ? '#FF453A' : '#636366';
          const isCur = pm.scheduler.current?.pid === p.pid;
          return `<div style="display:grid;grid-template-columns:48px 1fr 60px 60px 70px 80px;gap:4px;padding:3px 4px;border-radius:4px;background:${isCur?'rgba(255,255,255,0.05)':'transparent'}">
            <span style="color:var(--text-muted)">${p.pid}</span>
            <span style="color:${p.color||'var(--text)'};font-weight:${isCur?'600':'400'}">${isCur?'▶ ':''}${p.name}</span>
            <span style="color:${p.cpuPct>20?'#FF9F0A':'var(--text-dim)'}">${p.cpuPct.toFixed(1)}%</span>
            <span style="color:var(--text-dim)">${p.memMB}MB</span>
            <span style="color:${stateCol}">${p.state}</span>
            <span style="color:var(--text-muted)">${p.uptimeStr}</span>
          </div>`;
        }).join('');

        // Memory map
        const segs = mem.getMap();
        const total = mem.totalMB;
        memMap.innerHTML = segs.map((s,i) =>
          `<div title="${s.name}: ${s.size}MB" style="flex:${Math.max(s.size/total*100,0.5)};background:${SEG_COLORS[i%SEG_COLORS.length]};opacity:${s.type==='kernel'?.5:.8};min-width:2px"></div>`
        ).join('') + `<div style="flex:${mem.freeMB/total*100};background:rgba(255,255,255,0.04)"></div>`;

        memLeg.innerHTML = segs.slice(0,6).map((s,i) =>
          `<span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:${SEG_COLORS[i%SEG_COLORS.length]};display:inline-block"></span>${s.name}</span>`
        ).join('');

        memPct.textContent = `${mem.usedMB}MB / ${mem.totalMB}MB (${mem.usedPct}%)`;
        memBar.style.width = `${mem.usedPct}%`;
        memNums.textContent = `${mem.usedMB}MB used · ${mem.freeMB}MB free`;
      };

      refresh();
      this._interval = setInterval(refresh, 500);

      // cleanup on close
      window.EventBus?.on('window:close', ({ wid }) => {
        if (wid === winId) { clearInterval(this._interval); this._interval = null; }
      });
    }
  },

  // ── Connect ───────────────────────────────────────────────────
  connect: {
    id:    'connect',
    name:  'Connect',
    icon:  '&#9993;',
    memMB: 16,
    color: '#0A84FF',
    width: 380,
    height:420,

    render() {
      const links = [
        { name:'Email',    url:'mailto:ahmed.essam1418@gmail.com', handle:'ahmed.essam1418@gmail.com',
          icon:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 7l10 7 10-7" stroke="currentColor" stroke-width="1.5"/></svg>` },
        { name:'GitHub',   url:'https://github.com/A1medEssam',      handle:'github.com/A1medEssam',
          icon:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/></svg>` },
        { name:'X / Twitter', url:'https://x.com/a1medessam',        handle:'x.com/a1medessam',
          icon:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>` },
        { name:'Medium',   url:'https://medium.com/@a1medessam',      handle:'medium.com/@a1medessam',
          icon:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" fill="currentColor"/></svg>` },
        { name:'Kaggle',   url:'https://kaggle.com/a1medessam',        handle:'kaggle.com/a1medessam',
          icon:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.285.18.046.149.034.255-.036.315l-6.555 6.344 6.980 8.364c.095.104.117.226.07.330z" fill="currentColor"/></svg>` },
        { name:'LinkedIn', url:'https://linkedin.com/in/a1medessam',   handle:'linkedin.com/in/a1medessam',
          icon:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/></svg>` },
      ];

      return `
        <div style="padding:20px;overflow-y:auto;height:100%">
          <div style="font-size:9px;letter-spacing:4px;color:var(--text-muted);margin-bottom:16px">FIND ME ONLINE</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${links.map(l => `
              <a href="${l.url}" target="_blank" class="con-row"
                 style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;text-decoration:none;transition:all .18s">
                <span style="width:32px;height:32px;background:rgba(255,255,255,0.06);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--accent);flex-shrink:0">${l.icon}</span>
                <div>
                  <div style="font-size:12px;color:var(--text);font-weight:500;margin-bottom:1px">${l.name}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${l.handle}</div>
                </div>
                <span style="margin-left:auto;font-size:12px;color:var(--text-muted)">↗</span>
              </a>`).join('')}
          </div>
        </div>`;
    },

    mount(el) {
      el.querySelectorAll('.con-row').forEach(r => {
        r.addEventListener('mouseenter', () => { r.style.borderColor='rgba(255,255,255,0.2)'; r.style.background='rgba(255,255,255,0.08)'; });
        r.addEventListener('mouseleave', () => { r.style.borderColor='rgba(255,255,255,0.08)'; r.style.background='rgba(255,255,255,0.04)'; });
      });
    }
  },

  // ── Research ─────────────────────────────────────────────────
  research: {
    id:    'research',
    name:  'Research',
    icon:  '&#8711;',
    memMB: 24,
    color: '#64D2FF',
    width: 500,
    height:460,

    render() {
      const threads = [
        { title:'Arabic NLP & Language Understanding', tags:['LLMs','BERT','T5','RAG'], body:'Fine-tuned LLMs on Arabic. Offensive content detection across dialects. Text-to-SQL. Contextual embeddings, semantic parsing, RAG pipelines for Arabic corpora.' },
        { title:'Multimodal AI & Spatial Computing', tags:['CLIP','TTS/STT','VR','Unity'], body:'Vision-language models, VR environments with natural Arabic speech, image-to-text translation, cross-modal reasoning. Shipped NILE with Ministry of Tourism.' },
        { title:'High Performance Computing', tags:['CUDA','MPI','OpenMP','OpenACC'], body:'CUDA kernel optimization, parallel distributed training, memory-efficient inference, edge deployment strategies.' },
        { title:'Computer Vision & Generative Models', tags:['PyTorch','OpenCV','YOLOv8','GANs'], body:'CNNs, GANs, VAEs, Autoencoders. Image restoration, YOLOv8 detection, Pix2Pix generation, gesture recognition.' },
      ];
      return `
        <div style="padding:20px;overflow-y:auto;height:100%">
          ${threads.map(t => `
            <div style="margin-bottom:20px">
              <div style="font-size:12px;color:var(--accent);font-weight:500;margin-bottom:5px">${t.title}</div>
              <div style="font-size:11px;color:var(--text-dim);line-height:1.8;margin-bottom:7px">${t.body}</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px">${t.tags.map(tag =>
                `<span style="font-size:9px;padding:2px 8px;border-radius:10px;background:rgba(100,210,255,0.08);border:1px solid rgba(100,210,255,0.2);color:#64D2FF">${tag}</span>`
              ).join('')}</div>
              <div style="height:1px;background:rgba(255,255,255,0.06);margin-top:16px"></div>
            </div>`).join('')}
        </div>`;
    },
    mount() {}
  },

  // ── Stack ─────────────────────────────────────────────────────
  stack: {
    id:    'stack',
    name:  'Stack',
    icon:  '&#9881;',
    memMB: 16,
    color: '#FF9F0A',
    width: 440,
    height:380,

    render() {
      const sections = [
        { label:'LANGUAGES', chips:[['Python',true],['C',true],['C++',true],['C#',false],['JavaScript',false],['Solidity',false],['Fortran',false]] },
        { label:'AI / NLP / VISION', chips:[['PyTorch',true],['HuggingFace',true],['LangChain',true],['TensorFlow',false],['OpenCV',false],['YOLO',false],['Qdrant',false],['RAG',false]] },
        { label:'HPC / SYSTEMS', chips:[['CUDA',true],['MPI',true],['OpenMP',false],['OpenACC',false],['Linux',false],['Docker',false],['Git',false]] },
        { label:'CREATIVE / VR', chips:[['Unity',true],['Blender',true],['VR XR',false],['Photoshop',false],['Premiere',false]] },
      ];
      return `
        <div style="padding:20px;overflow-y:auto;height:100%">
          ${sections.map(s => `
            <div style="margin-bottom:18px">
              <div style="font-size:8px;letter-spacing:4px;color:var(--text-muted);margin-bottom:8px">${s.label}</div>
              <div style="display:flex;flex-wrap:wrap;gap:5px">
                ${s.chips.map(([name, hi]) => `
                  <span style="font-size:10px;padding:3px 11px;border-radius:20px;border:1px solid ${hi?'rgba(255,159,10,0.4)':'rgba(255,255,255,0.1)'};color:${hi?'#FF9F0A':'var(--text-muted)'};background:${hi?'rgba(255,159,10,0.08)':'rgba(255,255,255,0.03)'}">${name}</span>
                `).join('')}
              </div>
            </div>`).join('')}
        </div>`;
    },
    mount() {}
  },
};

window.Apps = Apps;
