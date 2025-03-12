import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarDays, 
  UserCog, 
  AlertTriangle, 
  CheckCircle2 
} from "lucide-react";
import { type Activity } from "@shared/schema";

interface RecentActivityProps {
  activities?: Activity[];
  isLoading: boolean;
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  // Function to get the icon for each activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "reservation_created":
      case "reservation_updated":
      case "reservation_deleted":
        return (
          <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center ring-8 ring-white">
            <CalendarDays className="h-5 w-5 text-primary-600" />
          </div>
        );
      case "owner_created":
      case "owner_updated":
      case "owner_deleted":
        return (
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center ring-8 ring-white">
            <UserCog className="h-5 w-5 text-blue-600" />
          </div>
        );
      case "maintenance_requested":
        return (
          <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center ring-8 ring-white">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
        );
      case "cleaning_completed":
        return (
          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center ring-8 ring-white">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-secondary-50 flex items-center justify-center ring-8 ring-white">
            <CalendarDays className="h-5 w-5 text-secondary-600" />
          </div>
        );
    }
  };

  // Function to get the title for each activity type
  const getActivityTitle = (type: string) => {
    switch (type) {
      case "reservation_created":
        return "Nova reserva processada";
      case "reservation_updated":
        return "Reserva atualizada";
      case "reservation_deleted":
        return "Reserva cancelada";
      case "owner_created":
        return "Novo proprietário";
      case "owner_updated":
        return "Proprietário atualizado";
      case "owner_deleted":
        return "Proprietário removido";
      case "property_created":
        return "Nova propriedade";
      case "property_updated":
        return "Propriedade atualizada";
      case "property_deleted":
        return "Propriedade removida";
      case "maintenance_requested":
        return "Alerta de manutenção";
      case "cleaning_completed":
        return "Limpeza concluída";
      case "pdf_processed":
        return "PDF processado";
      default:
        return "Atividade registrada";
    }
  };

  return (
    <Card className="bg-white shadow">
      <CardHeader className="px-4 py-5 sm:px-6">
        <CardTitle className="text-lg leading-6 font-medium text-secondary-900">
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="flow-root px-4 py-3 sm:px-6">
        {isLoading ? (
          <ActivitySkeleton />
        ) : (
          <ul role="list" className="-mb-8">
            {activities && activities.length > 0 ? (
              activities.map((activity, idx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {idx < activities.length - 1 && (
                      <span 
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-secondary-200" 
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-secondary-900">
                              {getActivityTitle(activity.type)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-secondary-500">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-secondary-700">
                          <p>{activity.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="text-center py-8">
                <p className="text-sm text-secondary-500">Nenhuma atividade recente encontrada</p>
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <ul role="list" className="-mb-8">
      {[0, 1, 2, 3].map((item) => (
        <li key={item}>
          <div className="relative pb-8">
            {item < 3 && (
              <span 
                className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-secondary-200" 
                aria-hidden="true"
              />
            )}
            <div className="relative flex items-start space-x-3">
              <div className="relative">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div>
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-32 mb-2" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
