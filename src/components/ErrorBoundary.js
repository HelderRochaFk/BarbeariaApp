import React from "react";
import { View, Text, ScrollView } from "react-native";
import { cores } from "../theme";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.log("Erro capturado pelo ErrorBoundary:", erro, info?.componentStack);
  }

  render() {
    if (this.state.erro) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: cores.fundo }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
          <Text style={{ color: cores.perigo, fontSize: 15, fontWeight: "700", marginBottom: 10 }}>
            Algo quebrou nessa tela
          </Text>
          <Text style={{ color: cores.textoMuted, fontSize: 12, marginBottom: 16 }}>
            {String(this.state.erro?.message || this.state.erro)}
          </Text>
          <Text style={{ color: cores.textoFraco, fontSize: 10 }}>
            {String(this.state.erro?.stack || "")}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
