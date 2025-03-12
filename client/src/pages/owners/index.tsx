import { useState } from "react";
import { useOwners, useDeleteOwner } from "@/hooks/use-owners";
import { Link } from "wouter";
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
import { useToast } from "@/hooks/use-toast";

export default function OwnersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerToDelete, setOwnerToDelete] = useState<number | null>(null);
  
  const { data: owners, isLoading } = useOwners();
  const deleteOwner = useDeleteOwner();
  const { toast } = useToast();

  const filteredOwners = owners?.filter(owner => 
    owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (owner.company && owner.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (owner.taxId && owner.taxId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (owner.email && owner.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteOwner = async () => {
    if (ownerToDelete !== null) {
      try {
        await deleteOwner.mutateAsync(ownerToDelete);
        toast({
          title: "Proprietário excluído",
          description: "O proprietário foi excluído com sucesso.",
        });
        setOwnerToDelete(null);
      } catch (error) {
        toast({
          title: "Erro ao excluir proprietário",
          description: "Ocorreu um erro ao excluir o proprietário.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-secondary-900">Proprietários</h2>
        <div className="mt-4 sm:mt-0">
          <Link href="/owners/edit">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Proprietário
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Gerenciar Proprietários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar proprietários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {isLoading ? (
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
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contribuinte</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOwners && filteredOwners.length > 0 ? (
                    filteredOwners.map((owner) => (
                      <TableRow key={owner.id}>
                        <TableCell className="font-medium">
                          <Link href={`/owners/${owner.id}`}>
                            <a className="text-primary-600 hover:underline">
                              {owner.name}
                            </a>
                          </Link>
                        </TableCell>
                        <TableCell>{owner.company || "-"}</TableCell>
                        <TableCell>{owner.taxId || "-"}</TableCell>
                        <TableCell>{owner.email || "-"}</TableCell>
                        <TableCell>{owner.phone || "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/owners/${owner.id}`}>
                                <DropdownMenuItem>
                                  <Button variant="ghost" className="p-0 h-auto w-full justify-start">
                                    Ver detalhes
                                  </Button>
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/owners/edit/${owner.id}`}>
                                <DropdownMenuItem>
                                  <Button variant="ghost" className="p-0 h-auto w-full justify-start">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Button>
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem>
                                <Button 
                                  variant="ghost" 
                                  className="p-0 h-auto w-full justify-start text-red-600"
                                  onClick={() => setOwnerToDelete(owner.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </Button>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        {searchTerm ? "Nenhum proprietário encontrado." : "Nenhum proprietário cadastrado."}
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
      <AlertDialog open={ownerToDelete !== null} onOpenChange={(open) => !open && setOwnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este proprietário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOwner} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
