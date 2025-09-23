#!/usr/bin/env tsx

/**
 * Script para atualizar a base de dados com os dados reais das 30 propriedades
 * Baseado nas informações fornecidas pelo utilizador
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { properties, owners, cleaningTeams } from "../shared/schema";
import { eq } from "drizzle-orm";

// Configuração da base de dados
const connectionString = process.env.DATABASE_URL ||
  "postgresql://mariafaz2025_owner:CM7v0BQbRiTF@ep-dark-waterfall-a28ar6lp-pooler.eu-central-1.aws.neon.tech/mariafaz2025?sslmode=require";

const client = postgres(connectionString);
const db = drizzle(client);

// Dados das 30 propriedades reais
const realPropertiesData = [
  {
    name: "Ajuda",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "30",
    location: "Almada",
    notes: "Propriedade com equipa de limpeza fixa"
  },
  {
    name: "Almada rei",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    location: "Almada",
    notes: "Propriedade premium"
  },
  {
    name: "Aroeira 3",
    cleaningCost: "50",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Aroeira",
    notes: "Resort Aroeira - apartamento 3"
  },
  {
    name: "Aroeira 4",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Aroeira",
    notes: "Resort Aroeira - apartamento 4"
  },
  {
    name: "Bairro 0",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "30",
    location: "Lisboa",
    notes: "Apartamento T0 no centro"
  },
  {
    name: "Bairro 1",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "30",
    location: "Lisboa",
    notes: "Apartamento T1 no centro"
  },
  {
    name: "Bairro 2",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "30",
    location: "Lisboa",
    notes: "Apartamento T2 no centro"
  },
  {
    name: "Bairro 3",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "30",
    location: "Lisboa",
    notes: "Apartamento T3 no centro"
  },
  {
    name: "Barcos (Check-in)",
    cleaningCost: "55",
    checkInFee: "15",
    commission: "0",
    teamPayment: "0",
    location: "Cascais",
    notes: "Propriedade com check-in especial"
  },
  {
    name: "Benfica",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "45",
    location: "Lisboa",
    notes: "Zona do Estádio da Luz"
  },
  {
    name: "Bernardo",
    cleaningCost: "65",
    checkInFee: "15",
    commission: "0",
    teamPayment: "55",
    location: "Lisboa",
    notes: "Propriedade premium com serviços extras"
  },
  {
    name: "Costa cabanas",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Costa da Caparica",
    notes: "Casa de praia"
  },
  {
    name: "Cristo Rei",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Almada",
    notes: "Vista para Cristo Rei"
  },
  {
    name: "Ericeira nova",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Ericeira",
    notes: "Zona surf"
  },
  {
    name: "Foz do Arelho 1",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Foz do Arelho",
    notes: "Primeira propriedade na Foz"
  },
  {
    name: "Gama Barros",
    cleaningCost: "35",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Lisboa",
    notes: "Propriedade mais económica"
  },
  {
    name: "Gomeira",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Torres Vedras",
    notes: "Zona rural tranquila"
  },
  {
    name: "João Batista",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Lisboa",
    notes: "Zona histórica"
  },
  {
    name: "Magoito anexo",
    cleaningCost: "95",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Magoito",
    notes: "Anexo da vivenda principal"
  },
  {
    name: "Magoito vivenda",
    cleaningCost: "95",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Magoito",
    notes: "Vivenda principal de luxo"
  },
  {
    name: "Montemor",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "20",
    teamPayment: "0",
    location: "Montemor-o-Novo",
    notes: "Propriedade com comissão de 20%"
  },
  {
    name: "Nazaré T2",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Nazaré",
    notes: "Apartamento T2 na Nazaré"
  },
  {
    name: "Palmela",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Palmela",
    notes: "Zona do Castelo"
  },
  {
    name: "Reboleira",
    cleaningCost: "45",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Amadora",
    notes: "Zona metropolitana"
  },
  {
    name: "Setúbal",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Setúbal",
    notes: "Centro de Setúbal"
  },
  {
    name: "Silves",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Silves",
    notes: "Algarve interior"
  },
  {
    name: "Sé",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Lisboa",
    notes: "Zona da Sé de Lisboa"
  },
  {
    name: "Trafaria 1ª",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Almada",
    notes: "Primeira propriedade na Trafaria"
  },
  {
    name: "Trafaria RC",
    cleaningCost: "65",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Almada",
    notes: "Rés-do-chão na Trafaria"
  },
  {
    name: "Tróia",
    cleaningCost: "55",
    checkInFee: "0",
    commission: "20",
    teamPayment: "0",
    location: "Tróia",
    notes: "Resort Tróia - propriedade com comissão de 20%"
  },
  {
    name: "Óbidos",
    cleaningCost: "90",
    checkInFee: "0",
    commission: "0",
    teamPayment: "0",
    location: "Óbidos",
    notes: "Propriedade histórica em Óbidos"
  }
];

async function updateDatabase() {
  console.log("🔄 Iniciando atualização da base de dados...");

  try {
    // 1. Verificar se existe proprietário principal (Maria Faz)
    const [defaultOwner] = await db.select().from(owners).where(eq(owners.name, "Maria Faz")).limit(1);

    let ownerId = defaultOwner?.id;

    if (!defaultOwner) {
      console.log("👤 Criando proprietário principal...");
      const [newOwner] = await db.insert(owners).values({
        name: "Maria Faz",
        company: "MariaIntelligence Lda",
        email: "maria@mariaintelligence.com",
        phone: "+351 910 000 000",
        address: "Lisboa, Portugal"
      }).returning();
      ownerId = newOwner.id;
      console.log(`✅ Proprietário criado com ID: ${ownerId}`);
    } else {
      console.log(`✅ Proprietário encontrado com ID: ${ownerId}`);
    }

    // 2. Inserir/atualizar propriedades
    console.log("🏠 Processando propriedades...");

    for (const propertyData of realPropertiesData) {
      // Verificar se a propriedade já existe
      const [existingProperty] = await db.select()
        .from(properties)
        .where(eq(properties.name, propertyData.name))
        .limit(1);

      if (existingProperty) {
        // Atualizar propriedade existente
        await db.update(properties)
          .set({
            cleaningCost: propertyData.cleaningCost,
            checkInFee: propertyData.checkInFee,
            commission: propertyData.commission,
            teamPayment: propertyData.teamPayment,
            ownerId: ownerId,
            active: true
          })
          .where(eq(properties.id, existingProperty.id));

        console.log(`🔄 Atualizada: ${propertyData.name}`);
      } else {
        // Inserir nova propriedade
        await db.insert(properties).values({
          name: propertyData.name,
          ownerId: ownerId!,
          cleaningCost: propertyData.cleaningCost,
          checkInFee: propertyData.checkInFee,
          commission: propertyData.commission,
          teamPayment: propertyData.teamPayment,
          monthlyFixedCost: "0",
          active: true
        });

        console.log(`✅ Criada: ${propertyData.name}`);
      }
    }

    // 3. Criar equipas de limpeza se não existirem
    console.log("🧹 Verificando equipas de limpeza...");

    const cleaningTeamsData = [
      { name: "Equipa Principal", rate: "45", status: "active" },
      { name: "Equipa Premium", rate: "65", status: "active" },
      { name: "Equipa Económica", rate: "35", status: "active" }
    ];

    for (const teamData of cleaningTeamsData) {
      const [existingTeam] = await db.select()
        .from(cleaningTeams)
        .where(eq(cleaningTeams.name, teamData.name))
        .limit(1);

      if (!existingTeam) {
        await db.insert(cleaningTeams).values(teamData);
        console.log(`✅ Equipa criada: ${teamData.name}`);
      }
    }

    console.log("\n📊 Resumo da atualização:");
    console.log(`✅ ${realPropertiesData.length} propriedades processadas`);
    console.log(`✅ 1 proprietário configurado`);
    console.log(`✅ 3 equipas de limpeza disponíveis`);

    console.log("\n💰 Análise financeira:");
    console.log(`💶 Custos de limpeza: €35 - €95`);
    console.log(`🚪 Taxas de check-in: €0 - €15`);
    console.log(`📈 Comissões: 0% - 20%`);
    console.log(`👥 Pagamentos de equipa: €0 - €55`);

    console.log("\n🎯 Base de dados atualizada com sucesso!");

  } catch (error) {
    console.error("❌ Erro durante a atualização:", error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executar script se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateDatabase()
    .then(() => {
      console.log("✅ Script concluído com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falhou:", error);
      process.exit(1);
    });
}

export { updateDatabase, realPropertiesData };