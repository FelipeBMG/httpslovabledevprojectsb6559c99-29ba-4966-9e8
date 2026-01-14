/**
 * Feature Flags do Sistema
 * 
 * Este arquivo controla quais módulos estão ativos no sistema.
 * A emissão de documentos fiscais para clientes finais é de responsabilidade 
 * do pet shop e não faz parte deste plano no momento.
 * 
 * Preparado para futura ativação como módulo premium.
 */

export const featureFlags = {
  // Módulo Fiscal - DESATIVADO
  // Inclui: NF-e, NFS-e, certificado digital, configurações fiscais
  // Nota: A emissão de documentos fiscais para clientes finais é de 
  // responsabilidade do pet shop e não faz parte deste plano no momento.
  FISCAL_MODULE_ENABLED: false,
  
  // Módulo de Notas Fiscais - DESATIVADO
  NOTAS_FISCAIS_ENABLED: false,
  
  // Módulo de Configuração Fiscal - DESATIVADO
  CONFIG_FISCAL_ENABLED: false,
  
  // Exigir CPF/CNPJ do cliente - DESATIVADO
  // Mantém apenas dados essenciais: Nome, WhatsApp, Observações
  REQUIRE_CLIENT_DOCUMENT: false,
  
  // Emissão automática de NF ao finalizar venda - DESATIVADO
  AUTO_EMIT_NF_ON_SALE: false,
  
  // Integração com API fiscal (Focus NFe) - DESATIVADO
  FISCAL_API_INTEGRATION: false,
  
  // === MÓDULOS ATIVOS ===
  
  // Módulo de Estoque
  STOCK_MODULE_ENABLED: true,
  
  // Módulo WhatsApp / Central de Atendimento
  WHATSAPP_MODULE_ENABLED: true,
  
  // Módulo Hotel & Creche
  HOTEL_MODULE_ENABLED: true,
  
  // Módulo Banho & Tosa
  BATH_GROOMING_MODULE_ENABLED: true,
  
  // Módulo Planos de Fidelidade
  LOYALTY_PLANS_ENABLED: true,
  
  // Módulo Frente de Caixa
  POS_MODULE_ENABLED: true,
} as const;

/**
 * Verifica se um módulo está habilitado
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature];
}

/**
 * Verifica se módulo fiscal está habilitado
 */
export function isFiscalModuleEnabled(): boolean {
  return featureFlags.FISCAL_MODULE_ENABLED;
}

/**
 * Mensagem padrão para funcionalidades fiscais desativadas
 */
export const FISCAL_DISABLED_MESSAGE = 
  "A emissão de documentos fiscais para clientes finais é de responsabilidade do pet shop e não faz parte deste plano no momento.";
