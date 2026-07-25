import React, { createContext, useContext } from "react";

/* Contexto leve que permite qualquer tela do app do cliente (ex: Perfil)
   pedir para o App.js trocar de tela e mostrar o login do barbeiro,
   sem precisar adicionar mais uma biblioteca de navegação ao projeto. */
const AppUIContext = createContext({
  abrirLoginBarbeiro: () => {},
});

export function AppUIProvider({ value, children }) {
  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>;
}

export function useAppUI() {
  return useContext(AppUIContext);
}
