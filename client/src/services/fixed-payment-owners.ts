/**
 * Serviço para gerenciar proprietários com pagamento fixo
 */

// Interface para proprietários com pagamento fixo
export interface FixedPaymentOwner {
  id: number;
  name: string;
  monthlyPayment: number;
  properties: string[];  // Lista de nomes de propriedades
  deductions: number;    // Valor fixo a deduzir do pagamento mensal
}

// Lista de proprietários com pagamento fixo
export const fixedPaymentOwners: FixedPaymentOwner[] = [
  {
    id: 1,
    name: "Ana Tomaz",
    monthlyPayment: 450,
    properties: [
      "Aroeira 1",
      "Aroeira2",
      "Graça",
      "Sete Rios",
      "Filipe da mata",
      "05-Oct"
    ],
    deductions: 0  // Não há deduções para Ana Tomaz
  }
];

/**
 * Verifica se um proprietário tem pagamento fixo
 * @param ownerName Nome do proprietário
 * @returns Informações sobre o pagamento fixo ou null
 */
export function getFixedPaymentOwner(ownerName: string): FixedPaymentOwner | null {
  return fixedPaymentOwners.find(
    owner => owner.name.toLowerCase() === ownerName.toLowerCase()
  ) || null;
}

/**
 * Verifica se uma propriedade pertence a um proprietário com pagamento fixo
 * @param propertyName Nome da propriedade
 * @returns Informações sobre o proprietário com pagamento fixo ou null
 */
export function isFixedPaymentProperty(propertyName: string): FixedPaymentOwner | null {
  return fixedPaymentOwners.find(
    owner => owner.properties.some(
      prop => prop.toLowerCase() === propertyName.toLowerCase()
    )
  ) || null;
}

/**
 * Calcula o valor a ser pago ao proprietário com pagamento fixo
 * @param ownerName Nome do proprietário
 * @param month Mês do relatório (1-12)
 * @param year Ano do relatório
 * @returns Valor a ser pago
 */
export function calculateFixedPayment(ownerName: string, month: number, year: number): {
  total: number;
  deductions: number;
  netAmount: number;
} {
  const owner = getFixedPaymentOwner(ownerName);
  
  if (!owner) {
    return { total: 0, deductions: 0, netAmount: 0 };
  }
  
  // Aqui poderíamos adicionar lógica para ajustar o pagamento com base no mês/ano
  // Por exemplo, se o contrato começou no meio do mês
  
  return {
    total: owner.monthlyPayment,
    deductions: owner.deductions,
    netAmount: owner.monthlyPayment - owner.deductions
  };
}