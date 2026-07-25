import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ChevronLeft, Lock, Mail, Scissors } from "lucide-react-native";
import { cores, gradienteDestaque } from "../theme";
import { auth } from "../firebaseConfig";

export default function BarberLoginScreen({ onVoltar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  const entrar = async () => {
    if (!email.trim() || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setErro(null);
    setCarregando(true);
    try {
      // Ao logar com e-mail/senha aqui, o Firebase troca automaticamente
      // a sessão anônima do cliente por essa sessão do barbeiro. O App.js
      // detecta essa troca e mostra o Painel do Barbeiro sozinho.
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (e) {
      console.log("Erro no login do barbeiro:", e);
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltar}>
          <ChevronLeft size={22} color={cores.textoMuted} />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.iconeWrap}>
          <Scissors size={26} color={cores.destaque} />
        </View>
        <Text style={styles.titulo}>Área do barbeiro</Text>
        <Text style={styles.subtitulo}>Entre para ver os agendamentos do dia</Text>

        <View style={styles.campo}>
          <Mail size={16} color={cores.textoFraco} />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={cores.textoFraco}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.campo}>
          <Lock size={16} color={cores.textoFraco} />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={cores.textoFraco}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />
        </View>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <TouchableOpacity activeOpacity={0.85} onPress={entrar} disabled={carregando}>
          <LinearGradient colors={gradienteDestaque} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.botao}>
            {carregando ? (
              <ActivityIndicator color={cores.fundo} />
            ) : (
              <Text style={styles.botaoTexto}>Entrar</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  voltar: { position: "absolute", top: 56, left: 20, flexDirection: "row", alignItems: "center", gap: 4 },
  voltarTexto: { color: cores.textoMuted, fontSize: 13 },
  iconeWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: cores.superficie,
    borderColor: cores.borda, borderWidth: 1, alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 16,
  },
  titulo: { color: cores.texto, fontSize: 20, fontWeight: "700", textAlign: "center" },
  subtitulo: { color: cores.textoMuted, fontSize: 12, textAlign: "center", marginTop: 6, marginBottom: 28 },
  campo: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: cores.superficie,
    borderColor: cores.borda, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12,
  },
  input: { flex: 1, color: cores.texto, fontSize: 14, paddingVertical: 14 },
  erro: { color: cores.perigo, fontSize: 12, textAlign: "center", marginBottom: 10 },
  botao: { borderRadius: 16, paddingVertical: 15, alignItems: "center", justifyContent: "center", marginTop: 8 },
  botaoTexto: { color: cores.fundo, fontWeight: "700", fontSize: 15 },
});
