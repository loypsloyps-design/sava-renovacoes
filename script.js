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
   ESTADO DO SISTEMA
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

const $ = s =>
  document.querySelector(s);

const $$ = s =>
  [...document.querySelectorAll(s)];


/* =========================================================
   FUNÇÕES BÁSICAS
========================================================= */

const uid = () =>
  crypto.randomUUID();


const cleanPhone = v =>
  String(v || "")
    .replace(/\D/g, "");


const esc = s =>
  String(s ?? "")
    .replace(
      /[&<>"']/g,
      m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m])
    );


const fmtDate = d =>
  d
    ? new Intl.DateTimeFormat(
        "pt-BR"
      ).format(
        new Date(
          d + "T12:00:00"
        )
      )
    : "—";


const iso = d => {

  const x =
    new Date(d);

  return new Date(
    x.getTime() -
    x.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

};


/* =========================================================
   CÁLCULO DE VENCIMENTO
========================================================= */

const daysUntil = d => {

  if (!d)
    return 0;

  const [
    year,
    month,
    day
  ] =
    d
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


/* =========================================================
   INICIAIS
========================================================= */

const initials = n =>
  (n || "?")
    .split(" ")
    .slice(0, 2)
    .map(x => x[0])
    .join("")
    .toUpperCase();


/* =========================================================
   TELEFONE
========================================================= */

function validBrazilPhone(v) {

  const n =
    cleanPhone(v);

  if (
    n.length !== 10 &&
    n.length !== 11
  )
    return false;

  if (
    /^(\d)\1+$/.test(n)
  )
    return false;

  if (
    /^0/.test(n) ||
    /^1/.test(n)
  )
    return false;

  return /^[1-9]{2}9?[2-9]\d{7}$/
    .test(n);

}


function formatPhone(n) {

  n =
    cleanPhone(n);

  if (
    n.length === 11
  ) {

    return (
      `(${n.slice(0, 2)}) ` +
      `${n.slice(2, 7)}-` +
      `${n.slice(7)}`
    );

  }

  if (
    n.length === 10
  ) {

    return (
      `(${n.slice(0, 2)}) ` +
      `${n.slice(2, 6)}-` +
      `${n.slice(6)}`
    );

  }

  return n;

}


/* =========================================================
   LOCALIZAR CLIENTE / APÓLICE
========================================================= */

function clientById(id) {

  return state.clients.find(
    c =>
      c.id === id
  );

}


function policyById(id) {

  return state.policies.find(
    p =>
      p.id === id
  );

}


/* =========================================================
   STATUS
========================================================= */

function processClass(s) {

  return s === "Ganho"
    ? "green"
    : s === "Em andamento"
      ? "orange"
      : "gray";

}


function expiryLabel(p) {

  const d =
    daysUntil(
      p.endDate
    );

  if (
    d < 0
  ) {

    return {
      text:
        `Vencida há ${Math.abs(d)} dias`,
      cls:
        "red"
    };

  }

  if (
    d === 0
  ) {

    return {
      text:
        "Vence hoje",
      cls:
        "red"
    };

  }

  if (
    d <= 30
  ) {

    return {
      text:
        `Vence em ${d} dias`,
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

function toast(msg) {

  const el =
    $("#toast");

  if (!el)
    return;

  el.textContent =
    msg;

  el.classList.add(
    "show"
  );

  clearTimeout(
    toast._t
  );

  toast._t =
    setTimeout(
      () =>
        el.classList.remove(
          "show"
        ),
      3200
    );

}


/* =========================================================
   LOGIN / APP
========================================================= */

function showLogin() {

  $("#loginScreen")
    .classList
    .remove("hidden");

  $("#app")
    .classList
    .add("hidden");

}


function showApp() {

  $("#loginScreen")
    .classList
    .add("hidden");

  $("#app")
    .classList
    .remove("hidden");

}


/* =========================================================
   CONVERSÃO:
   SUPABASE → FORMATO DO CRM
========================================================= */

function clientFromDb(r) {

  return {

    id:
      r.id,

    name:
      r.name,

    birthDate:
      r.birth_date || "",

    phone:
      r.phone || "",

    document:
      r.document || "",

    email:
      r.email || "",

    notes:
      r.notes || "",

    createdAt:
      r.created_at,

    updatedAt:
      r.updated_at

  };

}


function clientToDb(c) {

  return {

    id:
      c.id,

    user_id:
      state.user.id,

    name:
      c.name,

    birth_date:
      c.birthDate || null,

    phone:
      c.phone,

    document:
      c.document || null,

    email:
      c.email || null,

    notes:
      c.notes || null,

    created_at:
      c.createdAt ||
      new Date().toISOString(),

    updated_at:
      new Date().toISOString()

  };

}


/* =========================================================
   APÓLICE DO BANCO → CRM
========================================================= */

function policyFromDb(r) {

  return {

    id:
      r.id,

    clientId:
      r.client_id,

    insurer:
      r.insurer,

    type:
      r.type,

    number:
      r.number || "",

    startDate:
      r.start_date || "",

    endDate:
      r.end_date || "",

    status:
      r.status ||
      "Pendente",

    notes:
      r.notes || "",

    alerts: {

      30:
        r.alert_30 !== false,

      15:
        r.alert_15 !== false,

      7:
        r.alert_7 !== false,

      1:
        r.alert_1 !== false,

      expired:
        r.alert_expired !== false

    },

    pdfPath:
      r.pdf_path || null,

    pdfId:
      r.pdf_path || null,

    renewedFrom:
      r.renewed_from || null,

    createdAt:
      r.created_at,

    updatedAt:
      r.updated_at

  };

}


/* =========================================================
   APÓLICE CRM → BANCO
========================================================= */

function policyToDb(p) {

  return {

    id:
      p.id,

    user_id:
      state.user.id,

    client_id:
      p.clientId,

    insurer:
      p.insurer,

    type:
      p.type,

    number:
      p.number || null,

    start_date:
      p.startDate || null,

    end_date:
      p.endDate || null,

    status:
      p.status ||
      "Pendente",

    notes:
      p.notes || null,

    alert_30:
      p.alerts?.[30] !== false,

    alert_15:
      p.alerts?.[15] !== false,

    alert_7:
      p.alerts?.[7] !== false,

    alert_1:
      p.alerts?.[1] !== false,

    alert_expired:
      p.alerts?.expired !== false,

    pdf_path:
      p.pdfPath || null,

    renewed_from:
      p.renewedFrom || null,

    created_at:
      p.createdAt ||
      new Date().toISOString(),

    updated_at:
      new Date().toISOString()

  };

}


/* =========================================================
   EVENTO DO BANCO → CRM
========================================================= */

function eventFromDb(r) {

  return {

    id:
      r.id,

    policyId:
      r.policy_id,

    type:
      r.type || "",

    message:
      r.message,

    date:
      r.created_at

  };

}


/* =========================================================
   CRIAR EVENTO NO SUPABASE
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

    type,

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
      .from("events")
      .insert(row)
      .select()
      .single();


  if (error)
    throw error;


  const ev =
    eventFromDb(data);


  state.events.push(
    ev
  );


  return ev;

}


/* =========================================================
   CARREGAR DADOS DA NUVEM
========================================================= */

async function loadCloudData() {

  if (
    !state.user
  )
    return;


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
      const result of results
    ) {

      if (
        result.error
      )
        throw result.error;

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


    state.settings =
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

            endpoint:
              "",

            managerEmail:
              "",

            language:
              "pt-BR"

          };


    renderAll();

  }
  catch (err) {

    console.error(
      err
    );

    toast(
      "Não foi possível carregar os dados do Supabase."
    );

  }

}


/* =========================================================
   SALVAR CONFIGURAÇÕES NA NUVEM
========================================================= */

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
  )
    throw error;

}


/* =========================================================
   PREENCHER SELECTS
========================================================= */

function populateSelects() {

  const type =
    $("#typeFilter");

  const ins =
    $("#insurerFilter");

  const pType =
    $("#policyType");

  const pIns =
    $("#policyInsurer");

  const pClient =
    $("#policyClient");


  if (
    !type ||
    !ins ||
    !pType ||
    !pIns ||
    !pClient
  )
    return;


  pType.innerHTML =
    TYPES
      .map(
        x =>
          `<option>${esc(x)}</option>`
      )
      .join("");


  pIns.innerHTML =
    INSURERS
      .map(
        x =>
          `<option>${esc(x)}</option>`
      )
      .join("");


  type.innerHTML =
    `<option value="all">Todos os tipos</option>` +
    TYPES
      .map(
        x =>
          `<option>${esc(x)}</option>`
      )
      .join("");


  ins.innerHTML =
    `<option value="all">Todas as seguradoras</option>` +
    INSURERS
      .map(
        x =>
          `<option>${esc(x)}</option>`
      )
      .join("");


  pClient.innerHTML =
    `<option value="">Selecione...</option>` +
    [...state.clients]
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      )
      .map(
        c =>
          `<option value="${c.id}">${esc(c.name)}</option>`
      )
      .join("");

}


/* =========================================================
   RENDERIZAR TUDO
========================================================= */

function renderAll() {

  if (
    !state.user
  )
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

function renderDashboard() {

  const total =
    state.policies.length;


  const e7 =
    state.policies.filter(
      p => {

        const d =
          daysUntil(
            p.endDate
          );

        return (
          d >= 0 &&
          d <= 7
        );

      }
    ).length;


  const expired =
    state.policies.filter(
      p =>
        daysUntil(
          p.endDate
        ) < 0
    ).length;


  const won =
    state.policies.filter(
      p =>
        p.status === "Ganho"
    ).length;


  $("#statTotal").textContent =
    total;

  $("#stat7").textContent =
    e7;

  $("#statExpired").textContent =
    expired;

  $("#statWon").textContent =
    won;


  const upcoming =
    [...state.policies]
      .filter(
        p => {

          const d =
            daysUntil(
              p.endDate
            );

          return (
            d <= 30
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


  $("#upcomingList").innerHTML =
    upcoming.length
      ? upcoming
          .map(
            p => {

              const c =
                clientById(
                  p.clientId
                );

              const e =
                expiryLabel(p);

              return `
                <div class="upcoming-item">

                  <div>

                    <div class="name">
                      ${esc(
                        c?.name ||
                        "Cliente"
                      )}
                    </div>

                    <small>
                      ${esc(p.type)}
                      ·
                      ${esc(p.insurer)}
                    </small>

                  </div>


                  <div>

                    <small>
                      Vigência
                    </small>

                    <b>
                      ${fmtDate(
                        p.startDate
                      )}
                      →
                      ${fmtDate(
                        p.endDate
                      )}
                    </b>

                  </div>


                  <div>

                    <span
                      class="pill ${e.cls}"
                    >
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
          )
          .join("")
      : `
          <div class="empty">
            Nenhuma apólice vencendo
            nos próximos 30 dias.
          </div>
        `;


  const counts = {

    Pendente:
      state.policies.filter(
        p =>
          p.status ===
          "Pendente"
      ).length,

    "Em andamento":
      state.policies.filter(
        p =>
          p.status ===
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


  $("#processSummary").innerHTML =
    Object
      .entries(counts)
      .map(
        ([k, v]) => `

          <div class="process-line">

            <div class="line-top">

              <span>
                ${k}
              </span>

              <b>
                ${v}
              </b>

            </div>

            <div
              class="bar ${
                k === "Pendente"
                  ? "pendente"
                  : k === "Ganho"
                    ? "ganho"
                    : "andamento"
              }"
            >

              <i
                style="width:${v / max * 100}%"
              ></i>

            </div>

          </div>
        `
      )
      .join("");


  const ic = {};


  state.policies.forEach(
    p => {

      ic[p.insurer] =
        (
          ic[p.insurer] ||
          0
        ) + 1;

    }
  );


  const top =
    Object
      .entries(ic)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .slice(
        0,
        10
      );


  $("#insurerSummary").innerHTML =
    top.length
      ? top
          .map(
            ([k, v]) => `

              <div class="insurer-chip">

                <strong>
                  ${v}
                </strong>

                <span>
                  ${esc(k)}
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


/* =========================================================
   CLIENTES
========================================================= */

function renderClients() {

  const q =
    (
      $("#clientSearch")
        ?.value ||
      ""
    )
      .toLowerCase();


  const f =
    $("#clientFilter")
      ?.value ||
    "all";


  const arr =
    state.clients.filter(
      c => {

        const ps =
          state.policies.filter(
            p =>
              p.clientId ===
              c.id
          );


        if (
          f === "withPolicies" &&
          !ps.length
        )
          return false;


        if (
          f === "withoutPolicies" &&
          ps.length
        )
          return false;


        return [
          c.name,
          c.document,
          c.phone,
          c.email
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      }
    );


  $("#clientsGrid").innerHTML =
    arr.length
      ? arr
          .map(
            c => {

              const ps =
                state.policies.filter(
                  p =>
                    p.clientId ===
                    c.id
                );


              return `
                <article class="client-card">

                  <div class="client-card-head">

                    <div class="client-cell">

                      <div class="avatar">
                        ${initials(
                          c.name
                        )}
                      </div>

                      <div>

                        <h4>
                          ${esc(
                            c.name
                          )}
                        </h4>

                        <small>
                          ${fmtDate(
                            c.birthDate
                          )}
                        </small>

                      </div>

                    </div>


                    <span class="policy-count">

                      ${ps.length}

                      apólice${
                        ps.length === 1
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
                          c.phone
                        ) ||
                        "Sem telefone"
                      )}
                    </span>


                    <span>
                      ✉
                      ${esc(
                        c.email ||
                        "Sem e-mail"
                      )}
                    </span>


                    <span>
                      ▣
                      ${esc(
                        c.document ||
                        "Documento não informado"
                      )}
                    </span>

                  </div>


                  <div class="client-policies">

                    ${
                      ps
                        .slice(
                          0,
                          5
                        )
                        .map(
                          p => `
                            <div class="mini-policy">

                              <span>
                                ${esc(p.type)}
                                ·
                                ${esc(p.insurer)}
                              </span>

                              <b>
                                ${fmtDate(
                                  p.endDate
                                )}
                              </b>

                            </div>
                          `
                        )
                        .join("")
                    }


                    ${
                      ps.length > 5
                        ? `
                            <small>
                              + ${ps.length - 5}
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


                    <button
                      class="action-btn"
                      style="
                        color:#b42318;
                        border-color:#fecdca;
                        background:#fff5f5;
                      "
                      onclick="deleteClient('${c.id}')"
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

  const q =
    (
      $("#policySearch")
        ?.value ||
      ""
    )
      .toLowerCase();


  const sf =
    $("#statusFilter")
      ?.value ||
    "all";


  const ef =
    $("#expiryFilter")
      ?.value ||
    "all";


  const tf =
    $("#typeFilter")
      ?.value ||
    "all";


  const inf =
    $("#insurerFilter")
      ?.value ||
    "all";


  const arr =
    [...state.policies]
      .filter(
        p => {

          const c =
            clientById(
              p.clientId
            );


          const hay =
            [
              c?.name,
              p.number,
              p.insurer,
              p.type
            ]
              .join(" ")
              .toLowerCase();


          if (
            q &&
            !hay.includes(q)
          )
            return false;


          if (
            sf !== "all" &&
            p.status !== sf
          )
            return false;


          if (
            tf !== "all" &&
            p.type !== tf
          )
            return false;


          if (
            inf !== "all" &&
            p.insurer !== inf
          )
            return false;


          const d =
            daysUntil(
              p.endDate
            );


          if (
            ef === "expired" &&
            d >= 0
          )
            return false;


          if (
            ef !== "all" &&
            ef !== "expired" &&
            !(
              d >= 0 &&
              d <= Number(ef)
            )
          )
            return false;


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


  $("#policiesTable").innerHTML =
    arr.length
      ? arr
          .map(
            p => {

              const c =
                clientById(
                  p.clientId
                );

              const e =
                expiryLabel(p);


              return `
                <tr>

                  <td>

                    <div class="client-cell">

                      <div class="avatar">
                        ${initials(
                          c?.name
                        )}
                      </div>

                      <div>

                        <strong>
                          ${esc(
                            c?.name ||
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
                              c?.phone
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
                        p.type
                      )}
                    </b>

                    <small
                      style="
                        display:block;
                        color:#667085;
                      "
                    >
                      ${esc(
                        p.number
                      )}
                    </small>

                  </td>


                  <td>
                    ${esc(
                      p.insurer
                    )}
                  </td>


                  <td>

                    ${fmtDate(
                      p.startDate
                    )}

                    →

                    ${fmtDate(
                      p.endDate
                    )}

                  </td>


                  <td>

                    <span
                      class="pill ${processClass(
                        p.status
                      )}"
                    >
                      ${esc(
                        p.status
                      )}
                    </span>

                  </td>


                  <td>

                    <span
                      class="pill ${e.cls}"
                    >
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
                        p.pdfPath
                          ? `
                              <button
                                class="action-btn"
                                onclick="openPdf('${p.id}')"
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

  const cols = [
    "Pendente",
    "Em andamento",
    "Ganho"
  ];


  $("#kanban").innerHTML =
    cols
      .map(
        s => {

          const ps =
            state.policies.filter(
              p =>
                p.status === s
            );


          return `
            <div
              class="
                kanban-col
                ${
                  s === "Pendente"
                    ? "pendente"
                    : s === "Ganho"
                      ? "ganho"
                      : "andamento"
                }
              "
            >

              <h4>

                <span>
                  ${s}
                </span>

                <span>
                  ${ps.length}
                </span>

              </h4>


              ${
                ps.length
                  ? ps
                      .map(
                        p => {

                          const c =
                            clientById(
                              p.clientId
                            );


                          return `
                            <div class="kanban-card">

                              <strong>
                                ${esc(
                                  c?.name ||
                                  "Cliente"
                                )}
                              </strong>

                              <small>

                                ${esc(
                                  p.type
                                )}

                                ·

                                ${esc(
                                  p.insurer
                                )}

                                <br>

                                Vence:

                                ${fmtDate(
                                  p.endDate
                                )}

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
                                    p.status === "Pendente"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Pendente
                                </option>

                                <option
                                  ${
                                    p.status === "Em andamento"
                                      ? "selected"
                                      : ""
                                  }
                                >
                                  Em andamento
                                </option>

                                <option
                                  ${
                                    p.status === "Ganho"
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

  if (
    $("#cfgUser")
  ) {

    $("#cfgUser").value =
      state.user?.email ||
      "";

  }


  if (
    $("#emailEndpoint")
  ) {

    $("#emailEndpoint").value =
      state.settings.endpoint ||
      "";

  }


  if (
    $("#managerEmail")
  ) {

    $("#managerEmail").value =
      state.settings.managerEmail ||
      "";

  }


  if (
    $("#languageSelect")
  ) {

    $("#languageSelect").value =
      state.settings.language ||
      "pt-BR";

  }


  if (
    $("#cloudStatus")
  ) {

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
      v =>
        v.classList.remove(
          "active"
        )
    );


  const target =
    $("#" + view);


  if (
    !target
  )
    return;


  target.classList.add(
    "active"
  );


  $$(".nav-item")
    .forEach(
      b =>
        b.classList.toggle(
          "active",
          b.dataset.view === view
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


  $("#pageTitle").textContent =
    titles[view] ||
    "Dashboard";


  if (
    view === "dashboard"
  )
    renderDashboard();

}


/* =========================================================
   MODAIS
========================================================= */

function openModal(id) {

  const el =
    $("#" + id);

  if (
    el
  )
    el.classList.add(
      "open"
    );

}


function closeModal(id) {

  const el =
    $("#" + id);

  if (
    el
  )
    el.classList.remove(
      "open"
    );


  if (
    id === "pdfModal" &&
    $("#pdfFrame")
  )
    $("#pdfFrame").src = "";

}


/* =========================================================
   NOVO CLIENTE
========================================================= */

function newClient() {

  $("#clientForm").reset();

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

  const c =
    clientById(id);


  if (
    !c
  )
    return;


  $("#clientId").value =
    c.id;

  $("#clientName").value =
    c.name;

  $("#clientBirth").value =
    c.birthDate ||
    "";

  $("#clientPhone").value =
    formatPhone(
      c.phone
    );

  $("#clientDoc").value =
    c.document ||
    "";

  $("#clientEmail").value =
    c.email ||
    "";

  $("#clientNotes").value =
    c.notes ||
    "";

  $("#clientModalTitle").textContent =
    "Editar cliente";


  openModal(
    "clientModal"
  );

}


/* =========================================================
   SALVAR CLIENTE NO SUPABASE
========================================================= */

async function saveClient(e) {

  e.preventDefault();


  if (
    !state.user
  ) {

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
      "Informe um telefone celular válido com DDD."
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


  const c = {

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
      existing?.createdAt ||
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString()

  };


  try {

    const payload =
      clientToDb(c);


    const {
      data,
      error
    } =
      await sb
        .from("clients")
        .upsert(
          payload
        )
        .select()
        .single();


    if (
      error
    )
      throw error;


    const saved =
      clientFromDb(
        data
      );


    const index =
      state.clients.findIndex(
        x =>
          x.id === id
      );


    if (
      index >= 0
    )
      state.clients[index] =
        saved;
    else
      state.clients.push(
        saved
      );


    closeModal(
      "clientModal"
    );


    renderAll();


    toast(
      "Cliente salvo na nuvem com sucesso."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível salvar o cliente."
    );

  }

}


/* =========================================================
   RESET DO FORMULÁRIO DA APÓLICE
========================================================= */

function resetPolicyForm(
  clientId = ""
) {

  $("#policyForm")
    .reset();


  $("#policyId").value =
    "";

  $("#policyParentId").value =
    "";

  $("#policyRenewedFrom").value =
    "";

  $("#currentPdfName").textContent =
    "";


  $("#renewInfo")
    .classList
    .add(
      "hidden"
    );


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

async function editPolicy(id) {

  const p =
    policyById(id);


  if (
    !p
  )
    return;


  resetPolicyForm(
    p.clientId
  );


  $("#policyId").value =
    p.id;

  $("#policyInsurer").value =
    p.insurer;

  $("#policyType").value =
    p.type;

  $("#policyNumber").value =
    p.number;

  $("#policyStart").value =
    p.startDate;

  $("#policyEnd").value =
    p.endDate;

  $("#policyStatus").value =
    p.status;

  $("#policyNotes").value =
    p.notes ||
    "";


  $("#alert30").checked =
    p.alerts?.[30] !== false;

  $("#alert15").checked =
    p.alerts?.[15] !== false;

  $("#alert7").checked =
    p.alerts?.[7] !== false;

  $("#alert1").checked =
    p.alerts?.[1] !== false;

  $("#alertExpired").checked =
    p.alerts?.expired !== false;


  if (
    p.pdfPath
  ) {

    const fileName =
      p.pdfPath
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
   CAMINHO SEGURO DO PDF
========================================================= */

function safeFileName(name) {

  return String(
    name ||
    "apolice.pdf"
  )
    .normalize("NFD")
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

  if (
    !state.user
  )
    throw new Error(
      "Usuário não autenticado."
    );


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


  if (
    error
  )
    throw error;


  return path;

}


/* =========================================================
   REMOVER PDF DO STORAGE
========================================================= */

async function removePolicyPdf(
  path
) {

  if (
    !path
  )
    return;


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


  if (
    error
  )
    throw error;

}


/* =========================================================
   SALVAR APÓLICE
========================================================= */

async function savePolicy(e) {

  e.preventDefault();


  if (
    !state.user
  ) {

    toast(
      "Sua sessão expirou. Entre novamente."
    );

    return null;

  }


  const clientId =
    $("#policyClient").value;


  if (
    !clientId
  ) {

    toast(
      "Selecione o cliente."
    );

    return null;

  }


  if (
    $("#policyStart").value >
    $("#policyEnd").value
  ) {

    toast(
      "O fim da vigência não pode ser anterior ao início."
    );

    return null;

  }


  const oldId =
    $("#policyId").value;


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
      .files[0];


  let newPdfPath =
    null;


  try {

    if (
      file
    ) {

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


    const p = {

      id:
        policyId,

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
        $("#policyStart")
          .value,

      endDate:
        $("#policyEnd")
          .value,

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

      pdfPath,

      renewedFrom:
        $("#policyRenewedFrom")
          .value ||
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
          policyToDb(p)
        )
        .select()
        .single();


    if (
      error
    )
      throw error;


    const saved =
      policyFromDb(
        data
      );


    const i =
      state.policies.findIndex(
        x =>
          x.id ===
          saved.id
      );


    if (
      i >= 0
    )
      state.policies[i] =
        saved;
    else
      state.policies.push(
        saved
      );


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
      catch (pdfErr) {

        console.warn(
          "PDF antigo não pôde ser removido:",
          pdfErr
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
  catch (err) {

    console.error(
      err
    );


    if (
      newPdfPath
    ) {

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
q    console.error(
      err
    );

    toast(
      "Não foi possível atualizar o status."
    );

  }

}


/* =========================================================
   DETALHES DA APÓLICE
========================================================= */

function openDetails(id) {

  const p =
    policyById(id);


  if (!p)
    return;


  const c =
    clientById(
      p.clientId
    );


  const e =
    expiryLabel(p);


  const history =
    state.events
      .filter(
        x =>
          x.policyId === id
      )
      .sort(
        (a, b) =>
          new Date(
            b.date
          ) -
          new Date(
            a.date
          )
      );


  $("#detailsTitle")
    .textContent =
    c?.name ||
    "Cliente";


  $("#detailsSubtitle")
    .textContent =
    `${p.type} · ${p.insurer}`;


  $("#detailsBody")
    .innerHTML = `

      <div class="details-grid">

        <div class="detail-box">

          <small>
            Segurado
          </small>

          <strong>
            ${esc(
              c?.name ||
              "—"
            )}
          </strong>

        </div>


        <div class="detail-box">

          <small>
            Nascimento
          </small>

          <strong>
            ${fmtDate(
              c?.birthDate
            )}
          </strong>

        </div>


        <div class="detail-box">

          <small>
            Telefone
          </small>

          <strong>
            ${esc(
              formatPhone(
                c?.phone
              ) ||
              "—"
            )}
          </strong>

        </div>


        <div class="detail-box">

          <small>
            Seguradora
          </small>

          <strong>
            ${esc(
              p.insurer
            )}
          </strong>

        </div>


        <div class="detail-box">

          <small>
            Tipo
          </small>

          <strong>
            ${esc(
              p.type
            )}
          </strong>

        </div>


        <div class="detail-box">

          <small>
            Nº apólice
          </small>

          <strong>
            ${esc(
              p.number ||
              "—"
            )}
          </strong>

        </div>


        <div class="detail-box">

          <small>
            Início da vigência
          </small>

          <strong>
            ${fmtDate(
              p.startDate
            )}
          </strong>

        </div>


        <div class="detail-box">

          <small>
            Fim da vigência
          </small>

          <strong>
            ${fmtDate(
              p.endDate
            )}
          </strong>

        </div>


        <div class="detail-box">

          <small>
            Situação
          </small>

          <strong>

            <span
              class="pill ${e.cls}"
            >
              ${e.text}
            </span>

          </strong>

        </div>


        <div class="detail-box">

          <small>
            Renovação
          </small>

          <strong>

            <span
              class="pill ${processClass(
                p.status
              )}"
            >
              ${esc(
                p.status
              )}
            </span>

          </strong>

        </div>


        <div class="detail-box">

          <small>
            PDF
          </small>

          <strong>

            ${
              p.pdfPath
                ? `
                    <button
                      class="link-btn"
                      onclick="openPdf('${p.id}')"
                    >
                      Abrir documento
                    </button>
                  `
                : "Sem anexo"
            }

          </strong>

        </div>


        <div
          class="
            detail-box
            detail-wide
          "
        >

          <small>
            Observações
          </small>

          <strong>
            ${esc(
              p.notes ||
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
          ✉ Alerta por e-mail
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
          onclick="deletePolicy('${p.id}')"
        >
          🗑 Excluir
        </button>


        <button
          class="btn btn-primary"
          onclick="
            renewPolicy('${p.id}');
            closeModal('detailsModal');
          "
        >
          ↻ Renovar apólice
        </button>

      </div>


      <div class="timeline">

        <h4>
          Histórico
        </h4>

        ${
          history.length
            ? history
                .map(
                  h => `

                    <div class="timeline-item">

                      <b>
                        ${esc(
                          h.message
                        )}
                      </b>

                      <small>
                        ${
                          new Date(
                            h.date
                          )
                            .toLocaleString(
                              "pt-BR"
                            )
                        }
                      </small>

                    </div>

                  `
                )
                .join("")
            : `
                <p class="mini-note">
                  Sem eventos registrados.
                </p>
              `
        }

      </div>
    `;


  openModal(
    "detailsModal"
  );

}


/* =========================================================
   MODAL PROFISSIONAL DE EXCLUSÃO
========================================================= */

function createDeleteModal() {

  if (
    document.getElementById(
      "deleteSystemModal"
    )
  )
    return;


  const style =
    document.createElement(
      "style"
    );


  style.textContent = `

    .delete-system-overlay{

      position:fixed;
      inset:0;

      background:
        rgba(15,23,42,.58);

      backdrop-filter:
        blur(3px);

      display:none;

      align-items:center;
      justify-content:center;

      z-index:99999;

      padding:20px;

      animation:
        deleteFadeIn .18s ease;

    }


    .delete-system-overlay.open{

      display:flex;

    }


    .delete-system-card{

      width:100%;

      max-width:460px;

      background:#ffffff;

      border-radius:18px;

      box-shadow:
        0 24px 70px
        rgba(15,23,42,.28);

      overflow:hidden;

      animation:
        deleteCardIn .22s ease;

    }


    .delete-system-content{

      padding:
        30px 30px 22px;

      text-align:center;

    }


    .delete-system-icon{

      width:62px;
      height:62px;

      margin:
        0 auto 18px;

      border-radius:50%;

      background:#fff1f0;

      color:#d92d20;

      display:flex;

      align-items:center;
      justify-content:center;

      font-size:27px;

      border:
        1px solid #fecdca;

    }


    .delete-system-icon.warning{

      background:#fffaeb;

      color:#dc6803;

      border-color:#fedf89;

    }


    .delete-system-title{

      margin:
        0 0 10px;

      color:#101828;

      font-size:20px;

      font-weight:700;

    }


    .delete-system-message{

      margin:0;

      color:#667085;

      font-size:14px;

      line-height:1.6;

      white-space:pre-line;

    }


    .delete-system-actions{

      display:flex;

      gap:10px;

      padding:
        18px 24px 24px;

    }


    .delete-system-btn{

      flex:1;

      min-height:44px;

      border-radius:10px;

      border:
        1px solid #d0d5dd;

      background:#ffffff;

      color:#344054;

      font-size:14px;

      font-weight:600;

      cursor:pointer;

      transition:
        .15s ease;

    }


    .delete-system-btn:hover{

      background:#f9fafb;

    }


    .delete-system-btn-danger{

      border-color:#d92d20;

      background:#d92d20;

      color:#ffffff;

    }


    .delete-system-btn-danger:hover{

      background:#b42318;

    }


    .delete-system-btn-primary{

      border-color:#155eef;

      background:#155eef;

      color:#ffffff;

    }


    .delete-system-btn-primary:hover{

      background:#004eeb;

    }


    @keyframes deleteFadeIn{

      from{
        opacity:0;
      }

      to{
        opacity:1;
      }

    }


    @keyframes deleteCardIn{

      from{

        opacity:0;

        transform:
          translateY(12px)
          scale(.97);

      }

      to{

        opacity:1;

        transform:
          translateY(0)
          scale(1);

      }

    }


    @media(max-width:520px){

      .delete-system-card{

        max-width:100%;

      }


      .delete-system-content{

        padding:
          26px 20px 18px;

      }


      .delete-system-actions{

        padding:
          16px 20px 20px;

        flex-direction:
          column-reverse;

      }

    }

  `;


  document.head.appendChild(
    style
  );


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "deleteSystemModal";


  modal.className =
    "delete-system-overlay";


  modal.innerHTML = `

    <div class="delete-system-card">

      <div class="delete-system-content">

        <div
          id="deleteSystemIcon"
          class="delete-system-icon"
        >
          🗑
        </div>


        <h3
          id="deleteSystemTitle"
          class="delete-system-title"
        >
          Confirmar exclusão
        </h3>


        <p
          id="deleteSystemMessage"
          class="delete-system-message"
        ></p>

      </div>


      <div
        id="deleteSystemActions"
        class="delete-system-actions"
      ></div>

    </div>

  `;


  document.body.appendChild(
    modal
  );

}


/* =========================================================
   AVISO DE EXCLUSÃO
========================================================= */

function deleteAlert(
  title,
  message
) {

  createDeleteModal();


  return new Promise(
    resolve => {

      const modal =
        document.getElementById(
          "deleteSystemModal"
        );


      const icon =
        document.getElementById(
          "deleteSystemIcon"
        );


      const titleEl =
        document.getElementById(
          "deleteSystemTitle"
        );


      const messageEl =
        document.getElementById(
          "deleteSystemMessage"
        );


      const actions =
        document.getElementById(
          "deleteSystemActions"
        );


      icon.className =
        "delete-system-icon warning";


      icon.textContent =
        "!";


      titleEl.textContent =
        title;


      messageEl.textContent =
        message;


      actions.innerHTML = `

        <button
          id="deleteAlertOk"
          class="
            delete-system-btn
            delete-system-btn-primary
          "
        >
          Entendi
        </button>

      `;


      modal.classList.add(
        "open"
      );


      document
        .getElementById(
          "deleteAlertOk"
        )
        .onclick =
        () => {

          modal.classList.remove(
            "open"
          );

          resolve();

        };

    }
  );

}


/* =========================================================
   CONFIRMAÇÃO DE EXCLUSÃO
========================================================= */

function deleteConfirm(
  title,
  message
) {

  createDeleteModal();


  return new Promise(
    resolve => {

      const modal =
        document.getElementById(
          "deleteSystemModal"
        );


      const icon =
        document.getElementById(
          "deleteSystemIcon"
        );


      const titleEl =
        document.getElementById(
          "deleteSystemTitle"
        );


      const messageEl =
        document.getElementById(
          "deleteSystemMessage"
        );


      const actions =
        document.getElementById(
          "deleteSystemActions"
        );


      icon.className =
        "delete-system-icon";


      icon.textContent =
        "🗑";


      titleEl.textContent =
        title;


      messageEl.textContent =
        message;


      actions.innerHTML = `

        <button
          id="deleteCancelBtn"
          class="delete-system-btn"
        >
          Cancelar
        </button>


        <button
          id="deleteConfirmBtn"
          class="
            delete-system-btn
            delete-system-btn-danger
          "
        >
          Sim, excluir
        </button>

      `;


      modal.classList.add(
        "open"
      );


      document
        .getElementById(
          "deleteCancelBtn"
        )
        .onclick =
        () => {

          modal.classList.remove(
            "open"
          );

          resolve(
            false
          );

        };


      document
        .getElementById(
          "deleteConfirmBtn"
        )
        .onclick =
        () => {

          modal.classList.remove(
            "open"
          );

          resolve(
            true
          );

        };

    }
  );

}


/* =========================================================
   EXCLUIR APÓLICE DO SUPABASE
========================================================= */

async function deletePolicy(id) {

  const p =
    policyById(id);


  if (!p) {

    toast(
      "Apólice não encontrada."
    );

    return;

  }


  const c =
    clientById(
      p.clientId
    );


  const confirmar =
    await deleteConfirm(
      "Excluir apólice?",
      `Você está prestes a excluir a apólice ${p.number || "sem número"} do cliente ${c?.name || "Cliente"}.

O PDF e todo o histórico desta apólice também serão excluídos.

Essa ação não poderá ser desfeita.`
    );


  if (!confirmar)
    return;


  try {

    /*
      Primeiro remove o PDF.
    */

    if (
      p.pdfPath
    ) {

      await removePolicyPdf(
        p.pdfPath
      );

    }


    /*
      Os eventos possuem vínculo
      com a apólice.

      Mesmo havendo ON DELETE CASCADE,
      removemos explicitamente para
      manter o comportamento claro.
    */

    const {
      error:
        eventsError
    } =
      await sb
        .from("events")
        .delete()
        .eq(
          "policy_id",
          id
        );


    if (
      eventsError
    )
      throw eventsError;


    /*
      Se alguma renovação aponta
      para esta apólice, limpa
      renewed_from antes da exclusão.
    */

    const {
      error:
        linksError
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


    if (
      linksError
    )
      throw linksError;


    const {
      error:
        policyError
    } =
      await sb
        .from("policies")
        .delete()
        .eq(
          "id",
          id
        );


    if (
      policyError
    )
      throw policyError;


    state.events =
      state.events.filter(
        e =>
          e.policyId !== id
      );


    state.policies.forEach(
      item => {

        if (
          item.renewedFrom === id
        )
          item.renewedFrom =
            null;

      }
    );


    state.policies =
      state.policies.filter(
        item =>
          item.id !== id
      );


    closeModal(
      "detailsModal"
    );


    renderAll();


    toast(
      "Apólice excluída com sucesso."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível excluir a apólice."
    );

  }

}


/* =========================================================
   EXCLUIR CLIENTE
========================================================= */

async function deleteClient(id) {

  const c =
    clientById(id);


  if (!c) {

    toast(
      "Cliente não encontrado."
    );

    return;

  }


  const apolices =
    state.policies.filter(
      p =>
        p.clientId === id
    );


  if (
    apolices.length > 0
  ) {

    await deleteAlert(
      "Não foi possível excluir",
      `${c.name} possui ${apolices.length} apólice${apolices.length === 1 ? "" : "s"} cadastrada${apolices.length === 1 ? "" : "s"}.

Para excluir este cliente, remova primeiro todas as apólices vinculadas a ele.`
    );


    return;

  }


  const confirmar =
    await deleteConfirm(
      "Excluir cliente?",
      `Você está prestes a excluir o cliente ${c.name}.

Essa ação não poderá ser desfeita.`
    );


  if (!confirmar)
    return;


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


    if (
      error
    )
      throw error;


    state.clients =
      state.clients.filter(
        x =>
          x.id !== id
      );


    closeModal(
      "clientModal"
    );


    renderAll();


    toast(
      "Cliente excluído com sucesso."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível excluir o cliente."
    );

  }

}


/* =========================================================
   RENOVAR APÓLICE
========================================================= */

function renewPolicy(id) {

  const old =
    policyById(id);


  if (!old)
    return;


  resetPolicyForm(
    old.clientId
  );


  $("#policyRenewedFrom")
    .value =
    old.id;


  $("#policyInsurer")
    .value =
    old.insurer;


  $("#policyType")
    .value =
    old.type;


  $("#policyStatus")
    .value =
    "Em andamento";


  $("#policyNotes")
    .value =
    `Renovação da apólice ${old.number}. Histórico da apólice anterior mantido no CRM.`;


  $("#renewInfo")
    .textContent =
    `Esta nova apólice ficará vinculada à anterior (${old.number}). A apólice antiga não será apagada.`;


  $("#renewInfo")
    .classList
    .remove(
      "hidden"
    );


  $("#policyModalTitle")
    .textContent =
    "Nova apólice de renovação";


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
    policyById(
      oldId
    );


  if (!old)
    return;


  try {

    const {
      error
    } =
      await sb
        .from("policies
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


    if (
      error
    )
      throw error;


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
  catch (err) {

    console.error(
      "Erro ao finalizar renovação:",
      err
    );


    toast(
      "A nova apólice foi salva, mas houve erro ao atualizar o histórico da renovação."
    );

  }

}


/* =========================================================
   ABRIR PDF PRIVADO DO SUPABASE
========================================================= */

async function openPdf(id) {

  const p =
    policyById(id);


  if (
    !p?.pdfPath
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
          p.pdfPath,
          300
        );


    if (
      error
    )
      throw error;


    if (
      !data?.signedUrl
    )
      throw new Error(
        "URL do PDF não recebida."
      );


    const fileName =
      p.pdfPath
        .split("/")
        .pop();


    $("#pdfTitle")
      .textContent =
      decodeURIComponent(
        fileName ||
        "Documento da apólice"
      );


    $("#pdfFrame")
      .src =
      data.signedUrl;


    openModal(
      "pdfModal"
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível abrir o PDF."
    );

  }

}


/* =========================================================
   WHATSAPP
========================================================= */

function manualWhatsApp(id) {

  const p =
    policyById(id);


  if (!p)
    return;


  const c =
    clientById(
      p.clientId
    );


  if (
    !c?.phone
  ) {

    toast(
      "Este cliente não possui telefone cadastrado."
    );

    return;

  }


  const d =
    daysUntil(
      p.endDate
    );


  let prazo;


  if (
    d < 0
  ) {

    prazo =
      `venceu há ${Math.abs(d)} dia(s)`;

  }
  else if (
    d === 0
  ) {

    prazo =
      "vence hoje";

  }
  else {

    prazo =
      `vence em ${d} dia(s)`;

  }


  const msg =
    `Olá, ${c.name}! Aqui é da SAVA Seguros. Estamos entrando em contato sobre sua apólice ${p.number}, do seguro ${p.type}, que ${prazo} (${fmtDate(p.endDate)}). Podemos conversar sobre a renovação?`;


  window.open(
    "https://wa.me/55" +
    cleanPhone(
      c.phone
    ) +
    "?text=" +
    encodeURIComponent(
      msg
    ),
    "_blank"
  );

}    
/* =========================================================
   CORPO DO E-MAIL INTERNO PARA A SAVA
========================================================= */

function emailBody(p) {

  const c =
    clientById(
      p.clientId
    );

  const d =
    daysUntil(
      p.endDate
    );


  let prazo =
    d < 0
      ? `venceu há ${Math.abs(d)} dia(s)`
      : d === 0
        ? "vence hoje"
        : `vence em ${d} dia(s)`;


  return `
ALERTA DE RENOVAÇÃO — SAVA SEGUROS

Cliente: ${c?.name || "Cliente"}
Telefone: ${formatPhone(c?.phone) || "Não informado"}
E-mail: ${c?.email || "Não informado"}

Tipo de seguro: ${p.type}
Seguradora: ${p.insurer}
Número da apólice: ${p.number || "Não informado"}

Início da vigência: ${fmtDate(p.startDate)}
Fim da vigência: ${fmtDate(p.endDate)}

Situação: ${prazo}
Status comercial: ${p.status}

Observações:
${p.notes || "Sem observações."}

Este é um alerta interno automático da Central de Renovações da SAVA Seguros.
`;

}


/* =========================================================
   ENVIAR E-MAIL PARA O GESTOR
========================================================= */

async function sendEmail(id) {

  const p =
    policyById(id);


  if (!p) {

    toast(
      "Apólice não encontrada."
    );

    return false;

  }


  const c =
    clientById(
      p.clientId
    );


  const recipient =
    state.settings.managerEmail;


  if (!recipient) {

    toast(
      "Configure o e-mail do gestor em Configurações."
    );

    return false;

  }


  if (!state.settings.endpoint) {

    toast(
      "Configure o endpoint do Google Apps Script."
    );

    return false;

  }


  try {

    const r =
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

              to:
                recipient,

              name:
                c?.name ||
                "Cliente",

              subject:
                `Renovação ${p.number || ""} - ${c?.name || "Cliente"} - SAVA Seguros`,

              body:
                emailBody(p),

              policyId:
                p.id

            })
        }
      );


    const j =
      await r.json();


    if (!j.ok)
      throw new Error(
        j.error ||
        "Falha no envio."
      );


    await recordEmail(
      p
    );


    toast(
      "Alerta enviado para o e-mail da SAVA."
    );


    return true;

  }
  catch (err) {

    console.error(
      "Erro de e-mail:",
      err
    );


    toast(
      "Falha no endpoint de e-mail."
    );


    return false;

  }

}


/* =========================================================
   REGISTRAR E-MAIL NO HISTÓRICO
========================================================= */

async function recordEmail(p) {

  await addEvent(
    p.id,
    "email",
    "Alerta de renovação enviado por e-mail"
  );

}


/* =========================================================
   STATUS DA AUTOMAÇÃO
========================================================= */

function checkAutomation() {

  const configured =
    !!(
      state.settings.endpoint &&
      state.settings.managerEmail
    );


  const badge =
    $("#emailAutomationBadge");


  if (!badge)
    return;


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


  autoEmailScan();

}


/* =========================================================
   VERIFICAR ALERTAS AUTOMÁTICOS
========================================================= */

async function autoEmailScan() {

  if (
    !state.settings.endpoint ||
    !state.settings.managerEmail
  )
    return;


  const hoje =
    iso(
      new Date()
    );


  const sentToday =
    state.events
      .filter(
        e =>
          e.type === "email" &&
          e.date?.slice(
            0,
            10
          ) === hoje
      )
      .map(
        e =>
          e.policyId
      );


  for (
    const p of state.policies
  ) {

    const d =
      daysUntil(
        p.endDate
      );


    const mark =
      [30, 15, 7, 1]
        .includes(d)
        ? d
        : (
            d < 0 &&
            d >= -1
              ? "expired"
              : null
          );


    if (
      mark === null ||
      sentToday.includes(
        p.id
      )
    )
      continue;


    const enabled =
      p.alerts?.[mark] !== false;


    if (enabled) {

      await sendEmail(
        p.id
      );

    }

  }

}


/* =========================================================
   RELATÓRIO
========================================================= */

function generateReport() {

  const total =
    state.policies.length;


  const expired =
    state.policies.filter(
      p =>
        daysUntil(
          p.endDate
        ) < 0
    ).length;


  const d7 =
    state.policies.filter(
      p => {

        const d =
          daysUntil(
            p.endDate
          );

        return (
          d >= 0 &&
          d <= 7
        );

      }
    ).length;


  const pending =
    state.policies.filter(
      p =>
        p.status ===
        "Pendente"
    ).length;


  const andamento =
    state.policies.filter(
      p =>
        p.status ===
        "Em andamento"
    ).length;


  const won =
    state.policies.filter(
      p =>
        p.status ===
        "Ganho"
    ).length;


  const risk =
    [...state.policies]
      .filter(
        p =>
          daysUntil(
            p.endDate
          ) <= 30 &&
          p.status !==
          "Ganho"
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
        5
      );


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

        <strong>
          ${total}
        </strong>

        <small>
          apólices
        </small>

      </div>


      <div class="report-box">

        <strong>
          ${d7}
        </strong>

        <small>
          vencem em até 7 dias
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
          ${andamento}
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

    </div>


    <h4>
      Prioridades
    </h4>


    <ul>

      ${
        risk.length
          ? risk
              .map(
                p => `

                  <li>

                    <b>
                      ${esc(
                        clientById(
                          p.clientId
                        )?.name ||
                        "Cliente"
                      )}
                    </b>

                    —

                    ${esc(
                      p.type
                    )},

                    ${esc(
                      p.insurer
                    )}

                    —

                    ${expiryLabel(p).text}

                    —

                    processo:

                    ${esc(
                      p.status
                    )}

                  </li>

                `
              )
              .join("")
          : `
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
          ? "Existem apólices vencidas que devem ser tratadas imediatamente. "
          : ""
      }

      ${
        d7
          ? "Há apólices nos próximos 7 dias e elas devem ficar no topo da rotina comercial. "
          : ""
      }

      ${
        pending
          ? "Há renovações ainda pendentes de cotação. "
          : ""
      }

      ${
        andamento
          ? "Existem negociações em andamento que podem virar ganhos. "
          : ""
      }

      ${
        !expired &&
        !d7 &&
        !pending
          ? "A carteira está sem sinais críticos pelos indicadores atuais."
          : ""
      }

    </p>

  `;

}


/* =========================================================
   MOSTRAR RELATÓRIO
========================================================= */

function showReport() {

  const html =
    generateReport();


  $("#reportArea")
    .innerHTML =
    html;


  go(
    "relatorios"
  );

}


/* =========================================================
   LOGIN COM SUPABASE
========================================================= */

async function loginWithSupabase(e) {

  e.preventDefault();


  const email =
    $("#loginUser")
      .value
      .trim();


  const password =
    $("#loginPass")
      .value;


  const errorBox =
    $("#loginError");


  errorBox.textContent =
    "";


  if (
    !email ||
    !password
  ) {

    errorBox.textContent =
      "Informe o e-mail e a senha.";

    return;

  }


  try {

    const {
      data,
      error
    } =
      await sb
        .auth
        .signInWithPassword({
          email,
          password
        });


    if (error)
      throw error;


    state.user =
      data.user;


    showApp();


    await loadCloudData();


    toast(
      "Login realizado com sucesso."
    );

  }
  catch (err) {

    console.error(
      err
    );


    errorBox.textContent =
      "E-mail ou senha incorretos.";

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await sb
      .auth
      .signOut();

  }
  catch (err) {

    console.error(
      err
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


  showLogin();

}


/* =========================================================
   ALTERAR SENHA
========================================================= */

async function saveAccountSettings() {

  if (
    !state.user
  )
    return;


  const password =
    $("#cfgPass")
      .value;


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
      "A nova senha precisa ter pelo menos 6 caracteres."
    );

    return;

  }


  try {

    const {
      error
    } =
      await sb
        .auth
        .updateUser({
          password
        });


    if (error)
      throw error;


    $("#cfgPass").value =
      "";


    toast(
      "Senha atualizada com sucesso."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível alterar a senha."
    );

  }

}


/* =========================================================
   RECUPERAR SENHA
========================================================= */

async function forgotPassword() {

  const email =
    $("#loginUser")
      .value
      .trim();


  if (!email) {

    toast(
      "Digite seu e-mail no campo de usuário primeiro."
    );

    return;

  }


  try {

    const {
      error
    } =
      await sb
        .auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo:
              window.location.origin +
              window.location.pathname
          }
        );


    if (error)
      throw error;


    toast(
      "E-mail de recuperação enviado."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível enviar a recuperação de senha."
    );

  }

}


/* =========================================================
   SALVAR CONFIGURAÇÃO DE E-MAIL
========================================================= */

async function saveEmailSettings() {

  state.settings.endpoint =
    $("#emailEndpoint")
      .value
      .trim();


  state.settings.managerEmail =
    $("#managerEmail")
      .value
      .trim();


  if (
    state.settings.managerEmail &&
    !state.settings.managerEmail.includes("@")
  ) {

    toast(
      "Informe um e-mail válido."
    );

    return;

  }


  try {

    await saveCloudSettings();


    checkAutomation();


    toast(
      "Configuração de e-mail salva."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível salvar as configurações."
    );

  }

}


/* =========================================================
   SALVAR IDIOMA
========================================================= */

async function saveLanguage() {

  state.settings.language =
    $("#languageSelect")
      .value;


  try {

    await saveCloudSettings();


    toast(
      "Idioma salvo."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível salvar o idioma."
    );

  }

}


/* =========================================================
   EXPORTAR BACKUP DA NUVEM
========================================================= */

async function exportBackup() {

  const data = {

    version:
      3,

    source:
      "SAVA CRM Supabase",

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
          data,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const a =
    document.createElement(
      "a"
    );


  a.href =
    URL.createObjectURL(
      blob
    );


  a.download =
    `backup-sava-${iso(new Date())}.json`;


  document.body.appendChild(
    a
  );


  a.click();


  a.remove();


  URL.revokeObjectURL(
    a.href
  );


  toast(
    "Backup exportado."
  );

}


/* =========================================================
   IMPORTAR BACKUP PARA A NUVEM
========================================================= */

async function importBackup(e) {

  const file =
    e.target.files[0];


  if (!file)
    return;


  if (!state.user) {

    toast(
      "Entre no sistema antes de importar."
    );

    e.target.value =
      "";

    return;

  }


  try {

    const data =
      JSON.parse(
        await file.text()
      );


    if (!data.version)
      throw new Error(
        "Backup inválido."
      );


    /*
      CLIENTES
    */

    for (
      const c of data.clients || []
    ) {

      const normalized = {

        id:
          validUuid(c.id)
            ? c.id
            : uid(),

        name:
          c.name ||
          "Cliente",

        birthDate:
          c.birthDate ||
          "",

        phone:
          cleanPhone(
            c.phone
          ),

        document:
          c.document ||
          "",

        email:
          c.email ||
          "",

        notes:
          c.notes ||
          "",

        createdAt:
          c.createdAt ||
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


      if (error)
        throw error;

    }


    /*
      RECARREGA CLIENTES
      ANTES DAS APÓLICES
    */

    await loadCloudData();


    /*
      APÓLICES
    */

    for (
      const p of data.policies || []
    ) {

      let clientId =
        p.clientId;


      if (
        !state.clients.some(
          c =>
            c.id ===
            clientId
        )
      ) {

        const originalClient =
          (data.clients || [])
            .find(
              c =>
                c.id ===
                p.clientId
            );


        if (
          originalClient
        ) {

          const match =
            state.clients.find(
              c =>
                c.name ===
                originalClient.name &&
                c.phone ===
                cleanPhone(
                  originalClient.phone
                )
            );


          if (match)
            clientId =
              match.id;

        }

      }


      if (
        !state.clients.some(
          c =>
            c.id ===
            clientId
        )
      )
        continue;


      const normalized = {

        id:
          validUuid(p.id)
            ? p.id
            : uid(),

        clientId,

        insurer:
          p.insurer ||
          "Outra",

        type:
          p.type ||
          "Outro",

        number:
          p.number ||
          "",

        startDate:
          p.startDate ||
          "",

        endDate:
          p.endDate ||
          "",

        status:
          p.status ||
          "Pendente",

        notes:
          p.notes ||
          "",

        alerts:
          p.alerts || {
            30: true,
            15: true,
            7: true,
            1: true,
            expired: true
          },

        pdfPath:
          p.pdfPath ||
          null,

        renewedFrom:
          validUuid(
            p.renewedFrom
          )
            ? p.renewedFrom
            : null,

        createdAt:
          p.createdAt ||
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


      if (error)
        throw error;

    }


    /*
      CONFIGURAÇÕES
    */

    if (
      data.settings
    ) {

      state.settings.endpoint =
        data.settings.endpoint ||
        state.settings.endpoint;


      state.settings.managerEmail =
        data.settings.managerEmail ||
        state.settings.managerEmail;


      state.settings.language =
        data.settings.language ||
        state.settings.language;


      await saveCloudSettings();

    }


    await loadCloudData();


    toast(
      "Backup importado para a nuvem."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Backup inválido ou não foi possível importar."
    );

  }


  e.target.value =
    "";

}


/* =========================================================
   APAGAR DADOS DA NUVEM
========================================================= */

async function clearAll() {

  const confirmar =
    await deleteConfirm(
      "Apagar todos os dados?",
      `Todos os clientes, apólices, históricos e PDFs desta conta serão excluídos.

Essa ação não poderá ser desfeita.`
    );


  if (!confirmar)
    return;


  try {

    /*
      PRIMEIRO REMOVE PDFs
    */

    const paths =
      state.policies
        .map(
          p =>
            p.pdfPath
        )
        .filter(
          Boolean
        );


    if (
      paths.length
    ) {

      const {
        error
      } =
        await sb
          .storage
          .from(
            "policy-pdfs"
          )
          .remove(
            paths
          );


      if (error)
        throw error;

    }


    /*
      EVENTOS
    */

    const {
      error:
        eventsError
    } =
      await sb
        .from("events")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );


    if (eventsError)
      throw eventsError;


    /*
      APÓLICES
    */

    const {
      error:
        policiesError
    } =
      await sb
        .from("policies")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );


    if (policiesError)
      throw policiesError;


    /*
      CLIENTES
    */

    const {
      error:
        clientsError
    } =
      await sb
        .from("clients")
        .delete()
        .eq(
          "user_id",
          state.user.id
        );


    if (clientsError)
      throw clientsError;


    state.clients =
      [];

    state.policies =
      [];

    state.events =
      [];


    renderAll();


    toast(
      "Dados apagados da nuvem."
    );

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível apagar todos os dados."
    );

  }

}


/* =========================================================
   MIGRAR DADOS ANTIGOS DO INDEXEDDB PARA SUPABASE
========================================================= */

async function migrateLocalDataToCloud() {

  if (!state.user) {

    toast(
      "Faça login antes de migrar os dados."
    );

    return;

  }


  const confirmar =
    await deleteConfirm(
      "Migrar dados deste dispositivo?",
      `O sistema vai procurar clientes, apólices, históricos e PDFs salvos na versão antiga deste navegador e enviar os dados para a nuvem.

Os dados locais não serão apagados automaticamente.`
    );


  if (!confirmar)
    return;


  let db;


  try {

    db =
      await openLegacyDB();

  }
  catch (err) {

    console.error(
      err
    );


    toast(
      "Não foi possível acessar os dados antigos."
    );

    return;

  }


  if (!db) {

    toast(
      "Nenhum banco local antigo foi encontrado."
    );

    return;

  }


  try {

    const localClients =
      await legacyGetAll(
        db,
        "clients"
      );


    const localPolicies =
      await legacyGetAll(
        db,
        "policies"
      );


    const localEvents =
      await legacyGetAll(
        db,
        "events"
      );


    const localPdfs =
      await legacyGetAll(
        db,
        "pdfs"
      );


    if (
      !localClients.length &&
      !localPolicies.length
    ) {

      toast(
        "Não há clientes ou apólices locais para migrar."
      );

      db.close();

      return;

    }


    const clientMap =
      new Map();


    /*
      MIGRA CLIENTES
    */

    for (
      const old of localClients
    ) {

      const newId =
        validUuid(
          old.id
        )
          ? old.id
          : uid();


      clientMap.set(
        old.id,
        newId
      );


      const c = {

        id:
          newId,

        name:
          old.name ||
          "Cliente",

        birthDate:
          old.birthDate ||
          "",

        phone:
          cleanPhone(
            old.phone
          ),

        document:
          old.document ||
          "",

        email:
          old.email ||
          "",

        notes:
          old.notes ||
          "",

        createdAt:
          old.createdAt ||
          new Date()
            .toISOString(),

        updatedAt:
          old.updatedAt ||
          new Date()
            .toISOString()

      };


      const {
        error
      } =
        await sb
          .from("clients")
          .upsert(
            clientToDb(c)
          );


      if (error)
        throw error;

    }


    const policyMap =
      new Map();


    /*
      MIGRA APÓLICES
    */

    for (
      const old of localPolicies
    ) {

      const newId =
        validUuid(
          old.id
        )
          ? old.id
          : uid();


      policyMap.set(
        old.id,
        newId
      );


      const newClientId =
        clientMap.get(
          old.clientId
        );


      if (
        !newClientId
      )
        continue;


      let pdfPath =
        null;


      if (
        old.pdfId
      ) {

        const pdf =
          localPdfs.find(
            x =>
              x.id ===
              old.pdfId
          );


        if (
          pdf?.blob
        ) {

          const name =
            safeFileName(
              pdf.name ||
              "apolice.pdf"
            );


          pdfPath =
            `${state.user.id}/${newId}/${Date.now()}-${name}`;


          const {
            error:
              uploadError
          } =
            await sb
              .storage
              .from(
                "policy-pdfs"
              )
              .upload(
                pdfPath,
                pdf.blob,
                {
                  contentType:
                    "application/pdf",

                  upsert:
                    false
                }
              );


          if (
            uploadError
          )
            throw uploadError;

        }

      }


      const p = {

        id:
          newId,

        clientId:
          newClientId,

        insurer:
          old.insurer ||
          "Outra",

        type:
          old.type === "Moto"
            ? "Auto"
            : old.type ||
              "Outro",

        number:
          old.number ||
          "",

        startDate:
          old.startDate ||
          "",

        endDate:
          old.endDate ||
          "",

        status:
          old.status ||
          "Pendente",

        notes:
          old.notes ||
          "",

        alerts:
          old.alerts || {
            30: true,
            15: true,
            7: true,
            1: true,
            expired: true
          },

        pdfPath,

        renewedFrom:
          null,

        createdAt:
          old.createdAt ||
          new Date()
            .toISOString(),

        updatedAt:
          old.updatedAt ||
          new Date()
            .toISOString()

      };


      const {
        error
      } =
        await sb
          .from("policies")
          .upsert(
            policyToDb(p)
          );


      if (error)
        throw error;

    }


    /*
      CORRIGE RELAÇÕES DE RENOVAÇÃO
    */

    for (
      const old of localPolicies
    ) {

      if (
        !old.renewedFrom
      )
        continue;


      const currentId =
        policyMap.get(
          old.id
        );


      const parentId =
        policyMap.get(
          old.renewedFrom
        );


      if (
        !currentId ||
        !parentId
      )
        continue;


      const {
        error
      } =
        await sb
          .from("policies")
          .update({
            renewed_from:
              parentId
          })
          .eq(
            "id",
            currentId
          );


      if (error)
        throw error;

    }


    /*
      MIGRA HISTÓRICO
    */

    for (
      const old of localEvents
    ) {

      const policyId =
        policyMap.get(
          old.policyId
        );


      if (
        !policyId
      )
        continue;


      const ev = {

        id:
          validUuid(
            old.id
          )
            ? old.id
            : uid(),

        policyId,

        type:
          old.type ||
          "history",

        message:
          old.message ||
          "Evento importado",

        date:
          old.date ||
          new Date()
            .toISOString()

      };


      const {
        error
      } =
        await sb
          .from("events")
          .upsert(
            eventToDb(ev)
          );


      if (error)
        throw error;

    }


    db.close();


    await loadCloudData();


    toast(
      "Dados antigos migrados para a nuvem com sucesso."
    );

  }
  catch (err) {

    console.error(
      "Erro na migração:",
      err
    );


    try {

      db.close();

    }
    catch {}


    toast(
      "Não foi possível concluir a migração."
    );

  }

}


/* =========================================================
   ABRIR BANCO ANTIGO
========================================================= */

function openLegacyDB() {

  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          "savaCRMv2"
        );


      let created =
        false;


      request.onupgradeneeded =
        () => {

          created =
            true;

        };


      request.onsuccess =
        () => {

          const db =
            request.result;


          if (created) {

            db.close();

            indexedDB.deleteDatabase(
              "savaCRMv2"
            );

            resolve(
              null
            );

            return;

          }


          resolve(
            db
          );

        };


      request.onerror =
        () =>
          reject(
            request.error
          );

    }
  );

}


/* =========================================================
   LER STORE DO BANCO ANTIGO
========================================================= */

function legacyGetAll(
  db,
  storeName
) {

  return new Promise(
    resolve => {

      if (
        !db.objectStoreNames.contains(
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
        transaction.objectStore(
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
          resolve(
            []
          );

    }
  );

}


/* =========================================================
   ADICIONAR BOTÕES EXTRAS DE CONTA / MIGRAÇÃO
========================================================= */

function setupExtraButtons() {

  const accountCard =
    $("#saveAccount")
      ?.closest(
        ".settings-card"
      );


  if (
    accountCard &&
    !$("#forgotPasswordConfig")
  ) {

    const forgot =
      document.createElement(
        "button"
      );


    forgot.id =
      "forgotPasswordConfig";


    forgot.type =
      "button";


    forgot.className =
      "btn btn-secondary";


    forgot.style.marginTop =
      "10px";


    forgot.textContent =
      "Enviar recuperação de senha";


    forgot.addEventListener(
      "click",
      async () => {

        const email =
          state.user?.email;


        if (!email) {

          toast(
            "Usuário não autenticado."
          );

          return;

        }


        try {

          const {
            error
          } =
            await sb
              .auth
              .resetPasswordForEmail(
                email,
                {
                  redirectTo:
                    window.location.origin +
                    window.location.pathname
                }
              );


          if (error)
            throw error;


          toast(
            "E-mail de recuperação enviado."
          );

        }
        catch (err) {

          console.error(
            err
          );


          toast(
            "Não foi possível enviar a recuperação."
          );

        }

      }
    );


    accountCard.appendChild(
      forgot
    );

  }


  const dataCard =
    $("#exportData")
      ?.closest(
        ".settings-card"
      );


  if (
    dataCard &&
    !$("#migrateLocalData")
  ) {

    const migrate =
      document.createElement(
        "button"
      );


    migrate.id =
      "migrateLocalData";


    migrate.type =
      "button";


    migrate.className =
      "btn btn-primary";


    migrate.style.marginTop =
      "12px";


    migrate.textContent =
      "☁ Migrar dados deste dispositivo";


    migrate.addEventListener(
      "click",
      migrateLocalDataToCloud
    );


    dataCard.appendChild(
      migrate
    );

  }

}


/* =========================================================
   EVENTOS DO SISTEMA
========================================================= */

function setupEvents() {

  $$("[data-view]")
    .forEach(
      b =>
        b.addEventListener(
          "click",
          () =>
            go(
              b.dataset.view
            )
        )
    );


  $$("[data-close]")
    .forEach(
      b =>
        b.addEventListener(
          "click",
          () =>
            closeModal(
              b.dataset.close
            )
        )
    );


  $$(".modal")
    .forEach(
      m =>
        m.addEventListener(
          "click",
          e => {

            if (
              e.target === m
            )
              m.classList.remove(
                "open"
              );

          }
        )
    );


  $("#loginForm")
    ?.addEventListener(
      "submit",
      loginWithSupabase
    );


  $("#logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );


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


  $("#newClientBtn")
    ?.addEventListener(
      "click",
      newClient
    );


  $("#dashboardRefresh")
    ?.addEventListener(
      "click",
      async () => {

        await loadCloudData();

        toast(
          "Dados atualizados."
        );

      }
    );


  $("#clientForm")
    ?.addEventListener(
      "submit",
      saveClient
    );


  $("#policyForm")
    ?.addEventListener(
      "submit",
      async e => {

        const old =
          $("#policyRenewedFrom")
            .value;


        const saved =
          await savePolicy(e);


        if (
          old &&
          saved
        ) {

          await finalizeRenewal(
            old,
            saved.id
          );


          renderAll();

        }

      }
    );


  $("#clientSearch")
    ?.addEventListener(
      "input",
      renderClients
    );


  $("#policySearch")
    ?.addEventListener(
      "input",
      renderPolicies
    );


  $("#clientFilter")
    ?.addEventListener(
      "change",
      renderClients
    );


  [
    "statusFilter",
    "expiryFilter",
    "typeFilter",
    "insurerFilter"
  ]
    .forEach(
      id =>
        $("#" + id)
          ?.addEventListener(
            "change",
            renderPolicies
          )
    );


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
      saveLanguage
    );


  $("#generateReportBtn")
    ?.addEventListener(
      "click",
      showReport
    );


  $("#settingsReport")
    ?.addEventListener(
      "click",
      () => {

        $("#settingsReportOutput")
          .innerHTML =
          generateReport();

      }
    );


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
      clearAll
    );


  setupExtraButtons();

}


/* =========================================================
   ESCUTAR ALTERAÇÃO DA SESSÃO SUPABASE
========================================================= */

function setupAuthListener() {

  sb.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

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
        session?.user
      ) {

        state.user =
          session.user;

      }

    }
  );

}


/* =========================================================
   INICIALIZAÇÃO DO CRM
========================================================= */

async function init() {

  setupEvents();


  setupAuthListener();


  try {

    const {
      data,
      error
    } =
      await sb
        .auth
        .getSession();


    if (error)
      throw error;


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
  catch (err) {

    console.error(
      "Erro ao iniciar CRM:",
      err
    );


    showLogin();


    if (
      $("#loginError")
    )
      $("#loginError")
        .textContent =
        "Não foi possível conectar ao servidor.";

  }

}


/* =========================================================
   EXPORTA FUNÇÕES USADAS PELO HTML
========================================================= */

window.openDetails =
  openDetails;


window.editPolicy =
  editPolicy;


window.renewPolicy =
  renewPolicy;


window.openPdf =
  openPdf;


window.newPolicyFor =
  newPolicyFor;


window.openClient =
  openClient;


window.changeStatus =
  changeStatus;


window.manualWhatsApp =
  manualWhatsApp;


window.sendEmail =
  sendEmail;


window.deletePolicy =
  deletePolicy;


window.deleteClient =
  deleteClient;


window.closeModal =
  closeModal;


/* =========================================================
   INICIAR
========================================================= */

init();
