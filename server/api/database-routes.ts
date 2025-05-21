import { Request, Response } from "express";
import { Express } from "express-serve-static-core";
import { db } from "../db";
import { 
  properties, 
  owners, 
  reservations, 
  activities, 
  quotations,
  maintenanceTasks,
  financialDocuments,
  financialDocumentItems,
  paymentRecords,
  cleaningTeams,
  cleaningSchedules
} from "@shared/schema";
import path from "path";
import fs from "fs";
import { sql } from "drizzle-orm";

/**
 * Registra as rotas para gerenciamento de banco de dados (backup e limpeza)
 */
export function registerDatabaseRoutes(app: Express) {
  // Endpoint para fazer backup do banco de dados
  app.get("/api/database/backup", async (_req: Request, res: Response) => {
    try {
      // Inicializa o objeto de backup
      const backupData: any = {
        metadata: {
          version: "1.0",
          timestamp: new Date().toISOString(),
          description: "Maria Faz Database Backup"
        },
        data: {}
      };

      // Obtém dados de cada tabela
      const [
        propertiesData,
        ownersData,
        reservationsData,
        activitiesData,
        quotationsData,
        maintenanceTasksData,
        financialDocumentsData,
        financialDocumentItemsData,
        paymentRecordsData,
        cleaningTeamsData,
        cleaningSchedulesData
      ] = await Promise.all([
        db.select().from(properties),
        db.select().from(owners),
        db.select().from(reservations),
        db.select().from(activities),
        db.select().from(quotations),
        db.select().from(maintenanceTasks),
        db.select().from(financialDocuments),
        db.select().from(financialDocumentItems),
        db.select().from(paymentRecords),
        db.select().from(cleaningTeams),
        db.select().from(cleaningSchedules)
      ]);

      // Preenche o objeto de backup com os dados
      backupData.data = {
        properties: propertiesData,
        owners: ownersData,
        reservations: reservationsData,
        activities: activitiesData,
        quotations: quotationsData,
        maintenanceTasks: maintenanceTasksData,
        financialDocuments: financialDocumentsData,
        financialDocumentItems: financialDocumentItemsData,
        paymentRecords: paymentRecordsData,
        cleaningTeams: cleaningTeamsData,
        cleaningSchedules: cleaningSchedulesData
      };

      // Retorna os dados de backup como JSON
      return res.status(200).json({
        success: true,
        data: backupData
      });
    } catch (error) {
      console.error("Erro ao fazer backup do banco de dados:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao criar backup do banco de dados",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint para restaurar backup do banco de dados
  app.post("/api/database/restore", async (req: Request, res: Response) => {
    try {
      const { data } = req.body;

      if (!data || !data.data || !data.metadata) {
        return res.status(400).json({
          success: false,
          message: "Formato de backup inválido"
        });
      }

      // Verifica a versão do backup
      if (data.metadata.version !== "1.0") {
        return res.status(400).json({
          success: false,
          message: `Versão de backup incompatível: ${data.metadata.version}`
        });
      }

      // Cria pasta para backups antes de restaurar (por segurança)
      const backupDir = path.join(__dirname, "../../../backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Salva um backup antes de restaurar
      const preRestoreBackup = {
        metadata: {
          version: "1.0",
          timestamp: new Date().toISOString(),
          description: "Automatic Pre-Restore Backup"
        },
        data: {
          properties: await db.select().from(properties),
          owners: await db.select().from(owners),
          reservations: await db.select().from(reservations),
          activities: await db.select().from(activities),
          quotations: await db.select().from(quotations),
          maintenanceTasks: await db.select().from(maintenanceTasks),
          financialDocuments: await db.select().from(financialDocuments),
          financialDocumentItems: await db.select().from(financialDocumentItems),
          paymentRecords: await db.select().from(paymentRecords),
          cleaningTeams: await db.select().from(cleaningTeams),
          cleaningSchedules: await db.select().from(cleaningSchedules)
        }
      };

      const backupFilename = `pre-restore-${new Date().toISOString().replace(/:/g, "-")}.json`;
      fs.writeFileSync(
        path.join(backupDir, backupFilename),
        JSON.stringify(preRestoreBackup, null, 2)
      );

      // Inicia uma transação para garantir consistência durante a restauração
      await db.transaction(async (tx) => {
        // Limpa cada tabela antes de restaurar
        // Ordem importante: primeiro as tabelas dependentes
        await tx.delete(financialDocumentItems);
        await tx.delete(paymentRecords);
        await tx.delete(financialDocuments);
        await tx.delete(activities);
        await tx.delete(cleaningSchedules);
        await tx.delete(quotations);
        await tx.delete(maintenanceTasks);
        await tx.delete(reservations);
        await tx.delete(properties);
        await tx.delete(cleaningTeams);
        await tx.delete(owners);

        // Restaura cada tabela com os dados do backup
        // Ordem importante: primeiro as tabelas independentes
        if (data.data.owners?.length) {
          for (const owner of data.data.owners) {
            await tx.insert(owners).values(owner).onConflictDoUpdate({
              target: owners.id,
              set: owner
            });
          }
        }

        if (data.data.cleaningTeams?.length) {
          for (const team of data.data.cleaningTeams) {
            await tx.insert(cleaningTeams).values(team).onConflictDoUpdate({
              target: cleaningTeams.id,
              set: team
            });
          }
        }

        if (data.data.properties?.length) {
          for (const property of data.data.properties) {
            await tx.insert(properties).values(property).onConflictDoUpdate({
              target: properties.id,
              set: property
            });
          }
        }

        if (data.data.reservations?.length) {
          for (const reservation of data.data.reservations) {
            await tx.insert(reservations).values(reservation).onConflictDoUpdate({
              target: reservations.id,
              set: reservation
            });
          }
        }

        if (data.data.quotations?.length) {
          for (const quotation of data.data.quotations) {
            await tx.insert(quotations).values(quotation).onConflictDoUpdate({
              target: quotations.id,
              set: quotation
            });
          }
        }

        if (data.data.maintenanceTasks?.length) {
          for (const task of data.data.maintenanceTasks) {
            await tx.insert(maintenanceTasks).values(task).onConflictDoUpdate({
              target: maintenanceTasks.id,
              set: task
            });
          }
        }

        if (data.data.activities?.length) {
          for (const activity of data.data.activities) {
            await tx.insert(activities).values(activity).onConflictDoUpdate({
              target: activities.id,
              set: activity
            });
          }
        }

        if (data.data.financialDocuments?.length) {
          for (const doc of data.data.financialDocuments) {
            await tx.insert(financialDocuments).values(doc).onConflictDoUpdate({
              target: financialDocuments.id,
              set: doc
            });
          }
        }

        if (data.data.financialDocumentItems?.length) {
          for (const item of data.data.financialDocumentItems) {
            await tx.insert(financialDocumentItems).values(item).onConflictDoUpdate({
              target: financialDocumentItems.id,
              set: item
            });
          }
        }

        if (data.data.paymentRecords?.length) {
          for (const record of data.data.paymentRecords) {
            await tx.insert(paymentRecords).values(record).onConflictDoUpdate({
              target: paymentRecords.id,
              set: record
            });
          }
        }

        if (data.data.cleaningSchedules?.length) {
          for (const schedule of data.data.cleaningSchedules) {
            await tx.insert(cleaningSchedules).values(schedule).onConflictDoUpdate({
              target: cleaningSchedules.id,
              set: schedule
            });
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: "Backup restaurado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao restaurar backup",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint para limpeza de dados
  app.post("/api/database/cleanup", async (req: Request, res: Response) => {
    try {
      const { type } = req.body;
      
      if (!type || !["all", "reservations", "financial", "activities"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de limpeza inválido"
        });
      }

      // Cria pasta para backups antes de limpar (por segurança)
      const backupDir = path.join(__dirname, "../../../backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Salva um backup antes de limpar
      const preCleanupBackup = {
        metadata: {
          version: "1.0",
          timestamp: new Date().toISOString(),
          description: "Automatic Pre-Cleanup Backup"
        },
        data: {
          properties: await db.select().from(properties),
          owners: await db.select().from(owners),
          reservations: await db.select().from(reservations),
          activities: await db.select().from(activities),
          quotations: await db.select().from(quotations),
          maintenanceTasks: await db.select().from(maintenanceTasks),
          financialDocuments: await db.select().from(financialDocuments),
          financialDocumentItems: await db.select().from(financialDocumentItems),
          paymentRecords: await db.select().from(paymentRecords),
          cleaningTeams: await db.select().from(cleaningTeams),
          cleaningSchedules: await db.select().from(cleaningSchedules)
        }
      };

      const backupFilename = `pre-cleanup-${type}-${new Date().toISOString().replace(/:/g, "-")}.json`;
      fs.writeFileSync(
        path.join(backupDir, backupFilename),
        JSON.stringify(preCleanupBackup, null, 2)
      );

      // Realiza a limpeza solicitada
      await db.transaction(async (tx) => {
        if (type === "all" || type === "reservations") {
          await tx.delete(reservations);
          await tx.delete(cleaningSchedules);
          await tx.delete(quotations);
        }

        if (type === "all" || type === "financial") {
          await tx.delete(financialDocumentItems);
          await tx.delete(paymentRecords);
          await tx.delete(financialDocuments);
        }

        if (type === "all" || type === "activities") {
          await tx.delete(activities);
          await tx.delete(maintenanceTasks);
        }

        if (type === "all") {
          // Reseta a sequência de IDs
          await tx.execute(sql`
            SELECT setval(pg_get_serial_sequence('reservations', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM reservations;
            SELECT setval(pg_get_serial_sequence('quotations', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM quotations;
            SELECT setval(pg_get_serial_sequence('activities', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM activities;
            SELECT setval(pg_get_serial_sequence('financial_documents', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM financial_documents;
            SELECT setval(pg_get_serial_sequence('maintenance_tasks', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM maintenance_tasks;
            SELECT setval(pg_get_serial_sequence('cleaning_schedules', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM cleaning_schedules;
          `);
        }
      });

      return res.status(200).json({
        success: true,
        message: `Limpeza do tipo '${type}' realizada com sucesso`
      });
    } catch (error) {
      console.error("Erro ao limpar banco de dados:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao limpar dados",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}