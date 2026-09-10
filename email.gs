/**
 * =========================================================
 * SAVA SEGUROS — AUTOMAÇÃO DE E-MAIL
 * =========================================================
 *
 * Mantém:
 * - envio manual pelo CRM via doPost()
 *
 * Adiciona:
 * - verificação automática das renovações
 * - funcionamento mesmo com site/PC fechado
 * - leitura direta do Supabase
 * - envio ao e-mail do gestor
 * - proteção contra envio duplicado no mesmo dia
 */

const TIMEZONE = "America/Sao_Paulo";


/* =========================================================
   ENDPOINT USADO PELO CRM
   ========================================================= */

function doPost(e) {

  try {

    var data = JSON.parse(
      e.postData.contents || "{}"
    );

    if (data.action !== "sendEmail") {

      return json({
        ok: false,
        error: "Ação inválida"
      });

    }

    if (
      !data.to ||
      !String(data.to).includes("@")
    ) {

      return json({
        ok: false,
        error: "E-mail inválido"
      });

    }

    MailApp.sendEmail({

      to: data.to,

      subject:
        data.subject ||
        "Lembrete de renovação - SAVA Seguros",

      body:
        data.body || "",

      name:
        "SAVA Seguros"

    });

    return json({
      ok: true
    });

  } catch (err) {

    return json({
      ok: false,
      error: String(err)
    });

  }

}


/* =========================================================
   TESTE DO ENDPOINT
   ========================================================= */

function doGet() {

  return json({
    ok: true,
    service: "SAVA Seguros Mail Endpoint"
  });

}


/* =========================================================
   RESPOSTA JSON
   ========================================================= */

function json(obj) {

  return ContentService
    .createTextOutput(
      JSON.stringify(obj)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}


/* =========================================================
   AUTOMAÇÃO PRINCIPAL
   ========================================================= */

function verificarRenovacoes() {

  var config =
    PropertiesService
      .getScriptProperties();

  var supabaseUrl =
    config.getProperty(
      "SUPABASE_URL"
    );

  var serviceRoleKey =
    config.getProperty(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

  var userId =
    config.getProperty(
      "SAVA_USER_ID"
    );


  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !userId
  ) {

    throw new Error(
      "Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SAVA_USER_ID nas Propriedades do Script."
    );

  }


  /* =========================
     BUSCAR CONFIGURAÇÕES
     ========================= */

  var settings =
    supabaseGet(
      supabaseUrl,
      serviceRoleKey,
      "settings",
      "user_id=eq." +
        encodeURIComponent(userId)
    );


  if (
    !settings ||
    settings.length === 0
  ) {

    throw new Error(
      "Configurações do usuário não encontradas."
    );

  }


  var managerEmail =
    settings[0].manager_email;


  if (
    !managerEmail ||
    !String(managerEmail).includes("@")
  ) {

    throw new Error(
      "E-mail do gestor não configurado no CRM."
    );

  }


  /* =========================
     BUSCAR CLIENTES
     ========================= */

  var clients =
    supabaseGet(
      supabaseUrl,
      serviceRoleKey,
      "clients",
      "user_id=eq." +
        encodeURIComponent(userId)
    );


  var clientsMap = {};

  clients.forEach(
    function(client) {

      clientsMap[client.id] =
        client;

    }
  );


  /* =========================
     BUSCAR APÓLICES
     ========================= */

  var policies =
    supabaseGet(
      supabaseUrl,
      serviceRoleKey,
      "policies",
      "user_id=eq." +
        encodeURIComponent(userId)
    );


  var today =
    Utilities.formatDate(
      new Date(),
      TIMEZONE,
      "yyyy-MM-dd"
    );


  policies.forEach(
    function(policy) {

      if (!policy.end_date) {
        return;
      }


      var days =
        diasAteVencimento(
          today,
          policy.end_date
        );


      var mark = null;


      if (
        days === 30 ||
        days === 15 ||
        days === 7 ||
        days === 1
      ) {

        mark = String(days);

      } else if (
        days === -1
      ) {

        mark = "expired";

      }


      if (mark === null) {
        return;
      }


      /* =========================
         VERIFICAR ALERTA ATIVO
         ========================= */

      if (
        mark === "30" &&
        policy.alert_30 === false
      ) {
        return;
      }

      if (
        mark === "15" &&
        policy.alert_15 === false
      ) {
        return;
      }

      if (
        mark === "7" &&
        policy.alert_7 === false
      ) {
        return;
      }

      if (
        mark === "1" &&
        policy.alert_1 === false
      ) {
        return;
      }

      if (
        mark === "expired" &&
        policy.alert_expired === false
      ) {
        return;
      }


      /* =========================
         EVITAR DUPLICIDADE
         ========================= */

      var sentKey =
        "sent_" +
        policy.id +
        "_" +
        mark +
        "_" +
        today;


      if (
        config.getProperty(sentKey)
      ) {

        return;

      }


      var client =
        clientsMap[
          policy.client_id
        ] || {};


      var subject =
        montarAssunto(
          policy,
          days
        );


      var body =
        montarMensagem(
          policy,
          client,
          days
        );


      /* =========================
         ENVIAR
         ========================= */

      MailApp.sendEmail({

        to:
          managerEmail,

        subject:
          subject,

        body:
          body,

        name:
          "SAVA Seguros"

      });


      /* =========================
         MARCAR COMO ENVIADO
         ========================= */

      config.setProperty(
        sentKey,
        new Date().toISOString()
      );


      /* =========================
         REGISTRAR NO SUPABASE
         ========================= */

      registrarEvento(
        supabaseUrl,
        serviceRoleKey,
        userId,
        policy.id,
        "Lembrete automático enviado ao gestor"
      );

    }
  );

}


/* =========================================================
   CONSULTA SUPABASE
   ========================================================= */

function supabaseGet(
  url,
  key,
  table,
  query
) {

  var endpoint =
    url +
    "/rest/v1/" +
    table +
    "?select=*&" +
    query;


  var response =
    UrlFetchApp.fetch(
      endpoint,
      {

        method:
          "get",

        headers: {

          apikey:
            key,

          Authorization:
            "Bearer " + key

        },

        muteHttpExceptions:
          true

      }
    );


  var status =
    response.getResponseCode();


  if (
    status < 200 ||
    status >= 300
  ) {

    throw new Error(
      "Erro Supabase (" +
      status +
      "): " +
      response.getContentText()
    );

  }


  return JSON.parse(
    response.getContentText()
  );

}


/* =========================================================
   REGISTRAR EVENTO
   ========================================================= */

function registrarEvento(
  url,
  key,
  userId,
  policyId,
  message
) {

  try {

    var endpoint =
      url +
      "/rest/v1/events";


    var payload = {

      id:
        Utilities.getUuid(),

      user_id:
        userId,

      policy_id:
        policyId,

      type:
        "email",

      message:
        message,

      created_at:
        new Date().toISOString()

    };


    UrlFetchApp.fetch(
      endpoint,
      {

        method:
          "post",

        contentType:
          "application/json",

        headers: {

          apikey:
            key,

          Authorization:
            "Bearer " + key,

          Prefer:
            "return=minimal"

        },

        payload:
          JSON.stringify(payload),

        muteHttpExceptions:
          true

      }
    );

  } catch (err) {

    console.log(
      "Não foi possível registrar o evento: " +
      err
    );

  }

}


/* =========================================================
   DIAS ATÉ O VENCIMENTO
   ========================================================= */

function diasAteVencimento(
  today,
  endDate
) {

  var a =
    String(today)
      .split("-")
      .map(Number);

  var b =
    String(endDate)
      .substring(0, 10)
      .split("-")
      .map(Number);


  var todayUtc =
    Date.UTC(
      a[0],
      a[1] - 1,
      a[2]
    );


  var endUtc =
    Date.UTC(
      b[0],
      b[1] - 1,
      b[2]
    );


  return Math.round(
    (
      endUtc -
      todayUtc
    ) /
    86400000
  );

}


/* =========================================================
   ASSUNTO DO E-MAIL
   ========================================================= */

function montarAssunto(
  policy,
  days
) {

  if (days === -1) {

    return (
      "Apólice vencida - SAVA Seguros"
    );

  }


  return (
    "Renovação em " +
    days +
    " dia(s) - SAVA Seguros"
  );

}


/* =========================================================
   CORPO DO E-MAIL
   ========================================================= */

function montarMensagem(
  policy,
  client,
  days
) {

  var prazo;


  if (days === -1) {

    prazo =
      "Apólice vencida há 1 dia";

  } else if (
    days === 1
  ) {

    prazo =
      "Vence amanhã";

  } else {

    prazo =
      "Faltam " +
      days +
      " dias";

  }


  return [

    "RENOVAÇÃO DE SEGURO — SAVA SEGUROS",

    "",

    "Cliente: " +
      (
        client.name ||
        "Cliente"
      ),

    "Telefone: " +
      (
        client.phone ||
        "Não informado"
      ),

    "E-mail do cliente: " +
      (
        client.email ||
        "Não informado"
      ),

    "",

    "Seguradora: " +
      (
        policy.insurer ||
        "Não informado"
      ),

    "Seguro: " +
      (
        policy.type ||
        "Não informado"
      ),

    "Apólice: " +
      (
        policy.number ||
        "Sem número"
      ),

    "",

    "Início: " +
      formatarData(
        policy.start_date
      ),

    "Vencimento: " +
      formatarData(
        policy.end_date
      ),

    "Prazo: " +
      prazo,

    "Status: " +
      (
        policy.status ||
        "Pendente"
      ),

    "",

    "Esta apólice requer acompanhamento de renovação.",

    "",

    "SAVA Seguros"

  ].join("\n");

}


/* =========================================================
   FORMATAR DATA
   ========================================================= */

function formatarData(value) {

  if (!value) {
    return "Não informado";
  }


  var parts =
    String(value)
      .substring(0,10)
      .split("-");


  if (
    parts.length !== 3
  ) {

    return value;

  }


  return (
    parts[2] +
    "/" +
    parts[1] +
    "/" +
    parts[0]
  );

}


/* =========================================================
   CRIAR AGENDAMENTO AUTOMÁTICO
   ========================================================= */

function instalarAutomacao() {

  removerAutomacao();


  ScriptApp
    .newTrigger(
      "verificarRenovacoes"
    )
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();


  console.log(
    "Automação instalada."
  );

}


/* =========================================================
   REMOVER AGENDAMENTOS ANTIGOS
   ========================================================= */

function removerAutomacao() {

  var triggers =
    ScriptApp
      .getProjectTriggers();


  triggers.forEach(
    function(trigger) {

      if (
        trigger.getHandlerFunction() ===
        "verificarRenovacoes"
      ) {

        ScriptApp.deleteTrigger(
          trigger
        );

      }

    }
  );

}
