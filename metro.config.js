// Corrige um problema conhecido entre o Expo SDK 53+ e o SDK do Firebase:
// o Metro tenta resolver os módulos do Firebase pelo campo "exports" do
// package.json, o que quebra o registro do módulo de autenticação
// ("Component auth has not been registered yet"). Desativando essa
// resolução, o Metro volta a usar os arquivos .cjs corretos do Firebase.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;

module.exports = config;