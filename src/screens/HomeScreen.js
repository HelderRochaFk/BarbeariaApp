import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar, CalendarCheck, Star } from "lucide-react-native";
import { cores, gradienteDestaque } from "../theme";
import FadeBar from "../components/FadeBar";
import { getServicos, getBarbeiros, getProximoAgendamento } from "../services/firestore";
import { auth } from "../firebaseConfig";
import ScreenBackground from "../components/ScreenBackground";

const bannerMaciel = require("../../assets/banner-maciel.mp4");
const fundoInicio = require("../../assets/fundo-inicio.jpg");

export default function HomeScreen({ navigation }) {
  const player = useVideoPlayer(bannerMaciel, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [proximo, setProximo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const uid = auth.currentUser?.uid;
      const [s, b, p] = await Promise.all([
        getServicos(),
        getBarbeiros(),
        uid ? getProximoAgendamento(uid) : Promise.resolve(null),
      ]);
      setServicos(s);
      setBarbeiros(b);
      setProximo(p);
    } catch (e) {
      console.log("Erro ao carregar Início:", e);
      setErro(e.message || String(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  if (carregando) {
    return (
      <ScreenBackground source={fundoInicio}>
        <View style={styles.loading}>
          <ActivityIndicator color={cores.destaque} />
        </View>
      </ScreenBackground>
    );
  }

  if (erro) {
    return (
      <ScreenBackground source={fundoInicio}>
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
    <ScreenBackground source={fundoInicio}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.logoWrap}>
          <VideoView
            player={player}
            style={styles.banner}
            contentFit="cover"
            nativeControls={false}
            pointerEvents="none"
          />
        </View>
        <View style={{ marginTop: 6, marginBottom: 18 }}>
          <FadeBar progress={1} />
        </View>

        {proximo && (
          <View style={styles.cardProximo}>
            <View style={styles.iconeCircular}>
              <CalendarCheck size={20} color={cores.destaque} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardProximoTitulo} numberOfLines={1}>
                {proximo.servico.nome} com {proximo.barbeiro.nome.split(" ")[0]}
              </Text>
              <Text style={styles.cardProximoData}>
                {proximo.diaLabel} {proximo.diaNum} · {proximo.hora}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate("Agendar", { servico: null })}>
          <LinearGradient colors={gradienteDestaque} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.botaoPrincipal}>
            <Calendar size={18} color={cores.fundo} />
            <Text style={styles.botaoPrincipalTexto}>Agendar horário</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.secao}>Seu barbeiro</Text>
        {barbeiros.map((b) => (
          <View key={b.id} style={styles.cardBarbeiroUnico}>
            <View style={styles.avatarGrande}>
              <Text style={styles.avatarGrandeTexto}>{b.iniciais}</Text>
            </View>
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.barbeiroNomeUnico}>{b.nome}</Text>
              <Text style={styles.barbeiroEsp}>{b.especialidade}</Text>
              <View style={styles.notaLinha}>
                <Star size={11} color={cores.destaque} fill={cores.destaque} />
                <Text style={styles.notaTexto}>{b.nota}</Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.secao}>Serviços populares</Text>
        {servicos.slice(0, 3).map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.itemServico}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Agendar", { servico: s })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemServicoNome} numberOfLines={1}>{s.nome}</Text>
              <Text style={styles.itemServicoDuracao}>{s.duracao} min</Text>
            </View>
            <Text style={styles.itemServicoPreco}>R${s.preco}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 20 },
  loading: { flex: 1, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: cores.textoMuted, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginTop: 12 },
  titulo: { color: cores.texto, fontSize: 34, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  logoWrap: { marginTop: 16, borderRadius: 18, overflow: "hidden", borderColor: cores.borda, borderWidth: 1 },
  banner: { width: "100%", aspectRatio: 1200 / 480, backgroundColor: cores.superficie },
  cardProximo: {
    flexDirection: "row", alignItems: "center", backgroundColor: cores.superficie,
    borderColor: cores.borda, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 18,
  },
  iconeCircular: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  cardProximoTitulo: { color: cores.texto, fontSize: 14, fontWeight: "600" },
  cardProximoData: { color: cores.textoMuted, fontSize: 12, marginTop: 3 },
  botaoPrincipal: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 18, paddingVertical: 16, gap: 8, marginBottom: 10,
  },
  botaoPrincipalTexto: { color: cores.fundo, fontWeight: "700", fontSize: 15 },
  secao: { color: cores.textoMuted, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginTop: 26, marginBottom: 12 },
  cardBarbeiro: {
    width: 124, backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 18, padding: 12, alignItems: "center", marginRight: 10,
  },
  cardBarbeiroUnico: {
    flexDirection: "row", alignItems: "center", backgroundColor: cores.superficie,
    borderColor: cores.borda, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 6,
  },
  avatarGrande: { width: 52, height: 52, borderRadius: 26, backgroundColor: cores.borda, alignItems: "center", justifyContent: "center" },
  avatarGrandeTexto: { color: cores.destaque, fontWeight: "700", fontSize: 16 },
  barbeiroNomeUnico: { color: cores.texto, fontSize: 15, fontWeight: "700" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: cores.borda, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: cores.destaque, fontWeight: "700", fontSize: 13 },
  barbeiroNome: { color: cores.texto, fontSize: 12, fontWeight: "600", marginTop: 8 },
  barbeiroEsp: { color: cores.textoMuted, fontSize: 10, marginTop: 2 },
  notaLinha: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 5 },
  notaTexto: { color: cores.destaque, fontSize: 10 },
  itemServico: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 8,
  },
  itemServicoNome: { color: cores.texto, fontSize: 14, fontWeight: "500" },
  itemServicoDuracao: { color: cores.textoMuted, fontSize: 12, marginTop: 3 },
  itemServicoPreco: { color: cores.destaque, fontSize: 14, fontWeight: "700", marginLeft: 12 },
});
