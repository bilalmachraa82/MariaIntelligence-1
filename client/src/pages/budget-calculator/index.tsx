import { BudgetCalculator } from "@/components/budget/budget-calculator";
import { PageHeader } from "@/components/ui/page-header";
import { Container } from "@/components/ui/container";
import { DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function BudgetCalculatorPage() {
  const { t } = useTranslation();
  
  return (
    <Container>
      <PageHeader
        icon={<DollarSign className="h-6 w-6 text-primary" />}
        title={t("budget.page.title", "Calculadora de Orçamento")}
        description={t("budget.page.description", "Calcule orçamentos de reservas com base em datas ou noites")}
      />
      
      <div className="mt-8">
        <BudgetCalculator />
      </div>
    </Container>
  );
}