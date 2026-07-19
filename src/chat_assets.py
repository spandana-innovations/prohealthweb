# chat widget assets
CHAT_CSS = '''
  .chat-fab{position:fixed;right:22px;bottom:22px;z-index:80;width:62px;height:62px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,var(--blue-lt),var(--blue) 55%,var(--navy-2));color:#fff;box-shadow:0 12px 32px rgba(7,57,95,.38);display:grid;place-items:center;transition:transform .18s}
  .chat-fab:hover{transform:scale(1.07)}
  .chat-fab svg{width:28px;height:28px}
  .chat-fab .ping{position:absolute;inset:0;border-radius:50%;border:2px solid var(--sky);animation:ping 2.6s ease-out infinite}
  @keyframes ping{0%{transform:scale(1);opacity:.7}80%,100%{transform:scale(1.45);opacity:0}}
  .chat-panel{position:fixed;right:22px;bottom:98px;z-index:80;width:min(400px,calc(100vw - 24px));height:min(760px,calc(100vh - 128px));background:#fff;border-radius:22px;box-shadow:0 24px 60px rgba(7,57,95,.32);display:none;flex-direction:column;overflow:hidden;border:1px solid var(--line)}
  .chat-panel.open{display:flex}
  .chat-head{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--navy) 0%,var(--blue-dark) 60%,var(--blue) 100%);color:#fff;padding:13px 14px 13px 16px;display:flex;align-items:center;gap:11px;min-height:60px}
  .chat-head::after{content:"";position:absolute;inset:0;background-image:var(--noise);opacity:.6;pointer-events:none}
  .chat-head>*{position:relative;z-index:1}
  .chat-logo{height:24px;width:auto;opacity:.98;flex:none}
  .chat-head .meta{line-height:1.3;min-width:0;flex:1;display:flex;flex-direction:column;justify-content:center}
  .chat-head b{font-family:var(--font-nav);font-size:.88rem;display:block;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .chat-head small{font-size:.7rem;color:#BFDCF0;display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden}
  .chat-head small span:last-child{overflow:hidden;text-overflow:ellipsis}
  .chat-head .live{width:7px;height:7px;border-radius:50%;flex:none;background:#57D08D;box-shadow:0 0 0 0 rgba(87,208,141,.7);animation:live 2s infinite}
  .chat-head .live.off{background:var(--amber);box-shadow:none;animation:none}
  @keyframes live{0%{box-shadow:0 0 0 0 rgba(87,208,141,.6)}70%{box-shadow:0 0 0 7px rgba(87,208,141,0)}100%{box-shadow:0 0 0 0 rgba(87,208,141,0)}}
  .chat-close{margin-left:4px;flex:none;background:none;border:none;color:#fff;cursor:pointer;font-size:1.35rem;line-height:1;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;opacity:.85;transition:background .15s,opacity .15s}
  .chat-close:hover{opacity:1;background:rgba(255,255,255,.15)}
  .chat-hours{background:var(--ice);border-bottom:1px solid var(--line);padding:8px 16px;font-size:.72rem;color:var(--navy-2);display:flex;align-items:center;gap:7px}
  .chat-hours svg{width:13px;height:13px;color:var(--blue);flex:none}
  .chat-body{flex:1;overflow-y:auto;padding:16px;background:var(--ice-2);background-image:var(--noise);display:flex;flex-direction:column;gap:10px}
  .msg{max-width:88%;padding:10px 13px;border-radius:14px;font-size:.89rem;line-height:1.5;animation:pop .22s ease}
  @keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .msg.bot{background:#fff;border:1px solid var(--line);border-bottom-left-radius:5px;align-self:flex-start;color:var(--ink)}
  .msg.user{background:var(--blue);color:#fff;border-bottom-right-radius:5px;align-self:flex-end}
  .msg.note{background:var(--butter);border:1px solid #EBD9A8;color:var(--butter-ink);font-size:.85rem;align-self:stretch;max-width:100%;border-radius:12px}
  .chat-options{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:94%}
  .chat-opt{font:inherit;font-family:var(--font-nav);font-size:.76rem;font-weight:600;color:var(--blue-dark);background:#fff;border:1px solid var(--sky);border-radius:999px;padding:5px 11px;cursor:pointer;transition:all .15s;line-height:1.35}
  .chat-opt:hover{background:var(--blue);border-color:var(--blue);color:#fff;transform:translateY(-1px)}
  .chat-form{display:flex;flex-direction:column;gap:8px;align-self:stretch;background:#fff;border:1px solid var(--line);border-radius:15px;padding:14px}
  .chat-form label{font-size:.76rem;font-weight:600;color:var(--slate);font-family:var(--font-nav)}
  .chat-form input{font:inherit;font-size:.92rem;padding:10px 12px;border:1px solid var(--g200);border-radius:9px;width:100%;background:var(--g50)}
  .chat-form input:focus{outline:2px solid var(--blue);border-color:var(--blue);background:#fff}
  .chat-form .btn{padding:11px;border-radius:9px;font-size:.92rem}
  .typing{display:inline-flex;gap:4px;align-items:center;padding:13px 16px}
  .typing i{width:7px;height:7px;border-radius:50%;background:#9DB4C8;animation:blink 1.2s infinite}
  .typing i:nth-child(2){animation-delay:.2s}.typing i:nth-child(3){animation-delay:.4s}
  @keyframes blink{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
  .chat-cta{display:flex;align-items:center;gap:10px;padding:9px 12px;background:linear-gradient(135deg,var(--ice-2),var(--ice));border-top:1px solid var(--line)}
  .chat-cta p{flex:1;font-size:.74rem;color:var(--slate);line-height:1.35}
  .chat-cta p b{color:var(--navy);font-family:var(--font-nav)}
  .chat-cta button{flex:none;font:inherit;font-family:var(--font-nav);font-size:.79rem;font-weight:600;color:#fff;
    background:linear-gradient(135deg,var(--blue-lt),var(--blue));border:none;border-radius:999px;padding:9px 15px;cursor:pointer;
    box-shadow:0 4px 12px rgba(19,138,192,.32);transition:transform .16s,box-shadow .16s;white-space:nowrap}
  .chat-cta button:hover{transform:translateY(-1px);box-shadow:0 7px 18px rgba(19,138,192,.45)}
  .chat-cta.done{background:var(--mint);border-top-color:#9FD8C4}
  .chat-cta.done p{color:var(--mint-ink)}
  .chat-cta.done p b{color:var(--mint-ink)}
  .chat-composer{display:flex;gap:8px;padding:10px 12px;background:#fff;border-top:1px solid var(--line)}
  .chat-composer input{flex:1;font:inherit;font-size:.92rem;padding:11px 14px;border:1px solid var(--g200);border-radius:999px;background:var(--g50)}
  .chat-composer input:focus{outline:2px solid var(--blue);border-color:var(--blue);background:#fff}
  .send-btn{width:42px;height:42px;border-radius:50%;border:none;background:var(--blue);color:#fff;cursor:pointer;display:grid;place-items:center;flex:none;transition:background .15s,transform .15s}
  .send-btn:hover{background:var(--blue-dark);transform:scale(1.05)}
  .send-btn svg{width:18px;height:18px}
  .chat-note{font-size:.7rem;color:var(--slate);text-align:center;padding:8px 14px;background:var(--g50);border-top:1px solid var(--line)}
  @media (max-width:760px){
    /* the call bar owns the chat on mobile: no floating bubble */
    .chat-fab{display:none!important}
    .chat-panel{right:10px;left:10px;width:auto;
      bottom:calc(74px + env(safe-area-inset-bottom));
      height:min(74vh,calc(100vh - 156px));border-radius:18px}
    .chat-cta{flex-direction:column;align-items:stretch;gap:8px}
    .chat-cta button{width:100%}
  }
'''

CHAT_HTML = '''
<button class="chat-fab" onclick="toggleChat()" aria-label="Open care guide chat">
  <span class="ping" aria-hidden="true"></span>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.7 8.7 0 0 1-3.6-.8L3 21l1.9-5.7a8.3 8.3 0 0 1-.9-3.8A8.4 8.4 0 0 1 12.5 3a8.4 8.4 0 0 1 8.5 8.5z"/></svg>
</button>
<div class="chat-panel" id="chatPanel" role="dialog" aria-label="ProHealth Care Guide">
  <div class="chat-head">
    <img class="chat-logo" src="__LOGO_WHITE__" alt="ProHealth Home Care" onerror="this.style.display='none'">
    <div class="meta"><b>Care Guide</b><small><span class="live" id="chatLive"></span><span id="chatStatus">Checking hours…</span></small></div>
    <button class="chat-close" onclick="toggleChat()" aria-label="Close chat">&times;</button>
  </div>
  <div class="chat-hours" id="chatHours">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
    <span id="chatHoursText">Mon–Fri 8:30am–5:00pm PT · 24/7 on-call for patients</span>
  </div>
  <div class="chat-body" id="chatBody"></div>
  <div class="chat-cta" id="chatCta">
    <p><b>Prefer a call?</b> <span id="ctaSub">Leave your number, no obligation.</span></p>
    <button type="button" onclick="ctaCallback()">Request a callback</button>
  </div>
  <form class="chat-composer" onsubmit="return sendFree(event)">
    <input id="freeInput" placeholder="Type your question…" autocomplete="off" aria-label="Type your question">
    <button class="send-btn" type="submit" aria-label="Send">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
    </button>
  </form>
  <div class="chat-note">Your information is only used to connect you with our care team. Please don't share medical details here.</div>
</div>
'''
