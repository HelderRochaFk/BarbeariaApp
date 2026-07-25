# 💈 Aplicativo Barbearia Maciel

Aplicativo mobile completo desenvolvido para a **Barbearia Maciel**, permitindo que clientes façam agendamentos em tempo real, escolham profissionais e serviços, e visualizem seu histórico de atendimentos.

---

## 📱 Telas e Funcionalidades

- 🔐 **Autenticação & Perfil:**
  - Login e Cadastro de clientes via Firebase Auth.
  - Gerenciamento de perfil e histórico de agendamentos.

- 📅 **Sistema de Agendamentos (BookScreen):**
  - Seleção dinâmica de datas e horários disponíveis.
  - Escolha de barbeiros e serviços específicos.

- 💈 **Catálogo de Serviços & Preços:**
  - Exibição de cortes, barba, tratamentos e combos com valores atualizados.

- 👑 **Área Administrativa / Mensalistas:**
  - Dashboard para controle de barbeiros e clientes mensalistas.

---

## 🚀 Tecnologias e Bibliotecas

- **Core:** React Native (Expo SDK)
- **Linguagem:** JavaScript (ES6+)
- **Backend as a Service:** Firebase (Authentication & Firestore Database)
- **Navegação:** React Navigation (Stack / Tabs)
- **Armazenamento Local:** `@react-native-async-storage/async-storage`

---

## 📁 Estrutura do Projeto

```text
barbearia-maciel-app-ofc1/
├── assets/             # Imagens, ícones e mídias do app
├── src/
│   ├── components/     # Componentes reutilizáveis de UI
│   ├── context/        # React Context para gerenciamento de estado global
│   ├── data/           # Mock data e listas auxiliares
│   ├── screens/        # Telas da aplicação (HomeScreen, BookScreen, ProfileScreen, etc.)
│   ├── services/       # Configuração do Firebase, Firestore e Notificações
│   └── theme.js        # Cores, fontes e estilos globais
├── App.js              # Ponto de entrada do aplicativo e rotas
├── firebaseConfig.js   # Credenciais e inicialização do Firebase
└── package.json