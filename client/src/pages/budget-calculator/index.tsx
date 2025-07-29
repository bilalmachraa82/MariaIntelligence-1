import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { Calculator } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BudgetCalculator } from "@/components/budget/budget-calculator";

export default function BudgetCalculatorPage() {
  const { t } = useTranslation();

  return (
    <div className="py-6">
      <Container>
        <PageHeader
          title={t("budgetCalculator.title", "Calculadora de Orçamento")}
          description={t(
            "budgetCalculator.description",
            "Calcule valores de reservas baseados em datas e taxas diárias"
          )}
          icon={<Calculator className="h-6 w-6" />}
        />
        
        <div className="mt-8">
          <BudgetCalculator />
        </div>
      </Container>
    </div>
  );
}