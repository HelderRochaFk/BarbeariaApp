import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, ChevronRight, Check, Star, User } from "lucide-react-native";
import { cores, gradienteDestaque } from "../theme";
import FadeBar from "../components/FadeBar";
import { getServicos, getBarbeiros, criarAgendamento, getMensalistas, getHorariosOcupados } from "../services/firestore";
import { HORARIOS_PADRAO, DIAS_FUNCIONAMENTO } from "../data/seed";
import { agendarLembreteCliente, notificarBarbeiroNovoAgendamento } from "../services/notifications";
import { auth } from "../firebaseConfig";
import ScreenBackground from "../components/ScreenBackground";

const fundoAgendar = require("../../assets/fundo-agendar.jpg");

const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function gerarProximosDias() {
  const hoje = new Date();
  const dias = [];
  let i = 0;
  // Gera os próximos dias no calendário e mantém só os dias em que a
  // barbearia funciona (ver DIAS_FUNCIONAMENTO em src/data/seed.js),
  // parando assim que tiver 30 dias disponíveis para mostrar.
  while (dias.length < 30 && i < 45) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    if (DIAS_FUNCIONAMENTO.includes(d.getDay())) {
      dias.push({ label: NOMES_DIAS[d.getDay()], num: d.getDate(), key: d.toISOString().slice(0, 10), diaSemana: d.getDay() });
    }
    i += 1;
  }
  return dias;
}

export default function BookScreen({ route, navigation }) {
  const dias = useMemo(gerarProximosDias, []);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [passo, setPasso] = useState(0);
  const [servicoSel, setServicoSel] = useState(null);
  const [barbeiroSel, setBarbeiroSel] = useState(null);
  const [diaSel, setDiaSel] = useState(dias[0].key);
  const [horaSel, setHoraSel] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [mensalistas, setMensalistas] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  // Pré-preenche nome/telefone se o cliente já agendou antes nesse aparelho
  useEffect(() => {
    (async () => {
      try {
        const nomeSalvo = await AsyncStorage.getItem("clienteNome");
        const telSalvo = await AsyncStorage.getItem("clienteTelefone");
        if (nomeSalvo) setNomeCliente(nomeSalvo);
        if (telSalvo) setTelefoneCliente(telSalvo);
      } catch (e) {
        // segue sem pré-preencher se não conseguir ler
      }
    })();
  }, []);

  // Lista de mensalistas carregada uma vez (dia/horário fixo de cada um)
  useEffect(() => {
    getMensalistas().then(setMensalistas).catch((e) => console.log("Erro ao carregar mensalistas:", e));
  }, []);

  // Sempre que o dia escolhido muda, busca quais horários já estão
  // ocupados por outros clientes naquele dia específico.
  useEffect(() => {
    if (passo !== 2 || !diaSel) return;
    let ativo = true;
    setCarregandoHorarios(true);
    getHorariosOcupados(diaSel)
      .then((lista) => { if (ativo) setHorariosOcupados(lista); })
      .catch((e) => console.log("Erro ao carregar horários ocupados:", e))
      .finally(() => { if (ativo) setCarregandoHorarios(false); });
    return () => { ativo = false; };
  }, [diaSel, passo]);

  // Horários indisponíveis no dia selecionado: já ocupados por um
  // agendamento normal, ou reservados por um mensalista naquele dia da
  // semana. Esses ficam visíveis, porém desabilitados.
  const diaSemanaSel = dias.find((d) => d.key === diaSel)?.diaSemana;
  const horariosDeMensalistas = mensalistas
    .filter((m) => m.diaSemana === diaSemanaSel)
    .map((m) => m.hora);

  const indisponiveis = new Set([...horariosOcupados, ...horariosDeMensalistas]);

  // Horários que já passaram, se o dia escolhido for hoje: esses somem
  // da lista por completo, em vez de aparecer desabilitados.
  const agora = new Date();
  const hojeKey = agora.toISOString().slice(0, 10);
  const horaAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const ehHoje = diaSel === hojeKey;
  const horariosVisiveis = HORARIOS_PADRAO.filter((h) => !ehHoje || h > horaAtual);

  // Se o horário escolhido deixou de estar disponível (ex: trocou de dia
  // e esse horário está reservado nesse outro dia, ou o tempo passou),
  // desmarca.
  useEffect(() => {
    if (horaSel && (indisponiveis.has(horaSel) || !horariosVisiveis.includes(horaSel))) setHoraSel(null);
  }, [diaSel, horariosOcupados, mensalistas]);

  // Reinicia o fluxo toda vez que a aba ganha foco, respeitando o serviço
  // vindo por parâmetro (quando o usuário toca em um serviço na Home/Catálogo).
  // Se só existir um barbeiro cadastrado, ele já é selecionado automaticamente
  // e a etapa "Escolha o barbeiro" é pulada.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        const [s, b] = await Promise.all([getServicos(), getBarbeiros()]);
        if (!ativo) return;
        setServicos(s);
        setBarbeiros(b);
        setCarregando(false);
        const servicoParam = route.params?.servico;
        const barbeiroUnico = b.length === 1 ? b[0] : null;
        setServicoSel(servicoParam || null);
        setBarbeiroSel(barbeiroUnico);
        setHoraSel(null);
        if (servicoParam) {
          setPasso(barbeiroUnico ? 2 : 1);
        } else {
          setPasso(0);
        }
      })();
      return () => { ativo = false; };
    }, [route.params?.servico])
  );

  const selecionarServico = (s) => {
    setServicoSel(s);
    setPasso(barbeiros.length === 1 ? 2 : 1);
  };

  const voltarPasso = () => {
    if (passo === 2 && barbeiros.length === 1) {
      setPasso(0);
    } else {
      setPasso(passo - 1);
    }
  };

  const confirmar = async () => {
    setSalvando(true);
    const dia = dias.find((d) => d.key === diaSel);
    const uid = auth.currentUser?.uid;
    const nome = nomeCliente.trim();
    const telefone = telefoneCliente.trim();
    const dataISO = `${diaSel}T${horaSel}`;
    await criarAgendamento(uid, {
      servico: servicoSel,
      barbeiro: barbeiroSel,
      dataISO,
      diaLabel: dia.label,
      diaNum: dia.num,
      hora: horaSel,
      clienteNome: nome,
      clienteTelefone: telefone,
    });
    try {
      await AsyncStorage.setItem("clienteNome", nome);
      await AsyncStorage.setItem("clienteTelefone", telefone);
    } catch (e) {
      // não é crítico se não conseguir salvar localmente
    }
    // Lembrete no celular do cliente + aviso para o barbeiro. Nenhum dos
    // dois bloqueia a confirmação se falhar (ex: sem permissão de
    // notificação) — o agendamento já foi salvo de qualquer forma.
    agendarLembreteCliente({ dataISO, servico: servicoSel });
    notificarBarbeiroNovoAgendamento({
      clienteNome: nome, servico: servicoSel, diaLabel: dia.label, diaNum: dia.num, hora: horaSel,
    });
    setSalvando(false);
    setPasso(3);
  };

  const finalizar = () => {
    navigation.navigate("Início");
  };

  if (carregando) {
    return (
      <ScreenBackground source={fundoAgendar}>
        <View style={styles.loading}>
          <ActivityIndicator color={cores.destaque} />
        </View>
      </ScreenBackground>
    );
  }

  if (passo === 3) {
    return (
      <ScreenBackground source={fundoAgendar}>
        <View style={[styles.container, { alignItems: "center", paddingTop: 60 }]}>
          <LinearGradient colors={gradienteDestaque} style={styles.checkCirculo}>
            <Check size={28} color={cores.fundo} strokeWidth={3} />
          </LinearGradient>
          <Text style={styles.confTitulo}>Horário marcado</Text>
          <Text style={styles.confTexto}>
            Seu agendamento foi salvo. Chegue com 5 minutos de antecedência.
          </Text>
          <TouchableOpacity style={styles.botaoSecundario} onPress={finalizar}>
            <Text style={styles.botaoSecundarioTexto}>Voltar ao início</Text>
          </TouchableOpacity>
        </View>
      </ScreenBackground>
    );
  }

  const titulos = ["Escolha o serviço", "Escolha o barbeiro", "Escolha o horário"];
  const progresso = [0.33, 0.66, 1][passo];

  return (
    <ScreenBackground source={fundoAgendar}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.header}>
        {passo > 0 && (
          <TouchableOpacity onPress={voltarPasso} style={{ marginRight: 8 }}>
            <ChevronLeft size={22} color={cores.textoMuted} />
          </TouchableOpacity>
        )}
        <Text style={styles.tituloPasso}>{titulos[passo]}</Text>
      </View>
      <View style={{ marginTop: 8, marginBottom: 18 }}>
        <FadeBar progress={progresso} />
      </View>

      {passo === 0 && servicos.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={[styles.opcao, servicoSel?.id === s.id && styles.opcaoAtiva]}
          onPress={() => selecionarServico(s)}
        >
          <View>
            <Text style={styles.opcaoTitulo}>{s.nome}</Text>
            <Text style={styles.opcaoSub}>{s.duracao} min · R${s.preco}</Text>
          </View>
          <ChevronRight size={16} color={cores.textoFraco} />
        </TouchableOpacity>
      ))}

      {passo === 1 && barbeiros.map((b) => (
        <TouchableOpacity
          key={b.id}
          style={[styles.opcao, barbeiroSel?.id === b.id && styles.opcaoAtiva]}
          onPress={() => { setBarbeiroSel(b); setPasso(2); }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{b.iniciais}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.opcaoTitulo}>{b.nome}</Text>
            <Text style={styles.opcaoSub}>{b.especialidade}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Star size={11} color={cores.destaque} fill={cores.destaque} />
            <Text style={styles.notaTexto}>{b.nota}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {passo === 2 && (
        <View>
          <Text style={styles.secaoLabel}>Dia</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {dias.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[styles.diaBox, diaSel === d.key && styles.diaBoxAtivo]}
                onPress={() => setDiaSel(d.key)}
              >
                <Text style={styles.diaLabel}>{d.label}</Text>
                <Text style={styles.diaNum}>{d.num}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.secaoLabel}>Horário</Text>
          {carregandoHorarios ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator color={cores.destaque} />
            </View>
          ) : (
            <View style={styles.gradeHorarios}>
              {horariosVisiveis.length === 0 && (
                <Text style={styles.semHorarios}>Não há mais horários disponíveis hoje.</Text>
              )}
              {horariosVisiveis.map((h) => {
                const ocupado = indisponiveis.has(h);
                return (
                  <TouchableOpacity
                    key={h}
                    disabled={ocupado}
                    style={[styles.horaBox, horaSel === h && styles.horaBoxAtivo, ocupado && styles.horaBoxOcupado]}
                    onPress={() => setHoraSel(h)}
                  >
                    <Text style={[styles.horaTexto, horaSel === h && { color: cores.destaque }, ocupado && styles.horaTextoOcupado]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.secaoLabel}>Seus dados</Text>
          <View style={styles.campoTexto}>
            <User size={15} color={cores.textoFraco} />
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={cores.textoFraco}
              value={nomeCliente}
              onChangeText={setNomeCliente}
            />
          </View>
          <View style={styles.campoTexto}>
            <Text style={{ color: cores.textoFraco, fontSize: 15 }}>#</Text>
            <TextInput
              style={styles.input}
              placeholder="Telefone (opcional)"
              placeholderTextColor={cores.textoFraco}
              value={telefoneCliente}
              onChangeText={setTelefoneCliente}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.resumo}>
            <Text style={styles.secaoLabel}>Resumo</Text>
            <LinhaResumo label="Serviço" valor={servicoSel?.nome} />
            <LinhaResumo label="Barbeiro" valor={barbeiroSel?.nome} />
            <LinhaResumo label="Dia" valor={`${dias.find((d) => d.key === diaSel)?.label} ${dias.find((d) => d.key === diaSel)?.num}`} />
            <LinhaResumo label="Horário" valor={horaSel || "—"} />
            <LinhaResumo label="Total" valor={servicoSel ? `R$${servicoSel.preco}` : "—"} destaque />
          </View>

          <TouchableOpacity disabled={!horaSel || !nomeCliente.trim() || salvando} activeOpacity={0.85} onPress={confirmar}>
            <LinearGradient
              colors={horaSel && nomeCliente.trim() ? gradienteDestaque : [cores.borda, cores.borda]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.botaoPrincipal}
            >
              {salvando ? (
                <ActivityIndicator color={cores.fundo} />
              ) : (
                <>
                  <Check size={18} color={horaSel && nomeCliente.trim() ? cores.fundo : cores.textoFraco} />
                  <Text style={[styles.botaoPrincipalTexto, { color: horaSel && nomeCliente.trim() ? cores.fundo : cores.textoFraco }]}>
                    Confirmar agendamento
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </ScreenBackground>
  );
}

function LinhaResumo({ label, valor, destaque }) {
  return (
    <View style={styles.linhaResumo}>
      <Text style={styles.resumoLabel}>{label}</Text>
      <Text style={[styles.resumoValor, destaque && { color: cores.destaque, fontWeight: "700" }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 20 },
  loading: { flex: 1, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  tituloPasso: { color: cores.texto, fontSize: 19, fontWeight: "700" },
  opcao: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 16, padding: 14, marginBottom: 8,
  },
  opcaoAtiva: { borderColor: cores.destaque, backgroundColor: "rgba(255,255,255,0.08)" },
  opcaoTitulo: { color: cores.texto, fontSize: 14, fontWeight: "600" },
  opcaoSub: { color: cores.textoMuted, fontSize: 12, marginTop: 3 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: cores.borda, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: cores.destaque, fontWeight: "700", fontSize: 13 },
  notaTexto: { color: cores.destaque, fontSize: 11 },
  secaoLabel: { color: cores.textoMuted, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 },
  campoTexto: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: cores.superficie,
    borderColor: cores.borda, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginBottom: 10,
  },
  input: { flex: 1, color: cores.texto, fontSize: 14, paddingVertical: 13 },
  diaBox: {
    width: 54, alignItems: "center", paddingVertical: 12, marginRight: 8,
    borderRadius: 14, borderColor: cores.borda, borderWidth: 1, backgroundColor: cores.superficie,
  },
  diaBoxAtivo: { borderColor: cores.destaque, backgroundColor: "rgba(255,255,255,0.08)" },
  diaLabel: { color: cores.textoMuted, fontSize: 10 },
  diaNum: { color: cores.texto, fontSize: 15, fontWeight: "700", marginTop: 3 },
  gradeHorarios: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  horaBox: {
    width: "30%", alignItems: "center", paddingVertical: 12, borderRadius: 12,
    borderColor: cores.borda, borderWidth: 1, backgroundColor: cores.superficie,
  },
  horaBoxAtivo: { borderColor: cores.destaque, backgroundColor: "rgba(255,255,255,0.08)" },
  horaBoxOcupado: { opacity: 0.35 },
  horaTexto: { color: cores.texto, fontSize: 13 },
  horaTextoOcupado: { textDecorationLine: "line-through" },
  semHorarios: { color: cores.textoMuted, fontSize: 13, paddingVertical: 10 },
  resumo: { backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16 },
  linhaResumo: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  resumoLabel: { color: cores.textoMuted, fontSize: 12 },
  resumoValor: { color: cores.texto, fontSize: 12 },
  botaoPrincipal: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 16, paddingVertical: 15, gap: 8 },
  botaoPrincipalTexto: { fontWeight: "700", fontSize: 15 },
  checkCirculo: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  confTitulo: { color: cores.texto, fontSize: 20, fontWeight: "700" },
  confTexto: { color: cores.textoMuted, fontSize: 13, textAlign: "center", marginTop: 8, maxWidth: 260 },
  botaoSecundario: { marginTop: 30, width: "100%", borderRadius: 16, paddingVertical: 15, borderColor: cores.borda, borderWidth: 1, alignItems: "center" },
  botaoSecundarioTexto: { color: cores.texto, fontWeight: "600", fontSize: 14 },
});
