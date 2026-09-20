
/* ============================================================
   SUPABASE
   ============================================================ */

const SUPABASE_URL =
  "https://txwgxpmgegntsnvamtda.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_IG_YmrreIPbgnt05gubpHw_CriLdyfV";

const sb =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* ============================================================
   TIPOS DE SEGURO
   ============================================================ */

const TYPES = [
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


/* ============================================================
   SEGURADORAS
   ============================================================ */

const INSURERS = [
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


/* ============================================================
   ESTADO DO SISTEMA
   ============================================================ */

const state = {

  user: null,

  clients: [],

  policies: [],

  events: [],

  settings: {
    endpoint: "",
    managerEmail: "",
    language: "pt-BR"
  }

};


/* ============================================================
   ATALHOS
   ============================================================ */

const $ =
  selector =>
    document.querySelector(selector);


const $$ =
  selector =>
    [
      ...document.querySelectorAll(
        selector
      )
    ];


/* ============================================================
   IDENTIFICADOR
   ============================================================ */

const uid = () =>
  crypto.randomUUID();


/* ============================================================
   TELEFONE
   ============================================================ */

const cleanPhone =
  value =>
    String(value || "")
      .replace(/\D/g, "");


function validBrazilPhone(value) {

  const number =
    cleanPhone(value);


  if (
    number.length !== 10 &&
    number.length !== 11
  ) {
    return false;
  }


  if (
    /^(\d)\1+$/.test(number)
  ) {
    return false;
  }


  if (
    /^0/.test(number) ||
    /^1/.test(number)
  ) {
    return false;
  }


  return /^[1-9]{2}9?[2-9]\d{7}$/
    .test(number);

}


function formatPhone(value) {

  const number =
    cleanPhone(value);


  if (
    number.length === 11
  ) {

    return (
      `(${number.slice(0, 2)}) ` +
      `${number.slice(2, 7)}-` +
      `${number.slice(7)}`
    );

  }


  if (
    number.length === 10
  ) {

    return (
      `(${number.slice(0, 2)}) ` +
      `${number.slice(2, 6)}-` +
      `${number.slice(6)}`
    );

  }


  return number;

}


/* ============================================================
   CPF / CNPJ
   ============================================================ */

function onlyNumbers(value) {

  return String(value || "")
    .replace(/\D/g, "");

}


function formatDocument(value) {

  let number =
    onlyNumbers(value)
      .slice(0, 14);


  /*
    CPF
  */

  if (
    number.length <= 11
  ) {

    number =
      number.slice(0, 11);


    return number
      .replace(
        /(\d{3})(\d)/,
        "$1.$2"
      )
      .replace(
        /(\d{3})(\d)/,
        "$1.$2"
      )
      .replace(
        /(\d{3})(\d{1,2})$/,
        "$1-$2"
      );

  }


  /*
    CNPJ
  */

  return number
    .replace(
      /^(\d{2})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2"
    )
    .replace(
      /(\d{4})(\d{1,2})$/,
      "$1-$2"
    );

}


/* ============================================================
   ESCAPAR HTML
   ============================================================ */

const esc =
  value =>
    String(value ?? "")
      .replace(
        /[&<>"']/g,
        character => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[character]
      );


/* ============================================================
   DATAS
   ============================================================ */

const fmtDate =
  date => {

    if (!date) {
      return "—";
    }


    return new Intl.DateTimeFormat(
      "pt-BR"
    ).format(
      new Date(
        date + "T12:00:00"
      )
    );

  };


const iso =
  date => {

    const value =
      new Date(date);


    return new Date(
      value.getTime() -
      value.getTimezoneOffset() *
      60000
    )
      .toISOString()
      .slice(0, 10);

  };


const daysUntil =
  date => {

    if (!date) {
      return 0;
    }


    const [
      year,
      month,
      day
    ] =
      date
        .split("-")
        .map(Number);


    const target =
      Date.UTC(
        year,
        month - 1,
        day
      );


    const now =
      new Date();


    const current =
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );


    return Math.round(
      (
        target -
        current
      ) /
      86400000
    );

  };


/* ============================================================
   FILTRO DE VIGÊNCIA
   ============================================================ */

function inDateRange(
  policy,
  start,
  end
) {

  /*
    Data inicial selecionada:
    início da apólice precisa ser
    igual ou posterior.
  */

  if (
    start &&
    (
      !policy.startDate ||
      policy.startDate < start
    )
  ) {
    return false;
  }


  /*
    Data final selecionada:
    fim da apólice precisa ser
    igual ou anterior.
  */

  if (
    end &&
    (
      !policy.endDate ||
      policy.endDate > end
    )
  ) {
    return false;
  }


  return true;

}


/* ============================================================
   OUTROS UTILITÁRIOS
   ============================================================ */

const sleep =
  milliseconds =>
    new Promise(
      resolve =>
        setTimeout(
          resolve,
          milliseconds
        )
    );


const initials =
  name =>
    (name || "?")
      .split(" ")
      .slice(0, 2)
      .map(
        part =>
          part[0]
      )
      .join("")
      .toUpperCase();


function clientById(id) {

  return state.clients.find(
    client =>
      client.id === id
  );

}


function policyById(id) {

  return state.policies.find(
    policy =>
      policy.id === id
  );

}


/* ============================================================
   STATUS
   ============================================================ */

function processClass(status) {

  if (
    status === "Ganho"
  ) {
    return "green";
  }


  if (
    status === "Perdido"
  ) {
    return "red";
  }


  if (
    status === "Em andamento"
  ) {
    return "orange";
  }


  return "gray";

}


/* ============================================================
   VENCIMENTO
   ============================================================ */

function expiryLabel(policy) {

  const days =
    daysUntil(
      policy.endDate
    );


  if (
    days < 0
  ) {

    return {
      text:
        `Vencida há ${Math.abs(days)} dias`,
      cls:
        "red"
    };

  }


  if (
    days === 0
  ) {

    return {
      text:
        "Vence hoje",
      cls:
        "red"
    };

  }


  if (
    days <= 30
  ) {

    return {
      text:
        `Vence em ${days} dias`,
      cls:
        "orange"
    };

  }


  return {
    text:
      "Vigente",
    cls:
      "green"
  };

}


/* ============================================================
   TOAST
   ============================================================ */

function toast(message) {

  const element =
    $("#toast");


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  clearTimeout(
    toast._timer
  );


  toast._timer =
    setTimeout(
      () =>
        element.classList.remove(
          "show"
        ),
      3200
    );

}


/* ============================================================
   LOGIN / APP
   ============================================================ */

function showLogin() {

  $("#loginScreen")
    ?.classList
    .remove("hidden");


  $("#app")
    ?.classList
    .add("hidden");

}


function showApp() {

  $("#loginScreen")
    ?.classList
    .add("hidden");


  $("#app")
    ?.classList
    .remove("hidden");

}


/* ============================================================
   CLIENTE — BANCO → SISTEMA
   ============================================================ */

function clientFromDb(row) {

  return {

    id:
      row.id,

    name:
      row.name,

    birthDate:
      row.birth_date || "",

    phone:
      row.phone || "",

    document:
      row.document || "",

    email:
      row.email || "",

    notes:
      row.notes || "",

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at

  };

}


/* ============================================================
   CLIENTE — SISTEMA → BANCO
   ============================================================ */

function clientToDb(client) {

  return {

    id:
      client.id,

    user_id:
      state.user.id,

    name:
      client.name,

    /*
      Data de nascimento agora
      é OPCIONAL.
    */

    birth_date:
      client.birthDate || null,

    phone:
      client.phone,

    document:
      client.document || null,

    email:
      client.email || null,

    notes:
      client.notes || null,

    created_at:
      client.createdAt ||
      new Date().toISOString(),

    updated_at:
      new Date().toISOString()

  };

}


/* ============================================================
   APÓLICE — BANCO → SISTEMA
   ============================================================ */

function policyFromDb(row) {

  return {

    id:
      row.id,

    clientId:
      row.client_id,

    insurer:
      row.insurer,

    type:
      row.type,

    number:
      row.number || "",

    startDate:
      row.start_date || "",

    endDate:
      row.end_date || "",

    status:
      row.status || "Pendente",

    notes:
      row.notes || "",


    /*
      NOVO:
      feedback comercial separado
      das observações da apólice.
    */

    feedback:
      row.feedback || "",

    feedbackUpdatedAt:
      row.feedback_updated_at ||
      null,


    alerts: {

      30:
        row.alert_30 !== false,

      15:
        row.alert_15 !== false,

      7:
        row.alert_7 !== false,

      1:
        row.alert_1 !== false,

      expired:
        row.alert_expired !== false

    },


    pdfPath:
      row.pdf_path || null,

    pdfId:
      row.pdf_path || null,

    renewedFrom:
      row.renewed_from || null,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at

  };

}


/* ============================================================
   APÓLICE — SISTEMA → BANCO
   ============================================================ */

function policyToDb(policy) {

  return {

    id:
      policy.id,

    user_id:
      state.user.id,

    client_id:
      policy.clientId,

    insurer:
      policy.insurer,

    type:
      policy.type,

    number:
      policy.number || null,

    start_date:
      policy.startDate || null,

    end_date:
      policy.endDate || null,

    status:
      policy.status ||
      "Pendente",

    notes:
      policy.notes || null,


    /*
      NOVO FEEDBACK
    */

    feedback:
      policy.feedback || null,

    feedback_updated_at:
      policy.feedbackUpdatedAt ||
      null,


    alert_30:
      policy.alerts?.[30] !== false,

    alert_15:
      policy.alerts?.[15] !== false,

    alert_7:
      policy.alerts?.[7] !== false,

    alert_1:
      policy.alerts?.[1] !== false,

    alert_expired:
      policy.alerts?.expired !== false,

    pdf_path:
      policy.pdfPath || null,

    renewed_from:
      policy.renewedFrom || null,

    created_at:
      policy.createdAt ||
      new Date().toISOString(),

    updated_at:
      new Date().toISOString()

  };

}


/* ============================================================
   EVENTOS — BANCO → SISTEMA
   ============================================================ */

function eventFromDb(row) {

  return {

    id:
      row.id,

    policyId:
      row.policy_id,

    type:
      row.type || "",

    message:
      row.message,

    date:
      row.created_at

  };

}


/* ============================================================
   ADICIONAR EVENTO
   ============================================================ */

async function addEvent(
  policyId,
  type,
  message
) {

  const row = {

    id:
      uid(),

    user_id:
      state.user.id,

    policy_id:
      policyId,

    type,

    message,

    created_at:
      new Date().toISOString()

  };


  const {
    data,
    error
  } =
    await sb
      .from("events")
      .insert(row)
      .select()
      .single();


  if (error) {
    throw error;
  }


  const event =
    eventFromDb(data);


  state.events.push(
    event
  );


  return event;

}


/* ============================================================
   CACHE LOCAL DE SEGURANÇA
   ============================================================ */

function cacheKey() {

  if (
    !state.user?.id
  ) {
    return null;
  }


  return (
    "savaCache_" +
    state.user.id
  );

}


function saveLocalCache() {

  try {

    const key =
      cacheKey();


    if (!key) {
      return;
    }


    localStorage.setItem(
      key,
      JSON.stringify({

        userId:
          state.user.id,

        clients:
          state.clients,

        policies:
          state.policies,

        events:
          state.events,

        settings:
          state.settings,

        savedAt:
          new Date()
            .toISOString()

      })
    );


  } catch (error) {

    console.warn(
      "Não foi possível salvar o cache local.",
      error
    );

  }

}


function loadLocalCache() {

  try {

    const key =
      cacheKey();


    if (!key) {
      return false;
    }


    const raw =
      localStorage.getItem(
        key
      );


    if (!raw) {
      return false;
    }


    const cache =
      JSON.parse(raw);


    /*
      Não mistura cache
      entre usuários diferentes.
    */

    if (
      cache.userId &&
      cache.userId !==
      state.user.id
    ) {
      return false;
    }


    if (
      !Array.isArray(
        cache.clients
      ) ||
      !Array.isArray(
        cache.policies
      )
    ) {
      return false;
    }


    state.clients =
      cache.clients || [];


    state.policies =
      cache.policies || [];


    state.events =
      cache.events || [];


    state.settings =
      cache.settings || {
        endpoint: "",
        managerEmail: "",
        language: "pt-BR"
      };


    return true;


  } catch (error) {

    console.warn(
      "Cache local inválido.",
      error
    );


    return false;

  }

}


/* ============================================================
   CARREGAR DADOS DO SUPABASE
   COM RETENTATIVA E PROTEÇÃO CONTRA TELA ZERADA
   ============================================================ */

async function loadCloudData() {

  if (
    !state.user
  ) {
    return;
  }


  let lastError =
    null;


  /*
    Três tentativas.
    Não apagamos o state antes
    de confirmar que tudo carregou.
  */

  for (
    let attempt = 1;
    attempt <= 3;
    attempt++
  ) {

    try {

      const [
        clientsResult,
        policiesResult,
        eventsResult,
        settingsResult
      ] =
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
              {
                ascending: false
              }
            ),

          sb
            .from("settings")
            .select("*")
            .maybeSingle()

        ]);


      const results = [
        clientsResult,
        policiesResult,
        eventsResult,
        settingsResult
      ];


      for (
        const result
        of results
      ) {

        if (
          result.error
        ) {
          throw result.error;
        }

      }


      /*
        Só cria os novos dados
        depois que TODAS as consultas
        deram certo.
      */

      const newClients =
        (
          clientsResult.data ||
          []
        )
          .map(
            clientFromDb
          );


      const newPolicies =
        (
          policiesResult.data ||
          []
        )
          .map(
            policyFromDb
          );


      const newEvents =
        (
          eventsResult.data ||
          []
        )
          .map(
            eventFromDb
          );


      const newSettings =
        settingsResult.data

          ? {

              endpoint:
                settingsResult
                  .data
                  .email_endpoint ||
                "",

              managerEmail:
                settingsResult
                  .data
                  .manager_email ||
                "",

              language:
                settingsResult
                  .data
                  .language ||
                "pt-BR"

            }

          : {

              endpoint: "",
              managerEmail: "",
              language: "pt-BR"

            };


      /*
        Agora sim substitui o state.
      */

      state.clients =
        newClients;


      state.policies =
        newPolicies;


      state.events =
        newEvents;


      state.settings =
        newSettings;


      saveLocalCache();


      renderAll();


      return true;


    } catch (error) {

      lastError =
        error;


      console.warn(
        `Falha Supabase ${attempt}/3`,
        error
      );


      if (
        attempt < 3
      ) {

        await sleep(
          attempt === 1
            ? 500
            : 1200
        );

      }

    }

  }


  console.error(
    "Erro ao carregar Supabase:",
    lastError
  );


  /*
    IMPORTANTE:
    Se já existem dados na tela,
    NÃO zeramos.
  */

  if (
    state.clients.length ||
    state.policies.length
  ) {

    toast(
      "Conexão instável. Mantendo os dados já carregados."
    );


    return false;

  }


  /*
    Se abriu o sistema sem conseguir
    acessar a nuvem, tenta a última
    cópia salva neste dispositivo.
  */

  if (
    loadLocalCache()
  ) {

    renderAll();


    toast(
      "Conexão instável. Exibindo os últimos dados salvos."
    );


    return false;

  }


  toast(
    "Não foi possível carregar os dados do Supabase. Tente novamente em instantes."
  );


  return false;

}


/* ============================================================
   SALVAR CONFIGURAÇÕES
   ============================================================ */

async function saveSettings() {

  const payload = {

    user_id:
      state.user.id,

    manager_email:
      state.settings
        .managerEmail ||
      null,

    email_endpoint:
      state.settings
        .endpoint ||
      null,

    language:
      state.settings
        .language ||
      "pt-BR",

    updated_at:
      new Date()
        .toISOString()

  };


  const {
    error
  } =
    await sb
      .from("settings")
      .upsert(
        payload,
        {
          onConflict:
            "user_id"
        }
      );


  if (
    error
  ) {
    throw error;
  }

}


/* ============================================================
   PREENCHER SELECTS
   ============================================================ */

function populateSelects() {

  const type =
    $("#typeFilter");

  const insurer =
    $("#insurerFilter");

  const policyType =
    $("#policyType");

  const policyInsurer =
    $("#policyInsurer");

  const policyClient =
    $("#policyClient");


  if (
    !type ||
    !insurer ||
    !policyType ||
    !policyInsurer ||
    !policyClient
  ) {
    return;
  }


  policyType.innerHTML =
    TYPES
      .map(
        item =>
          `<option>${esc(item)}</option>`
      )
      .join("");


  policyInsurer.innerHTML =
    INSURERS
      .map(
        item =>
          `<option>${esc(item)}</option>`
      )
      .join("");


  type.innerHTML =
    `
      <option value="all">
        Todos os tipos
      </option>
    ` +
    TYPES
      .map(
        item =>
          `<option>${esc(item)}</option>`
      )
      .join("");


  insurer.innerHTML =
    `
      <option value="all">
        Todas as seguradoras
      </option>
    ` +
    INSURERS
      .map(
        item =>
          `<option>${esc(item)}</option>`
      )
      .join("");


  policyClient.innerHTML =
    `
      <option value="">
        Selecione...
      </option>
    ` +
    [...state.clients]
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      )
      .map(
        client =>
          `
            <option value="${client.id}">
              ${esc(client.name)}
            </option>
          `
      )
      .join("");

}


/* ============================================================
   RENDERIZAR SISTEMA
   ============================================================ */

function renderAll() {

  if (
    !state.user
  ) {
    return;
  }


  populateSelects();

  renderDashboard();

  renderClients();

  renderPolicies();

  renderKanban();

  renderConfig();

  checkAutomation();

}




/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboard() {

  const total =
    state.policies.length;


  const next7 =
    state.policies.filter(
      policy => {

        const days =
          daysUntil(
            policy.endDate
          );

        return (
          days >= 0 &&
          days <= 7
        );

      }
    ).length;


  const expired =
    state.policies.filter(
      policy =>
        daysUntil(
          policy.endDate
        ) < 0
    ).length;


  const won =
    state.policies.filter(
      policy =>
        policy.status ===
        "Ganho"
    ).length;


  const lost =
    state.policies.filter(
      policy =>
        policy.status ===
        "Perdido"
    ).length;


  if ($("#statTotal")) {
    $("#statTotal").textContent =
      total;
  }


  if ($("#stat7")) {
    $("#stat7").textContent =
      next7;
  }


  if ($("#statExpired")) {
    $("#statExpired").textContent =
      expired;
  }


  if ($("#statWon")) {
    $("#statWon").textContent =
      won;
  }


  /* ==========================================================
     PRÓXIMOS VENCIMENTOS
     ========================================================== */

  const upcoming =
    [...state.policies]
      .filter(
        policy =>
          daysUntil(
            policy.endDate
          ) <= 30
      )
      .sort(
        (a, b) =>
          new Date(a.endDate) -
          new Date(b.endDate)
      )
      .slice(
        0,
        8
      );


  const upcomingList =
    $("#upcomingList");


  if (upcomingList) {

    upcomingList.innerHTML =
      upcoming.length

        ? upcoming
            .map(
              policy => {

                const client =
                  clientById(
                    policy.clientId
                  );


                const expiry =
                  expiryLabel(
                    policy
                  );


                return `
                  <div class="upcoming-item">

                    <div>

                      <div class="name">
                        ${esc(
                          client?.name ||
                          "Cliente"
                        )}
                      </div>

                      <small>
                        ${esc(policy.type)}
                        ·
                        ${esc(policy.insurer)}
                      </small>

                    </div>


                    <div>

                      <small>
                        Vigência
                      </small>

                      <b>
                        ${fmtDate(
                          policy.startDate
                        )}
                        →
                        ${fmtDate(
                          policy.endDate
                        )}
                      </b>

                    </div>


                    <div>

                      <span
                        class="pill ${expiry.cls}"
                      >
                        ${esc(
                          expiry.text
                        )}
                      </span>

                    </div>


                    <div class="actions">

                      <button
                        class="action-btn"
                        onclick="openDetails('${policy.id}')"
                      >
                        Abrir
                      </button>

                    </div>

                  </div>
                `;

              }
            )
            .join("")

        : `
            <div class="empty">
              Nenhuma apólice vencendo
              nos próximos 30 dias.
            </div>
          `;

  }


  /* ==========================================================
     PROCESSOS
     AGORA COM PERDIDO
     ========================================================== */

  const counts = {

    Pendente:
      state.policies.filter(
        policy =>
          policy.status ===
          "Pendente"
      ).length,


    "Em andamento":
      state.policies.filter(
        policy =>
          policy.status ===
          "Em andamento"
      ).length,


    Ganho:
      won,


    Perdido:
      lost

  };


  const max =
    Math.max(
      total,
      1
    );


  const processSummary =
    $("#processSummary");


  if (processSummary) {

    processSummary.innerHTML =
      Object
        .entries(counts)
        .map(
          ([status, value]) => {

            let cssClass =
              "pendente";


            if (
              status ===
              "Em andamento"
            ) {
              cssClass =
                "andamento";
            }


            if (
              status ===
              "Ganho"
            ) {
              cssClass =
                "ganho";
            }


            if (
              status ===
              "Perdido"
            ) {
              cssClass =
                "perdido";
            }


            return `
              <div class="process-line">

                <div class="line-top">

                  <span>
                    ${esc(status)}
                  </span>

                  <b>
                    ${value}
                  </b>

                </div>


                <div
                  class="bar ${cssClass}"
                >

                  <i
                    style="
                      width:
                      ${
                        (
                          value /
                          max
                        ) *
                        100
                      }%
                    "
                  ></i>

                </div>

              </div>
            `;

          }
        )
        .join("");

  }


  /* ==========================================================
     SEGURADORAS
     ========================================================== */

  const insurerCounts =
    {};


  state.policies.forEach(
    policy => {

      insurerCounts[
        policy.insurer
      ] =
        (
          insurerCounts[
            policy.insurer
          ] ||
          0
        ) +
        1;

    }
  );


  const topInsurers =
    Object
      .entries(
        insurerCounts
      )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )
      .slice(
        0,
        10
      );


  const insurerSummary =
    $("#insurerSummary");


  if (insurerSummary) {

    insurerSummary.innerHTML =
      topInsurers.length

        ? topInsurers
            .map(
              ([name, amount]) => `
                <div class="insurer-chip">

                  <strong>
                    ${amount}
                  </strong>

                  <span>
                    ${esc(name)}
                  </span>

                </div>
              `
            )
            .join("")

        : `
            <div class="empty">
              Cadastre uma apólice
              para começar.
            </div>
          `;

  }

}


/* ============================================================
   FILTRO DE CLIENTE POR VIGÊNCIA
   ============================================================ */

function clientMatchesDateFilter(
  client,
  start,
  end
) {

  if (
    !start &&
    !end
  ) {
    return true;
  }


  const policies =
    state.policies.filter(
      policy =>
        policy.clientId ===
        client.id
    );


  return policies.some(
    policy =>
      inDateRange(
        policy,
        start,
        end
      )
  );

}


/* ============================================================
   CLIENTES
   ============================================================ */

function renderClients() {

  const search =
    (
      $("#clientSearch")
        ?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const filter =
    $("#clientFilter")
      ?.value ||
    "all";


  /*
    Esses dois campos serão adicionados
    no INDEX.HTML final.
  */

  const startDate =
    $("#clientStartDateFilter")
      ?.value ||
    "";


  const endDate =
    $("#clientEndDateFilter")
      ?.value ||
    "";


  const clients =
    state.clients
      .filter(
        client => {

          const policies =
            state.policies.filter(
              policy =>
                policy.clientId ===
                client.id
            );


          if (
            filter ===
              "withPolicies" &&
            !policies.length
          ) {
            return false;
          }


          if (
            filter ===
              "withoutPolicies" &&
            policies.length
          ) {
            return false;
          }


          if (
            !clientMatchesDateFilter(
              client,
              startDate,
              endDate
            )
          ) {
            return false;
          }


          const searchable =
            [
              client.name,
              client.document,
              client.phone,
              client.email
            ]
              .join(" ")
              .toLowerCase();


          return (
            !search ||
            searchable.includes(
              search
            )
          );

        }
      );


  const grid =
    $("#clientsGrid");


  if (!grid) {
    return;
  }


  grid.innerHTML =
    clients.length

      ? clients
          .map(
            client => {

              const policies =
                state.policies.filter(
                  policy =>
                    policy.clientId ===
                    client.id
                );


              return `
                <article class="client-card">

                  <div class="client-card-head">

                    <div class="client-cell">

                      <div class="avatar">
                        ${initials(
                          client.name
                        )}
                      </div>


                      <div>

                        <h4>
                          ${esc(
                            client.name
                          )}
                        </h4>

                        <small>
                          ${
                            client.birthDate
                              ? fmtDate(
                                  client.birthDate
                                )
                              : "Nascimento não informado"
                          }
                        </small>

                      </div>

                    </div>


                    <span class="policy-count">

                      ${policies.length}

                      apólice${
                        policies.length === 1
                          ? ""
                          : "s"
                      }

                    </span>

                  </div>


                  <div class="client-meta">

                    <span>
                      ☎
                      ${
                        esc(
                          formatPhone(
                            client.phone
                          ) ||
                          "Sem telefone"
                        )
                      }
                    </span>


                    <span>
                      ✉
                      ${
                        esc(
                          client.email ||
                          "Sem e-mail"
                        )
                      }
                    </span>


                    <span>
                      ▣
                      ${
                        esc(
                          client.document ||
                          "Documento não informado"
                        )
                      }
                    </span>

                  </div>


                  <div class="client-policies">

                    ${
                      policies
                        .slice(
                          0,
                          5
                        )
                        .map(
                          policy => `
                            <div class="mini-policy">

                              <span>
                                ${esc(
                                  policy.type
                                )}
                                ·
                                ${esc(
                                  policy.insurer
                                )}
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
                      policies.length > 5

                        ? `
                            <small>
                              +
                              ${
                                policies.length -
                                5
                              }
                              apólice(s)
                            </small>
                          `

                        : ""
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
                        background:#fff5f5
                      "
                      onclick="deleteClient('${client.id}')"
                    >
                      🗑 Excluir
                    </button>

                  </div>

                </article>
              `;

            }
          )
          .join("")

      : `
          <div class="empty">
            Nenhum cliente encontrado.
          </div>
        `;

}


/* ============================================================
   APÓLICES
   ============================================================ */

function renderPolicies() {

  const search =
    (
      $("#policySearch")
        ?.value ||
      ""
    )
      .toLowerCase()
      .trim();


  const statusFilter =
    $("#statusFilter")
      ?.value ||
    "all";


  const expiryFilter =
    $("#expiryFilter")
      ?.value ||
    "all";


  const typeFilter =
    $("#typeFilter")
      ?.value ||
    "all";


  const insurerFilter =
    $("#insurerFilter")
      ?.value ||
    "all";


  /*
    Novos filtros de vigência.
    Serão adicionados no INDEX.HTML.
  */

  const startDate =
    $("#policyStartDateFilter")
      ?.value ||
    "";


  const endDate =
    $("#policyEndDateFilter")
      ?.value ||
    "";


  const policies =
    [...state.policies]
      .filter(
        policy => {

          const client =
            clientById(
              policy.clientId
            );


          const searchable =
            [
              client?.name,
              policy.number,
              policy.insurer,
              policy.type,
              policy.feedback
            ]
              .join(" ")
              .toLowerCase();


          if (
            search &&
            !searchable.includes(
              search
            )
          ) {
            return false;
          }


          if (
            statusFilter !==
              "all" &&
            policy.status !==
              statusFilter
          ) {
            return false;
          }


          if (
            typeFilter !==
              "all" &&
            policy.type !==
              typeFilter
          ) {
            return false;
          }


          if (
            insurerFilter !==
              "all" &&
            policy.insurer !==
              insurerFilter
          ) {
            return false;
          }


          if (
            !inDateRange(
              policy,
              startDate,
              endDate
            )
          ) {
            return false;
          }


          const days =
            daysUntil(
              policy.endDate
            );


          if (
            expiryFilter ===
              "expired" &&
            days >= 0
          ) {
            return false;
          }


          if (
            expiryFilter !==
              "all" &&
            expiryFilter !==
              "expired" &&
            !(
              days >= 0 &&
              days <=
                Number(
                  expiryFilter
                )
            )
          ) {
            return false;
          }


          return true;

        }
      )
      .sort(
        (a, b) =>
          new Date(a.endDate) -
          new Date(b.endDate)
      );


  const table =
    $("#policiesTable");


  if (!table) {
    return;
  }


  table.innerHTML =
    policies.length

      ? policies
          .map(
            policy => {

              const client =
                clientById(
                  policy.clientId
                );


              const expiry =
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
                            client?.name ||
                            "Cliente"
                          )}
                        </strong>

                        <small>
                          ${
                            esc(
                              formatPhone(
                                client?.phone
                              ) ||
                              ""
                            )
                          }
                        </small>

                      </div>

                    </div>

                  </td>


                  <td>

                    <b>
                      ${esc(
                        policy.type
                      )}
                    </b>

                    <small
                      style="
                        display:block;
                        color:#667085
                      "
                    >
                      ${esc(
                        policy.number
                      )}
                    </small>

                  </td>


                  <td>
                    ${esc(
                      policy.insurer
                    )}
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
                      class="pill ${processClass(
                        policy.status
                      )}"
                    >
                      ${esc(
                        policy.status
                      )}
                    </span>

                  </td>


                  <td>

                    <span
                      class="pill ${expiry.cls}"
                    >
                      ${esc(
                        expiry.text
                      )}
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
                      >
                        ↻
                      </button>


                      ${
                        policy.pdfPath

                          ? `
                              <button
                                class="action-btn"
                                onclick="openPdf('${policy.id}')"
                              >
                                PDF
                              </button>
                            `

                          : ""
                      }

                    </div>

                  </td>

                </tr>
              `;

            }
          )
          .join("")

      : `
          <tr>

            <td colspan="7">

              <div class="empty">
                Nenhuma apólice encontrada.
              </div>

            </td>

          </tr>
        `;

}


/* ============================================================
   RENOVAÇÕES — FILTRO DE DATA
   ============================================================ */

function renewalMatchesDateFilter(
  policy
) {

  const start =
    $("#renewalStartDateFilter")
      ?.value ||
    "";


  const end =
    $("#renewalEndDateFilter")
      ?.value ||
    "";


  return inDateRange(
    policy,
    start,
    end
  );

}


/* ============================================================
   SALVAR FEEDBACK COMERCIAL
   ============================================================ */

async function savePolicyFeedback(
  policyId
) {

  const policy =
    policyById(
      policyId
    );


  if (!policy) {

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const textarea =
    document.querySelector(
      `[data-feedback-id="${policyId}"]`
    );


  if (!textarea) {
    return;
  }


  const feedback =
    textarea.value
      .trim();


  const updatedAt =
    new Date()
      .toISOString();


  try {

    const {
      data,
      error
    } =
      await sb
        .from("policies")
        .update({

          feedback:
            feedback ||
            null,

          feedback_updated_at:
            feedback
              ? updatedAt
              : null,

          updated_at:
            updatedAt

        })
        .eq(
          "id",
          policyId
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    const saved =
      policyFromDb(
        data
      );


    const index =
      state.policies.findIndex(
        item =>
          item.id ===
          policyId
      );


    if (
      index >= 0
    ) {

      state.policies[index] =
        saved;

    }


    saveLocalCache();


    await addEvent(
      policyId,
      "feedback",
      feedback
        ? "Feedback comercial atualizado."
        : "Feedback comercial removido."
    );


    renderKanban();

    renderDashboard();


    toast(
      "Feedback salvo com sucesso."
    );


  } catch (error) {

    console.error(
      "Erro ao salvar feedback:",
      error
    );


    toast(
      "Não foi possível salvar o feedback."
    );

  }

}


/* ============================================================
   ALTERAR STATUS
   ============================================================ */

async function changeStatus(
  policyId,
  newStatus
) {

  const allowedStatuses = [
    "Pendente",
    "Em andamento",
    "Ganho",
    "Perdido"
  ];


  if (
    !allowedStatuses.includes(
      newStatus
    )
  ) {

    toast(
      "Status inválido."
    );

    return;

  }


  const policy =
    policyById(
      policyId
    );


  if (!policy) {

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const oldStatus =
    policy.status;


  if (
    oldStatus ===
    newStatus
  ) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await sb
        .from("policies")
        .update({

          status:
            newStatus,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          policyId
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    const saved =
      policyFromDb(
        data
      );


    const index =
      state.policies.findIndex(
        item =>
          item.id ===
          policyId
      );


    if (
      index >= 0
    ) {

      state.policies[index] =
        saved;

    }


    saveLocalCache();


    await addEvent(
      policyId,
      "status",
      `Status alterado de "${oldStatus}" para "${newStatus}".`
    );


    renderAll();


    toast(
      `Status alterado para ${newStatus}.`
    );


  } catch (error) {

    console.error(
      "Erro ao alterar status:",
      error
    );


    toast(
      "Não foi possível alterar o status."
    );

  }

}


/* ============================================================
   KANBAN
   PENDENTE / EM ANDAMENTO / GANHO / PERDIDO
   ============================================================ */

function renderKanban() {

  const kanban =
    $("#kanban");


  if (!kanban) {
    return;
  }


  const columns = [
    "Pendente",
    "Em andamento",
    "Ganho",
    "Perdido"
  ];


  kanban.innerHTML =
    columns
      .map(
        status => {

          const policies =
            state.policies
              .filter(
                policy =>
                  policy.status ===
                    status &&
                  renewalMatchesDateFilter(
                    policy
                  )
              )
              .sort(
                (a, b) =>
                  new Date(a.endDate) -
                  new Date(b.endDate)
              );


          let columnClass =
            "pendente";


          if (
            status ===
            "Em andamento"
          ) {
            columnClass =
              "andamento";
          }


          if (
            status ===
            "Ganho"
          ) {
            columnClass =
              "ganho";
          }


          if (
            status ===
            "Perdido"
          ) {
            columnClass =
              "perdido";
          }


          return `
            <div
              class="kanban-col ${columnClass}"
            >

              <h4>

                <span>
                  ${esc(status)}
                </span>

                <span>
                  ${policies.length}
                </span>

              </h4>


              ${
                policies.length

                  ? policies
                      .map(
                        policy => {

                          const client =
                            clientById(
                              policy.clientId
                            );


                          const expiry =
                            expiryLabel(
                              policy
                            );


                          return `
                            <div
                              class="kanban-card"
                              data-policy-id="${policy.id}"
                            >

                              <strong>
                                ${esc(
                                  client?.name ||
                                  "Cliente"
                                )}
                              </strong>


                              <small>

                                ${esc(
                                  policy.type
                                )}

                                ·

                                ${esc(
                                  policy.insurer
                                )}

                                <br>

                                ${fmtDate(
                                  policy.startDate
                                )}

                                →

                                ${fmtDate(
                                  policy.endDate
                                )}

                              </small>


                              <div
                                style="
                                  margin-top:8px;
                                  margin-bottom:8px
                                "
                              >

                                <span
                                  class="pill ${expiry.cls}"
                                >
                                  ${esc(
                                    expiry.text
                                  )}
                                </span>

                              </div>


                              <select
                                onchange="changeStatus('${policy.id}', this.value)"
                              >

                                <option
                                  value="Pendente"
                                  ${
                                    policy.status ===
                                    "Pendente"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Pendente
                                </option>


                                <option
                                  value="Em andamento"
                                  ${
                                    policy.status ===
                                    "Em andamento"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Em andamento
                                </option>


                                <option
                                  value="Ganho"
                                  ${
                                    policy.status ===
                                    "Ganho"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Ganho
                                </option>


                                <option
                                  value="Perdido"
                                  ${
                                    policy.status ===
                                    "Perdido"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Perdido
                                </option>

                              </select>


                              <div
                                class="kanban-feedback"
                              >

                                <label>
                                  Feedback comercial
                                </label>


                                <textarea
                                  rows="4"
                                  data-feedback-id="${policy.id}"
                                  placeholder="Ex: Em cotação, aguardando retorno do cliente."
                                >${esc(
                                  policy.feedback ||
                                  ""
                                )}</textarea>


                                <button
                                  type="button"
                                  class="action-btn"
                                  onclick="savePolicyFeedback('${policy.id}')"
                                >
                                  Salvar feedback
                                </button>

                              </div>


                              <div
                                class="actions"
                                style="margin-top:10px"
                              >

                                <button
                                  class="action-btn"
                                  onclick="openDetails('${policy.id}')"
                                >
                                  Ver detalhes
                                </button>


                                <button
                                  class="action-btn"
                                  onclick="editPolicy('${policy.id}')"
                                >
                                  Editar
                                </button>

                              </div>

                            </div>
                          `;

                        }
                      )
                      .join("")

                  : `
                      <div class="empty">
                        Nenhuma apólice.
                      </div>
                    `
              }

            </div>
          `;

        }
      )
      .join("");

}


/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */

function renderConfig() {

  const user =
    $("#cfgUser");


  const endpoint =
    $("#emailEndpoint");


  const manager =
    $("#managerEmail");


  if (user) {

    user.value =
      state.user?.email ||
      "";

  }


  if (endpoint) {

    endpoint.value =
      state.settings.endpoint ||
      "";

  }


  if (manager) {

    manager.value =
      state.settings.managerEmail ||
      "";

  }

}


/* ============================================================
   NAVEGAÇÃO
   ============================================================ */

function go(view) {

  $$(".view")
    .forEach(
      element =>
        element.classList.remove(
          "active"
        )
    );


  const target =
    $("#" + view);


  if (target) {

    target.classList.add(
      "active"
    );

  }


  $$(".nav-item")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.view ===
            view
        );

      }
    );


  const titles = {

    dashboard:
      "Dashboard",

    clientes:
      "Clientes",

    apolices:
      "Apólices",

    renovacoes:
      "Renovações",

    relatorios:
      "Relatórios",

    config:
      "Configurações"

  };


  const pageTitle =
    $("#pageTitle");


  if (pageTitle) {

    pageTitle.textContent =
      titles[view] ||
      "Dashboard";

  }


  if (
    view ===
    "dashboard"
  ) {

    renderDashboard();

  }


  if (
    view ===
    "clientes"
  ) {

    renderClients();

  }


  if (
    view ===
    "apolices"
  ) {

    renderPolicies();

  }


  if (
    view ===
    "renovacoes"
  ) {

    renderKanban();

  }


  if (
    view ===
    "config"
  ) {

    renderConfig();

  }

}


/* ============================================================
   MODAIS
   ============================================================ */

function openModal(id) {

  const modal =
    $("#" + id);


  if (!modal) {

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


function closeModal(id) {

  const modal =
    $("#" + id);


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "open"
  );


  if (
    id ===
    "pdfModal"
  ) {

    const frame =
      $("#pdfFrame");


    if (frame) {

      frame.src =
        "";

    }

  }

}


/* ============================================================
   NOVO CLIENTE
   ============================================================ */

function newClient() {

  const form =
    $("#clientForm");


  if (form) {

    form.reset();

  }


  $("#clientId").value =
    "";


  /*
    Documento já começa limpo.
  */

  if (
    $("#clientDoc")
  ) {

    $("#clientDoc").value =
      "";

  }


  $("#clientModalTitle").textContent =
    "Novo cliente";


  openModal(
    "clientModal"
  );

}


/* ============================================================
   EDITAR CLIENTE
   ============================================================ */

function openClient(id) {

  const client =
    clientById(id);


  if (!client) {
    return;
  }


  $("#clientId").value =
    client.id;


  $("#clientName").value =
    client.name;


  /*
    Nascimento pode estar vazio.
  */

  $("#clientBirth").value =
    client.birthDate ||
    "";


  $("#clientPhone").value =
    formatPhone(
      client.phone
    );


  $("#clientDoc").value =
    formatDocument(
      client.document ||
      ""
    );


  $("#clientEmail").value =
    client.email ||
    "";


  $("#clientNotes").value =
    client.notes ||
    "";


  $("#clientModalTitle").textContent =
    "Editar cliente";


  openModal(
    "clientModal"
  );

}


/* ============================================================
   SALVAR CLIENTE

   IMPORTANTE:
   DATA DE NASCIMENTO NÃO É MAIS OBRIGATÓRIA.
   ============================================================ */

async function saveClient(event) {

  event.preventDefault();


  const name =
    $("#clientName")
      .value
      .trim();


  const phone =
    cleanPhone(
      $("#clientPhone").value
    );


  const document =
    formatDocument(
      $("#clientDoc")
        .value
        .trim()
    );


  const email =
    $("#clientEmail")
      .value
      .trim();


  const birthDate =
    $("#clientBirth")
      .value ||
    "";


  const notes =
    $("#clientNotes")
      .value
      .trim();


  if (!name) {

    toast(
      "Informe o nome do cliente."
    );

    return;

  }


  /*
    Telefone continua obrigatório.
  */

  if (
    !validBrazilPhone(
      phone
    )
  ) {

    toast(
      "Informe um telefone celular válido com DDD."
    );

    return;

  }


  const id =
    $("#clientId").value ||
    uid();


  const old =
    clientById(id);


  const client = {

    id,

    name,

    birthDate,

    phone,

    document,

    email,

    notes,

    createdAt:
      old?.createdAt ||
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString()

  };


  try {

    const {
      data,
      error
    } =
      await sb
        .from("clients")
        .upsert(
          clientToDb(
            client
          )
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    const saved =
      clientFromDb(
        data
      );


    const index =
      state.clients.findIndex(
        item =>
          item.id ===
          saved.id
      );


    if (
      index >= 0
    ) {

      state.clients[index] =
        saved;

    } else {

      state.clients.push(
        saved
      );

    }


    saveLocalCache();


    closeModal(
      "clientModal"
    );


    renderAll();


    toast(
      "Cliente salvo na nuvem."
    );


  } catch (error) {

    console.error(
      "Erro ao salvar cliente:",
      error
    );


    toast(
      "Não foi possível salvar o cliente."
    );

  }

}


/* ============================================================
   FORMATAÇÃO AUTOMÁTICA DE CPF/CNPJ
   ============================================================ */

function handleDocumentInput(
  event
) {

  event.target.value =
    formatDocument(
      event.target.value
    );

}





/* ============================================================
   RESETAR FORMULÁRIO DE APÓLICE
   ============================================================ */

function resetPolicyForm(clientId = "") {

  const form =
    $("#policyForm");


  if (form) {
    form.reset();
  }


  if ($("#policyId")) {
    $("#policyId").value = "";
  }


  if ($("#policyParentId")) {
    $("#policyParentId").value = "";
  }


  if ($("#policyRenewedFrom")) {
    $("#policyRenewedFrom").value = "";
  }


  if ($("#currentPdfName")) {
    $("#currentPdfName").textContent = "";
  }


  if ($("#renewInfo")) {
    $("#renewInfo").classList.add(
      "hidden"
    );
  }


  populateSelects();


  if ($("#policyClient")) {
    $("#policyClient").value =
      clientId || "";
  }


  if ($("#policyStatus")) {
    $("#policyStatus").value =
      "Pendente";
  }


  /*
    Campo novo de feedback.
    Será colocado no index.html.
  */

  if ($("#policyFeedback")) {
    $("#policyFeedback").value = "";
  }


  if ($("#policyModalTitle")) {
    $("#policyModalTitle").textContent =
      "Nova apólice";
  }

}


/* ============================================================
   NOVA APÓLICE
   ============================================================ */

function newPolicyFor(clientId = "") {

  resetPolicyForm(
    clientId
  );


  openModal(
    "policyModal"
  );

}


/* ============================================================
   EDITAR APÓLICE
   ============================================================ */

async function editPolicy(id) {

  const policy =
    policyById(id);


  if (!policy) {

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  resetPolicyForm(
    policy.clientId
  );


  $("#policyId").value =
    policy.id;


  $("#policyInsurer").value =
    policy.insurer;


  $("#policyType").value =
    policy.type;


  $("#policyNumber").value =
    policy.number || "";


  $("#policyStart").value =
    policy.startDate || "";


  $("#policyEnd").value =
    policy.endDate || "";


  $("#policyStatus").value =
    policy.status || "Pendente";


  $("#policyNotes").value =
    policy.notes || "";


  /*
    NOVO:
    Feedback comercial.
  */

  if ($("#policyFeedback")) {

    $("#policyFeedback").value =
      policy.feedback || "";

  }


  if ($("#alert30")) {
    $("#alert30").checked =
      policy.alerts?.[30] !== false;
  }


  if ($("#alert15")) {
    $("#alert15").checked =
      policy.alerts?.[15] !== false;
  }


  if ($("#alert7")) {
    $("#alert7").checked =
      policy.alerts?.[7] !== false;
  }


  if ($("#alert1")) {
    $("#alert1").checked =
      policy.alerts?.[1] !== false;
  }


  if ($("#alertExpired")) {
    $("#alertExpired").checked =
      policy.alerts?.expired !== false;
  }


  if (
    policy.pdfPath &&
    $("#currentPdfName")
  ) {

    $("#currentPdfName").textContent =
      "PDF atual: " +
      decodeURIComponent(
        policy.pdfPath
          .split("/")
          .pop()
      );

  }


  $("#policyModalTitle").textContent =
    "Editar apólice";


  openModal(
    "policyModal"
  );

}


/* ============================================================
   NOME SEGURO PARA ARQUIVO
   ============================================================ */

function safeFileName(name) {

  return String(
    name || "arquivo"
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    );

}


/* ============================================================
   UPLOAD DO PDF DA APÓLICE
   ============================================================ */

async function uploadPolicyPdf(
  policyId,
  file
) {

  if (!file) {
    return null;
  }


  if (
    file.type !==
    "application/pdf"
  ) {

    throw new Error(
      "O anexo precisa ser PDF."
    );

  }


  const path =
    `${state.user.id}/${policyId}/${Date.now()}-${safeFileName(file.name)}`;


  const {
    error
  } =
    await sb
      .storage
      .from(
        "policy-pdfs"
      )
      .upload(
        path,
        file,
        {

          cacheControl:
            "3600",

          contentType:
            "application/pdf",

          upsert:
            false

        }
      );


  if (error) {
    throw error;
  }


  return path;

}


/* ============================================================
   SALVAR APÓLICE
   ============================================================ */

async function savePolicy(event) {

  event.preventDefault();


  const clientId =
    $("#policyClient")
      .value;


  if (!clientId) {

    toast(
      "Selecione o cliente."
    );

    return null;

  }


  const startDate =
    $("#policyStart")
      .value;


  const endDate =
    $("#policyEnd")
      .value;


  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {

    toast(
      "O fim da vigência não pode ser anterior ao início."
    );

    return null;

  }


  const oldId =
    $("#policyId")
      .value;


  const existing =
    oldId
      ? policyById(
          oldId
        )
      : null;


  const id =
    oldId ||
    uid();


  const pdfInput =
    $("#policyPdf");


  const file =
    pdfInput
      ?.files?.[0] ||
    null;


  let pdfPath =
    existing?.pdfPath ||
    null;


  let newPdfPath =
    null;


  /*
    Feedback comercial separado
    das observações normais.
  */

  const feedback =
    $("#policyFeedback")
      ?.value
      ?.trim() ||
    "";


  try {

    /* ========================================================
       UPLOAD DO NOVO PDF, SE HOUVER
       ======================================================== */

    if (file) {

      newPdfPath =
        await uploadPolicyPdf(
          id,
          file
        );


      pdfPath =
        newPdfPath;

    }


    /* ========================================================
       OBJETO DA APÓLICE
       ======================================================== */

    const policy = {

      id,

      clientId,

      insurer:
        $("#policyInsurer")
          .value,

      type:
        $("#policyType")
          .value,

      number:
        $("#policyNumber")
          .value
          .trim(),

      startDate,

      endDate,

      status:
        $("#policyStatus")
          .value ||
        "Pendente",

      notes:
        $("#policyNotes")
          .value
          .trim(),

      feedback,

      feedbackUpdatedAt:
        feedback
          ? new Date()
              .toISOString()
          : null,

      alerts: {

        30:
          $("#alert30")
            ?.checked !== false,

        15:
          $("#alert15")
            ?.checked !== false,

        7:
          $("#alert7")
            ?.checked !== false,

        1:
          $("#alert1")
            ?.checked !== false,

        expired:
          $("#alertExpired")
            ?.checked !== false

      },

      pdfPath,

      renewedFrom:
        $("#policyRenewedFrom")
          ?.value ||
        existing?.renewedFrom ||
        null,

      createdAt:
        existing?.createdAt ||
        new Date()
          .toISOString(),

      updatedAt:
        new Date()
          .toISOString()

    };


    /* ========================================================
       SALVAR NO SUPABASE
       ======================================================== */

    const {
      data,
      error
    } =
      await sb
        .from(
          "policies"
        )
        .upsert(
          policyToDb(
            policy
          )
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    /*
      Se colocou PDF novo e existia
      PDF antigo, remove o antigo.
    */

    if (
      newPdfPath &&
      existing?.pdfPath &&
      existing.pdfPath !==
        newPdfPath
    ) {

      const {
        error: removeError
      } =
        await sb
          .storage
          .from(
            "policy-pdfs"
          )
          .remove([
            existing.pdfPath
          ]);


      if (removeError) {

        console.warn(
          "Não foi possível remover o PDF antigo:",
          removeError
        );

      }

    }


    const saved =
      policyFromDb(
        data
      );


    const index =
      state.policies.findIndex(
        item =>
          item.id ===
          saved.id
      );


    if (
      index >= 0
    ) {

      state.policies[index] =
        saved;

    } else {

      state.policies.push(
        saved
      );

    }


    /* ========================================================
       HISTÓRICO
       ======================================================== */

    try {

      await addEvent(

        saved.id,

        existing
          ? "update"
          : "create",

        existing
          ? "Apólice atualizada."
          : "Apólice cadastrada."

      );

    } catch (eventError) {

      console.warn(
        "Apólice salva, mas não foi possível registrar histórico:",
        eventError
      );

    }


    saveLocalCache();


    closeModal(
      "policyModal"
    );


    renderAll();


    toast(
      existing
        ? "Apólice atualizada com sucesso."
        : "Apólice cadastrada com sucesso."
    );


    return saved;


  } catch (error) {

    console.error(
      "Erro ao salvar apólice:",
      error
    );


    /*
      Se o PDF novo subiu,
      mas a apólice falhou,
      tenta remover o arquivo órfão.
    */

    if (newPdfPath) {

      try {

        await sb
          .storage
          .from(
            "policy-pdfs"
          )
          .remove([
            newPdfPath
          ]);

      } catch (
        cleanupError
      ) {

        console.warn(
          cleanupError
        );

      }

    }


    toast(
      "Não foi possível salvar a apólice."
    );


    return null;

  }

}


/* ============================================================
   ABRIR PDF
   ============================================================ */

async function openPdf(id) {

  const policy =
    policyById(id);


  if (
    !policy ||
    !policy.pdfPath
  ) {

    toast(
      "Esta apólice não possui PDF."
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await sb
        .storage
        .from(
          "policy-pdfs"
        )
        .createSignedUrl(
          policy.pdfPath,
          60 * 10
        );


    if (error) {
      throw error;
    }


    const frame =
      $("#pdfFrame");


    if (!frame) {

      window.open(
        data.signedUrl,
        "_blank"
      );

      return;

    }


    frame.src =
      data.signedUrl;


    openModal(
      "pdfModal"
    );


  } catch (error) {

    console.error(
      "Erro ao abrir PDF:",
      error
    );


    toast(
      "Não foi possível abrir o PDF."
    );

  }

}


/* ============================================================
   DETALHES DA APÓLICE
   ============================================================ */

function openDetails(id) {

  const policy =
    policyById(id);


  if (!policy) {

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const client =
    clientById(
      policy.clientId
    );


  const expiry =
    expiryLabel(
      policy
    );


  const body =
    $("#detailsBody");


  if (!body) {
    return;
  }


  body.innerHTML = `

    <div class="detail-grid">

      <div class="detail-item">

        <small>
          Cliente
        </small>

        <strong>
          ${esc(
            client?.name ||
            "Cliente"
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          Telefone
        </small>

        <strong>
          ${esc(
            formatPhone(
              client?.phone
            ) ||
            "Não informado"
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          CPF/CNPJ
        </small>

        <strong>
          ${esc(
            formatDocument(
              client?.document ||
              ""
            ) ||
            "Não informado"
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          E-mail
        </small>

        <strong>
          ${esc(
            client?.email ||
            "Não informado"
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          Seguro
        </small>

        <strong>
          ${esc(
            policy.type
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          Seguradora
        </small>

        <strong>
          ${esc(
            policy.insurer
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          Número da apólice
        </small>

        <strong>
          ${esc(
            policy.number ||
            "Não informado"
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          Início da vigência
        </small>

        <strong>
          ${fmtDate(
            policy.startDate
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          Fim da vigência
        </small>

        <strong>
          ${fmtDate(
            policy.endDate
          )}
        </strong>

      </div>


      <div class="detail-item">

        <small>
          Vencimento
        </small>

        <strong>
          <span
            class="pill ${expiry.cls}"
          >
            ${esc(
              expiry.text
            )}
          </span>
        </strong>

      </div>


      <div class="detail-item">

        <small>
          Processo
        </small>

        <strong>
          <span
            class="pill ${processClass(
              policy.status
            )}"
          >
            ${esc(
              policy.status
            )}
          </span>
        </strong>

      </div>

    </div>


    <div
      class="detail-section"
      style="margin-top:18px"
    >

      <h4>
        Feedback comercial
      </h4>

      <p
        style="
          white-space:pre-wrap;
        "
      >
        ${esc(
          policy.feedback ||
          "Sem feedback informado."
        )}
      </p>

    </div>


    <div
      class="detail-section"
      style="margin-top:18px"
    >

      <h4>
        Observações
      </h4>

      <p
        style="
          white-space:pre-wrap;
        "
      >
        ${esc(
          policy.notes ||
          "Sem observações."
        )}
      </p>

    </div>


    <div
      class="actions"
      style="
        margin-top:20px;
        flex-wrap:wrap;
      "
    >

      <button
        class="action-btn"
        onclick="
          closeModal('detailsModal');
          editPolicy('${policy.id}');
        "
      >
        Editar
      </button>


      <button
        class="action-btn"
        onclick="
          changeStatus(
            '${policy.id}',
            'Pendente'
          )
        "
      >
        Pendente
      </button>


      <button
        class="action-btn"
        onclick="
          changeStatus(
            '${policy.id}',
            'Em andamento'
          )
        "
      >
        Em andamento
      </button>


      <button
        class="action-btn"
        onclick="
          changeStatus(
            '${policy.id}',
            'Ganho'
          )
        "
      >
        Ganho
      </button>


      <button
        class="action-btn"
        onclick="
          changeStatus(
            '${policy.id}',
            'Perdido'
          )
        "
      >
        Perdido
      </button>


      <button
        class="action-btn"
        onclick="
          manualWhatsApp(
            '${policy.id}'
          )
        "
      >
        WhatsApp
      </button>


      <button
        class="action-btn"
        onclick="
          sendEmail(
            '${policy.id}'
          )
        "
      >
        E-mail
      </button>


      ${
        policy.pdfPath

          ? `
              <button
                class="action-btn"
                onclick="
                  openPdf(
                    '${policy.id}'
                  )
                "
              >
                Abrir PDF
              </button>
            `

          : ""
      }


      <button
        class="action-btn"
        onclick="
          closeModal('detailsModal');
          renewPolicy('${policy.id}');
        "
      >
        Renovar
      </button>


      <button
        class="action-btn"
        style="
          color:#b42318;
          border-color:#fecdca;
          background:#fff5f5;
        "
        onclick="
          deletePolicy(
            '${policy.id}'
          )
        "
      >
        Excluir
      </button>

    </div>

  `;


  openModal(
    "detailsModal"
  );

}


/* ============================================================
   RENOVAR APÓLICE
   ============================================================ */

function renewPolicy(id) {

  const oldPolicy =
    policyById(id);


  if (!oldPolicy) {

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  resetPolicyForm(
    oldPolicy.clientId
  );


  if ($("#policyRenewedFrom")) {

    $("#policyRenewedFrom").value =
      oldPolicy.id;

  }


  if ($("#policyInsurer")) {

    $("#policyInsurer").value =
      oldPolicy.insurer;

  }


  if ($("#policyType")) {

    $("#policyType").value =
      oldPolicy.type;

  }


  /*
    Número fica vazio porque
    a nova renovação pode gerar
    uma nova apólice.
  */

  if ($("#policyNumber")) {

    $("#policyNumber").value =
      "";

  }


  /*
    Feedback da apólice antiga
    não é copiado automaticamente.
    A renovação começa com feedback novo.
  */

  if ($("#policyFeedback")) {

    $("#policyFeedback").value =
      "";

  }


  if ($("#renewInfo")) {

    $("#renewInfo").classList.remove(
      "hidden"
    );


    $("#renewInfo").innerHTML = `
      Renovando a apólice
      <strong>
        ${esc(
          oldPolicy.number ||
          oldPolicy.type
        )}
      </strong>
      com vencimento em
      <strong>
        ${fmtDate(
          oldPolicy.endDate
        )}
      </strong>.
    `;

  }


  if ($("#policyModalTitle")) {

    $("#policyModalTitle").textContent =
      "Renovar apólice";

  }


  openModal(
    "policyModal"
  );

}


/* ============================================================
   FINALIZAR RENOVAÇÃO
   ============================================================ */

async function finalizeRenewal(
  oldPolicyId
) {

  const oldPolicy =
    policyById(
      oldPolicyId
    );


  if (!oldPolicy) {
    return;
  }


  /*
    Ao gerar a nova apólice,
    a anterior fica como GANHO.
  */

  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "policies"
        )
        .update({

          status:
            "Ganho",

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          oldPolicyId
        )
        .select()
        .single();


    if (error) {
      throw error;
    }


    const updated =
      policyFromDb(
        data
      );


    const index =
      state.policies.findIndex(
        item =>
          item.id ===
          oldPolicyId
      );


    if (
      index >= 0
    ) {

      state.policies[index] =
        updated;

    }


    try {

      await addEvent(

        oldPolicyId,

        "renewal",

        "Renovação concluída e nova apólice cadastrada."

      );

    } catch (
      eventError
    ) {

      console.warn(
        eventError
      );

    }


    saveLocalCache();


  } catch (error) {

    console.error(
      "Erro ao finalizar renovação:",
      error
    );

  }

}


/* ============================================================
   CONFIRMAÇÃO PROFISSIONAL DE EXCLUSÃO
   ============================================================ */

function deleteConfirm(
  title,
  message
) {

  return Promise.resolve(
    window.confirm(
      `${title}\n\n${message}`
    )
  );

}


function deleteAlert(
  title,
  message
) {

  window.alert(
    `${title}\n\n${message}`
  );


  return Promise.resolve();

}


/* ============================================================
   EXCLUIR APÓLICE
   ============================================================ */

async function deletePolicy(id) {

  const policy =
    policyById(id);


  if (!policy) {

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const client =
    clientById(
      policy.clientId
    );


  const confirmed =
    await deleteConfirm(

      "Excluir apólice?",

      `Você está prestes a excluir a apólice de ${client?.name || "Cliente"}.\n\nEssa ação não poderá ser desfeita.`

    );


  if (!confirmed) {
    return;
  }


  try {

    /*
      Remove PDF primeiro,
      caso exista.
    */

    if (
      policy.pdfPath
    ) {

      const {
        error: pdfError
      } =
        await sb
          .storage
          .from(
            "policy-pdfs"
          )
          .remove([
            policy.pdfPath
          ]);


      if (pdfError) {

        console.warn(
          "Não foi possível remover o PDF:",
          pdfError
        );

      }

    }


    const {
      error
    } =
      await sb
        .from(
          "policies"
        )
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {
      throw error;
    }


    state.policies =
      state.policies.filter(
        item =>
          item.id !== id
      );


    state.events =
      state.events.filter(
        item =>
          item.policyId !== id
      );


    saveLocalCache();


    closeModal(
      "detailsModal"
    );


    renderAll();


    toast(
      "Apólice excluída com sucesso."
    );


  } catch (error) {

    console.error(
      "Erro ao excluir apólice:",
      error
    );


    toast(
      "Não foi possível excluir a apólice."
    );

  }

}


/* ============================================================
   EXCLUIR CLIENTE
   ============================================================ */

async function deleteClient(id) {

  const client =
    clientById(id);


  if (!client) {

    toast(
      "Cliente não encontrado."
    );

    return;

  }


  const policies =
    state.policies.filter(
      policy =>
        policy.clientId === id
    );


  if (
    policies.length > 0
  ) {

    await deleteAlert(

      "Não foi possível excluir",

      `${client.name} possui ${policies.length} apólice${policies.length === 1 ? "" : "s"} cadastrada${policies.length === 1 ? "" : "s"}.\n\nPara excluir este cliente, remova primeiro todas as apólices vinculadas a ele.`

    );


    return;

  }


  const confirmed =
    await deleteConfirm(

      "Excluir cliente?",

      `Você está prestes a excluir o cliente ${client.name}.\n\nEssa ação não poderá ser desfeita.`

    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await sb
        .from(
          "clients"
        )
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {
      throw error;
    }


    state.clients =
      state.clients.filter(
        item =>
          item.id !== id
      );


    saveLocalCache();


    closeModal(
      "clientModal"
    );


    renderAll();


    toast(
      "Cliente excluído com sucesso."
    );


  } catch (error) {

    console.error(
      "Erro ao excluir cliente:",
      error
    );


    toast(
      "Não foi possível excluir o cliente."
    );

  }

}


/* ============================================================
   WHATSAPP MANUAL
   ============================================================ */

function manualWhatsApp(id) {

  const policy =
    policyById(id);


  const client =
    clientById(
      policy?.clientId
    );


  if (
    !policy ||
    !client
  ) {
    return;
  }


  const days =
    daysUntil(
      policy.endDate
    );


  const deadline =
    days < 0

      ? `venceu há ${Math.abs(days)} dia(s)`

      : days === 0

        ? "vence hoje"

        : `vence em ${days} dia(s)`;


  const message =
    `Olá, ${client.name}! ` +
    `Aqui é da SAVA Seguros. ` +
    `Estamos entrando em contato sobre sua apólice ` +
    `${policy.number || ""}, ` +
    `do seguro ${policy.type}, ` +
    `que ${deadline} (${fmtDate(policy.endDate)}). ` +
    `Podemos conversar sobre a renovação?`;


  const phone =
    cleanPhone(
      client.phone
    );


  window.open(

    "https://wa.me/55" +
      phone +
      "?text=" +
      encodeURIComponent(
        message
      ),

    "_blank"

  );

}


/* ============================================================
   CORPO DO E-MAIL DO GESTOR
   ============================================================ */

function managerEmailBody(policy) {

  const client =
    clientById(
      policy.clientId
    );


  const days =
    daysUntil(
      policy.endDate
    );


  const deadline =
    days < 0

      ? `Vencida há ${Math.abs(days)} dia(s)`

      : days === 0

        ? "Vence hoje"

        : `Faltam ${days} dia(s)`;


  return (

    `RENOVAÇÃO DE SEGURO — SAVA SEGUROS\n\n` +

    `Cliente: ${client?.name || "Cliente"}\n` +

    `Telefone: ${formatPhone(client?.phone) || "Não informado"}\n` +

    `E-mail do cliente: ${client?.email || "Não informado"}\n` +

    `Seguradora: ${policy.insurer}\n` +

    `Seguro: ${policy.type}\n` +

    `Apólice: ${policy.number || "Sem número"}\n` +

    `Início: ${fmtDate(policy.startDate)}\n` +

    `Vencimento: ${fmtDate(policy.endDate)}\n` +

    `Prazo: ${deadline}\n` +

    `Status: ${policy.status}\n` +

    `Feedback: ${policy.feedback || "Sem feedback informado."}\n\n` +

    `Esta apólice requer acompanhamento de renovação.`

  );

}


/* ============================================================
   ENVIAR E-MAIL
   MANTÉM A AUTOMAÇÃO QUE JÁ FUNCIONAVA
   ============================================================ */

async function sendEmail(id) {

  const policy =
    policyById(id);


  if (!policy) {

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const to =
    state.settings
      .managerEmail;


  if (!to) {

    toast(
      "Configure o e-mail do gestor em Configurações."
    );

    return;

  }


  /*
    Se não tiver endpoint,
    abre o programa de e-mail.
  */

  if (
    !state.settings.endpoint
  ) {

    window.location.href =

      `mailto:${encodeURIComponent(to)}` +

      `?subject=${encodeURIComponent(
        "Renovação próxima - SAVA Seguros"
      )}` +

      `&body=${encodeURIComponent(
        managerEmailBody(
          policy
        )
      )}`;


    return;

  }


  try {

    const response =
      await fetch(

        state.settings.endpoint,

        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "text/plain;charset=utf-8"

          },

          body:
            JSON.stringify({

              action:
                "sendEmail",

              to,

              subject:
                "Renovação próxima - SAVA Seguros",

              body:
                managerEmailBody(
                  policy
                ),

              policyId:
                policy.id

            })

        }

      );


    const result =
      await response.json();


    if (
      !result.ok
    ) {

      throw new Error(
        result.error ||
        "Falha no envio"
      );

    }


    await addEvent(

      policy.id,

      "email",

      "Lembrete de e-mail enviado ao gestor."

    );


    toast(
      "E-mail enviado ao gestor."
    );


  } catch (error) {

    console.error(
      "Erro no envio do e-mail:",
      error
    );


    toast(
      "Falha no endpoint de e-mail."
    );

  }

}


/* ============================================================
   VERIFICAR AUTOMAÇÃO DE E-MAIL
   ============================================================ */

function checkAutomation() {

  const configured =
    !!state.settings.endpoint &&
    !!state.settings.managerEmail;


  const badge =
    $("#emailAutomationBadge");


  if (badge) {

    badge.textContent =
      `● E-mail automático: ${
        configured
          ? "ativo"
          : "não configurado"
      }`;


    badge.style.color =
      configured
        ? "#087443"
        : "#b54708";

  }


  if (configured) {

    autoEmailScan();

  }

}


/* ============================================================
   ESCANEAMENTO AUTOMÁTICO DE E-MAIL
   ============================================================ */

async function autoEmailScan() {

  const todayIso =
    iso(
      new Date()
    );


  const sentToday =
    state.events
      .filter(
        event =>
          event.type ===
            "email" &&
          event.date
            ?.slice(
              0,
              10
            ) === todayIso
      )
      .map(
        event =>
          event.policyId
      );


  for (
    const policy
    of state.policies
  ) {

    const days =
      daysUntil(
        policy.endDate
      );


    const mark =
      [30, 15, 7, 1]
        .includes(days)

        ? days

        : (
            days < 0 &&
            days >= -1

              ? "expired"

              : null
          );


    if (
      mark === null
    ) {
      continue;
    }


    if (
      sentToday.includes(
        policy.id
      )
    ) {
      continue;
    }


    if (
      policy.alerts?.[mark] ===
      false
    ) {
      continue;
    }


    await sendEmail(
      policy.id
    );

  }

}


/* ============================================================
   RELATÓRIO COMERCIAL DE RENOVAÇÕES
   USA O FEEDBACK REAL DIGITADO
   NÃO INVENTA INFORMAÇÕES
   ============================================================ */

function generateCommercialReport() {

  const start =
    $("#renewalStartDateFilter")
      ?.value ||
    "";


  const end =
    $("#renewalEndDateFilter")
      ?.value ||
    "";


  const policies =
    [...state.policies]
      .filter(
        policy =>
          inDateRange(
            policy,
            start,
            end
          )
      )
      .sort(
        (a, b) => {

          const statusOrder = {

            "Pendente": 1,

            "Em andamento": 2,

            "Ganho": 3,

            "Perdido": 4

          };


          const order =
            (
              statusOrder[a.status] ||
              99
            ) -
            (
              statusOrder[b.status] ||
              99
            );


          if (order !== 0) {
            return order;
          }


          return (
            new Date(a.endDate) -
            new Date(b.endDate)
          );

        }
      );


  const now =
    new Date();


  const month =
    now
      .toLocaleDateString(
        "pt-BR",
        {
          month:
            "long"
        }
      )
      .toUpperCase();


  const date =
    now
      .toLocaleDateString(
        "pt-BR",
        {
          day:
            "2-digit",

          month:
            "2-digit"
        }
      );


  let text =
    `📊 FEEDBACK COMERCIAL — ${month} — ${date}\n\n`;


  const groups = [

    {
      status:
        "Pendente",

      icon:
        "🟡"
    },

    {
      status:
        "Em andamento",

      icon:
        "🔵"
    },

    {
      status:
        "Ganho",

      icon:
        "🟢"
    },

    {
      status:
        "Perdido",

      icon:
        "🔴"
    }

  ];


  groups.forEach(
    group => {

      const groupPolicies =
        policies.filter(
          policy =>
            policy.status ===
            group.status
        );


      if (
        !groupPolicies.length
      ) {
        return;
      }


      text +=
        `${group.icon} ${group.status.toUpperCase()} — ${groupPolicies.length}\n\n`;


      groupPolicies.forEach(
        policy => {

          const client =
            clientById(
              policy.clientId
            );


          text +=
            `${(client?.name || "CLIENTE").toUpperCase()} – ${String(policy.type || "SEGURO").toUpperCase()}:\n`;


          text +=
            `${policy.feedback || "Sem feedback informado."}\n`;


          text +=
            `Seguradora: ${policy.insurer || "Não informada"}\n`;


          text +=
            `Vigência: ${fmtDate(policy.startDate)} a ${fmtDate(policy.endDate)}\n\n`;

        }
      );

    }
  );


  if (
    !policies.length
  ) {

    text +=
      "Nenhuma renovação encontrada para o período selecionado.";

  }


  return text.trim();

}


/* ============================================================
   EXIBIR RELATÓRIO COMERCIAL
   ============================================================ */

function showCommercialReport() {

  const report =
    generateCommercialReport();


  const area =
    $("#commercialReportArea");


  if (area) {

    area.textContent =
      report;

  }


  return report;

}





/* ============================================================
   RELATÓRIO INTELIGENTE GERAL
   ============================================================ */

function generateReport() {

  const total =
    state.policies.length;


  const expired =
    state.policies.filter(
      policy =>
        daysUntil(
          policy.endDate
        ) < 0
    ).length;


  const next7 =
    state.policies.filter(
      policy => {

        const days =
          daysUntil(
            policy.endDate
          );

        return (
          days >= 0 &&
          days <= 7
        );

      }
    ).length;


  const next15 =
    state.policies.filter(
      policy => {

        const days =
          daysUntil(
            policy.endDate
          );

        return (
          days >= 0 &&
          days <= 15
        );

      }
    ).length;


  const next30 =
    state.policies.filter(
      policy => {

        const days =
          daysUntil(
            policy.endDate
          );

        return (
          days >= 0 &&
          days <= 30
        );

      }
    ).length;


  const pending =
    state.policies.filter(
      policy =>
        policy.status ===
        "Pendente"
    ).length;


  const progress =
    state.policies.filter(
      policy =>
        policy.status ===
        "Em andamento"
    ).length;


  const won =
    state.policies.filter(
      policy =>
        policy.status ===
        "Ganho"
    ).length;


  const lost =
    state.policies.filter(
      policy =>
        policy.status ===
        "Perdido"
    ).length;


  const withoutFeedback =
    state.policies.filter(
      policy =>
        !String(
          policy.feedback ||
          ""
        ).trim()
    ).length;


  const priority =
    [...state.policies]
      .filter(
        policy => {

          const days =
            daysUntil(
              policy.endDate
            );


          return (
            days <= 30 &&
            policy.status !==
              "Ganho" &&
            policy.status !==
              "Perdido"
          );

        }
      )
      .sort(
        (a, b) =>
          daysUntil(
            a.endDate
          ) -
          daysUntil(
            b.endDate
          )
      )
      .slice(
        0,
        10
      );


  let priorityHtml =
    "";


  if (
    priority.length
  ) {

    priorityHtml =
      priority
        .map(
          policy => {

            const client =
              clientById(
                policy.clientId
              );


            const expiry =
              expiryLabel(
                policy
              );


            return `
              <li>

                <b>
                  ${esc(
                    client?.name ||
                    "Cliente"
                  )}
                </b>

                —
                ${esc(
                  policy.type
                )}

                ·
                ${esc(
                  policy.insurer
                )}

                —
                ${esc(
                  expiry.text
                )}

                —
                Processo:
                <b>
                  ${esc(
                    policy.status
                  )}
                </b>

                ${
                  policy.feedback

                    ? `
                        <br>
                        <small>
                          Feedback:
                          ${esc(
                            policy.feedback
                          )}
                        </small>
                      `

                    : ""
                }

              </li>
            `;

          }
        )
        .join("");

  } else {

    priorityHtml =
      `
        <li>
          Nenhuma prioridade crítica
          identificada no momento.
        </li>
      `;

  }


  return `

    <h3>
      Relatório inteligente da carteira
    </h3>


    <p>
      Gerado em
      ${new Date().toLocaleString(
        "pt-BR"
      )}.
    </p>


    <div class="report-grid">

      <div class="report-box">

        <strong>
          ${total}
        </strong>

        <small>
          apólices
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${next7}
        </strong>

        <small>
          vencem em até 7 dias
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${next15}
        </strong>

        <small>
          vencem em até 15 dias
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${next30}
        </strong>

        <small>
          vencem em até 30 dias
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${expired}
        </strong>

        <small>
          vencidas
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${pending}
        </strong>

        <small>
          pendentes
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${progress}
        </strong>

        <small>
          em andamento
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${won}
        </strong>

        <small>
          ganhas
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${lost}
        </strong>

        <small>
          perdidas
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${withoutFeedback}
        </strong>

        <small>
          sem feedback comercial
        </small>

      </div>

    </div>


    <h4>
      Prioridades da carteira
    </h4>


    <ul>
      ${priorityHtml}
    </ul>


    <br>


    <h4>
      Leitura da carteira
    </h4>


    <p>

      ${
        expired

          ? `Existem <b>${expired}</b> apólice(s) vencida(s) que ainda constam na carteira. `

          : "Não existem apólices vencidas no momento. "
      }


      ${
        next7

          ? `<b>${next7}</b> apólice(s) vencem nos próximos 7 dias. `

          : ""
      }


      ${
        pending

          ? `<b>${pending}</b> processo(s) estão pendentes. `

          : ""
      }


      ${
        progress

          ? `<b>${progress}</b> processo(s) estão em andamento. `

          : ""
      }


      ${
        won

          ? `<b>${won}</b> processo(s) foram ganhos. `

          : ""
      }


      ${
        lost

          ? `<b>${lost}</b> processo(s) estão marcados como perdidos. `

          : ""
      }


      ${
        withoutFeedback

          ? `<b>${withoutFeedback}</b> apólice(s) ainda não possuem feedback comercial registrado.`

          : "Todas as apólices possuem feedback comercial registrado."
      }

    </p>

  `;

}


/* ============================================================
   MOSTRAR RELATÓRIO
   ============================================================ */

function showReport() {

  const area =
    $("#reportArea");


  if (!area) {
    return;
  }


  area.innerHTML =
    generateReport();


  go(
    "relatorios"
  );

}


/* ============================================================
   NORMALIZAR TEXTO PARA PERGUNTAS
   ============================================================ */

function normalizeText(value) {

  return String(
    value ||
    ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();

}


/* ============================================================
   EXTRAIR NÚMERO DE UMA PERGUNTA
   ============================================================ */

function extractNumberFromQuestion(
  question
) {

  const match =
    String(question)
      .match(
        /\d+/
      );


  return match
    ? Number(
        match[0]
      )
    : null;

}


/* ============================================================
   FORMATAR APÓLICE PARA RESPOSTA
   ============================================================ */

function policyAnswerLine(
  policy
) {

  const client =
    clientById(
      policy.clientId
    );


  const expiry =
    expiryLabel(
      policy
    );


  let line =
    `${client?.name || "Cliente"} — ` +
    `${policy.type} — ` +
    `${policy.insurer} — ` +
    `${expiry.text} — ` +
    `${policy.status}`;


  if (
    policy.feedback
  ) {

    line +=
      ` — Feedback: ${policy.feedback}`;

  }


  return line;

}


/* ============================================================
   ASSISTENTE DO RELATÓRIO
   RESPONDE USANDO SOMENTE OS DADOS DO CRM
   ============================================================ */

function answerReportQuestion(
  question
) {

  const raw =
    String(
      question ||
      ""
    ).trim();


  const q =
    normalizeText(
      raw
    );


  if (!q) {

    return (
      "Digite uma pergunta sobre os dados da carteira."
    );

  }


  /* ==========================================================
     TOTAL
     ========================================================== */

  if (
    q.includes(
      "quantas apolices"
    ) ||
    q.includes(
      "quantos seguros"
    ) ||
    q === "total" ||
    q.includes(
      "total de apolices"
    )
  ) {

    return (
      `A carteira possui ${state.policies.length} apólice(s) cadastrada(s).`
    );

  }


  /* ==========================================================
     VENCIDAS
     ========================================================== */

  if (
    q.includes(
      "vencida"
    ) ||
    q.includes(
      "vencidas"
    )
  ) {

    const policies =
      state.policies
        .filter(
          policy =>
            daysUntil(
              policy.endDate
            ) < 0
        )
        .sort(
          (a, b) =>
            daysUntil(
              a.endDate
            ) -
            daysUntil(
              b.endDate
            )
        );


    if (
      !policies.length
    ) {

      return (
        "Não existem apólices vencidas na carteira."
      );

    }


    return (
      `Existem ${policies.length} apólice(s) vencida(s):\n\n` +
      policies
        .map(
          policy =>
            "• " +
            policyAnswerLine(
              policy
            )
        )
        .join("\n")
    );

  }


  /* ==========================================================
     PRÓXIMOS X DIAS
     ========================================================== */

  if (
    q.includes(
      "proxim"
    ) ||
    q.includes(
      "vencem"
    ) ||
    q.includes(
      "vencer"
    )
  ) {

    let days =
      extractNumberFromQuestion(
        q
      );


    if (
      !days
    ) {

      days =
        30;

    }


    const policies =
      state.policies
        .filter(
          policy => {

            const difference =
              daysUntil(
                policy.endDate
              );


            return (
              difference >= 0 &&
              difference <= days
            );

          }
        )
        .sort(
          (a, b) =>
            daysUntil(
              a.endDate
            ) -
            daysUntil(
              b.endDate
            )
        );


    if (
      !policies.length
    ) {

      return (
        `Nenhuma apólice vence nos próximos ${days} dias.`
      );

    }


    return (
      `${policies.length} apólice(s) vencem nos próximos ${days} dias:\n\n` +
      policies
        .map(
          policy =>
            "• " +
            policyAnswerLine(
              policy
            )
        )
        .join("\n")
    );

  }


  /* ==========================================================
     STATUS
     ========================================================== */

  const statusSearch = [

    {
      words: [
        "pendente",
        "pendentes"
      ],

      status:
        "Pendente"
    },

    {
      words: [
        "andamento",
        "em andamento"
      ],

      status:
        "Em andamento"
    },

    {
      words: [
        "ganho",
        "ganhos",
        "ganha",
        "ganhas"
      ],

      status:
        "Ganho"
    },

    {
      words: [
        "perdido",
        "perdidos",
        "perdida",
        "perdidas"
      ],

      status:
        "Perdido"
    }

  ];


  for (
    const item
    of statusSearch
  ) {

    if (
      item.words.some(
        word =>
          q.includes(
            normalizeText(
              word
            )
          )
      )
    ) {

      const policies =
        state.policies.filter(
          policy =>
            policy.status ===
            item.status
        );


      if (
        !policies.length
      ) {

        return (
          `Nenhuma apólice está com status "${item.status}".`
        );

      }


      return (
        `${policies.length} apólice(s) estão com status "${item.status}":\n\n` +
        policies
          .map(
            policy =>
              "• " +
              policyAnswerLine(
                policy
              )
          )
          .join("\n")
      );

    }

  }


  /* ==========================================================
     SEM FEEDBACK
     ========================================================== */

  if (
    q.includes(
      "sem feedback"
    ) ||
    q.includes(
      "falta feedback"
    )
  ) {

    const policies =
      state.policies.filter(
        policy =>
          !String(
            policy.feedback ||
            ""
          ).trim()
      );


    if (
      !policies.length
    ) {

      return (
        "Todas as apólices possuem feedback comercial."
      );

    }


    return (
      `${policies.length} apólice(s) estão sem feedback comercial:\n\n` +
      policies
        .map(
          policy =>
            "• " +
            policyAnswerLine(
              policy
            )
        )
        .join("\n")
    );

  }


  /* ==========================================================
     BUSCAR CLIENTE
     ========================================================== */

  const matchingClients =
    state.clients.filter(
      client => {

        const name =
          normalizeText(
            client.name
          );


        return (
          name &&
          (
            q.includes(name) ||
            name
              .split(" ")
              .filter(
                part =>
                  part.length >= 4
              )
              .some(
                part =>
                  q.includes(
                    part
                  )
              )
          )
        );

      }
    );


  if (
    matchingClients.length
  ) {

    const client =
      matchingClients[0];


    const policies =
      state.policies.filter(
        policy =>
          policy.clientId ===
          client.id
      );


    if (
      !policies.length
    ) {

      return (
        `${client.name} está cadastrado(a), mas não possui apólices vinculadas.`
      );

    }


    return (
      `${client.name} possui ${policies.length} apólice(s):\n\n` +
      policies
        .map(
          policy =>
            "• " +
            policyAnswerLine(
              policy
            )
        )
        .join("\n")
    );

  }


  /* ==========================================================
     BUSCAR SEGURADORA
     ========================================================== */

  const matchingInsurer =
    INSURERS.find(
      insurer =>
        q.includes(
          normalizeText(
            insurer
          )
        )
    );


  if (
    matchingInsurer
  ) {

    const policies =
      state.policies.filter(
        policy =>
          normalizeText(
            policy.insurer
          ) ===
          normalizeText(
            matchingInsurer
          )
      );


    if (
      !policies.length
    ) {

      return (
        `Não encontrei apólices da seguradora ${matchingInsurer}.`
      );

    }


    return (
      `Encontrei ${policies.length} apólice(s) da ${matchingInsurer}:\n\n` +
      policies
        .map(
          policy =>
            "• " +
            policyAnswerLine(
              policy
            )
        )
        .join("\n")
    );

  }


  /* ==========================================================
     BUSCAR TIPO DE SEGURO
     ========================================================== */

  const matchingType =
    TYPES.find(
      type =>
        q.includes(
          normalizeText(
            type
          )
        )
    );


  if (
    matchingType
  ) {

    const policies =
      state.policies.filter(
        policy =>
          normalizeText(
            policy.type
          ) ===
          normalizeText(
            matchingType
          )
      );


    if (
      !policies.length
    ) {

      return (
        `Não encontrei apólices do tipo ${matchingType}.`
      );

    }


    return (
      `Encontrei ${policies.length} apólice(s) do tipo ${matchingType}:\n\n` +
      policies
        .map(
          policy =>
            "• " +
            policyAnswerLine(
              policy
            )
        )
        .join("\n")
    );

  }


  /* ==========================================================
     FEEDBACK / NEGOCIAÇÃO
     ========================================================== */

  if (
    q.includes(
      "feedback"
    ) ||
    q.includes(
      "negociacao"
    ) ||
    q.includes(
      "cotacao"
    )
  ) {

    const policies =
      state.policies.filter(
        policy =>
          String(
            policy.feedback ||
            ""
          ).trim()
      );


    if (
      !policies.length
    ) {

      return (
        "Ainda não existem feedbacks comerciais registrados."
      );

    }


    return (
      `Existem ${policies.length} apólice(s) com feedback comercial:\n\n` +
      policies
        .map(
          policy =>
            "• " +
            policyAnswerLine(
              policy
            )
        )
        .join("\n")
    );

  }


  /* ==========================================================
     RESUMO
     ========================================================== */

  if (
    q.includes(
      "resumo"
    ) ||
    q.includes(
      "situacao"
    ) ||
    q.includes(
      "carteira"
    )
  ) {

    const pending =
      state.policies.filter(
        policy =>
          policy.status ===
          "Pendente"
      ).length;


    const progress =
      state.policies.filter(
        policy =>
          policy.status ===
          "Em andamento"
      ).length;


    const won =
      state.policies.filter(
        policy =>
          policy.status ===
          "Ganho"
      ).length;


    const lost =
      state.policies.filter(
        policy =>
          policy.status ===
          "Perdido"
      ).length;


    const expired =
      state.policies.filter(
        policy =>
          daysUntil(
            policy.endDate
          ) < 0
      ).length;


    return (
      `Resumo atual da carteira:\n\n` +
      `• ${state.clients.length} cliente(s)\n` +
      `• ${state.policies.length} apólice(s)\n` +
      `• ${pending} pendente(s)\n` +
      `• ${progress} em andamento\n` +
      `• ${won} ganha(s)\n` +
      `• ${lost} perdida(s)\n` +
      `• ${expired} vencida(s)`
    );

  }


  return (
    "Não consegui identificar exatamente o que você quer consultar. " +
    "Você pode perguntar, por exemplo: " +
    "\"quais vencem nos próximos 7 dias?\", " +
    "\"quais estão pendentes?\", " +
    "\"quais estão sem feedback?\", " +
    "\"como está o cliente João?\" ou " +
    "\"quantas apólices temos na Tokio Marine?\"."
  );

}


/* ============================================================
   MOSTRAR RESPOSTA DO ASSISTENTE
   ============================================================ */

function askReportAssistant() {

  const input =
    $("#reportQuestion");


  const output =
    $("#reportAnswer");


  if (
    !input ||
    !output
  ) {
    return;
  }


  const answer =
    answerReportQuestion(
      input.value
    );


  output.textContent =
    answer;

}


/* ============================================================
   IMPORTAÇÃO DO AGGER
   ============================================================ */


/* ============================================================
   NORMALIZAR CABEÇALHO DO EXCEL
   ============================================================ */

function normalizeHeader(value) {

  return normalizeText(
    value
  )
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .trim();

}


/* ============================================================
   BUSCAR VALOR EM COLUNAS DIFERENTES
   ============================================================ */

function getExcelValue(
  row,
  aliases
) {

  const entries =
    Object.entries(
      row || {}
    );


  for (
    const alias
    of aliases
  ) {

    const normalizedAlias =
      normalizeHeader(
        alias
      );


    const found =
      entries.find(
        ([key]) =>
          normalizeHeader(
            key
          ) ===
          normalizedAlias
      );


    if (
      found &&
      found[1] !==
        undefined &&
      found[1] !==
        null &&
      String(
        found[1]
      ).trim() !==
        ""
    ) {

      return found[1];

    }

  }


  return "";

}


/* ============================================================
   CONVERTER DATA DO EXCEL
   ============================================================ */

function excelDateToIso(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }


  /*
    SheetJS pode retornar
    número serial do Excel.
  */

  if (
    typeof value ===
    "number"
  ) {

    if (
      window.XLSX?.SSF
        ?.parse_date_code
    ) {

      const parsed =
        XLSX.SSF
          .parse_date_code(
            value
          );


      if (parsed) {

        return (
          `${String(parsed.y).padStart(4, "0")}-` +
          `${String(parsed.m).padStart(2, "0")}-` +
          `${String(parsed.d).padStart(2, "0")}`
        );

      }

    }

  }


  const text =
    String(value)
      .trim();


  /*
    DD/MM/AAAA
  */

  let match =
    text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );


  if (match) {

    return (
      `${match[3]}-` +
      `${match[2].padStart(2, "0")}-` +
      `${match[1].padStart(2, "0")}`
    );

  }


  /*
    AAAA-MM-DD
  */

  match =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );


  if (match) {

    return (
      `${match[1]}-` +
      `${match[2].padStart(2, "0")}-` +
      `${match[3].padStart(2, "0")}`
    );

  }


  const date =
    new Date(
      text
    );


  if (
    !Number.isNaN(
      date.getTime()
    )
  ) {

    return iso(
      date
    );

  }


  return "";

}


/* ============================================================
   LER LINHA EXPORTADA PELO AGGER


   ============================================================ */

function parseAggerRow(row) {

  const clientName =
    String(
      getExcelValue(
        row,
        [
          "Cliente",
          "Nome Cliente",
          "Nome do Cliente",
          "Segurado",
          "Nome Segurado",
          "Nome do Segurado",
          "Razão Social",
          "Razao Social"
        ]
      ) ||
      ""
    ).trim();


  const document =
    String(
      getExcelValue(
        row,
        [
          "CPF/CNPJ",
          "CPF CNPJ",
          "CPF",
          "CNPJ",
          "Documento"
        ]
      ) ||
      ""
    ).trim();


  const phone =
    cleanPhone(
      getExcelValue(
        row,
        [
          "Telefone",
          "Celular",
          "WhatsApp",
          "Whatsapp",
          "Fone",
          "Telefone Celular"
        ]
      )
    );


  const email =
    String(
      getExcelValue(
        row,
        [
          "Email",
          "E-mail",
          "E mail"
        ]
      ) ||
      ""
    ).trim();


  const birthDate =
    excelDateToIso(
      getExcelValue(
        row,
        [
          "Data Nascimento",
          "Data de Nascimento",
          "Nascimento"
        ]
      )
    );


  const insurer =
    String(
      getExcelValue(
        row,
        [
          "Seguradora",
          "Companhia",
          "Cia",
          "Cia Seguradora"
        ]
      ) ||
      "Outra"
    ).trim();


  const type =
    String(
      getExcelValue(
        row,
        [
          "Ramo",
          "Tipo",
          "Tipo Seguro",
          "Tipo de Seguro",
          "Produto"
        ]
      ) ||
      "Outro"
    ).trim();


  const number =
    String(
      getExcelValue(
        row,
        [
          "Apólice",
          "Apolice",
          "Nº Apólice",
          "N Apólice",
          "Numero Apolice",
          "Número Apólice",
          "Numero da Apolice",
          "Número da Apólice"
        ]
      ) ||
      ""
    ).trim();


  const startDate =
    excelDateToIso(
      getExcelValue(
        row,
        [
          "Início Vigência",
          "Inicio Vigencia",
          "Início de Vigência",
          "Inicio de Vigencia",
          "Vigência Inicial",
          "Vigencia Inicial",
          "Data Inicial"
        ]
      )
    );


  const endDate =
    excelDateToIso(
      getExcelValue(
        row,
        [
          "Fim Vigência",
          "Fim Vigencia",
          "Fim de Vigência",
          "Vigência Final",
          "Vigencia Final",
          "Data Final",
          "Vencimento",
          "Data Vencimento"
        ]
      )
    );


  return {

    clientName,

    document:
      formatDocument(
        document
      ),

    phone,

    email,

    birthDate,

    insurer,

    type,

    number,

    startDate,

    endDate

  };

}


/* ============================================================
   VERIFICAR CLIENTE EXISTENTE
   ============================================================ */

function findImportedClient(
  imported
) {

  const document =
    onlyNumbers(
      imported.document
    );


  /*
    Primeiro tenta CPF/CNPJ.
  */

  if (document) {

    const byDocument =
      state.clients.find(
        client =>
          onlyNumbers(
            client.document
          ) === document
      );


    if (byDocument) {
      return byDocument;
    }

  }


  /*
    Depois tenta nome.
  */

  const name =
    normalizeText(
      imported.clientName
    );


  if (name) {

    const byName =
      state.clients.find(
        client =>
          normalizeText(
            client.name
          ) === name
      );


    if (byName) {
      return byName;
    }

  }


  return null;

}


/* ============================================================
   VERIFICAR APÓLICE DUPLICADA
   ============================================================ */

function importedPolicyExists(
  clientId,
  imported
) {

  return state.policies.some(
    policy => {

      if (
        policy.clientId !==
        clientId
      ) {
        return false;
      }


      /*
        Se houver número da apólice,
        ele é o identificador principal.
      */

      if (
        imported.number &&
        policy.number
      ) {

        return (
          normalizeText(
            policy.number
          ) ===
          normalizeText(
            imported.number
          )
        );

      }


      /*
        Sem número:
        compara cliente + seguradora +
        tipo + vencimento.
      */

      return (

        normalizeText(
          policy.insurer
        ) ===
        normalizeText(
          imported.insurer
        ) &&

        normalizeText(
          policy.type
        ) ===
        normalizeText(
          imported.type
        ) &&

        (
          policy.endDate ||
          ""
        ) ===
        (
          imported.endDate ||
          ""
        )

      );

    }
  );

}


/* ============================================================
   CRIAR CLIENTE IMPORTADO
   ============================================================ */

async function createImportedClient(
  imported
) {

  const client = {

    id:
      uid(),

    name:
      imported.clientName,

    birthDate:
      imported.birthDate ||
      "",

    phone:
      imported.phone ||
      "",

    document:
      imported.document ||
      "",

    email:
      imported.email ||
      "",

    notes:
      "Importado do Agger",

    createdAt:
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString()

  };


  const {
    data,
    error
  } =
    await sb
      .from(
        "clients"
      )
      .insert(
        clientToDb(
          client
        )
      )
      .select()
      .single();


  if (error) {
    throw error;
  }


  const saved =
    clientFromDb(
      data
    );


  state.clients.push(
    saved
  );


  return saved;

}


/* ============================================================
   CRIAR APÓLICE IMPORTADA
   ============================================================ */

async function createImportedPolicy(
  client,
  imported
) {

  const policy = {

    id:
      uid(),

    clientId:
      client.id,

    insurer:
      imported.insurer ||
      "Outra",

    type:
      imported.type ||
      "Outro",

    number:
      imported.number ||
      "",

    startDate:
      imported.startDate ||
      "",

    endDate:
      imported.endDate ||
      "",

    status:
      "Pendente",

    notes:
      "Importado do Agger",

    feedback:
      "",

    feedbackUpdatedAt:
      null,

    alerts: {

      30: true,

      15: true,

      7: true,

      1: true,

      expired: true

    },

    pdfPath:
      null,

    renewedFrom:
      null,

    createdAt:
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString()

  };


  const {
    data,
    error
  } =
    await sb
      .from(
        "policies"
      )
      .insert(
        policyToDb(
          policy
        )
      )
      .select()
      .single();


  if (error) {
    throw error;
  }


  const saved =
    policyFromDb(
      data
    );


  state.policies.push(
    saved
  );


  return saved;

}


/* ============================================================
   CARREGAR BIBLIOTECA XLSX
   ============================================================ */

function loadSheetJs() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      /*
        Se já carregou,
        não carrega novamente.
      */

      if (
        window.XLSX
      ) {

        resolve(
          window.XLSX
        );

        return;

      }


      const existing =
        document.querySelector(
          'script[data-sava-xlsx="1"]'
        );


      if (existing) {

        existing.addEventListener(
          "load",
          () =>
            resolve(
              window.XLSX
            ),
          {
            once: true
          }
        );


        existing.addEventListener(
          "error",
          reject,
          {
            once: true
          }
        );


        return;

      }


      const script =
        document.createElement(
          "script"
        );


      script.src =
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";


      script.dataset.savaXlsx =
        "1";


      script.onload =
        () =>
          resolve(
            window.XLSX
          );


      script.onerror =
        () =>
          reject(
            new Error(
              "Não foi possível carregar o leitor de Excel."
            )
          );


      document.head.appendChild(
        script
      );

    }
  );

}


/* ============================================================
   LER ARQUIVO EXCEL
   ============================================================ */

async function readAggerExcel(
  file
) {

  await loadSheetJs();


  const buffer =
    await file.arrayBuffer();


  const workbook =
    XLSX.read(
      buffer,
      {
        type:
          "array",

        cellDates:
          false
      }
    );


  const firstSheetName =
    workbook.SheetNames[0];


  if (!firstSheetName) {

    throw new Error(
      "A planilha não possui abas."
    );

  }


  const sheet =
    workbook.Sheets[
      firstSheetName
    ];


  const rows =
    XLSX.utils
      .sheet_to_json(
        sheet,
        {

          defval:
            "",

          raw:
            true

        }
      );


  return rows;

}


/* ============================================================
   PRÉ-VISUALIZAR IMPORTAÇÃO
   ============================================================ */

async function previewAggerImport(
  file
) {

  const rows =
    await readAggerExcel(
      file
    );


  const parsed =
    rows
      .map(
        parseAggerRow
      )
      .filter(
        row =>
          row.clientName
      );


  const preview =
    $("#aggerPreview");


  if (preview) {

    if (
      !parsed.length
    ) {

      preview.innerHTML = `
        <div class="empty">
          Nenhum cliente válido foi
          identificado na planilha.
        </div>
      `;

      return parsed;

    }


    preview.innerHTML = `

      <div class="report-grid">

        <div class="report-box">

          <strong>
            ${rows.length}
          </strong>

          <small>
            linhas lidas
          </small>

        </div>


        <div class="report-box">

          <strong>
            ${parsed.length}
          </strong>

          <small>
            linhas reconhecidas
          </small>

        </div>

      </div>


      <div
        style="
          margin-top:14px;
          overflow:auto;
          max-height:330px;
        "
      >

        <table>

          <thead>

            <tr>

              <th>
                Cliente
              </th>

              <th>
                Seguro
              </th>

              <th>
                Seguradora
              </th>

              <th>
                Apólice
              </th>

              <th>
                Vigência
              </th>

            </tr>

          </thead>


          <tbody>

            ${
              parsed
                .slice(
                  0,
                  30
                )
                .map(
                  row => `
                    <tr>

                      <td>
                        ${esc(
                          row.clientName
                        )}
                      </td>

                      <td>
                        ${esc(
                          row.type
                        )}
                      </td>

                      <td>
                        ${esc(
                          row.insurer
                        )}
                      </td>

                      <td>
                        ${esc(
                          row.number ||
                          "—"
                        )}
                      </td>

                      <td>

                        ${
                          row.startDate
                            ? fmtDate(
                                row.startDate
                              )
                            : "—"
                        }

                        →

                        ${
                          row.endDate
                            ? fmtDate(
                                row.endDate
                              )
                            : "—"
                        }

                      </td>

                    </tr>
                  `
                )
                .join("")
            }

          </tbody>

        </table>

      </div>


      ${
        parsed.length > 30

          ? `
              <small>
                Exibindo as primeiras
                30 linhas de
                ${parsed.length}.
              </small>
            `

          : ""
      }

    `;

  }


  return parsed;

}


/* ============================================================
   IMPORTAR EXCEL DO AGGER
   ============================================================ */

async function importAggerExcel(
  event
) {

  const input =
    event?.target ||
    $("#aggerFile");


  const file =
    input
      ?.files?.[0];


  if (!file) {
    return;
  }


  const status =
    $("#aggerImportStatus");


  try {

    if (status) {

      status.textContent =
        "Lendo a planilha...";

    }


    const rows =
      await previewAggerImport(
        file
      );


    if (
      !rows.length
    ) {

      if (status) {

        status.textContent =
          "Nenhum registro válido encontrado.";

      }


      return;

    }


    const confirmed =
      window.confirm(

        `Foram encontradas ${rows.length} linha(s) válidas.\n\nDeseja importar os dados para o CRM?`

      );


    if (!confirmed) {

      if (status) {

        status.textContent =
          "Importação cancelada.";

      }


      return;

    }


    let createdClients =
      0;


    let createdPolicies =
      0;


    let duplicatedPolicies =
      0;


    let ignoredRows =
      0;


    let processed =
      0;


    for (
      const imported
      of rows
    ) {

      processed++;


      if (status) {

        status.textContent =
          `Importando ${processed} de ${rows.length}...`;

      }


      /*
        Sem nome não importa.
      */

      if (
        !imported.clientName
      ) {

        ignoredRows++;

        continue;

      }


      let client =
        findImportedClient(
          imported
        );


      if (!client) {

        client =
          await createImportedClient(
            imported
          );


        createdClients++;

      }


      /*
        Evita duplicar apólice.
      */

      if (
        importedPolicyExists(
          client.id,
          imported
        )
      ) {

        duplicatedPolicies++;

        continue;

      }


      await createImportedPolicy(
        client,
        imported
      );


      createdPolicies++;

    }


    saveLocalCache();


    renderAll();


    if (status) {

      status.textContent =
        `Importação concluída. ` +
        `${createdClients} cliente(s) criado(s), ` +
        `${createdPolicies} apólice(s) criada(s), ` +
        `${duplicatedPolicies} duplicada(s) ignorada(s)` +
        (
          ignoredRows
            ? ` e ${ignoredRows} linha(s) inválida(s).`
            : "."
        );

    }


    toast(
      "Importação do Agger concluída."
    );


  } catch (error) {

    console.error(
      "Erro ao importar Agger:",
      error
    );


    if (status) {

      status.textContent =
        "Não foi possível importar a planilha.";

    }


    toast(
      "Erro ao importar o Excel do Agger."
    );

  }

}


/* ============================================================
   LIMPAR SELEÇÃO DO AGGER
   ============================================================ */

function clearAggerImport() {

  const input =
    $("#aggerFile");


  const preview =
    $("#aggerPreview");


  const status =
    $("#aggerImportStatus");


  if (input) {

    input.value =
      "";

  }


  if (preview) {

    preview.innerHTML =
      "";

  }


  if (status) {

    status.textContent =
      "";

  }

}



/* ============================================================
   LOGIN
   ============================================================ */

async function login(event) {

  event.preventDefault();

  const email =
    $("#loginUser")
      ?.value
      ?.trim();

  const password =
    $("#loginPass")
      ?.value || "";

  const errorBox =
    $("#loginError");

  if (errorBox) {
    errorBox.textContent = "";
  }

  if (!email || !password) {

    if (errorBox) {
      errorBox.textContent =
        "Informe o e-mail e a senha.";
    }

    return;
  }

  try {

    const {
      data,
      error
    } =
      await sb.auth
        .signInWithPassword({
          email,
          password
        });

    if (error) {
      throw error;
    }

    state.user =
      data.user;

    showApp();

    await loadCloudData();

    renderAll();

    checkAutomation();

  } catch (error) {

    console.error(
      "Erro no login:",
      error
    );

    if (errorBox) {

      errorBox.textContent =
        "E-mail ou senha inválidos.";

    }

  }

}


/* ============================================================
   LOGOUT
   ============================================================ */

async function logout() {

  try {

    await sb.auth
      .signOut();

  } catch (error) {

    console.error(
      "Erro ao sair:",
      error
    );

  }

  state.user = null;

  state.clients = [];

  state.policies = [];

  state.events = [];

  showLogin();

}


/* ============================================================
   ESQUECI MINHA SENHA
   ============================================================ */

async function forgotPassword() {

  const email =
    $("#loginUser")
      ?.value
      ?.trim();

  if (!email) {

    toast(
      "Digite seu e-mail primeiro."
    );

    return;
  }

  try {

    const {
      error
    } =
      await sb.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo:
              window.location.origin +
              window.location.pathname
          }
        );

    if (error) {
      throw error;
    }

    toast(
      "Enviamos o link de recuperação para o seu e-mail."
    );

  } catch (error) {

    console.error(
      error
    );

    toast(
      "Não foi possível enviar a recuperação de senha."
    );

  }

}


/* ============================================================
   SALVAR SENHA APÓS RECUPERAÇÃO
   ============================================================ */

async function saveRecoveryPassword() {

  const password =
    $("#recoveryPass")
      ?.value || "";

  const confirmPassword =
    $("#recoveryPassConfirm")
      ?.value || "";

  const errorBox =
    $("#recoveryError");

  if (errorBox) {
    errorBox.textContent = "";
  }

  if (
    password.length < 6
  ) {

    if (errorBox) {
      errorBox.textContent =
        "A senha precisa ter pelo menos 6 caracteres.";
    }

    return;
  }

  if (
    password !==
    confirmPassword
  ) {

    if (errorBox) {
      errorBox.textContent =
        "As senhas não são iguais.";
    }

    return;
  }

  try {

    const {
      error
    } =
      await sb.auth
        .updateUser({
          password
        });

    if (error) {
      throw error;
    }

    toast(
      "Senha alterada com sucesso."
    );

    $("#recoveryPanel")
      ?.classList
      .add("hidden");

  } catch (error) {

    console.error(
      error
    );

    if (errorBox) {

      errorBox.textContent =
        "Não foi possível alterar a senha.";

    }

  }

}


/* ============================================================
   ALTERAR SENHA PELAS CONFIGURAÇÕES
   ============================================================ */

async function saveAccountSettings() {

  const password =
    $("#cfgPass")
      ?.value || "";

  const confirmPassword =
    $("#cfgPassConfirm")
      ?.value || "";

  if (!password) {

    toast(
      "Digite a nova senha."
    );

    return;
  }

  if (
    password.length < 6
  ) {

    toast(
      "A senha precisa ter pelo menos 6 caracteres."
    );

    return;
  }

  if (
    password !==
    confirmPassword
  ) {

    toast(
      "As senhas não são iguais."
    );

    return;
  }

  try {

    const {
      error
    } =
      await sb.auth
        .updateUser({
          password
        });

    if (error) {
      throw error;
    }

    if ($("#cfgPass")) {
      $("#cfgPass").value = "";
    }

    if ($("#cfgPassConfirm")) {
      $("#cfgPassConfirm").value = "";
    }

    toast(
      "Senha alterada com sucesso."
    );

  } catch (error) {

    console.error(
      error
    );

    toast(
      "Não foi possível alterar a senha."
    );

  }

}


/* ============================================================
   CONFIGURAÇÃO DE E-MAIL
   ============================================================ */

async function saveEmailSettings() {

  state.settings.endpoint =
    $("#emailEndpoint")
      ?.value
      ?.trim() || "";

  state.settings.managerEmail =
    $("#managerEmail")
      ?.value
      ?.trim() || "";

  try {

    await saveSettings();

    saveLocalCache();

    checkAutomation();

    toast(
      "Configuração de e-mail salva."
    );

  } catch (error) {

    console.error(
      error
    );

    toast(
      "Não foi possível salvar a configuração."
    );

  }

}


/* ============================================================
   IDIOMA
   ============================================================ */

async function saveLanguageSettings() {

  state.settings.language =
    $("#languageSelect")
      ?.value ||
    "pt-BR";

  try {

    await saveSettings();

    saveLocalCache();

    toast(
      "Idioma salvo."
    );

  } catch (error) {

    console.error(
      error
    );

    toast(
      "Não foi possível salvar o idioma."
    );

  }

}


/* ============================================================
   BACKUP
   ============================================================ */

function exportBackup() {

  const backup = {

    version:
      "SAVA-CRM-2026",

    exportedAt:
      new Date()
        .toISOString(),

    clients:
      state.clients,

    policies:
      state.policies,

    events:
      state.events,

    settings:
      state.settings

  };

  const blob =
    new Blob(
      [
        JSON.stringify(
          backup,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const anchor =
    document.createElement(
      "a"
    );

  anchor.href =
    url;

  anchor.download =
    `sava-backup-${iso(new Date())}.json`;

  document.body
    .appendChild(
      anchor
    );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    url
  );

  toast(
    "Backup exportado."
  );

}


/* ============================================================
   IMPORTAR BACKUP
   ============================================================ */

async function importBackup(event) {

  const file =
    event?.target
      ?.files?.[0];

  if (!file) {
    return;
  }

  try {

    const text =
      await file.text();

    const backup =
      JSON.parse(
        text
      );

    if (
      !Array.isArray(
        backup.clients
      ) ||
      !Array.isArray(
        backup.policies
      )
    ) {

      throw new Error(
        "Backup inválido."
      );

    }

    const confirmed =
      window.confirm(
        "Importar este backup para o CRM?\n\nOs registros do arquivo serão enviados para sua conta."
      );

    if (!confirmed) {
      return;
    }


    /* CLIENTES */

    for (
      const client
      of backup.clients
    ) {

      const normalized = {

        ...client,

        id:
          client.id ||
          uid(),

        birthDate:
          client.birthDate ||
          "",

        createdAt:
          client.createdAt ||
          new Date()
            .toISOString(),

        updatedAt:
          new Date()
            .toISOString()

      };

      const {
        error
      } =
        await sb
          .from("clients")
          .upsert(
            clientToDb(
              normalized
            )
          );

      if (error) {
        throw error;
      }

    }


    /* APÓLICES */

    for (
      const policy
      of backup.policies
    ) {

      const normalized = {

        ...policy,

        id:
          policy.id ||
          uid(),

        feedback:
          policy.feedback ||
          "",

        feedbackUpdatedAt:
          policy.feedbackUpdatedAt ||
          null,

        status:
          [
            "Pendente",
            "Em andamento",
            "Ganho",
            "Perdido"
          ].includes(
            policy.status
          )
            ? policy.status
            : "Pendente",

        createdAt:
          policy.createdAt ||
          new Date()
            .toISOString(),

        updatedAt:
          new Date()
            .toISOString()

      };

      const {
        error
      } =
        await sb
          .from("policies")
          .upsert(
            policyToDb(
              normalized
            )
          );

      if (error) {
        throw error;
      }

    }


    if (
      backup.settings
    ) {

      state.settings = {

        ...state.settings,

        ...backup.settings

      };

      await saveSettings();

    }


    await loadCloudData();

    renderAll();

    toast(
      "Backup importado com sucesso."
    );

  } catch (error) {

    console.error(
      "Erro ao importar backup:",
      error
    );

    toast(
      "Não foi possível importar o backup."
    );

  } finally {

    if (
      event?.target
    ) {

      event.target.value =
        "";

    }

  }

}


/* ============================================================
   APAGAR TODOS OS DADOS
   ============================================================ */

async function clearAllData() {

  const firstConfirm =
    window.confirm(
      "ATENÇÃO!\n\nIsso apagará todos os clientes, apólices e históricos da sua conta.\n\nDeseja continuar?"
    );

  if (!firstConfirm) {
    return;
  }

  const secondConfirm =
    window.confirm(
      "Última confirmação:\n\nEssa ação não poderá ser desfeita. Apagar tudo?"
    );

  if (!secondConfirm) {
    return;
  }

  try {

    /*
      Apaga eventos primeiro.
    */

    const {
      error: eventsError
    } =
      await sb
        .from("events")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );

    if (
      eventsError
    ) {
      console.warn(
        eventsError
      );
    }


    /*
      PDFs existentes.
    */

    const pdfPaths =
      state.policies
        .map(
          policy =>
            policy.pdfPath
        )
        .filter(Boolean);

    if (
      pdfPaths.length
    ) {

      const {
        error: pdfError
      } =
        await sb
          .storage
          .from(
            "policy-pdfs"
          )
          .remove(
            pdfPaths
          );

      if (
        pdfError
      ) {

        console.warn(
          pdfError
        );

      }

    }


    /*
      Apólices.
    */

    const {
      error: policiesError
    } =
      await sb
        .from("policies")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );

    if (
      policiesError
    ) {
      throw policiesError;
    }


    /*
      Clientes.
    */

    const {
      error: clientsError
    } =
      await sb
        .from("clients")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );

    if (
      clientsError
    ) {
      throw clientsError;
    }


    state.clients = [];

    state.policies = [];

    state.events = [];

    saveLocalCache();

    renderAll();

    toast(
      "Todos os dados foram apagados."
    );

  } catch (error) {

    console.error(
      "Erro ao limpar dados:",
      error
    );

    toast(
      "Não foi possível apagar todos os dados."
    );

  }

}


/* ============================================================
   MIGRAÇÃO DO LOCALSTORAGE ANTIGO
   ============================================================ */

function getLegacyData() {

  const candidates = [
    "savaData",
    "savaCRM",
    "sava_crm",
    "savaClients",
    "savaPolicies"
  ];

  const result = {

    clients: [],

    policies: []

  };

  for (
    const key
    of candidates
  ) {

    try {

      const raw =
        localStorage
          .getItem(key);

      if (!raw) {
        continue;
      }

      const parsed =
        JSON.parse(raw);

      if (
        Array.isArray(
          parsed?.clients
        )
      ) {

        result.clients.push(
          ...parsed.clients
        );

      }

      if (
        Array.isArray(
          parsed?.policies
        )
      ) {

        result.policies.push(
          ...parsed.policies
        );

      }

      if (
        key ===
          "savaClients" &&
        Array.isArray(parsed)
      ) {

        result.clients.push(
          ...parsed
        );

      }

      if (
        key ===
          "savaPolicies" &&
        Array.isArray(parsed)
      ) {

        result.policies.push(
          ...parsed
        );

      }

    } catch (error) {

      console.warn(
        "Não foi possível ler:",
        key,
        error
      );

    }

  }

  return result;

}


/* ============================================================
   MIGRAR DADOS ANTIGOS
   ============================================================ */

async function migrateLocalData() {

  const status =
    $("#migrationStatus");

  try {

    const legacy =
      getLegacyData();

    if (
      !legacy.clients.length &&
      !legacy.policies.length
    ) {

      if (status) {

        status.textContent =
          "Nenhum banco antigo foi encontrado neste navegador.";

      }

      return;
    }

    if (status) {

      status.textContent =
        "Migrando dados...";

    }

    const clientMap =
      new Map();


    for (
      const oldClient
      of legacy.clients
    ) {

      const document =
        onlyNumbers(
          oldClient.document ||
          oldClient.doc ||
          ""
        );

      const existing =
        state.clients.find(
          client => {

            if (
              document &&
              onlyNumbers(
                client.document
              ) === document
            ) {
              return true;
            }

            return (
              normalizeText(
                client.name
              ) ===
              normalizeText(
                oldClient.name
              )
            );

          }
        );

      if (existing) {

        clientMap.set(
          oldClient.id,
          existing.id
        );

        continue;
      }

      const client = {

        id:
          uid(),

        name:
          oldClient.name ||
          "Cliente",

        birthDate:
          oldClient.birthDate ||
          oldClient.birth ||
          "",

        phone:
          cleanPhone(
            oldClient.phone ||
            ""
          ),

        document:
          formatDocument(
            oldClient.document ||
            oldClient.doc ||
            ""
          ),

        email:
          oldClient.email ||
          "",

        notes:
          oldClient.notes ||
          "",

        createdAt:
          oldClient.createdAt ||
          new Date()
            .toISOString(),

        updatedAt:
          new Date()
            .toISOString()

      };

      const {
        data,
        error
      } =
        await sb
          .from("clients")
          .insert(
            clientToDb(
              client
            )
          )
          .select()
          .single();

      if (error) {
        throw error;
      }

      const saved =
        clientFromDb(
          data
        );

      state.clients.push(
        saved
      );

      clientMap.set(
        oldClient.id,
        saved.id
      );

    }


    for (
      const oldPolicy
      of legacy.policies
    ) {

      const clientId =
        clientMap.get(
          oldPolicy.clientId
        ) ||
        oldPolicy.clientId;

      if (
        !clientById(
          clientId
        )
      ) {
        continue;
      }

      const duplicate =
        state.policies.some(
          policy =>
            policy.clientId ===
              clientId &&
            oldPolicy.number &&
            normalizeText(
              policy.number
            ) ===
              normalizeText(
                oldPolicy.number
              )
        );

      if (duplicate) {
        continue;
      }

      const policy = {

        id:
          uid(),

        clientId,

        insurer:
          oldPolicy.insurer ||
          "Outra",

        type:
          oldPolicy.type ||
          "Outro",

        number:
          oldPolicy.number ||
          "",

        startDate:
          oldPolicy.startDate ||
          "",

        endDate:
          oldPolicy.endDate ||
          "",

        status:
          [
            "Pendente",
            "Em andamento",
            "Ganho",
            "Perdido"
          ].includes(
            oldPolicy.status
          )
            ? oldPolicy.status
            : "Pendente",

        notes:
          oldPolicy.notes ||
          "",

        feedback:
          oldPolicy.feedback ||
          "",

        feedbackUpdatedAt:
          oldPolicy.feedbackUpdatedAt ||
          null,

        alerts:
          oldPolicy.alerts || {
            30: true,
            15: true,
            7: true,
            1: true,
            expired: true
          },

        pdfPath:
          oldPolicy.pdfPath ||
          null,

        renewedFrom:
          oldPolicy.renewedFrom ||
          null,

        createdAt:
          oldPolicy.createdAt ||
          new Date()
            .toISOString(),

        updatedAt:
          new Date()
            .toISOString()

      };

      const {
        data,
        error
      } =
        await sb
          .from("policies")
          .insert(
            policyToDb(
              policy
            )
          )
          .select()
          .single();

      if (error) {
        throw error;
      }

      state.policies.push(
        policyFromDb(
          data
        )
      );

    }

    saveLocalCache();

    renderAll();

    if (status) {

      status.textContent =
        "Migração concluída com sucesso.";

    }

    toast(
      "Dados antigos migrados."
    );

  } catch (error) {

    console.error(
      "Erro na migração:",
      error
    );

    if (status) {

      status.textContent =
        "Não foi possível concluir a migração.";

    }

    toast(
      "Erro ao migrar dados."
    );

  }

}


/* ============================================================
   FEEDBACK COMERCIAL RÁPIDO NO KANBAN
   ============================================================ */

async function saveFeedback(
  id,
  value
) {

  const policy =
    policyById(id);

  if (!policy) {
    return;
  }

  const next =
    String(
      value || ""
    ).trim();

  if (
    String(
      policy.feedback || ""
    ) === next
  ) {
    return;
  }

  const updatedAt =
    new Date()
      .toISOString();

  try {

    const {
      error
    } =
      await sb
        .from("policies")
        .update({

          feedback:
            next || null,

          feedback_updated_at:
            updatedAt,

          updated_at:
            updatedAt

        })
        .eq(
          "id",
          id
        )
        .eq(
          "user_id",
          state.user.id
        );

    if (error) {
      throw error;
    }

    policy.feedback =
      next;

    policy.feedbackUpdatedAt =
      updatedAt;

    policy.updatedAt =
      updatedAt;

    saveLocalCache();

    try {

      await addEvent(
        id,
        "feedback",
        next
          ? "Feedback comercial atualizado."
          : "Feedback comercial removido."
      );

    } catch (eventError) {

      console.warn(
        eventError
      );

    }

    toast(
      "Feedback salvo."
    );

  } catch (error) {

    console.error(
      "Erro ao salvar feedback:",
      error
    );

    toast(
      "Não foi possível salvar o feedback."
    );

  }

}


/* ============================================================
   ALTERAR STATUS
   ============================================================ */

async function changeStatus(
  id,
  status
) {

  const allowed = [
    "Pendente",
    "Em andamento",
    "Ganho",
    "Perdido"
  ];

  if (
    !allowed.includes(
      status
    )
  ) {
    return;
  }

  const policy =
    policyById(id);

  if (!policy) {
    return;
  }

  if (
    policy.status ===
    status
  ) {
    return;
  }

  try {

    const updatedAt =
      new Date()
        .toISOString();

    const {
      data,
      error
    } =
      await sb
        .from("policies")
        .update({

          status,

          updated_at:
            updatedAt

        })
        .eq(
          "id",
          id
        )
        .eq(
          "user_id",
          state.user.id
        )
        .select()
        .single();

    if (error) {
      throw error;
    }

    const saved =
      policyFromDb(
        data
      );

    const index =
      state.policies
        .findIndex(
          item =>
            item.id === id
        );

    if (
      index >= 0
    ) {

      state.policies[index] =
        saved;

    }

    saveLocalCache();

    try {

      await addEvent(
        id,
        "status",
        `Status alterado para ${status}.`
      );

    } catch (eventError) {

      console.warn(
        eventError
      );

    }

    renderAll();

    if (
      $("#detailsModal")
        ?.classList
        .contains("show")
    ) {

      openDetails(id);

    }

    toast(
      `Status alterado para ${status}.`
    );

  } catch (error) {

    console.error(
      "Erro ao alterar status:",
      error
    );

    toast(
      "Não foi possível alterar o status."
    );

  }

}


/* ============================================================
   CPF / CNPJ AUTOMÁTICO
   ============================================================ */

function handleDocumentInput(
  event
) {

  const input =
    event.target;

  input.value =
    formatDocument(
      input.value
    );

}


/* ============================================================
   TELEFONE AUTOMÁTICO
   ============================================================ */

function handlePhoneInput(
  event
) {

  const input =
    event.target;

  input.value =
    formatPhone(
      input.value
    );

}


/* ============================================================
   LIMPAR FILTROS DE RENOVAÇÃO
   ============================================================ */

function clearRenewalDateFilters() {

  if (
    $("#renewalStartDateFilter")
  ) {

    $("#renewalStartDateFilter")
      .value = "";

  }

  if (
    $("#renewalEndDateFilter")
  ) {

    $("#renewalEndDateFilter")
      .value = "";

  }

  if (
    $("#commercialReportArea")
  ) {

    $("#commercialReportArea")
      .textContent = "";

  }

  renderKanban();

}


/* ============================================================
   RELATÓRIO NAS CONFIGURAÇÕES
   ============================================================ */

function settingsReport() {

  const output =
    $("#settingsReportOutput");

  if (!output) {
    return;
  }

  const total =
    state.policies.length;

  const pending =
    state.policies.filter(
      policy =>
        policy.status ===
        "Pendente"
    ).length;

  const progress =
    state.policies.filter(
      policy =>
        policy.status ===
        "Em andamento"
    ).length;

  const won =
    state.policies.filter(
      policy =>
        policy.status ===
        "Ganho"
    ).length;

  const lost =
    state.policies.filter(
      policy =>
        policy.status ===
        "Perdido"
    ).length;

  const expired =
    state.policies.filter(
      policy =>
        daysUntil(
          policy.endDate
        ) < 0
    ).length;

  const next7 =
    state.policies.filter(
      policy => {

        const days =
          daysUntil(
            policy.endDate
          );

        return (
          days >= 0 &&
          days <= 7
        );

      }
    ).length;

  const withoutFeedback =
    state.policies.filter(
      policy =>
        !String(
          policy.feedback ||
          ""
        ).trim()
    ).length;

  output.innerHTML = `

    <strong>
      Análise atual da carteira
    </strong>

    <br><br>

    Total de apólices:
    <b>${total}</b>

    <br>

    Pendentes:
    <b>${pending}</b>

    <br>

    Em andamento:
    <b>${progress}</b>

    <br>

    Ganhas:
    <b>${won}</b>

    <br>

    Perdidas:
    <b>${lost}</b>

    <br>

    Vencidas:
    <b>${expired}</b>

    <br>

    Vencem em até 7 dias:
    <b>${next7}</b>

    <br>

    Sem feedback comercial:
    <b>${withoutFeedback}</b>

  `;

}


/* ============================================================
   EVENTOS
   ============================================================ */

function setupEvents() {

  /* LOGIN */

  $("#loginForm")
    ?.addEventListener(
      "submit",
      login
    );

  $("#logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );

  $("#forgotPasswordBtn")
    ?.addEventListener(
      "click",
      forgotPassword
    );

  $("#recoverySaveBtn")
    ?.addEventListener(
      "click",
      saveRecoveryPassword
    );


  /* NAVEGAÇÃO */

  $$("[data-view]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            go(
              button.dataset.view
            )
        );

      }
    );


  /* FECHAR MODAIS */

  $$("[data-close]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            closeModal(
              button.dataset.close
            )
        );

      }
    );


  $$(".modal")
    .forEach(
      modal => {

        modal.addEventListener(
          "click",
          event => {

            if (
              event.target ===
              modal
            ) {

              closeModal(
                modal.id
              );

            }

          }
        );

      }
    );


  /* NOVO CLIENTE */

  $("#newClientBtn")
    ?.addEventListener(
      "click",
      newClient
    );

  $("#clientForm")
    ?.addEventListener(
      "submit",
      saveClient
    );


  /* CPF/CNPJ */

  $("#clientDoc")
    ?.addEventListener(
      "input",
      handleDocumentInput
    );


  /* TELEFONE */

  $("#clientPhone")
    ?.addEventListener(
      "input",
      handlePhoneInput
    );


  /* NOVA APÓLICE */

  $("#newPolicyBtn")
    ?.addEventListener(
      "click",
      () =>
        newPolicyFor()
    );

  $("#newPolicyBtn2")
    ?.addEventListener(
      "click",
      () =>
        newPolicyFor()
    );

  $("#policyForm")
    ?.addEventListener(
      "submit",
      savePolicy
    );


  /* DASHBOARD */

  $("#dashboardRefresh")
    ?.addEventListener(
      "click",
      async () => {

        await loadCloudData();

        renderAll();

        toast(
          "Dados atualizados."
        );

      }
    );


  /* CLIENTES */

  $("#clientSearch")
    ?.addEventListener(
      "input",
      renderClients
    );

  $("#clientFilter")
    ?.addEventListener(
      "change",
      renderClients
    );

  $("#clientStartDateFilter")
    ?.addEventListener(
      "change",
      renderClients
    );

  $("#clientEndDateFilter")
    ?.addEventListener(
      "change",
      renderClients
    );


  /* APÓLICES */

  $("#policySearch")
    ?.addEventListener(
      "input",
      renderPolicies
    );

  $("#statusFilter")
    ?.addEventListener(
      "change",
      renderPolicies
    );

  $("#expiryFilter")
    ?.addEventListener(
      "change",
      renderPolicies
    );

  $("#typeFilter")
    ?.addEventListener(
      "change",
      renderPolicies
    );

  $("#insurerFilter")
    ?.addEventListener(
      "change",
      renderPolicies
    );

  $("#policyStartDateFilter")
    ?.addEventListener(
      "change",
      renderPolicies
    );

  $("#policyEndDateFilter")
    ?.addEventListener(
      "change",
      renderPolicies
    );


  /* RENOVAÇÕES */

  $("#renewalStartDateFilter")
    ?.addEventListener(
      "change",
      renderKanban
    );

  $("#renewalEndDateFilter")
    ?.addEventListener(
      "change",
      renderKanban
    );

  $("#clearRenewalDates")
    ?.addEventListener(
      "click",
      clearRenewalDateFilters
    );

  $("#generateCommercialReport")
    ?.addEventListener(
      "click",
      showCommercialReport
    );


  /* RELATÓRIO */

  $("#generateReportBtn")
    ?.addEventListener(
      "click",
      showReport
    );

  $("#askReportBtn")
    ?.addEventListener(
      "click",
      askReportAssistant
    );

  $("#reportQuestion")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          event.preventDefault();

          askReportAssistant();

        }

      }
    );


  /* CONFIGURAÇÕES */

  $("#saveAccount")
    ?.addEventListener(
      "click",
      saveAccountSettings
    );

  $("#saveEmail")
    ?.addEventListener(
      "click",
      saveEmailSettings
    );

  $("#saveLanguage")
    ?.addEventListener(
      "click",
      saveLanguageSettings
    );

  $("#settingsReport")
    ?.addEventListener(
      "click",
      settingsReport
    );


  /* AGGER */

  $("#aggerFile")
    ?.addEventListener(
      "change",
      importAggerExcel
    );


  /* BACKUP */

  $("#exportData")
    ?.addEventListener(
      "click",
      exportBackup
    );

  $("#importData")
    ?.addEventListener(
      "change",
      importBackup
    );

  $("#clearData")
    ?.addEventListener(
      "click",
      clearAllData
    );


  /* MIGRAÇÃO */

  $("#migrateLocalBtn")
    ?.addEventListener(
      "click",
      migrateLocalData
    );

}


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

async function init() {

  setupEvents();

  /*
    Verifica se o Supabase carregou.
  */

  if (
    !window.supabase
  ) {

    console.error(
      "Supabase não foi carregado."
    );

    return;

  }

  try {

    /*
      Detecta recuperação de senha.
    */

    sb.auth.onAuthStateChange(
      async (
        event,
        session
      ) => {

        if (
          event ===
          "PASSWORD_RECOVERY"
        ) {

          showLogin();

          $("#loginForm")
            ?.classList
            .add("hidden");

          $("#recoveryPanel")
            ?.classList
            .remove("hidden");

          return;

        }

        if (
          event ===
          "SIGNED_OUT"
        ) {

          state.user =
            null;

          showLogin();

        }

      }
    );


    /*
      Recupera sessão existente.
    */

    const {
      data,
      error
    } =
      await sb.auth
        .getSession();

    if (error) {
      throw error;
    }

    const session =
      data.session;

    if (
      !session?.user
    ) {

      showLogin();

      return;

    }

    state.user =
      session.user;

    showApp();

    /*
      Primeiro tenta carregar
      banco online.
    */

    await loadCloudData();

    /*
      Depois renderiza.
      Se o Supabase falhar,
      loadCloudData mantém o cache
      em vez de zerar tudo.
    */

    renderAll();

    checkAutomation();

  } catch (error) {

    console.error(
      "Erro ao iniciar CRM:",
      error
    );

    /*
      Nunca zera a interface
      por causa de uma falha
      temporária do Supabase.
    */

    if (
      state.user
    ) {

      loadLocalCache();

      showApp();

      renderAll();

    } else {

      showLogin();

    }

  }

}


/* ============================================================
   FUNÇÕES GLOBAIS
   Necessárias para os botões gerados dinamicamente
   ============================================================ */
window.editClient =
  openClient;

window.deleteClient =
  deleteClient;

window.newPolicyFor =
  newPolicyFor;

window.editPolicy =
  editPolicy;

window.deletePolicy =
  deletePolicy;

window.openDetails =
  openDetails;

window.openPdf =
  openPdf;

window.renewPolicy =
  renewPolicy;

window.changeStatus =
  changeStatus;

window.manualWhatsApp =
  manualWhatsApp;

window.sendEmail =
  sendEmail;

window.saveFeedback =
  saveFeedback;

window.closeModal =
  closeModal;

window.openModal =
  openModal;

window.go =
  go;


/* ============================================================
   INICIAR SISTEMA
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  init
);

/* ============================================================
   DESFAZER ÚLTIMA IMPORTAÇÃO DO AGGER
   ============================================================ */

const SAVA_LAST_AGGER_IMPORT =
  "sava_last_agger_import";


function saveLastAggerImport(data) {

  localStorage.setItem(
    SAVA_LAST_AGGER_IMPORT,
    JSON.stringify({
      createdAt: new Date().toISOString(),
      clientIds: data.clientIds || [],
      policyIds: data.policyIds || []
    })
  );

}


function getLastAggerImport() {

  try {

    const raw =
      localStorage.getItem(
        SAVA_LAST_AGGER_IMPORT
      );

    return raw
      ? JSON.parse(raw)
      : null;

  } catch (error) {

    console.error(
      "Erro ao ler última importação:",
      error
    );

    return null;

  }

}


async function undoLastAggerImport() {

  const last =
    getLastAggerImport();

  if (
    !last ||
    (
      !last.clientIds?.length &&
      !last.policyIds?.length
    )
  ) {

    alert(
      "Não existe uma importação recente registrada para desfazer."
    );

    return;

  }


  const quantity =
    last.policyIds?.length || 0;


  const confirmed =
    confirm(
      `A última importação adicionou ${quantity} apólice(s).\n\nDeseja desfazer essa importação?\n\nSomente os registros criados por ela serão removidos.`
    );


  if (!confirmed) {
    return;
  }


  try {

    /*
      PRIMEIRO APAGA AS APÓLICES
    */

    if (
      last.policyIds?.length
    ) {

      const {
        error
      } =
        await sb
          .from("policies")
          .delete()
          .in(
            "id",
            last.policyIds
          )
          .eq(
            "user_id",
            state.user.id
          );

      if (error) {
        throw error;
      }

    }


    /*
      DEPOIS REMOVE APENAS CLIENTES
      QUE FORAM CRIADOS NA IMPORTAÇÃO
      E QUE FICARAM SEM APÓLICES.
    */

    if (
      last.clientIds?.length
    ) {

      for (
        const clientId
        of last.clientIds
      ) {

        const {
          data: remainingPolicies,
          error: checkError
        } =
          await sb
            .from("policies")
            .select(
              "id"
            )
            .eq(
              "client_id",
              clientId
            )
            .eq(
              "user_id",
              state.user.id
            )
            .limit(1);


        if (checkError) {
          throw checkError;
        }


        if (
          !remainingPolicies?.length
        ) {

          const {
            error: deleteClientError
          } =
            await sb
              .from("clients")
              .delete()
              .eq(
                "id",
                clientId
              )
              .eq(
                "user_id",
                state.user.id
              );


          if (
            deleteClientError
          ) {
            throw deleteClientError;
          }

        }

      }

    }


    localStorage.removeItem(
      SAVA_LAST_AGGER_IMPORT
    );


    await loadCloudData();

    renderAll();


    const status =
      $("#aggerImportStatus");


    if (status) {

      status.textContent =
        "Última importação desfeita com sucesso.";

    }


    toast(
      "Última importação do Agger desfeita."
    );


  } catch (error) {

    console.error(
      "Erro ao desfazer importação:",
      error
    );


    toast(
      "Não foi possível desfazer a importação."
    );

  }

}


/* BOTÃO */

$("#undoLastAggerImport")
  ?.addEventListener(
    "click",
    undoLastAggerImport
  );


