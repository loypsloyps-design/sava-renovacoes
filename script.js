/* =========================================
   SAVA SEGUROS
   CENTRAL DE RENOVAÇÕES
========================================= */


/* =========================================
   BANCO TEMPORÁRIO
========================================= */

let apolices =
    JSON.parse(
        localStorage.getItem("savaApolices")
    ) || [];

let apoliceAtualId = null;

let apoliceExclusaoId = null;

let temporizadorNotificacao = null;


/* =========================================
   ELEMENTOS
========================================= */

const modalCadastro =
    document.getElementById("modalCadastro");

const modalDetalhes =
    document.getElementById("modalDetalhes");

const modalExcluir =
    document.getElementById("modalExcluir");

const formulario =
    document.getElementById("formApolice");

const listaApolices =
    document.getElementById("listaApolices");

const campoBusca =
    document.getElementById("campoBusca");


/* =========================================
   ABRIR CADASTRO
========================================= */

function abrirCadastro() {

    formulario.reset();

    document.getElementById("idEdicao").value = "";

    document.getElementById("tituloModal").textContent =
        "Nova Apólice";

    document.getElementById("alerta30").checked = true;
    document.getElementById("alerta15").checked = true;
    document.getElementById("alerta7").checked = true;

    modalCadastro.classList.add("ativo");

    document.body.style.overflow = "hidden";

    setTimeout(function () {

        document.getElementById("cliente").focus();

    }, 180);
}


/* =========================================
   FECHAR CADASTRO
========================================= */

function fecharCadastro() {

    modalCadastro.classList.remove("ativo");

    if (
        !modalDetalhes.classList.contains("ativo") &&
        !modalExcluir.classList.contains("ativo")
    ) {
        document.body.style.overflow = "";
    }
}


/* =========================================
   FECHAR DETALHES
========================================= */

function fecharDetalhes() {

    modalDetalhes.classList.remove("ativo");

    apoliceAtualId = null;

    if (!modalCadastro.classList.contains("ativo")) {
        document.body.style.overflow = "";
    }
}


/* =========================================
   MODAL DE EXCLUSÃO
========================================= */

function abrirModalExcluir(id) {

    const apolice =
        apolices.find(function (item) {

            return String(item.id) === String(id);

        });


    if (!apolice) {
        return;
    }


    apoliceExclusaoId = id;


    document.getElementById(
        "clienteExclusao"
    ).textContent =
        apolice.cliente;


    modalExcluir.classList.add("ativo");

    document.body.style.overflow = "hidden";
}


/* =========================================
   FECHAR MODAL DE EXCLUSÃO
========================================= */

function fecharModalExcluir() {

    modalExcluir.classList.remove("ativo");

    apoliceExclusaoId = null;


    if (
        !modalCadastro.classList.contains("ativo") &&
        !modalDetalhes.classList.contains("ativo")
    ) {
        document.body.style.overflow = "";
    }
}


/* =========================================
   CONFIRMAR EXCLUSÃO
========================================= */

function confirmarExclusao() {

    if (!apoliceExclusaoId) {
        return;
    }


    const apolice =
        apolices.find(function (item) {

            return String(item.id) ===
                String(apoliceExclusaoId);

        });


    if (!apolice) {

        fecharModalExcluir();

        return;
    }


    const cliente =
        apolice.cliente;


    apolices =
        apolices.filter(function (item) {

            return String(item.id) !==
                String(apoliceExclusaoId);

        });


    salvarDados();

    atualizarSistema();

    fecharModalExcluir();

    fecharDetalhes();


    mostrarNotificacao(
        "Apólice removida",
        `O cadastro de ${cliente} foi removido da central.`
    );
}


/* =========================================
   CLICAR FORA DOS MODAIS
========================================= */

modalCadastro.addEventListener(
    "click",
    function (event) {

        if (event.target === modalCadastro) {

            fecharCadastro();

        }

    }
);


modalDetalhes.addEventListener(
    "click",
    function (event) {

        if (event.target === modalDetalhes) {

            fecharDetalhes();

        }

    }
);


modalExcluir.addEventListener(
    "click",
    function (event) {

        if (event.target === modalExcluir) {

            fecharModalExcluir();

        }

    }
);


/* =========================================
   TECLA ESC
========================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }


        if (modalExcluir.classList.contains("ativo")) {

            fecharModalExcluir();

            return;
        }


        if (modalDetalhes.classList.contains("ativo")) {

            fecharDetalhes();

            return;
        }


        if (modalCadastro.classList.contains("ativo")) {

            fecharCadastro();

        }

    }
);


/* =========================================
   TELEFONE
========================================= */

document
    .getElementById("telefone")
    .addEventListener(
        "input",
        function (event) {

            let telefone =
                event.target.value.replace(/\D/g, "");


            if (telefone.length > 11) {

                telefone =
                    telefone.substring(0, 11);

            }


            if (telefone.length <= 10) {

                telefone =
                    telefone.replace(
                        /^(\d{2})(\d)/,
                        "($1) $2"
                    );

                telefone =
                    telefone.replace(
                        /(\d{4})(\d)/,
                        "$1-$2"
                    );

            } else {

                telefone =
                    telefone.replace(
                        /^(\d{2})(\d)/,
                        "($1) $2"
                    );

                telefone =
                    telefone.replace(
                        /(\d{5})(\d)/,
                        "$1-$2"
                    );

            }


            event.target.value =
                telefone;

        }
    );


/* =========================================
   SALVAR APÓLICE
========================================= */

formulario.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const cliente =
            document
                .getElementById("cliente")
                .value
                .trim();


        const telefone =
            document
                .getElementById("telefone")
                .value
                .trim();


        const numeroApolice =
            document
                .getElementById("numeroApolice")
                .value
                .trim();


        const seguradora =
            document
                .getElementById("seguradora")
                .value;


        const tipoSeguro =
            document
                .getElementById("tipoSeguro")
                .value;


        const dataVencimento =
            document
                .getElementById("dataVencimento")
                .value;


        const observacoes =
            document
                .getElementById("observacoes")
                .value
                .trim();


        const alertas = {

            dias30:
                document
                    .getElementById("alerta30")
                    .checked,

            dias15:
                document
                    .getElementById("alerta15")
                    .checked,

            dias7:
                document
                    .getElementById("alerta7")
                    .checked

        };


        const idEdicao =
            document
                .getElementById("idEdicao")
                .value;


        /* =========================================
           EDIÇÃO
        ========================================== */

        if (idEdicao) {

            const indice =
                apolices.findIndex(
                    function (apolice) {

                        return String(apolice.id) ===
                            String(idEdicao);

                    }
                );


            if (indice !== -1) {

                apolices[indice].cliente =
                    cliente;

                apolices[indice].telefone =
                    telefone;

                apolices[indice].numeroApolice =
                    numeroApolice;

                apolices[indice].seguradora =
                    seguradora;

                apolices[indice].tipoSeguro =
                    tipoSeguro;

                apolices[indice].dataVencimento =
                    dataVencimento;

                apolices[indice].observacoes =
                    observacoes;

                apolices[indice].alertas =
                    alertas;


                salvarDados();

                atualizarSistema();

                fecharCadastro();


                mostrarNotificacao(
                    "Apólice atualizada!",
                    `Os dados de ${cliente} foram atualizados com sucesso.`
                );


                return;
            }
        }


        /* =========================================
           NOVA APÓLICE
        ========================================== */

        const novaApolice = {

            id:
                Date.now(),

            cliente:
                cliente,

            telefone:
                telefone,

            numeroApolice:
                numeroApolice,

            seguradora:
                seguradora,

            tipoSeguro:
                tipoSeguro,

            dataVencimento:
                dataVencimento,

            observacoes:
                observacoes,

            alertas:
                alertas,

            status:
                "Pendente",

            criadaEm:
                new Date().toISOString()

        };


        apolices.push(
            novaApolice
        );


        salvarDados();

        atualizarSistema();

        fecharCadastro();


        mostrarNotificacao(
            "Apólice cadastrada!",
            `${cliente} foi adicionado à Central de Renovações.`
        );

    }
);


/* =========================================
   SALVAR DADOS
========================================= */

function salvarDados() {

    localStorage.setItem(
        "savaApolices",
        JSON.stringify(apolices)
    );
}


/* =========================================
   CALCULAR DIAS
========================================= */

function calcularDias(data) {

    if (!data) {
        return 0;
    }


    const hoje =
        new Date();


    hoje.setHours(
        0,
        0,
        0,
        0
    );


    const vencimento =
        new Date(
            data + "T00:00:00"
        );


    vencimento.setHours(
        0,
        0,
        0,
        0
    );


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


    const partes =
        data.split("-");


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );
}


/* =========================================
   STATUS
========================================= */

function descobrirStatus(apolice) {

    const dias =
        calcularDias(
            apolice.dataVencimento
        );


    if (dias < 0) {

        return {

            texto:
                "Vencida",

            classe:
                "status-vencida"

        };
    }


    if (dias === 0) {

        return {

            texto:
                "Vence hoje",

            classe:
                "status-hoje"

        };
    }


    if (dias <= 7) {

        return {

            texto:
                `Vence em ${dias} dia${dias === 1 ? "" : "s"}`,

            classe:
                "status-urgente"

        };
    }


    if (dias <= 30) {

        return {

            texto:
                `Vence em ${dias} dias`,

            classe:
                "status-atencao"

        };
    }


    return {

        texto:
            "Vigente",

        classe:
            "status-normal"

    };
}


/* =========================================
   CONTADORES
========================================= */

function atualizarContadores() {

    let vencemHoje = 0;

    let proximos7 = 0;

    let proximos30 = 0;

    let vencidas = 0;


    apolices.forEach(
        function (apolice) {

            const dias =
                calcularDias(
                    apolice.dataVencimento
                );


            if (dias === 0) {
                vencemHoje++;
            }


            if (
                dias >= 1 &&
                dias <= 7
            ) {
                proximos7++;
            }


            if (
                dias >= 1 &&
                dias <= 30
            ) {
                proximos30++;
            }


            if (dias < 0) {
                vencidas++;
            }

        }
    );


    document.getElementById(
        "totalApolices"
    ).textContent =
        apolices.length;


    document.getElementById(
        "vencemHoje"
    ).textContent =
        vencemHoje;


    document.getElementById(
        "proximos7"
    ).textContent =
        proximos7;


    document.getElementById(
        "proximos30"
    ).textContent =
        proximos30;


    document.getElementById(
        "vencidas"
    ).textContent =
        vencidas;
}


/* =========================================
   RENDERIZAR
========================================= */

function renderizarApolices(
    lista = apolices
) {

    listaApolices.innerHTML = "";


    if (lista.length === 0) {

        listaApolices.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="estado-vazio">

                        <div class="icone-vazio">
                            📄
                        </div>

                        <h3>
                            Nenhuma apólice encontrada
                        </h3>

                        <p>
                            Cadastre uma apólice ou altere sua busca.
                        </p>

                        <button
                            class="btn-vazio"
                            onclick="abrirCadastro()"
                        >
                            + Nova Apólice
                        </button>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    const listaOrdenada =
        [...lista].sort(
            function (a, b) {

                return new Date(
                    a.dataVencimento
                ) -
                new Date(
                    b.dataVencimento
                );

            }
        );


    listaOrdenada.forEach(
        function (apolice) {

            const status =
                descobrirStatus(
                    apolice
                );


            const linha =
                document.createElement("tr");


            linha.innerHTML = `

                <td>

                    <strong>
                        ${escaparHTML(
                            apolice.cliente
                        )}
                    </strong>

                </td>


                <td>

                    ${escaparHTML(
                        apolice.tipoSeguro
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        apolice.seguradora
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        apolice.numeroApolice
                    )}

                </td>


                <td>

                    ${formatarData(
                        apolice.dataVencimento
                    )}

                </td>


                <td>

                    <span
                        class="status ${status.classe}"
                    >
                        ${status.texto}
                    </span>

                </td>


                <td>

                    <div class="acoes-tabela">

                        <button
                            class="btn-acao"
                            title="Ver detalhes"
                            onclick="abrirDetalhes(${apolice.id})"
                        >
                            👁️
                        </button>


                        <button
                            class="btn-acao"
                            title="Editar"
                            onclick="editarApolice(${apolice.id})"
                        >
                            ✏️
                        </button>


                        <button
                            class="btn-acao"
                            title="Excluir"
                            onclick="abrirModalExcluir(${apolice.id})"
                        >
                            🗑️
                        </button>

                    </div>

                </td>

            `;


            listaApolices.appendChild(
                linha
            );

        }
    );
}


/* =========================================
   BUSCA
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
        apolices.filter(
            function (apolice) {

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

                    ||

                    apolice.tipoSeguro
                        .toLowerCase()
                        .includes(termo)

                );

            }
        );


    renderizarApolices(
        resultado
    );
}


/* =========================================
   ABRIR DETALHES
========================================= */

function abrirDetalhes(id) {

    const apolice =
        apolices.find(
            function (item) {

                return String(item.id) ===
                    String(id);

            }
        );


    if (!apolice) {
        return;
    }


    apoliceAtualId =
        id;


    const dias =
        calcularDias(
            apolice.dataVencimento
        );


    const status =
        descobrirStatus(
            apolice
        );


    document.getElementById(
        "detalhesCliente"
    ).textContent =
        apolice.cliente;


    document.getElementById(
        "detalhesStatus"
    ).innerHTML = `

        <span class="status ${status.classe}">
            ${status.texto}
        </span>

    `;


    document.getElementById(
        "detalhesTelefone"
    ).textContent =
        apolice.telefone;


    document.getElementById(
        "detalhesApolice"
    ).textContent =
        apolice.numeroApolice;


    document.getElementById(
        "detalhesSeguradora"
    ).textContent =
        apolice.seguradora;


    document.getElementById(
        "detalhesSeguro"
    ).textContent =
        apolice.tipoSeguro;


    document.getElementById(
        "detalhesVencimento"
    ).textContent =
        formatarData(
            apolice.dataVencimento
        );


    if (dias < 0) {

        document.getElementById(
            "detalhesDias"
        ).textContent =
            `${Math.abs(dias)} dias atrasada`;

    } else if (dias === 0) {

        document.getElementById(
            "detalhesDias"
        ).textContent =
            "Vence hoje";

    } else {

        document.getElementById(
            "detalhesDias"
        ).textContent =
            `${dias} dias`;

    }


    document.getElementById(
        "detalhesObservacoes"
    ).textContent =
        apolice.observacoes ||
        "Nenhuma observação cadastrada.";


    mostrarAlertasDetalhes(
        apolice
    );


    modalDetalhes.classList.add(
        "ativo"
    );

    document.body.style.overflow = "hidden";
}


/* =========================================
   ALERTAS DOS DETALHES
========================================= */

function mostrarAlertasDetalhes(apolice) {

    const container =
        document.getElementById(
            "detalhesAlertas"
        );


    container.innerHTML = "";


    const configuracao =
        apolice.alertas || {

            dias30: true,
            dias15: true,
            dias7: true

        };


    const alertas = [

        {
            nome: "30 dias antes",
            ativo: configuracao.dias30
        },

        {
            nome: "15 dias antes",
            ativo: configuracao.dias15
        },

        {
            nome: "7 dias antes",
            ativo: configuracao.dias7
        }

    ];


    alertas.forEach(
        function (alerta) {

            const div =
                document.createElement("div");


            div.className =
                "alerta-item";


            div.innerHTML = `

                <span>
                    ${alerta.nome}
                </span>

                <strong class="${
                    alerta.ativo
                        ? "alerta-ativo"
                        : "alerta-inativo"
                }">

                    ${
                        alerta.ativo
                            ? "✓ Ativo"
                            : "Desativado"
                    }

                </strong>

            `;


            container.appendChild(
                div
            );

        }
    );
}


/* =========================================
   EDITAR
========================================= */

function editarApolice(id) {

    const apolice =
        apolices.find(
            function (item) {

                return String(item.id) ===
                    String(id);

            }
        );


    if (!apolice) {
        return;
    }


    document.getElementById(
        "idEdicao"
    ).value =
        apolice.id;


    document.getElementById(
        "cliente"
    ).value =
        apolice.cliente;


    document.getElementById(
        "telefone"
    ).value =
        apolice.telefone;


    document.getElementById(
        "numeroApolice"
    ).value =
        apolice.numeroApolice;


    document.getElementById(
        "seguradora"
    ).value =
        apolice.seguradora;


    document.getElementById(
        "tipoSeguro"
    ).value =
        apolice.tipoSeguro;


    document.getElementById(
        "dataVencimento"
    ).value =
        apolice.dataVencimento;


    document.getElementById(
        "observacoes"
    ).value =
        apolice.observacoes || "";


    const alertas =
        apolice.alertas || {

            dias30: true,
            dias15: true,
            dias7: true

        };


    document.getElementById(
        "alerta30"
    ).checked =
        alertas.dias30;


    document.getElementById(
        "alerta15"
    ).checked =
        alertas.dias15;


    document.getElementById(
        "alerta7"
    ).checked =
        alertas.dias7;


    document.getElementById(
        "tituloModal"
    ).textContent =
        "Editar Apólice";


    modalDetalhes.classList.remove(
        "ativo"
    );


    modalCadastro.classList.add(
        "ativo"
    );


    document.body.style.overflow = "hidden";


    setTimeout(function () {

        document.getElementById(
            "cliente"
        ).focus();

    }, 150);
}


/* =========================================
   EDITAR PELOS DETALHES
========================================= */

function editarApoliceAtual() {

    if (apoliceAtualId) {

        editarApolice(
            apoliceAtualId
        );

    }
}


/* =========================================
   EXCLUIR PELA TABELA
========================================= */

function excluirApolice(id) {

    abrirModalExcluir(id);
}


/* =========================================
   EXCLUIR PELOS DETALHES
========================================= */

function excluirApoliceAtual() {

    if (!apoliceAtualId) {
        return;
    }


    abrirModalExcluir(
        apoliceAtualId
    );
}


/* =========================================
   WHATSAPP
========================================= */

function abrirWhatsAppAtual() {

    const apolice =
        apolices.find(
            function (item) {

                return String(item.id) ===
                    String(apoliceAtualId);

            }
        );


    if (!apolice) {
        return;
    }


    let telefone =
        apolice.telefone
            .replace(/\D/g, "");


    if (
        telefone.length === 10 ||
        telefone.length === 11
    ) {

        telefone =
            "55" +
            telefone;

    }


    const dias =
        calcularDias(
            apolice.dataVencimento
        );


    const mensagem =
`Olá! 👋

Aqui é da SAVA Seguros.

Gostaríamos de entrar em contato sobre a apólice do cliente ${apolice.cliente}.

📄 Apólice: ${apolice.numeroApolice}
🏢 Seguradora: ${apolice.seguradora}
🛡️ Seguro: ${apolice.tipoSeguro}
📅 Vencimento: ${formatarData(apolice.dataVencimento)}

⏳ Prazo: ${
        dias === 0
            ? "vence hoje"
            : dias > 0
                ? `faltam ${dias} dias`
                : "apólice vencida"
    }

Podemos conversar sobre a renovação?

SAVA Seguros`;


    const url =
        `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;


    window.open(
        url,
        "_blank"
    );
}


/* =========================================
   NOTIFICAÇÃO
========================================= */

function mostrarNotificacao(
    titulo,
    mensagem
) {

    const notificacao =
        document.getElementById(
            "notificacao"
        );


    document.getElementById(
        "notificacaoTitulo"
    ).textContent =
        titulo;


    document.getElementById(
        "notificacaoMensagem"
    ).textContent =
        mensagem;


    notificacao.classList.add(
        "ativo"
    );


    clearTimeout(
        temporizadorNotificacao
    );


    temporizadorNotificacao =
        setTimeout(
            function () {

                fecharNotificacao();

            },
            4500
        );
}


/* =========================================
   FECHAR NOTIFICAÇÃO
========================================= */

function fecharNotificacao() {

    document
        .getElementById(
            "notificacao"
        )
        .classList.remove(
            "ativo"
        );
}


/* =========================================
   SEGURANÇA HTML
========================================= */

function escaparHTML(texto) {

    return String(texto)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================
   ATUALIZAR SISTEMA
========================================= */

function atualizarSistema() {

    atualizarContadores();

    renderizarApolices();
}


/* =========================================
   INICIALIZAÇÃO
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        atualizarSistema();

    }
);
