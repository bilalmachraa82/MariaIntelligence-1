import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DatePicker } from "@/components/ui/date-picker";
import { useBudgetCalculator } from "@/hooks/use-budget-calculator";
import { BudgetEstimate } from "@/lib/budget";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";

export function BudgetCalculator() {
  const { t } = useTranslation();
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
  const [nightlyRate, setNightlyRate] = useState<string>("100");
  const [nights, setNights] = useState<number>(0);
  const [budgetEstimate, setBudgetEstimate] = useState<BudgetEstimate | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { getNights, calculateBudget, calculateBudgetFromDates } = useBudgetCalculator();

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const nightsCount = getNights(
        format(checkInDate, "yyyy-MM-dd"),
        format(checkOutDate, "yyyy-MM-dd")
      );
      setNights(nightsCount > 0 ? nightsCount : 0);
    } else {
      setNights(0);
    }
  }, [checkInDate, checkOutDate, getNights]);

  const handleNightlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
    setNightlyRate(value);
  };

  const handleCalculate = async () => {
    if (!checkInDate || !checkOutDate) {
      setError(t("budgetCalculator.errors.missingDates", "Por favor, selecione as datas de check-in e check-out."));
      return;
    }

    if (!nightlyRate || parseFloat(nightlyRate) <= 0) {
      setError(t("budgetCalculator.errors.invalidRate", "Por favor, insira uma taxa diária válida."));
      return;
    }

    setError(null);
    setIsCalculating(true);

    try {
      const rate = parseFloat(nightlyRate);
      
      const estimate = await calculateBudgetFromDates(
        format(checkInDate, "yyyy-MM-dd"),
        format(checkOutDate, "yyyy-MM-dd"),
        rate
      );
      
      setBudgetEstimate(estimate);
    } catch (err) {
      console.error("Erro ao calcular orçamento:", err);
      setError(t("budgetCalculator.errors.calculationFailed", "Erro ao calcular orçamento. Tente novamente."));
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    setNightlyRate("100");
    setNights(0);
    setBudgetEstimate(null);
    setError(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const handleCheckInDateSelect = (date: Date) => {
    setCheckInDate(date);
    // Se a data de check-out for anterior à nova data de check-in, limpe-a
    if (checkOutDate && date > checkOutDate) {
      setCheckOutDate(undefined);
    }
  };

  const handleCheckOutDateSelect = (date: Date) => {
    setCheckOutDate(date);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t("budgetCalculator.title", "Calculadora de Orçamento")}</CardTitle>
        <CardDescription>
          {t("budgetCalculator.instructions", "Insira as datas de check-in e check-out e a taxa diária para calcular o orçamento.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-in-date">
                {t("budgetCalculator.checkInDate", "Data de Check-in")}
              </Label>
              <DatePicker
                id="check-in-date"
                selected={checkInDate}
                onSelect={handleCheckInDateSelect}
                fromDate={new Date()}
                placeholder={t("budgetCalculator.selectDate", "Selecionar data")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-out-date">
                {t("budgetCalculator.checkOutDate", "Data de Check-out")}
              </Label>
              <DatePicker
                id="check-out-date"
                selected={checkOutDate}
                onSelect={handleCheckOutDateSelect}
                fromDate={checkInDate || new Date()}
                placeholder={t("budgetCalculator.selectDate", "Selecionar data")}
                disabled={!checkInDate}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nightly-rate">
              {t("budgetCalculator.nightlyRate", "Taxa Diária (€)")}
            </Label>
            <Input
              id="nightly-rate"
              type="text"
              value={nightlyRate}
              onChange={handleNightlyRateChange}
              className="max-w-xs"
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t("budgetCalculator.nights", "Noites")}
            </Label>
            <div className="text-2xl font-bold">{nights}</div>
          </div>

          {budgetEstimate && (
            <>
              <Separator className="my-2" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {t("budgetCalculator.estimateResults", "Resultado da Estimativa")}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t("budgetCalculator.totalAmount", "Valor Total")}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(budgetEstimate.total)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t("budgetCalculator.yourMargin", "Sua Margem")}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(budgetEstimate.margin)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
        <Button
          onClick={handleCalculate}
          disabled={isCalculating || !checkInDate || !checkOutDate}
        >
          {isCalculating
            ? t("budgetCalculator.calculating", "Calculando...")
            : t("budgetCalculator.calculate", "Calcular Orçamento")}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleReset}
        >
          {t("budgetCalculator.reset", "Limpar")}
        </Button>
      </CardFooter>
    </Card>
  );
}