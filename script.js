/* =========================================
   SAVA SEGUROS
   CENTRAL DE RENOVAÇÕES
========================================= */


/* =========================================
   BANCO DE DADOS TEMPORÁRIO
   Por enquanto usamos o navegador.
   Depois vamos trocar pelo banco online.
========================================= */

let apolices = JSON.parse(
    localStorage.getItem("savaApolices")
) || [];


/* =========================================
   ELEMENTOS DA PÁGINA
========================================= */

const modal = document.getElementById("modalCadastro");
const formulario = document.getElementById("formApolice");
const listaApolices = document.getElementById("listaApolices");
const campoBusca = document.getElementById("campoBusca");


/* =========================================
   ABRIR CADASTRO
========================================= */

function abrirCadastro() {

    modal.classList.add("ativo");

    document.getElementById("cliente").focus();
}


/* =========================================
   FECHAR CADASTRO
========================================= */

function fecharCadastro() {

    modal.classList.remove("ativo");

    formulario.reset();
}


/* =========================================
   FECHAR AO CLICAR FORA DO MODAL
========================================= */

modal.addEventListener("click", function(event) {

    if (event.target === modal) {
        fecharCadastro();
    }

});


/* =========================================
   FORMATAÇÃO DO TELEFONE
========================================= */

document.getElementById("telefone").addEventListener("input", function(event) {

    let telefone = event.target.value.replace(/\D/g, "");

    if (telefone.length > 11) {
        telefone = telefone.substring(0, 11);
    }

    if (telefone.length <= 10) {

        telefone = telefone.replace(
            /^(\d{2})(\d)/,
            "($1) $2"
        );

        telefone = telefone.replace(
            /(\d{4})(\d)/,
            "$1-$2"
        );

    } else {

        telefone = telefone.replace(
            /^(\d{2})(\d)/,
            "($1) $2"
        );

        telefone = telefone.replace(
            /(\d{5})(\d)/,
            "$1-$2"
        );

    }

    event.target.value = telefone;

});


/* =========================================
   SALVAR APÓLICE
========================================= */

formulario.addEventListener("submit", function(event) {

    event.preventDefault();


    const cliente =
        document.getElementById("cliente").value.trim();

    const telefone =
        document.getElementById("telefone").value.trim();

    const numeroApolice =
        document.getElementById("numeroApolice").value.trim();

    const seguradora =
        document.getElementById("seguradora").value;

    const tipoSeguro =
        document.getElementById("tipoSeguro").value;

    const dataVencimento =
        document.getElementById("dataVencimento").value;

    const observacoes =
        document.getElementById("observacoes").value.trim();


    const alerta30 =
        document.getElementById("alerta30").checked;

    const alerta15 =
        document.getElementById("alerta15").checked;

    const alerta7 =
        document.getElementById("alerta7").checked;


    /* =========================================
       CRIAR OBJETO DA APÓLICE
    ========================================= */

    const novaApolice = {

        id: Date.now(),

        cliente: cliente,

        telefone: telefone,

        numeroApolice: numeroApolice,

        seguradora: seguradora,

        tipoSeguro: tipoSeguro,

        dataVencimento: dataVencimento,

        observacoes: observacoes,

        alertas: {

            dias30: alerta30,

            dias15: alerta15,

            dias7: alerta7

        },

        status: "Pendente",

        criadaEm: new Date().toISOString()

    };


    /* =========================================
       ADICIONAR AO BANCO
    ========================================= */

    apolices.push(novaApolice);


    salvarDados();


    /* =========================================
       ATUALIZAR SISTEMA
    ========================================= */

    atualizarSistema();


    /* =========================================
       FECHAR MODAL
    ========================================= */

    fecharCadastro();


    /* =========================================
       MENSAGEM
    ========================================= */

    alert(
        "✅ Apólice cadastrada com sucesso!"
    );

});


/* =========================================
   SALVAR NO LOCALSTORAGE
========================================= */

function salvarDados() {

    localStorage.setItem(
        "savaApolices",
        JSON.stringify(apolices)
    );

}


/* =========================================
   CALCULAR DIAS ATÉ O VENCIMENTO
========================================= */

function calcularDias(data) {

    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);


    const vencimento = new Date(
        data + "T00:00:00"
    );

    vencimento.setHours(0, 0, 0, 0);


    const diferenca =
        vencimento.getTime() -
        hoje.getTime();


    return Math.ceil(
        diferenca /
        (1000 * 60 * 60 * 24)
    );

}


/* =========================================
   FORMATAR DATA
========================================= */

function formatarData(data) {

    if (!data) {
        return "-";
    }

    const partes = data.split("-");

    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );

}


/* =========================================
   DESCOBRIR STATUS
========================================= */

function descobrirStatus(apolice) {

    const dias = calcularDias(
        apolice.dataVencimento
    );


    if (dias < 0) {

        return {
            texto: "Vencida",
            classe: "status-vencida"
        };

    }


    if (dias === 0) {

        return {
            texto: "Vence hoje",
            classe: "status-hoje"
        };

    }


    if (dias <= 7) {

        return {
            texto: `Vence em ${dias} dia${dias === 1 ? "" : "s"}`,
            classe: "status-urgente"
        };

    }


    if (dias <= 30) {

        return {
            texto: `Vence em ${dias} dias`,
            classe: "status-atencao"
        };

    }


    return {
        texto: "Vigente",
        classe: "status-normal"
    };

}


/* =========================================
   ATUALIZAR TODA A INTERFACE
========================================= */

function atualizarSistema() {

    atualizarContadores();

    renderizarApolices();

}


/* =========================================
   CONTADORES
========================================= */

function atualizarContadores() {

    let vencemHoje = 0;

    let proximos7 = 0;

    let proximos30 = 0;


    apolices.forEach(function(apolice) {

        const dias = calcularDias(
            apolice.dataVencimento
        );


        if (dias === 0) {

            vencemHoje++;

        }


        if (dias >= 1 && dias <= 7) {

            proximos7++;

        }


        if (dias >= 1 && dias <= 30) {

            proximos30++;

        }

    });


    document.getElementById(
        "totalApolices"
    ).textContent = apolices.length;


    document.getElementById(
        "vencemHoje"
    ).textContent = vencemHoje;


    document.getElementById(
        "proximos7"
    ).textContent = proximos7;


    document.getElementById(
        "proximos30"
    ).textContent = proximos30;

}


/* =========================================
   RENDERIZAR APÓLICES
========================================= */

function renderizarApolices(lista = apolices) {

    listaApolices.innerHTML = "";


    if (lista.length === 0) {

        listaApolices.innerHTML = `

            <tr>

                <td colspan="6">

                    <div class="estado-vazio">

                        <div>📄</div>

                        <h3>
                            Nenhuma apólice cadastrada
                        </h3>

                        <p>
                            Clique em "Nova Apólice"
                            para cadastrar a primeira.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    /* =========================================
       ORDENAR POR DATA
    ========================================= */

    const listaOrdenada = [...lista].sort(
        function(a, b) {

            return new Date(
                a.dataVencimento
            ) -
            new Date(
                b.dataVencimento
            );

        }
    );


    listaOrdenada.forEach(function(apolice) {

        const status =
            descobrirStatus(apolice);


        const linha =
            document.createElement("tr");


        linha.innerHTML = `

            <td>
                <strong>
                    ${escaparHTML(apolice.cliente)}
                </strong>
            </td>

            <td>
                ${escaparHTML(apolice.tipoSeguro)}
            </td>

            <td>
                ${escaparHTML(apolice.seguradora)}
            </td>

            <td>
                ${escaparHTML(apolice.numeroApolice)}
            </td>

            <td>
                ${formatarData(
                    apolice.dataVencimento
                )}
            </td>

            <td>

                <span class="status ${status.classe}">
                    ${status.texto}
                </span>

            </td>

        `;


        listaApolices.appendChild(linha);

    });

}


/* =========================================
   BUSCAR CLIENTE
========================================= */

function buscarApolice() {

    const termo =
        campoBusca.value
        .toLowerCase()
        .trim();


    if (!termo) {

        renderizarApolices();

        return;

    }


    const resultado =
        apolices.filter(function(apolice) {

            return (

                apolice.cliente
                    .toLowerCase()
                    .includes(termo)

                ||

                apolice.numeroApolice
                    .toLowerCase()
                    .includes(termo)

                ||

                apolice.telefone
                    .toLowerCase()
                    .includes(termo)

                ||

                apolice.seguradora
                    .toLowerCase()
                    .includes(termo)

            );

        });


    renderizarApolices(resultado);

}


/* =========================================
   SEGURANÇA CONTRA HTML INDESEJADO
========================================= */

function escaparHTML(texto) {

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   INICIALIZAÇÃO
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        atualizarSistema();

    }
);
