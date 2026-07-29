import { useEffect, useState, useRef } from "react";
import "./App.css";
import { Analytics } from "@vercel/analytics/react";

const STORAGE_KEY = "costura-diaria:registros";
const META_DIARIA_KEY = "costura-diaria:metaDiaria";
const META_MENSAL_KEY = "costura-diaria:metaMensal";
const CRONOMETRO_TEMPO_KEY = "costura-diaria:cronometroTempo";
const CRONOMETRO_RODANDO_KEY = "costura-diaria:cronometroRodando";
const CRONOMETRO_INICIO_KEY = "costura-diaria:cronometroInicio";

function hoje() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarDinheiro(valor) {
  if (!isFinite(valor)) return "R$ 0,00";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarHoras(horasDecimais) {
  if (!isFinite(horasDecimais) || horasDecimais <= 0) return "0h 00min";
  const totalMin = Math.round(horasDecimais * 60);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return `${h}h ${String(min).padStart(2, "0")}min`;
}

export default function App() {
  const [data, setData] = useState(hoje());
  const [pecas, setPecas] = useState("");
  const [valorPeca, setValorPeca] = useState("");
  const [horas, setHoras] = useState("");
  const [minutos, setMinutos] = useState("");
  const [gastos, setGastos] = useState("");
  const [observacao, setObservacao] = useState("");
  const [resultado, setResultado] = useState(null);
  const [registros, setRegistros] = useState([]);

  const [metaDiaria, setMetaDiaria] = useState("100");
  const [metaMensal, setMetaMensal] = useState("2000");
  const [filtroMes, setFiltroMes] = useState("todos");

  const [segundosTotais, setSegundosTotais] = useState(() => {
    const salvoTempo = localStorage.getItem(CRONOMETRO_TEMPO_KEY);
    const salvoRodando =
      localStorage.getItem(CRONOMETRO_RODANDO_KEY) === "true";
    const salvoInicio = localStorage.getItem(CRONOMETRO_INICIO_KEY);

    if (salvoRodando && salvoInicio) {
      const segundosPassados = Math.floor(
        (Date.now() - parseInt(salvoInicio, 10)) / 1000,
      );
      return (salvoTempo ? parseInt(salvoTempo, 10) : 0) + segundosPassados;
    }
    return salvoTempo ? parseInt(salvoTempo, 10) : 0;
  });

  const [rodandoCronometro, setRodandoCronometro] = useState(() => {
    return localStorage.getItem(CRONOMETRO_RODANDO_KEY) === "true";
  });

  const timerRef = useRef(null);

  useEffect(() => {
    try {
      const salvos = localStorage.getItem(STORAGE_KEY);
      if (salvos) setRegistros(JSON.parse(salvos));

      const mDiariaSalva = localStorage.getItem(META_DIARIA_KEY);
      if (mDiariaSalva) setMetaDiaria(mDiariaSalva);

      const mMensalSalva = localStorage.getItem(META_MENSAL_KEY);
      if (mMensalSalva) setMetaMensal(mMensalSalva);
    } catch (e) {
      console.error("Não deu pra carregar os dados salvos", e);
    }
  }, []);

  useEffect(() => {
    if (rodandoCronometro) {
      localStorage.setItem(CRONOMETRO_RODANDO_KEY, "true");
      let inicio = localStorage.getItem(CRONOMETRO_INICIO_KEY);
      const tempoSalvo = parseInt(
        localStorage.getItem(CRONOMETRO_TEMPO_KEY) || "0",
        10,
      );

      if (!inicio) {
        const timestampInicioReal = Date.now() - tempoSalvo * 1000;
        localStorage.setItem(
          CRONOMETRO_INICIO_KEY,
          timestampInicioReal.toString(),
        );
        inicio = timestampInicioReal.toString();
      }

      timerRef.current = setInterval(() => {
        const agora = Date.now();
        const tempoDecorridoMs = agora - parseInt(inicio, 10);
        const novosSegundos = Math.floor(tempoDecorridoMs / 1000);

        setSegundosTotais(novosSegundos);
        localStorage.setItem(CRONOMETRO_TEMPO_KEY, novosSegundos.toString());
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      localStorage.setItem(CRONOMETRO_RODANDO_KEY, "false");
      localStorage.removeItem(CRONOMETRO_INICIO_KEY);
      localStorage.setItem(CRONOMETRO_TEMPO_KEY, segundosTotais.toString());
    }

    return () => clearInterval(timerRef.current);
  }, [rodandoCronometro]);

  function alternarCronometro() {
    setRodandoCronometro(!rodandoCronometro);
  }

  function zerarCronometro() {
    setRodandoCronometro(false);
    setSegundosTotais(0);
    localStorage.removeItem(CRONOMETRO_TEMPO_KEY);
    localStorage.removeItem(CRONOMETRO_RODANDO_KEY);
    localStorage.removeItem(CRONOMETRO_INICIO_KEY);
  }

  function usarTempoDoCronometro() {
    const totalMinutos = Math.floor(segundosTotais / 60);
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    setHoras(h > 0 ? String(h) : "");
    setMinutos(m > 0 ? String(m) : "");
  }

  function formatarTempoCronometro(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function salvarRegistros(lista) {
    setRegistros(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  function handleMetaDiariaChange(val) {
    setMetaDiaria(val);
    localStorage.setItem(META_DIARIA_KEY, val);
  }

  function handleMetaMensalChange(val) {
    setMetaMensal(val);
    localStorage.setItem(META_MENSAL_KEY, val);
  }

  function calcular(e) {
    e.preventDefault();
    const nPecas = parseFloat(pecas) || 0;
    const nValor = parseFloat(valorPeca) || 0;
    const nHoras = parseFloat(horas) || 0;
    const nMinutos = parseFloat(minutos) || 0;
    const nGastos = parseFloat(gastos) || 0;
    const horasDecimais = nHoras + nMinutos / 60;

    if (nPecas <= 0 || nValor <= 0 || horasDecimais <= 0) {
      setResultado({
        erro: "Preenche peças, valor da peça e o tempo trabalhado pra calcular.",
      });
      return;
    }

    const totalGanho = nPecas * nValor;
    const lucroLiquido = totalGanho - nGastos;
    const mediaPecasHora = nPecas / horasDecimais;
    const mediaReaisHora = lucroLiquido / horasDecimais;

    const novoResultado = {
      data,
      pecas: nPecas,
      valorPeca: nValor,
      horasDecimais,
      totalGanho,
      gastos: nGastos,
      lucroLiquido,
      observacao: observacao.trim(),
      mediaPecasHora,
      mediaReaisHora,
    };
    setResultado(novoResultado);

    const outrasSemHoje = registros.filter((r) => r.data !== data);
    salvarRegistros(
      [novoResultado, ...outrasSemHoje].sort((a, b) =>
        a.data < b.data ? 1 : -1,
      ),
    );
  }

  function apagarRegistro(dataAlvo) {
    salvarRegistros(registros.filter((r) => r.data !== dataAlvo));
    if (resultado && resultado.data === dataAlvo) setResultado(null);
  }

  function baixarTabelaCSV() {
    if (registrosFiltrados.length === 0) return;

    let csvContent =
      "data:text/csv;charset=utf-8," +
      "Data;Pecas;Valor Peca (R$);Horas Trabalhadas;Gastos (R$);Total Bruto (R$);Lucro Liquido (R$);Observacao\r\n";

    registrosFiltrados.forEach((r) => {
      const linha = [
        formatarData(r.data),
        r.pecas,
        r.valorPeca.toFixed(2).replace(".", ","),
        formatarHoras(r.horasDecimais),
        r.gastos.toFixed(2).replace(".", ","),
        r.totalGanho.toFixed(2).replace(".", ","),
        r.lucroLiquido.toFixed(2).replace(".", ","),
        `"${(r.observacao || "").replace(/"/g, '""')}"`,
      ].join(";");
      csvContent += linha + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `fio-do-dia-${filtroMes === "todos" ? "geral" : filtroMes}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const mesesDisponiveis = Array.from(
    new Set(registros.map((r) => r.data.slice(0, 7))),
  )
    .sort()
    .reverse();

  const registrosFiltrados =
    filtroMes === "todos"
      ? registros
      : registros.filter((r) => r.data.startsWith(filtroMes));

  const mesAtualIso = hoje().slice(0, 7);
  const registrosMesAtual = registros.filter((r) =>
    r.data.startsWith(mesAtualIso),
  );
  const totalMesAtual = registrosMesAtual.reduce(
    (soma, r) => soma + r.lucroLiquido,
    0,
  );

  const diasTrabalhadosNoMes = new Set(registrosMesAtual.map((r) => r.data))
    .size;
  const [anoAtual, mesAtualNum] = mesAtualIso.split("-").map(Number);
  const totalDiasDoMes = new Date(anoAtual, mesAtualNum, 0).getDate();
  const mediaLucroPorDiaTrabalhado =
    diasTrabalhadosNoMes > 0 ? totalMesAtual / diasTrabalhadosNoMes : 0;
  const projecaoFinalMes = mediaLucroPorDiaTrabalhado * totalDiasDoMes;

  const totalExibidoHistorico = registrosFiltrados.reduce(
    (soma, r) => soma + r.lucroLiquido,
    0,
  );

  const registroDoDiaAtual = registros.find((r) => r.data === data);
  const lucroDiaAtual = registroDoDiaAtual
    ? registroDoDiaAtual.lucroLiquido
    : resultado && resultado.data === data
      ? resultado.lucroLiquido
      : 0;

  const nMetaDiaria = parseFloat(metaDiaria) || 0;
  const nMetaMensal = parseFloat(metaMensal) || 0;

  const progressoDiario =
    nMetaDiaria > 0 ? Math.min((lucroDiaAtual / nMetaDiaria) * 100, 100) : 0;
  const progressoMensal =
    nMetaMensal > 0 ? Math.min((totalMesAtual / nMetaMensal) * 100, 100) : 0;

  return (
    <div className="caderno">
      <div className="espiral" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="anel" />
        ))}
      </div>

      <main className="pagina">
        <header className="cabecalho">
          <div className="retalho" aria-hidden="true" />
          <div>
            <p className="eyebrow">caderno de produção</p>
            <h1>Fio do Dia</h1>
          </div>
        </header>

        <section className="bloco-metas">
          <p className="eyebrow">Metas de Lucro Líquido</p>
          <div className="grade-metas">
            <label className="campo-meta">
              <span>Meta Diária (R$)</span>
              <input
                type="number"
                min="0"
                step="10"
                value={metaDiaria}
                onChange={(ev) => handleMetaDiariaChange(ev.target.value)}
              />
            </label>
            <label className="campo-meta">
              <span>Meta Mensal (R$)</span>
              <input
                type="number"
                min="0"
                step="100"
                value={metaMensal}
                onChange={(ev) => handleMetaMensalChange(ev.target.value)}
              />
            </label>
          </div>

          <div className="progresso-container">
            <div className="barra-info">
              <span>
                Hoje: {formatarDinheiro(lucroDiaAtual)} / Meta:{" "}
                {formatarDinheiro(nMetaDiaria)}
              </span>
              <span>{Math.round(progressoDiario)}%</span>
            </div>
            <div className="barra-fundo">
              <div
                className="barra-preenchida"
                style={{ width: `${progressoDiario}%` }}
              />
            </div>

            <div className="barra-info" style={{ marginTop: "8px" }}>
              <span>
                Mês Atual: {formatarDinheiro(totalMesAtual)} / Meta:{" "}
                {formatarDinheiro(nMetaMensal)}
              </span>
              <span>{Math.round(progressoMensal)}%</span>
            </div>
            <div className="barra-fundo">
              <div
                className="barra-preenchida mensal"
                style={{ width: `${progressoMensal}%` }}
              />
            </div>
          </div>

          <div
            className="bloco-projecao"
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "#f4efe6",
              borderRadius: "8px",
              border: "1.5px dashed var(--papel-linha)",
            }}
          >
            <p className="eyebrow" style={{ marginBottom: "4px" }}>
              Simulação e Projeção do Mês
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--tinta)",
                lineHeight: "1.4",
              }}
            >
              Acumulado até agora:{" "}
              <strong>{formatarDinheiro(totalMesAtual)}</strong> (
              {diasTrabalhadosNoMes}{" "}
              {diasTrabalhadosNoMes === 1
                ? "dia registrado"
                : "dias registrados"}
              ).
              <br />
              Se continuar nesse ritmo, a projeção de fechamento do mês é de
              aproximadamente{" "}
              <strong>{formatarDinheiro(projecaoFinalMes)}</strong>.
            </p>
          </div>
        </section>

        <section
          className="bloco-cronometro"
          style={{
            margin: "20px 0",
            padding: "14px",
            background: "#fffcf7",
            borderRadius: "8px",
            border: "1.5px solid var(--papel-linha)",
            textAlign: "center",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: "6px" }}>
            Cronômetro de Trabalho
          </p>
          <div
            style={{
              fontSize: "28px",
              fontFamily: "monospace",
              fontWeight: "bold",
              color: "var(--tinta)",
              marginBottom: "10px",
            }}
          >
            {formatarTempoCronometro(segundosTotais)}
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={alternarCronometro}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: rodandoCronometro ? "#d97706" : "var(--tecido)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              {rodandoCronometro ? "Pausar" : "Iniciar"}
            </button>
            <button
              type="button"
              onClick={zerarCronometro}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1.5px solid var(--papel-linha)",
                background: "#fff",
                color: "var(--tinta)",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Zerar
            </button>
            <button
              type="button"
              onClick={usarTempoDoCronometro}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: "#15803d",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              Usar no Formulário ↓
            </button>
          </div>
        </section>

        <form className="formulario" onSubmit={calcular}>
          <label className="campo campo-data">
            <span>Dia</span>
            <input
              type="date"
              value={data}
              onChange={(ev) => setData(ev.target.value)}
              required
            />
          </label>

          <div className="grade-campos">
            <label className="campo">
              <span>Quantas peças você fez</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="ex: 78"
                value={pecas}
                onChange={(ev) => setPecas(ev.target.value)}
                required
              />
            </label>

            <label className="campo">
              <span>Valor por peça</span>
              <div className="campo-com-prefixo">
                <span className="prefixo">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="ex: 0,35"
                  value={valorPeca}
                  onChange={(ev) => setValorPeca(ev.target.value)}
                  required
                />
              </div>
            </label>

            <label className="campo">
              <span>Horas trabalhadas</span>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="ex: 5"
                value={horas}
                onChange={(ev) => setHoras(ev.target.value)}
                required
              />
            </label>

            <label className="campo">
              <span>Minutos</span>
              <input
                type="number"
                min="0"
                max="59"
                step="1"
                inputMode="numeric"
                placeholder="ex: 43"
                value={minutos}
                onChange={(ev) => setMinutos(ev.target.value)}
              />
            </label>

            <label className="campo" style={{ gridColumn: "1 / -1" }}>
              <span>Gastos com materiais do dia (opcional)</span>
              <div className="campo-com-prefixo">
                <span className="prefixo">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="ex: 15,00"
                  value={gastos}
                  onChange={(ev) => setGastos(ev.target.value)}
                />
              </div>
            </label>

            <label className="campo" style={{ gridColumn: "1 / -1" }}>
              <span>Observações (ex: vestidos sob medida, consertos)</span>
              <input
                type="text"
                placeholder="ex: Fiz 3 vestidos sob medida"
                value={observacao}
                onChange={(ev) => setObservacao(ev.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="botao-calcular">
            Calcular meu dia
          </button>
        </form>

        {resultado && resultado.erro && (
          <p className="aviso-erro">{resultado.erro}</p>
        )}

        {resultado && !resultado.erro && (
          <section className="resumo">
            <p className="eyebrow">
              resumo do dia · {formatarData(resultado.data)}
            </p>
            <p className="frase-resumo">
              Você trabalhou{" "}
              <strong>{formatarHoras(resultado.horasDecimais)}</strong>, fez{" "}
              <strong>{resultado.pecas} peças</strong> e teve um lucro de{" "}
              <strong>{formatarDinheiro(resultado.lucroLiquido)}</strong>.
            </p>

            <div className="tabela-resumo">
              {resultado.observacao && (
                <div className="linha-resumo">
                  <span>Observação</span>
                  <strong>{resultado.observacao}</strong>
                </div>
              )}
              <div className="linha-resumo">
                <span>Total Bruto</span>
                <strong>{formatarDinheiro(resultado.totalGanho)}</strong>
              </div>
              <div className="linha-resumo">
                <span>Gastos com materiais</span>
                <strong>- {formatarDinheiro(resultado.gastos)}</strong>
              </div>
              <div className="linha-resumo destaque">
                <span>Lucro Líquido do dia</span>
                <strong>{formatarDinheiro(resultado.lucroLiquido)}</strong>
              </div>
              <div className="linha-resumo">
                <span>Média de peças por hora</span>
                <strong>
                  {resultado.mediaPecasHora.toLocaleString("pt-BR", {
                    maximumFractionDigits: 1,
                  })}
                </strong>
              </div>
              <div className="linha-resumo">
                <span>Lucro por hora trabalhada</span>
                <strong>{formatarDinheiro(resultado.mediaReaisHora)}</strong>
              </div>
            </div>
          </section>
        )}

        {registros.length > 0 && (
          <section className="historico">
            <div className="historico-cabecalho">
              <p className="eyebrow">histórico de dias</p>
              <div
                className="filtro-container"
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <select
                  className="seletor-filtro"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                >
                  <option value="todos">Todos os meses</option>
                  {mesesDisponiveis.map((m) => {
                    const [ano, mes] = m.split("-");
                    const nomeMes = new Date(ano, mes - 1).toLocaleString(
                      "pt-BR",
                      { month: "long", year: "numeric" },
                    );
                    return (
                      <option key={m} value={m}>
                        {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  onClick={baixarTabelaCSV}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1.5px solid var(--papel-linha)",
                    background: "#fff",
                    color: "var(--tinta)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  title="Baixar tabela do período selecionado"
                >
                  Baixar Tabela 📊
                </button>
              </div>
            </div>

            <p className="total-mes" style={{ marginBottom: "10px" }}>
              Lucro líquido do período:{" "}
              <strong>{formatarDinheiro(totalExibidoHistorico)}</strong>
            </p>

            <div className="lista-historico">
              {registrosFiltrados.length === 0 ? (
                <p className="item-detalhe">
                  Nenhum registro encontrado neste período.
                </p>
              ) : (
                registrosFiltrados.map((r) => (
                  <div className="item-historico" key={r.data}>
                    <div className="item-historico-info">
                      <span className="item-data">{formatarData(r.data)}</span>
                      <span className="item-detalhe">
                        {r.pecas} peças · {formatarHoras(r.horasDecimais)}{" "}
                        {r.gastos > 0
                          ? `· Gasto: ${formatarDinheiro(r.gastos)}`
                          : ""}
                        {r.observacao ? ` · "${r.observacao}"` : ""}
                      </span>
                    </div>
                    <div className="item-historico-valor">
                      <strong>{formatarDinheiro(r.lucroLiquido)}</strong>
                      <button
                        type="button"
                        className="botao-apagar"
                        onClick={() => apagarRegistro(r.data)}
                        aria-label={`Apagar registro de ${formatarData(r.data)}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <p className="rodape">
          feito com carinho pra facilitar as contas · os dados ficam salvos só
          neste computador
        </p>
      </main>
      <Analytics />
    </div>
  );
}
