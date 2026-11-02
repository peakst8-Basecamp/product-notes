"""Builds README.md and index.html for the Memberships feature list from features.json.

Run from the repo root: python3 memberships/coverage/build.py
"""
import json
import os
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = json.load(open(os.path.join(HERE, "features.json")))
AREAS = DATA["areas"]
ROWS = DATA["features"]
UPDATED = "2 Nov 2026"

FOR = {"member": "Members", "club": "Club admins", "both": "Both"}
PHASE = {"Prereq": "Before launch", "V1": "V1", "V2": "V2", "Later": "Later", "No": "Not planned"}
PREREQ_AREAS = [a[0] for a in AREAS if len(a) > 2 and a[2] == "prerequisite"]

counts = Counter(r["phase"] for r in ROWS)
for_counts = Counter(r["for"] for r in ROWS)
proto = sum(1 for r in ROWS if r["prototype"])
seen = sum(1 for r in ROWS if r["sweatpals"])
total = len(ROWS)

GATE_TITLE = "Before launch: renewal reminders"
GATE_LEAD = (
    "No club sells a recurring plan until members are reminded before every charge, get a receipt after it, "
    "and can fix a failed payment from the message. These ship first."
)
GATE_WHY = [
    ("Members trust it", "Nobody is charged without warning, so people don't dispute charges or leave the club over one."),
    ("It's required", "RBI rules for UPI AutoPay and card mandates require a notice before each charge."),
    ("It saves members", "A failed payment caught the same day, with a link to fix it, keeps the member."),
]

# What club admins control, in plain words. How each one is stored is in code/ARCHITECTURE.md.
CONTROLS = [
    ("For the club", [
        "Who sees the plans: everyone, or club members only",
        "How early and where members are reminded about renewals",
        "How late a member can cancel a booking and still get the run back",
        "How long a member has to fix a failed payment",
        "The refund policy members see",
        "The brands on the perks page",
        "Who on the team can change prices and give refunds",
    ]),
    ("For each plan", [
        "Price, how often it renews, or how long a pack lasts",
        "What it covers and how often it can be used",
        "Who can join: anyone, first-timers, a group, or by approval",
        "Perks: early booking, guest passes, brand offers",
        "Whether discount codes work on it",
        "How members cancel, and any minimum commitment",
    ]),
    ("For each pass", [
        "What members pay: free, half price, or a custom amount off",
        "Whether only members can book it",
    ]),
]

UNKNOWN = [
    "SweatPals' exact wording, which isn't in their public code.",
    "Their logged-in club dashboard, so club-admin features come from their help centre.",
    "Flows that only exist in their mobile app, such as sending guest passes.",
]


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def md(s):
    return str(s).replace("|", "\\|")


# ---------------------------------------------------------------- README.md
out = ["# Memberships: feature list\n"]
out.append(
    "**Part of [peakst8 Club Memberships](../README.md).** Everything we found in SweatPals plus what peakst8 adds, "
    "written as what members and club admins can do. Use it to agree scope: move a row's phase, cut it, or add one. "
    "How each feature is built is in [code/ARCHITECTURE.md](../code/ARCHITECTURE.md).\n"
)
out.append(f"[Page](https://peakst8-basecamp.github.io/product-notes/memberships/coverage/) · [Data](features.json) · updated {UPDATED}\n")
out.append("## At a glance\n")
out.append(f"- **{total} features** in {len(AREAS)} groups. {seen} are in SweatPals; {total - seen} are peakst8 additions.")
out.append(f"- **Before launch** {counts['Prereq']} · **V1** {counts['V1']} · **V2** {counts['V2']} · **Later** {counts['Later']} · **Not planned** {counts['No']}")
out.append(f"- **For** members {for_counts['member']} · club admins {for_counts['club']} · both {for_counts['both']}")
out.append(f"- **Working in the prototype:** {proto} of {total}\n")
out.append(f"## {GATE_TITLE}\n")
out.append(GATE_LEAD + "\n")
for k, v in GATE_WHY:
    out.append(f"- **{k}.** {v}")
out.append("")
out.append("## What club admins control\n")
out.append("Club admins set these for their own audience. peakst8 only switches memberships on for a club and sets the platform fee.\n")
for title, items in CONTROLS:
    out.append(f"**{title}**\n")
    out.extend(f"- {item}" for item in items)
    out.append("")
out.append("## Features\n")
for code, name, *_ in AREAS:
    rows = [r for r in ROWS if r["area"] == code]
    tag = " · before launch" if code in PREREQ_AREAS else ""
    out.append(f"### {name} ({len(rows)}){tag}\n")
    out.append("| Feature | What it means | For | Phase | Prototype | SweatPals |\n| --- | --- | --- | --- | --- | --- |")
    for r in rows:
        out.append(
            f"| **{md(r['feature'])}** | {md(r['story'])} | {FOR[r['for']]} | {PHASE[r['phase']]} | "
            f"{'✓' if r['prototype'] else '–'} | {'✓' if r['sweatpals'] else 'New'} |"
        )
    out.append("")
out.append("## What we couldn't see in SweatPals\n")
out.extend(f"- {u}" for u in UNKNOWN)
out.append("")
out.append("## Updating this list\n")
out.append("Edit [`features.json`](features.json), then run `python3 memberships/coverage/build.py` from the repo root. Keep each row to what a person can do or will notice.\n")
open(os.path.join(HERE, "README.md"), "w").write("\n".join(out))

# ---------------------------------------------------------------- index.html
gate = "".join(f"<div><b>{esc(k)}</b><p>{esc(v)}</p></div>" for k, v in GATE_WHY)
controls = "".join(
    f'<div class="lvl"><b>{esc(t)}</b><ul>{"".join(f"<li>{esc(i)}</li>" for i in items)}</ul></div>'
    for t, items in CONTROLS
)
unknown = "".join(f"<li>{esc(u)}</li>" for u in UNKNOWN)
payload = json.dumps({"areas": AREAS, "features": ROWS}, ensure_ascii=False).replace("</", "<\\/")

html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Memberships Feature List</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="peakst8 Club Memberships feature list: what members and club admins can do, with phase, prototype status and what SweatPals has.">
<link rel="canonical" href="https://peakst8-basecamp.github.io/product-notes/memberships/coverage/">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400&family=Figtree:wght@400;500;600;700;800&family=Chivo+Mono:wght@400&display=swap" rel="stylesheet">
<style>
/* Same system as the other product notes: Newsreader display, Figtree body, Chivo Mono labels, one signal red. */
:root{{color-scheme:light;--bg:#fff;--ink:#0b0b0c;--ink-2:#505157;--ink-3:#8b8c92;--fill:#f4f4f5;--line:#e7e7ea;--signal:#ff5148;--ok:#17945a;--okbg:#e8f5ee;
--serif:"Newsreader",Georgia,serif;--sans:"Figtree",system-ui,-apple-system,sans-serif;--mono:"Chivo Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{color-scheme:dark;--bg:#0c0c0d;--ink:#f4f4f5;--ink-2:#b4b5bb;--ink-3:#7c7d84;--fill:#18181b;--line:#2a2a2e;--okbg:#10291d;--ok:#4ade80}}}}
:root[data-theme="dark"]{{color-scheme:dark;--bg:#0c0c0d;--ink:#f4f4f5;--ink-2:#b4b5bb;--ink-3:#7c7d84;--fill:#18181b;--line:#2a2a2e;--okbg:#10291d;--ok:#4ade80}}
*{{box-sizing:border-box}}
html,body{{margin:0;background:var(--bg);color:var(--ink)}}
body{{font-family:var(--sans);-webkit-font-smoothing:antialiased}}
.pg{{max-width:1120px;margin:0 auto;padding-block:24px 96px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
.lbl{{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}}
.top{{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}}
.wm{{font-weight:800;font-size:19px;letter-spacing:-.02em;color:var(--ink);text-decoration:none}}
.hero{{text-align:center;padding-block:56px 8px;display:grid;gap:18px;justify-items:center}}
.hero h1{{font-family:var(--serif);font-weight:300;font-size:clamp(38px,6vw,64px);line-height:1;letter-spacing:-.025em;margin:0;max-width:18ch;text-wrap:balance}}
.hero p{{margin:0;max-width:62ch;color:var(--ink-2);font-size:17px;line-height:1.5}}
.nums{{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}}
.nums div{{background:var(--fill);border-radius:16px;padding:12px 16px;display:grid;gap:2px;min-width:104px}}
.nums b{{font-family:var(--serif);font-weight:400;font-size:30px;line-height:1;font-variant-numeric:tabular-nums}}
.nums span{{font-size:12.5px;color:var(--ink-3)}}
nav.toc{{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}}
nav.toc a{{font-size:13.5px;font-weight:600;color:var(--ink-2);text-decoration:none;background:var(--fill);border-radius:999px;padding:8px 14px}}
section{{display:grid;gap:16px;padding-top:40px}}
h2{{margin:0;font-family:var(--serif);font-weight:400;font-size:34px;line-height:1.1;letter-spacing:-.015em;scroll-margin-top:16px}}
.lead{{margin:0;color:var(--ink-2);font-size:16px;line-height:1.6;max-width:72ch}}
.lead b{{color:var(--ink)}}
.gate{{border-radius:22px;padding:22px;background:var(--fill);box-shadow:inset 0 0 0 2px var(--signal);display:grid;gap:14px}}
.why{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px}}
.why div{{background:var(--bg);border-radius:16px;padding:14px;display:grid;gap:6px;align-content:start}}
.why p{{margin:0;color:var(--ink-2);font-size:14px;line-height:1.5}}
.levels{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px}}
.lvl{{background:var(--fill);border-radius:22px;padding:18px;display:grid;gap:10px;align-content:start}}
.lvl b{{font-size:17px}}
.lvl ul{{margin:0;padding-left:18px;display:grid;gap:6px;color:var(--ink-2);font-size:14.5px;line-height:1.5}}
.tbl{{overflow-x:auto;border-radius:22px;background:var(--fill)}}
.tbl table{{width:100%;min-width:760px;border-collapse:collapse;font-size:14px;line-height:1.45}}
.tbl th{{text-align:left;font-family:var(--mono);font-weight:400;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);padding:14px 14px 10px}}
.tbl td{{padding:11px 14px;border-top:1px solid var(--line);vertical-align:top;color:var(--ink-2)}}
.tbl td:first-child{{color:var(--ink);font-weight:700;width:24%}}
.tbl tr.area td{{background:var(--bg);color:var(--ink);font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:400;padding-top:16px}}
.tbl tr.area.pre td{{color:var(--signal)}}
.tag{{display:inline-block;font-size:12px;font-weight:600;border-radius:999px;padding:3px 9px;white-space:nowrap;background:var(--bg);color:var(--ink-2)}}
.tag.V1{{background:var(--ink);color:var(--bg)}}.tag.Prereq{{background:var(--signal);color:#fff}}.tag.No{{color:var(--ink-3)}}
.yes{{color:var(--ok);background:var(--okbg)}}.new{{color:var(--signal)}}
.filters{{display:flex;gap:16px;flex-wrap:wrap;align-items:center}}
.fg{{display:flex;gap:6px;flex-wrap:wrap;align-items:center}}
.fg button{{font:inherit;font-size:13px;font-weight:600;border:0;border-radius:999px;padding:7px 12px;background:var(--fill);color:var(--ink-2);cursor:pointer}}
.fg button[aria-pressed="true"]{{background:var(--ink);color:var(--bg)}}
.fg input{{font:inherit;font-size:14px;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:8px 14px;width:220px;max-width:100%}}
.shown{{font-size:13px;color:var(--ink-3)}}
ul.plain{{margin:0;padding-left:20px;display:grid;gap:8px;color:var(--ink-2);line-height:1.55}}
footer{{margin-top:64px;text-align:center;color:var(--ink-3);font-size:13px}}
footer a,.lead a{{color:var(--ink-2)}}
button:focus-visible,a:focus-visible,input:focus-visible{{outline:2px solid var(--signal);outline-offset:2px}}
</style>
</head>
<body>
<div class="pg">
<header class="top"><a class="wm" href="../../">peakst8</a><span class="lbl">Feature list · {UPDATED}</span></header>
<main>
<section class="hero">
  <span class="lbl">peakst8 Club Memberships</span>
  <h1>What members and clubs will be able to do.</h1>
  <p>Everything we found in SweatPals plus what peakst8 adds, written from the member's and club admin's side. Use it to agree scope: move a feature's phase, cut it or add one.</p>
  <div class="nums"><div><b>{total}</b><span>features</span></div><div><b>{counts['Prereq']}</b><span>before launch</span></div><div><b>{counts['V1']}</b><span>in V1</span></div><div><b>{total - seen}</b><span>peakst8 additions</span></div><div><b>{proto}</b><span>in the prototype</span></div></div>
  <nav class="toc"><a href="#gate">Before launch</a><a href="#controls">What clubs control</a><a href="#features">Features</a><a href="../">Product note</a><a href="../prototype/">Prototype</a></nav>
</section>

<section id="gate">
  <h2>{esc(GATE_TITLE)}</h2>
  <div class="gate"><p class="lead">{esc(GATE_LEAD)}</p><div class="why">{gate}</div></div>
</section>

<section id="controls">
  <h2>What club admins control</h2>
  <p class="lead">Club admins set these for their own audience. peakst8 only switches memberships on for a club and sets the platform fee.</p>
  <div class="levels">{controls}</div>
</section>

<section id="features">
  <h2>Features</h2>
  <div class="filters" role="group" aria-label="Filters">
    <div class="fg" id="f-phase"><span class="lbl">Phase</span></div>
    <div class="fg" id="f-for"><span class="lbl">For</span></div>
    <div class="fg" id="f-proto"><span class="lbl">Prototype</span></div>
    <div class="fg"><label class="lbl" for="q">Search</label><input id="q" type="search" placeholder="e.g. guest pass"></div>
  </div>
  <span class="shown" id="shown" aria-live="polite"></span>
  <div class="tbl"><table><thead><tr><th>Feature</th><th>What it means</th><th>For</th><th>Phase</th><th>Prototype</th><th>SweatPals</th></tr></thead><tbody id="rows"></tbody></table></div>
  <p class="lead">Couldn't see in SweatPals:</p>
  <ul class="plain">{unknown}</ul>
</section>
</main>
<footer>peakst8 · internal · <a href="https://github.com/peakst8-Basecamp/product-notes/blob/main/memberships/coverage/features.json">Edit features.json</a> · How it's built: <a href="https://github.com/peakst8-Basecamp/product-notes/blob/main/memberships/code/ARCHITECTURE.md">ARCHITECTURE.md</a></footer>
</div>
<script id="data" type="application/json">{payload}</script>
<script>
(function(){{
  var D=JSON.parse(document.getElementById('data').textContent);
  var FOR={json.dumps(FOR)}, PH={json.dumps(PHASE)}, PRE={json.dumps(PREREQ_AREAS)};
  var st={{phase:'all',who:'all',proto:'all',q:''}};
  function esc(s){{return String(s).replace(/[&<>"]/g,function(c){{return {{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}}[c]}})}}
  function group(id,key,opts){{var g=document.getElementById(id);opts.forEach(function(o){{var b=document.createElement('button');b.type='button';b.textContent=o[1];b.dataset.v=o[0];b.setAttribute('aria-pressed',o[0]==='all');b.addEventListener('click',function(){{st[key]=o[0];[].forEach.call(g.querySelectorAll('button'),function(x){{x.setAttribute('aria-pressed',x.dataset.v===o[0])}});draw()}});g.appendChild(b)}})}}
  group('f-phase','phase',[['all','All'],['Prereq','Before launch'],['V1','V1'],['V2','V2'],['Later','Later'],['No','Not planned']]);
  group('f-for','who',[['all','All'],['member','Members'],['club','Club admins']]);
  group('f-proto','proto',[['all','All'],['yes','Works now'],['no','Not yet']]);
  document.getElementById('q').addEventListener('input',function(e){{st.q=e.target.value.trim().toLowerCase();draw()}});
  function draw(){{
    var out=[],n=0;
    D.areas.forEach(function(a){{
      var rows=D.features.filter(function(r){{return r.area===a[0]
        &&(st.phase==='all'||r.phase===st.phase)
        &&(st.who==='all'||r['for']===st.who||r['for']==='both')
        &&(st.proto==='all'||(st.proto==='yes')===r.prototype)
        &&(!st.q||(r.feature+' '+r.story).toLowerCase().indexOf(st.q)>-1)}});
      if(!rows.length)return;n+=rows.length;var pre=PRE.indexOf(a[0])>-1;
      out.push('<tr class="area'+(pre?' pre':'')+'"><td colspan="6">'+esc(a[1])+' · '+rows.length+(pre?' · before launch':'')+'</td></tr>');
      rows.forEach(function(r){{out.push('<tr><td>'+esc(r.feature)+'</td><td>'+esc(r.story)+'</td><td>'+FOR[r['for']]+'</td><td><span class="tag '+r.phase+'">'+PH[r.phase]+'</span></td><td>'+(r.prototype?'<span class="tag yes">✓ Works</span>':'<span class="tag">–</span>')+'</td><td>'+(r.sweatpals?'✓':'<span class="new">New</span>')+'</td></tr>')}});
    }});
    document.getElementById('rows').innerHTML=out.join('')||'<tr><td colspan="6">No features match these filters.</td></tr>';
    document.getElementById('shown').textContent='Showing '+n+' of '+D.features.length+' features';
  }}
  draw();
}})();
</script>
</body>
</html>
"""
open(os.path.join(HERE, "index.html"), "w").write(html)
print(f"Built: {total} features · before launch {counts['Prereq']} · V1 {counts['V1']} · V2 {counts['V2']} · prototype {proto}")
