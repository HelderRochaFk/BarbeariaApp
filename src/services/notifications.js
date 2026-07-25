import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function pedirPermissao() {
  const { status: atual } = await Notifications.getPermissionsAsync();
  let status = atual;
  if (status !== "granted") {
    const resp = await Notifications.requestPermissionsAsync();
    status = resp.status;
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === "granted";
}

/* Agenda um lembrete LOCAL no aparelho do cliente, 1 hora antes do
   horário marcado. Funciona no Expo Go normalmente, sem configuração
   extra — é só uma notificação agendada no próprio celular. */
export async function agendarLembreteCliente({ dataISO, servico }) {
  try {
    const ok = await pedirPermissao();
    if (!ok) return;
    const dataHorario = new Date(dataISO);
    const dataLembrete = new Date(dataHorario.getTime() - 60 * 60 * 1000);
    if (dataLembrete.getTime() <= Date.now()) return; // não agenda lembrete no passado
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Seu horário é daqui a 1 hora",
        body: `${servico?.nome || "Seu atendimento"} na Barbearia Maciel`,
      },
      trigger: dataLembrete,
    });
  } catch (e) {
    console.log("Não foi possível agendar o lembrete do cliente:", e);
  }
}

/* Chamado quando o BARBEIRO abre o painel: pega o token de notificação
   push desse aparelho e salva no Firestore, para o app do cliente
   conseguir avisar o barbeiro quando um novo horário for marcado.
   IMPORTANTE: notificação push remota só funciona numa build de
   desenvolvimento/produção feita com EAS — não funciona dentro do Expo
   Go. Veja o README, seção de notificações, para configurar isso. */
export async function registrarTokenBarbeiro() {
  try {
    const ok = await pedirPermissao();
    if (!ok) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log(
        "Nenhum projectId do EAS configurado ainda — a notificação push do " +
        "barbeiro não vai funcionar até isso ser configurado (veja o README)."
      );
      return;
    }
    const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
    await setDoc(doc(db, "config", "barbeiroPush"), { token: tokenResp.data });
  } catch (e) {
    console.log("Não foi possível registrar o token de notificação do barbeiro:", e);
  }
}

/* Chamado pelo app do CLIENTE logo depois de criar um agendamento: busca
   o token salvo do barbeiro e manda uma notificação push diretamente
   pela API pública do Expo — não precisa de servidor próprio. */
export async function notificarBarbeiroNovoAgendamento({ clienteNome, servico, diaLabel, diaNum, hora }) {
  try {
    const snap = await getDoc(doc(db, "config", "barbeiroPush"));
    if (!snap.exists()) return;
    const token = snap.data().token;
    if (!token) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: token,
        title: "Novo agendamento",
        body: `${clienteNome || "Um cliente"} marcou ${servico?.nome} · ${diaLabel} ${diaNum} às ${hora}`,
        sound: "default",
      }),
    });
  } catch (e) {
    console.log("Não foi possível notificar o barbeiro:", e);
  }
}
