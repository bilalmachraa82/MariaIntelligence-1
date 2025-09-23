#!/usr/bin/env tsx

/**
 * Script para atualizar a base de dados com TODOS os dados reais fornecidos
 * Inclui 15 proprietários e 35 propriedades com custos específicos
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { properties, owners, cleaningTeams } from "../shared/schema.js";
import { eq } from "drizzle-orm";

// Configuração da base de dados
const connectionString = process.env.DATABASE_URL ||
  "postgresql://mariafaz2025_owner:CM7v0BQbRiTF@ep-dark-waterfall-a28ar6lp-pooler.eu-central-1.aws.neon.tech/mariafaz2025?sslmode=require";

const client = postgres(connectionString);
const db = drizzle(client);

// Dados reais dos proprietários
const realOwnersData = [
  {
    name: "José Gustavo",
    company: "José Gustavo",
    address: "rua curvo semendo, 37 - Montemor o novo",
    taxId: null,
    email: null,
    phone: null
  },
  {
    name: "Hélia",
    company: "BRIGHT JOBS UNIPESSOAL LDA",
    address: "AVENIDA PROF DR AUGUSTO ABREU LOPES ..., ODIVELAS",
    taxId: "514487097",
    email: null,
    phone: null
  },
  {
    name: "Filipe villas boas",
    company: "Vanguardpriority Unipessoal Lda",
    address: "Lisboa",
    taxId: "514537027",
    email: "vanguardpriority@gmail.com",
    phone: null
  },
  {
    name: "Maria Lorena",
    company: "pessoal",
    address: null,
    taxId: null,
    email: null,
    phone: null
  },
  {
    name: "innkeeper",
    company: "Criterion Legacy Unipessoal LDA",
    address: "Lisboa",
    taxId: "514887869",
    email: "miguel@innkeeper.pt",
    phone: null
  },
  {
    name: "Maria Ines",
    company: "IMAGINARY AVENUE - LDA",
    address: "RUA DA REPUBLICA DA GUINE BISSAU N 1 3 E, AMADORA",
    taxId: "517107341",
    email: null,
    phone: null
  },
  {
    name: "Ana Robalo",
    company: "Ana Teresa Robalo Arquitetura unipessoal Lda",
    address: "Av. Guerra Junqueiro n9, 4ºdt, lisboa",
    taxId: "514279141",
    email: "anatrobalo@gmail.com",
    phone: null
  },
  {
    name: "Cláudia",
    company: "pessoal",
    address: null,
    taxId: null,
    email: null,
    phone: null
  },
  {
    name: "José",
    company: "pessoal",
    address: null,
    taxId: null,
    email: null,
    phone: null
  },
  {
    name: "Gabriela",
    company: "Tribunadomus, Lda",
    address: null,
    taxId: "507764277",
    email: "tribunadomus@gmail.com",
    phone: null
  },
  {
    name: "lydia",
    company: "pessoal",
    address: null,
    taxId: null,
    email: null,
    phone: null
  },
  {
    name: "Ana Tomaz",
    company: "contrato",
    address: null,
    taxId: null,
    email: null,
    phone: null
  },
  {
    name: "Francisco",
    company: "FCO Living, lda",
    address: null,
    taxId: "516298968",
    email: "couto_francisco@hotmail.com",
    phone: null
  },
  {
    name: "Sandra",
    company: "TRIUMPH CHIMERA LDA",
    address: "RUA FRANCISCO FRANCO N 30B BAIRRO DAS MORENAS",
    taxId: "515942022",
    email: "sandrar@triumphinc.ca",
    phone: null
  },
  {
    name: "Mariana",
    company: "Mariana Arga Lima lda",
    address: "Rua Álvaro Pedro Gomes, 12 4D, Sacavem",
    taxId: "514759232",
    email: "hshgestao@gmail.com",
    phone: null
  }
];

// Dados reais das propriedades (35 propriedades)
const realPropertiesData = [
  {
    name: "Ajuda",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    cleaningTeam: "Maria faz",
    ownerName: "Gabriela",
    monthlyFixedCost: "0"
  },
  {
    name: "Almada rei",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    cleaningTeam: "cristina",
    ownerName: "innkeeper",
    monthlyFixedCost: "0"
  },
  {
    name: "Aroeira 3",
    cleaningCost: "50",
    checkInFee: "0",
    commission: "0",
    teamPayment: "50",
    cleaningTeam: "Maria faz",
    ownerName: "lydia",
    monthlyFixedCost: "0"
  },
  {
    name: "Aroeira 4",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    cleaningTeam: "Maria faz",
    ownerName: "Cláudia",
    monthlyFixedCost: "0"
  },
  {
    name: "Barcos (Check-in)",
    cleaningCost: "55",
    checkInFee: "15",
    commission: "0",
    teamPayment: "70",
    cleaningTeam: "Maria faz",
    ownerName: "innkeeper",
    monthlyFixedCost: "0"
  },
  {
    name: "Bernardo",
    cleaningCost: "65",
    checkInFee: "15",
    commission: "0",
    teamPayment: "55",
    cleaningTeam: "cristina",
    ownerName: "innkeeper",
    monthlyFixedCost: "0"
  },
  {
    name: "Costa cabanas",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    cleaningTeam: "Primavera",
    ownerName: "Mariana",
    monthlyFixedCost: "0"
  },
  {
    name: "Cristo Rei",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "40",
    cleaningTeam: "cristina",
    ownerName: "Gabriela",
    monthlyFixedCost: "0"
  },
  {
    name: "Ericeira nova",
    cleaningCost: "45",
    checkInFee: "15",
    commission: "0",
    teamPayment: "60",
    cleaningTeam: "Maria faz",
    ownerName: "José",
    monthlyFixedCost: "0"
  },
  {
    name: "Gomeira",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    cleaningTeam: "Primavera",
    ownerName: "Mariana",
    monthlyFixedCost: "0"
  },
  {
    name: "João Batista",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "55",
    cleaningTeam: "cristina",
    ownerName: "innkeeper",
    monthlyFixedCost: "0"
  },
  {
    name: "Magoito anexo",
    cleaningCost: "90",
    checkInFee: "0",
    commission: "0",
    teamPayment: "90",
    cleaningTeam: "maria faz",
    ownerName: "Hélia",
    monthlyFixedCost: "0"
  },
  {
    name: "Magoito vivenda",
    cleaningCost: "90",
    checkInFee: "0",
    commission: "0",
    teamPayment: "90",
    cleaningTeam: "Maria faz",
    ownerName: "Hélia",
    monthlyFixedCost: "0"
  },
  {
    name: "Montemor",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "20",
    teamPayment: "55",
    cleaningTeam: "Maria joão",
    ownerName: "José Gustavo",
    monthlyFixedCost: "0"
  },
  {
    name: "Nazaré T2",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "50",
    cleaningTeam: "Home deluxe",
    ownerName: "innkeeper",
    monthlyFixedCost: "0"
  },
  {
    name: "Palmela",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "35",
    cleaningTeam: "Cristina",
    ownerName: "Gabriela",
    monthlyFixedCost: "0"
  },
  {
    name: "Reboleira",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "55",
    cleaningTeam: "Maria faz",
    ownerName: "Maria Ines",
    monthlyFixedCost: "0"
  },
  {
    name: "Silves",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "55",
    cleaningTeam: "Primavera",
    ownerName: "Filipe villas boas",
    monthlyFixedCost: "0"
  },
  {
    name: "Sé",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "65",
    cleaningTeam: "Maria faz",
    ownerName: "Maria Lorena",
    monthlyFixedCost: "0"
  },
  {
    name: "Trafaria 1ª",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    cleaningTeam: "cristina",
    ownerName: "Filipe villas boas",
    monthlyFixedCost: "0"
  },
  {
    name: "Trafaria RC",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    cleaningTeam: "cristina",
    ownerName: "Filipe villas boas",
    monthlyFixedCost: "0"
  },
  {
    name: "Tróia",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "20",
    teamPayment: "45",
    cleaningTeam: "Setubal",
    ownerName: "Francisco",
    monthlyFixedCost: "0"
  },
  {
    name: "Óbidos",
    cleaningCost: "90",
    checkInFee: "0",
    commission: "0",
    teamPayment: "85",
    cleaningTeam: "Home deluxe",
    ownerName: "innkeeper",
    monthlyFixedCost: "0"
  },
  {
    name: "Setubal",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    cleaningTeam: "cristina",
    ownerName: "Gabriela",
    monthlyFixedCost: "0"
  },
  {
    name: "Costa blue",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "50",
    cleaningTeam: "cristina",
    ownerName: "Ana Robalo",
    monthlyFixedCost: "0"
  },
  {
    name: "Tropical",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "60",
    cleaningTeam: "Home deluxe",
    ownerName: "Sandra",
    monthlyFixedCost: "0"
  },
  {
    name: "Praia chic",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "55",
    cleaningTeam: "Home deluxe",
    ownerName: "Sandra",
    monthlyFixedCost: "0"
  },
  {
    name: "Maresia",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "55",
    cleaningTeam: "Home deluxe",
    ownerName: "Sandra",
    monthlyFixedCost: "0"
  },
  {
    name: "Escandinavo",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "60",
    cleaningTeam: "Home deluxe",
    ownerName: "Sandra",
    monthlyFixedCost: "0"
  },
  // Propriedades especiais com custo fixo mensal
  {
    name: "Aroeira 1",
    cleaningCost: "0",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    cleaningTeam: "Maria faz",
    ownerName: "Ana Tomaz",
    monthlyFixedCost: "75"
  },
  {
    name: "Aroeira2",
    cleaningCost: "0",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    cleaningTeam: "Maria faz",
    ownerName: "Ana Tomaz",
    monthlyFixedCost: "75"
  },
  {
    name: "Graça",
    cleaningCost: "0",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    cleaningTeam: "Maria faz",
    ownerName: "Ana Tomaz",
    monthlyFixedCost: "75"
  },
  {
    name: "Sete Rios",
    cleaningCost: "0",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    cleaningTeam: "Maria faz",
    ownerName: "Ana Tomaz",
    monthlyFixedCost: "75"
  },
  {
    name: "Filipe da mata",
    cleaningCost: "0",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    cleaningTeam: "Maria faz",
    ownerName: "Ana Tomaz",
    monthlyFixedCost: "75"
  },
  {
    name: "05-Oct",
    cleaningCost: "0",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    cleaningTeam: "Maria faz",
    ownerName: "Ana Tomaz",
    monthlyFixedCost: "75"
  }
];

// Equipas de limpeza baseadas nos dados reais
const cleaningTeamsData = [
  { name: "Maria faz", rate: "50", status: "active", phone: "+351 910 000 000" },
  { name: "cristina", rate: "45", status: "active", phone: "+351 920 000 000" },
  { name: "Primavera", rate: "50", status: "active", phone: "+351 930 000 000" },
  { name: "Maria joão", rate: "55", status: "active", phone: "+351 940 000 000" },
  { name: "Home deluxe", rate: "60", status: "active", phone: "+351 950 000 000" },
  { name: "Setubal", rate: "45", status: "active", phone: "+351 960 000 000" }
];

async function updateWithRealData() {
  console.log("🔄 Iniciando atualização completa com dados reais...");

  try {
    // 1. Limpar dados existentes (manter schema)
    console.log("🗑️ Limpando dados antigos...");
    await db.delete(properties);
    await db.delete(owners);
    await db.delete(cleaningTeams);

    // 2. Inserir proprietários reais
    console.log("👥 Inserindo proprietários reais...");
    const insertedOwners = await db.insert(owners).values(
      realOwnersData.map(owner => ({
        name: owner.name,
        company: owner.company || null,
        address: owner.address || null,
        taxId: owner.taxId || null,
        email: owner.email || null,
        phone: owner.phone || null
      }))
    ).returning();

    console.log(`✅ ${insertedOwners.length} proprietários inseridos`);

    // 3. Criar mapa de proprietários por nome
    const ownerMap = new Map();
    insertedOwners.forEach(owner => {
      ownerMap.set(owner.name, owner.id);
    });

    // 4. Inserir equipas de limpeza
    console.log("🧹 Inserindo equipas de limpeza...");
    const insertedTeams = await db.insert(cleaningTeams).values(cleaningTeamsData).returning();
    console.log(`✅ ${insertedTeams.length} equipas de limpeza inseridas`);

    // 5. Inserir propriedades reais
    console.log("🏠 Inserindo propriedades reais...");

    const propertiesToInsert = realPropertiesData.map(property => {
      const ownerId = ownerMap.get(property.ownerName);

      if (!ownerId) {
        console.warn(`⚠️ Proprietário não encontrado: ${property.ownerName} para propriedade ${property.name}`);
        return null;
      }

      return {
        name: property.name,
        ownerId: ownerId,
        cleaningCost: property.cleaningCost,
        checkInFee: property.checkInFee,
        commission: property.commission,
        teamPayment: property.teamPayment,
        cleaningTeam: property.cleaningTeam,
        monthlyFixedCost: property.monthlyFixedCost,
        active: true
      };
    }).filter(Boolean);

    const insertedProperties = await db.insert(properties).values(propertiesToInsert).returning();
    console.log(`✅ ${insertedProperties.length} propriedades inseridas`);

    // 6. Validação final
    console.log("\n📊 Resumo da importação:");

    // Estatísticas por custo de limpeza
    const costRanges = {
      "€0": realPropertiesData.filter(p => p.cleaningCost === "0").length,
      "€35-49": realPropertiesData.filter(p => parseInt(p.cleaningCost) >= 35 && parseInt(p.cleaningCost) <= 49).length,
      "€50-59": realPropertiesData.filter(p => parseInt(p.cleaningCost) >= 50 && parseInt(p.cleaningCost) <= 59).length,
      "€60-69": realPropertiesData.filter(p => parseInt(p.cleaningCost) >= 60 && parseInt(p.cleaningCost) <= 69).length,
      "€90+": realPropertiesData.filter(p => parseInt(p.cleaningCost) >= 90).length
    };

    console.log("💰 Distribuição por custo de limpeza:");
    Object.entries(costRanges).forEach(([range, count]) => {
      if (count > 0) console.log(`  ${range}: ${count} propriedades`);
    });

    // Propriedades com taxas especiais
    const withCheckIn = realPropertiesData.filter(p => parseInt(p.checkInFee) > 0);
    const withCommission = realPropertiesData.filter(p => parseInt(p.commission) > 0);
    const withFixedCost = realPropertiesData.filter(p => parseInt(p.monthlyFixedCost) > 0);

    console.log(`\n🔍 Taxas especiais:`);
    console.log(`  Check-in: ${withCheckIn.length} propriedades (${withCheckIn.map(p => p.name).join(', ')})`);
    console.log(`  Comissão: ${withCommission.length} propriedades (${withCommission.map(p => p.name).join(', ')})`);
    console.log(`  Custo fixo: ${withFixedCost.length} propriedades (${withFixedCost.map(p => p.name).join(', ')})`);

    console.log(`\n✅ IMPORTAÇÃO COMPLETA:`);
    console.log(`📊 ${realOwnersData.length} proprietários reais`);
    console.log(`🏠 ${realPropertiesData.length} propriedades reais`);
    console.log(`🧹 ${cleaningTeamsData.length} equipas de limpeza`);
    console.log(`💼 Sistema pronto para produção!`);

  } catch (error) {
    console.error("❌ Erro durante a importação:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar script se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateWithRealData()
    .then(() => {
      console.log("✅ Script concluído com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falhou:", error);
      process.exit(1);
    });
}

export { updateWithRealData, realPropertiesData, realOwnersData };