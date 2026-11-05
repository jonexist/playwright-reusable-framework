/**
 * Tiny in-memory demo app the framework's example tests run against, so a
 * fresh clone is green offline with no external site or backend.
 *
 * It deliberately mirrors the UI patterns the core helpers target:
 *   - credential login that lands on a role-specific page
 *   - a top-bar workspace COMBOBOX (tenant context, persisted in a cookie)
 *   - a data table: skeleton rows, debounced search, Filters > Status submenu,
 *     per-row "Open menu" actions, "Rows per page" footer
 *   - create form with inline validation + toast
 *   - read-only user: hidden actions + "Access Denied" page
 *   - a per-user capped resource (claim slot -> 409 when already held)
 *
 * Not production code. Credentials below are demo-only and match `.env.example`.
 */
const http = require("node:http");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 4173);

const USERS = {
  "admin@example.com": {
    password: "demo-admin-password",
    name: "Demo Admin",
    canWrite: true,
    landing: "/dashboard",
  },
  "viewer@example.com": {
    password: "demo-viewer-password",
    name: "Demo Viewer",
    canWrite: false,
    landing: "/items",
  },
};

const sessions = new Map(); // sid -> email
const workspaces = []; // { id, name }
const items = []; // { id, workspaceId, name, description, status }
const claims = new Set(); // emails holding the single claim slot
let nextId = 1;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((pair) => pair.trim().split("="))
      .filter(([key]) => key)
      .map(([key, ...rest]) => [key, decodeURIComponent(rest.join("="))])
  );
}

function currentUser(req) {
  const email = sessions.get(cookies(req).sid);
  return email ? { email, ...USERS[email] } : null;
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function sendHtml(res, html) {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

const STYLE = `
  body{font-family:system-ui,sans-serif;margin:0;color:#111}
  header{display:flex;gap:16px;align-items:center;padding:8px 16px;border-bottom:1px solid #ddd}
  header nav a{margin-right:12px}
  main{padding:16px;max-width:880px}
  label{display:block;margin:12px 0 4px}
  input,select,button{font:inherit;padding:6px 8px}
  table{border-collapse:collapse;width:100%;margin-top:12px}
  td,th{border-bottom:1px solid #eee;padding:6px 8px;text-align:left}
  .animate-pulse{background:#eee;color:transparent}
  [role=menu]{position:absolute;background:#fff;border:1px solid #ccc;padding:4px;z-index:5}
  [role=menu] [role=menuitem],[role=menu] [role=menuitemcheckbox]{display:block;padding:4px 8px;cursor:pointer;background:none;border:0;width:100%;text-align:left}
  [role=menuitemcheckbox][aria-checked=true]::before{content:"\\2713 "}
  .ws{position:relative;margin-left:auto}
  #ws-panel{position:absolute;right:0;background:#fff;border:1px solid #ccc;padding:8px;z-index:5;min-width:220px}
  #ws-list{list-style:none;margin:8px 0 0;padding:0}
  #ws-list li{padding:4px 6px;cursor:pointer}
  #toast{position:fixed;bottom:16px;right:16px;background:#111;color:#fff;padding:10px 14px;display:none}
  .error{color:#b00020;margin:4px 0}
`;

function layout({ title, user, body, script = "" }) {
  const nav = user
    ? `<nav><a href="/dashboard">Dashboard</a><a href="/items">Items</a><a href="/claim">Claim</a></nav>
       <div class="ws"><button id="ws-btn" role="combobox" aria-expanded="false" aria-haspopup="listbox">Select workspace</button>
         <div id="ws-panel" hidden>
           <input id="ws-search" placeholder="Search workspaces" />
           <ul id="ws-list" role="listbox"></ul>
         </div></div>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>${STYLE}</style></head><body>
<header><strong>Demo App</strong>${nav}</header>
<main>${body}</main><div id="toast" role="status"></div>
<script>
function toast(text){const t=document.getElementById("toast");t.textContent=text;t.style.display="block";clearTimeout(window.__t);window.__t=setTimeout(()=>{t.style.display="none"},4000)}
const cookie=(k)=>document.cookie.split("; ").map(p=>p.split("=")).find(([n])=>n===k)?.[1];
${user ? WORKSPACE_PICKER_JS : ""}
${script}
</script></body></html>`;
}

const WORKSPACE_PICKER_JS = `
(function(){
  const btn=document.getElementById("ws-btn"),panel=document.getElementById("ws-panel"),
        search=document.getElementById("ws-search"),list=document.getElementById("ws-list");
  let all=[];
  const selectedId=()=>cookie("workspace");
  function paintLabel(){const s=all.find(w=>String(w.id)===selectedId());btn.textContent=s?s.name:"Select workspace"}
  function paintList(){
    list.replaceChildren();
    const q=search.value.toLowerCase();
    all.filter(w=>w.name.toLowerCase().includes(q)).forEach(w=>{
      const li=document.createElement("li");li.setAttribute("role","option");li.textContent=w.name;
      li.onclick=()=>{document.cookie="workspace="+w.id+"; path=/";paintLabel();panel.hidden=true;btn.setAttribute("aria-expanded","false");window.dispatchEvent(new Event("workspace-changed"))};
      list.appendChild(li);
    });
  }
  async function load(){all=await (await fetch("/api/workspaces")).json();paintLabel();paintList()}
  btn.onclick=()=>{panel.hidden=!panel.hidden;btn.setAttribute("aria-expanded",String(!panel.hidden));if(!panel.hidden){load();search.focus()}};
  search.oninput=paintList;
  load();
})();`;

const LOGIN_PAGE = layout({
  title: "Demo App - Sign In",
  user: null,
  body: `<h1>Sign in to your account</h1>
<form id="f" novalidate>
  <label for="email">Email</label><input id="email" name="email" type="email" autocomplete="username">
  <label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password">
  <div role="alert" class="error" hidden></div>
  <p><button type="submit">Sign in</button></p>
</form>`,
  script: `
document.getElementById("f").onsubmit=async(e)=>{
  e.preventDefault();
  const alertBox=document.querySelector("[role=alert]");alertBox.hidden=true;
  const r=await fetch("/api/login",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({email:email.value,password:password.value})});
  const data=await r.json();
  if(r.ok){location.href=data.landing}else{alertBox.textContent=data.error;alertBox.hidden=false}
};`,
});

const PAGES = {
  "/dashboard": (user) => ({
    title: "Demo App - Dashboard",
    body: `<h1>Dashboard</h1><p>Welcome, ${user.name}.</p>
      ${user.canWrite ? `<p><a href="/workspaces/new">Create New Workspace</a></p>` : ""}`,
  }),

  "/workspaces/new": (user) =>
    user.canWrite
      ? {
          title: "Demo App - New Workspace",
          body: `<h1>Create Workspace</h1>
<form id="f" novalidate>
  <label for="name">Workspace name</label><input id="name">
  <div class="error" id="err"></div>
  <p><button type="submit">Save Workspace</button></p>
</form>`,
          script: `
const nameEl=document.getElementById("name"); // bare \`name\` would be window.name
document.getElementById("f").onsubmit=async(e)=>{
  e.preventDefault();err.textContent="";
  if(!nameEl.value.trim()){err.textContent="Workspace name is required";return}
  const r=await fetch("/api/workspaces",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:nameEl.value})});
  if(r.ok){toast("Workspace created successfully!");setTimeout(()=>location.href="/dashboard",600)}else{toast("Could not create workspace")}
};`,
        }
      : accessDenied(),

  "/items": (user) => ({
    title: "Demo App - Items",
    body: `<h1>Items</h1>
${user.canWrite ? `<p><a href="/items/new">Create New Item</a></p>` : ""}
<div style="position:relative">
  <input id="q" placeholder="Search items">
  <button id="filters">Filters</button>
  <div id="filter-menu" role="menu" hidden>
    <div role="menuitem" id="status-item" tabindex="0">Status</div>
    <div id="status-sub" role="group" hidden>
      <div role="menuitemcheckbox" aria-checked="false" data-v="active" tabindex="0">Active</div>
      <div role="menuitemcheckbox" aria-checked="false" data-v="archived" tabindex="0">Archived</div>
    </div>
  </div>
</div>
<table><thead><tr><th>Name</th><th>Status</th><th></th></tr></thead><tbody id="rows"></tbody></table>
<p>Rows per page: <select><option>10</option><option>25</option></select></p>`,
    script: `
const canWrite=${user.canWrite};
const rows=document.getElementById("rows");
const state={search:"",status:""};
function skeleton(){rows.replaceChildren();for(let i=0;i<3;i++){const tr=rows.insertRow();for(let j=0;j<3;j++){const td=tr.insertCell();td.className="animate-pulse";td.textContent="loading"}}}
function closeMenus(){document.querySelectorAll("[role=menu]").forEach(m=>{if(m.id!=="filter-menu")m.remove()})}
function rowMenu(btn,item){
  closeMenus();
  const m=document.createElement("div");m.setAttribute("role","menu");
  const mk=(label,fn)=>{const b=document.createElement("button");b.setAttribute("role","menuitem");b.textContent=label;b.onclick=async()=>{m.remove();await fn()};m.appendChild(b)};
  mk("Archive",async()=>{await fetch("/api/items/"+item.id,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:"archived"})});toast("Item archived");load()});
  mk("Delete",async()=>{await fetch("/api/items/"+item.id,{method:"DELETE"});toast("Item deleted");load()});
  btn.after(m);
}
async function load(){
  skeleton();
  const qs=new URLSearchParams();if(state.search)qs.set("search",state.search);if(state.status)qs.set("status",state.status);
  const res=await fetch("/api/items?"+qs);const data=await res.json();
  rows.replaceChildren();
  if(data.needsWorkspace){const tr=rows.insertRow();tr.insertCell().textContent="Select a workspace to see items";return}
  data.items.forEach(item=>{
    const tr=rows.insertRow();
    tr.insertCell().textContent=item.name;
    tr.insertCell().textContent=item.status;
    const td=tr.insertCell();
    if(canWrite){const b=document.createElement("button");b.textContent="...";b.setAttribute("aria-label","Open menu");b.onclick=()=>rowMenu(b,item);td.appendChild(b)}
  });
}
let t;q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{state.search=q.value;load()},300)};
const fm=document.getElementById("filter-menu"),sub=document.getElementById("status-sub");
filters.onclick=()=>{fm.hidden=!fm.hidden};
document.getElementById("status-item").onmouseenter=()=>{sub.hidden=false};
sub.querySelectorAll("[role=menuitemcheckbox]").forEach(o=>o.onclick=()=>{
  const on=o.getAttribute("aria-checked")==="true";
  sub.querySelectorAll("[role=menuitemcheckbox]").forEach(x=>x.setAttribute("aria-checked","false"));
  o.setAttribute("aria-checked",String(!on));state.status=on?"":o.dataset.v;load();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){fm.hidden=true;closeMenus()}});
window.addEventListener("workspace-changed",load);
load();`,
  }),

  "/items/new": (user) =>
    user.canWrite
      ? {
          title: "Demo App - New Item",
          body: `<h1>Create Item</h1>
<form id="f" novalidate>
  <label for="name">Item name</label><input id="name"><div class="error" id="err-name"></div>
  <label for="description">Description</label><input id="description">
  <p><button type="submit">Save Item</button></p>
</form>`,
          script: `
const nameEl=document.getElementById("name"); // bare \`name\` would be window.name
const descriptionEl=document.getElementById("description");
document.getElementById("f").onsubmit=async(e)=>{
  e.preventDefault();document.getElementById("err-name").textContent="";
  if(!nameEl.value.trim()){document.getElementById("err-name").textContent="Item name is required";return}
  const r=await fetch("/api/items",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:nameEl.value,description:descriptionEl.value})});
  if(r.ok){toast("Item created successfully!");setTimeout(()=>location.href="/items",600)}
  else{const d=await r.json();toast(d.error||"Could not create item")}
};`,
        }
      : accessDenied(),

  "/claim": () => ({
    title: "Demo App - Claim",
    body: `<h1>Claim Slot</h1><p id="state">Slot is free</p>
<button id="claim">Claim slot</button> <button id="release">Release slot</button>`,
    script: `
claim.onclick=async()=>{const r=await fetch("/api/claim",{method:"POST"});
  if(r.ok){toast("Slot claimed");state.textContent="You hold the slot"}else{toast("Slot already held")}};
release.onclick=async()=>{await fetch("/api/release",{method:"POST"});toast("Slot released");state.textContent="Slot is free"};`,
  }),
};

function accessDenied() {
  return {
    title: "Demo App - Access Denied",
    body: `<h1>Access Denied</h1><p>Your role does not have permission to create new records in this module.</p>`,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/(.)\/$/, "$1");
  const user = currentUser(req);

  try {
    if (path === "/api/health") return sendJson(res, 200, { status: "ok" });

    if (path === "/api/login" && req.method === "POST") {
      const { email, password } = await readJson(req);
      const found = USERS[email];
      if (!found || found.password !== password) {
        return sendJson(res, 401, { error: "Invalid email or password" });
      }
      const sid = crypto.randomUUID();
      sessions.set(sid, email);
      res.setHeader("set-cookie", `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`);
      return sendJson(res, 200, { landing: found.landing });
    }

    if (path === "/login") return sendHtml(res, LOGIN_PAGE);

    if (path === "/") {
      res.writeHead(302, { location: user ? user.landing : "/login" });
      return res.end();
    }

    // Everything below needs a session.
    if (!user) {
      if (path.startsWith("/api/")) return sendJson(res, 401, { error: "Unauthorized" });
      res.writeHead(302, { location: "/login" });
      return res.end();
    }

    if (PAGES[path] && req.method === "GET") {
      return sendHtml(res, layout({ user, ...PAGES[path](user) }));
    }

    if (path === "/api/workspaces" && req.method === "GET") {
      return sendJson(res, 200, workspaces);
    }
    if (path === "/api/workspaces" && req.method === "POST") {
      if (!user.canWrite) return sendJson(res, 403, { error: "Forbidden" });
      const { name } = await readJson(req);
      const workspace = { id: nextId++, name: String(name || "").trim() };
      workspaces.push(workspace);
      return sendJson(res, 201, workspace);
    }

    if (path === "/api/items" && req.method === "GET") {
      await sleep(150); // keep the loading skeleton observable
      const workspaceId = Number(cookies(req).workspace);
      if (!workspaceId) return sendJson(res, 200, { needsWorkspace: true, items: [] });
      const search = (url.searchParams.get("search") || "").toLowerCase();
      const status = url.searchParams.get("status");
      return sendJson(res, 200, {
        items: items
          .filter((i) => i.workspaceId === workspaceId)
          .filter((i) => !search || i.name.toLowerCase().includes(search))
          .filter((i) => !status || i.status === status),
      });
    }
    if (path === "/api/items" && req.method === "POST") {
      if (!user.canWrite) return sendJson(res, 403, { error: "Forbidden" });
      const workspaceId = Number(cookies(req).workspace);
      if (!workspaceId) return sendJson(res, 400, { error: "Select a workspace first" });
      const { name, description } = await readJson(req);
      const item = {
        id: nextId++,
        workspaceId,
        name: String(name || "").trim(),
        description: String(description || ""),
        status: "active",
      };
      items.push(item);
      return sendJson(res, 201, item);
    }

    const itemMatch = path.match(/^\/api\/items\/+(\d+)$/);
    if (itemMatch) {
      if (!user.canWrite) return sendJson(res, 403, { error: "Forbidden" });
      const index = items.findIndex((i) => i.id === Number(itemMatch[1]));
      if (index < 0) return sendJson(res, 404, { error: "Not found" });
      if (req.method === "DELETE") {
        items.splice(index, 1);
        return sendJson(res, 204, {});
      }
      if (req.method === "PATCH") {
        Object.assign(items[index], await readJson(req));
        return sendJson(res, 200, items[index]);
      }
    }

    if (path === "/api/claim" && req.method === "POST") {
      if (claims.has(user.email)) return sendJson(res, 409, { error: "Slot already held" });
      claims.add(user.email);
      return sendJson(res, 200, { claimed: true });
    }
    if (path === "/api/release" && req.method === "POST") {
      claims.delete(user.email);
      return sendJson(res, 200, { claimed: false });
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (error) {
    sendJson(res, 500, { error: String(error) });
  }
});

server.listen(PORT, () => {
  console.log(`Demo app listening on http://localhost:${PORT}`);
});
