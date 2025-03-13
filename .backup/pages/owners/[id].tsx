import { useParams, Link, useLocation } from "wouter";
import { useOwner } from "@/hooks/use-owners";
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  FileText, 
  Home 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperties } from "@/hooks/use-properties";

export default function OwnerDetailPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  
  const ownerId = id ? parseInt(id) : undefined;
  const { data: owner, isLoading: isLoadingOwner } = useOwner(ownerId);
  const { data: allProperties, isLoading: isLoadingProperties } = useProperties();

  if (isLoadingOwner) {
    return <OwnerDetailSkeleton />;
  }

  if (!owner) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Proprietário não encontrado</h2>
        <p className="text-secondary-600 mb-6">O proprietário que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate("/owners")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Proprietários
        </Button>
      </div>
    );
  }

  // Filter properties owned by this owner
  const ownerProperties = allProperties?.filter(property => property.ownerId === owner.id) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/owners")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-secondary-900">{owner.name}</h2>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href={`/owners/edit/${owner.id}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar Proprietário
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Owner details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Dados do Proprietário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {owner.company && (
                  <div className="flex items-start">
                    <Building className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700">Empresa</h3>
                      <p className="text-secondary-900">{owner.company}</p>
                    </div>
                  </div>
                )}
                
                {owner.taxId && (
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700">Contribuinte</h3>
                      <p className="text-secondary-900">{owner.taxId}</p>
                    </div>
                  </div>
                )}
                
                {owner.email && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700">Email</h3>
                      <p className="text-secondary-900">
                        <a href={`mailto:${owner.email}`} className="text-primary-600 hover:underline">
                          {owner.email}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {owner.phone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700">Telefone</h3>
                      <p className="text-secondary-900">
                        <a href={`tel:${owner.phone}`} className="text-primary-600 hover:underline">
                          {owner.phone}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
                
                {owner.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-secondary-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700">Morada</h3>
                      <p className="text-secondary-900">{owner.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties owned */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Propriedades</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProperties ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : ownerProperties.length > 0 ? (
              <ul className="space-y-2">
                {ownerProperties.map(property => (
                  <li key={property.id} className="flex items-center p-2 hover:bg-secondary-50 rounded-md">
                    <Home className="h-5 w-5 text-secondary-500 mr-2" />
                    <Link href={`/properties/${property.id}`}>
                      <a className="text-primary-600 hover:underline">
                        {property.name}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <Home className="h-10 w-10 mx-auto text-secondary-300 mb-2" />
                <p className="text-secondary-500">
                  Este proprietário não possui propriedades cadastradas.
                </p>
                <Link href="/properties/edit">
                  <Button variant="outline" className="mt-4">
                    Adicionar Propriedade
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OwnerDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-32 mt-4 md:mt-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
