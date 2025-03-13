import { useState } from "react";
import { useProperties, useDeleteProperty } from "@/hooks/use-properties";
import { useOwners } from "@/hooks/use-owners";
import { useLocation, Link } from "wouter";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PropertiesPage() {
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
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Custo Limpeza</TableHead>
                    <TableHead>Taxa Check-in</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Equipe Limpeza</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties && filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          <div onClick={() => setLocation(`/properties/${property.id}`)}>
                            <span className="text-primary-600 hover:underline cursor-pointer">
                              {property.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getOwnerName(property.ownerId)}</TableCell>
                        <TableCell>{formatCurrency(Number(property.cleaningCost))}</TableCell>
                        <TableCell>{formatCurrency(Number(property.checkInFee))}</TableCell>
                        <TableCell>{Number(property.commission)}%</TableCell>
                        <TableCell>{property.cleaningTeam}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <div 
                                  className="cursor-pointer flex items-center px-2 py-1.5 text-sm"
                                  onClick={() => setLocation(`/properties/${property.id}`)}
                                >
                                  <span className="flex items-center w-full">
                                    Ver detalhes
                                  </span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <div 
                                  className="cursor-pointer flex items-center px-2 py-1.5 text-sm"
                                  onClick={() => setLocation(`/properties/edit/${property.id}`)}
                                >
                                  <span className="flex items-center w-full">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <div 
                                  className="cursor-pointer flex items-center px-2 py-1.5 text-sm text-red-600"
                                  onClick={() => setPropertyToDelete(property.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        {searchTerm ? "Nenhuma propriedade encontrada." : "Nenhuma propriedade cadastrada."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
