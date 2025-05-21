import { Express, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { format } from "date-fns";

/**
 * Registra as rotas para gerenciamento de banco de dados (backup e limpeza)
 */
export function registerDatabaseRoutes(app: Express) {
  // Rota para fazer backup do banco de dados
  app.get("/api/database/backup", async (_req: Request, res: Response) => {
    try {
      console.log("Iniciando backup do banco de dados...");
      
      // Consulta para obter todas as tabelas do banco
      const tables = await db.execute(sql`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      `);
      
      const backupData: Record<string, any[]> = {};
      
      // Para cada tabela, obter todos os dados
      for (const table of tables) {
        const tableName = table.tablename;
        console.log(`Fazendo backup da tabela: ${tableName}`);
        
        const tableData = await db.execute(sql`
          SELECT * FROM ${sql.identifier(tableName)};
        `);
        
        backupData[tableName] = tableData;
      }
      
      // Criar objeto com metadados e dados
      const backup = {
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0",
          tableCount: tables.length
        },
        data: backupData
      };
      
      const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
      const fileName = `database_backup_${timestamp}.json`;
      
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader("Content-Type", "application/json");
      res.json(backup);
      
      console.log("Backup concluído com sucesso");
    } catch (error) {
      console.error("Erro ao fazer backup do banco de dados:", error);
      res.status(500).json({ 
        error: "Falha ao fazer backup do banco de dados",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Rota para restaurar banco de dados a partir de backup
  app.post("/api/database/restore", async (req: Request, res: Response) => {
    try {
      const { backup } = req.body;
      
      if (!backup || !backup.data) {
        return res.status(400).json({ error: "Dados de backup inválidos" });
      }
      
      console.log("Iniciando restauração do banco de dados...");
      
      // Iniciar transação para garantir consistência
      await db.transaction(async (tx) => {
        // Para cada tabela no backup, truncar e inserir dados
        for (const [tableName, tableData] of Object.entries(backup.data)) {
          if (Array.isArray(tableData) && tableData.length > 0) {
            console.log(`Restaurando tabela: ${tableName} (${tableData.length} registros)`);
            
            // Limpar tabela antes de inserir
            await tx.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE;`);
            
            // Inserir dados em lotes para melhor performance
            const batchSize = 100;
            for (let i = 0; i < tableData.length; i += batchSize) {
              const batch = tableData.slice(i, i + batchSize);
              
              if (batch.length > 0) {
                // Construir consulta dinâmica baseada nas colunas do primeiro registro
                const firstRecord = batch[0];
                const columns = Object.keys(firstRecord);
                
                // Criar placeholders para cada linha e coluna
                const valuesSql = batch.map((_, rowIndex) => {
                  const rowPlaceholders = columns.map((_, colIndex) => 
                    `$${rowIndex * columns.length + colIndex + 1}`
                  ).join(", ");
                  
                  return `(${rowPlaceholders})`;
                }).join(", ");
                
                // Extrair valores em ordem
                const values = batch.flatMap(row => 
                  columns.map(col => row[col])
                );
                
                // Executar inserção
                const insertSql = `
                  INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(", ")})
                  VALUES ${valuesSql}
                  ON CONFLICT DO NOTHING;
                `;
                
                await tx.execute(sql.raw(insertSql, ...values));
              }
            }
          }
        }
      });
      
      console.log("Restauração concluída com sucesso");
      res.json({ 
        success: true, 
        message: "Banco de dados restaurado com sucesso",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao restaurar banco de dados:", error);
      res.status(500).json({ 
        error: "Falha ao restaurar banco de dados",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Rota para limpar dados do banco de dados (seletivamente)
  app.post("/api/database/cleanup", async (req: Request, res: Response) => {
    try {
      const { tables } = req.body;
      
      if (!tables || !Array.isArray(tables) || tables.length === 0) {
        return res.status(400).json({ error: "Nenhuma tabela especificada para limpeza" });
      }
      
      console.log(`Iniciando limpeza das tabelas: ${tables.join(", ")}`);
      
      // Iniciar transação para garantir consistência
      await db.transaction(async (tx) => {
        for (const tableName of tables) {
          // Verificar se a tabela existe antes de limpar
          const tableExists = await tx.execute(sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public'
              AND table_name = ${tableName}
            );
          `);
          
          if (tableExists[0]?.exists) {
            console.log(`Limpando tabela: ${tableName}`);
            await tx.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE;`);
          } else {
            console.warn(`Tabela não encontrada: ${tableName}`);
          }
        }
      });
      
      console.log("Limpeza concluída com sucesso");
      res.json({ 
        success: true, 
        message: `Tabelas limpas com sucesso: ${tables.join(", ")}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao limpar tabelas:", error);
      res.status(500).json({ 
        error: "Falha ao limpar tabelas",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}