import { useState } from "react";
import { useProperties, useDeleteProperty } from "@/hooks/use-properties";
import { useOwners } from "@/hooks/use-owners";
import { useLocation, Link } from "wouter";
import { PlusCircle } from "lucide-react";
import { InspirationQuote } from "@/components/ui/inspiration-quote";
import { ErrorBoundary, FeatureErrorFallback } from "@/shared/components/ErrorBoundary";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PropertiesVirtualTable } from "@/features/properties/components/PropertiesVirtualTable";

function PropertiesPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);

  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: owners } = useOwners();
  const deleteProperty = useDeleteProperty();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const filteredProperties = properties?.filter(property => 
    property.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteProperty = async () => {
    if (propertyToDelete !== null) {
      try {
        await deleteProperty.mutateAsync(propertyToDelete);
        toast({
          title: "Propriedade excluída",
          description: "A propriedade foi excluída com sucesso.",
        });
        setPropertyToDelete(null);
      } catch (error) {
        toast({
          title: "Erro ao excluir propriedade",
          description: "Ocorreu um erro ao excluir a propriedade.",
          variant: "destructive",
        });
      }
    }
  };

  const getOwnerName = (ownerId: number) => {
    const owner = owners?.find(owner => owner.id === ownerId);
    return owner ? owner.name : "Proprietário não encontrado";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Propriedades</h2>
        <div className="mt-4 sm:mt-0">
          <div onClick={() => setLocation("/properties/edit")}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Propriedade
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mensagem inspiradora */}
      <InspirationQuote 
        context="properties" 
        variant="highlight" 
        rotating={true} 
        rotationInterval={15000} 
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Gerenciar Propriedades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar propriedades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {isLoadingProperties ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <PropertiesVirtualTable
              properties={filteredProperties}
              getOwnerName={getOwnerName}
              onPropertyClick={(id) => setLocation(`/properties/${id}`)}
              onPropertyEdit={(id) => setLocation(`/properties/edit/${id}`)}
              onPropertyDelete={(id) => setPropertyToDelete(id)}
            />
          ) : (
            <div className="text-center py-12 border rounded-md">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhuma propriedade encontrada." : "Nenhuma propriedade cadastrada."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={propertyToDelete !== null} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta propriedade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Wrap the page with error boundary for better error handling
export default function PropertiesPage() {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary
      fallback={
        <FeatureErrorFallback
          feature="Propriedades"
          onReset={() => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            queryClient.invalidateQueries({ queryKey: ['owners'] });
            window.location.reload();
          }}
        />
      }
    >
      <PropertiesPageContent />
    </ErrorBoundary>
  );
}
