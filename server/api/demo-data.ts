import { Request, Response } from 'express';
import { storage } from '../storage';
import { format, addDays, subDays, subMonths } from 'date-fns';
import { 
  InsertProperty, 
  InsertOwner, 
  InsertReservation, 
  InsertActivity,
  InsertFinancialDocument,
  InsertFinancialDocumentItem,
  InsertPaymentRecord
} from '../../shared/schema';

// Flag para marcar dados de demonstração
const DEMO_DATA_FLAG = 'demo-data';

// Generate unique IDs for demo data
function generateDemoId() {
  return `demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Create a marker to identify demo data (in a real app, this should be a field in the table)
async function createDemoDataMarker(entityType: string, entityId: number): Promise<void> {
  // In a real implementation, you would add a 'demo' flag to each record
  // For simplicity, we're storing a list of demo entities that can be used when cleaning up
  try {
    await storage.createActivity({
      type: DEMO_DATA_FLAG,
      description: `${entityType}:${entityId}`,
      entityId: entityId,
      entityType: entityType,
    });
  } catch (error) {
    console.error(`Error marking demo data: ${entityType}:${entityId}`, error);
  }
}

// Generate demo properties based on existing ones
export async function generateDemoProperties(count: number = 5): Promise<number[]> {
  const createdIds: number[] = [];
  const existingProperties = await storage.getProperties();
  const existingOwners = await storage.getOwners();
  
  if (existingOwners.length === 0) {
    // Can't create properties without owners
    return createdIds;
  }
  
  // Sample property names
  const propertyNames = [
    'Casa da Praia', 'Apartamento no Centro', 'Villa Aroeira', 
    'Loft Moderno', 'Chalé nas Montanhas', 'Casa de Campo', 
    'Apartamento Vista Mar', 'Quinta do Lago'
  ];
  
  for (let i = 0; i < count; i++) {
    // Select a random existing owner
    const owner = existingOwners[Math.floor(Math.random() * existingOwners.length)];
    
    // Random property data
    const propertyName = `${propertyNames[Math.floor(Math.random() * propertyNames.length)]} [DEMO]`;
    const maxGuests = Math.floor(Math.random() * 6) + 2; // 2-8 guests
    const cleaningCost = (Math.floor(Math.random() * 50) + 30).toFixed(2); // 30-80
    const checkInFee = (Math.floor(Math.random() * 20) + 15).toFixed(2); // 15-35
    const commission = (Math.floor(Math.random() * 10) + 5).toFixed(2); // 5-15%
    const teamPayment = (Math.floor(Math.random() * 20) + 20).toFixed(2); // 20-40
    
    const newProperty: InsertProperty = {
      name: propertyName,
      address: `Rua das Flores, ${Math.floor(Math.random() * 200) + 1}`,
      ownerId: owner.id,
      maxGuests: maxGuests,
      description: `Propriedade demo criada automaticamente para testes.`,
      cleaningCost: cleaningCost,
      checkInFee: checkInFee,
      commission: commission,
      teamPayment: teamPayment,
    };
    
    try {
      const createdProperty = await storage.createProperty(newProperty);
      createdIds.push(createdProperty.id);
      
      // Create an activity for this property creation
      await storage.createActivity({
        type: 'property_created',
        description: `Nova propriedade demo criada: ${propertyName}`,
        entityId: createdProperty.id,
        entityType: 'property',
      });
      
      // Mark as demo data
      await createDemoDataMarker('property', createdProperty.id);
      
    } catch (error) {
      console.error('Error creating demo property:', error);
    }
  }
  
  return createdIds;
}

// Generate demo owners
export async function generateDemoOwners(count: number = 3): Promise<number[]> {
  const createdIds: number[] = [];
  
  const firstNames = ['João', 'Ana', 'Carlos', 'Maria', 'António', 'Sofia', 'Miguel', 'Luísa'];
  const lastNames = ['Silva', 'Santos', 'Ferreira', 'Costa', 'Oliveira', 'Rodrigues', 'Martins', 'Pereira'];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName} [DEMO]`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    
    const newOwner: InsertOwner = {
      name: fullName,
      email: email,
      phone: `+351 ${Math.floor(Math.random() * 900000000) + 100000000}`,
      address: `Av. da República, ${Math.floor(Math.random() * 100) + 1}, Lisboa`,
      taxId: `${Math.floor(Math.random() * 900000000) + 100000000}`,
      notes: `Proprietário demo criado automaticamente para testes.`,
      bankAccountInfo: generateDemoId(),
    };
    
    try {
      const createdOwner = await storage.createOwner(newOwner);
      createdIds.push(createdOwner.id);
      
      // Create an activity for this owner creation
      await storage.createActivity({
        type: 'owner_created',
        description: `Novo proprietário demo criado: ${fullName}`,
        entityId: createdOwner.id,
        entityType: 'owner',
      });
      
      // Mark as demo data
      await createDemoDataMarker('owner', createdOwner.id);
      
    } catch (error) {
      console.error('Error creating demo owner:', error);
    }
  }
  
  return createdIds;
}

// Generate demo reservations for properties
export async function generateDemoReservations(count: number = 15): Promise<number[]> {
  const createdIds: number[] = [];
  console.log('Iniciando geração de reservas demo...');
  
  try {
    const properties = await storage.getProperties();
    console.log(`Propriedades obtidas: ${properties.length}`);
    
    if (properties.length === 0) {
      // Can't create reservations without properties
      console.error('Não existem propriedades para criar reservas!');
      return createdIds;
    }
    
    console.log(`Gerando ${count} reservas para ${properties.length} propriedades disponíveis`);
  
    // Plataformas e estatus usando os valores reais do sistema
    const platformOptions = ['airbnb', 'booking', 'direct', 'expedia', 'other'];
    const statusOptions = ['confirmed', 'pending'];
    
    // Nomes de hóspedes para geração de dados demo
    const guestFirstNames = ['John', 'Emma', 'Michael', 'Sophie', 'David', 'Julia', 'Robert', 'Laura'];
    const guestLastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
    
    // Data atual para referência
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      try {
        // Selecionar propriedade aleatória
        const randomPropertyIndex = Math.floor(Math.random() * properties.length);
        const property = properties[randomPropertyIndex];
        
        if (!property) {
          console.error(`Erro: Propriedade não encontrada no índice ${randomPropertyIndex}`);
          continue; // Pular esta iteração e tentar a próxima
        }
        
        console.log(`Criando reserva ${i+1}/${count} para propriedade: ${property.name} (ID: ${property.id})`);
        
        // Gerar apenas reservas atuais e futuras (atendendo ao pedido do cliente)
        let checkInDate, checkOutDate;
        
        if (i % 2 === 0) {
          // Reserva atual (próximos 14 dias)
          const startOffset = Math.floor(Math.random() * 14); // Próximos 14 dias
          checkInDate = addDays(now, startOffset);
          const stayDuration = Math.floor(Math.random() * 7) + 2; // 2-9 dias
          checkOutDate = addDays(checkInDate, stayDuration);
        } else {
          // Reserva futura (próximos 15-90 dias)
          const futureStartDay = Math.floor(Math.random() * 75) + 15; // Entre 15 e 90 dias no futuro
          checkInDate = addDays(now, futureStartDay);
          const stayDuration = Math.floor(Math.random() * 7) + 2; // 2-9 dias
          checkOutDate = addDays(checkInDate, stayDuration);
        }
        
        // Generate random guest data
        const guestFirstName = guestFirstNames[Math.floor(Math.random() * guestFirstNames.length)];
        const guestLastName = guestLastNames[Math.floor(Math.random() * guestLastNames.length)];
        const guestName = `${guestFirstName} ${guestLastName}`;
        const guestEmail = `${guestFirstName.toLowerCase()}.${guestLastName.toLowerCase()}@example.com`;
        const guestPhone = `+${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 1000000000) + 1000000000}`;
        
        // Random platform and status
        const platform = platformOptions[Math.floor(Math.random() * platformOptions.length)];
        
        // Status based on dates
        let status;
        if (checkOutDate < now) {
          status = 'completed';
        } else if (checkInDate > now) {
          status = 'confirmed';
        } else {
          status = 'in_progress';
        }
        
        // Random cancellation (approximately 10% of reservations)
        if (Math.random() < 0.1) {
          status = 'cancelled';
        }
        
        // Calculate prices based on property data
        const basePricePerNight = Math.floor(Math.random() * 100) + 50; // Between 50-150 per night
        const stayDurationDays = Math.floor((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const baseAmount = basePricePerNight * stayDurationDays;
        
        // Platform fee (percentage of base amount)
        const platformFeePercent = platform === 'direct' ? 0 : Math.floor(Math.random() * 15) + 5; // 5-20%
        const platformFee = (baseAmount * platformFeePercent / 100).toFixed(2);
        
        // Calculate costs using the property's values
        const cleaningFee = property.cleaningCost || '45.00';
        const checkInFee = property.checkInFee || '25.00';
        const commission = property.commission ? (baseAmount * parseFloat(property.commission) / 100).toFixed(2) : '0.00';
        const teamPayment = property.teamPayment || '30.00';
        
        // Total amount: base + cleaning
        const totalAmount = (baseAmount + parseFloat(cleaningFee)).toFixed(2);
        
        // Calcular o valor líquido (total - todas as taxas)
        const netAmount = (
          parseFloat(totalAmount) - 
          parseFloat(platformFee) - 
          parseFloat(cleaningFee) - 
          parseFloat(checkInFee) - 
          parseFloat(commission) - 
          parseFloat(teamPayment)
        ).toFixed(2);
        
        const newReservation: InsertReservation = {
          propertyId: property.id,
          guestName: `${guestName} [DEMO]`,
          guestEmail: guestEmail,
          guestPhone: guestPhone,
          checkInDate: format(checkInDate, 'yyyy-MM-dd'),
          checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
          totalAmount: totalAmount,
          source: platform, // Usando source conforme existe na tabela
          status: status,
          notes: `Demo reservation created automatically.`,
          platformFee: platformFee,
          cleaningFee: cleaningFee,
          checkInFee: checkInFee,
          commission: commission, // Campo está definido como commission no schema
          teamPayment: teamPayment,
          netAmount: netAmount, // Usando netAmount que existe na tabela
          numGuests: Math.floor(Math.random() * 4) + 1 // Entre 1 e 4 hóspedes
        };
        
        try {
          const createdReservation = await storage.createReservation(newReservation);
          createdIds.push(createdReservation.id);
          
          // Create an activity for this reservation
          await storage.createActivity({
            type: 'reservation_created',
            description: `Nova reserva demo criada para ${property.name}: ${guestName} (${format(checkInDate, 'dd/MM/yyyy')} - ${format(checkOutDate, 'dd/MM/yyyy')})`,
            entityId: createdReservation.id,
            entityType: 'reservation',
          });
          
          // Mark as demo data
          await createDemoDataMarker('reservation', createdReservation.id);
          
          // Create financial documents for completed reservations
          if (status === 'completed') {
            await generateFinancialDocumentsForReservation(createdReservation.id, property);
          }
        } catch (error) {
          console.error('Error creating demo reservation:', error);
        }
      } catch (error) {
        console.error('Error generating reservation:', error);
      }
    }
    
    return createdIds;
  } catch (error) {
    console.error('Erro geral na geração de reservas:', error);
    return [];
  }
}

// Generate demo activities
export async function generateDemoActivities(count: number = 10): Promise<number[]> {
  const createdIds: number[] = [];
  
  const properties = await storage.getProperties();
  const owners = await storage.getOwners();
  
  if (properties.length === 0 && owners.length === 0) {
    // Need at least some entities to create activities for
    return createdIds;
  }
  
  const activityTypes = [
    'system_login', 'report_generation', 'profile_update', 
    'message_sent', 'property_update', 'reservation_update'
  ];
  
  const activityDescriptions = {
    system_login: ['Usuário logou no sistema', 'Novo acesso ao sistema', 'Login detectado'],
    report_generation: ['Relatório mensal gerado', 'Relatório de proprietário gerado', 'Relatório financeiro exportado'],
    profile_update: ['Perfil atualizado', 'Informações de contato atualizadas', 'Senha alterada'],
    message_sent: ['Mensagem enviada para proprietário', 'Comunicação com hóspede', 'Notificação enviada'],
    property_update: ['Dados da propriedade atualizados', 'Fotos da propriedade atualizadas', 'Preços da propriedade atualizados'],
    reservation_update: ['Reserva modificada', 'Datas de reserva alteradas', 'Detalhes de reserva atualizados']
  };
  
  // Create random activities
  for (let i = 0; i < count; i++) {
    // Random activity type
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    // Random description for the type
    const descriptions = activityDescriptions[type as keyof typeof activityDescriptions];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // Random entity (property or owner)
    let entityId: number | null = null;
    let entityType: string | null = null;
    
    if (type === 'property_update' && properties.length > 0) {
      entityId = properties[Math.floor(Math.random() * properties.length)].id;
      entityType = 'property';
    } else if (type === 'profile_update' && owners.length > 0) {
      entityId = owners[Math.floor(Math.random() * owners.length)].id;
      entityType = 'owner';
    }
    
    // Random timestamp in the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = subDays(subDays(new Date(), daysAgo), hoursAgo / 24);
    
    const newActivity = {
      type: type,
      description: `${description} [DEMO]`,
      entityId: entityId,
      entityType: entityType,
    };
    
    try {
      const createdActivity = await storage.createActivity(newActivity);
      createdIds.push(createdActivity.id);
      
      // Mark as demo data
      await createDemoDataMarker('activity', createdActivity.id);
      
    } catch (error) {
      console.error('Error creating demo activity:', error);
    }
  }
  
  return createdIds;
}

// Generate financial documents for a reservation
async function generateFinancialDocumentsForReservation(reservationId: number, property: any): Promise<void> {
  try {
    const reservation = await storage.getReservation(reservationId);
    
    if (!reservation) {
      console.error(`Reservation ${reservationId} not found`);
      return;
    }
    
    // Create income document (invoice to platform or guest)
    const invoiceDate = subDays(new Date(reservation.checkOutDate), Math.floor(Math.random() * 5) + 1);
    const dueDate = addDays(invoiceDate, 15);
    
    const incomeDocument: InsertFinancialDocument = {
      documentType: 'invoice',
      documentNumber: `DEMO-INV-${Date.now().toString().slice(-6)}`,
      amount: reservation.totalAmount,
      issueDate: format(invoiceDate, 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      status: 'paid',
      description: `Fatura de reserva [DEMO]: ${reservation.guestName} (${format(new Date(reservation.checkInDate), 'dd/MM/yyyy')} - ${format(new Date(reservation.checkOutDate), 'dd/MM/yyyy')})`,
      relatedEntityType: 'owner',
      relatedEntityId: property.ownerId
    };
    
    const createdIncome = await storage.createFinancialDocument(incomeDocument);
    
    // Mark as demo data
    await createDemoDataMarker('financial_document', createdIncome.id);
    
    // Create line item for the stay
    const stayDurationDays = Math.floor(
      (new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    const stayItem: InsertFinancialDocumentItem = {
      documentId: createdIncome.id,
      description: `Estadia de ${stayDurationDays} dias [DEMO]`,
      quantity: stayDurationDays,
      unitPrice: (parseFloat(reservation.totalAmount) / stayDurationDays).toFixed(2),
      totalPrice: (parseFloat(reservation.totalAmount) - parseFloat(reservation.cleaningFee || '0')).toFixed(2),
      notes: 'Item de demonstração'
    };
    
    await storage.createFinancialDocumentItem(stayItem);
    
    // Create line item for cleaning
    const cleaningItem: InsertFinancialDocumentItem = {
      documentId: createdIncome.id,
      description: `Serviço de limpeza [DEMO]`,
      quantity: 1,
      unitPrice: reservation.cleaningFee || '0',
      totalPrice: reservation.cleaningFee || '0',
      notes: 'Item de demonstração'
    };
    
    await storage.createFinancialDocumentItem(cleaningItem);
    
    // Create payment record
    const paymentDate = addDays(invoiceDate, Math.floor(Math.random() * 10) + 1); // 1-10 days after invoice
    
    const payment: InsertPaymentRecord = {
      documentId: createdIncome.id,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      paymentMethod: 'bank_transfer',
      amount: reservation.totalAmount,
      notes: 'Pagamento de demonstração',
      reference: `PAY-DEMO-${Date.now().toString().slice(-6)}`
    };
    
    await storage.createPaymentRecord(payment);
    
    // Create expense documents for services (cleaning, check-in)
    if (parseFloat(reservation.cleaningFee || '0') > 0) {
      const cleaningExpense: InsertFinancialDocument = {
        documentType: 'expense',
        documentNumber: `DEMO-EXP-${Date.now().toString().slice(-6)}`,
        amount: property.teamPayment || '0',
        issueDate: format(subDays(new Date(reservation.checkOutDate), 1), 'yyyy-MM-dd'),
        dueDate: format(addDays(new Date(reservation.checkOutDate), 15), 'yyyy-MM-dd'),
        status: 'paid',
        description: `Serviço de limpeza para reserva [DEMO]: ${property.name} (${format(new Date(reservation.checkOutDate), 'dd/MM/yyyy')})`,
        relatedEntityType: 'supplier',
        relatedEntityId: 1 // Using default supplier ID
      };
      
      const createdExpense = await storage.createFinancialDocument(cleaningExpense);
      
      // Mark as demo data
      await createDemoDataMarker('financial_document', createdExpense.id);
      
      // Create expense item
      const cleaningExpenseItem: InsertFinancialDocumentItem = {
        documentId: createdExpense.id,
        description: `Limpeza após checkout [DEMO]`,
        quantity: 1,
        unitPrice: property.teamPayment || '0',
        totalPrice: property.teamPayment || '0',
        notes: 'Item de demonstração'
      };
      
      await storage.createFinancialDocumentItem(cleaningExpenseItem);
      
      // Create payment
      const expensePayment: InsertPaymentRecord = {
        documentId: createdExpense.id,
        paymentDate: format(addDays(new Date(reservation.checkOutDate), 3), 'yyyy-MM-dd'),
        paymentMethod: 'bank_transfer',
        amount: property.teamPayment || '0',
        notes: 'Pagamento de demonstração',
        reference: `PAY-DEMO-${Date.now().toString().slice(-6)}`
      };
      
      await storage.createPaymentRecord(expensePayment);
    }
    
  } catch (error) {
    console.error('Error generating financial documents for reservation:', error);
  }
}

// Get all demo data markers
async function getDemoDataMarkers(): Promise<{entityType: string, entityId: number, markerId: number}[]> {
  try {
    const activities = await storage.getActivities();
    const demoMarkers = activities
      .filter(activity => activity.type === DEMO_DATA_FLAG)
      .map(activity => {
        const [entityType, entityId] = activity.description.split(':');
        return {
          entityType,
          entityId: parseInt(entityId, 10),
          markerId: activity.id
        };
      });
    
    return demoMarkers;
  } catch (error) {
    console.error('Error getting demo data markers:', error);
    return [];
  }
}

// Handler for API endpoint to generate demo data
export async function generateDemoData(req: Request, res: Response) {
  try {
    const options = req.body.include || ['properties', 'owners', 'reservations', 'activities'];
    
    let ownerIds: number[] = [];
    let propertyIds: number[] = [];
    let reservationIds: number[] = [];
    let activityIds: number[] = [];
    
    // If we're not supposed to create new owners or properties, get existing ones
    if (!options.includes('owners') && !options.includes('properties')) {
      // Get existing owners and properties
      const existingOwners = await storage.getOwners();
      const existingProperties = await storage.getProperties();
      
      if (existingProperties.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Não existem propriedades no sistema. Crie propriedades primeiro ou inclua a opção "properties"'
        });
      }
      
      ownerIds = existingOwners.map(o => o.id);
      propertyIds = existingProperties.map(p => p.id);
      
      console.log(`Usando ${propertyIds.length} propriedades existentes e ${ownerIds.length} proprietários existentes`);
    } else {
      // Gerar dados na ordem correta (proprietários -> propriedades -> reservas -> atividades)
      if (options.includes('owners')) {
        ownerIds = await generateDemoOwners(3);
      }
      
      if (options.includes('properties')) {
        propertyIds = await generateDemoProperties(5);
      }
    }
    
    // Sempre gerar reservas com as propriedades disponíveis
    if (options.includes('reservations')) {
      console.log(`Gerando reservas para ${propertyIds.length} propriedades`);
      try {
        reservationIds = await generateDemoReservations(15);
        console.log(`Reservas geradas com sucesso: ${reservationIds.length}`);
      } catch (error) {
        console.error('Erro detalhado ao gerar reservas:', error);
        // Continuar a execução mesmo com erro nas reservas
        reservationIds = [];
      }
    }
    
    if (options.includes('activities')) {
      activityIds = await generateDemoActivities(10);
    }
    
    const totalItems = ownerIds.length + propertyIds.length + reservationIds.length + activityIds.length;
    
    res.status(200).json({
      success: true,
      message: 'Dados de demonstração gerados com sucesso',
      itemsCreated: totalItems,
      details: {
        owners: ownerIds.length,
        properties: propertyIds.length,
        reservations: reservationIds.length,
        activities: activityIds.length
      }
    });
  } catch (error) {
    console.error('Erro ao gerar dados de demonstração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar dados de demonstração',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Função aprimorada para resetar TODOS os dados de demonstração do sistema
 * Inclui rastreamento detalhado dos itens removidos e contadores por tipo de entidade
 * Também adiciona verificação de forceCleanMode quando solicitado
 * 
 * @returns Objeto com detalhes sobre o resultado da operação
 */
export async function resetDemoData(forceCleanMode: boolean = false): Promise<{
  success: boolean, 
  removedItems: number, 
  forcedMode?: boolean,
  removed?: any,
  details?: any
}> {
  try {
    console.log(`Iniciando reset completo de dados de demonstração${forceCleanMode ? ' (MODO FORÇADO)' : ''}...`);
    
    // Estrutura para armazenar detalhes mais aprofundados da remoção
    const removalDetails: {
      taskIds: number[],
      activityIds: number[],
      reservationIds: number[],
      propertyIds: number[],
      ownerIds: number[],
      financialDocIds: number[],
      paymentIds: number[],
      errors: {entityType: string, id: number, error: string}[]
    } = {
      taskIds: [],
      activityIds: [],
      reservationIds: [],
      propertyIds: [],
      ownerIds: [],
      financialDocIds: [],
      paymentIds: [],
      errors: []
    };
    
    // Criar contadores para rastrear remoções
    let totalEntitiesRemoved = 0;
    let removedTasks = 0;
    let removedActivities = 0;
    let removedReservations = 0;
    let removedProperties = 0;
    let removedOwners = 0;
    let removedFinancialDocs = 0;
    let removedPayments = 0;
    
    // Parte 1: Remover entidades com marcadores no banco
    const startTime = new Date().getTime();
    const demoMarkers = await getDemoDataMarkers();
    console.log(`Encontrados ${demoMarkers.length} marcadores de dados demo no banco`);
    
    // Group markers by entity type for efficient processing
    const markersByType: {[key: string]: number[]} = {};
    const markerIds: number[] = [];
    
    demoMarkers.forEach(marker => {
      if (!markersByType[marker.entityType]) {
        markersByType[marker.entityType] = [];
      }
      markersByType[marker.entityType].push(marker.entityId);
      markerIds.push(marker.markerId);
    });
    
    console.log('Removendo dados demo por tipo de entidade...');
    
    // Parte 2: Remover TODAS as entidades pelo nome [DEMO] ou outras marcações de exemplo
    // Garantir que todos os dados demo sejam removidos mesmo que não tenham marcador
    
    // Buscar todas as entidades
    console.log('Buscando todas as entidades para verificar dados demo...');
    
    const tasks = await storage.getMaintenanceTasks();
    const activities = await storage.getActivities();
    const reservations = await storage.getReservations();
    const properties = await storage.getProperties();
    const owners = await storage.getOwners();
    
    // Também buscar documentos financeiros e pagamentos se estivermos no modo forçado
    let financialDocs: any[] = [];
    let payments: any[] = [];
    
    if (forceCleanMode) {
      console.log('MODO FORÇADO: Buscando documentos financeiros e pagamentos...');
      try {
        financialDocs = await storage.getFinancialDocuments();
        payments = await storage.getPaymentRecords();
        console.log(`Encontrados ${financialDocs.length} documentos financeiros e ${payments.length} pagamentos.`);
      } catch (error) {
        console.error('Erro ao buscar documentos financeiros ou pagamentos:', error);
      }
    }
    
    console.log(`Entidades recuperadas: ${tasks.length} tarefas, ${activities.length} atividades, ${reservations.length} reservas, ${properties.length} propriedades, ${owners.length} proprietários`);
    
    // Palavras-chave para identificar dados de demonstração
    const demoKeywords = ['[DEMO]', 'exemplo', 'example', 'demo', 'test', 'fictício', 'ficticio', 'fake'];
    
    // Critérios mais rígidos se estiver em modo forçado
    if (forceCleanMode) {
      demoKeywords.push('teste', 'simulação', 'simulation', 'dummy', 'amostra', 'modelo');
    }
    
    // Filtrar tarefas de manutenção de demonstração com critérios ampliados
    const demoTasks = tasks.filter(task => {
      // Verificar nome, descrição e notas para referências de demonstração
      if (task.description && demoKeywords.some(keyword => task.description.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (task.notes && demoKeywords.some(keyword => task.notes.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (task.title && demoKeywords.some(keyword => task.title.toLowerCase().includes(keyword.toLowerCase()))) return true;
      
      // Tarefas específicas conhecidas que são de demonstração
      const knownDemoTaskDescriptions = [
        'verificar aquecedor', 
        'reparar chuveiro', 
        'problema na torneira', 
        'ar condicionado',
        'fechadura',
        'problema com internet'
      ];
      
      return task.description && knownDemoTaskDescriptions.some(demo => 
        task.description.toLowerCase().includes(demo.toLowerCase())
      );
    });
    
    console.log(`Identificadas ${demoTasks.length} tarefas de manutenção demo`);
    
    // Filtrar atividades de demonstração
    const demoActivities = activities.filter(a => 
      (a.description && demoKeywords.some(keyword => a.description.toLowerCase().includes(keyword.toLowerCase()))) ||
      a.type === DEMO_DATA_FLAG
    );
    
    console.log(`Identificadas ${demoActivities.length} atividades demo`);
    
    // Filtrar reservas de demonstração
    const demoReservations = reservations.filter(r => {
      // Verificar nome de hóspede e notas
      if (r.guestName && demoKeywords.some(keyword => r.guestName.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (r.notes && demoKeywords.some(keyword => r.notes.toLowerCase().includes(keyword.toLowerCase()))) return true;
      
      // Verificar email de hóspede (exemplo.com, example.com, teste.com, test.com)
      if (r.guestEmail && 
          (r.guestEmail.includes('example.com') || 
           r.guestEmail.includes('exemplo.com') || 
           r.guestEmail.includes('test.com') || 
           r.guestEmail.includes('teste.com'))) return true;
      
      // Nomes frequentes em reservas de demonstração
      const demoGuestNames = ['John Smith', 'Emma Johnson', 'David Brown', 'Michael Davis', 'Sophie Miller'];
      return r.guestName && demoGuestNames.some(name => r.guestName.includes(name));
    });
    
    console.log(`Identificadas ${demoReservations.length} reservas demo`);
    
    // Filtrar propriedades de demonstração
    const demoProperties = properties.filter(p => {
      // Verificar nome e descrição
      if (p.name && demoKeywords.some(keyword => p.name.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (p.description && demoKeywords.some(keyword => p.description.toLowerCase().includes(keyword.toLowerCase()))) return true;
      
      // Nomes frequentes em propriedades de demonstração
      const demoPropertyNames = ['Casa da Praia', 'Apartamento no Centro', 'Villa Aroeira', 'Loft Moderno', 'Chalé nas Montanhas'];
      return p.name && demoPropertyNames.some(name => p.name.includes(name));
    });
    
    console.log(`Identificadas ${demoProperties.length} propriedades demo`);
    
    // Filtrar proprietários de demonstração
    const demoOwners = owners.filter(o => {
      // Verificar nome e notas
      if (o.name && demoKeywords.some(keyword => o.name.toLowerCase().includes(keyword.toLowerCase()))) return true;
      if (o.notes && demoKeywords.some(keyword => o.notes.toLowerCase().includes(keyword.toLowerCase()))) return true;
      
      // Verificar email
      if (o.email && 
          (o.email.includes('example.com') || 
           o.email.includes('exemplo.com') || 
           o.email.includes('test.com') || 
           o.email.includes('teste.com'))) return true;
      
      return false;
    });
    
    console.log(`Identificados ${demoOwners.length} proprietários demo`);
    
    // Filtrar documentos financeiros e pagamentos (apenas no modo forçado)
    let demoFinancialDocs: any[] = [];
    let demoPayments: any[] = [];
    
    if (forceCleanMode && financialDocs.length > 0) {
      demoFinancialDocs = financialDocs.filter(doc => {
        if (doc.description && demoKeywords.some(keyword => doc.description.toLowerCase().includes(keyword.toLowerCase()))) return true;
        if (doc.documentNumber && demoKeywords.some(keyword => doc.documentNumber.toLowerCase().includes(keyword.toLowerCase()))) return true;
        return false;
      });
      console.log(`Identificados ${demoFinancialDocs.length} documentos financeiros demo`);
      
      if (payments.length > 0) {
        demoPayments = payments.filter(payment => {
          if (payment.notes && demoKeywords.some(keyword => payment.notes.toLowerCase().includes(keyword.toLowerCase()))) return true;
          if (payment.reference && demoKeywords.some(keyword => payment.reference.toLowerCase().includes(keyword.toLowerCase()))) return true;
          
          // Verificar se o pagamento está relacionado a um documento financeiro demo
          return demoFinancialDocs.some(doc => doc.id === payment.documentId);
        });
        console.log(`Identificados ${demoPayments.length} pagamentos demo`);
      }
    }
    
    // Remover na ordem correta para evitar conflitos de chave estrangeira
    
    // 0. Primeiro remover pagamentos (se estiver em modo forçado)
    if (forceCleanMode && demoPayments.length > 0) {
      console.log('Removendo pagamentos demo...');
      let paymentsRemoved = 0;
      for (const payment of demoPayments) {
        try {
          const success = await storage.deletePaymentRecord(payment.id);
          if (success) {
            paymentsRemoved++;
            removalDetails.paymentIds.push(payment.id);
            console.log(`Pagamento removido: ${payment.id} - ${payment.amount}`);
          }
        } catch (error) {
          console.error(`Erro ao remover pagamento ${payment.id}:`, error);
          removalDetails.errors.push({
            entityType: 'payment',
            id: payment.id,
            error: error.message || 'Erro desconhecido'
          });
        }
      }
      removedPayments = paymentsRemoved;
    }
    
    // 0.1. Remover documentos financeiros (se estiver em modo forçado)
    if (forceCleanMode && demoFinancialDocs.length > 0) {
      console.log('Removendo documentos financeiros demo...');
      let docsRemoved = 0;
      for (const doc of demoFinancialDocs) {
        try {
          const success = await storage.deleteFinancialDocument(doc.id);
          if (success) {
            docsRemoved++;
            removalDetails.financialDocIds.push(doc.id);
            console.log(`Documento financeiro removido: ${doc.id} - ${doc.documentNumber || ''}`);
          }
        } catch (error) {
          console.error(`Erro ao remover documento financeiro ${doc.id}:`, error);
          removalDetails.errors.push({
            entityType: 'financialDocument',
            id: doc.id,
            error: error.message || 'Erro desconhecido'
          });
        }
      }
      removedFinancialDocs = docsRemoved;
    }
    
    // 1. Depois remover tarefas de manutenção
    console.log('Removendo tarefas de manutenção demo...');
    let tasksRemoved = 0;
    for (const task of demoTasks) {
      try {
        const success = await storage.deleteMaintenanceTask(task.id);
        if (success) {
          tasksRemoved++;
          removalDetails.taskIds.push(task.id);
          console.log(`Tarefa de manutenção removida: ${task.id} - ${task.description || ''}`);
        }
      } catch (error) {
        console.error(`Erro ao remover tarefa de manutenção ${task.id}:`, error);
        removalDetails.errors.push({
          entityType: 'maintenanceTask',
          id: task.id,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    removedTasks = tasksRemoved;
    
    // 2. Depois remover atividades
    console.log('Removendo atividades demo...');
    let activitiesRemoved = 0;
    for (const activity of demoActivities) {
      try {
        const success = await storage.deleteActivity(activity.id);
        if (success) {
          activitiesRemoved++;
          removalDetails.activityIds.push(activity.id);
          console.log(`Atividade removida: ${activity.id} - ${activity.description}`);
        }
      } catch (error) {
        console.error(`Erro ao remover atividade ${activity.id}:`, error);
        removalDetails.errors.push({
          entityType: 'activity',
          id: activity.id,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    removedActivities = activitiesRemoved;
    
    // 3. Depois remover reservas
    console.log('Removendo reservas demo...');
    let reservationsRemoved = 0;
    for (const reservation of demoReservations) {
      try {
        const success = await storage.deleteReservation(reservation.id);
        if (success) {
          reservationsRemoved++;
          removalDetails.reservationIds.push(reservation.id);
          console.log(`Reserva removida: ${reservation.id} - ${reservation.guestName}`);
        }
      } catch (error) {
        console.error(`Erro ao remover reserva ${reservation.id}:`, error);
        removalDetails.errors.push({
          entityType: 'reservation',
          id: reservation.id,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    removedReservations = reservationsRemoved;
    
    // 4. Depois remover propriedades
    console.log('Removendo propriedades demo...');
    let propertiesRemoved = 0;
    for (const property of demoProperties) {
      try {
        const success = await storage.deleteProperty(property.id);
        if (success) {
          propertiesRemoved++;
          removalDetails.propertyIds.push(property.id);
          console.log(`Propriedade removida: ${property.id} - ${property.name}`);
        }
      } catch (error) {
        console.error(`Erro ao remover propriedade ${property.id}:`, error);
        removalDetails.errors.push({
          entityType: 'property',
          id: property.id,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    removedProperties = propertiesRemoved;
    
    // 5. Por último remover proprietários
    console.log('Removendo proprietários demo...');
    let ownersRemoved = 0;
    for (const owner of demoOwners) {
      try {
        const success = await storage.deleteOwner(owner.id);
        if (success) {
          ownersRemoved++;
          removalDetails.ownerIds.push(owner.id);
          console.log(`Proprietário removido: ${owner.id} - ${owner.name}`);
        }
      } catch (error) {
        console.error(`Erro ao remover proprietário ${owner.id}:`, error);
        removalDetails.errors.push({
          entityType: 'owner',
          id: owner.id,
          error: error.message || 'Erro desconhecido'
        });
      }
    }
    removedOwners = ownersRemoved;
    
    // Atualizar contadores totais com base nos itens realmente removidos
    totalEntitiesRemoved = removedTasks + removedActivities + removedReservations + 
                           removedProperties + removedOwners + removedFinancialDocs + 
                           removedPayments;

    // Verificar se algo foi removido
    if (totalEntitiesRemoved === 0) {
      console.log('Nenhum dado demo foi encontrado ou todos já foram removidos anteriormente.');
    } else {
      const endTime = new Date().getTime();
      const executionTime = (endTime - startTime) / 1000;
      
      console.log(`Total de ${totalEntitiesRemoved} entidades demo removidas com sucesso em ${executionTime.toFixed(2)}s!`);
      console.log(`Detalhes: ${removedTasks} tarefas, ${removedActivities} atividades, ${removedReservations} reservas, ${removedProperties} propriedades, ${removedOwners} proprietários, ${removedFinancialDocs} docs financeiros, ${removedPayments} pagamentos`);
      console.log(`Erros encontrados: ${removalDetails.errors.length}`);
    }
    
    // Retornar detalhes da remoção com dados aprimorados
    return {
      success: true,
      removedItems: totalEntitiesRemoved,
      forcedMode: forceCleanMode,
      removed: {
        tasks: removedTasks,
        activities: removedActivities,
        reservations: removedReservations,
        properties: removedProperties,
        owners: removedOwners,
        financialDocs: removedFinancialDocs,
        payments: removedPayments
      },
      details: removalDetails
    };
  } catch (error) {
    console.error('Erro ao resetar dados de demonstração:', error);
    return {
      success: false,
      removedItems: 0
    };
  }
}

/**
 * Handler para API endpoint de resetar dados demo
 * Suporta parâmetro forceCleanMode para limpeza mais agressiva
 */
export async function resetDemoDataHandler(req: Request, res: Response) {
  try {
    // Verificar se solicitou modo de limpeza forçada
    const forceCleanMode = req.query.forceCleanMode === 'true';
    console.log(`Recebida solicitação para remover todos os dados de demonstração${forceCleanMode ? ' (MODO FORÇADO)' : ''}`);
    
    // Registrar a atividade de remoção de dados demo
    try {
      await storage.createActivity({
        type: 'demo_data_removal',
        description: `Solicitação para remover todos os dados de demonstração do sistema${forceCleanMode ? ' em modo forçado' : ''}`
      });
    } catch (activityError) {
      console.error('Erro ao registrar atividade de remoção de dados demo:', activityError);
      // Continuar mesmo com erro no registro de atividade
    }
    
    // Executar a remoção completa dos dados com o parâmetro forceCleanMode
    const result = await resetDemoData(forceCleanMode);
    
    // Registrar o resultado da remoção
    if (result.success) {
      console.log(`Remoção de dados demo concluída: ${result.removedItems} itens removidos`);
      
      // Se algum item foi removido, registrar a atividade de sucesso com detalhes
      if (result.removedItems > 0) {
        try {
          const detailsStr = Object.entries(result.removed || {})
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ');
            
          await storage.createActivity({
            type: 'demo_data_removed',
            description: `${result.removedItems} itens de demonstração foram removidos com sucesso (${detailsStr})`
          });
        } catch (activityError) {
          console.error('Erro ao registrar atividade de conclusão:', activityError);
          // Continuar mesmo com erro no registro de atividade
        }
      }
    }
    
    // Retornar resposta para o cliente
    res.status(200).json({
      success: result.success,
      message: `${result.removedItems} itens de demonstração removidos com sucesso`,
      itemsRemoved: result.removedItems
    });
  } catch (error) {
    console.error('Erro ao limpar dados de demonstração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar dados de demonstração',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}