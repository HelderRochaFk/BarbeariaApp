import {
  collection, getDocs, addDoc, doc, updateDoc, getDoc, setDoc, deleteDoc,
  query, where, writeBatch, Timestamp, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { SERVICOS_SEED, BARBEIROS_SEED } from "../data/seed";

/* Popula o Firestore com serviços e barbeiros na primeira execução.
   Chamado automaticamente no início do app (ver App.js). Não faz nada
   se as coleções já tiverem dados, então é seguro rodar sempre. */
export async function seedIfEmpty() {
  const servicosSnap = await getDocs(collection(db, "servicos"));
  if (servicosSnap.empty) {
    const batch = writeBatch(db);
    SERVICOS_SEED.forEach((s) => batch.set(doc(db, "servicos", s.id), s));
    BARBEIROS_SEED.forEach((b) => batch.set(doc(db, "barbeiros", b.id), b));
    await batch.commit();
  }
}

export async function getServicos() {
  const snap = await getDocs(collection(db, "servicos"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBarbeiros() {
  const snap = await getDocs(collection(db, "barbeiros"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* Cria um novo agendamento vinculado ao clienteId (uid do Firebase Auth).
   Guarda também o nome/telefone informados pelo cliente, para o barbeiro
   saber quem está marcando o horário. Também marca esse horário como
   ocupado na coleção "disponibilidade" (um documento por dia, guardando
   só a lista de horas ocupadas — sem dados pessoais), para que outros
   clientes deixem de ver esse horário como disponível. */
export async function criarAgendamento(clienteId, {
  servico, barbeiro, dataISO, diaLabel, diaNum, hora, clienteNome, clienteTelefone,
}) {
  const diaKey = dataISO.slice(0, 10);
  const ref = await addDoc(collection(db, "agendamentos"), {
    clienteId,
    clienteNome: clienteNome || "",
    clienteTelefone: clienteTelefone || "",
    servico,
    barbeiro,
    dataISO,
    diaLabel,
    diaNum,
    hora,
    status: "confirmado",
    criadoEm: Timestamp.now(),
  });
  await setDoc(doc(db, "disponibilidade", diaKey), { ocupados: arrayUnion(hora) }, { merge: true });
  return ref.id;
}

/* Busca todos os agendamentos do cliente (uma única consulta simples,
   sem precisar de índice composto no Firestore) e filtra/ordena no
   próprio app. */
async function getAgendamentosDoCliente(clienteId) {
  const q = query(collection(db, "agendamentos"), where("clienteId", "==", clienteId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function jaPassou(dataISO) {
  return new Date(dataISO).getTime() <= Date.now();
}

/* Próximo agendamento (status confirmado E ainda não passou) do
   cliente, mais próximo primeiro. Um agendamento confirmado de um dia
   que já passou nunca mais aparece aqui — some da tela de Início/Perfil
   automaticamente, mesmo que ninguém tenha marcado como concluído. */
export async function getProximoAgendamento(clienteId) {
  const todos = await getAgendamentosDoCliente(clienteId);
  const confirmados = todos
    .filter((a) => a.status === "confirmado" && !jaPassou(a.dataISO))
    .sort((a, b) => (a.dataISO > b.dataISO ? 1 : -1));
  return confirmados[0] || null;
}

/* Histórico do cliente: cancelados, concluídos, e também qualquer
   agendamento "confirmado" cuja data já passou (mesmo que ninguém tenha
   marcado como concluído manualmente — ele aparece aqui, não mais em
   "próximo horário"). */
export async function getHistorico(clienteId) {
  const todos = await getAgendamentosDoCliente(clienteId);
  return todos
    .filter((a) => a.status !== "confirmado" || jaPassou(a.dataISO))
    .sort((a, b) => (a.dataISO < b.dataISO ? 1 : -1));
}

export async function cancelarAgendamento(agendamentoId) {
  const ref = doc(db, "agendamentos", agendamentoId);
  const snap = await getDoc(ref);
  await updateDoc(ref, { status: "cancelado" });
  if (snap.exists()) {
    const { dataISO, hora } = snap.data();
    if (dataISO && hora) {
      const diaKey = dataISO.slice(0, 10);
      await setDoc(doc(db, "disponibilidade", diaKey), { ocupados: arrayRemove(hora) }, { merge: true });
    }
  }
}

/* Horários já ocupados (por agendamentos confirmados) num dia específico.
   Usado pela tela de Agendar para não mostrar como disponível um horário
   que outro cliente já pegou. */
export async function getHorariosOcupados(diaKey) {
  const snap = await getDoc(doc(db, "disponibilidade", diaKey));
  return snap.exists() ? (snap.data().ocupados || []) : [];
}

/* Usado pelo Painel do Barbeiro: todos os agendamentos de todos os
   clientes, mais próximo primeiro. */
export async function getTodosAgendamentos() {
  const snap = await getDocs(collection(db, "agendamentos"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.dataISO > b.dataISO ? 1 : -1));
}

export async function concluirAgendamento(agendamentoId) {
  await updateDoc(doc(db, "agendamentos", agendamentoId), { status: "concluido" });
}

/* --------------------------------------------------------------
   MENSALISTAS: clientes com dia da semana + horário fixo reservado.
   Gerenciados pelo barbeiro no painel; o app do cliente usa essa lista
   só para saber quais horários não oferecer.
-------------------------------------------------------------- */

/* diaSemana: 0 (domingo) a 6 (sábado), igual ao Date.getDay() do JS */
export async function getMensalistas() {
  const snap = await getDocs(collection(db, "mensalistas"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.diaSemana - b.diaSemana || (a.hora > b.hora ? 1 : -1));
}

export async function criarMensalista({ nome, telefone, diaSemana, hora }) {
  const ref = await addDoc(collection(db, "mensalistas"), {
    nome: nome || "",
    telefone: telefone || "",
    diaSemana,
    hora,
    criadoEm: Timestamp.now(),
  });
  return ref.id;
}

export async function removerMensalista(id) {
  await deleteDoc(doc(db, "mensalistas", id));
}
