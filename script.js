const calendario = document.querySelector("#calendario");
const mesAno = document.querySelector("#mesAno");
const modal = document.querySelector("#modalDia");
const tipoDia = document.querySelector("#tipoDia");
const observacao = document.querySelector("#observacao");
const tituloModal = document.querySelector("#tituloModal");
const toast = document.querySelector("#toast");

const hoje = new Date();
let mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
let diaSelecionado = null;
let registros = carregarRegistros();

function chaveData(ano, mes, dia) {
    return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function carregarRegistros() {
    try {
        return JSON.parse(localStorage.getItem("minhaEscalaRegistros")) || {};
    } catch {
        return {};
    }
}

function salvarRegistros() {
    localStorage.setItem("minhaEscalaRegistros", JSON.stringify(registros));
}

function obterRegistro(chave) {
    return registros[chave] || { tipo: "Trabalho", observacao: "" };
}

function renderizarCalendario() {
    calendario.innerHTML = "";
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    mesAno.textContent = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(mesAtual);
    mesAno.textContent = mesAno.textContent.charAt(0).toUpperCase() + mesAno.textContent.slice(1);

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const quantidadeDias = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++) {
        const vazio = document.createElement("div");
        vazio.className = "dia-vazio";
        calendario.appendChild(vazio);
    }

    for (let dia = 1; dia <= quantidadeDias; dia++) {
        const chave = chaveData(ano, mes, dia);
        const registro = obterRegistro(chave);
        const botao = document.createElement("button");
        const classe = registro.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const ehHoje = ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate();

        botao.type = "button";
        botao.className = `dia ${classe}${ehHoje ? " hoje" : ""}`;
        botao.setAttribute("aria-label", `${dia}: ${registro.tipo}. Clique para editar.`);
        botao.innerHTML = `<span class="numero">${dia}</span><span class="status">${registro.tipo}</span>`;
        if (registro.observacao) botao.title = registro.observacao;
        botao.addEventListener("click", () => abrirEdicao(chave, dia));
        calendario.appendChild(botao);
    }

    atualizarResumo(ano, mes, quantidadeDias);
}

function atualizarResumo(ano, mes, quantidadeDias) {
    const contagem = { Trabalho: 0, Folga: 0, Atestado: 0, Feriado: 0, Férias: 0 };
    for (let dia = 1; dia <= quantidadeDias; dia++) {
        const tipo = obterRegistro(chaveData(ano, mes, dia)).tipo;
        contagem[tipo] = (contagem[tipo] || 0) + 1;
    }
    document.querySelector("#totalTrabalho").textContent = contagem.Trabalho;
    document.querySelector("#totalFolga").textContent = contagem.Folga;
    document.querySelector("#totalOutros").textContent = contagem.Atestado + contagem.Feriado + contagem["Férias"];
}

function abrirEdicao(chave, dia) {
    diaSelecionado = chave;
    const registro = obterRegistro(chave);
    const data = new Date(`${chave}T12:00:00`);
    tituloModal.textContent = data.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    tipoDia.value = registro.tipo;
    observacao.value = registro.observacao || "";
    modal.showModal();
}

function fecharModal() {
    modal.close();
    diaSelecionado = null;
}

document.querySelector("#formDia").addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (!diaSelecionado) return;
    const tipo = tipoDia.value;
    const nota = observacao.value.trim();

    // Trabalho é o padrão. Removemos o registro para manter os dados mais simples.
    if (tipo === "Trabalho" && !nota) {
        delete registros[diaSelecionado];
    } else {
        registros[diaSelecionado] = { tipo, observacao: nota };
    }

    salvarRegistros();
    renderizarCalendario();
    fecharModal();
    mostrarToast("Alteração salva com sucesso!");
});

document.querySelector("#mesAnterior").addEventListener("click", () => {
    mesAtual.setMonth(mesAtual.getMonth() - 1);
    renderizarCalendario();
});
document.querySelector("#proximoMes").addEventListener("click", () => {
    mesAtual.setMonth(mesAtual.getMonth() + 1);
    renderizarCalendario();
});
document.querySelector("#irHoje").addEventListener("click", () => {
    mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    renderizarCalendario();
});
document.querySelector("#fecharModal").addEventListener("click", fecharModal);
document.querySelector("#cancelar").addEventListener("click", fecharModal);
modal.addEventListener("click", (evento) => {
    if (evento.target === modal) fecharModal();
});

let toastTimer;
function mostrarToast(mensagem) {
    toast.textContent = mensagem;
    toast.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visivel"), 2200);
}

renderizarCalendario();
