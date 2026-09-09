const SUPABASE_URL="https://txwgxpmgegntsnvamtda.supabase.co";
const SUPABASE_KEY="sb_publishable_IG_YmrreIPbgnt05gubpHw_CriLdyfV";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const TYPES=["Auto","Auto Frota","Residencial","Empresarial","Vida PJ","Vida PF","RC Cyber","RC Profissional","RC Obra","RC Médico","Fiança Locatícia","Garantia","Transporte","Viagem","Vida AP","Evento","D&O","Bike","Bike Elétrica","Vida","Outro"];

const INSURERS=["Porto Seguro","Tokio Marine","Azul Seguros","Allianz","HDI Seguros","Mapfre","Bradesco Seguros","Zurich","Suhai","Sompo","Liberty","Itaú Seguros","SulAmérica","Mitsui Sumitomo","Chubb","AXA","Generali","Zurich Santander","MAG Seguros","Prudential","MetLife","Icatu","Pottencial","Junto Seguros","Essor","Fairfax","Argo Seguros","Akad Seguros","Excelsior","Too Seguros","Alfa Seguradora","Austral","Sancor","Kovr","Newe","Outra"];

const state={
  user:null,
  clients:[],
  policies:[],
  events:[],
  settings:{
    endpoint:"",
    managerEmail:"",
    language:"pt-BR"
  }
};

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const uid=()=>crypto.randomUUID();

const cleanPhone=v=>
  String(v||"").replace(/\D/g,"");

const esc=s=>
  String(s??"").replace(
    /[&<>"']/g,
    m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[m])
  );

const fmtDate=d=>
  d
    ? new Intl.DateTimeFormat("pt-BR")
        .format(new Date(d+"T12:00:00"))
    : "—";

const iso=d=>{
  const x=new Date(d);

  return new Date(
    x.getTime()-
    x.getTimezoneOffset()*60000
  )
  .toISOString()
  .slice(0,10);
};

const daysUntil=d=>{
  if(!d)return 0;

  const [y,m,day]=
    d.split("-").map(Number);

  const target=
    Date.UTC(y,m-1,day);

  const now=
    new Date();

  const cur=
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  return Math.round(
    (target-cur)/86400000
  );
};

const initials=n=>
  (n||"?")
    .split(" ")
    .slice(0,2)
    .map(x=>x[0])
    .join("")
    .toUpperCase();


function validBrazilPhone(v){

  const n=
    cleanPhone(v);

  if(
    n.length!==10 &&
    n.length!==11
  )return false;

  if(/^(\d)\1+$/.test(n))
    return false;

  if(
    /^0/.test(n) ||
    /^1/.test(n)
  )return false;

  return /^[1-9]{2}9?[2-9]\d{7}$/
    .test(n);
}


function formatPhone(n){

  n=cleanPhone(n);

  if(n.length===11)
    return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;

  if(n.length===10)
    return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;

  return n;
}


function clientById(id){
  return state.clients.find(
    c=>c.id===id
  );
}


function policyById(id){
  return state.policies.find(
    p=>p.id===id
  );
}


function processClass(s){

  return s==="Ganho"
    ?"green"
    :s==="Em andamento"
      ?"orange"
      :"gray";
}


function expiryLabel(p){

  const d=
    daysUntil(p.endDate);

  if(d<0)
    return{
      text:`Vencida há ${Math.abs(d)} dias`,
      cls:"red"
    };

  if(d===0)
    return{
      text:"Vence hoje",
      cls:"red"
    };

  if(d<=30)
    return{
      text:`Vence em ${d} dias`,
      cls:"orange"
    };

  return{
    text:"Vigente",
    cls:"green"
  };
}


function toast(msg){

  const el=$("#toast");

  if(!el)return;

  el.textContent=msg;

  el.classList.add("show");

  clearTimeout(toast._t);

  toast._t=
    setTimeout(
      ()=>el.classList.remove("show"),
      3200
    );
}


function showLogin(){

  $("#loginScreen")
    .classList
    .remove("hidden");

  $("#app")
    .classList
    .add("hidden");
}


function showApp(){

  $("#loginScreen")
    .classList
    .add("hidden");

  $("#app")
    .classList
    .remove("hidden");
}


/* =========================================================
   CONVERSÃO SUPABASE
========================================================= */

function clientFromDb(r){

  return{
    id:r.id,
    name:r.name,
    birthDate:r.birth_date||"",
    phone:r.phone||"",
    document:r.document||"",
    email:r.email||"",
    notes:r.notes||"",
    createdAt:r.created_at,
    updatedAt:r.updated_at
  };
}


function clientToDb(c){

  return{
    id:c.id,
    user_id:state.user.id,
    name:c.name,
    birth_date:c.birthDate||null,
    phone:c.phone,
    document:c.document||null,
    email:c.email||null,
    notes:c.notes||null,
    created_at:
      c.createdAt||
      new Date().toISOString(),
    updated_at:
      new Date().toISOString()
  };
}


function policyFromDb(r){

  return{
    id:r.id,
    clientId:r.client_id,
    insurer:r.insurer,
    type:r.type,
    number:r.number||"",
    startDate:r.start_date||"",
    endDate:r.end_date||"",
    status:r.status||"Pendente",
    notes:r.notes||"",

    alerts:{
      30:r.alert_30!==false,
      15:r.alert_15!==false,
      7:r.alert_7!==false,
      1:r.alert_1!==false,
      expired:r.alert_expired!==false
    },

    pdfPath:r.pdf_path||null,
    pdfId:r.pdf_path||null,
    renewedFrom:r.renewed_from||null,
    createdAt:r.created_at,
    updatedAt:r.updated_at
  };
}


function policyToDb(p){

  return{
    id:p.id,
    user_id:state.user.id,
    client_id:p.clientId,
    insurer:p.insurer,
    type:p.type,
    number:p.number||null,
    start_date:p.startDate||null,
    end_date:p.endDate||null,
    status:p.status||"Pendente",
    notes:p.notes||null,

    alert_30:
      p.alerts?.[30]!==false,

    alert_15:
      p.alerts?.[15]!==false,

    alert_7:
      p.alerts?.[7]!==false,

    alert_1:
      p.alerts?.[1]!==false,

    alert_expired:
      p.alerts?.expired!==false,

    pdf_path:
      p.pdfPath||null,

    renewed_from:
      p.renewedFrom||null,

    created_at:
      p.createdAt||
      new Date().toISOString(),

    updated_at:
      new Date().toISOString()
  };
}


function eventFromDb(r){

  return{
    id:r.id,
    policyId:r.policy_id,
    type:r.type||"",
    message:r.message,
    date:r.created_at
  };
}


/* =========================================================
   HISTÓRICO
========================================================= */

async function addEvent(
  policyId,
  type,
  message
){

  const row={
    id:uid(),
    user_id:state.user.id,
    policy_id:policyId,
    type,
    message,
    created_at:
      new Date().toISOString()
  };

  const {data,error}=
    await sb
      .from("events")
      .insert(row)
      .select()
      .single();

  if(error)
    throw error;

  const ev=
    eventFromDb(data);

  state.events.push(ev);

  return ev;
}


/* =========================================================
   CARREGAR NUVEM
========================================================= */

async function loadCloudData(){

  if(!state.user)
    return;

  try{

    const [c,p,e,s]=
      await Promise.all([

        sb
          .from("clients")
          .select("*")
          .order("name"),

        sb
          .from("policies")
          .select("*")
          .order("end_date"),

        sb
          .from("events")
          .select("*")
          .order(
            "created_at",
            {ascending:false}
          ),

        sb
          .from("settings")
          .select("*")
          .maybeSingle()

      ]);

    for(const r of [c,p,e,s]){

      if(r.error)
        throw r.error;

    }

    state.clients=
      (c.data||[])
        .map(clientFromDb);

    state.policies=
      (p.data||[])
        .map(policyFromDb);

    state.events=
      (e.data||[])
        .map(eventFromDb);

    state.settings=
      s.data
        ?{
            endpoint:
              s.data.email_endpoint||"",

            managerEmail:
              s.data.manager_email||"",

            language:
              s.data.language||"pt-BR"
          }
        :{
            endpoint:"",
            managerEmail:"",
            language:"pt-BR"
          };

    renderAll();

  }
  catch(err){

    console.error(err);

    toast(
      "Não foi possível carregar os dados do Supabase."
    );

  }
}


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

async function saveSettings(){

  const payload={
    user_id:
      state.user.id,

    manager_email:
      state.settings.managerEmail||null,

    email_endpoint:
      state.settings.endpoint||null,

    language:
      state.settings.language||"pt-BR",

    updated_at:
      new Date().toISOString()
  };

  const {error}=
    await sb
      .from("settings")
      .upsert(
        payload,
        {onConflict:"user_id"}
      );

  if(error)
    throw error;
}


/* =========================================================
   SELECTS
========================================================= */

function populateSelects(){

  const type=
    $("#typeFilter");

  const ins=
    $("#insurerFilter");

  const pType=
    $("#policyType");

  const pIns=
    $("#policyInsurer");

  const pClient=
    $("#policyClient");

  if(
    !type||
    !ins||
    !pType||
    !pIns||
    !pClient
  )return;

  pType.innerHTML=
    TYPES
      .map(
        x=>`<option>${esc(x)}</option>`
      )
      .join("");

  pIns.innerHTML=
    INSURERS
      .map(
        x=>`<option>${esc(x)}</option>`
      )
      .join("");

  type.innerHTML=
    `<option value="all">Todos os tipos</option>`+
    TYPES
      .map(
        x=>`<option>${esc(x)}</option>`
      )
      .join("");

  ins.innerHTML=
    `<option value="all">Todas as seguradoras</option>`+
    INSURERS
      .map(
        x=>`<option>${esc(x)}</option>`
      )
      .join("");

  pClient.innerHTML=
    `<option value="">Selecione...</option>`+
    [...state.clients]
      .sort(
        (a,b)=>
          a.name.localeCompare(b.name)
      )
      .map(
        c=>
          `<option value="${c.id}">${esc(c.name)}</option>`
      )
      .join("");
}


/* =========================================================
   RENDER GERAL
========================================================= */

function renderAll(){

  if(!state.user)
    return;

  populateSelects();
  renderDashboard();
  renderClients();
  renderPolicies();
  renderKanban();
  renderConfig();
  checkAutomation();
}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard(){

  const total=
    state.policies.length;

  const e7=
    state.policies
      .filter(
        p=>
          daysUntil(p.endDate)>=0 &&
          daysUntil(p.endDate)<=7
      )
      .length;

  const expired=
    state.policies
      .filter(
        p=>
          daysUntil(p.endDate)<0
      )
      .length;

  const won=
    state.policies
      .filter(
        p=>p.status==="Ganho"
      )
      .length;

  $("#statTotal").textContent=
    total;

  $("#stat7").textContent=
    e7;

  $("#statExpired").textContent=
    expired;

  $("#statWon").textContent=
    won;


  const upcoming=
    [...state.policies]
      .sort(
        (a,b)=>
          new Date(a.endDate)-
          new Date(b.endDate)
      )
      .filter(
        p=>
          daysUntil(p.endDate)<=30
      )
      .slice(0,8);


  $("#upcomingList").innerHTML=
    upcoming.length
      ?upcoming.map(
        p=>{

          const c=
            clientById(p.clientId);

          const e=
            expiryLabel(p);

          return `
            <div class="upcoming-item">

              <div>
                <div class="name">
                  ${esc(c?.name||"Cliente")}
                </div>

                <small>
                  ${esc(p.type)}
                  ·
                  ${esc(p.insurer)}
                </small>
              </div>

              <div>
                <small>Vigência</small>

                <b>
                  ${fmtDate(p.startDate)}
                  →
                  ${fmtDate(p.endDate)}
                </b>
              </div>

              <div>
                <span class="pill ${e.cls}">
                  ${e.text}
                </span>
              </div>

              <div class="actions">
                <button
                  class="action-btn"
                  onclick="openDetails('${p.id}')"
                >
                  Abrir
                </button>
              </div>

            </div>
          `;
        }
      ).join("")
      :`
        <div class="empty">
          Nenhuma apólice vencendo nos próximos 30 dias.
        </div>
      `;


  const counts={
    Pendente:
      state.policies
        .filter(
          p=>p.status==="Pendente"
        ).length,

    "Em andamento":
      state.policies
        .filter(
          p=>p.status==="Em andamento"
        ).length,

    Ganho:won
  };


  const max=
    Math.max(total,1);


  $("#processSummary").innerHTML=
    Object
      .entries(counts)
      .map(
        ([k,v])=>`

          <div class="process-line">

            <div class="line-top">
              <span>${k}</span>
              <b>${v}</b>
            </div>

            <div
              class="bar ${
                k==="Pendente"
                  ?"pendente"
                  :k==="Ganho"
                    ?"ganho"
                    :"andamento"
              }"
            >
              <i
                style="width:${v/max*100}%"
              ></i>
            </div>

          </div>
        `
      )
      .join("");


  const ic={};

  state.policies.forEach(
    p=>
      ic[p.insurer]=
        (ic[p.insurer]||0)+1
  );


  const top=
    Object
      .entries(ic)
      .sort(
        (a,b)=>b[1]-a[1]
      )
      .slice(0,10);


  $("#insurerSummary").innerHTML=
    top.length
      ?top.map(
        ([k,v])=>`

          <div class="insurer-chip">
            <strong>${v}</strong>
            <span>${esc(k)}</span>
          </div>

        `
      ).join("")
      :`
        <div class="empty">
          Cadastre uma apólice para começar.
        </div>
      `;
} function renderClients(){const q=($("#clientSearch")?.value||"").toLowerCase(),f=$("#clientFilter")?.value||"all";const arr=state.clients.filter(c=>{const ps=state.policies.filter(p=>p.clientId===c.id);if(f==="withPolicies"&&!ps.length)return false;if(f==="withoutPolicies"&&ps.length)return false;return[c.name,c.document,c.phone,c.email].join(" ").toLowerCase().includes(q)});$("#clientsGrid").innerHTML=arr.length?arr.map(c=>{const ps=state.policies.filter(p=>p.clientId===c.id);return `<article class="client-card"><div class="client-card-head"><div class="client-cell"><div class="avatar">${initials(c.name)}</div><div><h4>${esc(c.name)}</h4><small>${fmtDate(c.birthDate)}</small></div></div><span class="policy-count">${ps.length} apólice${ps.length===1?"":"s"}</span></div><div class="client-meta"><span>☎ ${esc(formatPhone(c.phone)||"Sem telefone")}</span><span>✉ ${esc(c.email||"Sem e-mail")}</span><span>▣ ${esc(c.document||"Documento não informado")}</span></div><div class="client-policies">${ps.slice(0,5).map(p=>`<div class="mini-policy"><span>${esc(p.type)} · ${esc(p.insurer)}</span><b>${fmtDate(p.endDate)}</b></div>`).join("")}${ps.length>5?`<small>+ ${ps.length-5} apólice(s)</small>`:""}</div><div class="actions" style="margin-top:13px"><button class="action-btn" onclick="openClient('${c.id}')">Editar</button><button class="action-btn" onclick="newPolicyFor('${c.id}')">＋ Apólice</button><button class="action-btn" style="color:#b42318;border-color:#fecdca;background:#fff5f5" onclick="deleteClient('${c.id}')">🗑 Excluir</button></div></article>`}).join(""):`<div class="empty">Nenhum cliente encontrado.</div>`}

function renderPolicies(){const q=($("#policySearch")?.value||"").toLowerCase(),sf=$("#statusFilter")?.value||"all",ef=$("#expiryFilter")?.value||"all",tf=$("#typeFilter")?.value||"all",inf=$("#insurerFilter")?.value||"all";const arr=[...state.policies].filter(p=>{const c=clientById(p.clientId),hay=[c?.name,p.number,p.insurer,p.type].join(" ").toLowerCase();if(q&&!hay.includes(q))return false;if(sf!=="all"&&p.status!==sf)return false;if(tf!=="all"&&p.type!==tf)return false;if(inf!=="all"&&p.insurer!==inf)return false;const d=daysUntil(p.endDate);if(ef==="expired"&&d>=0)return false;if(ef!=="all"&&ef!=="expired"&&!(d>=0&&d<=Number(ef)))return false;return true}).sort((a,b)=>new Date(a.endDate)-new Date(b.endDate));$("#policiesTable").innerHTML=arr.length?arr.map(p=>{const c=clientById(p.clientId),e=expiryLabel(p);return `<tr><td><div class="client-cell"><div class="avatar">${initials(c?.name)}</div><div><strong>${esc(c?.name||"Cliente")}</strong><small>${esc(formatPhone(c?.phone)||"")}</small></div></div></td><td><b>${esc(p.type)}</b><small style="display:block;color:#667085">${esc(p.number)}</small></td><td>${esc(p.insurer)}</td><td>${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}</td><td><span class="pill ${processClass(p.status)}">${esc(p.status)}</span></td><td><span class="pill ${e.cls}">${e.text}</span></td><td><div class="actions"><button class="action-btn" onclick="openDetails('${p.id}')">Ver</button><button class="action-btn" onclick="editPolicy('${p.id}')">Editar</button><button class="action-btn" onclick="renewPolicy('${p.id}')">↻</button>${p.pdfPath?`<button class="action-btn" onclick="openPdf('${p.id}')">PDF</button>`:""}</div></td></tr>`}).join(""):`<tr><td colspan="7"><div class="empty">Nenhuma apólice encontrada.</div></td></tr>`}

function renderKanban(){const cols=["Pendente","Em andamento","Ganho"];$("#kanban").innerHTML=cols.map(s=>{const ps=state.policies.filter(p=>p.status===s);return `<div class="kanban-col ${s==="Pendente"?"pendente":s==="Ganho"?"ganho":"andamento"}"><h4><span>${s}</span><span>${ps.length}</span></h4>${ps.map(p=>{const c=clientById(p.clientId);return `<div class="kanban-card"><strong>${esc(c?.name||"Cliente")}</strong><small>${esc(p.type)} · ${esc(p.insurer)}<br>Vence: ${fmtDate(p.endDate)}</small><select onchange="changeStatus('${p.id}',this.value)"><option ${p.status==="Pendente"?"selected":""}>Pendente</option><option ${p.status==="Em andamento"?"selected":""}>Em andamento</option><option ${p.status==="Ganho"?"selected":""}>Ganho</option></select></div>`}).join("")}</div>`}).join("")}
function renderConfig(){$("#cfgUser").value=state.user?.email||"";$("#emailEndpoint").value=state.settings.endpoint||"";$("#managerEmail").value=state.settings.managerEmail||""}
function go(view){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+view).classList.add('active');$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));const titles={dashboard:'Dashboard',clientes:'Clientes',apolices:'Apólices',renovacoes:'Renovações',relatorios:'Relatórios',config:'Configurações'};$('#pageTitle').textContent=titles[view]||'Dashboard';if(view==='dashboard')renderDashboard()}
function openModal(id){$('#'+id).classList.add('open')}
function closeModal(id){$('#'+id).classList.remove('open');if(id==='pdfModal')$('#pdfFrame').src=''}

function newClient(){$('#clientForm').reset();$('#clientId').value='';$('#clientModalTitle').textContent='Novo cliente';openModal('clientModal')}
function openClient(id){const c=clientById(id);if(!c)return;$('#clientId').value=c.id;$('#clientName').value=c.name;$('#clientBirth').value=c.birthDate;$('#clientPhone').value=formatPhone(c.phone);$('#clientDoc').value=c.document||'';$('#clientEmail').value=c.email||'';$('#clientNotes').value=c.notes||'';$('#clientModalTitle').textContent='Editar cliente';openModal('clientModal')}
async function saveClient(e){e.preventDefault();const phone=cleanPhone($('#clientPhone').value);if(!validBrazilPhone(phone)){toast('Informe um telefone celular válido com DDD.');return}const id=$('#clientId').value||uid(),old=clientById(id),c={id,name:$('#clientName').value.trim(),birthDate:$('#clientBirth').value,phone,document:$('#clientDoc').value.trim(),email:$('#clientEmail').value.trim(),notes:$('#clientNotes').value.trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};try{const {data,error}=await sb.from('clients').upsert(clientToDb(c)).select().single();if(error)throw error;const saved=clientFromDb(data),i=state.clients.findIndex(x=>x.id===saved.id);if(i>=0)state.clients[i]=saved;else state.clients.push(saved);closeModal('clientModal');renderAll();toast('Cliente salvo na nuvem.')}catch(err){console.error(err);toast('Não foi possível salvar o cliente.')}}

function resetPolicyForm(clientId=''){$('#policyForm').reset();$('#policyId').value='';$('#policyParentId').value='';$('#policyRenewedFrom').value='';$('#currentPdfName').textContent='';$('#renewInfo').classList.add('hidden');populateSelects();$('#policyClient').value=clientId;$('#policyStatus').value='Pendente';$('#policyModalTitle').textContent='Nova apólice'}
function newPolicyFor(clientId=''){resetPolicyForm(clientId);openModal('policyModal')}
async function editPolicy(id){const p=policyById(id);if(!p)return;resetPolicyForm(p.clientId);$('#policyId').value=p.id;$('#policyInsurer').value=p.insurer;$('#policyType').value=p.type;$('#policyNumber').value=p.number;$('#policyStart').value=p.startDate;$('#policyEnd').value=p.endDate;$('#policyStatus').value=p.status;$('#policyNotes').value=p.notes||'';$('#alert30').checked=p.alerts?.[30]!==false;$('#alert15').checked=p.alerts?.[15]!==false;$('#alert7').checked=p.alerts?.[7]!==false;$('#alert1').checked=p.alerts?.[1]!==false;$('#alertExpired').checked=p.alerts?.expired!==false;if(p.pdfPath)$('#currentPdfName').textContent='PDF atual: '+decodeURIComponent(p.pdfPath.split('/').pop());$('#policyModalTitle').textContent='Editar apólice';openModal('policyModal')}
function safeFileName(name){return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-').replace(/-+/g,'-')}
async function uploadPolicyPdf(policyId,file){if(!file)return null;if(file.type!=='application/pdf')throw new Error('O anexo precisa ser PDF.');const path=`${state.user.id}/${policyId}/${Date.now()}-${safeFileName(file.name)}`;const {error}=await sb.storage.from('policy-pdfs').upload(path,file,{cacheControl:'3600',contentType:'application/pdf',upsert:false});if(error)throw error;return path}
async function savePolicy(e){e.preventDefault();const clientId=$('#policyClient').value;if(!clientId){toast('Selecione o cliente.');return null}if($('#policyStart').value>$('#policyEnd').value){toast('O fim da vigência não pode ser anterior ao início.');return null}const oldId=$('#policyId').value,existing=oldId?policyById(oldId):null,id=oldId||uid(),file=$('#policyPdf').files[0];let pdfPath=existing?.pdfPath||null,newPdfPath=null;try{if(file){newPdfPath=await uploadPolicyPdf(id,file);pdfPath=newPdfPath}const p={id,clientId,insurer:$('#policyInsurer').value,type:$('#policyType').value,number:$('#policyNumber').value.trim(),startDate:$('#policyStart').value,endDate:$('#policyEnd').value,status:$('#policyStatus').value,notes:$('#policyNotes').value.trim(),alerts:{30:$('#alert30').checked,15:$('#alert15').checked,7:$('#alert7').checked,1:$('#alert1').checked,expired:$('#alertExpired').checked},pdfPath,renewedFrom:$('#policyRenewedFrom').value||existing?.renewedFrom||null,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};const {data,error}=await sb.from('policies').upsert(policyToDb(p)).select().single();if(error)throw error;if(newPdfPath&&existing?.pdfPath&&existing.pdfPath!==newPdfPath)await sb.storage.from('policy-pdfs').remove([existing.pdfPath]);const saved=policyFromDb(data),i=state.policies.findIndex(x=>x.id===saved.id);if(i>=0)state.policies[i]=saved;else state.policies.push(saved);await addEvent(saved.id,oldId?'edit':'created',oldId?'Apólice atualizada':'Apólice cadastrada');closeModal('policyModal');renderAll();toast('Apólice salva na nuvem.');return saved}catch(err){console.error(err);if(newPdfPath)await sb.storage.from('policy-pdfs').remove([newPdfPath]);toast(err.message==='O anexo precisa ser PDF.'?err.message:'Não foi possível salvar a apólice.');return null}}
async function openPdf(id){const p=policyById(id);if(!p?.pdfPath){toast('Esta apólice não possui PDF.');return}try{const {data,error}=await sb.storage.from('policy-pdfs').createSignedUrl(p.pdfPath,600);if(error)throw error;$('#pdfTitle').textContent=decodeURIComponent(p.pdfPath.split('/').pop());$('#pdfFrame').src=data.signedUrl;openModal('pdfModal')}catch(err){console.error(err);toast('Não foi possível abrir o PDF.')}}
async function changeStatus(id,status){const p=policyById(id);if(!p)return;const prev=p.status;p.status=status;try{const {error}=await sb.from('policies').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error;await addEvent(id,'status','Status alterado para '+status);renderAll();toast('Status atualizado.')}catch(err){p.status=prev;console.error(err);renderAll();toast('Não foi possível atualizar o status.')}}
function renewPolicy(id){const old=policyById(id);if(!old)return;resetPolicyForm(old.clientId);$('#policyRenewedFrom').value=old.id;$('#policyInsurer').value=old.insurer;$('#policyType').value=old.type;$('#policyStatus').value='Em andamento';$('#policyNotes').value=`Renovação da apólice ${old.number}. Histórico da apólice anterior mantido no CRM.`;$('#renewInfo').textContent=`Esta nova apólice ficará vinculada à anterior (${old.number}). A apólice antiga não será apagada.`;$('#renewInfo').classList.remove('hidden');$('#policyModalTitle').textContent='Nova apólice de renovação';openModal('policyModal')}
async function finalizeRenewal(oldId){const old=policyById(oldId);if(!old)return;try{const {error}=await sb.from('policies').update({status:'Ganho',updated_at:new Date().toISOString()}).eq('id',oldId);if(error)throw error;old.status='Ganho';await addEvent(oldId,'renewal','Apólice renovada; novo ciclo criado')}catch(err){console.error(err);toast('A nova apólice foi salva, mas não foi possível finalizar a anterior.')}}

function openDetails(id){const p=policyById(id);if(!p)return;const c=clientById(p.clientId),e=expiryLabel(p),history=state.events.filter(x=>x.policyId===id).sort((a,b)=>new Date(b.date)-new Date(a.date));$('#detailsTitle').textContent=c?.name||'Cliente';$('#detailsSubtitle').textContent=`${p.type} · ${p.insurer}`;$('#detailsBody').innerHTML=`<div class="details-grid"><div class="detail-box"><small>Segurado</small><strong>${esc(c?.name)}</strong></div><div class="detail-box"><small>Nascimento</small><strong>${fmtDate(c?.birthDate)}</strong></div><div class="detail-box"><small>Telefone</small><strong>${esc(formatPhone(c?.phone)||'—')}</strong></div><div class="detail-box"><small>Seguradora</small><strong>${esc(p.insurer)}</strong></div><div class="detail-box"><small>Tipo</small><strong>${esc(p.type)}</strong></div><div class="detail-box"><small>Nº apólice</small><strong>${esc(p.number)}</strong></div><div class="detail-box"><small>Início da vigência</small><strong>${fmtDate(p.startDate)}</strong></div><div class="detail-box"><small>Fim da vigência</small><strong>${fmtDate(p.endDate)}</strong></div><div class="detail-box"><small>Situação</small><strong><span class="pill ${e.cls}">${e.text}</span></strong></div><div class="detail-box"><small>Renovação</small><strong><span class="pill ${processClass(p.status)}">${esc(p.status)}</span></strong></div><div class="detail-box"><small>PDF</small><strong>${p.pdfPath?`<button class="link-btn" onclick="openPdf('${p.id}')">Abrir documento</button>`:'Sem anexo'}</strong></div><div class="detail-box detail-wide"><small>Observações</small><strong>${esc(p.notes||'Sem observações')}</strong></div></div><div class="modal-actions" style="margin-top:15px"><button class="btn btn-secondary" onclick="sendEmail('${p.id}')">✉ Lembrete por e-mail</button><button class="btn btn-secondary" onclick="manualWhatsApp('${p.id}')">WhatsApp</button><button class="btn btn-secondary" onclick="editPolicy('${p.id}');closeModal('detailsModal')">Editar</button><button class="btn btn-secondary" style="color:#b42318;border-color:#fecdca;background:#fff5f5" onclick="deletePolicy('${p.id}')">🗑 Excluir</button><button class="btn btn-primary" onclick="renewPolicy('${p.id}');closeModal('detailsModal')">↻ Renovar apólice</button></div><div class="timeline"><h4>Histórico</h4>${history.length?history.map(h=>`<div class="timeline-item"><b>${esc(h.message)}</b><small>${new Date(h.date).toLocaleString('pt-BR')}</small></div>`).join(''):`<p class="mini-note">Sem eventos registrados.</p>`}</div>`;openModal('detailsModal')}

function createDeleteModal(){if(document.getElementById('deleteSystemModal'))return;const style=document.createElement('style');style.textContent=`.delete-system-overlay{position:fixed;inset:0;background:rgba(15,23,42,.58);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;z-index:99999;padding:20px}.delete-system-overlay.open{display:flex}.delete-system-card{width:100%;max-width:460px;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.28);overflow:hidden}.delete-system-content{padding:30px 30px 22px;text-align:center}.delete-system-icon{width:62px;height:62px;margin:0 auto 18px;border-radius:50%;background:#fff1f0;color:#d92d20;display:flex;align-items:center;justify-content:center;font-size:27px;border:1px solid #fecdca}.delete-system-icon.warning{background:#fffaeb;color:#dc6803;border-color:#fedf89}.delete-system-title{margin:0 0 10px;color:#101828;font-size:20px;font-weight:700}.delete-system-message{margin:0;color:#667085;font-size:14px;line-height:1.6;white-space:pre-line}.delete-system-actions{display:flex;gap:10px;padding:18px 24px 24px}.delete-system-btn{flex:1;min-height:44px;border-radius:10px;border:1px solid #d0d5dd;background:#fff;color:#344054;font-size:14px;font-weight:600;cursor:pointer}.delete-system-btn-danger{border-color:#d92d20;background:#d92d20;color:#fff}.delete-system-btn-primary{border-color:#155eef;background:#155eef;color:#fff}@media(max-width:520px){.delete-system-actions{flex-direction:column-reverse}}`;document.head.appendChild(style);const modal=document.createElement('div');modal.id='deleteSystemModal';modal.className='delete-system-overlay';modal.innerHTML=`<div class="delete-system-card"><div class="delete-system-content"><div id="deleteSystemIcon" class="delete-system-icon">🗑</div><h3 id="deleteSystemTitle" class="delete-system-title">Confirmar exclusão</h3><p id="deleteSystemMessage" class="delete-system-message"></p></div><div id="deleteSystemActions" class="delete-system-actions"></div></div>`;document.body.appendChild(modal)}
function deleteAlert(title,message){createDeleteModal();return new Promise(resolve=>{const modal=$('#deleteSystemModal');$('#deleteSystemIcon').className='delete-system-icon warning';$('#deleteSystemIcon').textContent='!';$('#deleteSystemTitle').textContent=title;$('#deleteSystemMessage').textContent=message;$('#deleteSystemActions').innerHTML=`<button id="deleteAlertOk" class="delete-system-btn delete-system-btn-primary">Entendi</button>`;modal.classList.add('open');$('#deleteAlertOk').onclick=()=>{modal.classList.remove('open');resolve()}})}
function deleteConfirm(title,message){createDeleteModal();return new Promise(resolve=>{const modal=$('#deleteSystemModal');$('#deleteSystemIcon').className='delete-system-icon';$('#deleteSystemIcon').textContent='🗑';$('#deleteSystemTitle').textContent=title;$('#deleteSystemMessage').textContent=message;$('#deleteSystemActions').innerHTML=`<button id="deleteCancelBtn" class="delete-system-btn">Cancelar</button><button id="deleteConfirmBtn" class="delete-system-btn delete-system-btn-danger">Sim, excluir</button>`;modal.classList.add('open');$('#deleteCancelBtn').onclick=()=>{modal.classList.remove('open');resolve(false)};$('#deleteConfirmBtn').onclick=()=>{modal.classList.remove('open');resolve(true)}})}
async function deletePolicy(id){const p=policyById(id);if(!p){toast('Apólice não encontrada.');return}const c=clientById(p.clientId),ok=await deleteConfirm('Excluir apólice?',`Você está prestes a excluir a apólice ${p.number||'sem número'} do cliente ${c?.name||'Cliente'}.\n\nO PDF e todo o histórico desta apólice também serão excluídos.\n\nEssa ação não poderá ser desfeita.`);if(!ok)return;try{if(p.pdfPath){const {error:se}=await sb.storage.from('policy-pdfs').remove([p.pdfPath]);if(se)console.warn(se)}const {error}=await sb.from('policies').delete().eq('id',id);if(error)throw error;state.policies=state.policies.filter(x=>x.id!==id);state.events=state.events.filter(e=>e.policyId!==id);state.policies.forEach(x=>{if(x.renewedFrom===id)x.renewedFrom=null});closeModal('detailsModal');renderAll();toast('Apólice excluída com sucesso.')}catch(err){console.error(err);toast('Não foi possível excluir a apólice.')}}
async function deleteClient(id){const c=clientById(id);if(!c){toast('Cliente não encontrado.');return}const apolices=state.policies.filter(p=>p.clientId===id);if(apolices.length>0){await deleteAlert('Não foi possível excluir',`${c.name} possui ${apolices.length} apólice${apolices.length===1?'':'s'} cadastrada${apolices.length===1?'':'s'}.\n\nPara excluir este cliente, remova primeiro todas as apólices vinculadas a ele.`);return}const ok=await deleteConfirm('Excluir cliente?',`Você está prestes a excluir o cliente ${c.name}.\n\nEssa ação não poderá ser desfeita.`);if(!ok)return;try{const {error}=await sb.from('clients').delete().eq('id',id);if(error)throw error;state.clients=state.clients.filter(x=>x.id!==id);closeModal('clientModal');renderAll();toast('Cliente excluído com sucesso.')}catch(err){console.error(err);toast('Não foi possível excluir o cliente.')}}

function manualWhatsApp(id){const p=policyById(id),c=clientById(p?.clientId);if(!p||!c)return;const d=daysUntil(p.endDate),prazo=d<0?`venceu há ${Math.abs(d)} dia(s)`:d===0?'vence hoje':`vence em ${d} dia(s)`;const msg=`Olá, ${c.name}! Aqui é da SAVA Seguros. Estamos entrando em contato sobre sua apólice ${p.number}, do seguro ${p.type}, que ${prazo} (${fmtDate(p.endDate)}). Podemos conversar sobre a renovação?`;window.open('https://wa.me/55'+cleanPhone(c.phone)+'?text='+encodeURIComponent(msg),'_blank')}
function managerEmailBody(p){const c=clientById(p.clientId),d=daysUntil(p.endDate),prazo=d<0?`Vencida há ${Math.abs(d)} dia(s)`:d===0?'Vence hoje':`Faltam ${d} dia(s)`;return `RENOVAÇÃO DE SEGURO — SAVA SEGUROS\n\nCliente: ${c?.name||'Cliente'}\nTelefone: ${formatPhone(c?.phone)||'Não informado'}\nE-mail do cliente: ${c?.email||'Não informado'}\nSeguradora: ${p.insurer}\nSeguro: ${p.type}\nApólice: ${p.number||'Sem número'}\nInício: ${fmtDate(p.startDate)}\nVencimento: ${fmtDate(p.endDate)}\nPrazo: ${prazo}\nStatus: ${p.status}\n\nEsta apólice requer acompanhamento de renovação.`}
async function sendEmail(id){const p=policyById(id);if(!p)return;const to=state.settings.managerEmail;if(!to){toast('Configure o e-mail do gestor em Configurações.');return}if(!state.settings.endpoint){window.location.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent('Renovação próxima - SAVA Seguros')}&body=${encodeURIComponent(managerEmailBody(p))}`;return}try{const r=await fetch(state.settings.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'sendEmail',to,subject:'Renovação próxima - SAVA Seguros',body:managerEmailBody(p),policyId:p.id})}),j=await r.json();if(!j.ok)throw new Error(j.error||'Falha no envio');await addEvent(p.id,'email','Lembrete de e-mail enviado ao gestor');toast('E-mail enviado ao gestor.')}catch(err){console.error(err);toast('Falha no endpoint de e-mail.')}}
function checkAutomation(){const configured=!!state.settings.endpoint&&!!state.settings.managerEmail;$('#emailAutomationBadge').textContent=`● E-mail automático: ${configured?'ativo':'não configurado'}`;$('#emailAutomationBadge').style.color=configured?'#087443':'#b54708';if(configured)autoEmailScan()}
async function autoEmailScan(){const todayIso=iso(new Date()),sentToday=state.events.filter(e=>e.type==='email'&&e.date?.slice(0,10)===todayIso).map(e=>e.policyId);for(const p of state.policies){const d=daysUntil(p.endDate),mark=[30,15,7,1].includes(d)?d:(d<0&&d>=-1?'expired':null);if(mark===null||sentToday.includes(p.id)||p.alerts?.[mark]===false)continue;await sendEmail(p.id)}}

function generateReport(){const total=state.policies.length,expired=state.policies.filter(p=>daysUntil(p.endDate)<0).length,d7=state.policies.filter(p=>daysUntil(p.endDate)>=0&&daysUntil(p.endDate)<=7).length,pending=state.policies.filter(p=>p.status==='Pendente').length,andamento=state.policies.filter(p=>p.status==='Em andamento').length,won=state.policies.filter(p=>p.status==='Ganho').length,risk=[...state.policies].filter(p=>daysUntil(p.endDate)<=30&&p.status!=='Ganho').sort((a,b)=>daysUntil(a.endDate)-daysUntil(b.endDate)).slice(0,5);return `<h3>Relatório inteligente da carteira</h3><p>Gerado em ${new Date().toLocaleString('pt-BR')}.</p><div class="report-grid"><div class="report-box"><strong>${total}</strong><small>apólices</small></div><div class="report-box"><strong>${d7}</strong><small>vencem em até 7 dias</small></div><div class="report-box"><strong>${expired}</strong><small>vencidas</small></div><div class="report-box"><strong>${pending}</strong><small>pendentes</small></div><div class="report-box"><strong>${andamento}</strong><small>em andamento</small></div><div class="report-box"><strong>${won}</strong><small>ganhas</small></div></div><h4>Prioridades</h4><ul>${risk.length?risk.map(p=>`<li><b>${esc(clientById(p.clientId)?.name||'Cliente')}</b> — ${esc(p.type)}, ${esc(p.insurer)} — ${expiryLabel(p).text} — processo: ${esc(p.status)}</li>`).join(''):'<li>Nenhum risco crítico identificado.</li>'}</ul><br><h4>Leitura da carteira</h4><p>${expired?'Existem apólices vencidas que devem ser tratadas imediatamente. ':''}${d7?'Há apólices nos próximos 7 dias e elas devem ficar no topo da rotina comercial. ':''}${pending?'Há renovações ainda pendentes de cotação. ':''}${andamento?'Existem negociações em andamento que podem virar ganhos. ':''}${!expired&&!d7&&!pending?'A carteira está sem sinais críticos pelos indicadores atuais.':''}</p>`}
function showReport(){$('#reportArea').innerHTML=generateReport();go('relatorios')}

async function login(e){e.preventDefault();const email=$('#loginUser').value.trim(),password=$('#loginPass').value;$('#loginError').textContent='';const {data,error}=await sb.auth.signInWithPassword({email,password});if(error){console.error(error);$('#loginError').textContent='E-mail ou senha incorretos.';return}state.user=data.user;showApp();await loadCloudData()}
async function logout(){await sb.auth.signOut();state.user=null;state.clients=[];state.policies=[];state.events=[];showLogin()}
async function forgotPassword(){const email=$('#loginUser').value.trim();if(!email){$('#loginError').textContent='Digite seu e-mail primeiro.';return}const redirectTo=window.location.origin+window.location.pathname;const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});if(error){console.error(error);$('#loginError').textContent='Não foi possível enviar o link de recuperação.';return}$('#loginError').textContent='Link de recuperação enviado para o seu e-mail.'}
function showRecovery(){$('#loginForm').classList.add('hidden');$('#recoveryPanel').classList.remove('hidden');$('#loginScreen').classList.remove('hidden');$('#app').classList.add('hidden')}
async function saveRecoveredPassword(){const pass=$('#recoveryPass').value,confirmPass=$('#recoveryPassConfirm').value;$('#recoveryError').textContent='';if(pass.length<6){$('#recoveryError').textContent='A senha precisa ter pelo menos 6 caracteres.';return}if(pass!==confirmPass){$('#recoveryError').textContent='As senhas não coincidem.';return}const {error}=await sb.auth.updateUser({password:pass});if(error){console.error(error);$('#recoveryError').textContent='Não foi possível alterar a senha.';return}$('#recoveryError').textContent='Senha alterada com sucesso.';setTimeout(async()=>{await sb.auth.signOut();location.href=window.location.origin+window.location.pathname},1200)}
async function changePassword(){const pass=$('#cfgPass').value,confirmPass=$('#cfgPassConfirm').value;if(!pass){toast('Digite a nova senha.');return}if(pass.length<6){toast('A senha precisa ter pelo menos 6 caracteres.');return}if(pass!==confirmPass){toast('As senhas não coincidem.');return}const {error}=await sb.auth.updateUser({password:pass});if(error){console.error(error);toast('Não foi possível alterar a senha.');return}$('#cfgPass').value='';$('#cfgPassConfirm').value='';toast('Senha alterada com sucesso.')}

function openLegacyDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('savaCRMv2',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onupgradeneeded=()=>{}})}
function legacyGetAll(db,store){return new Promise((resolve,reject)=>{if(!db.objectStoreNames.contains(store)){resolve([]);return}const r=db.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
async function migrateLocalData(){const status=$('#migrationStatus');if(localStorage.getItem(`savaSupabaseMigrated_${state.user.id}`)==='1'&&!confirm('Este dispositivo já foi marcado como migrado. Deseja executar a migração novamente?'))return;if(!confirm('Migrar os clientes, apólices, histórico, configurações e PDFs salvos neste navegador para o Supabase?\n\nFaça isso no computador onde estão os dados antigos.'))return;status.textContent='Lendo banco antigo...';try{const db=await openLegacyDB(),[oldClients,oldPolicies,oldEvents,oldSettings,oldPdfs]=await Promise.all([legacyGetAll(db,'clients'),legacyGetAll(db,'policies'),legacyGetAll(db,'events'),legacyGetAll(db,'settings'),legacyGetAll(db,'pdfs')]);if(!oldClients.length&&!oldPolicies.length){status.textContent='Nenhum cliente ou apólice antiga encontrada neste dispositivo.';return}const clientIds=new Map(),policyIds=new Map();oldClients.forEach(c=>clientIds.set(c.id,isUuid(c.id)?c.id:uid()));oldPolicies.forEach(p=>policyIds.set(p.id,isUuid(p.id)?p.id:uid()));status.textContent='Enviando clientes...';for(const c of oldClients){const row={id:clientIds.get(c.id),user_id:state.user.id,name:c.name||'Cliente sem nome',birth_date:c.birthDate||null,phone:cleanPhone(c.phone),document:c.document||null,email:c.email||null,notes:c.notes||null,created_at:c.createdAt||new Date().toISOString(),updated_at:c.updatedAt||new Date().toISOString()};const {error}=await sb.from('clients').upsert(row);if(error)throw error}const pdfMap=new Map(oldPdfs.map(x=>[x.id,x]));status.textContent='Enviando apólices e PDFs...';for(const p of oldPolicies){const newId=policyIds.get(p.id);let pdfPath=null;if(p.pdfId&&pdfMap.has(p.pdfId)){const rec=pdfMap.get(p.pdfId);if(rec?.blob){pdfPath=`${state.user.id}/${newId}/migrado-${Date.now()}-${safeFileName(rec.name||'apolice.pdf')}`;const {error}=await sb.storage.from('policy-pdfs').upload(pdfPath,rec.blob,{contentType:rec.type||'application/pdf',upsert:true});if(error)throw error}}const row={id:newId,user_id:state.user.id,client_id:clientIds.get(p.clientId),insurer:p.insurer||'Outra',type:p.type||'Outro',number:p.number||null,start_date:p.startDate||null,end_date:p.endDate||null,status:['Pendente','Em andamento','Ganho'].includes(p.status)?p.status:'Pendente',notes:p.notes||null,alert_30:p.alerts?.[30]!==false,alert_15:p.alerts?.[15]!==false,alert_7:p.alerts?.[7]!==false,alert_1:p.alerts?.[1]!==false,alert_expired:p.alerts?.expired!==false,pdf_path:pdfPath,renewed_from:p.renewedFrom?policyIds.get(p.renewedFrom)||null:null,created_at:p.createdAt||new Date().toISOString(),updated_at:p.updatedAt||new Date().toISOString()};const {error}=await sb.from('policies').upsert(row);if(error)throw error}status.textContent='Enviando histórico...';for(const ev of oldEvents){const mappedPolicy=policyIds.get(ev.policyId);if(!mappedPolicy)continue;const row={id:isUuid(ev.id)?ev.id:uid(),user_id:state.user.id,policy_id:mappedPolicy,type:ev.type||'history',message:ev.message||'Evento migrado',created_at:ev.date||new Date().toISOString()};const {error}=await sb.from('events').upsert(row);if(error)throw error}const oldMain=oldSettings.find(x=>x.id==='main')||oldSettings[0];if(oldMain){state.settings.endpoint=oldMain.endpoint||state.settings.endpoint;state.settings.managerEmail=oldMain.managerEmail||state.settings.managerEmail;state.settings.language=oldMain.language||'pt-BR';await saveSettings()}localStorage.setItem(`savaSupabaseMigrated_${state.user.id}`,'1');await loadCloudData();status.textContent=`Migração concluída: ${oldClients.length} cliente(s) e ${oldPolicies.length} apólice(s).`;toast('Dados antigos migrados para a nuvem.')}catch(err){console.error(err);status.textContent='Falha na migração. Tente novamente.';toast('Não foi possível concluir a migração.')}}

async function blobToBase64(blob){const buffer=await blob.arrayBuffer(),bytes=new Uint8Array(buffer);let binary='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(binary)}
async function exportBackup(){try{toast('Preparando backup...');const pdfs=[];for(const p of state.policies.filter(x=>x.pdfPath)){const {data,error}=await sb.storage.from('policy-pdfs').download(p.pdfPath);if(error){console.warn(error);continue}pdfs.push({policyId:p.id,path:p.pdfPath,name:p.pdfPath.split('/').pop(),type:data.type||'application/pdf',blobBase64:await blobToBase64(data)})}const data={version:3,exportedAt:new Date().toISOString(),clients:state.clients,policies:state.policies,events:state.events,settings:state.settings,pdfs},blob=new Blob([JSON.stringify(data)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`backup-sava-cloud-${iso(new Date())}.json`;a.click();URL.revokeObjectURL(a.href);toast('Backup exportado.')}catch(err){console.error(err);toast('Não foi possível exportar o backup.')}}
async function importBackup(e){const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!data.version)throw new Error('Backup inválido');if(!confirm('Importar este backup para o banco online?')){e.target.value='';return}const clientIds=new Map(),policyIds=new Map();(data.clients||[]).forEach(c=>clientIds.set(c.id,isUuid(c.id)?c.id:uid()));(data.policies||[]).forEach(p=>policyIds.set(p.id,isUuid(p.id)?p.id:uid()));for(const c of data.clients||[]){const row={id:clientIds.get(c.id),user_id:state.user.id,name:c.name,birth_date:c.birthDate||null,phone:cleanPhone(c.phone),document:c.document||null,email:c.email||null,notes:c.notes||null,created_at:c.createdAt||new Date().toISOString(),updated_at:c.updatedAt||new Date().toISOString()};const {error}=await sb.from('clients').upsert(row);if(error)throw error}const backupPdfByPolicy=new Map((data.pdfs||[]).map(x=>[x.policyId,x]));for(const p of data.policies||[]){const newId=policyIds.get(p.id),pdf=backupPdfByPolicy.get(p.id);let pdfPath=null;if(pdf?.blobBase64){const bin=atob(pdf.blobBase64),arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);const blob=new Blob([arr],{type:pdf.type||'application/pdf'});pdfPath=`${state.user.id}/${newId}/backup-${Date.now()}-${safeFileName(pdf.name||'apolice.pdf')}`;const {error}=await sb.storage.from('policy-pdfs').upload(pdfPath,blob,{contentType:blob.type,upsert:true});if(error)throw error}const row={id:newId,user_id:state.user.id,client_id:clientIds.get(p.clientId),insurer:p.insurer,type:p.type,number:p.number||null,start_date:p.startDate||null,end_date:p.endDate||null,status:p.status||'Pendente',notes:p.notes||null,alert_30:p.alerts?.[30]!==false,alert_15:p.alerts?.[15]!==false,alert_7:p.alerts?.[7]!==false,alert_1:p.alerts?.[1]!==false,alert_expired:p.alerts?.expired!==false,pdf_path:pdfPath,renewed_from:p.renewedFrom?policyIds.get(p.renewedFrom)||null:null,created_at:p.createdAt||new Date().toISOString(),updated_at:p.updatedAt||new Date().toISOString()};const {error}=await sb.from('policies').upsert(row);if(error)throw error}for(const ev of data.events||[]){const mappedPolicy=policyIds.get(ev.policyId);if(!mappedPolicy)continue;const row={id:isUuid(ev.id)?ev.id:uid(),user_id:state.user.id,policy_id:mappedPolicy,type:ev.type||'history',message:ev.message||'Evento importado',created_at:ev.date||new Date().toISOString()};const {error}=await sb.from('events').upsert(row);if(error)throw error}if(data.settings){state.settings={endpoint:data.settings.endpoint||'',managerEmail:data.settings.managerEmail||'',language:data.settings.language||'pt-BR'};await saveSettings()}await loadCloudData();toast('Backup restaurado na nuvem.')}catch(err){console.error(err);toast('Backup inválido ou não foi possível importar.')}e.target.value=''}
async function clearAll(){if(!confirm('Apagar todos os clientes, apólices, histórico e PDFs da nuvem? Essa ação não pode ser desfeita.'))return;try{const paths=state.policies.map(p=>p.pdfPath).filter(Boolean);if(paths.length){const {error}=await sb.storage.from('policy-pdfs').remove(paths);if(error)console.warn(error)}const {error}=await sb.from('clients').delete().eq('user_id',state.user.id);if(error)throw error;state.clients=[];state.policies=[];state.events=[];renderAll();toast('Dados da nuvem apagados.')}catch(err){console.error(err);toast('Não foi possível apagar todos os dados.')}}

function setupEvents(){$$('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')}));$('#loginForm').addEventListener('submit',login);$('#forgotPasswordBtn').addEventListener('click',forgotPassword);$('#recoverySaveBtn').addEventListener('click',saveRecoveredPassword);$('#logoutBtn').addEventListener('click',logout);$('#newPolicyBtn').addEventListener('click',()=>newPolicyFor());$('#newPolicyBtn2').addEventListener('click',()=>newPolicyFor());$('#newClientBtn').addEventListener('click',newClient);$('#dashboardRefresh').addEventListener('click',loadCloudData);$('#clientForm').addEventListener('submit',saveClient);$('#policyForm').addEventListener('submit',async e=>{const old=$('#policyRenewedFrom').value,saved=await savePolicy(e);if(saved&&old){await finalizeRenewal(old);renderAll()}});['clientSearch','policySearch'].forEach(id=>$('#'+id).addEventListener('input',id==='clientSearch'?renderClients:renderPolicies));$('#clientFilter').addEventListener('change',renderClients);['statusFilter','expiryFilter','typeFilter','insurerFilter'].forEach(id=>$('#'+id).addEventListener('change',renderPolicies));$('#saveAccount').addEventListener('click',changePassword);$('#saveEmail').addEventListener('click',async()=>{state.settings.endpoint=$('#emailEndpoint').value.trim();state.settings.managerEmail=$('#managerEmail').value.trim();try{await saveSettings();checkAutomation();toast('Configuração de e-mail salva na nuvem.')}catch(err){console.error(err);toast('Não foi possível salvar a configuração.')}});$('#saveLanguage').addEventListener('click',()=>toast('Português (Brasil) já é o idioma ativo.'));$('#generateReportBtn').addEventListener('click',showReport);$('#settingsReport').addEventListener('click',()=>$('#settingsReportOutput').innerHTML=generateReport());$('#migrateLocalBtn').addEventListener('click',migrateLocalData);$('#exportData').addEventListener('click',exportBackup);$('#importData').addEventListener('change',importBackup);$('#clearData').addEventListener('click',clearAll)}

async function init(){setupEvents();sb.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'){state.user=session?.user||null;showRecovery()}});const {data:{session},error}=await sb.auth.getSession();if(error){console.error(error);showLogin();return}if(session?.user){state.user=session.user;showApp();await loadCloudData()}else showLogin()}
init();

window.openDetails=openDetails;window.editPolicy=editPolicy;window.renewPolicy=renewPolicy;window.openPdf=openPdf;window.newPolicyFor=newPolicyFor;window.openClient=openClient;window.changeStatus=changeStatus;window.manualWhatsApp=manualWhatsApp;window.sendEmail=sendEmail;window.deletePolicy=deletePolicy;window.deleteClient=deleteClient;window.closeModal=closeModal;
