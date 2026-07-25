export const SERVICOS_SEED = [
  { id: "corte", nome: "Corte clássico", desc: "Tesoura e máquina, acabamento na navalha", duracao: 40, preco: 45 },
  { id: "barba", nome: "Barba", desc: "Modelagem completa com toalha quente", duracao: 25, preco: 30 },
  { id: "combo", nome: "Corte + Barba", desc: "O clássico completo", duracao: 60, preco: 65 },
  { id: "sobrancelha", nome: "Sobrancelha", desc: "Alinhamento na navalha", duracao: 15, preco: 15 },
  { id: "infantil", nome: "Corte infantil", desc: "Até 12 anos", duracao: 30, preco: 35 },
];

export const BARBEIROS_SEED = [
  { id: "maciel", nome: "Maciel", especialidade: "Barbeiro", nota: 5.0, iniciais: "M" },
];

/* Dias da semana em que a barbearia funciona.
   0 = Domingo, 1 = Segunda, 2 = Terça ... 6 = Sábado.
   Hoje: fechado às segundas-feiras. */
export const DIAS_FUNCIONAMENTO = [0, 2, 3, 4, 5, 6];

/* Horário de funcionamento e intervalo entre horários disponíveis.
   Para mudar, basta editar esses três valores. */
export const HORA_ABERTURA = 8; // 08:00
export const HORA_FECHAMENTO = 21; // 21:00 (o último horário marcável é 1h antes disso)
export const INTERVALO_MINUTOS = 60;

function gerarHorariosPadrao() {
  const lista = [];
  for (let h = HORA_ABERTURA; h < HORA_FECHAMENTO; h += INTERVALO_MINUTOS / 60) {
    const hora = Math.floor(h);
    const minuto = Math.round((h - hora) * 60);
    lista.push(`${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`);
  }
  return lista;
}

export const HORARIOS_PADRAO = gerarHorariosPadrao();
