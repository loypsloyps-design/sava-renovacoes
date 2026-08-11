/* =========================================================
   SAVA SEGUROS
   CENTRAL DE RENOVAÇÕES
   JAVASCRIPT
========================================================= */


/* =========================================================
   BANCO TEMPORÁRIO
========================================================= */

let apolices =
    JSON.parse(
        localStorage.getItem("savaApolices")
    ) || [];

let apoliceAtualId = null;

let apoliceExclusaoId = null;

let temporizadorNotificacao = null;


/* =========================================================
   ELEMENTOS
========================================================= */

const modalCadastro =
    document.getElementById("modalCadastro");

const modalDetalhes =
    document.getElementById("modalDetalhes");

const modalExcluir =
    document.getElementById("modalExcluir");

const modalSobre =
    document.getElementById("modalSobre");

const formulario =
    document.getElementById("formApolice");

const listaApolices =
    document.getElementById("listaApolices");

const campoBusca =
    document.getElementById("campoBusca");


/* =========================================================
   ABRIR CADASTRO
========================================================= */

function abrirCadastro() {

    formulario.reset();

    document.getElementById("idEdicao").value = "";

    document.getElementById("tituloModal").textContent =
        "Nova Apólice";

    document.getElementById("alerta30").checked = true;
    document.getElementById("alerta15").checked = true;
    document.getElementById("alerta7").checked = true;

    modalCadastro.classList.add("ativo");

    setTimeout(function () {

        document
            .getElementById("cliente")
            .focus();

    }, 150);
}


/* =========================================================
   FECHAR CADASTRO
========================================================= */

function fecharCadastro() {

    modalCadastro.classList.remove("ativo");
}


/* =========================================================
   FECHAR DETALHES
========================================================= */

function fecharDetalhes() {

    modalDetalhes.classList.remove("ativo");

    apoliceAtualId = null;
}


/* =========================================================
   ABRIR SOBRE
========================================================= */

function mostrarSobre() {

    modalSobre.classList.add("ativo");
}

function fecharSobre() {

    modalSobre.classList.remove("ativo");
}


/* =========================================================
   CLICAR FORA DOS MODAIS
========================================================= */

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


modalSobre.addEventListener(
    "click",
    function (event) {

        if (event.target === modalSobre) {

            fecharSobre();

        }

    }
);


/* =========================================================
   ESC FECHA MODAL
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }

        fecharCadastro();
        fecharDetalhes();
        fecharModalExcluir();
        fecharSobre();

    }
);


/* =========================================================
   TELEFONE
========================================================= */

document
    .getElementById("telefone")
    .addEventListener(
        "input",
        function (event) {

            let telefone =
                event.target.value
                    .replace(/\D/g, "");

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


/* =========================================================
   SALVAR APÓLICE
========================================================= */

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


/* =========================================================
   SALVAR DADOS
========================================================= */

function salvarDados() {

    localStorage.setItem(
        "savaApolices",
        JSON.stringify(apolices)
    );
}


/* =========================================================
   CALCULAR DIAS
========================================================= */

function calcularDias(data) {

    if (!data) {
        return 99999;
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


/* =========================================================
   FORMATAR DATA
========================================================= */

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


/* =========================================================
   STATUS
========================================================= */

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


/* =========================================================
   CONTADORES
========================================================= */

function atualizarContadores() {

    let vencemHoje = 0;

    let proximos7 = 0;

    let proximos30 = 0;

    let vencidas = 0;

    let vigentes = 0;


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


            if (dias > 30) {
                vigentes++;
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
        "totalVigentes"
    ).textContent =
        vigentes;


    document.getElementById(
        "totalAtencao"
    ).textContent =
        proximos30;


    document.getElementById(
        "totalUrgentes"
    ).textContent =
        proximos7 + vencemHoje;


    document.getElementById(
        "totalVencidasResumo"
    ).textContent =
        vencidas;


    document.getElementById(
        "badgeRenovacoes"
    ).textContent =
        proximos7 + vencemHoje;
}


/* =========================================================
   RENDERIZAR TABELA
========================================================= */

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
                            <i class="fa-regular fa-file"></i>
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
                            <i class="fa-regular fa-eye"></i>
                        </button>


                        <button
                            class="btn-acao"
                            title="Editar"
                            onclick="editarApolice(${apolice.id})"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>


                        <button
                            class="btn-acao"
                            title="Excluir"
                            onclick="abrirConfirmacaoExclusao(${apolice.id})"
                        >
                            <i class="fa-solid fa-trash"></i>
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


/* =========================================================
   BUSCA
========================================================= */

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

                    String(apolice.cliente || "")
                        .toLowerCase()
                        .includes(termo)

                    ||

                    String(apolice.numeroApolice || "")
                        .toLowerCase()
                        .includes(termo)

                    ||

                    String(apolice.telefone || "")
                        .toLowerCase()
                        .includes(termo)

                    ||

                    String(apolice.seguradora || "")
                        .toLowerCase()
                        .includes(termo)

                    ||

                    String(apolice.tipoSeguro || "")
                        .toLowerCase()
                        .includes(termo)

                );

            }
        );


    renderizarApolices(
        resultado
    );
}


/* =========================================================
   ABRIR DETALHES
========================================================= */

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
        apolice.id;


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
        apolice.telefone || "-";


    document.getElementById(
        "detalhesApolice"
    ).textContent =
        apolice.numeroApolice || "-";


    document.getElementById(
        "detalhesSeguradora"
    ).textContent =
        apolice.seguradora || "-";


    document.getElementById(
        "detalhesSeguro"
    ).textContent =
        apolice.tipoSeguro || "-";


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
}


/* =========================================================
   ALERTAS DOS DETALHES
========================================================= */

function mostrarAlertasDetalhes(apolice) {

    const container =
        document.getElementById(
            "detalhesAlertas"
        );


    container.innerHTML = "";


    const alertas = [

        {
            nome: "30 dias antes",
            ativo:
                apolice.alertas?.dias30 ?? true
        },

        {
            nome: "15 dias antes",
            ativo:
                apolice.alertas?.dias15 ?? true
        },

        {
            nome: "7 dias antes",
            ativo:
                apolice.alertas?.dias7 ?? true
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


/* =========================================================
   EDITAR
========================================================= */

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


    document.getElementById(
        "alerta30"
    ).checked =
        apolice.alertas?.dias30 ?? true;


    document.getElementById(
        "alerta15"
    ).checked =
        apolice.alertas?.dias15 ?? true;


    document.getElementById(
        "alerta7"
    ).checked =
        apolice.alertas?.dias7 ?? true;


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
}


/* =========================================================
   EDITAR PELOS DETALHES
========================================================= */

function editarApoliceAtual() {

    if (apoliceAtualId) {

        editarApolice(
            apoliceAtualId
        );

    }
}


/* =========================================================
   CONFIRMAÇÃO DE EXCLUSÃO
========================================================= */

function abrirConfirmacaoExclusao(id) {

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


    apoliceExclusaoId =
        apolice.id;


    document.getElementById(
        "clienteExclusao"
    ).textContent =
        apolice.cliente;


    modalExcluir.classList.add(
        "ativo"
    );
}


function fecharModalExcluir() {

    modalExcluir.classList.remove(
        "ativo"
    );

    apoliceExclusaoId = null;
}


function confirmarExclusao() {

    if (!apoliceExclusaoId) {
        return;
    }


    const apolice =
        apolices.find(
            function (item) {

                return String(item.id) ===
                    String(apoliceExclusaoId);

            }
        );


    if (!apolice) {

        fecharModalExcluir();

        return;
    }


    const nome =
        apolice.cliente;


    apolices =
        apolices.filter(
            function (item) {

                return String(item.id) !==
                    String(apoliceExclusaoId);

            }
        );


    salvarDados();

    atualizarSistema();

    fecharModalExcluir();

    fecharDetalhes();


    mostrarNotificacao(
        "Apólice removida",
        `O cadastro de ${nome} foi removido da central.`
    );
}


/* =========================================================
   EXCLUIR PELOS DETALHES
========================================================= */

function excluirApoliceAtual() {

    if (!apoliceAtualId) {
        return;
    }


    abrirConfirmacaoExclusao(
        apoliceAtualId
    );
}


/* =========================================================
   WHATSAPP
========================================================= */

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
        String(apolice.telefone || "")
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


/* =========================================================
   PAINEL DE ATENÇÃO
========================================================= */

function renderizarAtencao() {

    const container =
        document.getElementById(
            "listaAtencao"
        );


    const lista =
        [...apolices]
            .filter(
                function (apolice) {

                    return calcularDias(
                        apolice.dataVencimento
                    ) <= 30;

                }
            )
            .sort(
                function (a, b) {

                    return calcularDias(
                        a.dataVencimento
                    ) -
                    calcularDias(
                        b.dataVencimento
                    );

                }
            )
            .slice(0, 5);


    if (lista.length === 0) {

        container.innerHTML = `

            <div class="atencao-vazio">

                <i class="fa-solid fa-check"></i>

                <strong>
                    Tudo sob controle!
                </strong>

                <span>
                    Nenhuma renovação próxima.
                </span>

            </div>

        `;

        return;
    }


    container.innerHTML = "";


    lista.forEach(
        function (apolice) {

            const dias =
                calcularDias(
                    apolice.dataVencimento
                );


            let textoPrazo = "";

            let classePrazo = "";


            if (dias < 0) {

                textoPrazo =
                    "Vencida";

                classePrazo =
                    "prazo-urgente";

            } else if (dias === 0) {

                textoPrazo =
                    "Hoje";

                classePrazo =
                    "prazo-urgente";

            } else {

                textoPrazo =
                    `${dias} dia${dias === 1 ? "" : "s"}`;

                classePrazo =
                    dias <= 7
                        ? "prazo-urgente"
                        : "prazo-atencao";

            }


            const iniciais =
                gerarIniciais(
                    apolice.cliente
                );


            const item =
                document.createElement("div");


            item.className =
                "atencao-item";


            item.innerHTML = `

                <div class="atencao-avatar">
                    ${iniciais}
                </div>

                <div class="atencao-info">

                    <strong>
                        ${escaparHTML(
                            apolice.cliente
                        )}
                    </strong>

                    <span>
                        ${escaparHTML(
                            apolice.seguradora
                        )}
                        •
                        ${escaparHTML(
                            apolice.tipoSeguro
                        )}
                    </span>

                </div>

                <div class="atencao-prazo">

                    <strong class="${classePrazo}">
                        ${textoPrazo}
                    </strong>

                    <span>
                        ${formatarData(
                            apolice.dataVencimento
                        )}
                    </span>

                </div>

            `;


            item.addEventListener(
                "click",
                function () {

                    abrirDetalhes(
                        apolice.id
                    );

                }
            );


            item.style.cursor =
                "pointer";


            container.appendChild(
                item
            );

        }
    );
}


/* =========================================================
   TIPOS DE SEGURO
========================================================= */

function renderizarTiposSeguro() {

    const container =
        document.getElementById(
            "tiposSeguro"
        );


    container.innerHTML = "";


    if (apolices.length === 0) {

        container.innerHTML = `

            <div class="atencao-vazio">

                <i class="fa-solid fa-chart-simple"></i>

                <strong>
                    Nenhum dado ainda
                </strong>

                <span>
                    Cadastre apólices para visualizar.
                </span>

            </div>

        `;

        return;
    }


    const contagem = {};


    apolices.forEach(
        function (apolice) {

            const tipo =
                apolice.tipoSeguro ||
                "Outro";


            contagem[tipo] =
                (contagem[tipo] || 0) + 1;

        }
    );


    const tipos =
        Object.entries(
            contagem
        )
        .sort(
            function (a, b) {
                return b[1] - a[1];
            }
        )
        .slice(0, 5);


    const maior =
        tipos.length
            ? tipos[0][1]
            : 1;


    tipos.forEach(
        function ([tipo, quantidade]) {

            const percentual =
                Math.round(
                    (quantidade / maior) * 100
                );


            const item =
                document.createElement("div");


            item.className =
                "tipo-item";


            item.innerHTML = `

                <div class="tipo-cor"></div>

                <div class="tipo-info">

                    <span>
                        ${escaparHTML(tipo)}
                    </span>

                    <div class="tipo-barra">

                        <div
                            style="width: ${percentual}%"
                        ></div>

                    </div>

                </div>

                <strong>
                    ${quantidade}
                </strong>

            `;


            container.appendChild(
                item
            );

        }
    );
}


/* =========================================================
   GRÁFICO
========================================================= */

function renderizarGrafico() {

    const container =
        document.getElementById(
            "graficoRenovacoes"
        );


    container.innerHTML = "";


    const hoje =
        new Date();


    const meses = [];


    for (let i = -5; i <= 6; i++) {

        const data =
            new Date(
                hoje.getFullYear(),
                hoje.getMonth() + i,
                1
            );


        meses.push({

            numero:
                data.getMonth(),

            ano:
                data.getFullYear(),

            nome:
                data.toLocaleDateString(
                    "pt-BR",
                    {
                        month: "short"
                    }
                )
                .replace(".", "")

        });

    }


    const valores =
        meses.map(
            function (mes) {

                return apolices.filter(
                    function (apolice) {

                        if (!apolice.dataVencimento) {
                            return false;
                        }

                        const data =
                            new Date(
                                apolice.dataVencimento +
                                "T00:00:00"
                            );


                        return (
                            data.getMonth() ===
                                mes.numero
                            &&
                            data.getFullYear() ===
                                mes.ano
                        );

                    }
                ).length;

            }
        );


    const maior =
        Math.max(
            ...valores,
            1
        );


    meses.forEach(
        function (mes, index) {

            const coluna =
                document.createElement("div");


            coluna.className =
                "coluna-grafico";


            const altura =
                valores[index] === 0
                    ? 3
                    : Math.max(
                        8,
                        (valores[index] / maior) *
                        190
                    );


            coluna.innerHTML = `

                <div
                    class="barra-grafico"
                    style="height: ${altura}px"
                >

                    <span class="valor-barra">
                        ${valores[index]}
                    </span>

                </div>

                <span class="mes-grafico">
                    ${mes.nome}
                </span>

            `;


            container.appendChild(
                coluna
            );

        }
    );
}


/* =========================================================
   ATUALIZAR SISTEMA
========================================================= */

function atualizarSistema() {

    atualizarContadores();

    renderizarApolices();

    renderizarAtencao();

    renderizarTiposSeguro();

    renderizarGrafico();
}


/* =========================================================
   NOTIFICAÇÃO
========================================================= */

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


/* =========================================================
   FECHAR NOTIFICAÇÃO
========================================================= */

function fecharNotificacao() {

    document
        .getElementById(
            "notificacao"
        )
        .classList.remove(
            "ativo"
        );
}


/* =========================================================
   SEGURANÇA HTML
========================================================= */

function escaparHTML(texto) {

    return String(texto ?? "")

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


/* =========================================================
   INICIAIS
========================================================= */

function gerarIniciais(nome) {

    const partes =
        String(nome || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (partes.length === 0) {
        return "?";
    }


    if (partes.length === 1) {

        return partes[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        partes[0][0] +
        partes[partes.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function limparMenuAtivo() {

    document
        .querySelectorAll(".menu-item")
        .forEach(
            function (item) {

                item.classList.remove(
                    "ativo"
                );

            }
        );
}


function ativarMenu(indice) {

    const itens =
        document.querySelectorAll(
            ".menu-item"
        );


    if (itens[indice]) {

        itens[indice].classList.add(
            "ativo"
        );

    }
}


function mostrarDashboard() {

    limparMenuAtivo();

    ativarMenu(0);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function focarApolices() {

    limparMenuAtivo();

    ativarMenu(1);


    const painel =
        document.getElementById(
            "painelApolices"
        );


    painel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function mostrarAtencao() {

    limparMenuAtivo();

    ativarMenu(2);


    const painel =
        document.querySelector(
            ".painel-atencao"
        );


    painel.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function mostrarClientes() {

    limparMenuAtivo();

    ativarMenu(3);


    const painel =
        document.getElementById(
            "painelApolices"
        );


    painel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    campoBusca.focus();
}


/* =========================================================
   SIDEBAR MOBILE
========================================================= */

function alternarSidebar() {

    document
        .querySelector(".sidebar")
        .classList.toggle(
            "aberta"
        );
}


/* =========================================================
   FECHAR SIDEBAR AO CLICAR FORA
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        const botao =
            document.querySelector(
                ".btn-menu-mobile"
            );


        if (
            window.innerWidth <= 850 &&
            sidebar.classList.contains("aberta") &&
            !sidebar.contains(event.target) &&
            !botao.contains(event.target)
        ) {

            sidebar.classList.remove(
                "aberta"
            );

        }

    }
);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        atualizarSistema();

    }
);
