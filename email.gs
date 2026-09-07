/**
 * SAVA SEGUROS — Google Apps Script para envio de e-mail
 *
 * 1) Crie um projeto em script.google.com.
 * 2) Cole este arquivo.
 * 3) Implante como Aplicativo da Web.
 * 4) Execute como "Eu" e permita acesso conforme a política da sua conta.
 * 5) Copie a URL /exec para Configurações > Automação de e-mail no CRM.
 *
 * Este endpoint não armazena senhas do CRM.
 * Ele recebe somente o pedido de envio.
 */

function doPost(e) {

  try {

    var data =
      JSON.parse(
        e.postData.contents || "{}"
      );

    if(
      data.action !== "sendEmail"
    ){

      return json({
        ok:false,
        error:"Ação inválida"
      });

    }

    if(
      !data.to ||
      !String(data.to).includes("@")
    ){

      return json({
        ok:false,
        error:"E-mail inválido"
      });

    }

    MailApp.sendEmail({

      to:data.to,

      subject:
        data.subject ||
        "Lembrete de renovação - SAVA Seguros",

      body:
        data.body ||
        "",

      name:
        "SAVA Seguros"

    });

    return json({
      ok:true
    });

  }catch(err){

    return json({
      ok:false,
      error:String(err)
    });

  }

}

function doGet(){

  return json({
    ok:true,
    service:
      "SAVA Seguros Mail Endpoint"
  });

}

function json(obj){

  return ContentService
    .createTextOutput(
      JSON.stringify(obj)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}
