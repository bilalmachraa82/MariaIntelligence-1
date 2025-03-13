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
          <div className="h-10 w-10 rounded-full primary-gradient flex items-center justify-center ring-4 ring-maria-primary-light shadow-md">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
        );
      case "owner_created":
      case "owner_updated":
      case "owner_deleted":
        return (
          <div className="h-10 w-10 rounded-full accent-gradient flex items-center justify-center ring-4 ring-white shadow-md">
            <UserCog className="h-5 w-5 text-maria-dark" />
          </div>
        );
      case "maintenance_requested":
        return (
          <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center ring-4 ring-white shadow-md">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
        );
      case "cleaning_completed":
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center ring-4 ring-white shadow-md">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        );
      case "assistant_chat":
        return (
          <div className="h-10 w-10 rounded-full card-gradient flex items-center justify-center ring-4 ring-white shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.7274 20.4471C19.2716 19.1713 18.2672 18.0439 16.8701 17.2399C15.4729 16.4358 13.7611 16 12 16C10.2389 16 8.52706 16.4358 7.12991 17.2399C5.73276 18.0439 4.72839 19.1713 4.27259 20.4471" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="8" r="4" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full card-gradient flex items-center justify-center ring-4 ring-white shadow-md">
            <CalendarDays className="h-5 w-5 text-maria-dark" />
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
    <div className="rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-maria-primary to-maria-accent p-0.5">
        <div className="bg-white rounded-lg">
          <div className="px-5 py-4 border-b border-maria-primary-light">
            <h3 className="text-xl font-bold text-maria-dark flex items-center">
              <span className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </span>
              Atividade Recente
            </h3>
          </div>
          <div className="flow-root px-5 py-4">
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
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-maria-primary-light" 
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
                                <span className="font-bold text-maria-dark">
                                  {getActivityTitle(activity.type)}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs font-medium text-maria-gray">
                                {formatDateTime(activity.createdAt)}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-maria-dark">
                              <p>{activity.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center py-8">
                    <div className="rounded-lg bg-maria-primary-light p-4">
                      <p className="text-sm text-maria-dark">Nenhuma atividade recente encontrada</p>
                    </div>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
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
