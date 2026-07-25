import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { History, X, Scissors, ChevronRight } from "lucide-react-native";
import { cores } from "../theme";
import { getProximoAgendamento, getHistorico, cancelarAgendamento } from "../services/firestore";
import { auth } from "../firebaseConfig";
import { useAppUI } from "../context/AppUIContext";
import ScreenBackground from "../components/ScreenBackground";

const fundoPerfil = require("../../assets/fundo-perfil.jpg");

export default function ProfileScreen() {
  const { abrirLoginBarbeiro } = useAppUI();
  const [proximo, setProximo] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const [p, h] = await Promise.all([getProximoAgendamento(uid), getHistorico(uid)]);
      setProximo(p);
      setHistorico(h);
    } catch (e) {
      console.log("Erro ao carregar Perfil:", e);
      setErro(e.message || String(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const cancelar = async () => {
    if (!proximo) return;
    await cancelarAgendamento(proximo.id);
    carregar();
  };

  if (carregando) {
    return (
      <ScreenBackground source={fundoPerfil}>
        <View style={styles.loading}>
          <ActivityIndicator color={cores.destaque} />
        </View>
      </ScreenBackground>
    );
  }

  if (erro) {
    return (
      <ScreenBackground source={fundoPerfil}>
        <View style={styles.loading}>
          <Text style={{ color: cores.perigo, fontSize: 13, fontWeight: "700", marginBottom: 8, textAlign: "center", paddingHorizontal: 24 }}>
            Não foi possível carregar os dados
          </Text>
          <Text style={{ color: cores.textoMuted, fontSize: 11, textAlign: "center", paddingHorizontal: 24 }}>{erro}</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground source={fundoPerfil}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.perfilHeader}>
          <View style={styles.avatar}><Text style={styles.avatarTexto}>VC</Text></View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.nome}>Você</Text>
            <Text style={styles.subNome}>Cliente da Barbearia Maciel</Text>
          </View>
        </View>

        <Text style={styles.secao}>Próximo horário</Text>
        {proximo ? (
          <View style={styles.card}>
            <View style={styles.linhaTopo}>
              <Text style={styles.servicoNome}>{proximo.servico.nome}</Text>
              <Text style={styles.preco}>R${proximo.servico.preco}</Text>
            </View>
            <Text style={styles.detalhe}>com {proximo.barbeiro.nome}</Text>
            <Text style={styles.detalheData}>{proximo.diaLabel} {proximo.diaNum} · {proximo.hora}</Text>
            <TouchableOpacity style={styles.botaoCancelar} onPress={cancelar}>
              <X size={13} color={cores.perigo} />
              <Text style={styles.botaoCancelarTexto}>Cancelar agendamento</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { alignItems: "center" }]}>
            <Text style={styles.vazio}>Nenhum horário marcado</Text>
          </View>
        )}

        <View style={styles.secaoHistoricoHeader}>
          <History size={13} color={cores.textoMuted} />
          <Text style={styles.secao}>Histórico</Text>
        </View>
        {historico.length === 0 ? (
          <Text style={styles.vazioPequeno}>Seus agendamentos passados vão aparecer aqui.</Text>
        ) : (
          historico.map((h) => (
            <View key={h.id} style={styles.itemHistorico}>
              <View>
                <Text style={styles.itemHistoricoNome}>{h.servico.nome}</Text>
                <Text style={styles.itemHistoricoSub}>{h.barbeiro.nome} · {h.diaLabel} {h.diaNum}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusTexto}>{h.status === "cancelado" ? "Cancelado" : "Concluído"}</Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.barbeiroLink} onPress={abrirLoginBarbeiro}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Scissors size={16} color={cores.textoMuted} />
            <Text style={styles.barbeiroLinkTexto}>Área do barbeiro</Text>
          </View>
          <ChevronRight size={16} color={cores.textoFraco} />
        </TouchableOpacity>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 20 },
  loading: { flex: 1, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  perfilHeader: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: cores.borda, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: cores.destaque, fontWeight: "700" },
  nome: { color: cores.texto, fontSize: 15, fontWeight: "700" },
  subNome: { color: cores.textoMuted, fontSize: 12, marginTop: 2 },
  secao: { color: cores.textoMuted, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 22, marginBottom: 10 },
  secaoHistoricoHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 22 },
  card: { backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1, borderRadius: 18, padding: 16 },
  linhaTopo: { flexDirection: "row", justifyContent: "space-between" },
  servicoNome: { color: cores.texto, fontSize: 14, fontWeight: "700" },
  preco: { color: cores.destaque, fontSize: 14, fontWeight: "700" },
  detalhe: { color: cores.textoMuted, fontSize: 12, marginTop: 4 },
  detalheData: { color: cores.textoMuted, fontSize: 12, marginTop: 2 },
  botaoCancelar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 14, borderRadius: 12, paddingVertical: 11, borderColor: cores.perigoBg, borderWidth: 1,
  },
  botaoCancelarTexto: { color: cores.perigo, fontSize: 12, fontWeight: "600" },
  vazio: { color: cores.textoMuted, fontSize: 13 },
  vazioPequeno: { color: cores.textoFraco, fontSize: 12 },
  itemHistorico: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 16, padding: 13, marginBottom: 8,
  },
  itemHistoricoNome: { color: cores.texto, fontSize: 13 },
  itemHistoricoSub: { color: cores.textoMuted, fontSize: 11, marginTop: 3 },
  statusBadge: { borderColor: cores.perigoBg, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusTexto: { color: cores.perigo, fontSize: 10 },
  barbeiroLink: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginTop: 26,
  },
  barbeiroLinkTexto: { color: cores.texto, fontSize: 13, fontWeight: "600" },
});
