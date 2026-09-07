/* SAVA CRM - versão do zero
   Persistência: IndexedDB para dados + PDFs.
   Migração: importa automaticamente o antigo localStorage savaApolices.
*/

const DB_NAME="savaCRMv2", DB_VERSION=1;

const TYPES=[
"Auto",
"Auto Frota",
"Residencial",
"Empresarial",
"Vida PJ",
"Vida PF",
"RC Cyber",
"RC Profissional",
"RC Obra",
"RC Médico",
"Fiança Locatícia",
"Garantia",
"Transporte",
"Viagem",
"Vida AP",
"Evento",
"D&O",
"Bike",
"Bike Elétrica",
"Vida",
"Outro"
];

const INSURERS=[
"Porto Seguro",
"Tokio Marine",
"Azul Seguros",
"Allianz",
"HDI Seguros",
"Mapfre",
"Bradesco Seguros",
"Zurich",
"Suhai",
"Sompo",
"Liberty",
"Itaú Seguros",
"SulAmérica",
"Mitsui Sumitomo",
"Chubb",
"AXA",
"Generali",
"Zurich Santander",
"MAG Seguros",
"Prudential",
"MetLife",
"Icatu",
"Pottencial",
"Junto Seguros",
"Essor",
"Fairfax",
"Argo Seguros",
"Akad Seguros",
"Excelsior",
"Too Seguros",
"Alfa Seguradora",
"Austral",
"Sancor",
"Kovr",
"Newe",
"Outra"
];

const state={
  clients:[],
  policies:[],
  settings:{
    user:"admin",
    pass:"sava123",
    endpoint:"",
    managerEmail:"",
    language:"pt-BR"
  },
  events:[],
  pdfs:new Map(),
  db:null
};

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const fmtDate=d=>
  d
    ?new Intl.DateTimeFormat("pt-BR").format(new Date(d+"T12:00:00"))
    :"—";

const today=()=>{
  const d=new Date();
  d.setHours(0,0,0,0);
  return d
};

const iso=d=>{
  const x=new Date(d);
  return new Date(
    x.getTime()-x.getTimezoneOffset()*60000
  ).toISOString().slice(0,10)
};

const daysUntil = d => {
  if (!d) return 0;

  const [year, month, day] = d.split("-").map(Number);

  const target = Date.UTC(year, month - 1, day);

  const now = new Date();
  const current = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return Math.round((target - current) / 86400000);
};

const initials=n=>
  (n||"?")
    .split(" ")
    .slice(0,2)
    .map(x=>x[0])
    .join("")
    .toUpperCase();

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

const uid=()=>
  crypto.randomUUID
    ?crypto.randomUUID()
    :Date.now()+"-"+Math.random();

function openDB(){

  return new Promise((resolve,reject)=>{

    const r=indexedDB.open(DB_NAME,DB_VERSION);

    r.onupgradeneeded=e=>{

      const db=e.target.result;

      if(!db.objectStoreNames.contains("clients"))
        db.createObjectStore("clients",{keyPath:"id"});

      if(!db.objectStoreNames.contains("policies"))
        db.createObjectStore("policies",{keyPath:"id"});

      if(!db.objectStoreNames.contains("events"))
        db.createObjectStore("events",{keyPath:"id"});

      if(!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings",{keyPath:"id"});

      if(!db.objectStoreNames.contains("pdfs"))
        db.createObjectStore("pdfs",{keyPath:"id"});
    };

    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);

  });
}

function tx(store,mode="readonly"){
  return state.db
    .transaction(store,mode)
    .objectStore(store)
}

function getAll(store){

  return new Promise((res,rej)=>{

    const r=tx(store).getAll();

    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);

  });

}

function put(store,obj){

  return new Promise((res,rej)=>{

    const r=tx(store,"readwrite").put(obj);

    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);

  });

}

function del(store,id){

  return new Promise((res,rej)=>{

    const r=tx(store,"readwrite").delete(id);

    r.onsuccess=()=>res();
    r.onerror=()=>rej(r.error);

  });

}

async function load(){

  state.db=await openDB();

  state.clients=await getAll("clients");

  state.policies=await getAll("policies");

  state.events=await getAll("events");

  const sets=await getAll("settings");

  const s=sets.find(x=>x.id==="main");

  if(s)
    state.settings={
      ...state.settings,
      ...s
    };

  const pdfs=await getAll("pdfs");

  pdfs.forEach(p=>
    state.pdfs.set(p.id,p)
  );

  await migrateOld();

  renderAll();
}

async function migrateOld(){

  if(localStorage.getItem("savaCRMv2Migrated"))
    return;

  let old=[];

  try{
    old=JSON.parse(
      localStorage.getItem("savaApolices")||"[]"
    );
  }catch{}

  if(old.length){

    for(const a of old){

      let c=state.clients.find(
        x=>x.name.toLowerCase()===
        String(a.cliente||"").toLowerCase()
      );

      if(!c){

        c={
          id:uid(),
          name:a.cliente||"Cliente sem nome",
          birthDate:"",
          phone:cleanPhone(a.telefone),
          document:"",
          email:"",
          notes:"",
          createdAt:new Date().toISOString()
        };

        await put("clients",c);

        state.clients.push(c);
      }

      const p={
        id:uid(),
        clientId:c.id,
        insurer:a.seguradora||"Outra",
        type:a.tipoSeguro==="Moto"
          ?"Auto"
          :a.tipoSeguro||"Outro",
        number:a.numeroApolice||"",
        startDate:a.dataInicio||"",
        endDate:a.dataVencimento||"",
        status:a.status||"Pendente",
        notes:a.observacoes||"",
        alerts:{
          30:true,
          15:true,
          7:true,
          1:true,
          expired:true
        },
        pdfId:null,
        renewedFrom:null,
        createdAt:a.criadaEm||new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };

      await put("policies",p);

      state.policies.push(p);
    }

    toast(
      "Dados antigos migrados para a nova versão."
    );
  }

  localStorage.setItem(
    "savaCRMv2Migrated",
    "1"
  );
}

function cleanPhone(v){
  return String(v||"").replace(/\D/g,"")
}

function validPhone(v){

  const n=cleanPhone(v);

  return(
    (n.length===10||n.length===11)&&
    !/^(\d)\1+$/.test(n)&&
    n.startsWith("2")===false
  )
  ?true
  :(n.length===10||n.length===11)&&
    !/^(\d)\1+$/.test(n);

}

function validBrazilPhone(v){

  const n=cleanPhone(v);

  if(n.length!==10&&n.length!==11)
    return false;

  const d=n.slice(-8);

  if(/^(\d)\1+$/.test(n))
    return false;

  if(/^0/.test(n)||/^1/.test(n))
    return false;

  return /^[1-9]{2}9?[2-9]\d{7}$/.test(n);
}

function clientById(id){
  return state.clients.find(c=>c.id===id)
}

function policyById(id){
  return state.policies.find(p=>p.id===id)
}

function processClass(s){
  return s==="Ganho"
    ?"green"
    :s==="Em andamento"
      ?"orange"
      :"gray";
}

function expiryLabel(p){

  const d=daysUntil(p.endDate);

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

  if(d<=7)
    return{
      text:`Vence em ${d} dias`,
      cls:"orange"
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

function saveSettings(){
  return put(
    "settings",
    {
      id:"main",
      ...state.settings
    }
  );
}

function populateSelects(){

  const type=$("#typeFilter");
  const ins=$("#insurerFilter");
  const pType=$("#policyType");
  const pIns=$("#policyInsurer");
  const pClient=$("#policyClient");

  pType.innerHTML=
    TYPES
      .map(x=>`<option>${esc(x)}</option>`)
      .join("");

  pIns.innerHTML=
    INSURERS
      .map(x=>`<option>${esc(x)}</option>`)
      .join("");

  type.innerHTML=
    `<option value="all">Todos os tipos</option>`+
    TYPES
      .map(x=>`<option>${esc(x)}</option>`)
      .join("");

  ins.innerHTML=
    `<option value="all">Todas as seguradoras</option>`+
    INSURERS
      .map(x=>`<option>${esc(x)}</option>`)
      .join("");

  pClient.innerHTML=
    `<option value="">Selecione...</option>`+
    state.clients
      .sort((a,b)=>a.name.localeCompare(b.name))
      .map(c=>
        `<option value="${c.id}">
          ${esc(c.name)}
        </option>`
      )
      .join("");
}

function renderAll(){

  populateSelects();

  renderDashboard();

  renderClients();

  renderPolicies();

  renderKanban();

  renderConfig();

  checkAutomation();
}

function renderDashboard(){

  const total=state.policies.length;

  const e7=
    state.policies.filter(
      p=>
        daysUntil(p.endDate)>=0&&
        daysUntil(p.endDate)<=7
    ).length;

  const expired=
    state.policies.filter(
      p=>daysUntil(p.endDate)<0
    ).length;

  const won=
    state.policies.filter(
      p=>p.status==="Ganho"
    ).length;

  $("#statTotal").textContent=total;

  $("#stat7").textContent=e7;

  $("#statExpired").textContent=expired;

  $("#statWon").textContent=won;

  const upcoming=
    [...state.policies]
      .sort(
        (a,b)=>
          new Date(a.endDate)-
          new Date(b.endDate)
      )
      .filter(
        p=>daysUntil(p.endDate)<=30
      )
      .slice(0,8);

  $("#upcomingList").innerHTML=
    upcoming.length
      ?upcoming
        .map(p=>{

          const c=clientById(p.clientId);
          const e=expiryLabel(p);

          return`
            <div class="upcoming-item">

              <div>
                <div class="name">
                  ${esc(c?.name||"Cliente")}
                </div>

                <small>
                  ${esc(p.type)} · ${esc(p.insurer)}
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
          `

        })
        .join("")
      :`
        <div class="empty">
          Nenhuma apólice vencendo nos próximos 30 dias.
        </div>
      `;

  const counts={
    Pendente:
      state.policies.filter(
        p=>p.status==="Pendente"
      ).length,

    "Em andamento":
      state.policies.filter(
        p=>p.status==="Em andamento"
      ).length,

    Ganho:won
  };

  const max=Math.max(total,1);

  $("#processSummary").innerHTML=
    Object.entries(counts)
      .map(([k,v])=>
        `
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
              <i style="width:${v/max*100}%"></i>
            </div>

          </div>
        `
      )
      .join("");

  const ic={};

  state.policies.forEach(
    p=>{
      ic[p.insurer]=
        (ic[p.insurer]||0)+1
    }
  );

  const top=
    Object.entries(ic)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,10);

  $("#insurerSummary").innerHTML=
    top.length
      ?top
        .map(([k,v])=>
          `
            <div class="insurer-chip">
              <strong>${v}</strong>
              <span>${esc(k)}</span>
            </div>
          `
        )
        .join("")
      :`
        <div class="empty">
          Cadastre uma apólice para começar.
        </div>
      `;
}

function renderClients(){

  const q=
    ($("#clientSearch")?.value||"")
      .toLowerCase();

  const f=
    $("#clientFilter")?.value||
    "all";

  let arr=
    state.clients.filter(c=>{

      const ps=
        state.policies.filter(
          p=>p.clientId===c.id
        );

      if(
        f==="withPolicies"&&
        !ps.length
      )
        return false;

      if(
        f==="withoutPolicies"&&
        ps.length
      )
        return false;

      return[
        c.name,
        c.document,
        c.phone,
        c.email
      ]
      .join(" ")
      .toLowerCase()
      .includes(q);
    });

  $("#clientsGrid").innerHTML=
    arr.length
      ?arr.map(c=>{

        const ps=
          state.policies.filter(
            p=>p.clientId===c.id
          );

        return`
          <article class="client-card">

            <div class="client-card-head">

              <div class="client-cell">

                <div class="avatar">
                  ${initials(c.name)}
                </div>

                <div>

                  <h4>
                    ${esc(c.name)}
                  </h4>

                  <small>
                    ${fmtDate(c.birthDate)}
                  </small>

                </div>

              </div>

              <span class="policy-count">
                ${ps.length}
                apólice${ps.length===1?"":"s"}
              </span>

            </div>

            <div class="client-meta">

              <span>
                ☎
                ${esc(
                  formatPhone(c.phone)||
                  "Sem telefone"
                )}
              </span>

              <span>
                ✉
                ${esc(
                  c.email||
                  "Sem e-mail"
                )}
              </span>

              <span>
                ▣
                ${esc(
                  c.document||
                  "Documento não informado"
                )}
              </span>

            </div>

            <div class="client-policies">

              ${
                ps
                  .slice(0,5)
                  .map(p=>
                    `
                      <div class="mini-policy">

                        <span>
                          ${esc(p.type)}
                          ·
                          ${esc(p.insurer)}
                        </span>

                        <b>
                          ${fmtDate(p.endDate)}
                        </b>

                      </div>
                    `
                  )
                  .join("")
              }

              ${
                ps.length>5
                  ?`
                    <small>
                      + ${ps.length-5}
                      apólice(s)
                    </small>
                  `
                  :""
              }

            </div>

            <div
              class="actions"
              style="margin-top:13px"
            >

              <button
                class="action-btn"
                onclick="openClient('${c.id}')"
              >
                Editar
              </button>

              <button
                class="action-btn"
                onclick="newPolicyFor('${c.id}')"
              >
                ＋ Apólice
              </button>

            </div>

          </article>
        `

      })
      .join("")
      :`
        <div class="empty">
          Nenhum cliente encontrado.
        </div>
      `;
}

function renderPolicies(){

  const q=
    ($("#policySearch")?.value||"")
      .toLowerCase();

  const sf=
    $("#statusFilter")?.value||
    "all";

  const ef=
    $("#expiryFilter")?.value||
    "all";

  const tf=
    $("#typeFilter")?.value||
    "all";

  const inf=
    $("#insurerFilter")?.value||
    "all";

  let arr=
    [...state.policies]
      .filter(p=>{

        const c=clientById(p.clientId);

        const hay=[
          c?.name,
          p.number,
          p.insurer,
          p.type
        ]
        .join(" ")
        .toLowerCase();

        if(q&&!hay.includes(q))
          return false;

        if(
          sf!=="all"&&
          p.status!==sf
        )
          return false;

        if(
          tf!=="all"&&
          p.type!==tf
        )
          return false;

        if(
          inf!=="all"&&
          p.insurer!==inf
        )
          return false;

        const d=daysUntil(p.endDate);

        if(
          ef==="expired"&&
          d>=0
        )
          return false;

        if(
          ef!=="all"&&
          ef!=="expired"&&
          !(d>=0&&d<=Number(ef))
        )
          return false;

        return true;

      })
      .sort(
        (a,b)=>
          new Date(a.endDate)-
          new Date(b.endDate)
      );

  $("#policiesTable").innerHTML=
    arr.length
      ?arr.map(p=>{

        const c=
          clientById(p.clientId);

        const e=
          expiryLabel(p);

        return`
          <tr>

            <td>

              <div class="client-cell">

                <div class="avatar">
                  ${initials(c?.name)}
                </div>

                <div>

                  <strong>
                    ${esc(
                      c?.name||
                      "Cliente"
                    )}
                  </strong>

                  <small>
                    ${esc(
                      formatPhone(c?.phone)||
                      ""
                    )}
                  </small>

                </div>

              </div>

            </td>

            <td>

              <b>
                ${esc(p.type)}
              </b>

              <small
                style="
                  display:block;
                  color:#667085
                "
              >
                ${esc(p.number)}
              </small>

            </td>

            <td>
              ${esc(p.insurer)}
            </td>

            <td>
              ${fmtDate(p.startDate)}
              →
              ${fmtDate(p.endDate)}
            </td>

            <td>

              <span
                class="pill ${processClass(p.status)}"
              >
                ${esc(p.status)}
              </span>

            </td>

            <td>

              <span class="pill ${e.cls}">
                ${e.text}
              </span>

            </td>

            <td>

              <div class="actions">

                <button
                  class="action-btn"
                  title="Detalhes"
                  onclick="openDetails('${p.id}')"
                >
                  Ver
                </button>

                <button
                  class="action-btn"
                  title="Editar"
                  onclick="editPolicy('${p.id}')"
                >
                  Editar
                </button>

                <button
                  class="action-btn"
                  title="Renovar"
                  onclick="renewPolicy('${p.id}')"
                >
                  ↻
                </button>

                ${
                  p.pdfId
                    ?`
                      <button
                        class="action-btn"
                        onclick="openPdf('${p.id}')"
                      >
                        PDF
                      </button>
                    `
                    :""
                }

              </div>

            </td>

          </tr>
        `

      })
      .join("")
      :`
        <tr>

          <td colspan="7">

            <div class="empty">
              Nenhuma apólice encontrada.
            </div>

          </td>

        </tr>
      `;
}

function renderKanban(){

  const cols=[
    "Pendente",
    "Em andamento",
    "Ganho"
  ];

  $("#kanban").innerHTML=
    cols
      .map(s=>{

        const ps=
          state.policies.filter(
            p=>p.status===s
          );

        return`
          <div
            class="
              kanban-col
              ${
                s==="Pendente"
                  ?"pendente"
                  :s==="Ganho"
                    ?"ganho"
                    :"andamento"
              }
            "
          >

            <h4>

              <span>${s}</span>

              <span>${ps.length}</span>

            </h4>

            ${
              ps
                .map(p=>{

                  const c=
                    clientById(p.clientId);

                  return`
                    <div class="kanban-card">

                      <strong>
                        ${esc(
                          c?.name||
                          "Cliente"
                        )}
                      </strong>

                      <small>
                        ${esc(p.type)}
                        ·
                        ${esc(p.insurer)}

                        <br>

                        Vence:
                        ${fmtDate(p.endDate)}
                      </small>

                      <select
                        onchange="
                          changeStatus(
                            '${p.id}',
                            this.value
                          )
                        "
                      >

                        <option
                          ${
                            p.status==="Pendente"
                              ?"selected"
                              :""
                          }
                        >
                          Pendente
                        </option>

                        <option
                          ${
                            p.status==="Em andamento"
                              ?"selected"
                              :""
                          }
                        >
                          Em andamento
                        </option>

                        <option
                          ${
                            p.status==="Ganho"
                              ?"selected"
                              :""
                          }
                        >
                          Ganho
                        </option>

                      </select>

                    </div>
                  `

                })
                .join("")
            }

          </div>
        `

      })
      .join("");
}

function renderConfig(){

  $("#cfgUser").value=
    state.settings.user;

  $("#emailEndpoint").value=
    state.settings.endpoint;

  $("#managerEmail").value=
    state.settings.managerEmail;
}

function go(view){

  $$(".view").forEach(
    v=>v.classList.remove("active")
  );

  $("#"+view).classList.add("active");

  $$(".nav-item").forEach(
    b=>
      b.classList.toggle(
        "active",
        b.dataset.view===view
      )
  );

  const titles={
    dashboard:"Dashboard",
    clientes:"Clientes",
    apolices:"Apólices",
    renovacoes:"Renovações",
    relatorios:"Relatórios",
    config:"Configurações"
  };

  $("#pageTitle").textContent=
    titles[view]||
    "Dashboard";

  if(view==="dashboard")
    renderDashboard();
}

function openModal(id){
  $("#"+id).classList.add("open")
}

function closeModal(id){

  $("#"+id).classList.remove("open");

  if(id==="pdfModal")
    $("#pdfFrame").src="";
}

function resetPolicyForm(clientId=""){

  $("#policyForm").reset();

  $("#policyId").value="";

  $("#policyParentId").value="";

  $("#policyRenewedFrom").value="";

  $("#currentPdfName").textContent="";

  $("#renewInfo").classList.add("hidden");

  populateSelects();

  $("#policyClient").value=
    clientId;

  $("#policyStatus").value=
    "Pendente";

  $("#policyModalTitle").textContent=
    "Nova apólice";
}

function newPolicyFor(clientId=""){

  resetPolicyForm(clientId);

  openModal("policyModal");
}

function openClient(id){

  const c=clientById(id);

  if(!c)
    return;

  $("#clientId").value=c.id;

  $("#clientName").value=c.name;

  $("#clientBirth").value=
    c.birthDate;

  $("#clientPhone").value=
    formatPhone(c.phone);

  $("#clientDoc").value=
    c.document||"";

  $("#clientEmail").value=
    c.email||"";

  $("#clientNotes").value=
    c.notes||"";

  $("#clientModalTitle").textContent=
    "Editar cliente";

  openModal("clientModal");
}

function newClient(){

  $("#clientForm").reset();

  $("#clientId").value="";

  $("#clientModalTitle").textContent=
    "Novo cliente";

  openModal("clientModal");
}

async function editPolicy(id){

  const p=policyById(id);

  if(!p)
    return;

  resetPolicyForm(p.clientId);

  $("#policyId").value=p.id;

  $("#policyInsurer").value=
    p.insurer;

  $("#policyType").value=
    p.type;

  $("#policyNumber").value=
    p.number;

  $("#policyStart").value=
    p.startDate;

  $("#policyEnd").value=
    p.endDate;

  $("#policyStatus").value=
    p.status;

  $("#policyNotes").value=
    p.notes||"";

 $("#alert30").checked=
  p.alerts?.[30]!==false;

$("#alert15").checked=
  p.alerts?.[15]!==false;

$("#alert7").checked=
  p.alerts?.[7]!==false;

$("#alert1").checked=
  p.alerts?.[1]!==false;

$("#alertExpired").checked=
  p.alerts?.expired!==false;

  if(p.pdfId)
    $("#currentPdfName").textContent=
      "PDF atual: "+
      (
        state.pdfs.get(p.pdfId)?.name||
        "anexo.pdf"
      );

  $("#policyModalTitle").textContent=
    "Editar apólice";

  openModal("policyModal");
}

async function saveClient(e){

  e.preventDefault();

  const phone=
    cleanPhone(
      $("#clientPhone").value
    );

  if(!validBrazilPhone(phone)){

    toast(
      "Informe um telefone celular válido com DDD."
    );

    return;
  }

  const id=
    $("#clientId").value||
    uid();

  const c={
    id,
    name:
      $("#clientName")
        .value
        .trim(),

    birthDate:
      $("#clientBirth")
        .value,

    phone,

    document:
      $("#clientDoc")
        .value
        .trim(),

    email:
      $("#clientEmail")
        .value
        .trim(),

    notes:
      $("#clientNotes")
        .value
        .trim(),

    createdAt:
      clientById(id)?.createdAt||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };

  await put("clients",c);

  const idx=
    state.clients.findIndex(
      x=>x.id===id
    );

  if(idx>=0)
    state.clients[idx]=c;
  else
    state.clients.push(c);

  closeModal("clientModal");

  renderAll();

  toast(
    "Cliente salvo com sucesso."
  );
}

async function savePolicy(e){

  e.preventDefault();

  const clientId=
    $("#policyClient").value;

  if(!clientId){

    toast(
      "Selecione o cliente."
    );

    return;
  }

  if(
    $("#policyStart").value>
    $("#policyEnd").value
  ){

    toast(
      "O fim da vigência não pode ser anterior ao início."
    );

    return;
  }

  const oldId=
    $("#policyId").value;

  const existing=
    oldId
      ?policyById(oldId)
      :null;

  let pdfId=
    existing?.pdfId||
    null;

  const file=
    $("#policyPdf").files[0];

  if(file){

    if(file.type!=="application/pdf"){

      toast(
        "O anexo precisa ser PDF."
      );

      return;
    }

    pdfId=uid();

    const rec={
      id:pdfId,
      name:file.name,
      size:file.size,
      type:file.type,
      blob:file,
      createdAt:new Date().toISOString()
    };

    await put(
      "pdfs",
      rec
    );

    state.pdfs.set(
      pdfId,
      rec
    );

    if(existing?.pdfId)
      await del(
        "pdfs",
        existing.pdfId
      );
  }

  const p={
    id:
      oldId||
      uid(),

    clientId,

    insurer:
      $("#policyInsurer").value,

    type:
      $("#policyType").value,

    number:
      $("#policyNumber")
        .value
        .trim(),

    startDate:
      $("#policyStart").value,

    endDate:
      $("#policyEnd").value,

    status:
      $("#policyStatus").value,

    notes:
      $("#policyNotes")
        .value
        .trim(),

    alerts:{
      30:
        $("#alert30").checked,

      15:
        $("#alert15").checked,

      7:
        $("#alert7").checked,

      1:
        $("#alert1").checked,

      expired:
        $("#alertExpired").checked
    },

    pdfId,

    renewedFrom:
      $("#policyRenewedFrom").value||
      existing?.renewedFrom||
      null,

    createdAt:
      existing?.createdAt||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()
  };

  await put(
    "policies",
    p
  );

  const i=
    state.policies.findIndex(
      x=>x.id===p.id
    );

  if(i>=0)
    state.policies[i]=p;
  else
    state.policies.push(p);

  await put(
    "events",
    {
      id:uid(),
      policyId:p.id,
      type:
        oldId
          ?"edit"
          :"created",
      message:
        oldId
          ?"Apólice atualizada"
          :"Apólice cadastrada",
      date:new Date().toISOString()
    }
  );

  closeModal("policyModal");

  renderAll();

  toast(
    "Apólice salva com sucesso."
  );
}

function changeStatus(id,status){

  const p=policyById(id);

  if(!p)
    return;

  p.status=status;

  p.updatedAt=
    new Date().toISOString();

  put(
    "policies",
    p
  ).then(()=>{

    state.events.push({
      id:uid(),
      policyId:id,
      type:"status",
      message:
        "Status alterado para "+
        status,
      date:
        new Date().toISOString()
    });

    put(
      "events",
      state.events.at(-1)
    );

    renderAll();

    toast(
      "Status atualizado."
    );

  });
}

function openDetails(id){

  const p=policyById(id);

  const c=
    clientById(
      p?.clientId
    );

  if(!p)
    return;

  const e=
    expiryLabel(p);

  const history=
    state.events
      .filter(
        x=>x.policyId===id
      )
      .sort(
        (a,b)=>
          new Date(b.date)-
          new Date(a.date)
      );

  $("#detailsTitle").textContent=
    c?.name||
    "Cliente";

  $("#detailsSubtitle").textContent=
    `${p.type} · ${p.insurer}`;

  $("#detailsBody").innerHTML=`

    <div class="details-grid">

      <div class="detail-box">
        <small>Segurado</small>
        <strong>
          ${esc(c?.name)}
        </strong>
      </div>

      <div class="detail-box">
        <small>Nascimento</small>
        <strong>
          ${fmtDate(c?.birthDate)}
        </strong>
      </div>

      <div class="detail-box">
        <small>Telefone</small>
        <strong>
          ${esc(
            formatPhone(c?.phone)||
            "—"
          )}
        </strong>
      </div>

      <div class="detail-box">
        <small>Seguradora</small>
        <strong>
          ${esc(p.insurer)}
        </strong>
      </div>

      <div class="detail-box">
        <small>Tipo</small>
        <strong>
          ${esc(p.type)}
        </strong>
      </div>

      <div class="detail-box">
        <small>Nº apólice</small>
        <strong>
          ${esc(p.number)}
        </strong>
      </div>

      <div class="detail-box">
        <small>Início da vigência</small>
        <strong>
          ${fmtDate(p.startDate)}
        </strong>
      </div>

      <div class="detail-box">
        <small>Fim da vigência</small>
        <strong>
          ${fmtDate(p.endDate)}
        </strong>
      </div>

      <div class="detail-box">
        <small>Situação</small>
        <strong>
          <span class="pill ${e.cls}">
            ${e.text}
          </span>
        </strong>
      </div>

      <div class="detail-box">
        <small>Renovação</small>
        <strong>
          <span
            class="pill ${processClass(p.status)}"
          >
            ${p.status}
          </span>
        </strong>
      </div>

      <div class="detail-box">
        <small>PDF</small>
        <strong>
          ${
            p.pdfId
              ?`
                <button
                  class="link-btn"
                  onclick="openPdf('${p.id}')"
                >
                  Abrir documento
                </button>
              `
              :"Sem anexo"
          }
        </strong>
      </div>

      <div class="detail-box detail-wide">
        <small>Observações</small>
        <strong>
          ${esc(
            p.notes||
            "Sem observações"
          )}
        </strong>
      </div>

    </div>

    <div
      class="modal-actions"
      style="margin-top:15px"
    >

      <button
        class="btn btn-secondary"
        onclick="sendEmail('${p.id}')"
      >
        ✉ Lembrete por e-mail
      </button>

      <button
        class="btn btn-secondary"
        onclick="manualWhatsApp('${p.id}')"
      >
        WhatsApp
      </button>

      <button
        class="btn btn-secondary"
        onclick="
          editPolicy('${p.id}');
          closeModal('detailsModal')
        "
      >
        Editar
      </button>

      <button
        class="btn btn-primary"
        onclick="
          renewPolicy('${p.id}');
          closeModal('detailsModal')
        "
      >
        ↻ Renovar apólice
      </button>

    </div>

    <div class="timeline">

      <h4>Histórico</h4>

      ${
        history.length
          ?history
            .map(h=>
              `
                <div class="timeline-item">

                  <b>
                    ${esc(h.message)}
                  </b>

                  <small>
                    ${new Date(
                      h.date
                    ).toLocaleString("pt-BR")}
                  </small>

                </div>
              `
            )
            .join("")
          :`
            <p class="mini-note">
              Sem eventos registrados.
            </p>
          `
      }

    </div>
  `;

  openModal("detailsModal");
}

function renewPolicy(id){

  const old=
    policyById(id);

  if(!old)
    return;

  resetPolicyForm(
    old.clientId
  );

  $("#policyRenewedFrom").value=
    old.id;

  $("#policyInsurer").value=
    old.insurer;

  $("#policyType").value=
    old.type;

  $("#policyStatus").value=
    "Em andamento";

  $("#policyNotes").value=
    `Renovação da apólice ${old.number}. Histórico da apólice anterior mantido no CRM.`;

  $("#renewInfo").textContent=
    `Esta nova apólice ficará vinculada à anterior (${old.number}). A apólice antiga não será apagada.`;

  $("#renewInfo").classList.remove(
    "hidden"
  );

  $("#policyModalTitle").textContent=
    "Nova apólice de renovação";

  openModal("policyModal");
}

async function finalizeRenewal(
  oldId,
  newId
){

  const old=
    policyById(oldId);

  if(!old)
    return;

  old.status="Ganho";

  old.updatedAt=
    new Date().toISOString();

  await put(
    "policies",
    old
  );

  state.events.push({
    id:uid(),
    policyId:oldId,
    type:"renewal",
    message:
      "Apólice renovada; novo ciclo criado",
    date:
      new Date().toISOString()
  });

  await put(
    "events",
    state.events.at(-1)
  );
}

function openPdf(id){

  const p=
    policyById(id);

  if(!p?.pdfId)
    return;

  const rec=
    state.pdfs.get(
      p.pdfId
    );

  if(!rec)
    return;

  const url=
    URL.createObjectURL(
      rec.blob
    );

  $("#pdfTitle").textContent=
    rec.name;

  $("#pdfFrame").src=
    url;

  openModal("pdfModal");
}

function formatPhone(n){

  n=cleanPhone(n);

  if(n.length===11)
    return`
      (${n.slice(0,2)})
      ${n.slice(2,7)}
      -${n.slice(7)}
    `.replace(/\s+/g," ");

  if(n.length===10)
    return`
      (${n.slice(0,2)})
      ${n.slice(2,6)}
      -${n.slice(6)}
    `.replace(/\s+/g," ");

  return n;
}

function manualWhatsApp(id){

  const p=
    policyById(id);

  const c=
    clientById(
      p.clientId
    );

  const d=
    daysUntil(
      p.endDate
    );

  const msg=
    `Olá, ${c?.name||""}! Aqui é da SAVA Seguros. Estamos entrando em contato sobre sua apólice ${p.number}, do seguro ${p.type}, que vence em ${d<0?"":" "+d+" dias"} (${fmtDate(p.endDate)}). Podemos conversar sobre a renovação?`;

  window.open(
    "https://wa.me/55"+
    cleanPhone(c?.phone)+
    "?text="+
    encodeURIComponent(msg),
    "_blank"
  );
}

function emailBody(p){

  const c=
    clientById(
      p.clientId
    );

  const d=
    daysUntil(
      p.endDate
    );

  let prazo=
    d<0
      ?`venceu há ${Math.abs(d)} dia(s)`
      :d===0
        ?"vence hoje"
        :`vence em ${d} dia(s)`;

  return`
Olá, ${c?.name||"cliente"}!

Aqui é da SAVA Seguros.

Estamos entrando em contato para lembrar que sua apólice ${p.number}, referente ao seguro ${p.type}, possui vigência de ${fmtDate(p.startDate)} a ${fmtDate(p.endDate)} e ${prazo}.

Nossa equipe pode cuidar da renovação e apresentar as melhores opções para você.

Atenciosamente,
SAVA Seguros
`;
}

async function sendEmail(id){

  const p=
    policyById(id);

  const c=
    clientById(
      p.clientId
    );

  if(!c?.email){

    toast(
      "Este cliente não possui e-mail cadastrado."
    );

    return;
  }

  if(!state.settings.endpoint){

    window.location.href=
      `mailto:${encodeURIComponent(c.email)}`+
      `?subject=${encodeURIComponent(
        "Lembrete de renovação - SAVA Seguros"
      )}`+
      `&body=${encodeURIComponent(
        emailBody(p)
      )}`;

    return;
  }

  try{

    const r=
      await fetch(
        state.settings.endpoint,
        {
          method:"POST",
          headers:{
            "Content-Type":
              "text/plain;charset=utf-8"
          },
          body:
            JSON.stringify({
              action:"sendEmail",
              to:c.email,
              name:c.name,
              subject:
                "Lembrete de renovação - SAVA Seguros",
              body:
                emailBody(p),
              policyId:p.id
            })
        }
      );

    const j=
      await r.json();

    toast(
      j.ok
        ?"E-mail enviado."
        :"Não foi possível enviar o e-mail."
    );

    if(j.ok)
      recordEmail(p);

  }catch(e){

    toast(
      "Falha no endpoint de e-mail."
    );

  }
}

function recordEmail(p){

  state.events.push({
    id:uid(),
    policyId:p.id,
    type:"email",
    message:
      "Lembrete de e-mail enviado",
    date:
      new Date().toISOString()
  });

  put(
    "events",
    state.events.at(-1)
  );
}

function checkAutomation(){

  const configured=
    !!state.settings.endpoint;

  $("#emailAutomationBadge").textContent=
    `● E-mail automático: ${
      configured
        ?"ativo"
        :"não configurado"
    }`;

  $("#emailAutomationBadge").style.color=
    configured
      ?" #087443"
      :"#b54708";

  autoEmailScan();
}

async function autoEmailScan(){

  if(!state.settings.endpoint)
    return;

  const sentToday=
    state.events
      .filter(
        e=>
          e.type==="email"&&
          e.date.slice(0,10)===
          iso(new Date())
      )
      .map(
        e=>e.policyId
      );

  for(
    const p of state.policies
  ){

    const d=
      daysUntil(p.endDate);

    const mark=
      [30,15,7,1].includes(d)
        ?d
        :(d<0&&d>=-1
          ?"expired"
          :null);

    if(
      mark===null||
      sentToday.includes(p.id)
    )
      continue;

    const enabled=
      p.alerts?.[mark]!==false;

    if(
      enabled&&
      clientById(p.clientId)?.email
    )
      await sendEmail(p.id);
  }
}

function generateReport(){

  const total=
    state.policies.length;

  const expired=
    state.policies.filter(
      p=>daysUntil(p.endDate)<0
    ).length;

  const d7=
    state.policies.filter(
      p=>
        daysUntil(p.endDate)>=0&&
        daysUntil(p.endDate)<=7
    ).length;

  const pending=
    state.policies.filter(
      p=>p.status==="Pendente"
    ).length;

  const and=
    state.policies.filter(
      p=>p.status==="Em andamento"
    ).length;

  const won=
    state.policies.filter(
      p=>p.status==="Ganho"
    ).length;

  const risk=
    [...state.policies]
      .filter(
        p=>
          daysUntil(p.endDate)<=30&&
          p.status!=="Ganho"
      )
      .sort(
        (a,b)=>
          daysUntil(a.endDate)-
          daysUntil(b.endDate)
      )
      .slice(0,5);

  return`
    <h3>
      Relatório inteligente da carteira
    </h3>

    <p>
      Gerado em
      ${new Date().toLocaleString("pt-BR")}.
    </p>

    <div class="report-grid">

      <div class="report-box">
        <strong>${total}</strong>
        <small>apólices</small>
      </div>

      <div class="report-box">
        <strong>${d7}</strong>
        <small>
          vencem em até 7 dias
        </small>
      </div>

      <div class="report-box">
        <strong>${expired}</strong>
        <small>vencidas</small>
      </div>

      <div class="report-box">
        <strong>${pending}</strong>
        <small>pendentes</small>
      </div>

      <div class="report-box">
        <strong>${and}</strong>
        <small>em andamento</small>
      </div>

      <div class="report-box">
        <strong>${won}</strong>
        <small>ganhas</small>
      </div>

    </div>

    <h4>Prioridades</h4>

    <ul>

      ${
        risk.length
          ?risk
            .map(p=>
              `
                <li>

                  <b>
                    ${esc(
                      clientById(
                        p.clientId
                      )?.name||
                      "Cliente"
                    )}
                  </b>

                  —
                  ${esc(p.type)},
                  ${esc(p.insurer)}
                  —
                  ${expiryLabel(p).text}
                  —
                  processo:
                  ${esc(p.status)}

                </li>
              `
            )
            .join("")
          :`
            <li>
              Nenhum risco crítico identificado.
            </li>
          `
      }

    </ul>

    <br>

    <h4>
      Leitura da carteira
    </h4>

    <p>

      ${
        expired
          ?"Existem apólices vencidas que devem ser tratadas imediatamente. "
          :""
      }

      ${
        d7
          ?"Há apólices nos próximos 7 dias e elas devem ficar no topo da rotina comercial. "
          :""
      }

      ${
        pending
          ?"Há renovações ainda pendentes de cotação. "
          :""
      }

      ${
        and
          ?"Existem negociações em andamento que podem virar ganhos. "
          :""
      }

      ${
        !expired&&!d7&&!pending
          ?"A carteira está sem sinais críticos pelos indicadores atuais."
          :""
      }

    </p>
  `;
}

function showReport(){

  const html=
    generateReport();

  $("#reportArea").innerHTML=
    html;

  go("relatorios");
}

function setupEvents(){

  $$("[data-view]")
    .forEach(
      b=>
        b.addEventListener(
          "click",
          ()=>go(b.dataset.view)
        )
    );

  $$("[data-close]")
    .forEach(
      b=>
        b.addEventListener(
          "click",
          ()=>closeModal(
            b.dataset.close
          )
        )
    );

  $$(".modal")
    .forEach(
      m=>
        m.addEventListener(
          "click",
          e=>{
            if(e.target===m)
              m.classList.remove("open")
          }
        )
    );

  $("#loginForm")
    .addEventListener(
      "submit",
      e=>{
        e.preventDefault();

        if(
          $("#loginUser").value===
          state.settings.user&&
          $("#loginPass").value===
          state.settings.pass
        ){

          sessionStorage.setItem(
            "savaLogged",
            "1"
          );

          $("#loginScreen")
            .classList.add("hidden");

          $("#app")
            .classList.remove("hidden");

          renderAll();

        }else{

          $("#loginError")
            .textContent=
            "Usuário ou senha incorretos.";

        }
      }
    );

  $("#logoutBtn")
    .addEventListener(
      "click",
      ()=>{
        sessionStorage.removeItem(
          "savaLogged"
        );

        location.reload();
      }
    );

  $("#newPolicyBtn")
    .addEventListener(
      "click",
      ()=>newPolicyFor()
    );

  $("#newPolicyBtn2")
    .addEventListener(
      "click",
      ()=>newPolicyFor()
    );

  $("#newClientBtn")
    .addEventListener(
      "click",
      newClient
    );

  $("#dashboardRefresh")
    .addEventListener(
      "click",
      renderAll
    );

  $("#clientForm")
    .addEventListener(
      "submit",
      saveClient
    );

  $("#policyForm")
    .addEventListener(
      "submit",
      async e=>{

        const old=
          $("#policyRenewedFrom").value;

        await savePolicy(e);

        if(old){

          const newest=
            [...state.policies]
              .filter(
                p=>p.renewedFrom===old
              )
              .sort(
                (a,b)=>
                  new Date(b.createdAt)-
                  new Date(a.createdAt)
              )[0];

          if(newest)
            await finalizeRenewal(
              old,
              newest.id
            );

          renderAll();
        }

      }
    );

  ["clientSearch","policySearch"]
    .forEach(
      id=>
        $("#"+id)
          .addEventListener(
            "input",
            id==="clientSearch"
              ?renderClients
              :renderPolicies
          )
    );

  ["clientFilter"]
    .forEach(
      id=>
        $("#"+id)
          .addEventListener(
            "change",
            renderClients
          )
    );

  [
    "statusFilter",
    "expiryFilter",
    "typeFilter",
    "insurerFilter"
  ]
  .forEach(
    id=>
      $("#"+id)
        .addEventListener(
          "change",
          renderPolicies
        )
  );

  $("#saveAccount")
    .addEventListener(
      "click",
      async()=>{

        const u=
          $("#cfgUser")
            .value
            .trim();

        const pw=
          $("#cfgPass").value;

        if(!u){

          toast(
            "Informe um usuário."
          );

          return;
        }

        state.settings.user=u;

        if(pw)
          state.settings.pass=pw;

        await saveSettings();

        $("#cfgPass").value="";

        toast(
          "Conta atualizada."
        );
      }
    );

  $("#saveEmail")
    .addEventListener(
      "click",
      async()=>{

        state.settings.endpoint=
          $("#emailEndpoint")
            .value
            .trim();

        state.settings.managerEmail=
          $("#managerEmail")
            .value
            .trim();

        await saveSettings();

        checkAutomation();

        toast(
          "Configuração de e-mail salva."
        );
      }
    );

  $("#saveLanguage")
    .addEventListener(
      "click",
      ()=>toast(
        "Português (Brasil) já é o idioma ativo nesta versão."
      )
    );

  $("#generateReportBtn")
    .addEventListener(
      "click",
      showReport
    );

  $("#settingsReport")
    .addEventListener(
      "click",
      ()=>{
        $("#settingsReportOutput")
          .innerHTML=
          generateReport();
      }
    );

  $("#exportData")
    .addEventListener(
      "click",
      exportBackup
    );

  $("#importData")
    .addEventListener(
      "change",
      importBackup
    );

  $("#clearData")
    .addEventListener(
      "click",
      clearAll
    );
}

async function exportBackup(){

  const pdfs=[];

  for(
    const p of state.pdfs.values()
  ){

    const buf=
      await p.blob.arrayBuffer();

    let binary="";

    const bytes=
      new Uint8Array(buf);

    const chunk=0x8000;

    for(
      let i=0;
      i<bytes.length;
      i+=chunk
    ){

      binary+=String.fromCharCode(
        ...bytes.subarray(
          i,
          i+chunk
        )
      );

    }

    pdfs.push({
      ...p,
      blobBase64:btoa(binary),
      blob:undefined
    });
  }

  const data={
    version:2,
    exportedAt:
      new Date().toISOString(),
    clients:
      state.clients,
    policies:
      state.policies,
    events:
      state.events,
    settings:
      state.settings,
    pdfs
  };

  const blob=
    new Blob(
      [JSON.stringify(data)],
      {
        type:
          "application/json"
      }
    );

  const a=
    document.createElement("a");

  a.href=
    URL.createObjectURL(blob);

  a.download=
    `backup-sava-${iso(new Date())}.json`;

  a.click();

  URL.revokeObjectURL(
    a.href
  );

  toast(
    "Backup exportado."
  );
}

async function importBackup(e){

  const file=
    e.target.files[0];

  if(!file)
    return;

  try{

    const data=
      JSON.parse(
        await file.text()
      );

    if(!data.version)
      throw new Error("backup");

    for(
      const c of data.clients||[]
    )
      await put(
        "clients",
        c
      );

    for(
      const p of data.policies||[]
    )
      await put(
        "policies",
        p
      );

    for(
      const ev of data.events||[]
    )
      await put(
        "events",
        ev
      );

    if(data.settings){

      state.settings={
        ...state.settings,
        ...data.settings
      };

      await saveSettings();
    }

    for(
      const x of data.pdfs||[]
    ){

      const bin=
        atob(
          x.blobBase64||""
        );

      const arr=
        new Uint8Array(
          bin.length
        );

      for(
        let i=0;
        i<bin.length;
        i++
      )
        arr[i]=
          bin.charCodeAt(i);

      const rec={
        ...x,
        blob:
          new Blob(
            [arr],
            {
              type:
                x.type||
                "application/pdf"
            }
          )
      };

      await put(
        "pdfs",
        rec
      );
    }

    state.clients=
      await getAll("clients");

    state.policies=
      await getAll("policies");

    state.events=
      await getAll("events");

    const ps=
      await getAll("pdfs");

    state.pdfs=
      new Map(
        ps.map(
          x=>[x.id,x]
        )
      );

    renderAll();

    toast(
      "Backup restaurado."
    );

  }catch(err){

    toast(
      "Backup inválido ou corrompido."
    );
  }

  e.target.value="";
}

async function clearAll(){

  if(
    !confirm(
      "Apagar todos os clientes, apólices, histórico e PDFs? Essa ação não pode ser desfeita."
    )
  )
    return;

  for(
    const s of [
      "clients",
      "policies",
      "events",
      "pdfs"
    ]
  ){

    for(
      const x of await getAll(s)
    )
      await del(
        s,
        x.id
      );
  }

  state.clients=[];

  state.policies=[];

  state.events=[];

  state.pdfs.clear();

  renderAll();

  toast(
    "Dados apagados."
  );
}

(async()=>{

  await load();

  setupEvents();

  if(
    sessionStorage.getItem(
      "savaLogged"
    )==="1"
  ){

    $("#loginScreen")
      .classList.add("hidden");

    $("#app")
      .classList.remove("hidden");

    renderAll();
  }

})();

window.openDetails=
  openDetails;

window.editPolicy=
  editPolicy;

window.renewPolicy=
  renewPolicy;

window.openPdf=
  openPdf;

window.newPolicyFor=
  newPolicyFor;

window.openClient=
  openClient;

window.changeStatus=
  changeStatus;

window.manualWhatsApp=
  manualWhatsApp;

window.sendEmail=
  sendEmail;
