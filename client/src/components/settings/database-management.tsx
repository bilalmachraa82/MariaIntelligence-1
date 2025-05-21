import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Database, Download, Trash2, RefreshCw, FileDown, HardDrive } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

/**
 * Componente para gerenciamento do banco de dados, incluindo:
 * - Backup completo (exportação)
 * - Limpeza seletiva de dados
 * - Restauração de dados
 */
export function DatabaseManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [isPerformingCleanup, setIsPerformingCleanup] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [openCleanupDialog, setOpenCleanupDialog] = useState(false);

  // Função para criação de backup do banco de dados
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      
      const response = await apiRequest('/api/database/backup', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      
      if (response.success) {
        // Criar link para download automático
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        
        link.href = url;
        link.setAttribute('download', `maria-faz-backup-${date}.json`);
        document.body.appendChild(link);
        link.click();
        
        // Limpar o objeto URL após o download
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 100);
        
        toast({
          title: t('settings.database.backupSuccess'),
          description: t('settings.database.backupSuccessDesc'),
        });
      } else {
        throw new Error(response.message || 'Erro ao criar backup');
      }
    } catch (error) {
      console.error('Erro ao criar backup do banco de dados:', error);
      toast({
        title: t('settings.database.backupError'),
        description: t('settings.database.backupErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };
  
  // Função para lidar com a seleção de arquivos para restauração
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };
  
  // Função para restauração de backup
  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      toast({
        title: t('settings.database.noFileSelected'),
        description: t('settings.database.selectBackupFile'),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsRestoringBackup(true);
      
      // Leitura do arquivo
      const fileContent = await selectedFile.text();
      let backupData;
      
      try {
        backupData = JSON.parse(fileContent);
      } catch (error) {
        throw new Error('Formato de arquivo inválido');
      }
      
      // Envio para API
      const response = await apiRequest('/api/database/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: backupData }),
      });
      
      if (response.success) {
        toast({
          title: t('settings.database.restoreSuccess'),
          description: t('settings.database.restoreSuccessDesc'),
        });
        
        // Fechar diálogo e redefinir arquivo
        setOpenRestoreDialog(false);
        setSelectedFile(null);
        
        // Pequeno tempo de espera antes do reload para permitir que o toast seja visto
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.message || 'Erro ao restaurar backup');
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: t('settings.database.restoreError'),
        description: typeof error === 'object' && error !== null 
          ? (error as Error).message 
          : t('settings.database.restoreErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsRestoringBackup(false);
    }
  };
  
  // Função para limpeza do banco de dados
  const handleCleanupDatabase = async (cleanupType: 'all' | 'reservations' | 'financial' | 'activities') => {
    try {
      setIsPerformingCleanup(true);
      
      const response = await apiRequest('/api/database/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: cleanupType }),
      });
      
      if (response.success) {
        toast({
          title: t('settings.database.cleanupSuccess'),
          description: t('settings.database.cleanupSuccessDesc'),
        });
        
        // Fechar diálogo
        setOpenCleanupDialog(false);
        
        // Reload após um breve atraso para permitir que o usuário veja o toast
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(response.message || 'Erro ao limpar banco de dados');
      }
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      toast({
        title: t('settings.database.cleanupError'),
        description: typeof error === 'object' && error !== null 
          ? (error as Error).message 
          : t('settings.database.cleanupErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsPerformingCleanup(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Database className="mr-2 h-5 w-5" /> 
          {t('settings.database.title')}
        </CardTitle>
        <CardDescription>{t('settings.database.description')}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="backup">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup">
              <Download className="h-4 w-4 mr-2" /> 
              {t('settings.database.backupTab')}
            </TabsTrigger>
            <TabsTrigger value="restore">
              <FileDown className="h-4 w-4 mr-2" /> 
              {t('settings.database.restoreTab')}
            </TabsTrigger>
            <TabsTrigger value="cleanup">
              <Trash2 className="h-4 w-4 mr-2" /> 
              {t('settings.database.cleanupTab')}
            </TabsTrigger>
          </TabsList>
          
          {/* Tab de Backup */}
          <TabsContent value="backup" className="mt-4 space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950">
              <HardDrive className="h-4 w-4" />
              <AlertTitle>{t('settings.database.backupInfoTitle')}</AlertTitle>
              <AlertDescription>
                {t('settings.database.backupInfoDesc')}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center mt-4">
              <Button 
                size="lg" 
                onClick={handleCreateBackup} 
                disabled={isCreatingBackup}
                className="w-full sm:w-auto"
              >
                {isCreatingBackup ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('settings.database.creatingBackup')}</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" /> {t('settings.database.createBackup')}</>
                )}
              </Button>
            </div>
          </TabsContent>
          
          {/* Tab de Restauração */}
          <TabsContent value="restore" className="mt-4 space-y-4">
            <Alert className="bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('settings.database.restoreWarningTitle')}</AlertTitle>
              <AlertDescription>
                {t('settings.database.restoreWarningDesc')}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center mt-4">
              <Dialog open={openRestoreDialog} onOpenChange={setOpenRestoreDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> 
                    {t('settings.database.restoreFromBackup')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('settings.database.restoreDialogTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('settings.database.restoreDialogDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex flex-col space-y-4 py-4">
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-950">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('settings.database.restoreAlertTitle')}</AlertTitle>
                      <AlertDescription>
                        {t('settings.database.restoreAlertDesc')}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium">{t('settings.database.selectBackup')}</label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="border rounded p-2 w-full"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          {t('settings.database.selectedFile')}: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpenRestoreDialog(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRestoreBackup}
                      disabled={isRestoringBackup || !selectedFile}
                    >
                      {isRestoringBackup ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('settings.database.restoringBackup')}</>
                      ) : (
                        <>{t('settings.database.confirmRestore')}</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
          
          {/* Tab de Limpeza */}
          <TabsContent value="cleanup" className="mt-4 space-y-4">
            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('settings.database.cleanupWarningTitle')}</AlertTitle>
              <AlertDescription>
                {t('settings.database.cleanupWarningDesc')}
              </AlertDescription>
            </Alert>

            <div className="flex justify-center mt-4">
              <Dialog open={openCleanupDialog} onOpenChange={setOpenCleanupDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> 
                    {t('settings.database.cleanupDatabase')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('settings.database.cleanupDialogTitle')}</DialogTitle>
                    <DialogDescription>
                      {t('settings.database.cleanupDialogDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex flex-col space-y-4 py-4">
                    <Alert variant="destructive" className="bg-red-50 dark:bg-red-950">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('settings.database.cleanupAlertTitle')}</AlertTitle>
                      <AlertDescription>
                        {t('settings.database.cleanupAlertDesc')}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleCleanupDatabase('reservations')}
                        disabled={isPerformingCleanup}
                      >
                        <span className="text-lg font-medium">{t('settings.database.cleanupReservations')}</span>
                        <span className="text-xs text-muted-foreground text-center">
                          {t('settings.database.cleanupReservationsDesc')}
                        </span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleCleanupDatabase('financial')}
                        disabled={isPerformingCleanup}
                      >
                        <span className="text-lg font-medium">{t('settings.database.cleanupFinancial')}</span>
                        <span className="text-xs text-muted-foreground text-center">
                          {t('settings.database.cleanupFinancialDesc')}
                        </span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleCleanupDatabase('activities')}
                        disabled={isPerformingCleanup}
                      >
                        <span className="text-lg font-medium">{t('settings.database.cleanupActivities')}</span>
                        <span className="text-xs text-muted-foreground text-center">
                          {t('settings.database.cleanupActivitiesDesc')}
                        </span>
                      </Button>
                      
                      <Button
                        variant="destructive"
                        className="h-24 flex flex-col items-center justify-center space-y-2"
                        onClick={() => handleCleanupDatabase('all')}
                        disabled={isPerformingCleanup}
                      >
                        <span className="text-lg font-medium">{t('settings.database.cleanupAll')}</span>
                        <span className="text-xs text-center">
                          {t('settings.database.cleanupAllDesc')}
                        </span>
                      </Button>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpenCleanupDialog(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4 bg-muted/30">
        <div className="text-xs text-muted-foreground">
          {t('settings.database.footerNote')}
        </div>
      </CardFooter>
    </Card>
  );
}