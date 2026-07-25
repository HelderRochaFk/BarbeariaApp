import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus, X, User, Repeat } from "lucide-react-native";
import { cores, gradienteDestaque } from "../theme";
import { getMensalistas, criarMensalista, removerMensalista } from "../services/firestore";
import { HORARIOS_PADRAO } from "../data/seed";

const NOMES_DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const NOMES_DIAS_LONGO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function BarberMensalistasScreen() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [diaSemana, setDiaSemana] = useState(2); // terça como padrão (barbearia fecha segunda)
  const [hora, setHora] = useState(HORARIOS_PADRAO[0]);

  const carregar = useCallback(async () => {
    try {
      const dados = await getMensalistas();
      setLista(dados);
    } catch (e) {
      console.log("Erro ao carregar mensalistas:", e);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      await criarMensalista({ nome: nome.trim(), telefone: telefone.trim(), diaSemana, hora });
      setNome("");
      setTelefone("");
      setMostrarForm(false);
      carregar();
    } catch (e) {
      console.log("Erro ao salvar mensalista:", e);
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id) => {
    await removerMensalista(id);
    carregar();
  };

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={cores.destaque} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
      <Text style={styles.intro}>
        Cada mensalista tem um dia da semana e horário fixo — esse horário some
        automaticamente da lista de disponíveis pros outros clientes, toda semana.
      </Text>

      {lista.length === 0 && !mostrarForm && (
        <Text style={styles.vazio}>Nenhum mensalista cadastrado ainda.</Text>
      )}

      {lista.map((m) => (
        <View key={m.id} style={styles.card}>
          <View style={styles.iconeWrap}>
            <User size={16} color={cores.destaque} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardNome}>{m.nome}</Text>
            <View style={styles.cardLinha}>
              <Repeat size={11} color={cores.textoMuted} />
              <Text style={styles.cardSub}>
                Toda {NOMES_DIAS_LONGO[m.diaSemana]} às {m.hora}
              </Text>
            </View>
            {!!m.telefone && <Text style={styles.cardTelefone}>{m.telefone}</Text>}
          </View>
          <TouchableOpacity style={styles.removerBtn} onPress={() => remover(m.id)}>
            <X size={14} color={cores.perigo} />
          </TouchableOpacity>
        </View>
      ))}

      {mostrarForm ? (
        <View style={styles.form}>
          <Text style={styles.formLabel}>Nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do cliente"
            placeholderTextColor={cores.textoFraco}
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.formLabel}>Telefone (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Telefone"
            placeholderTextColor={cores.textoFraco}
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <Text style={styles.formLabel}>Dia da semana fixo</Text>
          <View style={styles.chipsLinha}>
            {NOMES_DIAS_CURTO.map((d, i) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, diaSemana === i && styles.chipAtivo]}
                onPress={() => setDiaSemana(i)}
              >
                <Text style={[styles.chipTexto, diaSemana === i && styles.chipTextoAtivo]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Horário fixo</Text>
          <View style={styles.chipsLinha}>
            {HORARIOS_PADRAO.map((h) => (
              <TouchableOpacity
                key={h}
                style={[styles.chip, hora === h && styles.chipAtivo]}
                onPress={() => setHora(h)}
              >
                <Text style={[styles.chipTexto, hora === h && styles.chipTextoAtivo]}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            <TouchableOpacity style={styles.cancelarBtn} onPress={() => setMostrarForm(false)}>
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.85} onPress={salvar} disabled={!nome.trim() || salvando}>
              <LinearGradient
                colors={nome.trim() ? gradienteDestaque : [cores.borda, cores.borda]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.salvarBtn}
              >
                {salvando ? (
                  <ActivityIndicator color={cores.fundo} />
                ) : (
                  <Text style={[styles.salvarTexto, { color: nome.trim() ? cores.fundo : cores.textoFraco }]}>Salvar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addBtn} onPress={() => setMostrarForm(true)}>
          <Plus size={16} color={cores.texto} />
          <Text style={styles.addTexto}>Adicionar mensalista</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  intro: { color: cores.textoMuted, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  vazio: { color: cores.textoMuted, fontSize: 13, textAlign: "center", marginVertical: 20 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: cores.superficie,
    borderColor: cores.borda, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10,
  },
  iconeWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: cores.borda,
    alignItems: "center", justifyContent: "center",
  },
  cardNome: { color: cores.texto, fontSize: 14, fontWeight: "700" },
  cardLinha: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  cardSub: { color: cores.textoMuted, fontSize: 12 },
  cardTelefone: { color: cores.textoFraco, fontSize: 11, marginTop: 2 },
  removerBtn: {
    width: 30, height: 30, borderRadius: 15, borderColor: cores.perigoBg, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderColor: cores.borda, borderWidth: 1, borderRadius: 16, paddingVertical: 14, marginTop: 6,
  },
  addTexto: { color: cores.texto, fontSize: 13, fontWeight: "600" },
  form: {
    backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1,
    borderRadius: 18, padding: 16, marginTop: 6,
  },
  formLabel: { color: cores.textoMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 7, marginTop: 10 },
  input: {
    backgroundColor: cores.fundo, borderColor: cores.borda, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11, color: cores.texto, fontSize: 13,
  },
  chipsLinha: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    borderColor: cores.borda, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11,
    paddingVertical: 8, backgroundColor: cores.fundo,
  },
  chipAtivo: { backgroundColor: cores.destaque, borderColor: cores.destaque },
  chipTexto: { color: cores.textoMuted, fontSize: 12 },
  chipTextoAtivo: { color: cores.fundo, fontWeight: "700" },
  cancelarBtn: {
    borderColor: cores.borda, borderWidth: 1, borderRadius: 14, paddingHorizontal: 18,
    alignItems: "center", justifyContent: "center",
  },
  cancelarTexto: { color: cores.textoMuted, fontSize: 13 },
  salvarBtn: { borderRadius: 14, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  salvarTexto: { fontWeight: "700", fontSize: 13 },
});
