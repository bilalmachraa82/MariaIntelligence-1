import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, CalendarDays, Euro } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBudgetCalculator } from "@/hooks/use-budget-calculator";
import { DatePicker } from "@/components/ui/date-picker";

export function BudgetCalculator() {
  const { t } = useTranslation();
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
  const [nightlyRate, setNightlyRate] = useState<string>("");
  const [nights, setNights] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [margin, setMargin] = useState<number | null>(null);
  const [calculationMode, setCalculationMode] = useState<'dates' | 'nights'>('dates');
  
  const { 
    getNights, 
    calculateBudget, 
    calculateBudgetFromDates, 
    isLoading, 
    error 
  } = useBudgetCalculator();
  
  // Converter datas para string no formato YYYY-MM-DD
  const formatDateString = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };
  
  // Calcular noites quando as datas mudarem
  const updateNightsFromDates = () => {
    if (checkInDate && checkOutDate) {
      const calculatedNights = getNights(
        formatDateString(checkInDate),
        formatDateString(checkOutDate)
      );
      setNights(calculatedNights);
    }
  };
  
  // Função para calcular orçamento baseado no modo selecionado
  const handleCalculate = async () => {
    // Validar entrada
    const rate = parseFloat(nightlyRate);
    if (isNaN(rate) || rate <= 0) {
      return;
    }
    
    if (calculationMode === 'dates') {
      if (!checkInDate || !checkOutDate) {
        return;
      }
      
      // Calcular orçamento com base nas datas
      const result = await calculateBudgetFromDates(
        formatDateString(checkInDate),
        formatDateString(checkOutDate),
        rate
      );
      
      if (result) {
        setNights(result.nights);
        setTotalAmount(result.total);
        setMargin(result.margin);
      }
    } else {
      // Calcular orçamento com base no número de noites
      if (!nights || nights <= 0) {
        return;
      }
      
      const result = await calculateBudget(nights, rate);
      
      if (result) {
        setTotalAmount(result.total);
        setMargin(result.margin);
      }
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          {t("budget.calculator.title", "Calculadora de Orçamento")}
        </CardTitle>
        <CardDescription>
          {t("budget.calculator.description", "Calcule o orçamento para uma reserva com base nas datas ou no número de noites")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Seleção do modo de cálculo */}
        <div className="flex space-x-2 mb-4">
          <Button 
            variant={calculationMode === 'dates' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setCalculationMode('dates')}
            className="flex-1"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            {t("budget.calculator.byDates", "Por Datas")}
          </Button>
          <Button 
            variant={calculationMode === 'nights' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setCalculationMode('nights')}
            className="flex-1"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {t("budget.calculator.byNights", "Por Noites")}
          </Button>
        </div>
        
        {/* Formulário de cálculo baseado em datas */}
        {calculationMode === 'dates' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check-in">
                  {t("budget.calculator.checkIn", "Check-in")}
                </Label>
                <DatePicker
                  id="check-in"
                  selected={checkInDate}
                  onSelect={(date) => {
                    setCheckInDate(date);
                    if (checkOutDate) {
                      updateNightsFromDates();
                    }
                  }}
                  placeholder={t("budget.calculator.selectDate", "Selecionar data")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="check-out">
                  {t("budget.calculator.checkOut", "Check-out")}
                </Label>
                <DatePicker
                  id="check-out"
                  selected={checkOutDate}
                  onSelect={(date) => {
                    setCheckOutDate(date);
                    if (checkInDate) {
                      updateNightsFromDates();
                    }
                  }}
                  disabled={!checkInDate}
                  fromDate={checkInDate ? new Date(checkInDate.getTime() + 86400000) : undefined}
                  placeholder={t("budget.calculator.selectDate", "Selecionar data")}
                />
              </div>
            </div>
            
            {nights !== null && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>
                  {t("budget.calculator.selectedNights", "Noites selecionadas")}: 
                  <span className="font-semibold ml-1">{nights}</span>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="nights">
              {t("budget.calculator.nights", "Número de Noites")}
            </Label>
            <Input
              id="nights"
              type="number"
              min="1"
              value={nights || ''}
              onChange={(e) => setNights(parseInt(e.target.value) || 0)}
              placeholder={t("budget.calculator.enterNights", "Insira o número de noites")}
            />
          </div>
        )}
        
        {/* Taxa por noite (comum a ambos os modos) */}
        <div className="space-y-2">
          <Label htmlFor="nightly-rate">
            {t("budget.calculator.nightlyRate", "Taxa por Noite (€)")}
          </Label>
          <div className="relative">
            <Input
              id="nightly-rate"
              type="number"
              min="0"
              step="0.01"
              value={nightlyRate}
              onChange={(e) => setNightlyRate(e.target.value)}
              placeholder={t("budget.calculator.enterRate", "Insira a taxa por noite")}
              className="pl-8"
            />
            <Euro className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {/* Mensagem de erro */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Resultados do cálculo */}
        {totalAmount !== null && margin !== null && (
          <div className="mt-6 space-y-3 p-4 border rounded-md bg-muted/30">
            <h3 className="font-medium text-sm">{t("budget.calculator.results", "Resultados")}</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background p-3 rounded border">
                <p className="text-xs text-muted-foreground">{t("budget.calculator.totalAmount", "Valor Total")}</p>
                <p className="text-lg font-semibold">{totalAmount.toFixed(2)} €</p>
              </div>
              
              <div className="bg-background p-3 rounded border">
                <p className="text-xs text-muted-foreground">{t("budget.calculator.margin", "Margem (10%)")}</p>
                <p className="text-lg font-semibold">{margin.toFixed(2)} €</p>
              </div>
            </div>
            
            <div className="bg-background p-3 rounded border">
              <p className="text-xs text-muted-foreground">{t("budget.calculator.ownerRevenue", "Receita do Proprietário")}</p>
              <p className="text-lg font-semibold">{(totalAmount - margin).toFixed(2)} €</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleCalculate}
          disabled={isLoading || 
            (calculationMode === 'dates' && (!checkInDate || !checkOutDate)) || 
            (calculationMode === 'nights' && (!nights || nights <= 0)) || 
            !nightlyRate || parseFloat(nightlyRate) <= 0
          }
        >
          {isLoading ? t("budget.calculator.calculating", "Calculando...") : t("budget.calculator.calculate", "Calcular")}
        </Button>
      </CardFooter>
    </Card>
  );
}