import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Database, 
  Download, 
  UploadCloud, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Shield, 
  Info
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

/**
 * Componente para gerenciamento do banco de dados, incluindo:
 * - Backup completo (exportação)
 * - Limpeza seletiva de dados
 * - Restauração de dados
 */
export function DatabaseManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [isPerformingRestore, setIsPerformingRestore] = useState(false);
  const [isPerformingCleanup, setIsPerformingCleanup] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [uploadedBackupFile, setUploadedBackupFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<any | null>(null);
  const [operationResult, setOperationResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  // Lista de tabelas disponíveis no sistema
  const availableTables = [
    { id: "properties", label: "Imóveis", icon: "🏠" },
    { id: "owners", label: "Proprietários", icon: "👤" },
    { id: "reservations", label: "Reservas", icon: "📅" },
    { id: "activities", label: "Atividades", icon: "📝" },
    { id: "quotations", label: "Orçamentos", icon: "💰" },
    { id: "financial_documents", label: "Documentos Financeiros", icon: "📄" },
    { id: "financial_document_items", label: "Itens de Documentos", icon: "📋" },
    { id: "payment_records", label: "Registros de Pagamento", icon: "💸" },
    { id: "maintenance_tasks", label: "Tarefas de Manutenção", icon: "🔧" },
    { id: "cleaning_teams", label: "Equipas de Limpeza", icon: "🧹" },
  ];

  // Tabelas essenciais/sensíveis (com aviso adicional)
  const sensitiveTables = ["properties", "owners"];

  // Função para gerar backup do banco de dados
  const handleGenerateBackup = async () => {
    try {
      setIsGeneratingBackup(true);
      setOperationResult(null);
      
      // Fazer chamada para a API de backup
      const response = await fetch("/api/database/backup", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(\`Erro ao gerar backup: \${response.statusText}\`);
      }
      
      // Download do arquivo de backup
      const data = await response.json();
      const timestamp = new Date().toISOString().replace(/:/g, "-");
      const fileName = \`database_backup_\${timestamp}.json\`;
      
      // Criar link para download do arquivo
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Exibir confirmação
      setOperationResult({
        success: true,
        message: "Backup gerado com sucesso. O download foi iniciado automaticamente.",
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: "Backup concluído",
        description: "O backup do banco de dados foi gerado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar backup:", error);
      setOperationResult({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao gerar backup do banco de dados",
      });
      
      toast({
        variant: "destructive",
        title: "Erro ao gerar backup",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o backup do banco de dados.",
      });
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  // Função para limpar tabelas selecionadas
  const handleCleanupTables = async () => {
    if (!selectedTables.length) {
      toast({
        variant: "destructive",
        title: "Nenhuma tabela selecionada",
        description: "Selecione pelo menos uma tabela para limpar.",
      });
      return;
    }
    
    try {
      setIsPerformingCleanup(true);
      setOperationResult(null);
      
      // Fazer chamada para a API de limpeza
      const response = await apiRequest("/api/database/cleanup", {
        method: "POST",
        data: {
          tables: selectedTables,
        },
      });
      
      // Invalidar todos os caches
      queryClient.invalidateQueries();
      
      // Exibir confirmação
      setOperationResult({
        success: true,
        message: \`As seguintes tabelas foram limpas com sucesso: \${selectedTables.join(", ")}\`,
        timestamp: response.timestamp,
      });
      
      toast({
        title: "Limpeza concluída",
        description: \`\${selectedTables.length} tabela(s) foram limpas com sucesso.\`,
      });
      
      // Resetar seleção
      setSelectedTables([]);
    } catch (error) {
      console.error("Erro ao limpar tabelas:", error);
      setOperationResult({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao limpar tabelas do banco de dados",
      });
      
      toast({
        variant: "destructive",
        title: "Erro ao limpar tabelas",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao limpar as tabelas selecionadas.",
      });
    } finally {
      setIsPerformingCleanup(false);
    }
  };

  // Função para processar o arquivo de backup selecionado
  const handleBackupFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadedBackupFile(file);
    setBackupData(null);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          setBackupData(parsed);
        } catch (error) {
          console.error("Erro ao processar arquivo de backup:", error);
          toast({
            variant: "destructive",
            title: "Arquivo inválido",
            description: "O arquivo selecionado não é um backup válido.",
          });
          setUploadedBackupFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  // Função para restaurar o banco de dados a partir do backup
  const handleRestoreBackup = async () => {
    if (!backupData) {
      toast({
        variant: "destructive",
        title: "Nenhum backup selecionado",
        description: "Selecione um arquivo de backup para restaurar.",
      });
      return;
    }
    
    try {
      setIsPerformingRestore(true);
      setOperationResult(null);
      
      // Fazer chamada para a API de restauração
      const response = await apiRequest("/api/database/restore", {
        method: "POST",
        data: {
          backup: backupData,
        },
      });
      
      // Invalidar todos os caches
      queryClient.invalidateQueries();
      
      // Exibir confirmação
      setOperationResult({
        success: true,
        message: "Banco de dados restaurado com sucesso a partir do backup.",
        timestamp: response.timestamp,
      });
      
      toast({
        title: "Restauração concluída",
        description: "O banco de dados foi restaurado com sucesso.",
      });
      
      // Limpar dados do backup
      setUploadedBackupFile(null);
      setBackupData(null);
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      setOperationResult({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao restaurar banco de dados",
      });
      
      toast({
        variant: "destructive",
        title: "Erro ao restaurar backup",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao restaurar o banco de dados.",
      });
    } finally {
      setIsPerformingRestore(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gerenciamento do Banco de Dados
        </CardTitle>
        <CardDescription>
          Ferramentas para backup, restauração e limpeza do banco de dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="backup" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="backup">
              <Download className="h-4 w-4 mr-2" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="restore">
              <UploadCloud className="h-4 w-4 mr-2" />
              Restaurar
            </TabsTrigger>
            <TabsTrigger value="cleanup">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de Backup */}
          <TabsContent value="backup" className="space-y-4">
            <Alert className="bg-blue-50/50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Info className="h-4 w-4" />
              <AlertTitle>Sobre o Backup</AlertTitle>
              <AlertDescription>
                Esta ferramenta gera um arquivo JSON contendo todos os dados do banco de dados.
                O arquivo pode ser usado posteriormente para restaurar o sistema.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <Button 
                onClick={handleGenerateBackup}
                disabled={isGeneratingBackup}
                className="w-full"
              >
                {isGeneratingBackup ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Gerando Backup...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar Backup Completo
                  </>
                )}
              </Button>
              
              {operationResult && operationResult.success && (
                <Alert variant="success" className="bg-green-50/50 dark:bg-green-950/50 text-green-600 dark:text-green-400 mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Operação bem-sucedida</AlertTitle>
                  <AlertDescription>
                    {operationResult.message}
                    {operationResult.timestamp && (
                      <div className="text-xs mt-1 text-green-500 dark:text-green-300">
                        {new Date(operationResult.timestamp).toLocaleString()}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {operationResult && !operationResult.success && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {operationResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          {/* Aba de Restauração */}
          <TabsContent value="restore" className="space-y-4">
            <Alert variant="warning" className="bg-yellow-50/50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                A restauração irá substituir TODOS os dados atuais pelos dados do backup.
                Esta operação não pode ser desfeita.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="backup-file">Arquivo de Backup</Label>
                <input
                  id="backup-file"
                  type="file"
                  accept=".json"
                  onChange={handleBackupFileChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
                />
              </div>
              
              {uploadedBackupFile && backupData && (
                <div className="p-3 border rounded-md">
                  <h4 className="text-sm font-medium mb-1">Informações do Backup</h4>
                  <div className="text-xs text-muted-foreground">
                    <div>Nome: {uploadedBackupFile.name}</div>
                    <div>Tamanho: {(uploadedBackupFile.size / 1024).toFixed(2)} KB</div>
                    {backupData.metadata && (
                      <>
                        <div>Data: {new Date(backupData.metadata.timestamp).toLocaleString()}</div>
                        <div>Versão: {backupData.metadata.version}</div>
                        <div>Tabelas: {backupData.metadata.tableCount}</div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!backupData || isPerformingRestore}
                    variant="destructive"
                    className="w-full"
                  >
                    {isPerformingRestore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Restaurando...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Restaurar Banco de Dados
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá substituir TODOS os dados atuais pelos dados do backup.
                      A operação não pode ser desfeita.
                      <div className="mt-2 font-semibold">Deseja continuar?</div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestoreBackup}>
                      Confirmar Restauração
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {operationResult && operationResult.success && (
                <Alert variant="success" className="bg-green-50/50 dark:bg-green-950/50 text-green-600 dark:text-green-400 mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Operação bem-sucedida</AlertTitle>
                  <AlertDescription>
                    {operationResult.message}
                    {operationResult.timestamp && (
                      <div className="text-xs mt-1 text-green-500 dark:text-green-300">
                        {new Date(operationResult.timestamp).toLocaleString()}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {operationResult && !operationResult.success && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {operationResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          {/* Aba de Limpeza */}
          <TabsContent value="cleanup" className="space-y-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Aviso de Segurança</AlertTitle>
              <AlertDescription>
                Esta operação irá remover permanentemente os dados das tabelas selecionadas.
                É recomendável fazer um backup antes de prosseguir.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableTables.map((table) => (
                  <div 
                    key={table.id}
                    className={`flex items-center space-x-2 p-2 rounded-md border ${
                      sensitiveTables.includes(table.id) 
                        ? "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/30" 
                        : ""
                    }`}
                  >
                    <Checkbox
                      id={`table-${table.id}`}
                      checked={selectedTables.includes(table.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTables([...selectedTables, table.id]);
                        } else {
                          setSelectedTables(selectedTables.filter(t => t !== table.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`table-${table.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center"
                    >
                      <span className="mr-1">{table.icon}</span> {table.label}
                      {sensitiveTables.includes(table.id) && (
                        <span className="ml-1 text-yellow-500 dark:text-yellow-400 text-xs">⚠️</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTables(availableTables.map(t => t.id))}
                >
                  Selecionar Todas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTables([])}
                >
                  Limpar Seleção
                </Button>
              </div>
              
              <Separator className="my-4" />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={selectedTables.length === 0 || isPerformingCleanup}
                    variant="destructive"
                    className="w-full"
                  >
                    {isPerformingCleanup ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Limpando Dados...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpar Tabelas Selecionadas ({selectedTables.length})
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Limpeza de Dados</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover PERMANENTEMENTE todos os dados das seguintes tabelas:
                      <ul className="list-disc list-inside mt-2 mb-2">
                        {selectedTables.map(tableId => {
                          const table = availableTables.find(t => t.id === tableId);
                          return (
                            <li key={tableId} className="text-sm">
                              {table?.icon} {table?.label || tableId}
                              {sensitiveTables.includes(tableId) && (
                                <span className="ml-1 text-yellow-500 dark:text-yellow-400">⚠️</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-2 font-semibold">Esta operação não pode ser desfeita. Deseja continuar?</div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCleanupTables}>
                      Confirmar Limpeza
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {operationResult && operationResult.success && (
                <Alert variant="success" className="bg-green-50/50 dark:bg-green-950/50 text-green-600 dark:text-green-400 mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Operação bem-sucedida</AlertTitle>
                  <AlertDescription>
                    {operationResult.message}
                    {operationResult.timestamp && (
                      <div className="text-xs mt-1 text-green-500 dark:text-green-300">
                        {new Date(operationResult.timestamp).toLocaleString()}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {operationResult && !operationResult.success && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>
                    {operationResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}