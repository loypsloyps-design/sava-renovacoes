/* =========================================================
   SAVA SEGUROS — CRM ONLINE
   Supabase Auth + Database + Storage
========================================================= */

const SUPABASE_URL =
  "https://txwgxpmgegntsnvamtda.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_IG_YmrreIPbgnt05gubpHw_CriLdyfV";

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   TIPOS DE SEGURO
========================================================= */

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


/* =========================================================
   SEGURADORAS
========================================================= */

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


/* =========================================================
   ESTADO
========================================================= */

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


/* =========================================================
   ATALHOS
========================================================= */

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  [...document.querySelectorAll(selector)];


/* =========================================================
   FUNÇÕES BÁSICAS
========================================================= */

const uid = () =>
  crypto.randomUUID();


const cleanPhone = value =>
  String(value || "")
    .replace(/\D/g, "");


const esc = value =>
  String(value ?? "")
    .replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character])
    );


const fmtDate = date => {

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


const iso = date => {

  const value =
    new Date(date);

  return new Date(
    value.getTime() -
    value.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

};


/* =========================================================
   UUID
========================================================= */

function validUuid(value) {

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(
      String(value || "")
    );

}


/* =========================================================
   VENCIMENTO
========================================================= */

const daysUntil = date => {

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
    (target - current) /
    86400000
  );

};


/* =========================================================
   INICIAIS
========================================================= */

const initials = name =>
  (name || "?")
    .split(" ")
    .slice(0, 2)
    .map(
      item =>
        item[0]
    )
    .join("")
    .toUpperCase();


/* =========================================================
   TELEFONE
========================================================= */

function validBrazilPhone(value) {

  const phone =
    cleanPhone(value);

  if (
    phone.length !== 10 &&
    phone.length !== 11
  ) {
    return false;
  }

  if (
    /^(\d)\1+$/.test(phone)
  ) {
    return false;
  }

  if (
    /^0/.test(phone) ||
    /^1/.test(phone)
  ) {
    return false;
  }

  return /^[1-9]{2}9?[2-9]\d{7}$/
    .test(phone);

}


function formatPhone(value) {

  const phone =
    cleanPhone(value);

  if (
    phone.length === 11
  ) {

    return (
      `(${phone.slice(0, 2)}) ` +
      `${phone.slice(2, 7)}-` +
      `${phone.slice(7)}`
    );

  }

  if (
    phone.length === 10
  ) {

    return (
      `(${phone.slice(0, 2)}) ` +
      `${phone.slice(2, 6)}-` +
      `${phone.slice(6)}`
    );

  }

  return phone;

}


/* =========================================================
   LOCALIZAR CLIENTE / APÓLICE
========================================================= */

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


/* =========================================================
   STATUS
========================================================= */

function processClass(status) {

  if (
    status === "Ganho"
  ) {
    return "green";
  }

  if (
    status === "Em andamento"
  ) {
    return "orange";
  }

  return "gray";

}


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


/* =========================================================
   TOAST
========================================================= */

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
      () => {
        element.classList.remove(
          "show"
        );
      },
      3200
    );

}


/* =========================================================
   LOGIN / TELAS
========================================================= */

function showLogin() {

  $("#loginScreen")
    .classList
    .remove(
      "hidden"
    );

  $("#app")
    .classList
    .add(
      "hidden"
    );

  if (
    $("#recoveryScreen")
  ) {
    $("#recoveryScreen")
      .classList
      .add(
        "hidden"
      );
  }

}


function showApp() {

  $("#loginScreen")
    .classList
    .add(
      "hidden"
    );

  $("#app")
    .classList
    .remove(
      "hidden"
    );

  if (
    $("#recoveryScreen")
  ) {
    $("#recoveryScreen")
      .classList
      .add(
        "hidden"
      );
  }

}


function showRecovery() {

  $("#loginScreen")
    .classList
    .add(
      "hidden"
    );

  $("#app")
    .classList
    .add(
      "hidden"
    );

  if (
    $("#recoveryScreen")
  ) {
    $("#recoveryScreen")
      .classList
      .remove(
        "hidden"
      );
  }

}


/* =========================================================
   CLIENTE — BANCO → CRM
========================================================= */

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


/* =========================================================
   CLIENTE — CRM → BANCO
========================================================= */

function clientToDb(client) {

  return {
    id:
      client.id,

    user_id:
      state.user.id,

    name:
      client.name,

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


/* =========================================================
   APÓLICE — BANCO → CRM
========================================================= */

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
      row.status ||
      "Pendente",

    notes:
      row.notes || "",

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


/* =========================================================
   APÓLICE — CRM → BANCO
========================================================= */

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


/* =========================================================
   EVENTOS
========================================================= */

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


function eventToDb(event) {

  return {
    id:
      event.id,

    user_id:
      state.user.id,

    policy_id:
      event.policyId,

    type:
      event.type || "history",

    message:
      event.message,

    created_at:
      event.date ||
      new Date().toISOString()
  };

}


/* =========================================================
   CRIAR EVENTO
========================================================= */

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

    type:
      type,

    message:
      message,

    created_at:
      new Date()
        .toISOString()
  };


  const {
    data,
    error
  } =
    await sb
      .from(
        "events"
      )
      .insert(
        row
      )
      .select()
      .single();


  if (error) {
    throw error;
  }


  const event =
    eventFromDb(
      data
    );


  state.events.push(
    event
  );


  return event;

}


/* =========================================================
   CARREGAR DADOS DO SUPABASE
========================================================= */

async function loadCloudData() {

  if (
    !state.user
  ) {
    return;
  }


  try {

    const [
      clientsResult,
      policiesResult,
      eventsResult,
      settingsResult
    ] =
      await Promise.all([

        sb
          .from(
            "clients"
          )
          .select("*")
          .order(
            "name"
          ),

        sb
          .from(
            "policies"
          )
          .select("*")
          .order(
            "end_date"
          ),

        sb
          .from(
            "events"
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false
            }
          ),

        sb
          .from(
            "settings"
          )
          .select("*")
          .maybeSingle()

      ]);


    for (
      const result
      of [
        clientsResult,
        policiesResult,
        eventsResult,
        settingsResult
      ]
    ) {

      if (
        result.error
      ) {
        throw result.error;
      }

    }


    state.clients =
      (
        clientsResult.data ||
        []
      )
        .map(
          clientFromDb
        );


    state.policies =
      (
        policiesResult.data ||
        []
      )
        .map(
          policyFromDb
        );


    state.events =
      (
        eventsResult.data ||
        []
      )
        .map(
          eventFromDb
        );


    if (
      settingsResult.data
    ) {

      state.settings = {
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
      };

    }
    else {

      state.settings = {
        endpoint: "",
        managerEmail: "",
        language:
          "pt-BR"
      };

    }


    renderAll();

  }
  catch (error) {

    console.error(
      "Erro ao carregar dados:",
      error
    );

    toast(
      "Não foi possível carregar os dados do Supabase."
    );

  }

}


/* =========================================================
   SALVAR CONFIGURAÇÕES
========================================================= */

async function saveSettings() {

  if (
    !state.user
  ) {
    return;
  }


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
      .from(
        "settings"
      )
      .upsert(
        payload,
        {
          onConflict:
            "user_id"
        }
      );


  if (error) {
    throw error;
  }

}


/* =========================================================
   PREENCHER SELECTS
========================================================= */

function populateSelects() {

  const typeFilter =
    $("#typeFilter");

  const insurerFilter =
    $("#insurerFilter");

  const policyType =
    $("#policyType");

  const policyInsurer =
    $("#policyInsurer");

  const policyClient =
    $("#policyClient");


  if (
    !typeFilter ||
    !insurerFilter ||
    !policyType ||
    !policyInsurer ||
    !policyClient
  ) {
    return;
  }


  policyType.innerHTML =
    TYPES
      .map(
        type =>
          `<option>${esc(type)}</option>`
      )
      .join("");


  policyInsurer.innerHTML =
    INSURERS
      .map(
        insurer =>
          `<option>${esc(insurer)}</option>`
      )
      .join("");


  typeFilter.innerHTML =
    `<option value="all">Todos os tipos</option>` +
    TYPES
      .map(
        type =>
          `<option>${esc(type)}</option>`
      )
      .join("");


  insurerFilter.innerHTML =
    `<option value="all">Todas as seguradoras</option>` +
    INSURERS
      .map(
        insurer =>
          `<option>${esc(insurer)}</option>`
      )
      .join("");


  policyClient.innerHTML =
    `<option value="">Selecione...</option>` +
    [...state.clients]
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      )
      .map(
        client =>
          `<option value="${client.id}">${esc(client.name)}</option>`
      )
      .join("");

}


/* =========================================================
   RENDERIZAR SISTEMA
========================================================= */

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

}/* =========================================================
   DASHBOARD
========================================================= */

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


  const upcoming =
    [...state.policies]
      .filter(
        policy => {

          const days =
            daysUntil(
              policy.endDate
            );

          return (
            days <= 30
          );

        }
      )
      .sort(
        (a, b) =>
          new Date(
            a.endDate
          ) -
          new Date(
            b.endDate
          )
      )
      .slice(
        0,
        8
      );


  if ($("#upcomingList")) {

    $("#upcomingList").innerHTML =
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
                        ${esc(
                          policy.type
                        )}
                        ·
                        ${esc(
                          policy.insurer
                        )}
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
                        ${expiry.text}
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
      won

  };


  const max =
    Math.max(
      total,
      1
    );


  if ($("#processSummary")) {

    $("#processSummary").innerHTML =
      Object
        .entries(
          counts
        )
        .map(
          ([status, value]) => `

            <div class="process-line">

              <div class="line-top">

                <span>
                  ${status}
                </span>

                <b>
                  ${value}
                </b>

              </div>


              <div
                class="bar ${
                  status === "Pendente"
                    ? "pendente"
                    : status === "Ganho"
                      ? "ganho"
                      : "andamento"
                }"
              >

                <i
                  style="width:${value / max * 100}%"
                ></i>

              </div>

            </div>
          `
        )
        .join("");

  }


  const insurerCounts = {};


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
        ) + 1;

    }
  );


  const topInsurers =
    Object
      .entries(
        insurerCounts
      )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(
        0,
        10
      );


  if ($("#insurerSummary")) {

    $("#insurerSummary").innerHTML =
      topInsurers.length
        ? topInsurers
            .map(
              ([insurer, value]) => `

                <div class="insurer-chip">

                  <strong>
                    ${value}
                  </strong>

                  <span>
                    ${esc(
                      insurer
                    )}
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


/* =========================================================
   CLIENTES
========================================================= */

function renderClients() {

  const search =
    (
      $("#clientSearch")
        ?.value ||
      ""
    )
      .toLowerCase();


  const filter =
    $("#clientFilter")
      ?.value ||
    "all";


  const clients =
    state.clients.filter(
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


        return [
          client.name,
          client.document,
          client.phone,
          client.email
        ]
          .join(" ")
          .toLowerCase()
          .includes(
            search
          );

      }
    );


  if (!$("#clientsGrid")) {
    return;
  }


  $("#clientsGrid").innerHTML =
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
                          ${fmtDate(
                            client.birthDate
                          )}
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
                      ${esc(
                        formatPhone(
                          client.phone
                        ) ||
                        "Sem telefone"
                      )}
                    </span>


                    <span>
                      ✉
                      ${esc(
                        client.email ||
                        "Sem e-mail"
                      )}
                    </span>


                    <span>
                      ▣
                      ${esc(
                        client.document ||
                        "Documento não informado"
                      )}
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
                              + ${policies.length - 5}
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
          )
          .join("")
      : `
          <div class="empty">
            Nenhum cliente encontrado.
          </div>
        `;

}


/* =========================================================
   APÓLICES
========================================================= */

function renderPolicies() {

  const search =
    (
      $("#policySearch")
        ?.value ||
      ""
    )
      .toLowerCase();


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
              policy.type
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
            statusFilter !== "all" &&
            policy.status !== statusFilter
          ) {
            return false;
          }


          if (
            typeFilter !== "all" &&
            policy.type !== typeFilter
          ) {
            return false;
          }


          if (
            insurerFilter !== "all" &&
            policy.insurer !== insurerFilter
          ) {
            return false;
          }


          const days =
            daysUntil(
              policy.endDate
            );


          if (
            expiryFilter === "expired" &&
            days >= 0
          ) {
            return false;
          }


          if (
            expiryFilter !== "all" &&
            expiryFilter !== "expired" &&
            !(
              days >= 0 &&
              days <= Number(
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
          new Date(
            a.endDate
          ) -
          new Date(
            b.endDate
          )
      );


  if (!$("#policiesTable")) {
    return;
  }


  $("#policiesTable").innerHTML =
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

                        <small
                          style="
                            display:block;
                            color:#667085;
                          "
                        >
                          ${esc(
                            formatPhone(
                              client?.phone
                            ) ||
                            ""
                          )}
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
                        color:#667085;
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


/* =========================================================
   KANBAN
========================================================= */

function renderKanban() {

  if (!$("#kanban")) {
    return;
  }


  const columns = [
    "Pendente",
    "Em andamento",
    "Ganho"
  ];


  $("#kanban").innerHTML =
    columns
      .map(
        status => {

          const policies =
            state.policies.filter(
              policy =>
                policy.status ===
                status
            );


          return `
            <div
              class="
                kanban-col
                ${
                  status === "Pendente"
                    ? "pendente"
                    : status === "Ganho"
                      ? "ganho"
                      : "andamento"
                }
              "
            >

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
                  ? policies
                      .map(
                        policy => {

                          const client =
                            clientById(
                              policy.clientId
                            );


                          return `
                            <div class="kanban-card">

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

                                Vence:

                                ${fmtDate(
                                  policy.endDate
                                )}

                              </small>


                              <select
                                onchange="changeStatus('${policy.id}', this.value)"
                              >

                                <option
                                  ${
                                    policy.status === "Pendente"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Pendente
                                </option>

                                <option
                                  ${
                                    policy.status === "Em andamento"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Em andamento
                                </option>

                                <option
                                  ${
                                    policy.status === "Ganho"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Ganho
                                </option>

                              </select>

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


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

function renderConfig() {

  if ($("#cfgUser")) {

    $("#cfgUser").value =
      state.user?.email ||
      "";

  }


  if ($("#emailEndpoint")) {

    $("#emailEndpoint").value =
      state.settings.endpoint ||
      "";

  }


  if ($("#managerEmail")) {

    $("#managerEmail").value =
      state.settings.managerEmail ||
      "";

  }


  if ($("#languageSelect")) {

    $("#languageSelect").value =
      state.settings.language ||
      "pt-BR";

  }


  if ($("#cloudStatus")) {

    $("#cloudStatus").textContent =
      state.user
        ? "● Supabase conectado e autenticado."
        : "Supabase desconectado.";

  }

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

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


  if (!target) {
    return;
  }


  target.classList.add(
    "active"
  );


  $$(".nav-item")
    .forEach(
      button =>
        button.classList.toggle(
          "active",
          button.dataset.view ===
            view
        )
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


  if ($("#pageTitle")) {

    $("#pageTitle").textContent =
      titles[view] ||
      "Dashboard";

  }


  if (
    view === "dashboard"
  ) {

    renderDashboard();

  }

}


/* =========================================================
   MODAIS
========================================================= */

function openModal(id) {

  const element =
    $("#" + id);

  if (!element) {
    return;
  }

  element.classList.add(
    "open"
  );

}


function closeModal(id) {

  const element =
    $("#" + id);

  if (element) {

    element.classList.remove(
      "open"
    );

  }


  if (
    id === "pdfModal" &&
    $("#pdfFrame")
  ) {

    $("#pdfFrame").src =
      "";

  }

}


/* =========================================================
   NOVO CLIENTE
========================================================= */

function newClient() {

  if (
    !$("#clientForm")
  ) {
    return;
  }


  $("#clientForm")
    .reset();


  $("#clientId").value =
    "";


  $("#clientModalTitle").textContent =
    "Novo cliente";


  openModal(
    "clientModal"
  );

}


/* =========================================================
   EDITAR CLIENTE
========================================================= */

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


  $("#clientBirth").value =
    client.birthDate ||
    "";


  $("#clientPhone").value =
    formatPhone(
      client.phone
    );


  $("#clientDoc").value =
    client.document ||
    "";


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


/* =========================================================
   SALVAR CLIENTE
========================================================= */

async function saveClient(event) {

  event.preventDefault();


  if (!state.user) {

    toast(
      "Sua sessão expirou. Entre novamente."
    );

    return;

  }


  const phone =
    cleanPhone(
      $("#clientPhone").value
    );


  if (
    !validBrazilPhone(
      phone
    )
  ) {

    toast(
      "Informe um telefone válido com DDD."
    );

    return;

  }


  const oldId =
    $("#clientId").value;


  const id =
    oldId ||
    uid();


  const existing =
    oldId
      ? clientById(
          oldId
        )
      : null;


  const client = {
    id:
      id,

    name:
      $("#clientName")
        .value
        .trim(),

    birthDate:
      $("#clientBirth")
        .value,

    phone:
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
      existing?.createdAt ||
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString()
  };


  if (!client.name) {

    toast(
      "Informe o nome do cliente."
    );

    return;

  }


  try {

    const {
      data,
      error
    } =
      await sb
        .from(
          "clients"
        )
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

    }
    else {

      state.clients.push(
        saved
      );

    }


    closeModal(
      "clientModal"
    );


    renderAll();


    toast(
      "Cliente salvo na nuvem com sucesso."
    );

  }
  catch (error) {

    console.error(
      "Erro ao salvar cliente:",
      error
    );


    toast(
      "Não foi possível salvar o cliente."
    );

  }

}


/* =========================================================
   RESET DO FORMULÁRIO DE APÓLICE
========================================================= */

function resetPolicyForm(
  clientId = ""
) {

  if (
    !$("#policyForm")
  ) {
    return;
  }


  $("#policyForm")
    .reset();


  $("#policyId").value =
    "";


  if ($("#policyParentId")) {

    $("#policyParentId").value =
      "";

  }


  if ($("#policyRenewedFrom")) {

    $("#policyRenewedFrom").value =
      "";

  }


  if ($("#currentPdfName")) {

    $("#currentPdfName").textContent =
      "";

  }


  if ($("#renewInfo")) {

    $("#renewInfo")
      .classList
      .add(
        "hidden"
      );

  }


  populateSelects();


  $("#policyClient").value =
    clientId;


  $("#policyStatus").value =
    "Pendente";


  $("#policyModalTitle").textContent =
    "Nova apólice";

}


/* =========================================================
   NOVA APÓLICE
========================================================= */

function newPolicyFor(
  clientId = ""
) {

  resetPolicyForm(
    clientId
  );


  openModal(
    "policyModal"
  );

}


/* =========================================================
   EDITAR APÓLICE
========================================================= */

function editPolicy(id) {

  const policy =
    policyById(id);


  if (!policy) {
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
    policy.number;


  $("#policyStart").value =
    policy.startDate;


  $("#policyEnd").value =
    policy.endDate;


  $("#policyStatus").value =
    policy.status;


  $("#policyNotes").value =
    policy.notes ||
    "";


  $("#alert30").checked =
    policy.alerts?.[30] !== false;


  $("#alert15").checked =
    policy.alerts?.[15] !== false;


  $("#alert7").checked =
    policy.alerts?.[7] !== false;


  $("#alert1").checked =
    policy.alerts?.[1] !== false;


  $("#alertExpired").checked =
    policy.alerts?.expired !== false;


  if (
    policy.pdfPath &&
    $("#currentPdfName")
  ) {

    const fileName =
      policy.pdfPath
        .split("/")
        .pop();


    $("#currentPdfName").textContent =
      "PDF atual: " +
      decodeURIComponent(
        fileName ||
        "anexo.pdf"
      );

  }


  $("#policyModalTitle").textContent =
    "Editar apólice";


  openModal(
    "policyModal"
  );

}


/* =========================================================
   NOME SEGURO PARA PDF
========================================================= */

function safeFileName(name) {

  return String(
    name ||
    "apolice.pdf"
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

}


/* =========================================================
   UPLOAD DE PDF
========================================================= */

async function uploadPolicyPdf(
  policyId,
  file
) {

  if (!state.user) {

    throw new Error(
      "Usuário não autenticado."
    );

  }


  const name =
    safeFileName(
      file.name
    );


  const path =
    `${state.user.id}/${policyId}/${Date.now()}-${name}`;


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


/* =========================================================
   REMOVER PDF
========================================================= */

async function removePolicyPdf(
  path
) {

  if (!path) {
    return;
  }


  const {
    error
  } =
    await sb
      .storage
      .from(
        "policy-pdfs"
      )
      .remove(
        [path]
      );


  if (error) {
    throw error;
  }

}


/* =========================================================
   SALVAR APÓLICE
========================================================= */

async function savePolicy(event) {

  event.preventDefault();


  if (!state.user) {

    toast(
      "Sua sessão expirou. Entre novamente."
    );

    return null;

  }


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


  const policyId =
    oldId ||
    uid();


  let pdfPath =
    existing?.pdfPath ||
    null;


  const file =
    $("#policyPdf")
      ?.files?.[0];


  let newPdfPath =
    null;


  try {

    if (file) {

      if (
        file.type !==
        "application/pdf"
      ) {

        toast(
          "O anexo precisa ser PDF."
        );

        return null;

      }


      newPdfPath =
        await uploadPolicyPdf(
          policyId,
          file
        );


      pdfPath =
        newPdfPath;

    }


    const policy = {
      id:
        policyId,

      clientId:
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

      startDate:
        startDate,

      endDate:
        endDate,

      status:
        $("#policyStatus")
          .value,

      notes:
        $("#policyNotes")
          .value
          .trim(),

      alerts: {
        30:
          $("#alert30")
            .checked,

        15:
          $("#alert15")
            .checked,

        7:
          $("#alert7")
            .checked,

        1:
          $("#alert1")
            .checked,

        expired:
          $("#alertExpired")
            .checked
      },

      pdfPath:
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

    }
    else {

      state.policies.push(
        saved
      );

    }


    if (
      newPdfPath &&
      existing?.pdfPath &&
      existing.pdfPath !==
        newPdfPath
    ) {

      try {

        await removePolicyPdf(
          existing.pdfPath
        );

      }
      catch (error) {

        console.warn(
          "PDF antigo não pôde ser removido:",
          error
        );

      }

    }


    await addEvent(
      saved.id,
      oldId
        ? "edit"
        : "created",
      oldId
        ? "Apólice atualizada"
        : "Apólice cadastrada"
    );


    closeModal(
      "policyModal"
    );


    renderAll();


    toast(
      "Apólice salva na nuvem com sucesso."
    );


    return saved;

  }
  catch (error) {

    console.error(
      "Erro ao salvar apólice:",
      error
    );


    if (newPdfPath) {

      try {

        await removePolicyPdf(
          newPdfPath
        );

      }
      catch {}

    }


    toast(
      "Não foi possível salvar a apólice."
    );


    return null;

  }

}


/* =========================================================
   ALTERAR STATUS
========================================================= */

async function changeStatus(
  id,
  status
) {

  const policy =
    policyById(id);


  if (!policy) {
    return;
  }


  try {

    const {
      error
    } =
      await sb
        .from(
          "policies"
        )
        .update({
          status:
            status,

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "id",
          id
        );


    if (error) {
      throw error;
    }


    policy.status =
      status;


    policy.updatedAt =
      new Date()
        .toISOString();


    await addEvent(
      id,
      "status",
      `Status alterado para ${status}`
    );


    renderAll();


    toast(
      "Status atualizado."
    );

  }
  catch (error) {

    console.error(
      "Erro ao atualizar status:",
      error
    );


    toast(
      "Não foi possível atualizar o status."
    );

  }

} /* =========================================================
   DETALHES DA APÓLICE
========================================================= */

function openDetails(id) {

  const policy =
    policyById(id);

  if (!policy) {
    return;
  }

  const client =
    clientById(
      policy.clientId
    );

  const expiry =
    expiryLabel(policy);

  const history =
    state.events
      .filter(
        event =>
          event.policyId === id
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );

  if ($("#detailsContent")) {

    $("#detailsContent").innerHTML = `

      <div class="details-grid">

        <div>
          <small>Cliente</small>
          <strong>
            ${esc(client?.name || "Cliente")}
          </strong>
        </div>

        <div>
          <small>Telefone / WhatsApp</small>
          <strong>
            ${esc(formatPhone(client?.phone) || "—")}
          </strong>
        </div>

        <div>
          <small>CPF / CNPJ</small>
          <strong>
            ${esc(client?.document || "—")}
          </strong>
        </div>

        <div>
          <small>E-mail</small>
          <strong>
            ${esc(client?.email || "—")}
          </strong>
        </div>

        <div>
          <small>Tipo de seguro</small>
          <strong>
            ${esc(policy.type)}
          </strong>
        </div>

        <div>
          <small>Seguradora</small>
          <strong>
            ${esc(policy.insurer)}
          </strong>
        </div>

        <div>
          <small>Número da apólice</small>
          <strong>
            ${esc(policy.number || "—")}
          </strong>
        </div>

        <div>
          <small>Vigência</small>
          <strong>
            ${fmtDate(policy.startDate)}
            →
            ${fmtDate(policy.endDate)}
          </strong>
        </div>

        <div>
          <small>Status do processo</small>
          <strong>
            <span class="pill ${processClass(policy.status)}">
              ${esc(policy.status)}
            </span>
          </strong>
        </div>

        <div>
          <small>Situação</small>
          <strong>
            <span class="pill ${expiry.cls}">
              ${expiry.text}
            </span>
          </strong>
        </div>

      </div>

      ${
        policy.notes
          ? `
            <div style="margin-top:20px">
              <small>Observações da apólice</small>
              <p>${esc(policy.notes)}</p>
            </div>
          `
          : ""
      }

      ${
        client?.notes
          ? `
            <div style="margin-top:20px">
              <small>Observações do cliente</small>
              <p>${esc(client.notes)}</p>
            </div>
          `
          : ""
      }

      <div
        class="actions"
        style="
          margin-top:20px;
          flex-wrap:wrap;
        "
      >

        <button
          class="action-btn"
          onclick="editPolicy('${policy.id}'); closeModal('detailsModal')"
        >
          Editar
        </button>

        <button
          class="action-btn"
          onclick="renewPolicy('${policy.id}'); closeModal('detailsModal')"
        >
          ↻ Renovar
        </button>

        ${
          policy.pdfPath
            ? `
                <button
                  class="action-btn"
                  onclick="openPdf('${policy.id}')"
                >
                  Ver PDF
                </button>
              `
            : ""
        }

        ${
          client?.phone
            ? `
                <button
                  class="action-btn"
                  onclick="openWhatsApp('${client.id}', '${policy.id}')"
                >
                  WhatsApp
                </button>
              `
            : ""
        }

        <button
          class="action-btn"
          style="
            color:#b42318;
            border-color:#fecdca;
            background:#fff5f5;
          "
          onclick="askDeletePolicy('${policy.id}')"
        >
          🗑 Excluir apólice
        </button>

      </div>

      <div style="margin-top:25px">

        <h4>Histórico</h4>

        <div class="history-list">

          ${
            history.length
              ? history
                  .map(
                    event => `

                      <div class="history-item">

                        <div>

                          <strong>
                            ${esc(event.message)}
                          </strong>

                          <small>
                            ${new Date(event.date)
                              .toLocaleString("pt-BR")}
                          </small>

                        </div>

                      </div>
                    `
                  )
                  .join("")
              : `
                  <div class="empty">
                    Nenhum evento registrado.
                  </div>
                `
          }

        </div>

      </div>
    `;

  }

  openModal(
    "detailsModal"
  );

}


/* =========================================================
   ABRIR PDF
========================================================= */

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
        .from("policy-pdfs")
        .createSignedUrl(
          policy.pdfPath,
          600
        );

    if (error) {
      throw error;
    }

    if (
      !data?.signedUrl
    ) {
      throw new Error(
        "URL do PDF não foi criada."
      );
    }

    if ($("#pdfFrame")) {

      $("#pdfFrame").src =
        data.signedUrl;

      openModal(
        "pdfModal"
      );

    }
    else {

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );

    }

  }
  catch (error) {

    console.error(
      "Erro ao abrir PDF:",
      error
    );

    toast(
      "Não foi possível abrir o PDF."
    );

  }

}


/* =========================================================
   WHATSAPP
========================================================= */

function openWhatsApp(
  clientId,
  policyId
) {

  const client =
    clientById(clientId);

  const policy =
    policyById(policyId);

  if (
    !client ||
    !policy
  ) {
    return;
  }

  let phone =
    cleanPhone(
      client.phone
    );

  if (!phone) {

    toast(
      "Cliente sem WhatsApp cadastrado."
    );

    return;
  }

  if (
    !phone.startsWith("55")
  ) {
    phone =
      "55" + phone;
  }

  const message =
    `Olá, ${client.name}! ` +
    `Estamos entrando em contato pela SAVA Seguros ` +
    `sobre sua apólice de ${policy.type}, ` +
    `com vencimento em ${fmtDate(policy.endDate)}.`;

  const url =
    "https://wa.me/" +
    phone +
    "?text=" +
    encodeURIComponent(
      message
    );

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}


/* =========================================================
   RENOVAR APÓLICE
========================================================= */

function renewPolicy(id) {

  const old =
    policyById(id);

  if (!old) {
    return;
  }

  resetPolicyForm(
    old.clientId
  );

  if ($("#policyParentId")) {

    $("#policyParentId").value =
      old.id;

  }

  if ($("#policyRenewedFrom")) {

    $("#policyRenewedFrom").value =
      old.id;

  }

  $("#policyInsurer").value =
    old.insurer;

  $("#policyType").value =
    old.type;

  $("#policyNumber").value =
    "";

  $("#policyStatus").value =
    "Pendente";

  $("#policyNotes").value =
    old.notes || "";

  $("#alert30").checked =
    old.alerts?.[30] !== false;

  $("#alert15").checked =
    old.alerts?.[15] !== false;

  $("#alert7").checked =
    old.alerts?.[7] !== false;

  $("#alert1").checked =
    old.alerts?.[1] !== false;

  $("#alertExpired").checked =
    old.alerts?.expired !== false;

  if ($("#renewInfo")) {

    $("#renewInfo")
      .classList
      .remove(
        "hidden"
      );

    $("#renewInfo").innerHTML =
      `Renovação da apólice <strong>${esc(old.number || old.type)}</strong>. ` +
      `A apólice anterior será preservada no histórico.`;

  }

  if ($("#policyModalTitle")) {

    $("#policyModalTitle").textContent =
      "Renovar apólice";

  }

  openModal(
    "policyModal"
  );

}


/* =========================================================
   FINALIZAR RENOVAÇÃO
========================================================= */

async function finalizeRenewal(
  oldId,
  newId
) {

  const old =
    policyById(oldId);

  if (!old) {
    return;
  }

  try {

    const {
      error
    } =
      await sb
        .from("policies")
        .update({
          status:
            "Ganho",

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "id",
          oldId
        );

    if (error) {
      throw error;
    }

    old.status =
      "Ganho";

    old.updatedAt =
      new Date()
        .toISOString();

    await addEvent(
      oldId,
      "renewal",
      "Apólice renovada; novo ciclo criado"
    );

    await addEvent(
      newId,
      "renewal",
      "Nova apólice criada a partir da renovação"
    );

  }
  catch (error) {

    console.error(
      "Erro ao finalizar renovação:",
      error
    );

    toast(
      "A nova apólice foi salva, mas houve erro ao atualizar o histórico da renovação."
    );

  }

}


/* =========================================================
   EXCLUSÃO — MODAL PERSONALIZADO
========================================================= */

let deleteAction = null;


function openDeleteModal(
  title,
  message,
  action
) {

  deleteAction =
    action;

  if ($("#deleteTitle")) {

    $("#deleteTitle").textContent =
      title;

  }

  if ($("#deleteMessage")) {

    $("#deleteMessage").textContent =
      message;

  }

  openModal(
    "deleteModal"
  );

}


function closeDeleteModal() {

  deleteAction =
    null;

  closeModal(
    "deleteModal"
  );

}


/* =========================================================
   SOLICITAR EXCLUSÃO DA APÓLICE
========================================================= */

function askDeletePolicy(id) {

  const policy =
    policyById(id);

  if (!policy) {
    return;
  }

  const client =
    clientById(
      policy.clientId
    );

  openDeleteModal(
    "Excluir apólice",
    `Deseja realmente excluir a apólice de ${client?.name || "Cliente"}? O PDF e o histórico dessa apólice também serão excluídos.`,
    async () => {

      await deletePolicy(id);

    }
  );

}


/* =========================================================
   EXCLUIR APÓLICE
========================================================= */

async function deletePolicy(id) {

  const policy =
    policyById(id);

  if (!policy) {
    return;
  }

  try {

    /*
      Antes de apagar a apólice,
      remove referências de renovação
      de outras apólices.
    */

    const {
      error: renewalError
    } =
      await sb
        .from("policies")
        .update({
          renewed_from:
            null,

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "renewed_from",
          id
        );

    if (renewalError) {
      throw renewalError;
    }


    /*
      Exclui os eventos.
    */

    const {
      error: eventsError
    } =
      await sb
        .from("events")
        .delete()
        .eq(
          "policy_id",
          id
        );

    if (eventsError) {
      throw eventsError;
    }


    /*
      Exclui o PDF do Storage.
    */

    if (
      policy.pdfPath
    ) {

      try {

        await removePolicyPdf(
          policy.pdfPath
        );

      }
      catch (error) {

        console.warn(
          "Não foi possível remover o PDF:",
          error
        );

      }

    }


    /*
      Exclui a apólice.
    */

    const {
      error: policyError
    } =
      await sb
        .from("policies")
        .delete()
        .eq(
          "id",
          id
        );

    if (policyError) {
      throw policyError;
    }


    /*
      Atualiza os dados locais.
    */

    state.policies =
      state.policies
        .filter(
          item =>
            item.id !== id
        )
        .map(
          item => {

            if (
              item.renewedFrom === id
            ) {

              return {
                ...item,
                renewedFrom:
                  null
              };

            }

            return item;

          }
        );


    state.events =
      state.events.filter(
        event =>
          event.policyId !== id
      );


    closeDeleteModal();

    closeModal(
      "detailsModal"
    );

    renderAll();

    toast(
      "Apólice excluída."
    );

  }
  catch (error) {

    console.error(
      "Erro ao excluir apólice:",
      error
    );

    closeDeleteModal();

    toast(
      "Não foi possível excluir a apólice."
    );

  }

}


/* =========================================================
   EXCLUIR CLIENTE
========================================================= */

function deleteClient(id) {

  const client =
    clientById(id);

  if (!client) {
    return;
  }

  const policies =
    state.policies.filter(
      policy =>
        policy.clientId === id
    );

  /*
    Cliente com apólice NÃO pode
    ser excluído.
  */

  if (
    policies.length
  ) {

    openDeleteModal(
      "Cliente possui apólices",
      `Não é possível excluir ${client.name}. Este cliente possui ${policies.length} apólice(s). Exclua primeiro as apólices vinculadas ao cliente.`,
      () => {
        closeDeleteModal();
      }
    );

    return;
  }

  openDeleteModal(
    "Excluir cliente",
    `Deseja realmente excluir ${client.name}?`,
    async () => {

      try {

        const {
          error
        } =
          await sb
            .from("clients")
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

        closeDeleteModal();

        renderAll();

        toast(
          "Cliente excluído."
        );

      }
      catch (error) {

        console.error(
          "Erro ao excluir cliente:",
          error
        );

        closeDeleteModal();

        toast(
          "Não foi possível excluir o cliente."
        );

      }

    }
  );

}


/* =========================================================
   CONFIRMAR EXCLUSÃO
========================================================= */

async function confirmDelete() {

  if (
    typeof deleteAction !==
    "function"
  ) {

    closeDeleteModal();

    return;
  }

  const action =
    deleteAction;

  /*
    Limpa antes de executar para
    evitar clique duplo.
  */

  deleteAction =
    null;

  try {

    await action();

  }
  catch (error) {

    console.error(
      "Erro na confirmação:",
      error
    );

    closeDeleteModal();

    toast(
      "Não foi possível concluir a operação."
    );

  }

}


/* =========================================================
   CONFIGURAÇÃO DE E-MAIL
========================================================= */

async function saveEmailSettings() {

  const endpoint =
    $("#emailEndpoint")
      ?.value
      .trim() ||
    "";

  const managerEmail =
    $("#managerEmail")
      ?.value
      .trim() ||
    "";

  if (
    managerEmail &&
    !managerEmail.includes("@")
  ) {

    toast(
      "Informe um e-mail válido."
    );

    return;
  }

  if (
    endpoint &&
    !endpoint.startsWith("https://")
  ) {

    toast(
      "Informe uma URL HTTPS válida do Apps Script."
    );

    return;
  }

  state.settings.endpoint =
    endpoint;

  state.settings.managerEmail =
    managerEmail;

  try {

    await saveSettings();

    toast(
      "Configurações de e-mail salvas."
    );

  }
  catch (error) {

    console.error(
      "Erro ao salvar e-mail:",
      error
    );

    toast(
      "Não foi possível salvar as configurações."
    );

  }

}


/* =========================================================
   IDIOMA
========================================================= */

async function saveLanguage() {

  state.settings.language =
    $("#languageSelect")
      ?.value ||
    "pt-BR";

  try {

    await saveSettings();

    toast(
      "Idioma salvo."
    );

  }
  catch (error) {

    console.error(
      "Erro ao salvar idioma:",
      error
    );

    toast(
      "Não foi possível salvar o idioma."
    );

  }

}


/* =========================================================
   ENVIAR E-MAIL AO RESPONSÁVEL
========================================================= */

async function sendManagerEmail(
  subject,
  body
) {

  const endpoint =
    state.settings.endpoint;

  const to =
    state.settings.managerEmail;

  if (
    !endpoint ||
    !to
  ) {

    throw new Error(
      "Configuração de e-mail incompleta."
    );

  }

  const response =
    await fetch(
      endpoint,
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

            to:
              to,

            subject:
              subject,

            body:
              body
          })
      }
    );

  if (!response.ok) {

    throw new Error(
      `Erro HTTP ${response.status}`
    );

  }

  const text =
    await response.text();

  let result;

  try {

    result =
      JSON.parse(text);

  }
  catch {

    result = {
      ok:
        true
    };

  }

  if (
    result.ok === false
  ) {

    throw new Error(
      result.error ||
      "Falha no envio."
    );

  }

  return true;

}


/* =========================================================
   REGISTRAR E-MAIL
========================================================= */

async function recordEmail(
  policyId,
  message
) {

  await addEvent(
    policyId,
    "email",
    message ||
    "Lembrete enviado por e-mail"
  );

}


/* =========================================================
   VERIFICAR SE JÁ ENVIOU HOJE
========================================================= */

function emailAlreadySentToday(
  policyId,
  key
) {

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  return state.events.some(
    event => {

      if (
        event.policyId !==
          policyId ||
        event.type !==
          "email"
      ) {
        return false;
      }

      const eventDay =
        new Date(event.date)
          .toISOString()
          .slice(0, 10);

      return (
        eventDay === today &&
        event.message.includes(
          `[${key}]`
        )
      );

    }
  );

}


/* =========================================================
   AUTOMAÇÃO DE E-MAIL
========================================================= */

async function autoEmailScan() {

  if (
    !state.user ||
    !state.settings.endpoint ||
    !state.settings.managerEmail
  ) {
    return;
  }

  for (
    const policy
    of state.policies
  ) {

    const client =
      clientById(
        policy.clientId
      );

    if (!client) {
      continue;
    }

    const days =
      daysUntil(
        policy.endDate
      );

    let key =
      null;

    let label =
      null;


    if (
      days === 30 &&
      policy.alerts?.[30] !== false
    ) {

      key =
        "30";

      label =
        "vence em 30 dias";

    }
    else if (
      days === 15 &&
      policy.alerts?.[15] !== false
    ) {

      key =
        "15";

      label =
        "vence em 15 dias";

    }
    else if (
      days === 7 &&
      policy.alerts?.[7] !== false
    ) {

      key =
        "7";

      label =
        "vence em 7 dias";

    }
    else if (
      days === 1 &&
      policy.alerts?.[1] !== false
    ) {

      key =
        "1";

      label =
        "vence amanhã";

    }
    else if (
      days < 0 &&
      policy.alerts?.expired !== false
    ) {

      key =
        `expired-${Math.abs(days)}`;

      label =
        `está vencida há ${Math.abs(days)} dia(s)`;

    }


    if (
      !key ||
      emailAlreadySentToday(
        policy.id,
        key
      )
    ) {
      continue;
    }


    const subject =
      `SAVA Seguros | Renovação - ${client.name}`;


    const body =
      `SAVA Seguros — Central de Renovações\n\n` +
      `Cliente: ${client.name}\n` +
      `Seguro: ${policy.type}\n` +
      `Seguradora: ${policy.insurer}\n` +
      `Apólice: ${policy.number || "Não informado"}\n` +
      `Fim da vigência: ${fmtDate(policy.endDate)}\n` +
      `Situação: ${label}\n\n` +
      `Este aviso é destinado à equipe da SAVA Seguros.`;


    try {

      await sendManagerEmail(
        subject,
        body
      );

      await recordEmail(
        policy.id,
        `[${key}] Lembrete automático enviado ao responsável`
      );

    }
    catch (error) {

      console.error(
        "Erro no lembrete automático:",
        error
      );

    }

  }

}


/* =========================================================
   CHECAR AUTOMAÇÃO
========================================================= */

let automationTimer =
  null;


function checkAutomation() {

  if (
    automationTimer
  ) {
    return;
  }

  /*
    Enquanto o CRM estiver aberto,
    verifica periodicamente.

    O envio 24h com o site fechado
    será feito depois pelo backend/cron.
  */

  autoEmailScan();

  automationTimer =
    setInterval(
      autoEmailScan,
      15 * 60 * 1000
    );

}


/* =========================================================
   ALTERAR SENHA
========================================================= */

async function saveAccountSettings() {

  const password =
    $("#cfgPass")
      ?.value ||
    "";

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

  try {

    const {
      error
    } =
      await sb.auth.updateUser({
        password:
          password
      });

    if (error) {
      throw error;
    }

    $("#cfgPass").value =
      "";

    toast(
      "Senha alterada com sucesso."
    );

  }
  catch (error) {

    console.error(
      "Erro ao alterar senha:",
      error
    );

    toast(
      "Não foi possível alterar a senha."
    );

  }

}


/* =========================================================
   ESQUECI MINHA SENHA
========================================================= */

async function forgotPassword() {

  const email =
    $("#loginUser")
      ?.value
      .trim();

  if (
    !email ||
    !email.includes("@")
  ) {

    toast(
      "Digite seu e-mail no campo de login primeiro."
    );

    return;
  }

  try {

    const redirectTo =
      window.location.origin +
      window.location.pathname;

    const {
      error
    } =
      await sb.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo:
              redirectTo
          }
        );

    if (error) {
      throw error;
    }

    toast(
      "Enviamos o link para redefinir sua senha."
    );

  }
  catch (error) {

    console.error(
      "Erro na recuperação:",
      error
    );

    toast(
      "Não foi possível enviar o link de recuperação."
    );

  }

}


/* =========================================================
   SALVAR SENHA DA RECUPERAÇÃO
========================================================= */

async function saveRecoveryPassword() {

  const password =
    $("#recoveryPassword")
      ?.value ||
    "";

  const confirmation =
    $("#recoveryPassword2")
      ?.value ||
    "";

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
    confirmation
  ) {

    toast(
      "As senhas não coincidem."
    );

    return;
  }

  try {

    const {
      error
    } =
      await sb.auth.updateUser({
        password:
          password
      });

    if (error) {
      throw error;
    }

    if ($("#recoveryPassword")) {
      $("#recoveryPassword").value =
        "";
    }

    if ($("#recoveryPassword2")) {
      $("#recoveryPassword2").value =
        "";
    }

    toast(
      "Nova senha cadastrada."
    );

    showApp();

    await loadCloudData();

  }
  catch (error) {

    console.error(
      "Erro ao redefinir senha:",
      error
    );

    toast(
      "Não foi possível redefinir a senha."
    );

  }

} /* =========================================================
   LOGIN
========================================================= */

async function login(event) {

  event?.preventDefault();

  const email =
    $("#loginUser")
      ?.value
      .trim();

  const password =
    $("#loginPass")
      ?.value ||
    "";

  if (
    !email ||
    !password
  ) {

    toast(
      "Informe o e-mail e a senha."
    );

    return;
  }

  const button =
    $("#loginForm button[type='submit']");

  const oldText =
    button?.textContent;

  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Entrando...";

    }

    const {
      data,
      error
    } =
      await sb.auth
        .signInWithPassword({
          email:
            email,

          password:
            password
        });

    if (error) {
      throw error;
    }

    if (
      !data?.user
    ) {

      throw new Error(
        "Usuário não encontrado."
      );

    }

    state.user =
      data.user;

    showApp();

    await loadCloudData();

    toast(
      "Login realizado com sucesso."
    );

  }
  catch (error) {

    console.error(
      "Erro no login:",
      error
    );

    let message =
      "Não foi possível entrar.";

    if (
      String(
        error?.message ||
        ""
      )
        .toLowerCase()
        .includes(
          "invalid login credentials"
        )
    ) {

      message =
        "E-mail ou senha incorretos.";

    }

    toast(
      message
    );

  }
  finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        oldText ||
        "Entrar";

    }

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await sb.auth
      .signOut();

  }
  catch (error) {

    console.error(
      "Erro ao sair:",
      error
    );

  }

  state.user =
    null;

  state.clients =
    [];

  state.policies =
    [];

  state.events =
    [];

  if (
    automationTimer
  ) {

    clearInterval(
      automationTimer
    );

    automationTimer =
      null;

  }

  showLogin();

}


/* =========================================================
   OUVIR AUTENTICAÇÃO
========================================================= */

function setupAuthListener() {

  sb.auth
    .onAuthStateChange(
      async (
        event,
        session
      ) => {

        console.log(
          "Supabase Auth:",
          event
        );

        if (
          event ===
          "PASSWORD_RECOVERY"
        ) {

          state.user =
            session?.user ||
            null;

          showRecovery();

          return;

        }

        if (
          event ===
          "SIGNED_OUT"
        ) {

          state.user =
            null;

          showLogin();

          return;

        }

        if (
          event ===
            "SIGNED_IN" &&
          session?.user
        ) {

          state.user =
            session.user;

        }

      }
    );

}


/* =========================================================
   VERIFICAR SESSÃO INICIAL
========================================================= */

async function restoreSession() {

  try {

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
      data?.session;

    if (
      session?.user
    ) {

      state.user =
        session.user;

      showApp();

      await loadCloudData();

    }
    else {

      showLogin();

    }

  }
  catch (error) {

    console.error(
      "Erro ao restaurar sessão:",
      error
    );

    showLogin();

  }

}


/* =========================================================
   EXPORTAR BACKUP
========================================================= */

async function exportBackup() {

  if (!state.user) {

    toast(
      "Faça login primeiro."
    );

    return;
  }

  try {

    const backup = {

      version:
        2,

      system:
        "SAVA Seguros | Central de Renovações",

      exportedAt:
        new Date()
          .toISOString(),

      clients:
        state.clients,

      policies:
        [],

      events:
        state.events,

      settings:
        state.settings

    };


    /*
      Também tenta colocar os PDFs
      dentro do backup em Base64.
    */

    for (
      const policy
      of state.policies
    ) {

      const copy = {
        ...policy,
        pdfBackup:
          null
      };

      if (
        policy.pdfPath
      ) {

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
              .download(
                policy.pdfPath
              );

          if (error) {
            throw error;
          }

          copy.pdfBackup =
            await blobToBase64(
              data
            );

          copy.pdfBackupName =
            policy.pdfPath
              .split("/")
              .pop() ||
            "apolice.pdf";

        }
        catch (error) {

          console.warn(
            "PDF não incluído no backup:",
            policy.pdfPath,
            error
          );

        }

      }

      backup.policies.push(
        copy
      );

    }


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


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;

    link.download =
      `sava-backup-${iso(new Date())}.json`;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      url
    );


    toast(
      "Backup exportado."
    );

  }
  catch (error) {

    console.error(
      "Erro ao exportar backup:",
      error
    );

    toast(
      "Não foi possível gerar o backup."
    );

  }

}


/* =========================================================
   BLOB → BASE64
========================================================= */

function blobToBase64(blob) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result
          );

      reader.onerror =
        reject;

      reader.readAsDataURL(
        blob
      );

    }
  );

}


/* =========================================================
   BASE64 → BLOB
========================================================= */

function base64ToBlob(
  dataUrl
) {

  const parts =
    String(dataUrl)
      .split(",");

  if (
    parts.length < 2
  ) {

    throw new Error(
      "PDF do backup inválido."
    );

  }

  const mimeMatch =
    parts[0].match(
      /data:(.*?);base64/
    );


  const mime =
    mimeMatch?.[1] ||
    "application/pdf";


  const binary =
    atob(
      parts[1]
    );


  const bytes =
    new Uint8Array(
      binary.length
    );


  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }


  return new Blob(
    [bytes],
    {
      type:
        mime
    }
  );

}


/* =========================================================
   IMPORTAR BACKUP
========================================================= */

async function importBackup(
  event
) {

  const file =
    event?.target
      ?.files?.[0];

  if (!file) {
    return;
  }


  if (!state.user) {

    toast(
      "Faça login primeiro."
    );

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
        "Arquivo de backup inválido."
      );

    }


    toast(
      "Importando backup..."
    );


    /*
      MAPEAMENTO DE IDs

      Isso evita conflitos caso
      algum ID antigo não seja UUID
      ou já exista na conta.
    */

    const clientMap =
      new Map();

    const policyMap =
      new Map();


    for (
      const oldClient
      of backup.clients
    ) {

      const oldId =
        oldClient.id;


      let newId =
        validUuid(
          oldId
        )
          ? oldId
          : uid();


      if (
        state.clients.some(
          client =>
            client.id ===
            newId
        )
      ) {

        newId =
          uid();

      }


      clientMap.set(
        oldId,
        newId
      );


      const client = {
        ...oldClient,

        id:
          newId,

        createdAt:
          oldClient.createdAt ||
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
          .from(
            "clients"
          )
          .insert(
            clientToDb(
              client
            )
          );


      if (error) {
        throw error;
      }

    }


    /*
      PRIMEIRA PASSAGEM DAS APÓLICES

      renewed_from fica NULL para
      não quebrar a chave estrangeira.
    */

    for (
      const oldPolicy
      of backup.policies
    ) {

      const oldId =
        oldPolicy.id;


      let newId =
        validUuid(
          oldId
        )
          ? oldId
          : uid();


      if (
        state.policies.some(
          policy =>
            policy.id ===
            newId
        )
      ) {

        newId =
          uid();

      }


      policyMap.set(
        oldId,
        newId
      );


      const newClientId =
        clientMap.get(
          oldPolicy.clientId
        );


      if (!newClientId) {

        console.warn(
          "Apólice ignorada: cliente não encontrado.",
          oldPolicy
        );

        continue;

      }


      let newPdfPath =
        null;


      if (
        oldPolicy.pdfBackup
      ) {

        try {

          const blob =
            base64ToBlob(
              oldPolicy.pdfBackup
            );


          const name =
            safeFileName(
              oldPolicy.pdfBackupName ||
              "apolice.pdf"
            );


          newPdfPath =
            `${state.user.id}/${newId}/${Date.now()}-${name}`;


          const {
            error:
              pdfError
          } =
            await sb
              .storage
              .from(
                "policy-pdfs"
              )
              .upload(
                newPdfPath,
                blob,
                {
                  contentType:
                    "application/pdf",

                  upsert:
                    false
                }
              );


          if (pdfError) {
            throw pdfError;
          }

        }
        catch (error) {

          console.warn(
            "PDF do backup não pôde ser restaurado:",
            error
          );


          newPdfPath =
            null;

        }

      }


      const policy = {
        ...oldPolicy,

        id:
          newId,

        clientId:
          newClientId,

        pdfPath:
          newPdfPath,

        pdfId:
          newPdfPath,

        renewedFrom:
          null,

        createdAt:
          oldPolicy.createdAt ||
          new Date()
            .toISOString(),

        updatedAt:
          new Date()
            .toISOString()
      };


      delete policy.pdfBackup;
      delete policy.pdfBackupName;


      const {
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
          );


      if (error) {
        throw error;
      }

    }


    /*
      SEGUNDA PASSAGEM

      Agora que todas as apólices
      existem, restaura os vínculos
      de renovação.
    */

    for (
      const oldPolicy
      of backup.policies
    ) {

      if (
        !oldPolicy.renewedFrom
      ) {
        continue;
      }


      const newId =
        policyMap.get(
          oldPolicy.id
        );


      const renewedFrom =
        policyMap.get(
          oldPolicy.renewedFrom
        );


      if (
        !newId ||
        !renewedFrom
      ) {
        continue;
      }


      const {
        error
      } =
        await sb
          .from(
            "policies"
          )
          .update({
            renewed_from:
              renewedFrom
          })
          .eq(
            "id",
            newId
          );


      if (error) {
        throw error;
      }

    }


    /*
      IMPORTAR HISTÓRICO
    */

    if (
      Array.isArray(
        backup.events
      )
    ) {

      for (
        const oldEvent
        of backup.events
      ) {

        const newPolicyId =
          policyMap.get(
            oldEvent.policyId
          );


        if (!newPolicyId) {
          continue;
        }


        const eventObject = {

          id:
            validUuid(
              oldEvent.id
            )
              ? oldEvent.id
              : uid(),

          policyId:
            newPolicyId,

          type:
            oldEvent.type ||
            "history",

          message:
            oldEvent.message ||
            "Evento importado",

          date:
            oldEvent.date ||
            new Date()
              .toISOString()

        };


        /*
          Se o ID do evento já existir,
          cria outro.
        */

        if (
          state.events.some(
            item =>
              item.id ===
              eventObject.id
          )
        ) {

          eventObject.id =
            uid();

        }


        const {
          error
        } =
          await sb
            .from(
              "events"
            )
            .insert(
              eventToDb(
                eventObject
              )
            );


        if (error) {
          throw error;
        }

      }

    }


    /*
      CONFIGURAÇÕES
    */

    if (
      backup.settings &&
      typeof backup.settings ===
        "object"
    ) {

      state.settings = {
        endpoint:
          backup.settings.endpoint ||
          "",

        managerEmail:
          backup.settings.managerEmail ||
          "",

        language:
          backup.settings.language ||
          "pt-BR"
      };


      await saveSettings();

    }


    await loadCloudData();


    toast(
      "Backup importado com sucesso."
    );

  }
  catch (error) {

    console.error(
      "Erro ao importar backup:",
      error
    );


    toast(
      "Não foi possível importar o backup."
    );

  }
  finally {

    if (
      event?.target
    ) {

      event.target.value =
        "";

    }

  }

}


/* =========================================================
   MIGRAÇÃO DO INDEXEDDB ANTIGO
========================================================= */

function openLegacyDatabase() {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const request =
        indexedDB.open(
          "sava-renovacoes"
        );


      request.onerror =
        () =>
          reject(
            request.error
          );


      request.onsuccess =
        () =>
          resolve(
            request.result
          );


      request.onupgradeneeded =
        () => {

          /*
            Se o banco não existia,
            não criamos estrutura nova.
            Apenas encerramos depois.
          */

        };

    }
  );

}


/* =========================================================
   LER STORE DO INDEXEDDB
========================================================= */

function readLegacyStore(
  db,
  storeName
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      if (
        !db.objectStoreNames
          .contains(
            storeName
          )
      ) {

        resolve(
          []
        );

        return;
      }


      const transaction =
        db.transaction(
          storeName,
          "readonly"
        );


      const store =
        transaction
          .objectStore(
            storeName
          );


      const request =
        store.getAll();


      request.onsuccess =
        () =>
          resolve(
            request.result ||
            []
          );


      request.onerror =
        () =>
          reject(
            request.error
          );

    }
  );

}


/* =========================================================
   MIGRAR DADOS LOCAIS PARA SUPABASE
========================================================= */

async function migrateLocalDataToCloud() {

  if (!state.user) {

    toast(
      "Faça login primeiro."
    );

    return;
  }


  const status =
    $("#migrationStatus");


  try {

    if (status) {

      status.textContent =
        "Lendo dados antigos deste aparelho...";

    }


    const db =
      await openLegacyDatabase();


    const storeNames =
      [...db.objectStoreNames];


    if (
      !storeNames.length
    ) {

      db.close();

      if (status) {

        status.textContent =
          "Nenhum banco antigo encontrado neste aparelho.";

      }

      toast(
        "Nenhum dado local antigo encontrado."
      );

      return;

    }


    /*
      Tenta os nomes utilizados
      nas versões anteriores.
    */

    let oldClients =
      [];

    let oldPolicies =
      [];

    let oldEvents =
      [];


    for (
      const name
      of [
        "clients",
        "clientes"
      ]
    ) {

      const data =
        await readLegacyStore(
          db,
          name
        );

      if (data.length) {

        oldClients =
          data;

        break;

      }

    }


    for (
      const name
      of [
        "policies",
        "apolices"
      ]
    ) {

      const data =
        await readLegacyStore(
          db,
          name
        );

      if (data.length) {

        oldPolicies =
          data;

        break;

      }

    }


    for (
      const name
      of [
        "events",
        "eventos"
      ]
    ) {

      const data =
        await readLegacyStore(
          db,
          name
        );

      if (data.length) {

        oldEvents =
          data;

        break;

      }

    }


    db.close();


    if (
      !oldClients.length &&
      !oldPolicies.length
    ) {

      if (status) {

        status.textContent =
          "Nenhum cliente ou apólice antiga encontrada.";

      }

      toast(
        "Não encontrei dados antigos para migrar."
      );

      return;

    }


    if (status) {

      status.textContent =
        "Migrando clientes...";

    }


    const clientMap =
      new Map();

    const policyMap =
      new Map();


    /*
      CLIENTES
    */

    for (
      const oldClient
      of oldClients
    ) {

      const oldId =
        oldClient.id;


      let newId =
        validUuid(
          oldId
        )
          ? oldId
          : uid();


      if (
        state.clients.some(
          client =>
            client.id ===
            newId
        )
      ) {

        newId =
          uid();

      }


      clientMap.set(
        oldId,
        newId
      );


      const client = {

        id:
          newId,

        name:
          oldClient.name ||
          oldClient.nome ||
          "Cliente",

        birthDate:
          oldClient.birthDate ||
          oldClient.birth_date ||
          oldClient.nascimento ||
          "",

        phone:
          cleanPhone(
            oldClient.phone ||
            oldClient.telefone ||
            ""
          ),

        document:
          oldClient.document ||
          oldClient.cpfCnpj ||
          oldClient.cpf_cnpj ||
          "",

        email:
          oldClient.email ||
          "",

        notes:
          oldClient.notes ||
          oldClient.observacoes ||
          "",

        createdAt:
          oldClient.createdAt ||
          oldClient.created_at ||
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
          .from(
            "clients"
          )
          .insert(
            clientToDb(
              client
            )
          );


      if (error) {
        throw error;
      }

    }


    if (status) {

      status.textContent =
        "Migrando apólices...";

    }


    /*
      APÓLICES — PRIMEIRA PASSAGEM
    */

    for (
      const oldPolicy
      of oldPolicies
    ) {

      const oldId =
        oldPolicy.id;


      let newId =
        validUuid(
          oldId
        )
          ? oldId
          : uid();


      if (
        state.policies.some(
          policy =>
            policy.id ===
            newId
        )
      ) {

        newId =
          uid();

      }


      policyMap.set(
        oldId,
        newId
      );


      const oldClientId =
        oldPolicy.clientId ||
        oldPolicy.client_id ||
        oldPolicy.clienteId;


      const newClientId =
        clientMap.get(
          oldClientId
        );


      if (!newClientId) {

        console.warn(
          "Apólice antiga ignorada por falta de cliente:",
          oldPolicy
        );

        continue;

      }


      const alerts =
        oldPolicy.alerts ||
        {};


      const policy = {

        id:
          newId,

        clientId:
          newClientId,

        insurer:
          oldPolicy.insurer ||
          oldPolicy.seguradora ||
          "Outra",

        type:
          oldPolicy.type ||
          oldPolicy.tipo ||
          "Outro",

        number:
          oldPolicy.number ||
          oldPolicy.numero ||
          "",

        startDate:
          oldPolicy.startDate ||
          oldPolicy.start_date ||
          oldPolicy.inicioVigencia ||
          "",

        endDate:
          oldPolicy.endDate ||
          oldPolicy.end_date ||
          oldPolicy.fimVigencia ||
          "",

        status:
          oldPolicy.status ||
          "Pendente",

        notes:
          oldPolicy.notes ||
          oldPolicy.observacoes ||
          "",

        alerts: {

          30:
            alerts[30] !== false,

          15:
            alerts[15] !== false,

          7:
            alerts[7] !== false,

          1:
            alerts[1] !== false,

          expired:
            alerts.expired !== false

        },

        /*
          PDF antigo do IndexedDB
          não vira caminho do Storage
          automaticamente.
        */

        pdfPath:
          null,

        renewedFrom:
          null,

        createdAt:
          oldPolicy.createdAt ||
          oldPolicy.created_at ||
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
          .from(
            "policies"
          )
          .insert(
            policyToDb(
              policy
            )
          );


      if (error) {
        throw error;
      }

    }


    /*
      APÓLICES — SEGUNDA PASSAGEM
      Restaura vínculo de renovação.
    */

    for (
      const oldPolicy
      of oldPolicies
    ) {

      const oldRenewedFrom =
        oldPolicy.renewedFrom ||
        oldPolicy.renewed_from;


      if (
        !oldRenewedFrom
      ) {
        continue;
      }


      const newId =
        policyMap.get(
          oldPolicy.id
        );


      const renewedFrom =
        policyMap.get(
          oldRenewedFrom
        );


      if (
        !newId ||
        !renewedFrom
      ) {
        continue;
      }


      const {
        error
      } =
        await sb
          .from(
            "policies"
          )
          .update({
            renewed_from:
              renewedFrom
          })
          .eq(
            "id",
            newId
          );


      if (error) {
        throw error;
      }

    }


    /*
      HISTÓRICO
    */

    if (status) {

      status.textContent =
        "Migrando histórico...";

    }


    for (
      const oldEvent
      of oldEvents
    ) {

      const oldPolicyId =
        oldEvent.policyId ||
        oldEvent.policy_id ||
        oldEvent.apoliceId;


      const newPolicyId =
        policyMap.get(
          oldPolicyId
        );


      if (!newPolicyId) {
        continue;
      }


      const eventObject = {

        id:
          validUuid(
            oldEvent.id
          )
            ? oldEvent.id
            : uid(),

        policyId:
          newPolicyId,

        type:
          oldEvent.type ||
          oldEvent.tipo ||
          "history",

        message:
          oldEvent.message ||
          oldEvent.mensagem ||
          "Evento migrado",

        date:
          oldEvent.date ||
          oldEvent.created_at ||
          oldEvent.createdAt ||
          new Date()
            .toISOString()

      };


      const {
        error
      } =
        await sb
          .from(
            "events"
          )
          .insert(
            eventToDb(
              eventObject
            )
          );


      if (error) {
        throw error;
      }

    }


    await loadCloudData();


    if (status) {

      status.textContent =
        `Migração concluída: ${oldClients.length} cliente(s) e ${oldPolicies.length} apólice(s) encontrados.`;

    }


    toast(
      "Migração concluída."
    );

  }
  catch (error) {

    console.error(
      "Erro na migração:",
      error
    );


    if (status) {

      status.textContent =
        "Erro durante a migração.";

    }


    toast(
      "Não foi possível migrar os dados antigos."
    );

  }

} /* =========================================================
   RELATÓRIOS
========================================================= */

function renderReports() {

  const container =
    $("#reportsContent");

  if (!container) {
    return;
  }

  const total =
    state.policies.length;

  const pending =
    state.policies.filter(
      policy =>
        policy.status === "Pendente"
    ).length;

  const progress =
    state.policies.filter(
      policy =>
        policy.status === "Em andamento"
    ).length;

  const won =
    state.policies.filter(
      policy =>
        policy.status === "Ganho"
    ).length;

  const expired =
    state.policies.filter(
      policy =>
        daysUntil(policy.endDate) < 0
    ).length;

  const next30 =
    state.policies.filter(
      policy => {

        const days =
          daysUntil(policy.endDate);

        return (
          days >= 0 &&
          days <= 30
        );

      }
    ).length;

  container.innerHTML = `

    <div class="stats-grid">

      <div class="stat-card">
        <small>Total de apólices</small>
        <strong>${total}</strong>
      </div>

      <div class="stat-card">
        <small>Pendentes</small>
        <strong>${pending}</strong>
      </div>

      <div class="stat-card">
        <small>Em andamento</small>
        <strong>${progress}</strong>
      </div>

      <div class="stat-card">
        <small>Ganhos</small>
        <strong>${won}</strong>
      </div>

      <div class="stat-card">
        <small>Vencidas</small>
        <strong>${expired}</strong>
      </div>

      <div class="stat-card">
        <small>Vencem em até 30 dias</small>
        <strong>${next30}</strong>
      </div>

    </div>
  `;

}


/* =========================================================
   LIMPAR DADOS DA CONTA
========================================================= */

function askClearData() {

  openDeleteModal(
    "Limpar dados",
    "Esta ação excluirá clientes, apólices, históricos e PDFs desta conta. Essa operação não poderá ser desfeita.",
    clearCloudData
  );

}


/* =========================================================
   LIMPAR DADOS DO SUPABASE
========================================================= */

async function clearCloudData() {

  if (!state.user) {
    return;
  }

  try {

    /*
      Primeiro remove os PDFs.
    */

    const pdfPaths =
      state.policies
        .map(
          policy =>
            policy.pdfPath
        )
        .filter(Boolean);

    if (pdfPaths.length) {

      const {
        error: pdfError
      } =
        await sb
          .storage
          .from("policy-pdfs")
          .remove(pdfPaths);

      if (pdfError) {

        console.warn(
          "Alguns PDFs não puderam ser removidos:",
          pdfError
        );

      }

    }


    /*
      Remove histórico.
    */

    const {
      error: eventError
    } =
      await sb
        .from("events")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );

    if (eventError) {
      throw eventError;
    }


    /*
      Remove apólices.
    */

    const {
      error: policyError
    } =
      await sb
        .from("policies")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );

    if (policyError) {
      throw policyError;
    }


    /*
      Remove clientes.
    */

    const {
      error: clientError
    } =
      await sb
        .from("clients")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );

    if (clientError) {
      throw clientError;
    }


    state.clients = [];
    state.policies = [];
    state.events = [];

    closeDeleteModal();

    renderAll();

    toast(
      "Dados da conta apagados."
    );

  }
  catch (error) {

    console.error(
      "Erro ao limpar dados:",
      error
    );

    closeDeleteModal();

    toast(
      "Não foi possível limpar os dados."
    );

  }

}


/* =========================================================
   FORMULÁRIO DE RENOVAÇÃO

   Intercepta o salvamento para,
   quando necessário, finalizar
   também a apólice anterior.
========================================================= */

async function handlePolicySubmit(event) {

  const oldPolicyId =
    $("#policyParentId")
      ?.value ||
    "";

  const saved =
    await savePolicy(event);

  if (
    saved &&
    oldPolicyId
  ) {

    await finalizeRenewal(
      oldPolicyId,
      saved.id
    );

    renderAll();

  }

}


/* =========================================================
   NAVEGAÇÃO — CLIQUES
========================================================= */

function setupNavigation() {

  $$(".nav-item")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const view =
              button.dataset.view;

            if (!view) {
              return;
            }

            go(view);

            if (
              view === "relatorios"
            ) {

              renderReports();

            }

          }
        );

      }
    );

}


/* =========================================================
   EVENTOS DOS FILTROS
========================================================= */

function setupFilters() {

  const selectors = [

    "#clientSearch",
    "#clientFilter",

    "#policySearch",
    "#statusFilter",
    "#expiryFilter",
    "#typeFilter",
    "#insurerFilter"

  ];


  selectors.forEach(
    selector => {

      const element =
        $(selector);

      if (!element) {
        return;
      }

      element.addEventListener(
        "input",
        () => {

          if (
            selector.startsWith(
              "#client"
            )
          ) {

            renderClients();

          }
          else {

            renderPolicies();

          }

        }
      );


      element.addEventListener(
        "change",
        () => {

          if (
            selector.startsWith(
              "#client"
            )
          ) {

            renderClients();

          }
          else {

            renderPolicies();

          }

        }
      );

    }
  );

}


/* =========================================================
   MÁSCARA DE TELEFONE
========================================================= */

function setupPhoneMask() {

  const input =
    $("#clientPhone");

  if (!input) {
    return;
  }

  input.addEventListener(
    "input",
    () => {

      let value =
        cleanPhone(
          input.value
        )
          .slice(
            0,
            11
          );

      input.value =
        formatPhone(
          value
        );

    }
  );

}


/* =========================================================
   EVENTOS DOS MODAIS
========================================================= */

function setupModalEvents() {

  $$("[data-close]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.close;

            if (id) {

              closeModal(id);

            }

          }
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
              event.target === modal
            ) {

              closeModal(
                modal.id
              );

            }

          }
        );

      }
    );

}


/* =========================================================
   EVENTOS PRINCIPAIS
========================================================= */

function setupEvents() {

  /*
    LOGIN
  */

  $("#loginForm")
    ?.addEventListener(
      "submit",
      login
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


  /*
    LOGOUT
  */

  $("#logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );


  /*
    CLIENTES
  */

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


  /*
    APÓLICES
  */

  $("#newPolicyBtn")
    ?.addEventListener(
      "click",
      () =>
        newPolicyFor()
    );


  $("#policyForm")
    ?.addEventListener(
      "submit",
      handlePolicySubmit
    );


  /*
    CONFIGURAÇÕES DA CONTA
  */

  $("#saveAccount")
    ?.addEventListener(
      "click",
      saveAccountSettings
    );


  /*
    E-MAIL
  */

  $("#saveEmail")
    ?.addEventListener(
      "click",
      saveEmailSettings
    );


  /*
    IDIOMA
  */

  $("#saveLanguage")
    ?.addEventListener(
      "click",
      saveLanguage
    );


  /*
    BACKUP
  */

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


  /*
    LIMPAR DADOS
  */

  $("#clearData")
    ?.addEventListener(
      "click",
      askClearData
    );


  /*
    MIGRAÇÃO DO BANCO ANTIGO

    Agora usamos diretamente
    o botão que já existe no HTML.
  */

  $("#migrateLocalBtn")
    ?.addEventListener(
      "click",
      migrateLocalDataToCloud
    );


  /*
    MODAL DE EXCLUSÃO
  */

  $("#confirmDeleteBtn")
    ?.addEventListener(
      "click",
      confirmDelete
    );


  $("#cancelDeleteBtn")
    ?.addEventListener(
      "click",
      closeDeleteModal
    );


  /*
    OUTROS
  */

  setupNavigation();
  setupFilters();
  setupPhoneMask();
  setupModalEvents();

}


/* =========================================================
   ATALHOS GLOBAIS

   Necessários porque alguns botões
   são criados pelo innerHTML e usam
   onclick="..."
========================================================= */

window.go =
  go;

window.openClient =
  openClient;

window.newPolicyFor =
  newPolicyFor;

window.editPolicy =
  editPolicy;

window.openDetails =
  openDetails;

window.openPdf =
  openPdf;

window.openWhatsApp =
  openWhatsApp;

window.renewPolicy =
  renewPolicy;

window.changeStatus =
  changeStatus;

window.deleteClient =
  deleteClient;

window.askDeletePolicy =
  askDeletePolicy;

window.closeModal =
  closeModal;

window.closeDeleteModal =
  closeDeleteModal;


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function init() {

  console.log(
    "SAVA CRM iniciando..."
  );


  /*
    Confere se a biblioteca do
    Supabase realmente carregou.
  */

  if (
    !window.supabase
  ) {

    console.error(
      "Biblioteca do Supabase não carregada."
    );

    alert(
      "Erro ao carregar o Supabase. Verifique sua conexão e o index.html."
    );

    return;
  }


  /*
    Configura todos os botões antes
    de restaurar a sessão.
  */

  setupEvents();


  /*
    Listener de login/logout/
    recuperação de senha.
  */

  setupAuthListener();


  /*
    Verifica se já existe sessão
    salva no navegador.
  */

  await restoreSession();


  console.log(
    "SAVA CRM iniciado."
  );

}


/* =========================================================
   INICIAR QUANDO O HTML ESTIVER PRONTO
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

}
else {

  init();

}
