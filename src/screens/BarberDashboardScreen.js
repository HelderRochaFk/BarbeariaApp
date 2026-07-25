import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Linking } from "react-native";
import { signOut } from "firebase/auth";
import { LogOut, Phone, Clock, X, RefreshCw, Repeat } from "lucide-react-native";
import { cores } from "../theme";
import { auth } from "../firebaseConfig";
import { getTodosAgendamentos, cancelarAgendamento, jaPassou } from "../services/firestore";
import { registrarTokenBarbeiro } from "../services/notifications";
import BarberMensalistasScreen from "./BarberMensalistasScreen";
import ScreenBackground from "../components/ScreenBackground";

const fundoBarbeiro = require("../../assets/fundo-barbeiro.jpg");

export default function BarberDashboardScreen() {
  const [aba, setAba] = useState("agenda"); // "agenda" | "mensalistas"
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState("confirmado"); // "confirmado" | "todos"

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const todos = await getTodosAgendamentos();
      setAgendamentos(todos);
    } catch (e) {
      console.log("Erro ao carregar painel do barbeiro:", e);
      setErro(e.message || String(e));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { registrarTokenBarbeiro(); }, []);

  const atualizar = () => {
    setAtualizando(true);
    carregar();
  };

  const cancelar = async (id) => {
    await cancelarAgendamento(id);
    carregar();
  };

  const ligar = (telefone) => {
    if (telefone) Linking.openURL(`tel:${telefone}`);
  };

  const lista = agendamentos.filter((a) =>
    filtro === "todos" ? true : a.status === "confirmado" && !jaPassou(a.dataISO)
  );

  return (
    <ScreenBackground source={fundoBarbeiro}>
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Painel do</Text>
          <Text style={styles.titulo}>Barbeiro</Text>
        </View>
        <TouchableOpacity style={styles.sairBotao} onPress={() => signOut(auth)}>
          <LogOut size={16} color={cores.textoMuted} />
          <Text style={styles.sairTexto}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.abasNav}>
        <TouchableOpacity
          style={[styles.abaBtn, aba === "agenda" && styles.abaBtnAtiva]}
          onPress={() => setAba("agenda")}
        >
          <Clock size={13} color={aba === "agenda" ? cores.fundo : cores.textoMuted} />
          <Text style={[styles.abaTexto, aba === "agenda" && styles.abaTextoAtiva]}>Agenda</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.abaBtn, aba === "mensalistas" && styles.abaBtnAtiva]}
          onPress={() => setAba("mensalistas")}
        >
          <Repeat size={13} color={aba === "mensalistas" ? cores.fundo : cores.textoMuted} />
          <Text style={[styles.abaTexto, aba === "mensalistas" && styles.abaTextoAtiva]}>Mensalistas</Text>
        </TouchableOpacity>
      </View>

      {aba === "mensalistas" ? (
        <BarberMensalistasScreen />
      ) : (
        <>
          <View style={styles.filtros}>
            <TouchableOpacity
              style={[styles.filtroBtn, filtro === "confirmado" && styles.filtroBtnAtivo]}
              onPress={() => setFiltro("confirmado")}
            >
              <Text style={[styles.filtroTexto, filtro === "confirmado" && styles.filtroTextoAtivo]}>Confirmados</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filtroBtn, filtro === "todos" && styles.filtroBtnAtivo]}
              onPress={() => setFiltro("todos")}
            >
              <Text style={[styles.filtroTexto, filtro === "todos" && styles.filtroTextoAtivo]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.atualizarBtn} onPress={atualizar}>
              <RefreshCw size={15} color={cores.textoMuted} />
            </TouchableOpacity>
          </View>

          {carregando ? (
            <View style={styles.loading}>
              <ActivityIndicator color={cores.destaque} />
            </View>
          ) : erro ? (
            <View style={styles.loading}>
              <Text style={{ color: cores.perigo, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>{erro}</Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              refreshControl={<RefreshControl refreshing={atualizando} onRefresh={atualizar} tintColor={cores.destaque} />}
            >
              {lista.length === 0 && (
                <Text style={styles.vazio}>Nenhum agendamento por aqui.</Text>
              )}
              {lista.map((a) => {
                const concluidoPeloTempo = a.status === "confirmado" && jaPassou(a.dataISO);
                return (
                <View key={a.id} style={styles.card}>
                  <View style={styles.cardTopo}>
                    <View style={styles.horarioBox}>
                      <Clock size={12} color={cores.destaque} />
                      <Text style={styles.horarioTexto}>{a.hora}</Text>
                    </View>
                    <Text style={styles.diaTexto}>{a.diaLabel} {a.diaNum}</Text>
                    {(a.status !== "confirmado" || concluidoPeloTempo) && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusTexto}>{a.status === "cancelado" ? "Cancelado" : "Concluído"}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.clienteNome}>{a.clienteNome || "Cliente sem nome informado"}</Text>
                  <Text style={styles.servicoNome}>{a.servico?.nome} · R${a.servico?.preco}</Text>

                  <View style={styles.cardRodape}>
                    {a.clienteTelefone ? (
                      <TouchableOpacity style={styles.ligarBtn} onPress={() => ligar(a.clienteTelefone)}>
                        <Phone size={13} color={cores.texto} />
                        <Text style={styles.ligarTexto}>{a.clienteTelefone}</Text>
                      </TouchableOpacity>
                    ) : <View />}

                    {a.status === "confirmado" && !concluidoPeloTempo && (
                      <TouchableOpacity style={styles.cancelarBtn} onPress={() => cancelar(a.id)}>
                        <X size={13} color={cores.perigo} />
                        <Text style={styles.cancelarTexto}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                );
              })}
            </ScrollView>
          )}
        </>
      )}
    </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent", paddingTop: 56 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, marginBottom: 16 },
  eyebrow: { color: cores.textoMuted, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" },
  titulo: { color: cores.texto, fontSize: 26, fontWeight: "700" },
  sairBotao: {
    flexDirection: "row", alignItems: "center", gap: 5, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 4,
  },
  sairTexto: { color: cores.textoMuted, fontSize: 12 },
  abasNav: {
    flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 14,
    borderBottomColor: cores.borda, borderBottomWidth: 1, paddingBottom: 14,
  },
  abaBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  abaBtnAtiva: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  abaTexto: { color: cores.textoMuted, fontSize: 12, fontWeight: "600" },
  abaTextoAtiva: { color: cores.fundo },
  filtros: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  filtroBtn: { borderColor: cores.borda, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  filtroBtnAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  filtroTexto: { color: cores.textoMuted, fontSize: 12, fontWeight: "600" },
  filtroTextoAtivo: { color: cores.fundo },
  atualizarBtn: {
    marginLeft: "auto", width: 30, height: 30, borderRadius: 15, borderColor: cores.borda, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  vazio: { color: cores.textoMuted, fontSize: 13, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 18, padding: 16, marginBottom: 10,
  },
  cardTopo: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  horarioBox: {
    flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: cores.borda,
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4,
  },
  horarioTexto: { color: cores.texto, fontSize: 12, fontWeight: "700" },
  diaTexto: { color: cores.textoMuted, fontSize: 12 },
  statusBadge: { marginLeft: "auto", borderColor: cores.perigoBg, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusTexto: { color: cores.perigo, fontSize: 10 },
  clienteNome: { color: cores.texto, fontSize: 16, fontWeight: "700" },
  servicoNome: { color: cores.textoMuted, fontSize: 12, marginTop: 3 },
  cardRodape: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  ligarBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: cores.borda, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  ligarTexto: { color: cores.texto, fontSize: 12, fontWeight: "600" },
  cancelarBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderColor: cores.perigoBg, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  cancelarTexto: { color: cores.perigo, fontSize: 12, fontWeight: "600" },
});
