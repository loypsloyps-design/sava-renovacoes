const SUPABASE_URL="https://txwgxpmgegntsnvamtda.supabase.co";
const SUPABASE_KEY="sb_publishable_IG_YmrreIPbgnt05gubpHw_CriLdyfV";

const sb=window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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
  "AIG",
  "Akad Seguros",
  "Allianz",
  "Austral",
  "AXA",
  "Azos",
  "Banestes Seguros",
  "Bradesco Seguros",
  "Capemisa",
  "Chubb",
  "Essor",
  "Excelsior",
  "Ezze",
  "Fairfax",
  "Fator",
  "HDI Seguros",
  "Icatu",
  "Junto Seguros",
  "MAG Seguros",
  "Mapfre",
  "MetLife",
  "Mitsui Sumitomo",
  "Pottencial",
  "Porto Seguro",
  "Prudential",
  "Sancor",
  "Sompo",
  "Suhai",
  "SulAmérica",
  "Sura",
  "Swiss Re",
  "Tokio Marine",
  "Unimed",
  "Yelum",
  "Youse",
  "Zurich",
  "Outra"
];

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

const $=selector=>document.querySelector(selector);

const $$=selector=>[
  ...document.querySelectorAll(selector)
];

const uid=()=>crypto.randomUUID();

const cleanPhone=value=>
  String(value||"").replace(/\D/g,"");

const esc=value=>
  String(value??"").replace(
    /[&<>"']/g,
    char=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[char])
  );

const fmtDate=date=>{

  if(!date){
    return "—";
  }

  try{

    let value;

    if(date instanceof Date){

      value=date;

    }else{

      const text=String(date).trim();

      if(!text){
        return "—";
      }

      // Formato padrão do banco: AAAA-MM-DD
      if(/^\d{4}-\d{2}-\d{2}$/.test(text)){

        const [year,month,day]=text
          .split("-")
          .map(Number);

        value=new Date(
          year,
          month-1,
          day,
          12,
          0,
          0
        );

      }else{

        value=new Date(text);

      }

    }

    if(
      Number.isNaN(
        value.getTime()
      )
    ){
      return "—";
    }

    return new Intl.DateTimeFormat(
      "pt-BR"
    ).format(value);

  }catch(error){

    console.warn(
      "Data inválida encontrada:",
      date
    );

    return "—";

  }

};

const iso=date=>{
  const value=new Date(date);

  return new Date(
    value.getTime()-
    value.getTimezoneOffset()*60000
  )
    .toISOString()
    .slice(0,10);
};

const daysUntil=date=>{
  if(!date){
    return 0;
  }

  const [year,month,day]=date
    .split("-")
    .map(Number);

  const target=Date.UTC(
    year,
    month-1,
    day
  );

  const now=new Date();

  const current=Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return Math.round(
    (target-current)/86400000
  );
};

const initials=name=>
  (name||"?")
    .split(" ")
    .filter(Boolean)
    .slice(0,2)
    .map(item=>item[0])
    .join("")
    .toUpperCase();


function validBrazilPhone(value){

  const number=cleanPhone(value);

  if(
    number.length!==10 &&
    number.length!==11
  ){
    return false;
  }

  if(
    /^(\d)\1+$/.test(number)
  ){
    return false;
  }

  if(
    /^0/.test(number) ||
    /^1/.test(number)
  ){
    return false;
  }

  return /^[1-9]{2}9?[2-9]\d{7}$/.test(
    number
  );
}


function formatPhone(value){

  const number=cleanPhone(value);

  if(number.length===11){

    return `(${number.slice(0,2)}) ${number.slice(2,7)}-${number.slice(7)}`;

  }

  if(number.length===10){

    return `(${number.slice(0,2)}) ${number.slice(2,6)}-${number.slice(6)}`;

  }

  return number;
}


function clientById(id){

  return state.clients.find(
    client=>client.id===id
  );

}


function policyById(id){

  return state.policies.find(
    policy=>policy.id===id
  );

}


function processClass(status){

  if(status==="Ganho"){
    return "green";
  }

  if(status==="Em andamento"){
    return "orange";
  }

  return "gray";
}


function expiryLabel(policy){

  const days=daysUntil(
    policy.endDate
  );

  if(days<0){

    return {
      text:`Vencida há ${Math.abs(days)} dias`,
      cls:"red"
    };

  }

  if(days===0){

    return {
      text:"Vence hoje",
      cls:"red"
    };

  }

  if(days<=30){

    return {
      text:`Vence em ${days} dias`,
      cls:"orange"
    };

  }

  return {
    text:"Vigente",
    cls:"green"
  };
}


function toast(message){

  const element=$("#toast");

  if(!element){
    return;
  }

  element.textContent=message;

  element.classList.add(
    "show"
  );

  clearTimeout(
    toast._timer
  );

  toast._timer=setTimeout(
    ()=>{
      element.classList.remove(
        "show"
      );
    },
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


function showRecovery(){

  $("#loginForm")
    .classList
    .add("hidden");

  $("#recoveryPanel")
    .classList
    .remove("hidden");

  $("#loginScreen")
    .classList
    .remove("hidden");

  $("#app")
    .classList
    .add("hidden");

}


function clientFromDb(row){

  return {
    id:row.id,
    name:row.name,
    birthDate:row.birth_date||"",
    phone:row.phone||"",
    document:row.document||"",
    email:row.email||"",
    notes:row.notes||"",
    createdAt:row.created_at,
    updatedAt:row.updated_at
  };

}


function clientToDb(client){

  return {
    id:client.id,
    user_id:state.user.id,
    name:client.name,
    birth_date:client.birthDate||null,
    phone:client.phone,
    document:client.document||null,
    email:client.email||null,
    notes:client.notes||null,
    created_at:
      client.createdAt||
      new Date().toISOString(),
    updated_at:
      new Date().toISOString()
  };

}


function policyFromDb(row){

  return {
    id:row.id,
    clientId:row.client_id,
    insurer:row.insurer,
    type:row.type,
    number:row.number||"",
    startDate:row.start_date||"",
    endDate:row.end_date||"",
    status:row.status||"Pendente",
    notes:row.notes||"",

    alerts:{
      30:row.alert_30!==false,
      15:row.alert_15!==false,
      7:row.alert_7!==false,
      1:row.alert_1!==false,
      expired:
        row.alert_expired!==false
    },

    pdfPath:row.pdf_path||null,
    pdfId:row.pdf_path||null,

    renewedFrom:
      row.renewed_from||null,

    createdAt:row.created_at,
    updatedAt:row.updated_at
  };

}


function policyToDb(policy){

  return {
    id:policy.id,
    user_id:state.user.id,
    client_id:policy.clientId,
    insurer:policy.insurer,
    type:policy.type,
    number:policy.number||null,
    start_date:
      policy.startDate||null,
    end_date:
      policy.endDate||null,
    status:
      policy.status||"Pendente",
    notes:
      policy.notes||null,

    alert_30:
      policy.alerts?.[30]!==false,

    alert_15:
      policy.alerts?.[15]!==false,

    alert_7:
      policy.alerts?.[7]!==false,

    alert_1:
      policy.alerts?.[1]!==false,

    alert_expired:
      policy.alerts?.expired!==false,

    pdf_path:
      policy.pdfPath||null,

    renewed_from:
      policy.renewedFrom||null,

    created_at:
      policy.createdAt||
      new Date().toISOString(),

    updated_at:
      new Date().toISOString()
  };

}


function eventFromDb(row){

  return {
    id:row.id,
    policyId:row.policy_id,
    type:row.type||"",
    message:row.message,
    date:row.created_at
  };

}


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

  const {
    data,
    error
  }=await sb
    .from("events")
    .insert(row)
    .select()
    .single();

  if(error){
    throw error;
  }

  const event=
    eventFromDb(data);

  state.events.push(event);

  return event;
}


async function loadCloudData(){

  if(!state.user){
    return;
  }

  try{

    const [
      clientsResult,
      policiesResult,
      eventsResult,
      settingsResult
    ]=await Promise.all([

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

    for(
      const result of [
        clientsResult,
        policiesResult,
        eventsResult,
        settingsResult
      ]
    ){

      if(result.error){
        throw result.error;
      }

    }

    state.clients=
      (clientsResult.data||[])
        .map(clientFromDb);

    state.policies=
      (policiesResult.data||[])
        .map(policyFromDb);

    state.events=
      (eventsResult.data||[])
        .map(eventFromDb);

    state.settings=
      settingsResult.data
      ?{
        endpoint:
          settingsResult
            .data
            .email_endpoint||"",

        managerEmail:
          settingsResult
            .data
            .manager_email||"",

        language:
          settingsResult
            .data
            .language||
          "pt-BR"
      }
      :{
        endpoint:"",
        managerEmail:"",
        language:"pt-BR"
      };

    renderAll();

  }catch(error){

    console.error(error);

    toast(
      "Não foi possível carregar os dados do Supabase."
    );

  }

}


async function saveSettings(){

  const payload={
    user_id:
      state.user.id,

    manager_email:
      state.settings.managerEmail||
      null,

    email_endpoint:
      state.settings.endpoint||
      null,

    language:
      state.settings.language||
      "pt-BR",

    updated_at:
      new Date().toISOString()
  };

  const {
    error
  }=await sb
    .from("settings")
    .upsert(
      payload,
      {
        onConflict:"user_id"
      }
    );

  if(error){
    throw error;
  }

}


function populateSelects(){

  const typeFilter=
    $("#typeFilter");

  const insurerFilter=
    $("#insurerFilter");

  const policyType=
    $("#policyType");

  const policyInsurer=
    $("#policyInsurer");

  const policyClient=
    $("#policyClient");

  if(
    !typeFilter ||
    !insurerFilter ||
    !policyType ||
    !policyInsurer ||
    !policyClient
  ){
    return;
  }

  policyType.innerHTML=
    TYPES
      .map(
        item=>
          `<option>${esc(item)}</option>`
      )
      .join("");

  policyInsurer.innerHTML=
    INSURERS
      .map(
        item=>
          `<option>${esc(item)}</option>`
      )
      .join("");

  typeFilter.innerHTML=
    `<option value="all">Todos os tipos</option>`+
    TYPES
      .map(
        item=>
          `<option>${esc(item)}</option>`
      )
      .join("");

  insurerFilter.innerHTML=
    `<option value="all">Todas as seguradoras</option>`+
    INSURERS
      .map(
        item=>
          `<option>${esc(item)}</option>`
      )
      .join("");

  policyClient.innerHTML=
    `<option value="">Selecione...</option>`+
    [...state.clients]
      .sort(
        (a,b)=>
          a.name.localeCompare(
            b.name
          )
      )
      .map(
        client=>
          `<option value="${client.id}">${esc(client.name)}</option>`
      )
      .join("");

}


function renderAll(){

  if(!state.user){
    return;
  }

  populateSelects();

  renderDashboard();

  renderClients();

  renderPolicies();

  renderKanban();

  renderConfig();

  checkAutomation();

} function renderDashboard(){

  const total=state.policies.length;

  const e7=state.policies.filter(
    p=>{
      const d=daysUntil(p.endDate);
      return d>=0 && d<=7;
    }
  ).length;

  const expired=state.policies.filter(
    p=>daysUntil(p.endDate)<0
  ).length;

  const won=state.policies.filter(
    p=>p.status==="Ganho"
  ).length;


  $("#statTotal").textContent=total;
  $("#stat7").textContent=e7;
  $("#statExpired").textContent=expired;
  $("#statWon").textContent=won;


  const upcoming=[...state.policies]
    .sort(
      (a,b)=>
        new Date(a.endDate)-
        new Date(b.endDate)
    )
    .filter(
      p=>{
        const d=daysUntil(p.endDate);

        return d>=0 && d<=30;
      }
    )
    .slice(0,8);


  $("#upcomingList").innerHTML=
    upcoming.length
    ?upcoming.map(
      p=>{

        const c=clientById(
          p.clientId
        );

        const e=expiryLabel(p);

        return `
          <div class="upcoming-item">

            <div>

              <div class="name">
                ${esc(c?.name||"Cliente")}
              </div>

              <small>
                ${esc(p.type)} ·
                ${esc(p.insurer)}
              </small>

            </div>

            <div>

              <small>
                Vigência
              </small>

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
        Nenhuma apólice vencendo
        nos próximos 30 dias.
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


  const max=Math.max(
    total,
    1
  );


  $("#processSummary").innerHTML=
    Object.entries(counts)
      .map(
        ([status,value])=>{

          const cls=
            status==="Pendente"
              ?"pendente"
              :status==="Ganho"
                ?"ganho"
                :"andamento";

          return `
            <div class="process-line">

              <div class="line-top">

                <span>
                  ${status}
                </span>

                <b>
                  ${value}
                </b>

              </div>

              <div class="bar ${cls}">

                <i
                  style="width:${value/max*100}%"
                ></i>

              </div>

            </div>
          `;
        }
      )
      .join("");


  const insurers={};


  state.policies.forEach(
    p=>{

      insurers[p.insurer]=
        (insurers[p.insurer]||0)+1;

    }
  );


  const top=Object.entries(
    insurers
  )
    .sort(
      (a,b)=>b[1]-a[1]
    )
    .slice(0,10);


  $("#insurerSummary").innerHTML=
    top.length
    ?top.map(
      ([name,total])=>`

        <div class="insurer-chip">

          <strong>
            ${total}
          </strong>

          <span>
            ${esc(name)}
          </span>

        </div>

      `
    ).join("")
    :`
      <div class="empty">
        Cadastre uma apólice
        para começar.
      </div>
    `;

}



function renderClients(){

  const search=(
    $("#clientSearch")?.value||
    ""
  )
    .trim()
    .toLowerCase();


  const filter=
    $("#clientFilter")?.value||
    "all";


  const clients=
    state.clients.filter(
      client=>{

        const policies=
          state.policies.filter(
            policy=>
              policy.clientId===
              client.id
          );


        if(
          filter==="withPolicies" &&
          !policies.length
        ){
          return false;
        }


        if(
          filter==="withoutPolicies" &&
          policies.length
        ){
          return false;
        }


        const haystack=[
          client.name,
          client.document,
          client.phone,
          client.email
        ]
          .join(" ")
          .toLowerCase();


        return haystack.includes(
          search
        );

      }
    );


  const grid=$("#clientsGrid");


  if(!grid){
    return;
  }


  grid.innerHTML=
    clients.length
    ?clients.map(
      client=>{

        const policies=
          state.policies.filter(
            policy=>
              policy.clientId===
              client.id
          );


        return `
          <article class="client-card">

            <div class="client-card-head">

              <div class="client-cell">

                <div class="avatar">
                  ${initials(client.name)}
                </div>

                <div>

                  <h4>
                    ${esc(client.name)}
                  </h4>

                  <small>
                    ${fmtDate(
                      client.birthDate
                    )}
                  </small>

                </div>

              </div>


              <span class="policy-count">

                ${policies.length}
                apólice${policies.length===1?"":"s"}

              </span>

            </div>


            <div class="client-meta">

              <span>
                ☎
                ${
                  esc(
                    formatPhone(
                      client.phone
                    )||
                    "Sem telefone"
                  )
                }
              </span>

              <span>
                ✉
                ${
                  esc(
                    client.email||
                    "Sem e-mail"
                  )
                }
              </span>

              <span>
                ▣
                ${
                  esc(
                    client.document||
                    "Documento não informado"
                  )
                }
              </span>

            </div>


            <div class="client-policies">

              ${
                policies
                  .slice(0,5)
                  .map(
                    policy=>`

                      <div class="mini-policy">

                        <span>
                          ${esc(policy.type)}
                          ·
                          ${esc(policy.insurer)}
                        </span>

                        <b>
                          ${fmtDate(
                            policy.endDate
                          )}
                        </b>

                      </div>

                    `
                  )
                  .join("")
              }


              ${
                policies.length>5
                ?`
                  <small>
                    + ${policies.length-5}
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
                onclick="openClient('${client.id}')"
              >
                Editar
              </button>


              <button
                class="action-btn"
                onclick="newPolicyFor('${client.id}')"
              >
                ＋ Apólice
              </button>


              <button
                class="action-btn"
                style="
                  color:#b42318;
                  border-color:#fecdca;
                  background:#fff5f5;
                "
                onclick="deleteClient('${client.id}')"
              >
                🗑 Excluir
              </button>

            </div>

          </article>
        `;

      }
    ).join("")
    :`
      <div class="empty">
        Nenhum cliente encontrado.
      </div>
    `;

}



function renderPolicies(){

  const search=(
    $("#policySearch")?.value||
    ""
  )
    .trim()
    .toLowerCase();


  const statusFilter=
    $("#statusFilter")?.value||
    "all";


  const expiryFilter=
    $("#expiryFilter")?.value||
    "all";


  const typeFilter=
    $("#typeFilter")?.value||
    "all";


  const insurerFilter=
    $("#insurerFilter")?.value||
    "all";


  const policies=
    [...state.policies]
      .filter(
        policy=>{

          const client=
            clientById(
              policy.clientId
            );


          const haystack=[
            client?.name,
            policy.number,
            policy.insurer,
            policy.type
          ]
            .join(" ")
            .toLowerCase();


          if(
            search &&
            !haystack.includes(search)
          ){
            return false;
          }


          if(
            statusFilter!=="all" &&
            policy.status!==statusFilter
          ){
            return false;
          }


          if(
            typeFilter!=="all" &&
            policy.type!==typeFilter
          ){
            return false;
          }


          if(
            insurerFilter!=="all" &&
            policy.insurer!==insurerFilter
          ){
            return false;
          }


          const d=
            daysUntil(
              policy.endDate
            );


          if(
            expiryFilter==="expired" &&
            d>=0
          ){
            return false;
          }


          if(
            expiryFilter!=="all" &&
            expiryFilter!=="expired"
          ){

            const limit=
              Number(
                expiryFilter
              );


            if(
              !(d>=0 && d<=limit)
            ){
              return false;
            }

          }


          return true;

        }
      )
      .sort(
        (a,b)=>
          new Date(a.endDate)-
          new Date(b.endDate)
      );


  const table=
    $("#policiesTable");


  if(!table){
    return;
  }


  table.innerHTML=
    policies.length
    ?policies.map(
      policy=>{

        const client=
          clientById(
            policy.clientId
          );


        const expiry=
          expiryLabel(
            policy
          );


        return `
          <tr>

            <td>

              <div class="client-cell">

                <div class="avatar">
                  ${initials(
                    client?.name
                  )}
                </div>

                <div>

                  <strong>
                    ${esc(
                      client?.name||
                      "Cliente"
                    )}
                  </strong>

                  <small>
                    ${
                      esc(
                        formatPhone(
                          client?.phone
                        )||
                        ""
                      )
                    }
                  </small>

                </div>

              </div>

            </td>


            <td>

              <b>
                ${esc(policy.type)}
              </b>

              <small
                style="
                  display:block;
                  color:#667085;
                "
              >
                ${esc(policy.number)}
              </small>

            </td>


            <td>
              ${esc(policy.insurer)}
            </td>


            <td>

              ${fmtDate(
                policy.startDate
              )}

              →

              ${fmtDate(
                policy.endDate
              )}

            </td>


            <td>

              <span
                class="pill ${processClass(policy.status)}"
              >
                ${esc(policy.status)}
              </span>

            </td>


            <td>

              <span
                class="pill ${expiry.cls}"
              >
                ${expiry.text}
              </span>

            </td>


            <td>

              <div class="actions">

                <button
                  class="action-btn"
                  onclick="openDetails('${policy.id}')"
                >
                  Ver
                </button>


                <button
                  class="action-btn"
                  onclick="editPolicy('${policy.id}')"
                >
                  Editar
                </button>


                <button
                  class="action-btn"
                  onclick="renewPolicy('${policy.id}')"
                  title="Renovar"
                >
                  ↻
                </button>


                ${
                  policy.pdfPath
                  ?`
                    <button
                      class="action-btn"
                      onclick="openPdf('${policy.id}')"
                    >
                      PDF
                    </button>
                  `
                  :""
                }

              </div>

            </td>

          </tr>
        `;

      }
    ).join("")
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



function newClient(){

  $("#clientForm").reset();

  $("#clientId").value="";

  $("#clientModalTitle")
    .textContent=
    "Novo cliente";

  openModal(
    "clientModal"
  );

}



function openClient(id){

  const client=
    clientById(id);


  if(!client){
    toast(
      "Cliente não encontrado."
    );

    return;
  }


  $("#clientId").value=
    client.id;


  $("#clientName").value=
    client.name||"";


  $("#clientBirth").value=
    client.birthDate||"";


  $("#clientPhone").value=
    formatPhone(
      client.phone
    );


  $("#clientDoc").value=
    client.document||"";


  $("#clientEmail").value=
    client.email||"";


  $("#clientNotes").value=
    client.notes||"";


  $("#clientModalTitle")
    .textContent=
    "Editar cliente";


  openModal(
    "clientModal"
  );

}



async function saveClient(event){

  event.preventDefault();


  if(!state.user){

    toast(
      "Sua sessão expirou. Entre novamente."
    );

    return;

  }


  const name=
    $("#clientName")
      .value
      .trim();


  const birthDate=
    $("#clientBirth")
      .value;


  const phone=
    cleanPhone(
      $("#clientPhone").value
    );


  const document=
    $("#clientDoc")
      .value
      .trim();


  const email=
    $("#clientEmail")
      .value
      .trim();


  const notes=
    $("#clientNotes")
      .value
      .trim();


  if(!name){

    toast(
      "Informe o nome do cliente."
    );

    return;

  }


  if(!birthDate){

    toast(
      "Informe a data de nascimento."
    );

    return;

  }


  if(
    !validBrazilPhone(
      phone
    )
  ){

    toast(
      "Informe um telefone celular válido com DDD."
    );

    return;

  }


  const id=
    $("#clientId").value||
    uid();


  const old=
    clientById(id);


  const client={

    id,

    name,

    birthDate,

    phone,

    document,

    email,

    notes,

    createdAt:
      old?.createdAt||
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()

  };


  const saveButton=
    $("#clientForm")
      .querySelector(
        'button[type="submit"], button:not([type])'
      );


  if(saveButton){

    saveButton.disabled=true;

    saveButton.dataset.oldText=
      saveButton.textContent;

    saveButton.textContent=
      "Salvando...";

  }


  try{

    const {
      data,
      error
    }=await sb
      .from("clients")
      .upsert(
        clientToDb(client)
      )
      .select()
      .single();


    if(error){
      throw error;
    }


    const saved=
      clientFromDb(data);


    const index=
      state.clients.findIndex(
        item=>
          item.id===saved.id
      );


    if(index>=0){

      state.clients[index]=
        saved;

    }else{

      state.clients.push(
        saved
      );

    }


    closeModal(
      "clientModal"
    );


    renderAll();


    toast(
      "Cliente salvo com sucesso."
    );


  }catch(error){

    console.error(
      "Erro ao salvar cliente:",
      error
    );


    const message=
      error?.message||
      "Erro desconhecido";


    toast(
      "Erro ao salvar cliente: "+
      message
    );

  }finally{

    if(saveButton){

      saveButton.disabled=false;

      saveButton.textContent=
        saveButton.dataset.oldText||
        "Salvar cliente";

    }

  }

}



function resetPolicyForm(
  clientId=""
){

  $("#policyForm").reset();

  $("#policyId").value="";

  $("#policyParentId").value="";

  $("#policyRenewedFrom").value="";

  $("#currentPdfName")
    .textContent="";

  $("#renewInfo")
    .classList
    .add("hidden");


  populateSelects();


  $("#policyClient").value=
    clientId;


  $("#policyStatus").value=
    "Pendente";


  $("#alert30").checked=true;
  $("#alert15").checked=true;
  $("#alert7").checked=true;
  $("#alert1").checked=true;
  $("#alertExpired").checked=true;


  $("#policyModalTitle")
    .textContent=
    "Nova apólice";

}



function newPolicyFor(
  clientId=""
){

  if(
    !state.clients.length
  ){

    toast(
      "Cadastre um cliente antes de criar uma apólice."
    );

    go(
      "clientes"
    );

    return;

  }


  resetPolicyForm(
    clientId
  );


  openModal(
    "policyModal"
  );

}



async function editPolicy(id){

  const policy=
    policyById(id);


  if(!policy){

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  resetPolicyForm(
    policy.clientId
  );


  $("#policyId").value=
    policy.id;


  $("#policyInsurer").value=
    policy.insurer;


  $("#policyType").value=
    policy.type;


  $("#policyNumber").value=
    policy.number;


  $("#policyStart").value=
    policy.startDate;


  $("#policyEnd").value=
    policy.endDate;


  $("#policyStatus").value=
    policy.status;


  $("#policyNotes").value=
    policy.notes||"";


  $("#alert30").checked=
    policy.alerts?.[30]!==false;


  $("#alert15").checked=
    policy.alerts?.[15]!==false;


  $("#alert7").checked=
    policy.alerts?.[7]!==false;


  $("#alert1").checked=
    policy.alerts?.[1]!==false;


  $("#alertExpired").checked=
    policy.alerts?.expired!==false;


  if(policy.pdfPath){

    $("#currentPdfName")
      .textContent=
      "PDF atual: "+
      decodeURIComponent(
        policy.pdfPath
          .split("/")
          .pop()
      );

  }


  $("#policyModalTitle")
    .textContent=
    "Editar apólice";


  openModal(
    "policyModal"
  );

} function safeFileName(name){

  return String(name||"arquivo.pdf")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9._-]/g,"_")
    .replace(/_+/g,"_");

}


async function uploadPolicyPdf(
  policyId,
  file
){

  if(!file){
    return null;
  }


  if(
    file.type!=="application/pdf"
  ){

    throw new Error(
      "O arquivo precisa ser um PDF."
    );

  }


  const path=
    `${state.user.id}/${policyId}/${Date.now()}_${safeFileName(file.name)}`;


  const {
    error
  }=await sb
    .storage
    .from("policy-pdfs")
    .upload(
      path,
      file,
      {
        cacheControl:"3600",
        upsert:false,
        contentType:"application/pdf"
      }
    );


  if(error){
    throw error;
  }


  return path;

}


async function deletePdfPath(
  path
){

  if(!path){
    return;
  }


  const {
    error
  }=await sb
    .storage
    .from("policy-pdfs")
    .remove([
      path
    ]);


  if(error){

    console.warn(
      "Não foi possível excluir o PDF:",
      error
    );

  }

}


async function savePolicy(event){

  event.preventDefault();


  if(!state.user){

    toast(
      "Sua sessão expirou. Entre novamente."
    );

    return null;

  }


  const clientId=
    $("#policyClient").value;


  const insurer=
    $("#policyInsurer").value;


  const type=
    $("#policyType").value;


  const number=
    $("#policyNumber")
      .value
      .trim();


  const startDate=
    $("#policyStart").value;


  const endDate=
    $("#policyEnd").value;


  const status=
    $("#policyStatus").value;


  const notes=
    $("#policyNotes")
      .value
      .trim();


  if(!clientId){

    toast(
      "Selecione o cliente."
    );

    return null;

  }


  if(
    !insurer ||
    !type ||
    !number ||
    !startDate ||
    !endDate
  ){

    toast(
      "Preencha todos os campos obrigatórios da apólice."
    );

    return null;

  }


  if(
    new Date(endDate+"T12:00:00") <
    new Date(startDate+"T12:00:00")
  ){

    toast(
      "O fim da vigência não pode ser anterior ao início."
    );

    return null;

  }


  const id=
    $("#policyId").value||
    uid();


  const old=
    policyById(id);


  const renewedFrom=
    $("#policyRenewedFrom").value||
    old?.renewedFrom||
    null;


  const file=
    $("#policyPdf").files?.[0]||
    null;


  let pdfPath=
    old?.pdfPath||
    null;


  let newPdfPath=
    null;


  const saveButton=
    $("#policyForm")
      .querySelector(
        'button[type="submit"], button:not([type])'
      );


  if(saveButton){

    saveButton.disabled=true;

    saveButton.dataset.oldText=
      saveButton.textContent;

    saveButton.textContent=
      "Salvando...";

  }


  try{

    if(file){

      newPdfPath=
        await uploadPolicyPdf(
          id,
          file
        );


      pdfPath=
        newPdfPath;

    }


    const policy={

      id,

      clientId,

      insurer,

      type,

      number,

      startDate,

      endDate,

      status,

      notes,

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

      pdfPath,

      renewedFrom,

      createdAt:
        old?.createdAt||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };


    const {
      data,
      error
    }=await sb
      .from("policies")
      .upsert(
        policyToDb(policy)
      )
      .select()
      .single();


    if(error){
      throw error;
    }


    const saved=
      policyFromDb(data);


    const index=
      state.policies.findIndex(
        item=>
          item.id===saved.id
      );


    if(index>=0){

      state.policies[index]=
        saved;

    }else{

      state.policies.push(
        saved
      );

    }


    if(
      newPdfPath &&
      old?.pdfPath &&
      old.pdfPath!==newPdfPath
    ){

      await deletePdfPath(
        old.pdfPath
      );

    }


    if(!old){

      await addEvent(
        saved.id,
        "create",
        "Apólice cadastrada"
      );

    }else{

      await addEvent(
        saved.id,
        "update",
        "Apólice atualizada"
      );

    }


    closeModal(
      "policyModal"
    );


    renderAll();


    toast(
      "Apólice salva com sucesso."
    );


    return saved;


  }catch(error){

    console.error(
      "Erro ao salvar apólice:",
      error
    );


    if(newPdfPath){

      await deletePdfPath(
        newPdfPath
      );

    }


    toast(
      "Erro ao salvar apólice: "+
      (
        error?.message||
        "Erro desconhecido"
      )
    );


    return null;


  }finally{

    if(saveButton){

      saveButton.disabled=false;

      saveButton.textContent=
        saveButton.dataset.oldText||
        "Salvar apólice";

    }

  }

}



async function openPdf(id){

  const policy=
    policyById(id);


  if(
    !policy ||
    !policy.pdfPath
  ){

    toast(
      "Esta apólice não possui PDF."
    );

    return;

  }


  try{

    const {
      data,
      error
    }=await sb
      .storage
      .from("policy-pdfs")
      .createSignedUrl(
        policy.pdfPath,
        3600
      );


    if(error){
      throw error;
    }


    $("#pdfTitle")
      .textContent=
      `${policy.type} · ${policy.number}`;


    $("#pdfFrame").src=
      data.signedUrl;


    openModal(
      "pdfModal"
    );


  }catch(error){

    console.error(error);


    toast(
      "Não foi possível abrir o PDF."
    );

  }

}



async function changeStatus(
  id,
  newStatus
){

  const policy=
    policyById(id);


  if(!policy){
    return;
  }


  try{

    const {
      data,
      error
    }=await sb
      .from("policies")
      .update({
        status:newStatus,
        updated_at:
          new Date().toISOString()
      })
      .eq(
        "id",
        id
      )
      .select()
      .single();


    if(error){
      throw error;
    }


    const saved=
      policyFromDb(data);


    const index=
      state.policies.findIndex(
        item=>item.id===id
      );


    if(index>=0){

      state.policies[index]=
        saved;

    }


    await addEvent(
      id,
      "status",
      `Status alterado para ${newStatus}`
    );


    renderAll();


    toast(
      `Status alterado para ${newStatus}.`
    );


  }catch(error){

    console.error(error);


    toast(
      "Não foi possível alterar o status."
    );

  }

}



function renewPolicy(id){

  const old=
    policyById(id);


  if(!old){

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  resetPolicyForm(
    old.clientId
  );


  $("#policyRenewedFrom").value=
    old.id;


  $("#policyParentId").value=
    old.id;


  $("#policyInsurer").value=
    old.insurer;


  $("#policyType").value=
    old.type;


  $("#policyNumber").value="";


  $("#policyStatus").value=
    "Pendente";


  $("#alert30").checked=
    old.alerts?.[30]!==false;


  $("#alert15").checked=
    old.alerts?.[15]!==false;


  $("#alert7").checked=
    old.alerts?.[7]!==false;


  $("#alert1").checked=
    old.alerts?.[1]!==false;


  $("#alertExpired").checked=
    old.alerts?.expired!==false;


  $("#policyNotes").value=
    old.notes||"";


  $("#policyModalTitle")
    .textContent=
    "Renovar apólice";


  const client=
    clientById(
      old.clientId
    );


  $("#renewInfo")
    .classList
    .remove("hidden");


  $("#renewInfo")
    .innerHTML=`
      <strong>
        Renovação de apólice
      </strong>

      <p>
        Cliente:
        <b>${esc(client?.name||"Cliente")}</b>
      </p>

      <p>
        Apólice anterior:
        <b>${esc(old.number)}</b>
      </p>

      <p>
        Vigência anterior:
        ${fmtDate(old.startDate)}
        →
        ${fmtDate(old.endDate)}
      </p>

      <p>
        Uma nova apólice será criada.
        A anterior continuará salva no histórico.
      </p>
    `;


  openModal(
    "policyModal"
  );

}



async function finalizeRenewal(
  oldPolicyId
){

  const old=
    policyById(
      oldPolicyId
    );


  if(!old){
    return;
  }


  try{

    await addEvent(
      old.id,
      "renewal",
      "Uma nova apólice foi criada a partir desta renovação"
    );


  }catch(error){

    console.error(
      "Erro ao registrar renovação:",
      error
    );

  }

}



function openDetails(id){

  const policy=
    policyById(id);


  if(!policy){

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const client=
    clientById(
      policy.clientId
    );


  const expiry=
    expiryLabel(
      policy
    );


  const events=
    state.events
      .filter(
        event=>
          event.policyId===policy.id
      )
      .sort(
        (a,b)=>
          new Date(b.date)-
          new Date(a.date)
      );


  $("#detailsTitle")
    .textContent=
    `${policy.type} · ${policy.number}`;


  $("#detailsSubtitle")
    .textContent=
    `${client?.name||"Cliente"} · ${policy.insurer}`;


  $("#detailsBody")
    .innerHTML=`

      <div class="details-grid">

        <div class="detail-box">

          <small>
            Cliente
          </small>

          <strong>
            ${esc(client?.name||"Cliente")}
          </strong>

          <span>
            ${esc(formatPhone(client?.phone)||"")}
          </span>

          <span>
            ${esc(client?.email||"")}
          </span>

        </div>


        <div class="detail-box">

          <small>
            Apólice
          </small>

          <strong>
            ${esc(policy.number)}
          </strong>

          <span>
            ${esc(policy.type)}
          </span>

          <span>
            ${esc(policy.insurer)}
          </span>

        </div>


        <div class="detail-box">

          <small>
            Vigência
          </small>

          <strong>
            ${fmtDate(policy.startDate)}
            →
            ${fmtDate(policy.endDate)}
          </strong>

          <span class="pill ${expiry.cls}">
            ${expiry.text}
          </span>

        </div>


        <div class="detail-box">

          <small>
            Processo
          </small>

          <strong>
            ${esc(policy.status)}
          </strong>

          <span class="pill ${processClass(policy.status)}">
            ${esc(policy.status)}
          </span>

        </div>

      </div>


      ${
        policy.notes
        ?`
          <div
            class="info-box"
            style="margin-top:16px"
          >

            <strong>
              Observações
            </strong>

            <p>
              ${esc(policy.notes)}
            </p>

          </div>
        `
        :""
      }


      <div
        class="actions"
        style="
          margin-top:18px;
          flex-wrap:wrap;
        "
      >

        ${
          policy.status!=="Pendente"
          ?`
            <button
              class="btn btn-secondary"
              onclick="changeStatus('${policy.id}','Pendente')"
            >
              Pendente
            </button>
          `
          :""
        }


        ${
          policy.status!=="Em andamento"
          ?`
            <button
              class="btn btn-secondary"
              onclick="changeStatus('${policy.id}','Em andamento')"
            >
              Em andamento
            </button>
          `
          :""
        }


        ${
          policy.status!=="Ganho"
          ?`
            <button
              class="btn btn-secondary"
              onclick="changeStatus('${policy.id}','Ganho')"
            >
              Ganho
            </button>
          `
          :""
        }


        ${
          policy.pdfPath
          ?`
            <button
              class="btn btn-secondary"
              onclick="openPdf('${policy.id}')"
            >
              📄 Abrir PDF
            </button>
          `
          :""
        }


        <button
          class="btn btn-secondary"
          onclick="sendEmail('${policy.id}')"
        >
          ✉ Lembrete por e-mail
        </button>


        <button
          class="btn btn-secondary"
          onclick="manualWhatsApp('${policy.id}')"
        >
          WhatsApp
        </button>


        <button
          class="btn btn-secondary"
          onclick="
            editPolicy('${policy.id}');
            closeModal('detailsModal');
          "
        >
          Editar
        </button>


        <button
          class="btn btn-secondary"
          style="
            color:#b42318;
            border-color:#fecdca;
            background:#fff5f5;
          "
          onclick="deletePolicy('${policy.id}')"
        >
          🗑 Excluir
        </button>


        <button
          class="btn btn-primary"
          onclick="
            renewPolicy('${policy.id}');
            closeModal('detailsModal');
          "
        >
          ↻ Renovar apólice
        </button>

      </div>


      <div
        style="margin-top:24px"
      >

        <h4>
          Histórico
        </h4>


        <div
          class="history-list"
          style="margin-top:12px"
        >

          ${
            events.length
            ?events.map(
              event=>`

                <div class="history-item">

                  <div>

                    <strong>
                      ${esc(event.message)}
                    </strong>

                    <small>
                      ${new Date(event.date).toLocaleString("pt-BR")}
                    </small>

                  </div>

                </div>

              `
            ).join("")
            :`
              <div class="empty">
                Nenhum evento registrado.
              </div>
            `
          }

        </div>

      </div>
    `;


  openModal(
    "detailsModal"
  );

}



function manualWhatsApp(id){

  const policy=
    policyById(id);


  const client=
    clientById(
      policy?.clientId
    );


  if(
    !policy ||
    !client
  ){
    return;
  }


  const phone=
    cleanPhone(
      client.phone
    );


  if(
    !validBrazilPhone(
      phone
    )
  ){

    toast(
      "O telefone deste cliente não é válido."
    );

    return;

  }


  const days=
    daysUntil(
      policy.endDate
    );


  const deadline=
    days<0
    ?`venceu há ${Math.abs(days)} dia(s)`
    :days===0
      ?"vence hoje"
      :`vence em ${days} dia(s)`;


  const message=
    `Olá, ${client.name}! Aqui é da SAVA Seguros. `+
    `Estamos entrando em contato sobre sua apólice ${policy.number}, `+
    `do seguro ${policy.type}, que ${deadline} (${fmtDate(policy.endDate)}). `+
    `Podemos conversar sobre a renovação?`;


  window.open(
    "https://wa.me/55"+
    phone+
    "?text="+
    encodeURIComponent(message),
    "_blank"
  );

}



function ensureDeleteModal(){

  let modal=
    $("#deleteSystemModal");


  if(modal){
    return modal;
  }


  modal=
    document.createElement(
      "div"
    );


  modal.id=
    "deleteSystemModal";


  modal.className=
    "modal";


  modal.innerHTML=`

    <div class="modal-card compact">

      <div class="modal-head">

        <div>

          <h3 id="deleteSystemTitle">
            Confirmar exclusão
          </h3>

          <p>
            Esta ação não poderá ser desfeita.
          </p>

        </div>

        <button
          class="close-btn"
          type="button"
          id="deleteCancelX"
        >
          ×
        </button>

      </div>


      <div
        id="deleteSystemMessage"
        style="
          line-height:1.6;
          margin-bottom:20px;
        "
      ></div>


      <div
        id="deleteSystemActions"
        class="modal-actions"
      >

        <button
          type="button"
          class="btn btn-secondary"
          id="deleteCancelBtn"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="btn btn-primary"
          id="deleteConfirmBtn"
          style="
            background:#b42318;
            border-color:#b42318;
          "
        >
          Excluir
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );


  $("#deleteCancelBtn")
    .addEventListener(
      "click",
      ()=>{
        closeModal(
          "deleteSystemModal"
        );
      }
    );


  $("#deleteCancelX")
    .addEventListener(
      "click",
      ()=>{
        closeModal(
          "deleteSystemModal"
        );
      }
    );


  modal.addEventListener(
    "click",
    event=>{

      if(event.target===modal){

        closeModal(
          "deleteSystemModal"
        );

      }

    }
  );


  return modal;

}



function confirmDelete({
  title,
  message,
  confirmText="Excluir",
  onConfirm
}){

  ensureDeleteModal();


  $("#deleteSystemTitle")
    .textContent=
    title;


  $("#deleteSystemMessage")
    .innerHTML=
    message;


  const button=
    $("#deleteConfirmBtn");


  button.textContent=
    confirmText;


  button.onclick=
    async()=>{

      button.disabled=true;

      const original=
        button.textContent;


      button.textContent=
        "Excluindo...";


      try{

        await onConfirm();


        closeModal(
          "deleteSystemModal"
        );


      }catch(error){

        console.error(error);


        toast(
          error?.message||
          "Não foi possível excluir."
        );


      }finally{

        button.disabled=false;

        button.textContent=
          original;

      }

    };


  openModal(
    "deleteSystemModal"
  );

}



function deleteClient(id){

  const client=
    clientById(id);


  if(!client){

    toast(
      "Cliente não encontrado."
    );

    return;

  }


  const policies=
    state.policies.filter(
      policy=>
        policy.clientId===id
    );


  if(policies.length){

    ensureDeleteModal();


    $("#deleteSystemTitle")
      .textContent=
      "Não é possível excluir";


    $("#deleteSystemMessage")
      .innerHTML=`

        <p>
          O cliente
          <strong>${esc(client.name)}</strong>
          possui
          <strong>${policies.length}</strong>
          apólice(s).
        </p>

        <p>
          Para excluir este cliente,
          exclua primeiro todas as apólices
          vinculadas a ele.
        </p>
      `;


    $("#deleteConfirmBtn")
      .style
      .display=
      "none";


    $("#deleteCancelBtn")
      .textContent=
      "Entendi";


    openModal(
      "deleteSystemModal"
    );


    const cleanup=()=>{

      $("#deleteConfirmBtn")
        .style
        .display="";

      $("#deleteCancelBtn")
        .textContent=
        "Cancelar";

      $("#deleteCancelBtn")
        .removeEventListener(
          "click",
          cleanup
        );

    };


    $("#deleteCancelBtn")
      .addEventListener(
        "click",
        cleanup
      );


    return;

  }


  $("#deleteConfirmBtn") &&
  (
    $("#deleteConfirmBtn").style.display=""
  );


  $("#deleteCancelBtn") &&
  (
    $("#deleteCancelBtn").textContent="Cancelar"
  );


  confirmDelete({

    title:"Excluir cliente",

    message:`
      <p>
        Deseja realmente excluir
        <strong>${esc(client.name)}</strong>?
      </p>

      <p>
        O cadastro será removido permanentemente.
      </p>
    `,

    confirmText:"Excluir cliente",

    onConfirm:async()=>{

      const {
        error
      }=await sb
        .from("clients")
        .delete()
        .eq(
          "id",
          client.id
        );


      if(error){
        throw error;
      }


      state.clients=
        state.clients.filter(
          item=>
            item.id!==client.id
        );


      renderAll();


      toast(
        "Cliente excluído."
      );

    }

  });

}



function deletePolicy(id){

  const policy=
    policyById(id);


  if(!policy){

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const client=
    clientById(
      policy.clientId
    );


  $("#deleteConfirmBtn") &&
  (
    $("#deleteConfirmBtn").style.display=""
  );


  $("#deleteCancelBtn") &&
  (
    $("#deleteCancelBtn").textContent="Cancelar"
  );


  confirmDelete({

    title:"Excluir apólice",

    message:`

      <p>
        Deseja realmente excluir a apólice
        <strong>${esc(policy.number)}</strong>
        de
        <strong>${esc(client?.name||"Cliente")}</strong>?
      </p>

      <p>
        O PDF vinculado e o histórico desta
        apólice também serão removidos.
      </p>

    `,

    confirmText:"Excluir apólice",

    onConfirm:async()=>{

      if(policy.pdfPath){

        await deletePdfPath(
          policy.pdfPath
        );

      }


      const {
        error:eventsError
      }=await sb
        .from("events")
        .delete()
        .eq(
          "policy_id",
          policy.id
        );


      if(eventsError){
        throw eventsError;
      }


      const {
        error
      }=await sb
        .from("policies")
        .delete()
        .eq(
          "id",
          policy.id
        );


      if(error){
        throw error;
      }


      state.events=
        state.events.filter(
          event=>
            event.policyId!==policy.id
        );


      state.policies=
        state.policies.filter(
          item=>
            item.id!==policy.id
        );


      closeModal(
        "detailsModal"
      );


      renderAll();


      toast(
        "Apólice excluída."
      );

    }

  });

} function renderKanban(){

  const columns=[
    "Pendente",
    "Em andamento",
    "Ganho"
  ];


  $("#kanban").innerHTML=
    columns.map(
      status=>{

        const policies=
          state.policies.filter(
            policy=>
              policy.status===status
          );


        const cssClass=
          status==="Pendente"
            ?"pendente"
            :status==="Ganho"
              ?"ganho"
              :"andamento";


        return `
          <div class="kanban-col ${cssClass}">

            <h4>

              <span>
                ${status}
              </span>

              <span>
                ${policies.length}
              </span>

            </h4>


            ${
              policies.length
              ?policies.map(
                policy=>{

                  const client=
                    clientById(
                      policy.clientId
                    );


                  return `
                    <div class="kanban-card">

                      <strong>
                        ${esc(client?.name||"Cliente")}
                      </strong>

                      <small>

                        ${esc(policy.type)}
                        ·
                        ${esc(policy.insurer)}

                        <br>

                        Vence:
                        ${fmtDate(policy.endDate)}

                      </small>


                      <select
                        onchange="changeStatus('${policy.id}',this.value)"
                      >

                        <option
                          ${policy.status==="Pendente"?"selected":""}
                        >
                          Pendente
                        </option>

                        <option
                          ${policy.status==="Em andamento"?"selected":""}
                        >
                          Em andamento
                        </option>

                        <option
                          ${policy.status==="Ganho"?"selected":""}
                        >
                          Ganho
                        </option>

                      </select>

                    </div>
                  `;

                }
              ).join("")
              :`
                <div class="empty">
                  Nenhuma apólice.
                </div>
              `
            }

          </div>
        `;

      }
    ).join("");

}



function renderConfig(){

  $("#cfgUser").value=
    state.user?.email||"";


  $("#emailEndpoint").value=
    state.settings.endpoint||"";


  $("#managerEmail").value=
    state.settings.managerEmail||"";


  if($("#languageSelect")){

    $("#languageSelect").value=
      state.settings.language||
      "pt-BR";

  }

}



function go(view){

  $$(".view")
    .forEach(
      item=>
        item.classList.remove(
          "active"
        )
    );


  const target=
    $("#"+view);


  if(!target){

    console.warn(
      "Tela não encontrada:",
      view
    );

    return;

  }


  target.classList.add(
    "active"
  );


  $$(".nav-item")
    .forEach(
      button=>{

        button.classList.toggle(
          "active",
          button.dataset.view===view
        );

      }
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


  if(view==="dashboard"){

    renderDashboard();

  }


  if(view==="clientes"){

    renderClients();

  }


  if(view==="apolices"){

    renderPolicies();

  }


  if(view==="renovacoes"){

    renderKanban();

  }


  if(view==="config"){

    renderConfig();

  }

}



function openModal(id){

  const modal=
    $("#"+id);


  if(!modal){

    console.error(
      "Modal não encontrado:",
      id
    );

    return;

  }


  modal.classList.add(
    "open"
  );

}



function closeModal(id){

  const modal=
    $("#"+id);


  if(!modal){
    return;
  }


  modal.classList.remove(
    "open"
  );


  if(id==="pdfModal"){

    $("#pdfFrame").src="";

  }

}



function managerEmailBody(policy){

  const client=
    clientById(
      policy.clientId
    );


  const days=
    daysUntil(
      policy.endDate
    );


  const deadline=
    days<0
      ?`Vencida há ${Math.abs(days)} dia(s)`
      :days===0
        ?"Vence hoje"
        :`Faltam ${days} dia(s)`;


  return (
    `RENOVAÇÃO DE SEGURO — SAVA SEGUROS\n\n`+
    `Cliente: ${client?.name||"Cliente"}\n`+
    `Telefone: ${formatPhone(client?.phone)||"Não informado"}\n`+
    `E-mail do cliente: ${client?.email||"Não informado"}\n`+
    `Seguradora: ${policy.insurer}\n`+
    `Seguro: ${policy.type}\n`+
    `Apólice: ${policy.number||"Sem número"}\n`+
    `Início: ${fmtDate(policy.startDate)}\n`+
    `Vencimento: ${fmtDate(policy.endDate)}\n`+
    `Prazo: ${deadline}\n`+
    `Status: ${policy.status}\n\n`+
    `Esta apólice requer acompanhamento de renovação.`
  );

}



async function sendEmail(id){

  const policy=
    policyById(id);


  if(!policy){

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const to=
    state.settings.managerEmail;


  if(!to){

    toast(
      "Configure o e-mail do gestor em Configurações."
    );

    return;

  }


  if(!state.settings.endpoint){

    window.location.href=
      `mailto:${encodeURIComponent(to)}`+
      `?subject=${encodeURIComponent("Renovação próxima - SAVA Seguros")}`+
      `&body=${encodeURIComponent(managerEmailBody(policy))}`;


    return;

  }


  try{

    const response=
      await fetch(
        state.settings.endpoint,
        {
          method:"POST",

          headers:{
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:JSON.stringify({
            action:"sendEmail",
            to,
            subject:
              "Renovação próxima - SAVA Seguros",
            body:
              managerEmailBody(policy),
            policyId:
              policy.id
          })
        }
      );


    const json=
      await response.json();


    if(!json.ok){

      throw new Error(
        json.error||
        "Falha no envio"
      );

    }


    await addEvent(
      policy.id,
      "email",
      "Lembrete de e-mail enviado ao gestor"
    );


    toast(
      "E-mail enviado ao gestor."
    );


  }catch(error){

    console.error(
      "Erro ao enviar e-mail:",
      error
    );


    toast(
      "Falha no endpoint de e-mail."
    );

  }

}



function checkAutomation(){

  const configured=
    !!state.settings.endpoint &&
    !!state.settings.managerEmail;


  const badge=
    $("#emailAutomationBadge");


  if(!badge){
    return;
  }


  badge.textContent=
    `● E-mail automático: ${
      configured
        ?"ativo"
        :"não configurado"
    }`;


  badge.style.color=
    configured
      ?"#087443"
      :"#b54708";


  if(configured){

    autoEmailScan();

  }

}



async function autoEmailScan(){

  const todayIso=
    iso(
      new Date()
    );


  const sentToday=
    state.events
      .filter(
        event=>
          event.type==="email" &&
          event.date?.slice(0,10)===
          todayIso
      )
      .map(
        event=>
          event.policyId
      );


  for(
    const policy of state.policies
  ){

    const days=
      daysUntil(
        policy.endDate
      );


    const mark=
      [30,15,7,1].includes(days)
        ?days
        :(
          days<0 &&
          days>=-1
            ?"expired"
            :null
        );


    if(mark===null){
      continue;
    }


    if(
      sentToday.includes(
        policy.id
      )
    ){
      continue;
    }


    if(
      policy.alerts?.[mark]===
      false
    ){
      continue;
    }


    await sendEmail(
      policy.id
    );

  }

}



function generateReport(){

  const total=
    state.policies.length;


  const expired=
    state.policies.filter(
      policy=>
        daysUntil(
          policy.endDate
        )<0
    ).length;


  const d7=
    state.policies.filter(
      policy=>{

        const days=
          daysUntil(
            policy.endDate
          );

        return days>=0 &&
               days<=7;

      }
    ).length;


  const pending=
    state.policies.filter(
      policy=>
        policy.status===
        "Pendente"
    ).length;


  const inProgress=
    state.policies.filter(
      policy=>
        policy.status===
        "Em andamento"
    ).length;


  const won=
    state.policies.filter(
      policy=>
        policy.status===
        "Ganho"
    ).length;


  const risks=
    [...state.policies]
      .filter(
        policy=>
          daysUntil(
            policy.endDate
          )<=30 &&
          policy.status!=="Ganho"
      )
      .sort(
        (a,b)=>
          daysUntil(a.endDate)-
          daysUntil(b.endDate)
      )
      .slice(0,5);


  return `
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
        <small>vencem em até 7 dias</small>
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
        <strong>${inProgress}</strong>
        <small>em andamento</small>
      </div>

      <div class="report-box">
        <strong>${won}</strong>
        <small>ganhas</small>
      </div>

    </div>


    <h4>
      Prioridades
    </h4>


    <ul>

      ${
        risks.length
        ?risks.map(
          policy=>`

            <li>

              <b>
                ${esc(
                  clientById(
                    policy.clientId
                  )?.name||
                  "Cliente"
                )}
              </b>

              —

              ${esc(policy.type)},

              ${esc(policy.insurer)}

              —

              ${expiryLabel(policy).text}

              —

              processo:
              ${esc(policy.status)}

            </li>

          `
        ).join("")
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
        ?"Há renovações ainda pendentes. "
        :""
      }

      ${
        inProgress
        ?"Existem negociações em andamento que podem virar ganhos. "
        :""
      }

      ${
        !expired &&
        !d7 &&
        !pending
        ?"A carteira está sem sinais críticos pelos indicadores atuais."
        :""
      }

    </p>
  `;

}



function showReport(){

  $("#reportArea").innerHTML=
    generateReport();


  go(
    "relatorios"
  );

}



async function login(event){

  event.preventDefault();


  const email=
    $("#loginUser")
      .value
      .trim();


  const password=
    $("#loginPass")
      .value;


  $("#loginError").textContent="";


  const {
    data,
    error
  }=await sb.auth.signInWithPassword({
    email,
    password
  });


  if(error){

    console.error(
      error
    );


    $("#loginError").textContent=
      "E-mail ou senha incorretos.";


    return;

  }


  state.user=
    data.user;


  showApp();


  await loadCloudData();

}



async function logout(){

  await sb.auth.signOut();


  state.user=null;

  state.clients=[];

  state.policies=[];

  state.events=[];


  showLogin();

}



async function forgotPassword(){

  const email=
    $("#loginUser")
      .value
      .trim();


  if(!email){

    $("#loginError").textContent=
      "Digite seu e-mail primeiro.";


    return;

  }


  const redirectTo=
    window.location.origin+
    window.location.pathname;


  const {
    error
  }=await sb.auth
    .resetPasswordForEmail(
      email,
      {
        redirectTo
      }
    );


  if(error){

    console.error(error);


    $("#loginError").textContent=
      "Não foi possível enviar o link de recuperação.";


    return;

  }


  $("#loginError").textContent=
    "Link de recuperação enviado para o seu e-mail.";

}



async function saveRecoveredPassword(){

  const password=
    $("#recoveryPass").value;


  const confirmation=
    $("#recoveryPassConfirm").value;


  $("#recoveryError").textContent="";


  if(password.length<6){

    $("#recoveryError").textContent=
      "A senha precisa ter pelo menos 6 caracteres.";


    return;

  }


  if(
    password!==confirmation
  ){

    $("#recoveryError").textContent=
      "As senhas não coincidem.";


    return;

  }


  const {
    error
  }=await sb.auth.updateUser({
    password
  });


  if(error){

    console.error(error);


    $("#recoveryError").textContent=
      "Não foi possível alterar a senha.";


    return;

  }


  $("#recoveryError").textContent=
    "Senha alterada com sucesso.";


  setTimeout(
    async()=>{

      await sb.auth.signOut();


      location.href=
        window.location.origin+
        window.location.pathname;

    },
    1200
  );

}



async function changePassword(){

  const password=
    $("#cfgPass").value;


  const confirmation=
    $("#cfgPassConfirm").value;


  if(!password){

    toast(
      "Digite a nova senha."
    );

    return;

  }


  if(password.length<6){

    toast(
      "A senha precisa ter pelo menos 6 caracteres."
    );

    return;

  }


  if(
    password!==confirmation
  ){

    toast(
      "As senhas não coincidem."
    );

    return;

  }


  const {
    error
  }=await sb.auth.updateUser({
    password
  });


  if(error){

    console.error(error);


    toast(
      "Não foi possível alterar a senha."
    );


    return;

  }


  $("#cfgPass").value="";

  $("#cfgPassConfirm").value="";


  toast(
    "Senha alterada com sucesso."
  );

}



function openLegacyDB(){

  return new Promise(
    (
      resolve,
      reject
    )=>{

      const request=
        indexedDB.open(
          "savaCRMv2",
          1
        );


      request.onsuccess=
        ()=>resolve(
          request.result
        );


      request.onerror=
        ()=>reject(
          request.error
        );


      request.onupgradeneeded=
        ()=>{};

    }
  );

}



function legacyGetAll(
  db,
  store
){

  return new Promise(
    (
      resolve,
      reject
    )=>{

      if(
        !db.objectStoreNames.contains(
          store
        )
      ){

        resolve([]);

        return;

      }


      const request=
        db.transaction(
          store,
          "readonly"
        )
        .objectStore(
          store
        )
        .getAll();


      request.onsuccess=
        ()=>resolve(
          request.result||[]
        );


      request.onerror=
        ()=>reject(
          request.error
        );

    }
  );

}



function isUuid(value){

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value||"")
  );

}



async function migrateLocalData(){

  const status=
    $("#migrationStatus");


  if(
    localStorage.getItem(
      `savaSupabaseMigrated_${state.user.id}`
    )==="1"
  ){

    const repeat=
      confirm(
        "Este dispositivo já foi marcado como migrado. Deseja executar a migração novamente?"
      );


    if(!repeat){
      return;
    }

  }


  const confirmed=
    confirm(
      "Migrar os clientes, apólices, histórico, configurações e PDFs salvos neste navegador para o Supabase?\n\nFaça isso no computador onde estão os dados antigos."
    );


  if(!confirmed){
    return;
  }


  status.textContent=
    "Lendo banco antigo...";


  try{

    const db=
      await openLegacyDB();


    const [
      oldClients,
      oldPolicies,
      oldEvents,
      oldSettings,
      oldPdfs
    ]=await Promise.all([

      legacyGetAll(
        db,
        "clients"
      ),

      legacyGetAll(
        db,
        "policies"
      ),

      legacyGetAll(
        db,
        "events"
      ),

      legacyGetAll(
        db,
        "settings"
      ),

      legacyGetAll(
        db,
        "pdfs"
      )

    ]);


    if(
      !oldClients.length &&
      !oldPolicies.length
    ){

      status.textContent=
        "Nenhum cliente ou apólice antiga encontrada neste dispositivo.";


      return;

    }


    const clientIds=
      new Map();


    const policyIds=
      new Map();


    oldClients.forEach(
      client=>
        clientIds.set(
          client.id,
          isUuid(client.id)
            ?client.id
            :uid()
        )
    );


    oldPolicies.forEach(
      policy=>
        policyIds.set(
          policy.id,
          isUuid(policy.id)
            ?policy.id
            :uid()
        )
    );


    status.textContent=
      "Enviando clientes...";


    for(
      const client of oldClients
    ){

      const row={

        id:
          clientIds.get(
            client.id
          ),

        user_id:
          state.user.id,

        name:
          client.name||
          "Cliente sem nome",

        birth_date:
          client.birthDate||
          null,

        phone:
          cleanPhone(
            client.phone
          ),

        document:
          client.document||
          null,

        email:
          client.email||
          null,

        notes:
          client.notes||
          null,

        created_at:
          client.createdAt||
          new Date().toISOString(),

        updated_at:
          client.updatedAt||
          new Date().toISOString()

      };


      const {
        error
      }=await sb
        .from("clients")
        .upsert(row);


      if(error){
        throw error;
      }

    }


    const pdfMap=
      new Map(
        oldPdfs.map(
          item=>[
            item.id,
            item
          ]
        )
      );


    status.textContent=
      "Enviando apólices e PDFs...";


    for(
      const policy of oldPolicies
    ){

      const newId=
        policyIds.get(
          policy.id
        );


      let pdfPath=null;


      if(
        policy.pdfId &&
        pdfMap.has(
          policy.pdfId
        )
      ){

        const record=
          pdfMap.get(
            policy.pdfId
          );


        if(record?.blob){

          pdfPath=
            `${state.user.id}/${newId}/migrado-${Date.now()}-${safeFileName(record.name||"apolice.pdf")}`;


          const {
            error
          }=await sb
            .storage
            .from("policy-pdfs")
            .upload(
              pdfPath,
              record.blob,
              {
                contentType:
                  record.type||
                  "application/pdf",
                upsert:true
              }
            );


          if(error){
            throw error;
          }

        }

      }


      const row={

        id:newId,

        user_id:
          state.user.id,

        client_id:
          clientIds.get(
            policy.clientId
          ),

        insurer:
          policy.insurer||
          "Outra",

        type:
          policy.type||
          "Outro",

        number:
          policy.number||
          null,

        start_date:
          policy.startDate||
          null,

        end_date:
          policy.endDate||
          null,

        status:
          [
            "Pendente",
            "Em andamento",
            "Ganho"
          ].includes(
            policy.status
          )
            ?policy.status
            :"Pendente",

        notes:
          policy.notes||
          null,

        alert_30:
          policy.alerts?.[30]!==false,

        alert_15:
          policy.alerts?.[15]!==false,

        alert_7:
          policy.alerts?.[7]!==false,

        alert_1:
          policy.alerts?.[1]!==false,

        alert_expired:
          policy.alerts?.expired!==false,

        pdf_path:
          pdfPath,

        renewed_from:
          policy.renewedFrom
            ?policyIds.get(
              policy.renewedFrom
            )||null
            :null,

        created_at:
          policy.createdAt||
          new Date().toISOString(),

        updated_at:
          policy.updatedAt||
          new Date().toISOString()

      };


      const {
        error
      }=await sb
        .from("policies")
        .upsert(row);


      if(error){
        throw error;
      }

    }


    status.textContent=
      "Enviando histórico...";


    for(
      const event of oldEvents
    ){

      const mappedPolicy=
        policyIds.get(
          event.policyId
        );


      if(!mappedPolicy){
        continue;
      }


      const row={

        id:
          isUuid(event.id)
            ?event.id
            :uid(),

        user_id:
          state.user.id,

        policy_id:
          mappedPolicy,

        type:
          event.type||
          "history",

        message:
          event.message||
          "Evento migrado",

        created_at:
          event.date||
          new Date().toISOString()

      };


      const {
        error
      }=await sb
        .from("events")
        .upsert(row);


      if(error){
        throw error;
      }

    }


    const oldMain=
      oldSettings.find(
        item=>
          item.id==="main"
      )||
      oldSettings[0];


    if(oldMain){

      state.settings.endpoint=
        oldMain.endpoint||
        state.settings.endpoint;


      state.settings.managerEmail=
        oldMain.managerEmail||
        state.settings.managerEmail;


      state.settings.language=
        oldMain.language||
        "pt-BR";


      await saveSettings();

    }


    localStorage.setItem(
      `savaSupabaseMigrated_${state.user.id}`,
      "1"
    );


    await loadCloudData();


    status.textContent=
      `Migração concluída: ${oldClients.length} cliente(s) e ${oldPolicies.length} apólice(s).`;


    toast(
      "Dados antigos migrados para a nuvem."
    );


  }catch(error){

    console.error(
      error
    );


    status.textContent=
      "Falha na migração. Tente novamente.";


    toast(
      "Não foi possível concluir a migração."
    );

  }

}



async function blobToBase64(blob){

  const buffer=
    await blob.arrayBuffer();


  const bytes=
    new Uint8Array(
      buffer
    );


  let binary="";


  const chunk=
    0x8000;


  for(
    let i=0;
    i<bytes.length;
    i+=chunk
  ){

    binary+=
      String.fromCharCode(
        ...bytes.subarray(
          i,
          i+chunk
        )
      );

  }


  return btoa(
    binary
  );

}



async function exportBackup(){

  try{

    toast(
      "Preparando backup..."
    );


    const pdfs=[];


    for(
      const policy of
      state.policies.filter(
        item=>item.pdfPath
      )
    ){

      const {
        data,
        error
      }=await sb
        .storage
        .from("policy-pdfs")
        .download(
          policy.pdfPath
        );


      if(error){

        console.warn(
          error
        );


        continue;

      }


      pdfs.push({

        policyId:
          policy.id,

        path:
          policy.pdfPath,

        name:
          policy.pdfPath
            .split("/")
            .pop(),

        type:
          data.type||
          "application/pdf",

        blobBase64:
          await blobToBase64(
            data
          )

      });

    }


    const backup={

      version:3,

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
        [
          JSON.stringify(
            backup
          )
        ],
        {
          type:"application/json"
        }
      );


    const link=
      document.createElement(
        "a"
      );


    link.href=
      URL.createObjectURL(
        blob
      );


    link.download=
      `backup-sava-cloud-${iso(new Date())}.json`;


    link.click();


    URL.revokeObjectURL(
      link.href
    );


    toast(
      "Backup exportado."
    );


  }catch(error){

    console.error(error);


    toast(
      "Não foi possível exportar o backup."
    );

  }

}



async function importBackup(event){

  const file=
    event.target.files[0];


  if(!file){
    return;
  }


  try{

    const data=
      JSON.parse(
        await file.text()
      );


    if(!data.version){

      throw new Error(
        "Backup inválido"
      );

    }


    if(
      !confirm(
        "Importar este backup para o banco online?"
      )
    ){

      event.target.value="";

      return;

    }


    const clientIds=
      new Map();


    const policyIds=
      new Map();


    (data.clients||[])
      .forEach(
        client=>
          clientIds.set(
            client.id,
            isUuid(client.id)
              ?client.id
              :uid()
          )
      );


    (data.policies||[])
      .forEach(
        policy=>
          policyIds.set(
            policy.id,
            isUuid(policy.id)
              ?policy.id
              :uid()
          )
      );


    for(
      const client of
      data.clients||[]
    ){

      const row={

        id:
          clientIds.get(
            client.id
          ),

        user_id:
          state.user.id,

        name:
          client.name,

        birth_date:
          client.birthDate||
          null,

        phone:
          cleanPhone(
            client.phone
          ),

        document:
          client.document||
          null,

        email:
          client.email||
          null,

        notes:
          client.notes||
          null,

        created_at:
          client.createdAt||
          new Date().toISOString(),

        updated_at:
          new Date().toISOString()

      };


      const {
        error
      }=await sb
        .from("clients")
        .upsert(row);


      if(error){
        throw error;
      }

    }


    const backupPdfByPolicy=
      new Map(
        (data.pdfs||[])
          .map(
            item=>[
              item.policyId,
              item
            ]
          )
      );


    for(
      const policy of
      data.policies||[]
    ){

      const newId=
        policyIds.get(
          policy.id
        );


      const pdf=
        backupPdfByPolicy.get(
          policy.id
        );


      let pdfPath=null;


      if(pdf?.blobBase64){

        const binary=
          atob(
            pdf.blobBase64
          );


        const array=
          new Uint8Array(
            binary.length
          );


        for(
          let i=0;
          i<binary.length;
          i++
        ){

          array[i]=
            binary.charCodeAt(i);

        }


        const blob=
          new Blob(
            [array],
            {
              type:
                pdf.type||
                "application/pdf"
            }
          );


        pdfPath=
          `${state.user.id}/${newId}/backup-${Date.now()}-${safeFileName(pdf.name||"apolice.pdf")}`;


        const {
          error
        }=await sb
          .storage
          .from("policy-pdfs")
          .upload(
            pdfPath,
            blob,
            {
              contentType:
                blob.type,
              upsert:true
            }
          );


        if(error){
          throw error;
        }

      }


      const row={

        id:newId,

        user_id:
          state.user.id,

        client_id:
          clientIds.get(
            policy.clientId
          ),

        insurer:
          policy.insurer,

        type:
          policy.type,

        number:
          policy.number||
          null,

        start_date:
          policy.startDate||
          null,

        end_date:
          policy.endDate||
          null,

        status:
          policy.status||
          "Pendente",

        notes:
          policy.notes||
          null,

        alert_30:
          policy.alerts?.[30]!==false,

        alert_15:
          policy.alerts?.[15]!==false,

        alert_7:
          policy.alerts?.[7]!==false,

        alert_1:
          policy.alerts?.[1]!==false,

        alert_expired:
          policy.alerts?.expired!==false,

        pdf_path:
          pdfPath,

        renewed_from:
          policy.renewedFrom
            ?policyIds.get(
              policy.renewedFrom
            )||null
            :null,

        created_at:
          policy.createdAt||
          new Date().toISOString(),

        updated_at:
          new Date().toISOString()

      };


      const {
        error
      }=await sb
        .from("policies")
        .upsert(row);


      if(error){
        throw error;
      }

    }


    for(
      const eventData of
      data.events||[]
    ){

      const mappedPolicy=
        policyIds.get(
          eventData.policyId
        );


      if(!mappedPolicy){
        continue;
      }


      const row={

        id:
          isUuid(eventData.id)
            ?eventData.id
            :uid(),

        user_id:
          state.user.id,

        policy_id:
          mappedPolicy,

        type:
          eventData.type||
          "history",

        message:
          eventData.message||
          "Evento importado",

        created_at:
          eventData.date||
          new Date().toISOString()

      };


      const {
        error
      }=await sb
        .from("events")
        .upsert(row);


      if(error){
        throw error;
      }

    }


    if(data.settings){

      state.settings={

        endpoint:
          data.settings.endpoint||
          "",

        managerEmail:
          data.settings.managerEmail||
          "",

        language:
          data.settings.language||
          "pt-BR"

      };


      await saveSettings();

    }


    await loadCloudData();


    toast(
      "Backup restaurado na nuvem."
    );


  }catch(error){

    console.error(
      error
    );


    toast(
      "Backup inválido ou não foi possível importar."
    );

  }


  event.target.value="";

}



async function clearAll(){

  if(
    !confirm(
      "Apagar todos os clientes, apólices, histórico e PDFs da nuvem? Essa ação não pode ser desfeita."
    )
  ){

    return;

  }


  try{

    const paths=
      state.policies
        .map(
          policy=>
            policy.pdfPath
        )
        .filter(Boolean);


    if(paths.length){

      const {
        error
      }=await sb
        .storage
        .from("policy-pdfs")
        .remove(
          paths
        );


      if(error){

        console.warn(
          error
        );

      }

    }


    const {
      error
    }=await sb
      .from("clients")
      .delete()
      .eq(
        "user_id",
        state.user.id
      );


    if(error){
      throw error;
    }


    state.clients=[];

    state.policies=[];

    state.events=[];


    renderAll();


    toast(
      "Dados da nuvem apagados."
    );


  }catch(error){

    console.error(error);


    toast(
      "Não foi possível apagar todos os dados."
    );

  }

}



function setupEvents(){

  $$("[data-view]")
    .forEach(
      button=>
        button.addEventListener(
          "click",
          ()=>go(
            button.dataset.view
          )
        )
    );


  $$("[data-close]")
    .forEach(
      button=>
        button.addEventListener(
          "click",
          ()=>closeModal(
            button.dataset.close
          )
        )
    );


  $$(".modal")
    .forEach(
      modal=>
        modal.addEventListener(
          "click",
          event=>{

            if(
              event.target===modal
            ){

              modal.classList.remove(
                "open"
              );

            }

          }
        )
    );


  $("#loginForm")
    .addEventListener(
      "submit",
      login
    );


  $("#forgotPasswordBtn")
    .addEventListener(
      "click",
      forgotPassword
    );


  $("#recoverySaveBtn")
    .addEventListener(
      "click",
      saveRecoveredPassword
    );


  $("#logoutBtn")
    .addEventListener(
      "click",
      logout
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
      loadCloudData
    );


  $("#clientForm")
    .addEventListener(
      "submit",
      saveClient
    );


  $("#policyForm")
    .addEventListener(
      "submit",
      async event=>{

        const oldPolicy=
          $("#policyRenewedFrom")
            .value;


        const saved=
          await savePolicy(
            event
          );


        if(
          saved &&
          oldPolicy
        ){

          await finalizeRenewal(
            oldPolicy
          );


          renderAll();

        }

      }
    );


  $("#clientSearch")
    .addEventListener(
      "input",
      renderClients
    );


  $("#policySearch")
    .addEventListener(
      "input",
      renderPolicies
    );


  $("#clientFilter")
    .addEventListener(
      "change",
      renderClients
    );


  [
    "statusFilter",
    "expiryFilter",
    "typeFilter",
    "insurerFilter"
  ].forEach(
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
      changePassword
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


        try{

          await saveSettings();


          checkAutomation();


          toast(
            "Configuração de e-mail salva na nuvem."
          );


        }catch(error){

          console.error(
            error
          );


          toast(
            "Não foi possível salvar a configuração."
          );

        }

      }
    );


  $("#saveLanguage")
    .addEventListener(
      "click",
      async()=>{

        state.settings.language=
          $("#languageSelect").value||
          "pt-BR";


        try{

          await saveSettings();


          toast(
            "Idioma salvo."
          );


        }catch(error){

          console.error(
            error
          );


          toast(
            "Não foi possível salvar o idioma."
          );

        }

      }
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


  $("#migrateLocalBtn")
    .addEventListener(
      "click",
      migrateLocalData
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



async function init(){

  setupEvents();


  sb.auth.onAuthStateChange(
    (
      event,
      session
    )=>{

      if(
        event==="PASSWORD_RECOVERY"
      ){

        state.user=
          session?.user||
          null;


        showRecovery();

      }

    }
  );


  const {
    data:{
      session
    },
    error
  }=await sb.auth.getSession();


  if(error){

    console.error(
      error
    );


    showLogin();


    return;

  }


  if(
    session?.user
  ){

    state.user=
      session.user;


    showApp();


    await loadCloudData();


  }else{

    showLogin();

  }

}



init();



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


window.deletePolicy=
  deletePolicy;


window.deleteClient=
  deleteClient;


window.closeModal=
  closeModal;
