import { LOGO_DATA, ICON_DATA } from './admin-assets.js';

export const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ProHealth Admin</title>
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="${ICON_DATA}">
<meta name="theme-color" content="#0B3A52">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{
  --blue:#138AC0;--blue-dark:#0F6A94;--blue-lt:#2EAFEA;--navy:#0B3A52;--navy-2:#114E6B;--sky:#8FD1EF;
  --ice:#E9F6FC;--ice-2:#F4FBFE;
  --g50:#F8FAFB;--g100:#F1F4F7;--g200:#E4E9EF;--slate:#5D6E80;--ink:#0F2233;--line:#E1E8EF;
  --mint:#E4F5EE;--mint-ink:#2F7A63;--peach:#FDEEE4;--peach-ink:#B0663C;
  --lilac:#EEEBFA;--lilac-ink:#5B4FA3;--butter:#FDF4DF;--butter-ink:#96702A;
  --red:#FDECEC;--red-ink:#C0392B;
  --display:"Bricolage Grotesque","Outfit",system-ui,sans-serif;
  --nav:"Outfit",system-ui,sans-serif;--body:"Inter",system-ui,sans-serif;
  --shadow-soft:0 6px 20px rgba(11,58,82,.08);
  --noise:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.035'/%3E%3C/svg%3E");
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--body);color:var(--ink);-webkit-font-smoothing:antialiased;
  padding-bottom:calc(24px + env(safe-area-inset-bottom));line-height:1.6;
  background:
    radial-gradient(1100px 560px at 100% -8%, rgba(143,209,239,.28), transparent 55%),
    radial-gradient(900px 520px at -10% 8%, rgba(19,138,192,.10), transparent 50%),
    linear-gradient(180deg, var(--ice-2) 0%, var(--g50) 42%, var(--g100) 100%);
  background-attachment:fixed}
:focus-visible{outline:3px solid var(--blue);outline-offset:2px;border-radius:6px}
a{color:var(--blue-dark)}
h1,h2,h3{font-family:var(--display);color:var(--navy);letter-spacing:-.01em}
header{position:sticky;top:0;z-index:30;overflow:hidden;
  background:linear-gradient(135deg,var(--navy) 0%,var(--navy-2) 58%,var(--blue-dark) 100%);
  color:#fff;padding:13px 18px;display:flex;align-items:center;gap:13px;min-height:62px}
header::after{content:"";position:absolute;inset:0;background-image:var(--noise);pointer-events:none}
header>*{position:relative;z-index:1}
header img{height:30px;width:auto}
.hbadge{font-family:var(--nav);font-size:.64rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);padding:3px 9px;border-radius:999px}
.help{width:26px;height:26px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);
  color:#CFE4F3;cursor:pointer;display:grid;place-items:center;flex:none;padding:0;transition:all .15s}
.help:hover{background:rgba(255,255,255,.24);color:#fff}
.help svg{width:15px;height:15px}
/* help document (in the modal) */
.help-doc{padding:22px 26px;background:#fff;height:100%;overflow:auto;color:var(--ink)}
.help-doc>*{max-width:760px;margin-left:auto;margin-right:auto}
.help-lead{font-size:.95rem;color:var(--slate);line-height:1.6;margin-bottom:4px}
.help-doc h3{font-family:var(--display);font-size:1.06rem;color:var(--navy);margin:20px 0 8px;padding-top:16px;border-top:1px solid var(--line)}
.help-doc h3 svg{width:18px;height:18px;color:var(--blue);vertical-align:-3px;margin-right:5px}
.help-doc p{font-size:.9rem;line-height:1.65;margin:6px 0}
.help-doc ul{margin:6px 0;padding-left:20px}
.help-doc li{font-size:.9rem;line-height:1.6;margin:5px 0}
.help-foot{margin-top:22px;padding-top:14px;border-top:1px solid var(--line);color:var(--slate);font-size:.85rem}
header .sp{margin-left:auto;display:flex;align-items:center;gap:9px}
.clock{font-family:var(--nav);display:inline-flex;flex-direction:column;align-items:flex-end;line-height:1.08;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);padding:4px 11px;border-radius:10px;color:#fff}
.clock b{font-size:.82rem;font-weight:700;letter-spacing:.02em;font-variant-numeric:tabular-nums}
.clock .clbl{font-size:.55rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#9FBBD0}
.clock b{display:flex;align-items:center}
.sdot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;flex:none;background:#8494A2}
.sdot.open{background:#57D08D;box-shadow:0 0 0 0 rgba(87,208,141,.6);animation:live 2s infinite}
.sdot.closed{background:#F0645A;animation:none}
.clock.closed .clbl{color:#FBB;letter-spacing:.02em;text-transform:none;font-size:.6rem}
@media(max-width:560px){.clock{padding:4px 9px}}
.sync{font-family:var(--nav);font-size:.7rem;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);
  padding:4px 10px;border-radius:999px;color:#CFE4F3;display:inline-flex;align-items:center;gap:6px}
.sync .dot{width:6px;height:6px;border-radius:50%;background:#57D08D;animation:live 2s infinite}
@keyframes live{0%,100%{opacity:1}50%{opacity:.35}}
.who{font-family:var(--nav);font-size:.74rem;color:#9FBBD0;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.out{width:32px;height:32px;border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);
  color:#CFE4F3;cursor:pointer;display:grid;place-items:center;flex:none;transition:all .15s}
.out:hover{background:rgba(255,255,255,.22);color:#fff}
.out svg{width:16px;height:16px}
nav.tabs{position:sticky;top:62px;z-index:29;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);
  border-bottom:1px solid var(--line);display:flex;gap:2px;padding:0 10px;overflow-x:auto;-webkit-overflow-scrolling:touch}
nav.tabs button{flex:none;font:inherit;font-family:var(--nav);font-weight:600;font-size:.85rem;color:var(--slate);
  background:none;border:none;border-bottom:2.5px solid transparent;padding:14px 13px;cursor:pointer;white-space:nowrap;
  display:inline-flex;align-items:center;gap:7px;transition:color .15s}
nav.tabs button svg{width:15px;height:15px;opacity:.6}
nav.tabs button:hover{color:var(--blue-dark)}
nav.tabs button.on{color:var(--blue);border-bottom-color:var(--blue)}
nav.tabs button.on svg{opacity:1}
nav.tabs .pill{background:var(--blue);color:#fff;font-size:.64rem;font-weight:700;padding:1px 6px;border-radius:999px;min-width:17px;text-align:center}
nav.tabs .pill.zero{background:var(--g200);color:var(--slate)}
nav.tabs .pill.alert{background:var(--red-ink)}
main{padding:18px;max-width:1180px;margin:0 auto}
.hello{margin-bottom:16px}
.hello h1{font-size:1.5rem;margin-bottom:2px}
.hello p{font-size:.88rem;color:var(--slate)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
.stat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;cursor:pointer;
  transition:transform .18s,box-shadow .18s,border-color .18s}
.stat:hover{transform:translateY(-3px);box-shadow:var(--shadow-soft);border-color:var(--blue)}
.stat .si{width:34px;height:34px;border-radius:10px;background:var(--ice);color:var(--blue);
  display:grid;place-items:center;margin-bottom:10px}
.stat .si svg{width:17px;height:17px}
.stat:nth-child(2) .si{background:var(--mint);color:var(--mint-ink)}
.stat:nth-child(3) .si{background:var(--peach);color:var(--peach-ink)}
.stat:nth-child(4) .si{background:var(--lilac);color:var(--lilac-ink)}
.stat b{display:block;font-family:var(--display);font-size:1.9rem;font-weight:700;color:var(--navy);line-height:1}
.stat span{font-size:.76rem;color:var(--slate)}
.stat.alert{border-color:#E9A0A0;background:linear-gradient(180deg,#fff,var(--red))}
.stat.alert .si{background:var(--red);color:var(--red-ink)}
.stat.alert b{color:var(--red-ink)}
.panel{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px 22px;margin-bottom:14px}
.panel>h2{font-size:1.06rem;margin-bottom:3px;display:flex;align-items:center;gap:9px}
.panel>h2 .pi{width:30px;height:30px;border-radius:9px;background:var(--ice);color:var(--blue);display:grid;place-items:center;flex:none}
.panel>h2 .pi svg{width:15px;height:15px}
.panel>p.sub{font-size:.82rem;color:var(--slate);margin-bottom:15px}
.todo{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;
  margin-bottom:8px;transition:all .16s;cursor:pointer;background:#fff}
.todo:hover{border-color:var(--blue);background:var(--ice-2);transform:translateX(3px)}
.todo .ti{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--ice);color:var(--blue)}
.todo.urgent .ti{background:var(--red);color:var(--red-ink)}
.todo.warn .ti{background:var(--butter);color:var(--butter-ink)}
.todo .ti svg{width:16px;height:16px}
.todo b{display:block;font-family:var(--nav);font-size:.9rem;color:var(--navy);line-height:1.3}
.todo small{font-size:.76rem;color:var(--slate)}
.todo .go{margin-left:auto;color:var(--slate);flex:none}
.todo .go svg{width:16px;height:16px}
.all-clear{text-align:center;padding:26px;color:var(--mint-ink);background:var(--mint);border-radius:12px;font-size:.9rem}
.all-clear b{display:block;font-family:var(--display);font-size:1.05rem;margin-bottom:3px;color:var(--mint-ink)}
.bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.bar input[type=search]{flex:1;min-width:160px;font:inherit;font-size:.88rem;padding:10px 13px 10px 36px;
  border:1px solid var(--g200);border-radius:11px;
  background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235D6E80' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E") no-repeat 12px center/15px}
.bar input[type=search]:focus{outline:2px solid var(--blue);border-color:var(--blue)}
.frow{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:9px}
.flbl{font-family:var(--nav);font-size:.66rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:var(--slate);min-width:58px}
.chip{font:inherit;font-family:var(--nav);font-size:.78rem;font-weight:600;background:#fff;border:1px solid var(--g200);
  color:var(--navy);padding:6px 12px;border-radius:999px;cursor:pointer;transition:all .15s}
.chip:hover{border-color:var(--blue);background:var(--ice)}
.chip.on{background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 4px 12px rgba(19,138,192,.28)}
.fcount{font-family:var(--nav);font-size:.78rem;color:var(--slate);margin-left:auto}
.btn{font:inherit;font-family:var(--nav);font-weight:600;font-size:.83rem;padding:9px 15px;border-radius:10px;
  border:1px solid var(--g200);background:#fff;color:var(--navy);cursor:pointer;transition:all .15s;
  display:inline-flex;align-items:center;gap:7px;line-height:1.2;text-decoration:none}
.btn:hover{border-color:var(--blue);background:var(--ice);transform:translateY(-1px)}
.btn.pri{background:linear-gradient(135deg,var(--blue-lt),var(--blue) 60%,var(--blue-dark));border-color:transparent;
  color:#fff;box-shadow:0 6px 16px rgba(19,138,192,.3)}
.btn.pri:hover{box-shadow:0 9px 22px rgba(19,138,192,.42)}
.btn.danger{background:var(--red-ink);border-color:var(--red-ink);color:#fff}
.btn.danger:hover{background:#a5301f;border-color:#a5301f}
.btn.sm{padding:6px 11px;font-size:.76rem}
.btn svg{width:14px;height:14px}
/* admin accounts panel */
.arow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:11px 0;border-bottom:1px solid var(--line)}
.arow:last-child{border-bottom:none}
.ainfo{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}
.ainfo b{font-family:var(--nav);font-size:.88rem;color:var(--navy);word-break:break-all}
.aacts{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}
.atag{font-family:var(--nav);font-size:.63rem;font-weight:700;padding:2px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.05em}
.atag.ok{background:var(--mint);color:var(--mint-ink)}
.atag.pend{background:var(--butter);color:var(--butter-ink)}
.atag.off{background:var(--g100);color:var(--slate)}
.atag.own{background:var(--navy);color:#fff}
.atag.role{background:var(--ice);color:var(--blue-dark)}
.aemail{font-size:.76rem;color:var(--slate)}
.nafield{display:flex;align-items:stretch;margin-top:6px;border:1px solid var(--g200);border-radius:9px;background:var(--g50);overflow:hidden}
.nafield:focus-within{outline:2px solid var(--blue);border-color:var(--blue)}
.nafield input{border:none;outline:none;background:transparent;flex:1;font:inherit;font-size:.9rem;padding:10px 12px;margin:0}
.nasuffix{display:flex;align-items:center;padding:0 12px;background:var(--g100);color:var(--slate);font-family:var(--nav);font-size:.85rem;font-weight:600;border-left:1px solid var(--g200)}
.mini{font:inherit;font-family:var(--nav);font-weight:600;font-size:.74rem;padding:5px 10px;border-radius:8px;
  border:1px solid var(--g200);background:#fff;color:var(--slate);cursor:pointer;transition:all .15s}
.mini:hover{border-color:var(--blue);color:var(--blue-dark);background:var(--ice)}
.mini.danger{color:var(--red-ink);border-color:#E6C4C0}
.mini.danger:hover{background:var(--red);border-color:var(--red-ink)}
.addbox{margin-top:16px;padding-top:16px;border-top:1px dashed var(--g200)}
.addbox input{width:100%;font:inherit;font-size:.9rem;padding:10px 12px;border:1px solid var(--g200);border-radius:9px;background:var(--g50);margin-top:6px}
.addbox input:focus{outline:2px solid var(--blue);border-color:var(--blue);background:#fff}
.modes{display:flex;flex-direction:column;gap:5px;margin-top:10px}
.rad{display:flex;align-items:center;gap:8px;font-family:var(--body);font-size:.83rem;font-weight:500;color:var(--ink);margin:0;cursor:pointer}
.rad input{width:auto;margin:0}
.warnbox{background:var(--butter);border:1px solid #E9D6A6;color:var(--butter-ink);padding:9px 12px;border-radius:9px;font-size:.8rem;margin-bottom:12px}
/* contact push row */
.pushrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px dashed var(--g200)}
.pushlbl{font-family:var(--nav);font-size:.74rem;font-weight:700;color:var(--slate);text-transform:uppercase;letter-spacing:.05em}
/* résumé modal */
.modal[hidden]{display:none}
.modal{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;padding:20px}
.modal-bd{position:absolute;inset:0;background:rgba(11,58,82,.55);backdrop-filter:blur(3px)}
.modal-box{position:relative;background:#fff;border-radius:16px;box-shadow:0 30px 80px rgba(11,58,82,.4);
  width:min(900px,100%);height:min(88vh,900px);display:flex;flex-direction:column;overflow:hidden}
.modal-hd{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--line);background:var(--g50)}
.modal-hd span{font-family:var(--nav);font-weight:600;color:var(--navy);font-size:.92rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.modal-x{width:32px;height:32px;border:none;background:var(--g100);border-radius:8px;font-size:1.3rem;line-height:1;color:var(--slate);cursor:pointer}
.modal-x:hover{background:var(--red);color:var(--red-ink)}
.modal-body{flex:1;background:var(--g100)}
.modal-body iframe{width:100%;height:100%;border:none;display:block}
.editform{padding:20px 22px;background:#fff;height:100%;overflow:auto}
.editform label{display:block;font-family:var(--nav);font-size:.76rem;font-weight:600;color:var(--slate);margin:12px 0 5px}
.editform label:first-child{margin-top:0}
.editform input,.editform textarea{width:100%;font:inherit;font-size:.9rem;padding:10px 12px;border:1px solid var(--g200);border-radius:9px;background:var(--g50)}
.editform input:focus,.editform textarea:focus{outline:2px solid var(--blue);border-color:var(--blue);background:#fff}
.editbtns{display:flex;gap:8px;margin-top:18px}
/* per-record action row */
.acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid var(--line)}
.tag.archived{background:var(--g100);color:var(--slate)}
/* activity log */
.logwrap{overflow-x:auto;border:1px solid var(--line);border-radius:11px}
table.log{width:100%;border-collapse:collapse;font-size:.8rem}
table.log th{text-align:left;font-family:var(--nav);font-size:.68rem;text-transform:uppercase;letter-spacing:.05em;color:var(--slate);background:var(--g50);padding:9px 11px;position:sticky;top:0}
table.log td{padding:9px 11px;border-top:1px solid var(--line);color:var(--ink);vertical-align:top}
table.log td.lw{white-space:nowrap;color:var(--slate)}
table.log td.ld{color:var(--slate);max-width:280px;word-break:break-word}
table.log tbody tr:hover{background:var(--ice-2)}
table.log .act.del{color:var(--red-ink)}
table.log .act.add{color:var(--mint-ink)}
table.log .act.upd{color:var(--blue-dark)}
table.log .act.neu{color:var(--slate)}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin-bottom:10px;
  transition:box-shadow .16s}
.card:hover{box-shadow:var(--shadow-soft)}
.card.is-new{border-left:3px solid var(--blue)}
.card .top{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap}
.card h3{font-family:var(--nav);font-size:1rem;font-weight:600;margin-bottom:2px}
.card .meta{font-size:.76rem;color:var(--slate)}
.card .right{margin-left:auto;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.tag{font-family:var(--nav);font-size:.65rem;font-weight:700;padding:3px 9px;border-radius:6px;
  background:var(--ice);color:var(--blue-dark);text-transform:uppercase;letter-spacing:.05em}
.tag.new{background:var(--blue);color:#fff}
.tag.contacted{background:var(--butter);color:var(--butter-ink)}
.tag.converted{background:var(--mint);color:var(--mint-ink)}
.tag.closed{background:var(--g100);color:var(--slate)}
.tag.due{background:var(--red-ink);color:#fff}
.card .body{margin-top:11px;font-size:.85rem}
.kv{display:flex;gap:8px;margin-top:4px;align-items:baseline}
.kv b{font-family:var(--nav);color:var(--navy);font-weight:600;min-width:76px;font-size:.78rem}
.kv span{color:var(--slate)}
select.st{font:inherit;font-family:var(--nav);font-size:.76rem;font-weight:600;padding:6px 26px 6px 11px;
  border:1px solid var(--g200);border-radius:999px;color:var(--navy);cursor:pointer;
  -webkit-appearance:none;appearance:none;
  background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23138AC0' stroke-width='2.4' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 9px center/12px}
select.st:focus{outline:2px solid var(--blue);border-color:var(--blue)}
.note{width:100%;font:inherit;font-size:.83rem;padding:9px 11px;border:1px solid var(--g200);border-radius:10px;
  margin-top:11px;background:var(--g50);resize:vertical;font-family:var(--body)}
.note:focus{outline:2px solid var(--blue);background:#fff}
a.tel{color:var(--blue-dark);text-decoration:none;font-weight:600}
a.tel:hover{text-decoration:underline}
.empty{text-align:center;padding:48px 20px;color:var(--slate);font-size:.88rem;
  background:#fff;border:1px dashed var(--g200);border-radius:16px}
.empty b{display:block;font-family:var(--display);color:var(--navy);font-size:1.05rem;margin-bottom:6px}
.err{background:var(--red);border:1px solid #E9A0A0;color:var(--red-ink);padding:12px 14px;border-radius:11px;
  font-size:.84rem;margin-bottom:12px}
.ok{background:var(--mint);color:var(--mint-ink);padding:10px 13px;border-radius:10px;font-size:.83rem;margin-top:10px}
.erase{border:1px solid #E9A0A0;background:linear-gradient(180deg,#fff,var(--red));border-radius:14px;padding:16px;margin-top:12px}
.erase h4{font-family:var(--nav);font-size:.88rem;color:var(--red-ink);margin-bottom:4px;display:flex;align-items:center;gap:7px}
.erase h4 svg{width:15px;height:15px}
.erase p{font-size:.79rem;color:var(--slate);margin-bottom:11px}
.found{background:#fff;border:1px solid var(--g200);border-radius:10px;padding:11px 13px;margin-bottom:10px;font-size:.81rem}
.found .fr{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--g100)}
.found .fr:last-child{border-bottom:none}
.found .fr b{font-family:var(--nav);color:var(--navy);font-weight:600}
.found .fr span{color:var(--slate)}
.echk{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:11px}
.echk label{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;color:var(--navy);cursor:pointer;font-family:var(--nav)}
.cfg label{display:block;font-family:var(--nav);font-size:.74rem;font-weight:600;color:var(--slate);margin:12px 0 5px}
.cfg input,.cfg textarea{width:100%;font:inherit;font-size:.87rem;padding:10px 12px;border:1px solid var(--g200);
  border-radius:10px;background:var(--g50);font-family:var(--body)}
.cfg input:focus,.cfg textarea:focus{outline:2px solid var(--blue);background:#fff}
.cfg textarea{font-family:ui-monospace,Menlo,monospace;font-size:.79rem;line-height:1.55}
.row{display:grid;grid-template-columns:1fr 1fr;gap:11px}
/* holidays editor */
.holrows{display:flex;flex-direction:column;gap:8px;margin:10px 0 12px}
.holrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.holrow input{font:inherit;font-size:.87rem;padding:9px 11px;border:1px solid var(--g200);border-radius:9px;background:var(--g50);font-family:var(--body)}
.holrow input:focus{outline:2px solid var(--blue);background:#fff}
.holrow input[type=date]{width:150px;flex:none}
.holrow input[type=text]{flex:1;min-width:120px}
.hwd{font-family:var(--nav);font-size:.72rem;font-weight:700;color:var(--slate);min-width:40px;text-align:center}
.hshift{background:var(--butter);color:var(--butter-ink);border:1px solid #E9D6A6;border-radius:999px;padding:7px 11px;font-family:var(--nav);font-size:.72rem;font-weight:600;cursor:pointer;white-space:nowrap}
.hshift:hover{filter:brightness(.97)}
.holbtns{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px}
.holload{display:flex;gap:6px;align-items:center;margin-left:auto}
.obspanel{margin-top:16px;padding-top:14px;border-top:1px dashed var(--g200)}
.obspanel h4{font-family:var(--nav);font-size:.86rem;color:var(--navy);margin-bottom:2px}
.obssub{font-size:.76rem;color:var(--slate);margin-bottom:10px}
.obsrow{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line);font-size:.84rem}
.obsrow:last-child{border-bottom:none}
.obsrow>span:first-child{min-width:150px;color:var(--slate)}
.obsrow b{color:var(--navy);font-family:var(--nav);font-weight:600}
.obsrow.warn b{color:var(--red-ink)}
.obswarn{margin-left:auto;font-size:.72rem;color:var(--red-ink);font-weight:700}
@media(max-width:560px){.holrow input[type=date]{width:100%}.holload{margin-left:0}}
.op{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:9px}
.op.off{opacity:.55;background:var(--g50)}
.op .hd{display:flex;gap:10px;align-items:center}
.op input[type=text]{font:inherit;font-size:.87rem;padding:10px 12px;border:1px solid var(--g200);
  border-radius:10px;background:var(--g50);font-family:var(--body)}
.op input[type=text]:focus{outline:2px solid var(--blue);background:#fff}
.op .hd input[type=text]{flex:1;font-family:var(--nav);font-weight:600;font-size:.92rem}
.sw{position:relative;width:42px;height:24px;flex:none}
.sw input{opacity:0;width:0;height:0}
.sw span{position:absolute;inset:0;background:var(--g200);border-radius:999px;cursor:pointer;transition:.2s}
.sw span::before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}
.sw input:checked+span{background:var(--blue)}
.sw input:checked+span::before{transform:translateX(18px)}
.chips2{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.chips2 label{font-family:var(--nav);font-size:.71rem;font-weight:600;padding:4px 9px;border-radius:7px;
  background:var(--g100);color:var(--slate);cursor:pointer;border:1px solid transparent}
.chips2 input{display:none}
.chips2 label:has(input:checked){background:var(--ice);border-color:var(--sky);color:var(--blue-dark)}
.spin{display:inline-block;width:15px;height:15px;border:2px solid var(--g200);border-top-color:var(--blue);
  border-radius:50%;animation:sp .7s linear infinite;vertical-align:-2px}
@keyframes sp{to{transform:rotate(360deg)}}
@media (max-width:820px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .row{grid-template-columns:1fr}
  .card .right{margin-left:0;width:100%}
  main{padding:13px}
  .flbl{min-width:0;width:100%;margin-bottom:-3px}
  .fcount{margin-left:0;width:100%}
}
</style></head><body>

<header>
  <img src="${LOGO_DATA}" alt="ProHealth">
  <span class="hbadge">Admin</span>
  <button class="help" id="help" title="How to use this dashboard" aria-label="Help"></button>
  <div class="sp">
    <span class="clock" id="clock" title="Current Pacific time"><b><span class="sdot" id="sdot"></span><span id="clockTx">--:--:--</span></b><span class="clbl" id="clbl">ProHealth PST Time</span></span>
    <span class="who" id="who"></span>
    <button class="out" id="out" title="Sign out" aria-label="Sign out">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
    </button>
  </div>
</header>

<nav class="tabs" id="tabs"></nav>
<main id="view"><div class="empty"><span class="spin"></span></div></main>

<div class="modal" id="modal" hidden>
  <div class="modal-bd" onclick="closeModal()"></div>
  <div class="modal-box">
    <div class="modal-hd"><span id="modalTitle">Résumé</span>
      <a id="modalOpen" class="btn sm" href="#" target="_blank" rel="noopener">Open in new tab</a>
      <button class="modal-x" onclick="closeModal()" aria-label="Close">&times;</button></div>
    <div class="modal-body" id="modalBody"></div>
  </div>
</div>

<script>
const I = {
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9h13v-9"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>',
  brief:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  cog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.13.3.35.55.63.72"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9z"/></svg>',
  mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>'
};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api = async (path, opts) => {
  const r = await fetch('/admin/api' + path, Object.assign({ headers:{'Content-Type':'application/json'} }, opts || {}));
  if (r.status === 401 || r.status === 403) { location.href = '/admin'; throw new Error('signed out'); }
  if (!r.ok) throw new Error((await r.text()).slice(0,160) || ('HTTP ' + r.status));
  return r.json();
};
const D = (iso) => iso ? new Date(iso.replace(' ','T') + (iso.indexOf('Z') > -1 ? '' : 'Z')) : null;
const fmt = (iso) => { const d = D(iso); return d ? new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(d) : ''; };
const ago = (iso) => { const d = D(iso); if(!d) return '';
  const s = (Date.now() - d) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago'; };

let TAB = 'overview', DATA = {leads:[],applications:[],data_requests:[]}, C = {}, Q = '';
let F = { leads:{status:'all',type:'all'}, contacts:{status:'all'}, callbacks:{status:'all'}, applications:{status:'all',role:'All',office:'All',resume:'all'}, requests:{status:'all',due:'all'} };
function tabList(){
  const t = [['overview','Overview','home'],['leads','Leads','users'],['callbacks','Callbacks','phone'],['contacts','Contacts','mail'],
             ['applications','Applicants','brief'],['openings','Openings','list'],['requests','Data requests','lock'],['settings','Settings','cog']];
  if (DATA.super) { t.push(['admins','Admins','users']); t.push(['audit','Activity','doc']); }
  return t;
}

function paintTabs(){
  $('tabs').innerHTML = tabList().map(function(t){
    const k = t[0], l = t[1], ic = t[2];
    let pill = '';
    if (k === 'leads' || k === 'contacts' || k === 'callbacks' || k === 'applications' || k === 'requests') {
      const n = C[k] || 0;
      const isAlert = k === 'requests' && (C.overdue || 0) > 0;
      pill = '<span class="pill ' + (isAlert ? 'alert' : (n ? '' : 'zero')) + '">' + n + '</span>';
    }
    return '<button class="' + (TAB === k ? 'on' : '') + '" data-t="' + k + '">' + I[ic] + l + pill + '</button>';
  }).join('');
  Array.prototype.forEach.call($('tabs').querySelectorAll('button'), function(b){
    b.onclick = function(){ TAB = b.dataset.t; Q = ''; paintTabs(); render(); };
  });
}

const isContactRow  = function(x){ return (x.type||'') === 'contact'; };
const isCallbackRow = function(x){ return (x.type||'') === 'callback'; };
const isPlainLead   = function(x){ return !isContactRow(x) && !isCallbackRow(x); };
function computeCounts(){
  C = { leads:     DATA.leads.filter(function(x){return x.status==='new' && isPlainLead(x);}).length,
        callbacks: DATA.leads.filter(function(x){return x.status==='new' && isCallbackRow(x);}).length,
        contacts:  DATA.leads.filter(function(x){return x.status==='new' && isContactRow(x);}).length,
        applications: DATA.applications.filter(function(x){return x.status==='new';}).length,
        requests:  DATA.data_requests.filter(function(x){return x.status==='new';}).length,
        overdue:   DATA.data_requests.filter(function(x){return x.status==='new' && x.due_by && new Date(x.due_by) < new Date();}).length };
}
async function load(){
  try {
    const d = await api('/all');
    DATA = d;
    computeCounts();
    $('who').textContent = d.user || '';
    paintTabs(); render();
  } catch(e) {
    $('view').innerHTML = '<div class="err"><b>Could not load.</b><br>' + esc(e.message) + '</div>';
  }
}

/* ---------------- overview ---------------- */
function greet(){ const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function go(t){ TAB = t; Q = ''; paintTabs(); render(); scrollTo({top:0,behavior:'smooth'}); }
function statCard(ic, n, label, tab, isAlert){
  return '<div class="stat' + (isAlert ? ' alert' : '') + '" onclick="go(\\'' + tab + '\\')"><span class="si">' + I[ic] + '</span><b>' + n + '</b><span>' + label + '</span></div>';
}
function renderOverview(){
  const L = DATA.leads, A = DATA.applications, R = DATA.data_requests;
  const day = L.filter(function(x){ return Date.now() - D(x.created_at) < 864e5; }).length;
  const week = L.filter(function(x){ return Date.now() - D(x.created_at) < 7*864e5; }).length;
  const overdue = R.filter(function(x){ return x.status==='new' && x.due_by && new Date(x.due_by) < new Date(); });
  const dueSoon = R.filter(function(x){ return x.status==='new' && x.due_by && overdue.indexOf(x)===-1 && (new Date(x.due_by)-Date.now())/864e5 < 10; });
  const newLeads = L.filter(function(x){ return x.status==='new'; });
  const stale = newLeads.filter(function(x){ return Date.now() - D(x.created_at) > 2*3600e3; });
  const newApps = A.filter(function(x){ return x.status==='new'; });

  const todos = [];
  overdue.forEach(function(r){ todos.push(['urgent','alert','Data request ' + esc(r.ref||'') + ' is OVERDUE',
    esc(r.name) + ' &middot; legal deadline was ' + fmt(r.due_by), 'requests']); });
  dueSoon.forEach(function(r){ todos.push(['warn','clock','Data request ' + esc(r.ref||'') + ' due in ' + Math.ceil((new Date(r.due_by)-Date.now())/864e5) + ' days',
    esc(r.name) + ' &middot; ' + esc(r.request_type||''), 'requests']); });
  if (stale.length) todos.push(['warn','phone', stale.length + ' lead' + (stale.length>1?'s':'') + ' waiting more than 2 hours',
    'The site promises a 2 hour reply during business hours', 'leads']);
  else if (newLeads.length) todos.push(['','phone', newLeads.length + ' new lead' + (newLeads.length>1?'s':'') + ' to call',
    'Nothing overdue yet', 'leads']);
  if (newApps.length) todos.push(['','brief', newApps.length + ' new applicant' + (newApps.length>1?'s':''),
    'The careers page promises a call within one business day', 'applications']);

  $('view').innerHTML =
    '<div class="hello"><h1>' + greet() + '</h1><p>' + (todos.length ? 'Here is what needs you today.' : 'Nothing outstanding. Everything is answered.') + '</p></div>'
    + '<div class="stats">'
      + statCard('phone', C.leads||0, 'New leads', 'leads', stale.length > 0)
      + statCard('users', day, 'Leads today', 'leads', false)
      + statCard('brief', C.applications||0, 'New applicants', 'applications', false)
      + statCard('lock', overdue.length, 'Overdue requests', 'requests', overdue.length > 0)
    + '</div>'
    + '<div class="panel"><h2><span class="pi">' + I.check + '</span>Outstanding</h2>'
      + '<p class="sub">Everything waiting on a person, most urgent first.</p>'
      + (todos.length
          ? todos.map(function(t){ return '<div class="todo ' + t[0] + '" onclick="go(\\'' + t[4] + '\\')"><span class="ti">' + I[t[1]] + '</span><span><b>' + t[2] + '</b><small>' + t[3] + '</small></span><span class="go">' + I.chev + '</span></div>'; }).join('')
          : '<div class="all-clear"><b>All clear</b>No overdue requests, no unanswered leads, no waiting applicants.</div>')
    + '</div>'
    + '<div class="panel"><h2><span class="pi">' + I.clock + '</span>Latest activity</h2>'
      + '<p class="sub">The last ten things that happened, across everything.</p>' + recent() + '</div>'
    + '<div class="panel"><h2><span class="pi">' + I.cog + '</span>This week</h2>'
      + '<p class="sub">' + week + ' lead' + (week===1?'':'s') + ' in the last seven days &middot; '
      + L.filter(function(x){return x.status==='converted';}).length + ' converted all time &middot; '
      + A.length + ' applicant' + (A.length===1?'':'s') + ' on file</p></div>';
}
function recent(){
  const all = []
    .concat(DATA.leads.map(function(x){ return {t:x.created_at,k:'lead',n:x.name,d:x.service||x.type||''}; }))
    .concat(DATA.applications.map(function(x){ return {t:x.created_at,k:'applicant',n:x.name,d:x.role||''}; }))
    .concat(DATA.data_requests.map(function(x){ return {t:x.created_at,k:'data request',n:x.name,d:x.request_type||''}; }))
    .filter(function(x){ return x.t; }).sort(function(a,b){ return D(b.t) - D(a.t); }).slice(0,10);
  if (!all.length) return '<div class="empty" style="padding:24px"><b>Nothing yet</b>New submissions appear here the moment they arrive.</div>';
  return all.map(function(x){
    const ic = x.k === 'lead' ? 'phone' : x.k === 'applicant' ? 'brief' : 'lock';
    return '<div class="todo" style="cursor:default"><span class="ti">' + I[ic] + '</span><span><b>' + esc(x.n) + '</b><small>' + esc(x.k) + (x.d ? ' &middot; ' + esc(x.d) : '') + '</small></span><span class="go" style="font-size:.75rem;font-family:var(--nav)">' + ago(x.t) + '</span></div>';
  }).join('');
}

/* ---------------- lists ---------------- */
const STATUSES = ['new','contacted','converted','closed'];
const STATUS_CHIPS = [['all','All'],['new','New'],['contacted','Contacted'],['converted','Converted'],['closed','Closed'],['archived','Archived']];
const ROLE_GROUPS = [['All','All roles'],['Nursing','Nursing'],['Therapy','Therapy'],['Care','Aides & care'],['Office','Office & social']];
function roleGroup(t){
  t = (t||'').toLowerCase();
  if (/\\b(rn|lvn|lpn|nurse|nursing)\\b/.test(t)) return 'Nursing';
  if (/therap|physical|occupational|speech|slp|\\bpt\\b|\\bot\\b/.test(t)) return 'Therapy';
  if (/aide|hha|caregiver|companion/.test(t)) return 'Care';
  return 'Office';
}
function setF(k,f,v){ F[k][f] = v; render(); }
function chips(key, field, opts){
  return opts.map(function(o){
    const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
    return '<button class="chip' + (F[key][field] === v ? ' on' : '') + '" onclick="setF(\\'' + key + '\\',\\'' + field + '\\',\\'' + v + '\\')">' + l + '</button>';
  }).join('');
}
function filterRows(){
  const q = Q.toLowerCase().trim();
  const rows = TAB === 'leads' ? DATA.leads.filter(isPlainLead)
             : TAB === 'callbacks' ? DATA.leads.filter(isCallbackRow)
             : TAB === 'contacts' ? DATA.leads.filter(isContactRow)
             : TAB === 'applications' ? DATA.applications : DATA.data_requests;
  const f = F[TAB] || {};
  return rows.filter(function(r){
    if (f.status === 'all' || !f.status) { if (r.status === 'archived') return false; }   // hide archived unless asked
    else if (r.status !== f.status) return false;
    if (TAB === 'leads' && f.type !== 'all' && r.type !== f.type) return false;
    if (TAB === 'applications') {
      if (f.role !== 'All' && roleGroup(r.role) !== f.role) return false;
      if (f.office !== 'All' && (r.office||'') !== f.office) return false;
      if (f.resume === 'yes' && !r.resume_key) return false;
      if (f.resume === 'no' && r.resume_key) return false;
    }
    if (TAB === 'requests') {
      const od = r.status === 'new' && r.due_by && new Date(r.due_by) < new Date();
      if (f.due === 'overdue' && !od) return false;
      if (f.due === 'soon' && !(r.status==='new' && r.due_by && !od && (new Date(r.due_by)-Date.now())/864e5 < 10)) return false;
    }
    if (!q) return true;
    return JSON.stringify(r).toLowerCase().indexOf(q) > -1;
  });
}
function renderList(){
  const rows = filterRows();
  let filters = '';
  if (TAB === 'leads') {
    filters = '<div class="frow"><span class="flbl">Status</span>' + chips('leads','status',STATUS_CHIPS) + '</div>'
            + '<div class="frow"><span class="flbl">Type</span>' + chips('leads','type',[['all','All'],['referral','Referral'],['lead','Other']])
            + '<span class="fcount">' + rows.length + ' of ' + DATA.leads.filter(isPlainLead).length + '</span></div>';
  } else if (TAB === 'callbacks') {
    filters = '<div class="frow"><span class="flbl">Status</span>' + chips('callbacks','status',STATUS_CHIPS)
            + '<span class="fcount">' + rows.length + ' of ' + DATA.leads.filter(isCallbackRow).length + '</span></div>';
  } else if (TAB === 'contacts') {
    filters = '<div class="frow"><span class="flbl">Status</span>' + chips('contacts','status',STATUS_CHIPS)
            + '<span class="fcount">' + rows.length + ' of ' + DATA.leads.filter(isContactRow).length + '</span></div>';
  } else if (TAB === 'applications') {
    const offices = ['All'].concat(DATA.applications.map(function(a){return a.office;}).filter(function(v,i,s){ return v && s.indexOf(v)===i; }));
    filters = '<div class="frow"><span class="flbl">Status</span>' + chips('applications','status',STATUS_CHIPS) + '</div>'
            + '<div class="frow"><span class="flbl">Role</span>' + chips('applications','role',ROLE_GROUPS) + '</div>'
            + '<div class="frow"><span class="flbl">Office</span>' + chips('applications','office',offices) + '</div>'
            + '<div class="frow"><span class="flbl">Resume</span>' + chips('applications','resume',[['all','Any'],['yes','Attached'],['no','Missing']])
            + '<span class="fcount">' + rows.length + ' of ' + DATA.applications.length + '</span></div>';
  } else {
    filters = '<div class="frow"><span class="flbl">Status</span>' + chips('requests','status',STATUS_CHIPS) + '</div>'
            + '<div class="frow"><span class="flbl">Deadline</span>' + chips('requests','due',[['all','Any'],['overdue','Overdue'],['soon','Due soon']])
            + '<span class="fcount">' + rows.length + ' of ' + DATA.data_requests.length + '</span></div>';
  }
  $('view').innerHTML =
    '<div class="bar"><input type="search" id="q" placeholder="Search name, phone, email&hellip;" value="' + esc(Q) + '">'
    + '<button class="btn" onclick="load()">Refresh</button>'
    + '<button class="btn" onclick="exportCsv()">' + I.down + 'CSV</button></div>'
    + filters
    + (rows.length ? rows.map(cardFor).join('')
       : '<div class="empty"><b>Nothing here</b>New submissions appear here the moment they arrive.</div>');
  const q = $('q');
  if (q) q.oninput = function(){ Q = q.value; renderList(); const n = $('q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
}
function stSel(id, cur, kind){
  const opts = cur === 'archived' ? STATUSES.concat(['archived']) : STATUSES;
  return '<select class="st" onchange="setStatus(\\'' + kind + '\\',\\'' + id + '\\',this.value)">'
    + opts.map(function(s){ return '<option value="' + s + '"' + (cur===s?' selected':'') + '>' + s.charAt(0).toUpperCase() + s.slice(1) + '</option>'; }).join('')
    + '</select>';
}
/* per-record actions: Edit / Archive-Unarchive / Delete */
function cardActions(kind, r){
  const arch = r.status === 'archived';
  return '<div class="acts">'
    + '<button class="mini" onclick="openEdit(\\'' + kind + '\\',\\'' + r.id + '\\')">Edit</button>'
    + (arch
        ? '<button class="mini" onclick="setStatus(\\'' + kind + '\\',\\'' + r.id + '\\',\\'new\\')">Unarchive</button>'
        : '<button class="mini" onclick="setStatus(\\'' + kind + '\\',\\'' + r.id + '\\',\\'archived\\')">Archive</button>')
    + '<button class="mini danger" onclick="deleteRow(\\'' + kind + '\\',\\'' + r.id + '\\')">Delete</button>'
    + '</div>';
}
const EDIT_FIELDS = {
  leads:        [['name','Name'],['phone','Phone'],['email','Email'],['service','Service / topic'],['message','Message','textarea']],
  applications: [['name','Name'],['phone','Phone'],['email','Email'],['role','Role'],['office','Office'],['license','License']],
  requests:     [['name','Name'],['email','Email'],['phone','Phone'],['request_type','Request type'],['relationship','Relationship'],['dob','DOB'],['details','Details','textarea']],
};
function epOf(kind){ return (kind === 'contacts' || kind === 'callbacks') ? 'leads' : kind; }
function keyOf(ep){ return ep === 'requests' ? 'data_requests' : ep; }
function openEdit(kind, id){
  const ep = epOf(kind), r = (DATA[keyOf(ep)] || []).filter(function(x){ return x.id === id; })[0];
  if (!r) return;
  const form = (EDIT_FIELDS[ep] || []).map(function(fld){
    const v = r[fld[0]] == null ? '' : r[fld[0]];
    return '<label>' + fld[1] + '</label>' + (fld[2] === 'textarea'
      ? '<textarea id="ef_' + fld[0] + '" rows="3">' + esc(v) + '</textarea>'
      : '<input id="ef_' + fld[0] + '" value="' + esc(v) + '">');
  }).join('');
  $('modalTitle').textContent = 'Edit record';
  $('modalOpen').style.display = 'none';
  $('modalBody').innerHTML = '<div class="editform">' + form
    + '<div class="editbtns"><button class="btn pri" onclick="saveEdit(\\'' + ep + '\\',\\'' + id + '\\')">' + I.check + 'Save changes</button>'
    + '<button class="btn" onclick="closeModal()">Cancel</button></div><div id="editMsg"></div></div>';
  $('modal').hidden = false; document.body.style.overflow = 'hidden';
}
async function saveEdit(ep, id){
  const body = {};
  (EDIT_FIELDS[ep] || []).forEach(function(fld){ const el = $('ef_' + fld[0]); if (el) body[fld[0]] = el.value; });
  try { await api('/' + ep + '/' + id, {method:'PATCH', body:JSON.stringify(body)}); closeModal(); await load(); }
  catch(e){ const t = $('editMsg'); if (t) t.innerHTML = '<div class="err">' + esc(e.message) + '</div>'; }
}
async function deleteRow(kind, id){
  if (!confirm('Delete this record permanently?\\n\\nThis cannot be undone. It is written to the activity log.')) return;
  try { await api('/' + epOf(kind) + '/' + id, {method:'DELETE'}); await load(); }
  catch(e){ alert(e.message); }
}
async function setStatus(kind, id, status){
  const ep = (kind === 'contacts' || kind === 'callbacks') ? 'leads' : kind;   // contacts & callbacks live in the leads table
  await api('/' + ep + '/' + id, {method:'PATCH', body:JSON.stringify({status:status})});
  const key = ep === 'requests' ? 'data_requests' : ep;
  const row = DATA[key].filter(function(x){ return x.id === id; })[0];
  if (row) row.status = status;
  computeCounts();
  paintTabs(); renderList();
}
let noteT;
function saveNote(kind, id, v){
  clearTimeout(noteT);
  noteT = setTimeout(function(){ api('/' + kind + '/' + id, {method:'PATCH', body:JSON.stringify({notes:v})}).catch(function(){}); }, 600);
}
function cardFor(r){
  const isNew = r.status === 'new';
  if (TAB === 'leads' || TAB === 'callbacks') return '<div class="card' + (isNew?' is-new':'') + '"><div class="top">'
    + '<div><h3>' + esc(r.name) + '</h3><div class="meta">' + fmt(r.created_at) + ' &middot; ' + ago(r.created_at) + (r.page ? ' &middot; ' + esc(r.page) : '') + '</div></div>'
    + '<div class="right"><span class="tag ' + esc(r.status) + '">' + esc(r.status) + '</span>' + stSel(r.id, r.status, TAB) + '</div></div>'
    + '<div class="body"><div class="kv"><b>Phone</b><span><a class="tel" href="tel:' + esc(r.phone) + '">' + esc(r.phone) + '</a></span></div>'
    + (r.email ? '<div class="kv"><b>Email</b><span><a class="tel" href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></span></div>' : '')
    + '<div class="kv"><b>Service</b><span>' + esc(r.service||'-') + ' &middot; ' + esc(r.type||'-') + '</span></div>'
    + (r.message ? '<div class="kv"><b>Message</b><span>' + esc(r.message) + '</span></div>' : '') + '</div>'
    + '<textarea class="note" placeholder="Notes (saved automatically)" oninput="saveNote(\\'leads\\',\\'' + r.id + '\\',this.value)">' + esc(r.notes) + '</textarea>' + cardActions(TAB, r) + '</div>';

  if (TAB === 'contacts') return '<div class="card' + (isNew?' is-new':'') + '"><div class="top">'
    + '<div><h3>' + esc(r.name) + '</h3><div class="meta">' + fmt(r.created_at) + ' &middot; ' + ago(r.created_at) + (r.page ? ' &middot; ' + esc(r.page) : '') + '</div></div>'
    + '<div class="right"><span class="tag ' + esc(r.status) + '">' + esc(r.status) + '</span>' + stSel(r.id, r.status, 'contacts') + '</div></div>'
    + '<div class="body"><div class="kv"><b>Phone</b><span><a class="tel" href="tel:' + esc(r.phone) + '">' + esc(r.phone) + '</a></span></div>'
    + (r.email ? '<div class="kv"><b>Email</b><span><a class="tel" href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></span></div>' : '')
    + (r.service ? '<div class="kv"><b>Topic</b><span>' + esc(r.service) + '</span></div>' : '')
    + (r.message ? '<div class="kv"><b>Message</b><span>' + esc(r.message) + '</span></div>' : '') + '</div>'
    + '<div class="pushrow"><span class="pushlbl">Push to</span>'
    + '<button class="btn sm" onclick="pushContact(\\'' + r.id + '\\',\\'leads\\')">' + I.users + 'Leads</button>'
    + '<button class="btn sm" onclick="pushContact(\\'' + r.id + '\\',\\'applications\\')">' + I.brief + 'Applicants</button></div>'
    + '<textarea class="note" placeholder="Notes (saved automatically)" oninput="saveNote(\\'leads\\',\\'' + r.id + '\\',this.value)">' + esc(r.notes) + '</textarea>' + cardActions('contacts', r) + '</div>';

  if (TAB === 'applications') return '<div class="card' + (isNew?' is-new':'') + '"><div class="top">'
    + '<div><h3>' + esc(r.name) + '</h3><div class="meta">' + fmt(r.created_at) + ' &middot; ' + ago(r.created_at) + '</div></div>'
    + '<div class="right"><span class="tag ' + esc(r.status) + '">' + esc(r.status) + '</span>' + stSel(r.id, r.status, 'applications')
    + (r.resume_key ? '<button class="btn sm pri" onclick="openResume(\\'' + esc(r.resume_key) + '\\')">' + I.doc + 'Resume</button>' : '<span class="tag closed">no resume</span>')
    + '</div></div>'
    + '<div class="body"><div class="kv"><b>Phone</b><span><a class="tel" href="tel:' + esc(r.phone) + '">' + esc(r.phone) + '</a></span></div>'
    + (r.email ? '<div class="kv"><b>Email</b><span><a class="tel" href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></span></div>' : '')
    + '<div class="kv"><b>Role</b><span>' + esc(r.role||'-') + (r.office ? ' &middot; ' + esc(r.office) : '') + '</span></div>'
    + (r.license ? '<div class="kv"><b>License</b><span>' + esc(r.license) + '</span></div>' : '') + '</div>'
    + '<textarea class="note" placeholder="Interview notes (saved automatically)" oninput="saveNote(\\'applications\\',\\'' + r.id + '\\',this.value)">' + esc(r.notes) + '</textarea>' + cardActions('applications', r) + '</div>';

  const od = r.status === 'new' && r.due_by && new Date(r.due_by) < new Date();
  const days = r.due_by ? Math.ceil((new Date(r.due_by) - Date.now())/864e5) : null;
  return '<div class="card' + (isNew?' is-new':'') + '"><div class="top">'
    + '<div><h3>' + esc(r.name) + ' <span class="tag">' + esc(r.ref) + '</span></h3>'
    + '<div class="meta">' + fmt(r.created_at) + ' &middot; ' + esc(r.relationship) + '</div></div>'
    + '<div class="right">' + (od ? '<span class="tag due">overdue</span>' : (days !== null ? '<span class="tag' + (days < 10 ? ' contacted' : '') + '">' + days + 'd left</span>' : ''))
    + '<span class="tag ' + esc(r.status) + '">' + esc(r.status) + '</span>' + stSel(r.id, r.status, 'requests') + '</div></div>'
    + '<div class="body"><div class="kv"><b>Request</b><span>' + esc(r.request_type||'-') + '</span></div>'
    + '<div class="kv"><b>Email</b><span><a class="tel" href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a></span></div>'
    + (r.phone ? '<div class="kv"><b>Phone</b><span>' + esc(r.phone) + '</span></div>' : '')
    + (r.dob ? '<div class="kv"><b>DOB</b><span>' + esc(r.dob) + '</span></div>' : '')
    + (r.is_agent ? '<div class="kv"><b>Agent</b><span>Submitted by an authorised agent, written authorisation required</span></div>' : '')
    + (r.details ? '<div class="kv"><b>Details</b><span>' + esc(r.details) + '</span></div>' : '')
    + '<div class="kv"><b>Due by</b><span>' + (r.due_by ? fmt(r.due_by) : '-') + ' &middot; 45 calendar days (CCPA)</span></div></div>'
    + eraseBox(r)
    + '<textarea class="note" placeholder="Privacy Officer notes (saved automatically)" oninput="saveNote(\\'requests\\',\\'' + r.id + '\\',this.value)">' + esc(r.notes) + '</textarea>' + cardActions('requests', r) + '</div>';
}

/* ---------------- find & erase ---------------- */
function eraseBox(r){
  const id = 'er_' + String(r.id).replace(/[^\\w]/g,'');
  return '<div class="erase"><h4>' + I.trash + 'Erase this person&rsquo;s data</h4>'
    + '<p>Finds everything held against <b>' + esc(r.email) + '</b> and deletes it permanently. '
    + 'The request itself is kept: it is your evidence that you complied.</p>'
    + '<button class="btn" onclick="findFor(\\'' + esc(r.email) + '\\',\\'' + id + '\\')">' + I.search + 'Find their data</button>'
    + '<div id="' + id + '"></div></div>';
}
async function findFor(email, boxId){
  const box = $(boxId);
  box.innerHTML = '<div style="padding:10px"><span class="spin"></span> Searching&hellip;</div>';
  try {
    const d = await api('/find?email=' + encodeURIComponent(email));
    const resumes = d.applications.filter(function(a){ return a.resume_key; }).length;
    if (!d.leads.length && !d.applications.length) {
      box.innerHTML = '<div class="ok" style="margin-top:10px">Nothing erasable found for ' + esc(email) + '. '
        + 'Only the request itself (' + d.data_requests.length + ') is on file, and that is kept as your compliance record.</div>';
      return;
    }
    box.innerHTML = '<div class="found" style="margin-top:10px">'
      + '<div class="fr"><b>Leads / enquiries</b><span>' + d.leads.length + '</span></div>'
      + '<div class="fr"><b>Job applications</b><span>' + d.applications.length + '</span></div>'
      + '<div class="fr"><b>Resume files</b><span>' + resumes + '</span></div>'
      + '<div class="fr"><b>Data requests (kept)</b><span>' + d.data_requests.length + '</span></div></div>'
      + '<div class="echk">'
      + '<label><input type="checkbox" id="' + boxId + '_l" ' + (d.leads.length ? 'checked' : 'disabled') + '> Leads</label>'
      + '<label><input type="checkbox" id="' + boxId + '_a" ' + (d.applications.length ? 'checked' : 'disabled') + '> Applications</label>'
      + '<label><input type="checkbox" id="' + boxId + '_r" ' + (resumes ? 'checked' : 'disabled') + '> Resume files</label>'
      + '</div>'
      + '<button class="btn danger" onclick="doErase(\\'' + esc(email) + '\\',\\'' + boxId + '\\')">' + I.trash + 'Erase permanently</button>';
  } catch(e) { box.innerHTML = '<div class="err" style="margin-top:10px">' + esc(e.message) + '</div>'; }
}
async function doErase(email, boxId){
  const what = [];
  if ($(boxId + '_l') && $(boxId + '_l').checked) what.push('leads');
  if ($(boxId + '_a') && $(boxId + '_a').checked) what.push('applications');
  if ($(boxId + '_r') && $(boxId + '_r').checked) what.push('resumes');
  if (!what.length) { alert('Nothing selected.'); return; }
  if (!confirm('Permanently erase ' + what.join(', ') + ' for ' + email + '?\\n\\nThis cannot be undone. It will be written to the audit log.')) return;
  const box = $(boxId);
  box.innerHTML = '<div style="padding:10px"><span class="spin"></span> Erasing&hellip;</div>';
  try {
    const d = await api('/erase', {method:'POST', body:JSON.stringify({email:email, what:what})});
    box.innerHTML = '<div class="ok" style="margin-top:10px"><b>Erased.</b> '
      + Object.keys(d.deleted).map(function(k){ return d.deleted[k] + ' ' + k; }).join(', ')
      + '. Recorded in the audit log. Reply to ' + esc(email) + ' to confirm, then mark the request Converted.</div>';
    await load();
  } catch(e) { box.innerHTML = '<div class="err" style="margin-top:10px">' + esc(e.message) + '</div>'; }
}

function exportCsv(){
  const rows = filterRows();
  if (!rows.length) { alert('Nothing to export.'); return; }
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(',')].concat(rows.map(function(r){
    return cols.map(function(c){ return '"' + String(r[c] == null ? '' : r[c]).replace(/"/g,'""') + '"'; }).join(',');
  })).join('\\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = 'prohealth-' + TAB + '-' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
}

/* ---------------- openings ---------------- */
const OFFICES = ['Sacramento','Walnut Creek','San Jose','Stockton','Monterey','Fresno'];
let OPEN = [], OPHOST = 'view';
async function loadOpenings(host){
  OPHOST = host || 'view';
  const el = $(OPHOST); if (!el) return;
  el.innerHTML = '<div class="empty"><span class="spin"></span></div>';
  try { const d = await api('/openings'); OPEN = d.openings || []; }
  catch(e) { el.innerHTML = '<div class="err">' + esc(e.message) + '</div>'; return; }
  paintOpenings();
}
function paintOpenings(){
  const live = OPEN.filter(function(o){ return o.active !== false; }).length;
  $(OPHOST).innerHTML = '<div class="panel"><h2><span class="pi">' + I.list + '</span>Job openings</h2>'
    + '<p class="sub">These publish straight to the careers page. Toggle a role off to hide it without losing it, or remove it entirely. '
    + '<b>' + live + ' live</b> of ' + OPEN.length + ' right now. The site updates within a minute of saving, no deploy needed.</p>'
    + '<div id="ops">' + OPEN.map(opRow).join('') + '</div>'
    + '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">'
    + '<button class="btn" onclick="addOp()">+ Add a role</button>'
    + '<button class="btn pri" onclick="saveOps()">' + I.check + 'Save and publish</button></div>'
    + '<div id="opok"></div></div>';
}
function opRow(o, i){
  return '<div class="op' + (o.active === false ? ' off' : '') + '"><div class="hd">'
    + '<input type="text" value="' + esc(o.title) + '" oninput="OPEN[' + i + '].title=this.value" placeholder="Role title">'
    + '<label class="sw" title="Show on the site"><input type="checkbox" ' + (o.active !== false ? 'checked' : '')
    + ' onchange="OPEN[' + i + '].active=this.checked;paintOpenings()"><span></span></label>'
    + '<button class="btn sm" onclick="removeOp(' + i + ')">' + I.trash + '</button></div>'
    + '<div class="row" style="margin-top:9px">'
    + '<input type="text" value="' + esc(o.type) + '" oninput="OPEN[' + i + '].type=this.value" placeholder="Full-time / Part-time / Per-diem">'
    + '<input type="text" value="' + esc(o.summary) + '" oninput="OPEN[' + i + '].summary=this.value" placeholder="One-line summary">'
    + '</div><div class="chips2">'
    + OFFICES.map(function(of){
        return '<label><input type="checkbox" ' + ((o.offices||[]).indexOf(of) > -1 ? 'checked' : '')
             + ' onchange="toggleOffice(' + i + ',\\'' + of + '\\',this.checked)"><span>' + of + '</span></label>';
      }).join('')
    + '</div></div>';
}
function removeOp(i){
  if (!confirm('Remove "' + (OPEN[i].title || 'this role') + '"?\\n\\nIt disappears from the careers page as soon as you save.')) return;
  OPEN.splice(i,1); paintOpenings();
}
function toggleOffice(i, of, on){
  const a = OPEN[i].offices = OPEN[i].offices || [];
  if (on) { if (a.indexOf(of) === -1) a.push(of); }
  else { OPEN[i].offices = a.filter(function(x){ return x !== of; }); }
}
function addOp(){ OPEN.push({title:'',type:'Full-time',summary:'',offices:[],active:true}); paintOpenings(); }
async function saveOps(){
  try {
    const d = await api('/openings', {method:'PUT', body:JSON.stringify({openings:OPEN})});
    $('opok').innerHTML = '<div class="ok">Saved. ' + d.count + ' role' + (d.count===1?'':'s') + ' on file. The careers page updates within a minute.</div>';
  } catch(e) { $('opok').innerHTML = '<div class="err">' + esc(e.message) + '</div>'; }
}

/* ---------------- holidays / observed closures editor ---------------- */
let HOLS = [];
const WDN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function parseHolsText(text){
  const out = [];
  String(text||'').split('\\n').forEach(function(line){
    const m = /^\\s*(\\d{4}-\\d{2}-\\d{2})\\s*(?:=\\s*(.*))?$/.exec(line);
    if (m) out.push({ date:m[1], name:(m[2]||'').trim() });
  });
  return out;
}
function wdOf(date){ const d = new Date(date + 'T12:00:00Z'); return isNaN(d.getTime()) ? -1 : d.getUTCDay(); }
function niceDate(date){ const d = new Date(date + 'T12:00:00Z'); if (isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(d); }
function holsSorted(){ return HOLS.filter(function(h){ return h.date; }).slice().sort(function(a,b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); }
function holRow(h, i){
  const wd = wdOf(h.date), weekend = (wd === 0 || wd === 6);
  return '<div class="holrow">'
    + '<input type="date" value="' + esc(h.date) + '" onchange="HOLS[' + i + '].date=this.value;paintHols()">'
    + '<input type="text" value="' + esc(h.name) + '" placeholder="Holiday name" oninput="HOLS[' + i + '].name=this.value">'
    + (wd < 0 ? '<span class="hwd">&mdash;</span>'
       : weekend ? '<button class="hshift" title="Shift to the nearest weekday" onclick="shiftObs(' + i + ')">' + WDN[wd] + ' &rarr; observe ' + (wd === 6 ? 'Fri' : 'Mon') + '</button>'
                 : '<span class="hwd">' + WDN[wd] + '</span>')
    + '<button class="mini danger" onclick="removeHol(' + i + ')">Remove</button></div>';
}
function paintHols(){
  const host = $('holsHost'); if (!host) return;
  const rows = HOLS.map(holRow).join('') || '<p class="sub" style="margin:6px 0 0">No closures yet &mdash; add a day, or load the US federal holidays below.</p>';
  const obs = holsSorted().map(function(h){
    const weekend = (wdOf(h.date) === 0 || wdOf(h.date) === 6);
    return '<div class="obsrow' + (weekend ? ' warn' : '') + '"><span>' + esc(niceDate(h.date)) + '</span><b>' + esc(h.name || 'Holiday') + '</b>'
      + (weekend ? '<span class="obswarn">weekend &mdash; shift it</span>' : '') + '</div>';
  }).join('') || '<p class="obssub">Nothing scheduled.</p>';
  host.innerHTML = '<div class="panel cfg"><h2><span class="pi">' + I.list + '</span>Holidays &amp; office closures</h2>'
    + '<p class="sub">Days the office is closed. The dashboard clock, chatbot and footer use these. A holiday on a weekend should be observed on the nearest weekday &mdash; use the amber button to shift it.</p>'
    + '<div class="holrows">' + rows + '</div>'
    + '<div class="holbtns"><button class="btn" onclick="addHol()">+ Add a day</button>'
    + '<span class="holload"><select id="holYear" class="st"><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option></select>'
    + '<button class="btn" onclick="loadStd()">Load US federal holidays</button></span>'
    + '<button class="btn pri" onclick="saveHols()">' + I.check + 'Save closures</button></div>'
    + '<div id="holok"></div>'
    + '<div class="obspanel"><h4>Observed closures</h4><p class="obssub">The exact days you will be closed, in order.</p>' + obs + '</div></div>';
}
function addHol(){ HOLS.push({ date:'', name:'' }); paintHols(); }
function removeHol(i){ HOLS.splice(i, 1); paintHols(); }
function shiftObs(i){
  const wd = wdOf(HOLS[i].date); if (wd !== 0 && wd !== 6) return;
  const d = new Date(HOLS[i].date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + (wd === 6 ? -1 : 1));
  HOLS[i].date = d.toISOString().slice(0, 10);
  paintHols();
}
function nthWd(y, mo, wd, n){ let c = 0; for (let d = 1; d <= 31; d++){ const dt = new Date(Date.UTC(y, mo, d)); if (dt.getUTCMonth() !== mo) break; if (dt.getUTCDay() === wd){ c++; if (c === n) return dt; } } }
function lastWd(y, mo, wd){ let r; for (let d = 1; d <= 31; d++){ const dt = new Date(Date.UTC(y, mo, d)); if (dt.getUTCMonth() !== mo) break; if (dt.getUTCDay() === wd) r = dt; } return r; }
function observedDt(dt){ const w = dt.getUTCDay(); if (w === 6) return new Date(dt.getTime() - 864e5); if (w === 0) return new Date(dt.getTime() + 864e5); return dt; }
function isoD(dt){ return dt.toISOString().slice(0, 10); }
function fedHolidays(y){
  const fx = function(mo, da){ return observedDt(new Date(Date.UTC(y, mo, da))); };
  const tg = nthWd(y, 10, 4, 4);
  return [
    [fx(0,1),'New Year’s Day'], [nthWd(y,0,1,3),'Martin Luther King Jr. Day'], [nthWd(y,1,1,3),'Presidents’ Day'],
    [lastWd(y,4,1),'Memorial Day'], [fx(5,19),'Juneteenth'], [fx(6,4),'Independence Day'],
    [nthWd(y,8,1,1),'Labor Day'], [nthWd(y,9,1,2),'Indigenous Peoples’ / Columbus Day'], [fx(10,11),'Veterans Day'],
    [tg,'Thanksgiving Day'], [new Date(tg.getTime() + 864e5),'Day after Thanksgiving'], [fx(11,25),'Christmas Day'],
  ].map(function(x){ return { date:isoD(x[0]), name:x[1] }; });
}
function loadStd(){
  const y = parseInt(($('holYear') || {}).value || '2026', 10);
  const have = {}; HOLS.forEach(function(h){ have[h.date] = true; });
  fedHolidays(y).forEach(function(h){ if (!have[h.date]){ HOLS.push(h); have[h.date] = true; } });
  paintHols();
}
async function saveHols(){
  const list = holsSorted();
  const text = list.map(function(h){ return h.date + ' = ' + (h.name || 'Holiday'); }).join('\\n');
  try {
    await api('/config', {method:'PUT', body:JSON.stringify({HOLIDAYS_TEXT:text})});
    $('holok').innerHTML = '<div class="ok">Saved. ' + list.length + ' closure' + (list.length === 1 ? '' : 's') + ' on file.</div>';
    loadHours();
  } catch(e){ $('holok').innerHTML = '<div class="err">' + esc(e.message) + '</div>'; }
}

/* ---------------- settings ---------------- */
async function renderSettings(){
  $('view').innerHTML = '<div class="empty"><span class="spin"></span></div>';
  let c = {};
  try { c = await api('/config'); }
  catch(e) { $('view').innerHTML = '<div class="err">' + esc(e.message) + '</div>'; return; }
  const f = function(id, v, ph){ return '<input id="' + id + '" value="' + esc(v) + '" placeholder="' + ph + '">'; };
  $('view').innerHTML = '<div class="panel cfg"><h2><span class="pi">' + I.cog + '</span>Where leads are emailed</h2>'
    + '<p class="sub">Each kind of enquiry goes to the inbox you set here, the moment it arrives. Leave one blank to fall back to the default. Separate multiple addresses with commas.</p>'
    + '<div class="row"><div><label>Default (anything not matched below)</label>' + f('c_default', c.EMAIL_DEFAULT, 'intake@prohealth.us') + '</div>'
    + '<div><label>Intake and provider referrals</label>' + f('c_intake', c.EMAIL_INTAKE, 'intake@prohealth.us') + '</div></div>'
    + '<div class="row"><div><label>Hospice and palliative</label>' + f('c_hospice', c.EMAIL_HOSPICE, 'hospice@prohealth.us') + '</div>'
    + '<div><label>Careers and applications</label>' + f('c_careers', c.EMAIL_CAREERS, 'hr@prohealth.us') + '</div></div>'
    + '<div class="row"><div><label>Privacy and data requests</label>' + f('c_privacy', c.EMAIL_PRIVACY, 'privacy@prohealth.us') + '</div>'
    + '<div><label>From address (must be a verified Resend domain)</label>' + f('c_from', c.EMAIL_FROM, 'ProHealth &lt;no-reply@prohealth.us&gt;') + '</div></div>'
    + '<button class="btn pri" style="margin-top:14px" onclick="saveCfg()">' + I.check + 'Save routing</button><div id="cfgok"></div></div>'
    + '<div class="panel cfg"><h2><span class="pi">' + I.clock + '</span>Office hours</h2>'
    + '<p class="sub">Used by the dashboard clock, the chatbot and the footer. 24-hour, Pacific time.</p>'
    + '<div class="row"><div><label>Opens (Pacific)</label><input type="time" id="c_open" value="' + esc(c.HOURS_OPEN || '08:30') + '"></div>'
    + '<div><label>Closes (Pacific)</label><input type="time" id="c_close" value="' + esc(c.HOURS_CLOSE || '17:00') + '"></div></div>'
    + '<button class="btn pri" style="margin-top:14px" onclick="saveCfg()">' + I.check + 'Save hours</button><div id="cfgok2"></div></div>'
    + '<div id="holsHost"></div>';
  HOLS = parseHolsText(c.HOLIDAYS_TEXT);
  paintHols();
}

/* ---------------- admins tab (owner only) ---------------- */
function renderAdmins(){
  if (!DATA.super) { $('view').innerHTML = '<div class="err">Owner only.</div>'; return; }
  $('view').innerHTML = adminsPanelHTML();
  loadAdmins();
}

/* ---------------- activity / edit log tab (owner only) ---------------- */
function cap(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
function auditNoun(table){ return table === 'leads' ? 'a lead' : table === 'applications' ? 'an applicant' : table === 'data_requests' ? 'a data request' : table; }
function auditKind(a){ a = String(a || ''); if (/^(delete|erase)/i.test(a)) return 'del'; if (/^(add|invite|promote|set|send)/i.test(a)) return 'add'; if (/^(download|search)/i.test(a)) return 'neu'; return 'upd'; }
function auditAction(a){
  a = String(a || '');
  const map = {
    'update config':'Updated settings', 'update openings':'Updated job openings',
    'download resume':'Downloaded a résumé', 'promote contact to applicant':'Moved a contact to Applicants',
    'ERASE personal data':'Erased a person’s data', 'search by email':'Searched records by email',
    'send reset link':'Sent a password-reset link', 'set admin password':'Set an admin’s password',
    'remove admin':'Removed an admin', 'password set via reset link':'Set a password via email link',
    'add admin (magic link)':'Invited an admin by email', 'add admin (password set)':'Added an admin',
    'add admin (no notify)':'Added an admin (no email)',
  };
  if (map[a]) return map[a];
  const m = a.match(/^(delete|update)\\s+(leads|applications|data_requests)$/);
  if (m) return (m[1] === 'delete' ? 'Deleted ' : 'Updated ') + auditNoun(m[2]);
  return cap(a);
}
function auditName(id){
  const all = (DATA.leads||[]).concat(DATA.applications||[]).concat(DATA.data_requests||[]);
  const r = all.filter(function(x){ return x.id === id; })[0];
  return r ? (r.name || '') : '';
}
function auditTarget(action, target){
  target = String(target || '');
  if (!target) return '—';
  if (target.indexOf('resumes/') === 0) return target.split('/').pop().replace(/^[0-9a-fA-F-]{36}-/, '') || target;
  if (target.indexOf('@') > -1) return target;
  const nm = auditName(target);
  if (nm) return nm;
  if (/^[0-9a-f]{8}-[0-9a-f-]+$/i.test(target)) return 'record #' + target.slice(0, 8);
  return target;
}
function auditDetail(action, detail){
  detail = String(detail || '');
  if (!detail) return '';
  if (/^[A-Z_]+(,[A-Z_]+)*$/.test(detail)) {
    const L = {EMAIL_FROM:'Sender address',EMAIL_DEFAULT:'Default inbox',EMAIL_INTAKE:'Intake inbox',EMAIL_HOSPICE:'Hospice inbox',EMAIL_CAREERS:'Careers inbox',EMAIL_PRIVACY:'Privacy inbox',HOURS_OPEN:'Opening time',HOURS_CLOSE:'Closing time',HOLIDAYS_TEXT:'Holiday closures'};
    return 'Changed: ' + detail.split(',').map(function(k){ return L[k] || k; }).join(', ');
  }
  if (detail.charAt(0) === '{') {
    try {
      const o = JSON.parse(detail), keys = Object.keys(o);
      if (keys.length && keys.every(function(k){ return typeof o[k] === 'number'; }))
        return 'Removed ' + keys.map(function(k){ return o[k] + ' ' + k; }).join(', ');
      const FL = {status:'Status',notes:'Notes',type:'Type',name:'Name',phone:'Phone',email:'Email',service:'Service',message:'Message',role:'Role',office:'Office',license:'License',request_type:'Request type',relationship:'Relationship',dob:'DOB',details:'Details'};
      return keys.map(function(k){
        const lbl = FL[k] || k, v = o[k];
        if (k === 'status') return 'Status → ' + cap(v);
        if (typeof v === 'string' && v.length > 0 && v.length <= 40) return lbl + ' → ' + v;
        return 'Edited ' + lbl.toLowerCase();
      }).join(', ');
    } catch (e) { /* fall through */ }
  }
  return detail;
}
async function renderAudit(){
  if (!DATA.super) { $('view').innerHTML = '<div class="err">Owner only.</div>'; return; }
  $('view').innerHTML = '<div class="empty"><span class="spin"></span></div>';
  let log = [];
  try { const d = await api('/audit'); log = d.log || []; }
  catch(e) { $('view').innerHTML = '<div class="err">' + esc(e.message) + '</div>'; return; }
  const rows = log.map(function(x){
    return '<tr><td class="lw">' + fmt(x.created_at) + '</td>'
      + '<td>' + esc(x.actor || '') + '</td>'
      + '<td><b class="act ' + auditKind(x.action) + '">' + esc(auditAction(x.action)) + '</b></td>'
      + '<td>' + esc(auditTarget(x.action, x.target)) + '</td>'
      + '<td class="ld">' + esc(auditDetail(x.action, x.detail)) + '</td></tr>';
  }).join('');
  $('view').innerHTML = '<div class="panel"><h2><span class="pi">' + I.doc + '</span>Activity &amp; edit log</h2>'
    + '<p class="sub">Every action taken in the dashboard, newest first. Owner only &middot; last ' + log.length + ' entries.</p>'
    + (log.length
        ? '<div class="logwrap"><table class="log"><thead><tr><th>When (PT)</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<div class="empty"><b>No activity yet</b>Actions appear here as they happen.</div>') + '</div>';
}

/* ---------------- backend access (admin accounts) — owner only ---------------- */
function adminsPanelHTML(){
  return '<div class="panel cfg"><h2><span class="pi">' + I.lock + '</span>Backend access &mdash; admin accounts</h2>'
    + '<p class="sub">People who can sign in to this dashboard with their own <b>@prohealth.us</b> email and password. '
    + 'They can reset their own password from the sign-in page; you can also send a reset link or set one here.</p>'
    + '<div id="adminWarn"></div>'
    + '<div id="adminList"><div class="empty"><span class="spin"></span></div></div>'
    + '<div class="addbox">'
    + '<label>Add an admin &mdash; enter the first name only</label>'
    + '<div class="nafield"><input id="na_name" type="text" placeholder="firstname" autocapitalize="none" autocomplete="off" onkeydown="if(event.key===\\'Enter\\'){event.preventDefault();addAdmin()}"><span class="nasuffix">@prohealth.us</span></div>'
    + '<div class="modes">'
    + '<label class="rad"><input type="radio" name="namode" value="magic" checked onchange="naMode()"> Email a set-password link</label>'
    + '<label class="rad"><input type="radio" name="namode" value="manual" onchange="naMode()"> Set a password now</label>'
    + '<label class="rad"><input type="radio" name="namode" value="silent" onchange="naMode()"> Add without notifying</label>'
    + '</div>'
    + '<input id="na_pw" type="text" placeholder="Temporary password (min 10 chars)" style="display:none">'
    + '<button class="btn pri" style="margin-top:12px" onclick="addAdmin()">' + I.check + 'Add admin</button>'
    + '<div id="addMsg"></div></div></div>';
}
function naMode(){ const m = document.querySelector('input[name=namode]:checked').value;
  $('na_pw').style.display = (m === 'manual') ? 'block' : 'none'; }
async function loadAdmins(){
  try{
    const r = await api('/admins');
    renderAdminList(r.admins || []);
  }catch(e){ const el=$('adminList'); if(el) el.innerHTML = '<div class="err">' + esc(e.message) + '</div>'; }
}
function firstNameOf(email){ const p = String(email||'').split('@')[0]; return p ? p.charAt(0).toUpperCase() + p.slice(1) : String(email||''); }
function renderAdminList(list){
  const el = $('adminList'); if(!el) return;
  if(!list.length){ el.innerHTML = '<p class="sub" style="margin:6px 0">No extra admins yet.</p>'; return; }
  el.innerHTML = list.map(function(a){
    const status = a.disabled ? '<span class="atag off">Disabled</span>'
      : (a.hasPassword ? '<span class="atag ok">Active</span>' : '<span class="atag pend">No password yet</span>');
    const role = a.role ? '<span class="atag ' + (a.super ? 'own' : 'role') + '">' + esc(a.role) + '</span>' : '';
    const eem = esc(a.email), je = "'" + eem.replace(/'/g,"\\\\'") + "'";
    return '<div class="arow"><div class="ainfo"><b>' + esc(firstNameOf(a.email)) + '</b><span class="aemail">' + eem + '</span> ' + role + status + '</div>'
      + '<div class="aacts">'
      + '<button class="mini" onclick="adminReset(' + je + ')">Send reset link</button>'
      + '<button class="mini" onclick="adminSetPw(' + je + ')">Set password</button>'
      + (a.super ? '' : '<button class="mini danger" onclick="adminRemove(' + je + ')">Remove</button>')
      + '</div></div>';
  }).join('');
}
async function addAdmin(){
  const t = $('addMsg');
  const name = $('na_name').value.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/.test(name)) {
    t.innerHTML = '<div class="err">Enter a valid first name (letters and numbers, no @ or spaces).</div>'; return;
  }
  const email = name + '@prohealth.us';
  const mode = document.querySelector('input[name=namode]:checked').value;
  const body = { email: email, mode: mode };
  if (mode === 'manual') body.password = $('na_pw').value;
  try{
    const r = await api('/admins', {method:'POST', body:JSON.stringify(body)});
    let msg = 'Added ' + esc(firstNameOf(r.email)) + ' (' + esc(r.email) + ').';
    if (mode === 'magic') msg += r.sent ? ' A set-password link was emailed.' : ' (Email not configured — send a link or set a password manually.)';
    if (mode === 'manual') msg += ' Password set — share it securely.';
    t.innerHTML = '<div class="ok">' + msg + '</div>';
    $('na_name').value=''; $('na_pw').value='';
    loadAdmins();
  }catch(e){ t.innerHTML = '<div class="err">' + esc(e.message) + '</div>'; }
}
async function adminReset(email){
  try{ const r = await api('/admins/reset', {method:'POST', body:JSON.stringify({email:email})});
    alert(r.sent ? ('A reset link was emailed to ' + email + '.') : ('Email is not configured, so nothing was sent. Use “Set password” instead.'));
  }catch(e){ alert(e.message); }
}
async function adminSetPw(email){
  const pw = prompt('Set a new password for ' + email + ' (min 10 characters):');
  if (pw === null) return;
  if (pw.length < 10){ alert('Password must be at least 10 characters.'); return; }
  try{ await api('/admins/set-password', {method:'POST', body:JSON.stringify({email:email, password:pw})});
    alert('Password updated for ' + email + '. Share it securely.'); loadAdmins();
  }catch(e){ alert(e.message); }
}
async function adminRemove(email){
  if(!confirm('Remove backend access for ' + email + '?')) return;
  try{ await api('/admins/' + encodeURIComponent(email), {method:'DELETE'}); loadAdmins();
  }catch(e){ alert(e.message); }
}
async function saveCfg(){
  const g = function(id){ return $(id) ? $(id).value.trim() : undefined; };
  const body = { EMAIL_DEFAULT:g('c_default'), EMAIL_INTAKE:g('c_intake'), EMAIL_HOSPICE:g('c_hospice'),
                 EMAIL_CAREERS:g('c_careers'), EMAIL_PRIVACY:g('c_privacy'), EMAIL_FROM:g('c_from'),
                 HOURS_OPEN:g('c_open'), HOURS_CLOSE:g('c_close'),
                 HOLIDAYS_TEXT: $('c_hols') ? $('c_hols').value : undefined };
  Object.keys(body).forEach(function(k){ if (body[k] === undefined) delete body[k]; });
  const t = $('cfgok') || $('view');
  try { await api('/config', {method:'PUT', body:JSON.stringify(body)});
    t.innerHTML = '<div class="ok">Saved. New leads use these settings immediately.</div>';
    loadHours();   // refresh the open/closed clock with any new hours or closures
  } catch(e) { t.innerHTML = '<div class="err">' + esc(e.message) + '</div>'; }
}

function render(){
  if (TAB === 'overview') return renderOverview();
  if (TAB === 'openings') return renderOpenings();
  if (TAB === 'settings') return renderSettings();
  if (TAB === 'admins') return renderAdmins();
  if (TAB === 'audit') return renderAudit();
  renderList();   // leads, contacts, applications, requests
}
function renderOpenings(){ loadOpenings('view'); }
async function pushContact(id, dest){
  try{
    if (dest === 'leads') await api('/leads/' + id, {method:'PATCH', body:JSON.stringify({type:'lead'})});
    else await api('/leads/' + id + '/to-application', {method:'POST', body:JSON.stringify({})});
    await load();
    go(dest);
  }catch(e){ alert(e.message); }
}
/* résumé preview modal */
function openResume(key){
  const url = '/admin/api/resume?key=' + encodeURIComponent(key);
  $('modalTitle').textContent = 'Résumé — ' + (String(key).split('/').pop() || '');
  $('modalOpen').style.display = ''; $('modalOpen').href = url;
  $('modalBody').innerHTML = '<iframe src="' + url + '" title="Résumé preview"></iframe>';
  $('modal').hidden = false; document.body.style.overflow = 'hidden';
}
function closeModal(){ $('modal').hidden = true; $('modalBody').innerHTML = ''; document.body.style.overflow = ''; }
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });

/* ---------------- help ---------------- */
function openHelp(){
  $('modalTitle').textContent = 'Help — using the ProHealth dashboard';
  $('modalOpen').style.display = 'none';
  $('modalBody').innerHTML = '<div class="help-doc">' + helpHTML() + '</div>';
  $('modal').hidden = false; document.body.style.overflow = 'hidden';
}
function helpHTML(){
  return ''
  + '<p class="help-lead">This dashboard is where every enquiry from the ProHealth website lands — phone callbacks, contact messages, provider referrals, job applications and privacy requests. Nothing waits in an inbox: it all arrives here the moment someone hits submit. Here is how each part works.</p>'

  + '<h3>' + I.clock + 'The top bar</h3>'
  + '<ul>'
  + '<li><b>The clock</b> shows the current Pacific time. Its dot is <b style="color:#2F7A63">green when the office is open</b> and <b style="color:#C0392B">red when closed</b> — when closed it also tells you how long until opening (e.g. &ldquo;opens in 2h 30m&rdquo;), based on your office hours and holiday closures.</li>'
  + '<li><b>Your name</b> appears next to it, and the <b>sign-out</b> button is on the far right. You are signed out automatically after 8 hours.</li>'
  + '</ul>'

  + '<h3>' + I.home + 'Overview</h3>'
  + '<p>Your landing page: how many new items need attention, anything overdue, and the latest activity. Click any stat to jump straight to that list.</p>'

  + '<h3>' + I.users + 'Leads, ' + I.phone + 'Callbacks &amp; ' + I.mail + 'Contacts</h3>'
  + '<p>Enquiries are split into three tabs so nothing gets lost:</p>'
  + '<ul>'
  + '<li><b>Leads</b> — general enquiries and provider referrals.</li>'
  + '<li><b>Callbacks</b> — people who asked to be called back (from the chatbot or homepage).</li>'
  + '<li><b>Contacts</b> — messages from the website contact form.</li>'
  + '</ul>'
  + '<p>Each card shows the name, phone (tap to call), email (tap to write) and message. On every card you can:</p>'
  + '<ul>'
  + '<li>Set a <b>status</b> — New → Contacted → Converted → Closed — from the dropdown. New items are highlighted.</li>'
  + '<li>Type <b>notes</b> — they save automatically as you type.</li>'
  + '<li><b>Search</b> the top box (name, phone, email) and <b>filter</b> by status. Use <b>CSV</b> to export what you are viewing.</li>'
  + '</ul>'
  + '<p><b>On a Contact</b>, two extra buttons let you <b>Push to Leads</b> (treat it as a lead) or <b>Push to Applicants</b> (if it turns out to be someone looking for a job).</p>'

  + '<h3>' + I.brief + 'Applicants</h3>'
  + '<p>Job applications, with role, office, licence and résumé. Click <b>Résumé</b> to preview the PDF right here in a pop-up — no download needed. Filter by role, office, or whether a résumé is attached.</p>'

  + '<h3>' + I.lock + 'Data requests</h3>'
  + '<p>Privacy requests (CCPA). Each shows a reference, the request type and a <b>due-by date</b> — overdue ones are flagged red. To action a deletion, open the card, click <b>Find their data</b> to see everything held on that person, then <b>Erase permanently</b>. The request itself is kept on purpose as your proof of compliance.</p>'

  + '<h3>' + I.check + 'Editing, archiving &amp; deleting</h3>'
  + '<p>Every record (in any list) has three actions at the bottom:</p>'
  + '<ul>'
  + '<li><b>Edit</b> — correct a name, phone, email or other details in a pop-up form.</li>'
  + '<li><b>Archive</b> — tuck it away without deleting. Archived items are hidden until you pick the <b>Archived</b> status filter, where you can <b>Unarchive</b> them.</li>'
  + '<li><b>Delete</b> — remove it permanently (asks you to confirm).</li>'
  + '</ul>'

  + '<h3>' + I.list + 'Openings</h3>'
  + '<p>Manage the jobs shown on the careers page. Add a role, write a one-line summary, tick which offices it applies to, and toggle it on or off. Click <b>Save and publish</b> — the website updates within a minute, no developer needed.</p>'

  + '<h3>' + I.cog + 'Settings</h3>'
  + '<ul>'
  + '<li><b>Where leads are emailed</b> — set which inbox each kind of enquiry is forwarded to. Leave one blank to use the default.</li>'
  + '<li><b>Office hours</b> — set opening and closing times (Pacific). These drive the open/closed clock, the chatbot and the footer.</li>'
  + '<li><b>Holidays &amp; closures</b> — add the days the office is closed. Use <b>Load US federal holidays</b> to fill a whole year at once. If a holiday lands on a weekend, tap the amber button to shift it to the observed weekday. The <b>Observed closures</b> list shows exactly which days you will be closed.</li>'
  + '</ul>'

  + '<p class="help-foot">Stuck on something not covered here? Call the office line and ask for whoever set this up.</p>';
}
$('out').onclick = async function(){
  if (!confirm('Sign out of the ProHealth admin?')) return;
  await fetch('/admin/logout', {method:'POST'}).catch(function(){});
  location.href = '/admin';
};
$('help').innerHTML = I.help; $('help').onclick = openHelp;
/* ---- office-hours aware clock (green = open, red = closed + opens-in) ---- */
const HRS = { open:'08:30', close:'17:00', hol:{} };
async function loadHours(){
  try { const c = await api('/config');
    HRS.open = c.HOURS_OPEN || '08:30'; HRS.close = c.HOURS_CLOSE || '17:00';
    HRS.hol = parseHolidays(c.HOLIDAYS_TEXT);
  } catch(e) { /* keep defaults */ }
}
function parseHolidays(text){
  const h = {};
  String(text||'').split('\\n').forEach(function(line){
    const m = /^\\s*(\\d{4}-\\d{2}-\\d{2})\\s*=\\s*(.+)$/.exec(line);
    if (m) h[m[1]] = m[2].trim();
  });
  return h;
}
function toMin(hhmm){ const m = /^(\\d{1,2}):(\\d{2})/.exec(hhmm||''); return m ? (+m[1])*60 + (+m[2]) : 510; }
function pacInfo(d){
  const p = new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(d);
  const g = {}; p.forEach(function(x){ g[x.type] = x.value; });
  let hh = parseInt(g.hour,10); if (hh === 24) hh = 0;
  return { wd:g.weekday, date:g.year+'-'+g.month+'-'+g.day, min:hh*60 + parseInt(g.minute,10) };
}
function isBiz(t){ return t.wd !== 'Sat' && t.wd !== 'Sun' && !(HRS.hol && HRS.hol[t.date]); }
function fmtDur(mins){
  if (mins < 1) return 'moments';
  if (mins < 60) return mins + ' min';
  const h = Math.floor(mins/60), m = mins % 60;
  if (h < 24) return h + 'h' + (m ? ' ' + m + 'm' : '');
  const days = Math.floor(h/24), rh = h % 24;
  return days + 'd' + (rh ? ' ' + rh + 'h' : '');
}
function officeStatus(now){
  const openMin = toMin(HRS.open), closeMin = toMin(HRS.close), t0 = pacInfo(now);
  if (isBiz(t0) && t0.min >= openMin && t0.min < closeMin) return { open:true };
  for (let off = 0; off < 21; off++){
    const t = pacInfo(new Date(now.getTime() + off*86400000));
    if (!isBiz(t)) continue;
    if (off === 0 && t0.min >= openMin) continue;   // after hours today
    return { open:false, opensIn: fmtDur(off*1440 + openMin - t0.min) };
  }
  return { open:false, opensIn:'soon' };
}
function tickClock(){
  const el = $('clockTx'); if (!el) return;
  const now = new Date();
  el.textContent = new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}).format(now);
  const s = officeStatus(now), dot = $('sdot'), lbl = $('clbl'), box = $('clock');
  if (dot) dot.className = 'sdot ' + (s.open ? 'open' : 'closed');
  if (box) box.classList.toggle('closed', !s.open);
  if (lbl) lbl.textContent = s.open ? 'ProHealth PST Time' : ('Closed \\u00b7 opens in ' + s.opensIn);
}
tickClock(); setInterval(tickClock, 1000);
paintTabs(); load(); loadHours();
setInterval(function(){ if (['overview','leads','callbacks','contacts','applications','requests'].indexOf(TAB) > -1) load(); }, 60000);
</script></body></html>`;
