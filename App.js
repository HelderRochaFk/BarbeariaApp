import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StatusBar, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Calendar, Scissors, User } from "lucide-react-native";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

import { auth } from "./src/firebaseConfig";
import { seedIfEmpty } from "./src/services/firestore";
import { cores } from "./src/theme";
import { AppUIProvider } from "./src/context/AppUIContext";
import ErrorBoundary from "./src/components/ErrorBoundary";

import HomeScreen from "./src/screens/HomeScreen";
import BookScreen from "./src/screens/BookScreen";
import ServicesScreen from "./src/screens/ServicesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import BarberLoginScreen from "./src/screens/BarberLoginScreen";
import BarberDashboardScreen from "./src/screens/BarberDashboardScreen";

const Tab = createBottomTabNavigator();

function AppInner() {
  const [usuario, setUsuario] = useState(null);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState(null);
  // Controla, dentro do modo cliente, se a tela de login do barbeiro
  // está aberta por cima das abas normais.
  const [telaCliente, setTelaCliente] = useState("app"); // "app" | "loginBarbeiro"

  useEffect(() => {
    // Login anônimo automático para o CLIENTE: dá a cada aparelho um
    // "clienteId" estável no Firebase, sem precisar de cadastro. Quando o
    // barbeiro faz login com e-mail/senha (na tela de login), o Firebase
    // troca a sessão automaticamente e este mesmo listener detecta isso.
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          await signInAnonymously(auth);
          return;
        }
        setUsuario(user);
        if (user.isAnonymous) {
          await seedIfEmpty();
        }
        setPronto(true);
      } catch (e) {
        console.log("Erro ao iniciar o app:", e);
        setErro(e.message || String(e));
      }
    });
    return unsub;
  }, []);

  if (erro) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: cores.perigo, fontSize: 14, fontWeight: "700", marginBottom: 10, textAlign: "center" }}>
          Não foi possível conectar ao Firebase
        </Text>
        <Text style={{ color: cores.textoMuted, fontSize: 12, textAlign: "center" }}>{erro}</Text>
      </View>
    );
  }

  if (!pronto || !usuario) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={cores.destaque} size="large" />
      </View>
    );
  }

  // MODO BARBEIRO: usuário logado com e-mail/senha (não anônimo)
  if (!usuario.isAnonymous) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo }}>
        <StatusBar barStyle="light-content" backgroundColor={cores.fundo} />
        <BarberDashboardScreen />
      </View>
    );
  }

  // MODO CLIENTE, mas com a tela de login do barbeiro aberta por cima
  if (telaCliente === "loginBarbeiro") {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo }}>
        <StatusBar barStyle="light-content" backgroundColor={cores.fundo} />
        <BarberLoginScreen onVoltar={() => setTelaCliente("app")} />
      </View>
    );
  }

  // MODO CLIENTE: navegação normal por abas
  return (
    <AppUIProvider value={{ abrirLoginBarbeiro: () => setTelaCliente("loginBarbeiro") }}>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={cores.fundo} />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: { backgroundColor: cores.fundo, borderTopColor: cores.borda, height: 84, paddingTop: 8 },
            tabBarActiveTintColor: cores.destaque,
            tabBarInactiveTintColor: cores.textoFraco,
            tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
            tabBarIcon: ({ color, size }) => {
              const icones = { "Início": Home, "Agendar": Calendar, "Serviços": Scissors, "Perfil": User };
              const Icone = icones[route.name];
              return <Icone color={color} size={size ?? 20} />;
            },
          })}
        >
          <Tab.Screen name="Início" component={HomeScreen} />
          <Tab.Screen name="Agendar" component={BookScreen} initialParams={{ servico: null }} />
          <Tab.Screen name="Serviços" component={ServicesScreen} />
          <Tab.Screen name="Perfil" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppUIProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
