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

// Generate demo properties based on existing ones
export async function generateDemoProperties(count: number = 5): Promise<number[]> {
  const createdIds: number[] = [];
  const existingProperties = await storage.getProperties();
  const existingOwners = await storage.getOwners();
  
  if (existingOwners.length === 0) {
    // Can't create properties without owners
    return createdIds;
  }
  
  const propertyTypes = ['Apartamento', 'Casa', 'Villa', 'Studio', 'Loft'];
  const neighborhoods = ['Ajuda', 'Alcântara', 'Alfama', 'Alvalade', 'Avenidas Novas', 'Baixa', 'Belém', 'Campo de Ourique'];
  const streets = ['Rua', 'Avenida', 'Praça', 'Largo', 'Travessa'];
  
  for (let i = 0; i < count; i++) {
    // Randomly select an owner
    const randomOwnerIndex = Math.floor(Math.random() * existingOwners.length);
    const ownerId = existingOwners[randomOwnerIndex].id;
    
    // Generate a property name based on type and location
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    const streetType = streets[Math.floor(Math.random() * streets.length)];
    const streetNumber = Math.floor(Math.random() * 100) + 1;
    
    const propertyName = `${propertyType} ${streetType} ${neighborhood} ${streetNumber}`;
    
    // Generate random costs based on existing properties for realistic values
    const avgCleaningCost = existingProperties.length > 0 
      ? existingProperties.reduce((sum, prop) => sum + parseFloat(prop.cleaningCost || '0'), 0) / existingProperties.length 
      : 45;
      
    const avgCheckInFee = existingProperties.length > 0 
      ? existingProperties.reduce((sum, prop) => sum + parseFloat(prop.checkInFee || '0'), 0) / existingProperties.length 
      : 25;
      
    const avgCommission = existingProperties.length > 0 
      ? existingProperties.reduce((sum, prop) => sum + parseFloat(prop.commission || '0'), 0) / existingProperties.length 
      : 15;
    
    // Add some variation to the average values
    const variationFactor = 0.8 + (Math.random() * 0.4); // Variation between 0.8 and 1.2
    
    const newProperty: InsertProperty = {
      name: `${propertyName} [DEMO]`,
      ownerId: ownerId,
      cleaningCost: (avgCleaningCost * variationFactor).toFixed(2),
      checkInFee: (avgCheckInFee * variationFactor).toFixed(2),
      commission: (avgCommission * variationFactor).toFixed(2),
      teamPayment: (avgCleaningCost * 0.7 * variationFactor).toFixed(2),
      cleaningTeam: "Equipa Maria",
      active: true,
      monthlyFixedCost: (Math.random() * 100 + 50).toFixed(2),
      cleaningTeamId: null,
    };
    
    try {
      const createdProperty = await storage.createProperty(newProperty);
      createdIds.push(createdProperty.id);
      
      // Create an activity for this property
      await storage.createActivity({
        type: 'property_added',
        description: `Nova propriedade demo adicionada: ${createdProperty.name}`,
        entityId: createdProperty.id,
        entityType: 'property',
      });
      
      // Mark as demo data in custom field
      // In a real scenario, this should be saved in a dedicated table or field
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
  const names = [
    'António Silva', 'Maria Sousa', 'João Ribeiro', 'Ana Pereira', 
    'Francisco Costa', 'Margarida Santos', 'Luís Oliveira', 'Sofia Martins'
  ];
  const companies = [
    'Imobiliária Lisboa', 'Apartamentos Premium', 'Casas do Tejo', 
    'Alfama Rentals', 'Belém Properties', null
  ];
  
  const phonePrefixes = ['+351 91', '+351 92', '+351 93', '+351 96'];
  
  for (let i = 0; i < count; i++) {
    // Generate random owner data
    const nameIndex = Math.floor(Math.random() * names.length);
    const name = names[nameIndex];
    names.splice(nameIndex, 1); // Remove used name to avoid duplicates
    
    const firstName = name.split(' ')[0].toLowerCase();
    const email = `${firstName}.demo${Math.floor(Math.random() * 1000)}@example.com`;
    
    const phonePrefix = phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)];
    const phoneNumber = `${phonePrefix} ${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
    
    const companyIndex = Math.floor(Math.random() * companies.length);
    const company = companies[companyIndex];
    
    // Create random tax ID (NIF in Portugal)
    const taxId = `${Math.floor(Math.random() * 900000000) + 100000000}`;
    
    const newOwner: InsertOwner = {
      name: `${name} [DEMO]`,
      email: email,
      phone: phoneNumber,
      address: `Rua da Demo ${Math.floor(Math.random() * 100) + 1}, Lisboa`,
      company: company,
      taxId: taxId,
    };
    
    try {
      const createdOwner = await storage.createOwner(newOwner);
      createdIds.push(createdOwner.id);
      
      // Create an activity for this owner
      await storage.createActivity({
        type: 'owner_added',
        description: `Novo proprietário demo adicionado: ${createdOwner.name}`,
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
  const properties = await storage.getProperties();
  
  if (properties.length === 0) {
    // Can't create reservations without properties
    return createdIds;
  }
  
  const platformOptions = ['Airbnb', 'Booking.com', 'VRBO', 'Direct'];
  const statusOptions = ['confirmed', 'completed', 'cancelled'];
  const guestFirstNames = ['John', 'Emma', 'Michael', 'Sophie', 'David', 'Julia', 'Robert', 'Laura'];
  const guestLastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];
  
  // Current date for reference
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Select random property
    const randomPropertyIndex = Math.floor(Math.random() * properties.length);
    const property = properties[randomPropertyIndex];
    
    // Generate random dates
    // Mix of past, current, and future reservations
    let checkInDate, checkOutDate;
    
    if (i % 3 === 0) {
      // Past reservation
      const pastStartDay = Math.floor(Math.random() * 180) + 30; // Between 30 and 210 days ago
      checkInDate = subDays(now, pastStartDay);
      checkOutDate = subDays(now, pastStartDay - Math.floor(Math.random() * 10) - 2); // 2-12 days stay
    } else if (i % 3 === 1) {
      // Current or near future reservation
      const startOffset = Math.floor(Math.random() * 30) - 15; // Between 15 days ago and 15 days from now
      checkInDate = addDays(now, startOffset);
      checkOutDate = addDays(checkInDate, Math.floor(Math.random() * 10) + 2); // 2-12 days stay
    } else {
      // Future reservation
      const futureStartDay = Math.floor(Math.random() * 180) + 15; // Between 15 and 195 days in future
      checkInDate = addDays(now, futureStartDay);
      checkOutDate = addDays(checkInDate, Math.floor(Math.random() * 10) + 2); // 2-12 days stay
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
    const platformFeePercent = platform === 'Direct' ? 0 : Math.floor(Math.random() * 15) + 5; // 5-20%
    const platformFee = (baseAmount * platformFeePercent / 100).toFixed(2);
    
    // Calculate costs using the property's values
    const cleaningFee = property.cleaningCost || '45.00';
    const checkInFee = property.checkInFee || '25.00';
    const commissionFee = property.commission ? (baseAmount * parseFloat(property.commission) / 100).toFixed(2) : '0.00';
    const teamPayment = property.teamPayment || '30.00';
    
    // Total amount: base + cleaning
    const totalAmount = (baseAmount + parseFloat(cleaningFee)).toFixed(2);
    
    // Net amount: total - fees
    const netAmount = (
      parseFloat(totalAmount) - 
      parseFloat(platformFee) - 
      parseFloat(checkInFee) - 
      parseFloat(commissionFee) - 
      parseFloat(teamPayment)
    ).toFixed(2);
    
    const newReservation: InsertReservation = {
      propertyId: property.id,
      guestName: `${guestName} [DEMO]`,
      guestEmail: guestEmail,
      guestPhone: guestPhone,
      checkInDate: format(checkInDate, 'yyyy-MM-dd'),
      checkOutDate: format(checkOutDate, 'yyyy-MM-dd'),
      numGuests: Math.floor(Math.random() * 5) + 1, // 1-6 guests
      totalAmount: totalAmount,
      platform: platform,
      status: status,
      notes: `Demo reservation created automatically.`,
      platformFee: platformFee,
      cleaningFee: cleaningFee,
      checkInFee: checkInFee,
      commissionFee: commissionFee,
      teamPayment: teamPayment,
      netAmount: netAmount,
      invoiceNumber: `INV-DEMO-${Date.now().toString().slice(-6)}`,
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
  }
  
  return createdIds;
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
      type: 'incoming',
      totalAmount: reservation.totalAmount,
      entityId: property.ownerId,
      entityType: 'owner',
      referenceMonth: format(new Date(reservation.checkInDate), 'yyyy-MM'),
      issueDate: format(invoiceDate, 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      paidAmount: reservation.totalAmount, // Assuming paid in full
      status: 'paid',
      description: `Fatura de reserva [DEMO]: ${reservation.guestName} (${format(new Date(reservation.checkInDate), 'dd/MM/yyyy')} - ${format(new Date(reservation.checkOutDate), 'dd/MM/yyyy')})`,
      externalReference: reservation.invoiceNumber,
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
      amount: (parseFloat(reservation.totalAmount) - parseFloat(reservation.cleaningFee || '0')).toFixed(2),
      propertyId: property.id,
      reservationId: reservation.id,
      quantity: stayDurationDays,
      unitValue: (parseFloat(reservation.totalAmount) / stayDurationDays).toFixed(2),
      taxRate: '0',
      notes: 'Item de demonstração',
    };
    
    await storage.createFinancialDocumentItem(stayItem);
    
    // Create line item for cleaning
    const cleaningItem: InsertFinancialDocumentItem = {
      documentId: createdIncome.id,
      description: `Serviço de limpeza [DEMO]`,
      amount: reservation.cleaningFee || '0',
      propertyId: property.id,
      reservationId: reservation.id,
      quantity: 1,
      unitValue: reservation.cleaningFee || '0',
      taxRate: '0',
      notes: 'Item de demonstração',
    };
    
    await storage.createFinancialDocumentItem(cleaningItem);
    
    // Create payment record
    const paymentDate = addDays(invoiceDate, Math.floor(Math.random() * 10) + 1); // 1-10 days after invoice
    
    const payment: InsertPaymentRecord = {
      documentId: createdIncome.id,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      method: reservation.platform === 'Direct' ? 'bank_transfer' : reservation.platform.toLowerCase(),
      amount: reservation.totalAmount,
      externalReference: `PAY-DEMO-${Date.now().toString().slice(-6)}`,
      notes: 'Pagamento de demonstração',
      attachment: null,
    };
    
    await storage.createPaymentRecord(payment);
    
    // Create expense documents for services (cleaning, check-in)
    if (parseFloat(reservation.cleaningFee || '0') > 0) {
      const cleaningExpense: InsertFinancialDocument = {
        type: 'outgoing',
        totalAmount: property.teamPayment || '0',
        entityId: 1, // Using default supplier ID
        entityType: 'supplier',
        referenceMonth: format(new Date(reservation.checkInDate), 'yyyy-MM'),
        issueDate: format(subDays(new Date(reservation.checkOutDate), 1), 'yyyy-MM-dd'),
        dueDate: format(addDays(new Date(reservation.checkOutDate), 15), 'yyyy-MM-dd'),
        paidAmount: property.teamPayment || '0',
        status: 'paid',
        description: `Serviço de limpeza para reserva [DEMO]: ${property.name} (${format(new Date(reservation.checkOutDate), 'dd/MM/yyyy')})`,
        externalReference: `CLEAN-DEMO-${Date.now().toString().slice(-6)}`,
      };
      
      const createdExpense = await storage.createFinancialDocument(cleaningExpense);
      
      // Mark as demo data
      await createDemoDataMarker('financial_document', createdExpense.id);
      
      // Create expense item
      const cleaningExpenseItem: InsertFinancialDocumentItem = {
        documentId: createdExpense.id,
        description: `Limpeza após checkout [DEMO]`,
        amount: property.teamPayment || '0',
        propertyId: property.id,
        reservationId: reservation.id,
        quantity: 1,
        unitValue: property.teamPayment || '0',
        taxRate: '0',
        notes: 'Item de demonstração',
      };
      
      await storage.createFinancialDocumentItem(cleaningExpenseItem);
      
      // Create payment
      const expensePayment: InsertPaymentRecord = {
        documentId: createdExpense.id,
        paymentDate: format(addDays(new Date(reservation.checkOutDate), 3), 'yyyy-MM-dd'),
        method: 'bank_transfer',
        amount: property.teamPayment || '0',
        externalReference: `PAY-DEMO-${Date.now().toString().slice(-6)}`,
        notes: 'Pagamento de demonstração',
        attachment: null,
      };
      
      await storage.createPaymentRecord(expensePayment);
    }
    
  } catch (error) {
    console.error('Error generating financial documents for reservation:', error);
  }
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

// Get all demo data markers
async function getDemoDataMarkers(): Promise<{entityType: string, entityId: number}[]> {
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

// Reset all demo data
export async function resetDemoData(): Promise<{success: boolean, removedItems: number}> {
  try {
    const demoMarkers = await getDemoDataMarkers();
    let removedCount = 0;
    
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
    
    // Delete demo entities by type
    if (markersByType['financial_document']) {
      for (const id of markersByType['financial_document']) {
        const success = await storage.deleteFinancialDocument(id);
        if (success) removedCount++;
      }
    }
    
    if (markersByType['reservation']) {
      for (const id of markersByType['reservation']) {
        const success = await storage.deleteReservation(id);
        if (success) removedCount++;
      }
    }
    
    if (markersByType['property']) {
      for (const id of markersByType['property']) {
        const success = await storage.deleteProperty(id);
        if (success) removedCount++;
      }
    }
    
    if (markersByType['owner']) {
      for (const id of markersByType['owner']) {
        const success = await storage.deleteOwner(id);
        if (success) removedCount++;
      }
    }
    
    // Delete the markers themselves
    for (const markerId of markerIds) {
      // For simple implementation, we have no deleteActivity method
      // In a real app, this would delete the marker records
    }
    
    return {
      success: true,
      removedItems: removedCount
    };
  } catch (error) {
    console.error('Error resetting demo data:', error);
    return {
      success: false,
      removedItems: 0
    };
  }
}

// Endpoint handlers
export async function generateDemoData(req: Request, res: Response) {
  try {
    const options = req.body.include || ['properties', 'owners', 'reservations', 'activities', 'financialDocuments'];
    
    let ownerIds: number[] = [];
    let propertyIds: number[] = [];
    let reservationIds: number[] = [];
    let activityIds: number[] = [];
    
    // Generate data in the correct order (owners -> properties -> reservations -> activities)
    if (options.includes('owners')) {
      ownerIds = await generateDemoOwners(3);
    }
    
    if (options.includes('properties')) {
      propertyIds = await generateDemoProperties(5);
    }
    
    if (options.includes('reservations')) {
      reservationIds = await generateDemoReservations(15);
    }
    
    if (options.includes('activities')) {
      activityIds = await generateDemoActivities(10);
    }
    
    // Financial documents are generated as part of reservations
    
    const totalItems = ownerIds.length + propertyIds.length + reservationIds.length + activityIds.length;
    
    res.status(200).json({
      success: true,
      message: 'Demo data generated successfully',
      itemsCreated: totalItems,
      details: {
        owners: ownerIds.length,
        properties: propertyIds.length,
        reservations: reservationIds.length,
        activities: activityIds.length
      }
    });
  } catch (error) {
    console.error('Error generating demo data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating demo data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function resetDemoDataHandler(req: Request, res: Response) {
  try {
    const result = await resetDemoData();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Demo data reset successfully',
        removedItems: result.removedItems
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error resetting demo data'
      });
    }
  } catch (error) {
    console.error('Error in reset demo data handler:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting demo data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}