import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Clock } from "lucide-react-native";
import { cores } from "../theme";
import { getServicos } from "../services/firestore";
import ScreenBackground from "../components/ScreenBackground";

const fundoServicos = require("../../assets/fundo-servicos.jpg");

export default function ServicesScreen({ navigation }) {
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getServicos().then((s) => { setServicos(s); setCarregando(false); });
  }, []);

  if (carregando) {
    return (
      <ScreenBackground source={fundoServicos}>
        <View style={styles.loading}>
          <ActivityIndicator color={cores.destaque} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground source={fundoServicos}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.titulo}>Serviços</Text>
        <Text style={styles.subtitulo}>Toque em um serviço para agendar</Text>

        {servicos.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Agendar", { servico: s })}
          >
            <View style={styles.linhaTopo}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.nome}>{s.nome}</Text>
                <Text style={styles.desc}>{s.desc}</Text>
              </View>
              <Text style={styles.preco}>R${s.preco}</Text>
            </View>
            <View style={styles.duracaoLinha}>
              <Clock size={12} color={cores.textoFraco} />
              <Text style={styles.duracaoTexto}>{s.duracao} min</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 20 },
  loading: { flex: 1, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  titulo: { color: cores.texto, fontSize: 22, fontWeight: "700", marginTop: 12 },
  subtitulo: { color: cores.textoMuted, fontSize: 12, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 18, padding: 16, marginBottom: 12,
  },
  linhaTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nome: { color: cores.texto, fontSize: 15, fontWeight: "700" },
  desc: { color: cores.textoMuted, fontSize: 12, marginTop: 5, lineHeight: 17 },
  preco: { color: cores.destaque, fontSize: 15, fontWeight: "700" },
  duracaoLinha: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12 },
  duracaoTexto: { color: cores.textoFraco, fontSize: 12 },
});
