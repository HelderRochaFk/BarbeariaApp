import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cores, gradienteFade } from "../theme";

/* Barra em degradê inspirada no corte "fade" (pele -> cabelo),
   usada como indicador de progresso e divisor visual no app. */
export default function FadeBar({ progress = 1 }) {
  return (
    <View style={styles.trilha}>
      <LinearGradient
        colors={gradienteFade}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.preenchido, { width: `${progress * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  trilha: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: cores.borda,
    overflow: "hidden",
  },
  preenchido: {
    height: "100%",
    borderRadius: 999,
  },
});
