import { apiRequest } from "./queryClient";
import { z } from "zod";
import { format, addDays, subDays } from "date-fns";
import { 
  reservationStatusEnum, 
  reservationPlatformEnum,
} from "../../shared/schema";

// Tipos para validação de dados
const demoPropertySchema = z.object({
  name: z.string(),
  ownerId: z.number(),
  cleaningCost: z.string().optional(),
  checkInFee: z.string().optional(),
  commission: z.string().optional(),
  teamPayment: z.string().optional(),
  cleaningTeam: z.string().optional(),
  active: z.boolean().optional(),
  monthlyFixedCost: z.string().optional(),
  cleaningTeamId: z.number().nullable().optional(),
});

const demoOwnerSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().nullable().optional(),
  taxId: z.string().optional(),
});

const demoReservationSchema = z.object({
  propertyId: z.number(),
  guestName: z.string(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  numGuests: z.number().optional(),
  totalAmount: z.string(),
  platform: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  platformFee: z.string().optional(),
  cleaningFee: z.string().optional(),
  checkInFee: z.string().optional(),
  commissionFee: z.string().optional(),
  teamPayment: z.string().optional(),
  netAmount: z.string().optional()
});

type DemoProperty = z.infer<typeof demoPropertySchema>;
type DemoOwner = z.infer<typeof demoOwnerSchema>;
type DemoReservation = z.infer<typeof demoReservationSchema>;

// Dados de exemplo
const propertyNames = [
  "Apartamento Avenidas Novas",
  "Casa do Jardim Estrela",
  "Studio Campo de Ourique",
  "Loft Alfama",
  "Apartamento Príncipe Real",
  "Villa Cascais",
  "Duplex Belém",
  "Penthouse Parque das Nações"
];

const ownerNames = [
  "António Silva",
  "Maria Sousa",
  "João Ribeiro",
  "Ana Pereira",
  "Francisco Costa",
  "Margarida Santos",
  "Luís Oliveira",
  "Sofia Martins"
];

const guestNames = [
  "John Smith",
  "Emma Johnson",
  "Michael Brown",
  "Sophie Davis",
  "David Miller",
  "Julia Wilson",
  "Robert Moore",
  "Laura Taylor",
  "Thomas Anderson",
  "Olivia Martinez"
];

// Geração de dados aleatórios
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Gerar proprietários demo
export async function generateDemoOwners(count: number = 3): Promise<number[]> {
  const createdIds: number[] = [];
  
  try {
    for (let i = 0; i < count; i++) {
      const name = `${ownerNames[i % ownerNames.length]} [DEMO]`;
      const firstName = name.split(' ')[0].toLowerCase();
      
      const owner: DemoOwner = {
        name: name,
        email: `${firstName}.demo${randomInt(100, 999)}@example.com`,
        phone: `+351 9${randomInt(1, 6)}${randomInt(1000000, 9999999)}`,
        address: `Rua da Demo ${randomInt(1, 100)}, Lisboa`,
        company: Math.random() > 0.3 ? `Imobiliária Demo ${i+1}` : null,
        taxId: `${randomInt(100000000, 999999999)}`,
      };
      
      const response = await apiRequest('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(owner),
      });
      
      if (response && response.id) {
        createdIds.push(response.id);
        
        // Criar atividade
        await apiRequest('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'owner_added',
            description: `Novo proprietário demo adicionado: ${owner.name}`,
            entityId: response.id,
            entityType: 'owner',
          }),
        });
      }
    }
    
    return createdIds;
  } catch (error) {
    console.error('Erro ao gerar proprietários demo:', error);
    return [];
  }
}

// Gerar propriedades demo
export async function generateDemoProperties(ownerIds: number[], count: number = 5): Promise<number[]> {
  const createdIds: number[] = [];
  
  if (ownerIds.length === 0) {
    console.error('Não é possível criar propriedades sem proprietários');
    return [];
  }
  
  try {
    for (let i = 0; i < count; i++) {
      const ownerId = randomChoice(ownerIds);
      const baseCosts = {
        cleaningCost: (randomFloat(30, 60)).toFixed(2),
        checkInFee: (randomFloat(15, 35)).toFixed(2),
        commission: (randomFloat(10, 20)).toFixed(2),
      };
      
      const property: DemoProperty = {
        name: `${propertyNames[i % propertyNames.length]} [DEMO]`,
        ownerId: ownerId,
        cleaningCost: baseCosts.cleaningCost,
        checkInFee: baseCosts.checkInFee,
        commission: baseCosts.commission,
        teamPayment: (parseFloat(baseCosts.cleaningCost) * 0.7).toFixed(2),
        cleaningTeam: 'Equipa Maria',
        active: true,
        monthlyFixedCost: (randomFloat(50, 150)).toFixed(2),
        cleaningTeamId: null,
      };
      
      const response = await apiRequest('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(property),
      });
      
      if (response && response.id) {
        createdIds.push(response.id);
        
        // Criar atividade
        await apiRequest('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'property_added',
            description: `Nova propriedade demo adicionada: ${property.name}`,
            entityId: response.id,
            entityType: 'property',
          }),
        });
      }
    }
    
    return createdIds;
  } catch (error) {
    console.error('Erro ao gerar propriedades demo:', error);
    return [];
  }
}

// Gerar reservas demo
export async function generateDemoReservations(propertyIds: number[], count: number = 15): Promise<number[]> {
  const createdIds: number[] = [];
  
  if (propertyIds.length === 0) {
    console.error('Não é possível criar reservas sem propriedades');
    return [];
  }
  
  try {
    // Obter detalhes das propriedades para usar valores reais
    const properties = [];
    for (const id of propertyIds) {
      const property = await apiRequest(`/api/properties/${id}`);
      if (property) {
        properties.push(property);
      }
    }
    
    if (properties.length === 0) {
      console.error('Não foi possível obter detalhes das propriedades');
      return [];
    }
    
    const now = new Date();
    const platforms = ["Airbnb", "Booking.com", "VRBO", "Direct"];
    const statuses = ["confirmed", "completed", "cancelled", "in_progress"];
    
    for (let i = 0; i < count; i++) {
      const property = randomChoice(properties);
      
      // Gerar datas aleatórias
      let checkInDate, checkOutDate;
      
      if (i % 3 === 0) {
        // Reserva passada
        checkInDate = subDays(now, randomInt(30, 180));
        checkOutDate = addDays(checkInDate, randomInt(2, 10));
      } else if (i % 3 === 1) {
        // Reserva atual ou próxima
        checkInDate = addDays(now, randomInt(-7, 15));
        checkOutDate = addDays(checkInDate, randomInt(2, 10));
      } else {
        // Reserva futura
        checkInDate = addDays(now, randomInt(15, 180));
        checkOutDate = addDays(checkInDate, randomInt(2, 10));
      }
      
      // Gerar hóspede aleatório
      const guestName = `${randomChoice(guestNames)} [DEMO]`;
      const guestFirstName = guestName.split(' ')[0].toLowerCase();
      const guestEmail = `${guestFirstName}.demo${randomInt(100, 999)}@example.com`;
      const guestPhone = `+${randomInt(1, 99)} ${randomInt(100000000, 999999999)}`;
      
      // Gerar plataforma e status
      const platform = randomChoice(platforms);
      
      // Status baseado nas datas
      let status;
      if (checkOutDate < now) {
        status = 'completed';
      } else if (checkInDate > now) {
        status = 'confirmed';
      } else {
        status = 'in_progress';
      }
      
      // Cancelamento aleatório (aproximadamente 10%)
      if (Math.random() < 0.1) {
        status = 'cancelled';
      }
      
      // Calcular preços
      const basePricePerNight = randomInt(50, 150);
      const stayDurationDays = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const baseAmount = basePricePerNight * stayDurationDays;
      
      // Taxas da plataforma
      const platformFeePercent = platform === 'Direct' ? 0 : randomInt(5, 20);
      const platformFee = (baseAmount * platformFeePercent / 100).toFixed(2);
      
      // Usar os valores reais da propriedade
      const cleaningFee = property.cleaningCost || '45.00';
      const checkInFee = property.checkInFee || '25.00';
      const commissionFee = property.commission 
        ? (baseAmount * parseFloat(property.commission) / 100).toFixed(2) 
        : '0.00';
      const teamPayment = property.teamPayment || '30.00';
      
      // Total e valor líquido
      const totalAmount = (baseAmount + parseFloat(cleaningFee)).toFixed(2);
      const netAmount = (
        parseFloat(totalAmount) - 
        parseFloat(platformFee) - 
        parseFloat(checkInFee) - 
        parseFloat(commissionFee) - 
        parseFloat(teamPayment)
      ).toFixed(2);
      
      const reservation: DemoReservation = {
        propertyId: property.id,
        guestName: guestName,
        guestEmail: guestEmail,
        guestPhone: guestPhone,
        checkInDate: format(checkInDate, 'yyyy-MM-dd'),
        checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
        numGuests: randomInt(1, 6),
        totalAmount: totalAmount,
        platform: platform,
        status: status,
        notes: 'Reserva de demonstração criada automaticamente.',
        platformFee: platformFee,
        cleaningFee: cleaningFee,
        checkInFee: checkInFee,
        commissionFee: commissionFee,
        teamPayment: teamPayment,
        netAmount: netAmount,
      };
      
      const response = await apiRequest('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
      });
      
      if (response && response.id) {
        createdIds.push(response.id);
        
        // Criar atividade
        await apiRequest('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reservation_created',
            description: `Nova reserva demo: ${property.name} - ${guestName} (${format(checkInDate, 'dd/MM/yyyy')} - ${format(checkOutDate, 'dd/MM/yyyy')})`,
            entityId: response.id,
            entityType: 'reservation',
          }),
        });
      }
    }
    
    return createdIds;
  } catch (error) {
    console.error('Erro ao gerar reservas demo:', error);
    return [];
  }
}

// Gerar atividades extras
export async function generateDemoActivities(count: number = 10): Promise<number[]> {
  const createdIds: number[] = [];
  const activityTypes = ['system_login', 'report_generation', 'profile_update', 'message_sent'];
  const descriptions = {
    system_login: ['Usuário logou no sistema', 'Novo acesso ao sistema', 'Login detectado'],
    report_generation: ['Relatório mensal gerado', 'Relatório de proprietário gerado', 'Relatório financeiro exportado'],
    profile_update: ['Perfil atualizado', 'Informações de contato atualizadas', 'Senha alterada'],
    message_sent: ['Mensagem enviada para proprietário', 'Comunicação com hóspede', 'Notificação enviada'],
  };
  
  try {
    for (let i = 0; i < count; i++) {
      const type = randomChoice(activityTypes);
      const descriptionList = descriptions[type as keyof typeof descriptions];
      const description = `${randomChoice(descriptionList)} [DEMO]`;
      
      const response = await apiRequest('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          description: description,
          entityId: null,
          entityType: null,
        }),
      });
      
      if (response && response.id) {
        createdIds.push(response.id);
      }
    }
    
    return createdIds;
  } catch (error) {
    console.error('Erro ao gerar atividades demo:', error);
    return [];
  }
}

// Função principal para gerar todos os dados
export async function generateAllDemoData(
  options: {
    owners: boolean;
    properties: boolean;
    reservations: boolean;
    activities: boolean;
  } = {
    owners: true,
    properties: true,
    reservations: true,
    activities: true,
  }
): Promise<{ success: boolean; counts: { [key: string]: number } }> {
  try {
    const counts: { [key: string]: number } = {
      owners: 0,
      properties: 0,
      reservations: 0,
      activities: 0,
    };
    
    let ownerIds: number[] = [];
    let propertyIds: number[] = [];
    
    // Gerar dados na ordem correta
    if (options.owners) {
      ownerIds = await generateDemoOwners(3);
      counts.owners = ownerIds.length;
    }
    
    if (options.properties) {
      // Se não criamos proprietários, mas queremos criar propriedades,
      // buscar proprietários existentes
      if (ownerIds.length === 0) {
        const existingOwners = await apiRequest('/api/owners');
        if (existingOwners && existingOwners.length > 0) {
          ownerIds = existingOwners.map((o: any) => o.id);
        }
      }
      
      propertyIds = await generateDemoProperties(ownerIds, 5);
      counts.properties = propertyIds.length;
    }
    
    if (options.reservations) {
      // Se não criamos propriedades, mas queremos criar reservas,
      // buscar propriedades existentes
      if (propertyIds.length === 0) {
        const existingProperties = await apiRequest('/api/properties');
        if (existingProperties && existingProperties.length > 0) {
          propertyIds = existingProperties.map((p: any) => p.id);
        }
      }
      
      const reservationIds = await generateDemoReservations(propertyIds, 15);
      counts.reservations = reservationIds.length;
    }
    
    if (options.activities) {
      const activityIds = await generateDemoActivities(10);
      counts.activities = activityIds.length;
    }
    
    return {
      success: true,
      counts,
    };
  } catch (error) {
    console.error('Erro ao gerar dados de demonstração:', error);
    return {
      success: false,
      counts: { owners: 0, properties: 0, reservations: 0, activities: 0 },
    };
  }
}

// Lista de IDs de entidades demo para limpeza
function getDemoIds(): Promise<{ [key: string]: number[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simula busca de IDs - em uma implementação real, deveria buscar da API
      resolve({
        owners: [], 
        properties: [],
        reservations: [],
        activities: []
      });
    }, 500);
  });
}

// Função para remover entidades demo pelo ID
async function removeEntityById(
  entityType: string, 
  id: number
): Promise<boolean> {
  try {
    await apiRequest(`/api/${entityType}/${id}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error(`Erro ao remover ${entityType} com ID ${id}:`, error);
    return false;
  }
}

// Função para detectar entidades demo pelo nome
export async function findAndRemoveDemoEntities(): Promise<{
  success: boolean;
  removed: {
    owners: number;
    properties: number;
    reservations: number;
    activities: number;
  };
}> {
  try {
    const removed = {
      owners: 0,
      properties: 0,
      reservations: 0,
      activities: 0,
    };
    
    // Buscar todas as entidades
    const owners = await apiRequest('/api/owners');
    const properties = await apiRequest('/api/properties');
    const reservations = await apiRequest('/api/reservations');
    const activities = await apiRequest('/api/activities');
    
    // Filtrar entidades demo pelo nome
    const demoOwners = owners?.filter((o: any) => o.name?.includes('[DEMO]')) || [];
    const demoProperties = properties?.filter((p: any) => p.name?.includes('[DEMO]')) || [];
    const demoReservations = reservations?.filter((r: any) => r.guestName?.includes('[DEMO]')) || [];
    const demoActivities = activities?.filter((a: any) => a.description?.includes('[DEMO]')) || [];
    
    // Remover atividades primeiro
    for (const activity of demoActivities) {
      const success = await removeEntityById('activities', activity.id);
      if (success) removed.activities++;
    }
    
    // Remover reservas
    for (const reservation of demoReservations) {
      const success = await removeEntityById('reservations', reservation.id);
      if (success) removed.reservations++;
    }
    
    // Remover propriedades
    for (const property of demoProperties) {
      const success = await removeEntityById('properties', property.id);
      if (success) removed.properties++;
    }
    
    // Remover proprietários
    for (const owner of demoOwners) {
      const success = await removeEntityById('owners', owner.id);
      if (success) removed.owners++;
    }
    
    return {
      success: true,
      removed,
    };
  } catch (error) {
    console.error('Erro ao remover entidades demo:', error);
    return {
      success: false,
      removed: { owners: 0, properties: 0, reservations: 0, activities: 0 },
    };
  }
}