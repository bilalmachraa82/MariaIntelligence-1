# Regras de Cálculo Financeiro - Sistema Maria Faz

## 1. CÁLCULO DE VALOR LÍQUIDO DE RESERVA

### Fórmula Principal
```typescript
function calculateNetAmount(
  totalAmount: number,     // Valor total da reserva
  platformFee: number = 0, // Taxa da plataforma (Booking.com, Airbnb)
  cleaningFee: number = 0, // Taxa de limpeza
  teamPayment: number = 0, // Pagamento à equipa de limpeza
  checkInFee: number = 0,  // Taxa de check-in
  commissionFee: number = 0 // Comissão de gestão
): number {
  return totalAmount - platformFee - cleaningFee - teamPayment - checkInFee - commissionFee;
}
```

### Aplicação Automática por Propriedade
Quando uma propriedade é selecionada numa reserva, os custos são calculados automaticamente:

```typescript
const updatePropertyCosts = (propertyId: number) => {
  const selectedProperty = properties.find(p => p.id === propertyId);
  const totalAmount = Number(form.getValues("totalAmount"));
  const platformFee = Number(form.getValues("platformFee"));
  
  // Custos fixos da propriedade
  const cleaningFee = Number(selectedProperty.cleaningCost);
  const checkInFee = Number(selectedProperty.checkInFee);
  const teamPayment = Number(selectedProperty.teamPayment);
  
  // Comissão calculada como percentagem do valor total
  const commissionFee = (totalAmount * Number(selectedProperty.commission)) / 100;
  
  // Valor líquido final
  const netAmount = calculateNetAmount(
    totalAmount, cleaningFee, checkInFee, commissionFee, teamPayment, platformFee
  );
};
```

## 2. SISTEMA DE ORÇAMENTOS DE LIMPEZA

### Engine de Preços por Área
```typescript
class PricingEngine {
  calculatePrice(params: QuotationParams): PricingResult {
    // Preço base por m²
    let basePrice = this.getBasePriceByArea(params.propertyArea);
    
    // Multiplicadores por tipo de propriedade
    const typeMultipliers = {
      'T0': 1.0,    // Estúdio
      'T1': 1.2,    // 1 quarto
      'T2': 1.5,    // 2 quartos
      'T3': 1.8,    // 3 quartos
      'T4': 2.2,    // 4 quartos
      'T5': 2.5,    // 5+ quartos
      'V1': 1.8,    // Moradia pequena
      'V2': 2.2,    // Moradia média
      'V3': 2.8,    // Moradia grande
      'V4': 3.5,    // Moradia premium
      'V5': 4.0     // Moradia luxury
    };
    
    basePrice *= typeMultipliers[params.propertyType] || 1.0;
    
    // Ajustes por divisões adicionais
    const roomAdjustment = this.calculateRoomAdjustment(
      params.bedrooms, 
      params.bathrooms
    );
    basePrice += roomAdjustment;
    
    // Serviços adicionais com preços fixos
    let additionalServices = 0;
    if (params.includeSupplies) additionalServices += basePrice * 0.15;  // +15% do preço base
    if (params.includeLaundry) additionalServices += 25;                 // €25 fixos
    if (params.includeIroning) additionalServices += 15;                 // €15 fixos
    if (params.includeDisinfection) additionalServices += basePrice * 0.10; // +10% do preço base
    if (params.includeWindowCleaning) additionalServices += 30;          // €30 fixos
    
    // Horas extra a €15/hora
    const extraHoursPrice = params.extraHoursQuantity * 15;
    
    const totalPrice = basePrice + additionalServices + extraHoursPrice;
    
    return {
      basePrice,
      additionalServices,
      extraHoursPrice,
      totalPrice,
      breakdown: this.generateBreakdown(params, basePrice, additionalServices, extraHoursPrice)
    };
  }
  
  private getBasePriceByArea(area: number): number {
    // Tabela de preços por m²
    if (area <= 50) return 35;        // Apartamentos pequenos
    if (area <= 80) return 45;        // Apartamentos médios
    if (area <= 120) return 60;       // Apartamentos grandes
    if (area <= 200) return 80;       // Moradias pequenas/médias
    return 100;                       // Moradias grandes/luxury
  }
  
  private calculateRoomAdjustment(bedrooms: number, bathrooms: number): number {
    let adjustment = 0;
    
    // €8 por quarto extra além do primeiro
    if (bedrooms > 1) {
      adjustment += (bedrooms - 1) * 8;
    }
    
    // €12 por casa de banho extra além da primeira
    if (bathrooms > 1) {
      adjustment += (bathrooms - 1) * 12;
    }
    
    return adjustment;
  }
}
```

## 3. CÁLCULOS DE ESTATÍSTICAS FINANCEIRAS

### Receita Total por Período
```sql
-- Receita total de reservas confirmadas/completadas
SELECT SUM(CAST(total_amount AS DECIMAL)) as total_revenue
FROM reservations 
WHERE status IN ('confirmed', 'completed')
  AND check_in_date BETWEEN $1 AND $2;
```

### Lucro Líquido por Período
```sql
-- Lucro = Receita Total - Todos os Custos
SELECT 
  SUM(CAST(total_amount AS DECIMAL)) as total_revenue,
  SUM(CAST(COALESCE(cleaning_fee, '0') AS DECIMAL)) as total_cleaning_costs,
  SUM(CAST(COALESCE(check_in_fee, '0') AS DECIMAL)) as total_checkin_costs,
  SUM(CAST(COALESCE(commission_fee, '0') AS DECIMAL)) as total_commission,
  SUM(CAST(COALESCE(team_payment, '0') AS DECIMAL)) as total_team_payments,
  SUM(CAST(COALESCE(platform_fee, '0') AS DECIMAL)) as total_platform_fees,
  SUM(CAST(total_amount AS DECIMAL)) - 
  SUM(CAST(COALESCE(cleaning_fee, '0') AS DECIMAL) + 
      CAST(COALESCE(check_in_fee, '0') AS DECIMAL) + 
      CAST(COALESCE(commission_fee, '0') AS DECIMAL) + 
      CAST(COALESCE(team_payment, '0') AS DECIMAL) + 
      CAST(COALESCE(platform_fee, '0') AS DECIMAL)) as net_profit
FROM reservations 
WHERE status IN ('confirmed', 'completed')
  AND check_in_date BETWEEN $1 AND $2;
```

### Taxa de Ocupação
```typescript
async getOccupancyRate(propertyId?: number, startDate?: Date, endDate?: Date): Promise<number> {
  // Calcular dias totais no período
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  
  // Query para dias ocupados
  const query = `
    SELECT 
      COALESCE(SUM(
        EXTRACT(days FROM (
          LEAST(check_out_date::date, $3::date) - 
          GREATEST(check_in_date::date, $2::date) + 1
        ))
      ), 0) as occupied_days
    FROM reservations 
    WHERE status IN ('confirmed', 'completed')
      AND check_in_date <= $3 
      AND check_out_date >= $2
      ${propertyId ? 'AND property_id = $4' : ''}
  `;
  
  const params = [startDate, endDate, endDate, startDate];
  if (propertyId) params.push(propertyId);
  
  const result = await this.db.query(query, params);
  const occupiedDays = Number(result.rows[0]?.occupied_days) || 0;
  
  // Se for propriedade específica, dividir por 1 propriedade
  // Se for todas as propriedades, dividir pelo número total de propriedades ativas
  const divisor = propertyId ? totalDays : (totalDays * totalActiveProperties);
  
  return divisor > 0 ? (occupiedDays / divisor) * 100 : 0;
}
```

## 4. RELATÓRIOS FINANCEIROS POR PROPRIETÁRIO

### Estrutura do Relatório
```typescript
interface OwnerFinancialReport {
  owner: Owner;
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;        // Receita bruta
    totalCosts: number;          // Custos operacionais
    netProfit: number;           // Lucro líquido
    occupancyRate: number;       // Taxa ocupação
    reservationsCount: number;   // Número de reservas
  };
  properties: PropertyReport[];  // Detalhes por propriedade
}
```

### Cálculo por Propriedade
```typescript
// Para cada propriedade do proprietário
const propertyReport = {
  property,
  reservations: reservationsForProperty,
  
  // Receitas
  totalRevenue: reservations.reduce((sum, r) => sum + Number(r.total_amount || 0), 0),
  
  // Custos operacionais
  cleaningCosts: reservations.reduce((sum, r) => sum + Number(r.cleaning_fee || 0), 0),
  checkInCosts: reservations.reduce((sum, r) => sum + Number(r.check_in_fee || 0), 0),
  commissionCosts: reservations.reduce((sum, r) => sum + Number(r.commission_fee || 0), 0),
  teamPayments: reservations.reduce((sum, r) => sum + Number(r.team_payment || 0), 0),
  platformFees: reservations.reduce((sum, r) => sum + Number(r.platform_fee || 0), 0),
  
  // Custos de manutenção (se existirem)
  maintenanceCosts: await this.getMaintenanceCosts(property.id, startDate, endDate),
  
  // Lucro líquido
  netProfit: totalRevenue - (cleaningCosts + checkInCosts + commissionCosts + teamPayments + platformFees + maintenanceCosts)
};
```

## 5. CUSTOS FIXOS MENSAIS

### Propriedades com Pagamento Fixo
Algumas propriedades têm acordo de pagamento fixo mensal:

```typescript
// Propriedade Aroeira 1 (ID: 35) tem custo fixo de €75/mês
{
  id: 35,
  name: "Aroeira 1",
  monthlyFixedCost: "75.00",  // Custo fixo mensal
  cleaningCost: "0.00",       // Sem custos variáveis
  checkInFee: "0.00",
  commission: "0.00",
  teamPayment: "0.00"
}
```

### Cálculo para Propriedades Fixas
```typescript
if (property.monthlyFixedCost && Number(property.monthlyFixedCost) > 0) {
  // Usar valor fixo mensal independente das reservas
  const fixedMonthlyAmount = Number(property.monthlyFixedCost);
  
  propertyReport.paymentType = 'fixed';
  propertyReport.fixedAmount = fixedMonthlyAmount;
  propertyReport.netProfit = fixedMonthlyAmount;
  propertyReport.notes = 'Pagamento fixo mensal acordo';
} else {
  // Usar cálculo tradicional baseado em reservas
  propertyReport.paymentType = 'variable';
  propertyReport.netProfit = totalRevenue - totalCosts;
}
```

## 6. ANÁLISE DE PERFORMANCE

### Métricas de Benchmark
```typescript
const performanceAnalysis = {
  // Receita média por reserva
  avgRevenuePerReservation: totalRevenue / reservationsCount,
  
  // Margem de lucro
  profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
  
  // Classificação de performance
  performanceRating: {
    excellent: profitMargin > 70,    // Margem > 70%
    good: profitMargin > 50,         // Margem 50-70%
    average: profitMargin > 30,      // Margem 30-50%
    poor: profitMargin <= 30         // Margem < 30%
  },
  
  // Alertas automáticos
  alerts: [
    avgRevenue < 80 ? 'Preços potencialmente baixos' : null,
    avgRevenue > 150 ? 'Preços podem estar a limitar procura' : null,
    occupancyRate < 40 ? 'Taxa ocupação muito baixa' : null,
    reservationsCount === 0 ? 'Zero reservas - situação crítica' : null
  ].filter(Boolean)
};
```

## 7. RECEITA MENSAL AGREGADA

### Granularidade Automática
```typescript
function determineGranularity(startDate: Date, endDate: Date): 'week' | 'month' | 'quarter' {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  
  if (diffDays <= 30) return 'week';        // Até 30 dias: semanal
  if (diffDays <= 365) return 'month';      // Até 1 ano: mensal
  return 'quarter';                         // Mais de 1 ano: trimestral
}
```

### Agrupamento por Mês
```typescript
const revenueByMonth = months.map((month, index) => {
  const monthReservations = confirmedReservations.filter(r => {
    const checkInDate = new Date(r.checkInDate);
    return checkInDate.getMonth() === index;
  });
  
  const monthRevenue = monthReservations.reduce((sum, r) => sum + Number(r.totalAmount), 0);
  const monthCosts = monthReservations.reduce((sum, r) => {
    return sum + Number(r.cleaningFee || 0) + Number(r.checkInFee || 0) + 
           Number(r.commissionFee || 0) + Number(r.teamPayment || 0) + 
           Number(r.platformFee || 0);
  }, 0);
  
  return {
    month,
    revenue: monthRevenue,
    profit: monthRevenue - monthCosts,
    reservationsCount: monthReservations.length
  };
});
```

## 8. REGRAS DE ARREDONDAMENTO

### Valores Monetários
- Todos os cálculos usam 2 casas decimais
- Arredondamento matemático padrão (0.5 para cima)
- Apresentação sempre com símbolo € e formato português

### Percentagens
- Taxa de ocupação: 1 casa decimal (ex: 65.3%)
- Margem de lucro: 1 casa decimal (ex: 45.8%)
- Comissões: 2 casas decimais para cálculo, 1 para apresentação

Estas regras garantem consistência nos cálculos financeiros em todo o sistema e permitem auditoria completa de todos os valores apresentados aos utilizadores.