/**
 * Utilitário para fazer correspondência de propriedades usando aliases
 * Implementa o requisito da seção 2 do Sprint Debug Final 
 */
import { Property } from '../../shared/schema';

/**
 * Encontra uma propriedade pelo nome ou pelos aliases
 * @param propertyName Nome da propriedade a ser procurada
 * @param properties Lista de propriedades para buscar
 * @returns Propriedade encontrada ou undefined
 */
export function matchPropertyByAlias(
  propertyName: string,
  properties: Property[]
): Property | undefined {
  if (!propertyName || !properties || properties.length === 0) {
    return undefined;
  }

  // Normalizar o nome da propriedade a ser procurada
  const normalizedName = normalizePropertyName(propertyName);

  // Primeiro, tentar encontrar uma correspondência exata pelo nome
  const exactMatch = properties.find(
    property => normalizePropertyName(property.name) === normalizedName
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Segundo, verificar os aliases para cada propriedade
  for (const property of properties) {
    if (property.aliases && Array.isArray(property.aliases)) {
      // Verificar se algum alias corresponde exatamente
      const matchingAlias = property.aliases.find(
        alias => normalizePropertyName(alias) === normalizedName
      );

      if (matchingAlias) {
        return property;
      }
    }
  }

  // Terceiro, procurar por correspondências parciais no nome
  const partialNameMatches = properties.filter(property => 
    normalizePropertyName(property.name).includes(normalizedName) || 
    normalizedName.includes(normalizePropertyName(property.name))
  );

  if (partialNameMatches.length > 0) {
    return partialNameMatches[0]; // Retornar a primeira correspondência parcial
  }

  // Por último, procurar por correspondências parciais nos aliases
  for (const property of properties) {
    if (property.aliases && Array.isArray(property.aliases)) {
      // Verificar se algum alias contém o nome ou vice-versa
      const matchingPartialAlias = property.aliases.find(alias => 
        normalizePropertyName(alias).includes(normalizedName) || 
        normalizedName.includes(normalizePropertyName(alias))
      );

      if (matchingPartialAlias) {
        return property;
      }
    }
  }

  // Nenhuma correspondência encontrada
  return undefined;
}

/**
 * Normaliza um nome de propriedade para facilitar a comparação
 * @param name Nome da propriedade
 * @returns Nome normalizado
 */
function normalizePropertyName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalizar acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]/g, ''); // Remover caracteres especiais
}