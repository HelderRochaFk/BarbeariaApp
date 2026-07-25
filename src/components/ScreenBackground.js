import React from "react";
import { ImageBackground, View, StyleSheet } from "react-native";

/* Fundo com uma foto + uma camada escura translúcida por cima, pra
   manter o texto e os cards legíveis. Cada tela passa sua própria
   imagem através da prop "source" — assim cada uma pode ter uma foto
   diferente, em vez de todas usarem a mesma.

   Exemplo de uso:
     const minhaFoto = require("../../assets/minha-foto.jpg");
     <ScreenBackground source={minhaFoto}>...</ScreenBackground>

   overlayOpacity vai de 0 (foto totalmente visível, texto pode ficar
   difícil de ler) a 1 (praticamente preto sólido, foto quase some).
   0.8 é um bom ponto de partida — dá pra ajustar esse número livremente,
   tela por tela, se quiser. */
export default function ScreenBackground({ children, source, overlayOpacity = 0.8 }) {
  return (
    <ImageBackground source={source} style={styles.fundo} resizeMode="cover">
      <View style={[styles.overlay, { backgroundColor: `rgba(10,10,10,${overlayOpacity})` }]}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1 },
  overlay: { flex: 1 },
});
