"""Builds README.md and index.html for the Memberships coverage note from features.json.

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

PHASE = {"Prereq": "Launch prerequisite", "V1": "V1", "V2": "V2", "Later": "Later", "No": "Not planned"}
PREREQ_AREAS = [a[0] for a in AREAS if len(a) > 2 and a[2] == "prerequisite"]
BY = {"club": "Club admin", "member": "Member", "admin": "peakst8 admin", "system": "System"}
EV = {"help": "Help centre", "code": "Web code", "both": "Help + code", "inferred": "Inferred", "proposed": "peakst8 proposal"}

counts = Counter(r["phase"] for r in ROWS)
by_counts = Counter(r["by"] for r in ROWS)
proto = sum(1 for r in ROWS if r["prototype"])
prereq_rows = [r for r in ROWS if r["phase"] == "Prereq"]

# Why renewal reminders gate the launch. Shown above the inventory on both outputs.
GATE_TITLE = "Launch prerequisite: renewal reminders"
GATE_LEAD = ("Renewal reminders are their own feature type, built and shipped before memberships go live for any club. "
             "A club can't sell a recurring plan until every row marked Launch prerequisite works end to end.")
GATE_WHY = [
    ("Regulation", "RBI's e-mandate rules require a pre-debit notice at least 24 hours before each recurring charge, and a notice after it. Without them, UPI AutoPay and card mandates can't be used."),
    ("Trust", "SweatPals sends a notice 24 hours before every renewal. Members who are charged without warning dispute the charge, which costs the club the member and the fee."),
    ("Recovery", "Failed renewals are only recovered if the member hears about it with a fix-billing link the same day."),
    ("What exists today", "The backend has scheduled jobs (BullMQ upsertJobScheduler), the outbound email outbox, WhatsApp campaigns and Firebase push. NotificationDelivery is tied to registrations and has one type (ABANDONED_CART), so reminders get their own PlanReminderDelivery model and ClubMembershipSettings (see schema-draft.prisma)."),
]
total = len(ROWS)

# Club-admin settings, grouped by where they live. Kept here (not in features.json) because they
# describe peakst8's configuration model rather than a SweatPals feature.
CONFIG = [
    ("Club settings", "Dashboard → Settings → Memberships. One set per club; every plan inherits them.", [
        ("Plans section", "Show plans to everyone or to club members only; section title; plan order"),
        ("Renewal reminders", "When reminders go out (the 24-hour pre-debit notice is fixed; add e.g. 3 days, or 7 days for yearly), channels (push, email, WhatsApp on the club's credits), send hour, and which optional reminders are on. See the Renewal reminders feature type."),
        ("Credit release window", "Hours before start when a cancelled booking gives the credit back (default 12)"),
        ("Late cancel and no-show", "Whether a late cancel or no-show uses up the credit"),
        ("Failed payment grace", "Days a past-due member keeps booking before access stops (default 0)"),
        ("Refund policy", "Text shown at checkout and on cancel; who can refund"),
        ("Tax", "GST % and whether plan prices include it (from club registration)"),
        ("Fees", "Platform fee paid by the member or absorbed by the club"),
        ("See plans banner", "Optional custom line on event pages, e.g. 'Members run free'"),
        ("Partner perks", "The club's partner offers (partner, offer, code, how to redeem), then which plans unlock each one"),
        ("Team", "Which club admins can create plans, change prices, refund and pause"),
    ]),
    ("Plan settings", "Dashboard → Plans → Create or edit. One set per plan.", [
        ("Basics", "Membership or pack, name, description, cover"),
        ("Pricing", "One or more prices: interval or one-time validity, joining fee, intro offer"),
        ("Coverage", "Event types or specific events; usage limit and period; roll-over"),
        ("Audience", "Everyone · first-timers · past attendees (N runs) · profile rule from the club's own form fields (e.g. women only, students, a company email domain) · invite list"),
        ("Access rules", "Approval required, capacity, one per member, unlisted, featured"),
        ("Perks", "Early access hours, guest passes per period and who can receive them, which partner perks it unlocks, members-only sessions, WhatsApp group"),
        ("Sharing", "Shareable seats"),
        ("Forms", "Waiver and questionnaire at purchase"),
        ("Exit", "Cancellation policy (member cancels, or club reviews) and minimum commitment"),
    ]),
    ("Pass settings", "Event editor → each pass. One row per plan.", [
        ("Plan price", "Free · half · full · custom % or ₹ off · no benefit"),
        ("Plan holders only", "Only holders of chosen plans can book this pass"),
    ]),
]

PERMS = [
    ("Club owner / admin (Host on the club)", "Everything below, plus create, edit, archive plans; prices; refunds; team access"),
    ("Club staff (co-host, EventHost)", "See holders on their events; redeem guest passes at check-in; no prices or refunds"),
    ("peakst8 admin", "Switch Memberships on for a club; set the platform fee on plans; support refunds"),
    ("Member", "Join, book, share seats and send guest passes if the plan allows, cancel per policy"),
]

UNKNOWN = [
    "Exact wording: SweatPals loads its English copy at runtime, so it isn't in the bundles. The prototype uses peakst8 copy.",
    "Server rules that never reach the browser: proration maths, retry timing, how ties between two plans are broken. peakst8's rules are written in the note.",
    "The SweatPals host dashboard: it's behind login, so host screens come from the help centre only.",
    "Mobile app-only flows (guest pass sending, payment methods): described in the help centre, not seen in code.",
    "51 of 56 downloaded files were outside the REA run's selected sources; relationships through them are unknown.",
]


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def md_cell(s):
    return str(s).replace("|", "\\|")


# ---------------------------------------------------------------- README.md
md = []
md.append("# Memberships: what we reverse-engineered\n")
md.append(f"**Part of [peakst8 Club Memberships](../README.md).** Every membership feature we found in SweatPals, one row each, with who configures it on peakst8, the setting it maps to, the phase it ships in, and whether the [prototype](https://peakst8-basecamp.github.io/product-notes/memberships/prototype/) already does it. Use it as the checklist so nothing gets dropped.\n")
md.append(f"[Page](https://peakst8-basecamp.github.io/product-notes/memberships/coverage/) · [Data](features.json) · Internal · updated {UPDATED}\n")
md.append("## At a glance\n")
md.append(f"- **{total} features** across {len(AREAS)} areas.")
md.append(f"- **Launch prerequisite:** {counts['Prereq']} renewal-reminder features must ship before memberships go live.")
md.append(f"- **Phase:** V1 {counts['V1']} · V2 {counts['V2']} · Later {counts['Later']} · not planned {counts['No']}.")
md.append(f"- **Configured by:** club admins {by_counts['club']} · members {by_counts['member']} · system {by_counts['system']} · peakst8 admin {by_counts['admin']}.")
md.append(f"- **In the prototype today:** {proto} of {total}.\n")
md.append(f"## {GATE_TITLE}\n")
md.append(GATE_LEAD + "\n")
md.append("| Why | |\n| --- | --- |")
for k, v in GATE_WHY:
    md.append(f"| **{k}** | {md_cell(v)} |")
md.append("")
md.append(f"The {len(prereq_rows)} prerequisite features are listed first in the inventory, under **R. Renewal reminders**.\n")
md.append("## The rule: club admins configure it for their audience\n")
md.append("Nothing about a plan is fixed by peakst8. Each club's admins decide what they sell, to whom, at what price and on what terms. peakst8 sets only the platform fee and switches the feature on per club. Settings live at three levels, and a lower level never needs to repeat a higher one.\n")
for title, where, items in CONFIG:
    md.append(f"### {title}\n")
    md.append(f"{where}\n")
    md.append("| Setting | What the club admin chooses |\n| --- | --- |")
    for k, v in items:
        md.append(f"| **{k}** | {md_cell(v)} |")
    md.append("")
md.append("### Who can do what\n")
md.append("| Role | Can |\n| --- | --- |")
for k, v in PERMS:
    md.append(f"| **{k}** | {md_cell(v)} |")
md.append("")
md.append("## Where the evidence came from\n")
md.append("| Label | Meaning |\n| --- | --- |")
md.append("| Help centre | SweatPals help articles 3.1–3.4, 5.1–5.4, 3.4 (class packs), 6.x, 8.5 (read 1 Nov 2026) |")
md.append("| Web code | Route names, component names and translation keys in SweatPals' public web bundles, analysed with REA as inert text on 2 Nov 2026 (Evidence `ev_da05d85e…`) |")
md.append("| Help + code | Both sources agree |")
md.append("| Inferred | Follows from what we saw, not stated directly |")
md.append("| peakst8 proposal | Not in SweatPals; added because club admins need it |")
md.append("")
md.append("## Inventory\n")
for code, name, *_ in AREAS:
    rows = [r for r in ROWS if r["area"] == code]
    tag = " · launch prerequisite" if code in PREREQ_AREAS else ""
    md.append(f"### {code}. {name} ({len(rows)}){tag}\n")
    md.append("| Feature | What SweatPals does | Evidence | Configured by | peakst8 setting | Phase | Prototype |\n| --- | --- | --- | --- | --- | --- | --- |")
    for r in rows:
        md.append(f"| **{md_cell(r['feature'])}** | {md_cell(r['sweatpals'])} | {EV[r['evidence']]}: {md_cell(r['source'])} | {BY[r['by']]} | {md_cell(r['setting'])} | {PHASE[r['phase']]} | {'✓' if r['prototype'] else '–'} |")
    md.append("")
md.append("## What we could not see\n")
for u in UNKNOWN:
    md.append(f"- {u}")
md.append("")
md.append("## Updating this note\n")
md.append("Edit [`features.json`](features.json), then run `python3 memberships/coverage/build.py` from the repo root. It rewrites this README and the data in `index.html`.\n")
open(os.path.join(HERE, "README.md"), "w").write("\n".join(md))

# ---------------------------------------------------------------- index.html
def cfg_html():
    out = []
    for title, where, items in CONFIG:
        out.append(f'<div class="lvl"><div class="lvlh"><b>{esc(title)}</b><span>{esc(where)}</span></div><dl>')
        for k, v in items:
            out.append(f"<dt>{esc(k)}</dt><dd>{esc(v)}</dd>")
        out.append("</dl></div>")
    return "\n".join(out)


gate_rows = "\n".join(f"<div><b>{esc(k)}</b><p>{esc(v)}</p></div>" for k, v in GATE_WHY)
perm_rows = "\n".join(f"<tr><td>{esc(k)}</td><td>{esc(v)}</td></tr>" for k, v in PERMS)
unknown_li = "\n".join(f"<li>{esc(u)}</li>" for u in UNKNOWN)
payload = json.dumps({"areas": AREAS, "features": ROWS}, ensure_ascii=False).replace("</", "<\\/")

html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Memberships Coverage</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Every SweatPals membership feature we reverse-engineered, with who configures it on peakst8, the setting, the phase and prototype status.">
<link rel="canonical" href="https://peakst8-basecamp.github.io/product-notes/memberships/coverage/">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400&family=Figtree:wght@400;500;600;700;800&family=Chivo+Mono:wght@400&display=swap" rel="stylesheet">
<style>
/* Same system as the other product notes: white page, Newsreader display, Figtree body, Chivo Mono labels, one signal red. */
:root{{color-scheme:light;--bg:#fff;--ink:#0b0b0c;--ink-2:#505157;--ink-3:#8b8c92;--fill:#f4f4f5;--line:#e7e7ea;--signal:#ff5148;--ok:#17945a;--okbg:#e8f5ee;
--serif:"Newsreader",Georgia,serif;--sans:"Figtree",system-ui,-apple-system,sans-serif;--mono:"Chivo Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{color-scheme:dark;--bg:#0c0c0d;--ink:#f4f4f5;--ink-2:#b4b5bb;--ink-3:#7c7d84;--fill:#18181b;--line:#2a2a2e;--okbg:#10291d;--ok:#4ade80}}}}
:root[data-theme="dark"]{{color-scheme:dark;--bg:#0c0c0d;--ink:#f4f4f5;--ink-2:#b4b5bb;--ink-3:#7c7d84;--fill:#18181b;--line:#2a2a2e;--okbg:#10291d;--ok:#4ade80}}
*{{box-sizing:border-box}}
html,body{{margin:0;background:var(--bg);color:var(--ink)}}
body{{font-family:var(--sans);-webkit-font-smoothing:antialiased}}
.pg{{max-width:1180px;margin:0 auto;padding-block:24px 96px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
.lbl{{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}}
.top{{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}}
.wm{{font-weight:800;font-size:19px;letter-spacing:-.02em;color:var(--ink);text-decoration:none}}
.hero{{text-align:center;padding-block:56px 8px;display:grid;gap:18px;justify-items:center}}
.hero h1{{font-family:var(--serif);font-weight:300;font-size:clamp(38px,6vw,68px);line-height:1;letter-spacing:-.025em;margin:0;max-width:18ch;text-wrap:balance}}
.hero p{{margin:0;max-width:62ch;color:var(--ink-2);font-size:17px;line-height:1.5}}
.nums{{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}}
.nums div{{background:var(--fill);border-radius:16px;padding:12px 16px;display:grid;gap:2px;min-width:110px}}
.nums b{{font-family:var(--serif);font-weight:400;font-size:30px;line-height:1;font-variant-numeric:tabular-nums}}
.nums span{{font-size:12.5px;color:var(--ink-3)}}
nav.toc{{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}}
nav.toc a{{font-size:13.5px;font-weight:600;color:var(--ink-2);text-decoration:none;background:var(--fill);border-radius:999px;padding:8px 14px}}
section{{display:grid;gap:16px;padding-top:40px}}
h2{{margin:0;font-family:var(--serif);font-weight:400;font-size:34px;line-height:1.1;letter-spacing:-.015em;scroll-margin-top:16px}}
.lead{{margin:0;color:var(--ink-2);font-size:16px;line-height:1.6;max-width:72ch}}
.lead b{{color:var(--ink)}}
.levels{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px}}
.lvl{{background:var(--fill);border-radius:22px;padding:18px;display:grid;gap:12px;align-content:start}}
.lvlh{{display:grid;gap:4px}}.lvlh b{{font-size:18px}}.lvlh span{{font-size:13px;color:var(--ink-3)}}
.lvl dl{{margin:0;display:grid;gap:10px}}
.lvl dt{{font-weight:700;font-size:14px}}
.lvl dd{{margin:2px 0 0;color:var(--ink-2);font-size:14px;line-height:1.5}}
.tbl{{overflow-x:auto;border-radius:22px;background:var(--fill)}}
.tbl table{{width:100%;border-collapse:collapse;font-size:13.5px;line-height:1.45}}
.tbl.inv table{{min-width:980px}}
.tbl th{{text-align:left;font-family:var(--mono);font-weight:400;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);padding:14px 14px 10px;position:sticky;top:0;background:var(--fill)}}
.tbl td{{padding:11px 14px;border-top:1px solid var(--line);vertical-align:top;color:var(--ink-2)}}
.tbl td:first-child{{color:var(--ink);font-weight:700}}
.tbl tr.area td{{background:var(--bg);color:var(--ink);font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:400;padding-top:16px}}
.src{{display:block;font-family:var(--mono);font-size:11px;color:var(--ink-3);margin-top:3px;overflow-wrap:anywhere}}
.tag{{display:inline-block;font-size:12px;font-weight:600;border-radius:999px;padding:3px 9px;white-space:nowrap;background:var(--bg);color:var(--ink-2)}}
.tag.V1{{background:var(--ink);color:var(--bg)}}.tag.Prereq{{background:var(--signal);color:#fff}}
.gate{{border-radius:22px;padding:22px;background:var(--fill);box-shadow:inset 0 0 0 2px var(--signal);display:grid;gap:14px}}
.gate .why{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px}}
.gate .why div{{background:var(--bg);border-radius:16px;padding:14px;display:grid;gap:6px;align-content:start}}
.gate .why p{{margin:0;color:var(--ink-2);font-size:14px;line-height:1.5}}
.tbl tr.area.pre td{{color:var(--signal)}}.tag.No{{color:var(--ink-3)}}
.tag.club{{color:var(--signal)}}
.yes{{color:var(--ok);background:var(--okbg)}}
.filters{{display:flex;gap:16px;flex-wrap:wrap;align-items:center}}
.fg{{display:flex;gap:6px;flex-wrap:wrap;align-items:center}}
.fg .lbl{{margin-right:2px}}
.fg button{{font:inherit;font-size:13px;font-weight:600;border:0;border-radius:999px;padding:7px 12px;background:var(--fill);color:var(--ink-2);cursor:pointer}}
.fg button[aria-pressed="true"]{{background:var(--ink);color:var(--bg)}}
.fg input{{font:inherit;font-size:14px;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:999px;padding:8px 14px;min-width:0;width:220px;max-width:100%}}
.shown{{font-size:13px;color:var(--ink-3)}}
ul.plain{{margin:0;padding-left:20px;display:grid;gap:8px;color:var(--ink-2);line-height:1.55;max-width:80ch}}
footer{{margin-top:64px;text-align:center;color:var(--ink-3);font-size:13px}}
footer a,.lead a{{color:var(--ink-2)}}
button:focus-visible,a:focus-visible,input:focus-visible{{outline:2px solid var(--signal);outline-offset:2px}}
</style>
</head>
<body>
<div class="pg">
<header class="top"><a class="wm" href="../../">peakst8</a><span class="lbl">Product note · {UPDATED}</span></header>
<main>
<section class="hero">
  <span class="lbl">peakst8 Club Memberships · coverage</span>
  <h1>Everything we reverse-engineered, so nothing gets dropped.</h1>
  <p>Every membership feature found in SweatPals, mapped to who configures it on peakst8, the setting it becomes, the phase it ships in, and whether the prototype already runs it. Club admins configure all of it for their own audience.</p>
  <div class="nums"><div><b>{total}</b><span>features</span></div><div><b>{counts['Prereq']}</b><span>launch prerequisites</span></div><div><b>{counts['V1']}</b><span>in V1</span></div><div><b>{counts['V2']}</b><span>in V2</span></div><div><b>{by_counts['club']}</b><span>set by club admins</span></div><div><b>{proto}</b><span>in the prototype</span></div></div>
  <nav class="toc"><a href="#gate">Renewal reminders</a><a href="#config">Club admin settings</a><a href="#roles">Who can do what</a><a href="#inventory">Inventory</a><a href="#unknown">What we couldn't see</a><a href="../">Product note</a><a href="../prototype/">Prototype</a></nav>
</section>

<section id="gate">
  <h2>{esc(GATE_TITLE)}</h2>
  <div class="gate"><p class="lead">{esc(GATE_LEAD)}</p><div class="why">{gate_rows}</div><p class="lead">The {len(prereq_rows)} prerequisite features are listed first in the inventory under <b>R. Renewal reminders</b>. <a href="#inventory" id="showpre">Show only prerequisites</a></p></div>
</section>

<section id="config">
  <h2>Club admins configure it for their audience</h2>
  <p class="lead">Nothing about a plan is fixed by peakst8. Each club's admins decide <b>what they sell, to whom, at what price and on what terms</b>. peakst8 only switches the feature on for a club and sets the platform fee. Settings sit at three levels; a lower level never repeats a higher one.</p>
  <div class="levels">{cfg_html()}</div>
</section>

<section id="roles">
  <h2>Who can do what</h2>
  <div class="tbl"><table><thead><tr><th>Role</th><th>Can</th></tr></thead><tbody>{perm_rows}</tbody></table></div>
</section>

<section id="inventory">
  <h2>Inventory</h2>
  <p class="lead">Evidence labels: <b>Help centre</b> (SweatPals articles), <b>Web code</b> (route, component and translation-key names from their public bundles, read with REA as inert text, Evidence <code>ev_da05d85e…</code>), <b>Inferred</b>, and <b>peakst8 proposal</b> (not in SweatPals, added for club admins).</p>
  <div class="filters" role="group" aria-label="Filters">
    <div class="fg" id="f-phase"><span class="lbl">Phase</span></div>
    <div class="fg" id="f-by"><span class="lbl">Set by</span></div>
    <div class="fg" id="f-proto"><span class="lbl">Prototype</span></div>
    <div class="fg"><label class="lbl" for="q">Search</label><input id="q" type="search" placeholder="e.g. guest pass"></div>
  </div>
  <span class="shown" id="shown" aria-live="polite"></span>
  <div class="tbl inv"><table><thead><tr><th>Feature</th><th>What SweatPals does</th><th>Configured by</th><th>peakst8 setting</th><th>Phase</th><th>Prototype</th></tr></thead><tbody id="rows"></tbody></table></div>
</section>

<section id="unknown">
  <h2>What we couldn't see</h2>
  <ul class="plain">{unknown_li}</ul>
  <p class="lead">To update this note, edit <a href="https://github.com/peakst8-Basecamp/product-notes/blob/main/memberships/coverage/features.json">features.json</a> and run <code>python3 memberships/coverage/build.py</code>.</p>
</section>
</main>
<footer>peakst8 · internal product note · <a href="https://github.com/peakst8-Basecamp/product-notes/tree/main/memberships/coverage">Source</a></footer>
</div>
<script id="data" type="application/json">{payload}</script>
<script>
(function(){{
  var D=JSON.parse(document.getElementById('data').textContent);
  var BY={json.dumps(BY)}, EV={json.dumps(EV)};
  var PH={json.dumps(PHASE)};
  var PRE={json.dumps(PREREQ_AREAS)};
  var st={{phase:'all',by:'all',proto:'all',q:''}};
  function esc(s){{return String(s).replace(/[&<>"]/g,function(c){{return {{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}}[c]}})}}
  function group(id,key,opts){{var g=document.getElementById(id);opts.forEach(function(o){{var b=document.createElement('button');b.type='button';b.textContent=o[1];b.dataset.v=o[0];b.setAttribute('aria-pressed',o[0]==='all');b.addEventListener('click',function(){{st[key]=o[0];[].forEach.call(g.querySelectorAll('button'),function(x){{x.setAttribute('aria-pressed',x.dataset.v===o[0])}});draw()}});g.appendChild(b)}})}}
  group('f-phase','phase',[['all','All'],['Prereq','Prerequisite'],['V1','V1'],['V2','V2'],['Later','Later'],['No','Not planned']]);
  group('f-by','by',[['all','All'],['club','Club admin'],['member','Member'],['system','System'],['admin','peakst8 admin']]);
  group('f-proto','proto',[['all','All'],['yes','Works now'],['no','Not yet']]);
  document.getElementById('q').addEventListener('input',function(e){{st.q=e.target.value.trim().toLowerCase();draw()}});
  function draw(){{
    var out=[],n=0;
    D.areas.forEach(function(a){{
      var rows=D.features.filter(function(r){{return r.area===a[0]
        &&(st.phase==='all'||r.phase===st.phase)&&(st.by==='all'||r.by===st.by)
        &&(st.proto==='all'||(st.proto==='yes')===r.prototype)
        &&(!st.q||(r.feature+' '+r.sweatpals+' '+r.setting+' '+r.source).toLowerCase().indexOf(st.q)>-1)}});
      if(!rows.length)return;n+=rows.length;
      var pre=PRE.indexOf(a[0])>-1;
      out.push('<tr class="area'+(pre?' pre':'')+'"><td colspan="6">'+a[0]+' · '+esc(a[1])+' · '+rows.length+(pre?' · launch prerequisite':'')+'</td></tr>');
      rows.forEach(function(r){{out.push('<tr><td>'+esc(r.feature)+'</td><td>'+esc(r.sweatpals)+'<span class="src">'+EV[r.evidence]+': '+esc(r.source)+'</span></td><td><span class="tag '+r.by+'">'+BY[r.by]+'</span></td><td>'+esc(r.setting)+'</td><td><span class="tag '+r.phase+'">'+PH[r.phase]+'</span></td><td>'+(r.prototype?'<span class="tag yes">✓ Works</span>':'<span class="tag">–</span>')+'</td></tr>')}});
    }});
    document.getElementById('rows').innerHTML=out.join('')||'<tr><td colspan="6">No features match these filters.</td></tr>';
    document.getElementById('shown').textContent='Showing '+n+' of '+D.features.length+' features';
  }}
  document.getElementById('showpre').addEventListener('click',function(){{var b=document.querySelector('#f-phase button[data-v="Prereq"]');if(b)b.click()}});
  draw();
}})();
</script>
</body>
</html>
"""
open(os.path.join(HERE, "index.html"), "w").write(html)
print(f"Built README.md and index.html: {total} features, Prereq {counts['Prereq']}, V1 {counts['V1']}, V2 {counts['V2']}, Later {counts['Later']}, No {counts['No']}, prototype {proto}")
