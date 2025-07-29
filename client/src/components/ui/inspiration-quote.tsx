import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Heart, SunMoon, Book, Coffee, Lightbulb } from "lucide-react";

/**
 * Tipos de contexto para citações inspiradoras
 * Define os diferentes contextos onde as citações podem ser exibidas,
 * permitindo exibir mensagens relevantes para cada seção do app
 */
type QuoteContext = 
  | "dashboard" 
  | "reservations" 
  | "properties" 
  | "finance" 
  | "reports" 
  | "general";

/**
 * Variações visuais do componente de citação
 */
type QuoteVariant = 
  | "default"    // Card com fundo e borda completos
  | "minimal"    // Sem card, apenas texto e ícone
  | "subtle"     // Card com background suave
  | "highlight"; // Card com destaque especial

/**
 * Interface para uma citação individual
 */
interface Quote {
  text: string;
  author: string;
  source?: string;
  tags: string[];
}

/**
 * Coleção de citações inspiradoras organizadas por contexto
 * Cada contexto tem suas próprias citações relevantes
 */
const quotesByContext: Record<QuoteContext, Quote[]> = {
  dashboard: [
    {
      text: "Cada novo dia é uma nova oportunidade para melhorar.",
      author: "Provérbio",
      tags: ["motivação", "trabalho", "esperança"]
    },
    {
      text: "A persistência é o caminho do êxito.",
      author: "Charles Chaplin",
      tags: ["motivação", "trabalho", "persistência"]
    },
    {
      text: "O segredo de um dia bem organizado está na planificação da noite anterior.",
      author: "Provérbio Português",
      tags: ["organização", "trabalho", "planejamento"]
    }
  ],
  reservations: [
    {
      text: "O melhor serviço vem do coração, não apenas das mãos.",
      author: "Provérbio de Hospitalidade",
      tags: ["serviço", "hospitalidade", "atendimento"]
    },
    {
      text: "Cada hóspede traz bênçãos para a casa.",
      author: "Provérbio Português",
      tags: ["hospitalidade", "recepção", "gratidão"]
    },
    {
      text: "Uma boa gestão de reservas é o primeiro passo para a satisfação do cliente.",
      author: "Maria Faz",
      tags: ["organização", "hospitalidade", "gestão"]
    }
  ],
  properties: [
    {
      text: "Um espaço bem cuidado é um reflexo da alma de quem o habita.",
      author: "Provérbio",
      tags: ["espaço", "cuidado", "organização"]
    },
    {
      text: "O lar é onde a história começa.",
      author: "Provérbio",
      tags: ["lar", "acolhimento", "história"]
    },
    {
      text: "Uma casa bem gerida traz prosperidade para todos.",
      author: "Provérbio Português",
      tags: ["gestão", "prosperidade", "organização"]
    }
  ],
  finance: [
    {
      text: "A prosperidade é uma consequência natural de escolhas bem feitas.",
      author: "Provérbio de Negócios",
      tags: ["prosperidade", "escolhas", "negócios"]
    },
    {
      text: "Cuida dos centavos que os euros cuidarão de si mesmos.",
      author: "Adaptação de Provérbio Inglês",
      tags: ["economia", "gestão", "finanças"]
    },
    {
      text: "A boa contabilidade é o princípio da prosperidade.",
      author: "Maria Faz",
      tags: ["contabilidade", "prosperidade", "organização"]
    }
  ],
  reports: [
    {
      text: "O conhecimento é poder apenas quando posto em prática.",
      author: "Provérbio",
      tags: ["conhecimento", "ação", "decisão"]
    },
    {
      text: "Os números contam histórias para quem os sabe interpretar.",
      author: "Provérbio de Análise",
      tags: ["análise", "decisão", "dados"]
    },
    {
      text: "Dados são apenas o começo da sabedoria, não o seu fim.",
      author: "Maria Faz",
      tags: ["dados", "sabedoria", "decisão"]
    }
  ],
  general: [
    {
      text: "O segredo da mudança é focar toda sua energia não em lutar contra o velho, mas em construir o novo.",
      author: "Sócrates",
      tags: ["mudança", "foco", "construção"]
    },
    {
      text: "A gratidão transforma o que temos em suficiente.",
      author: "Provérbio",
      tags: ["gratidão", "contentamento", "abundância"]
    },
    {
      text: "Não é o que acontece com você, mas como você reage que importa.",
      author: "Epicteto",
      tags: ["reação", "atitude", "sabedoria"]
    }
  ]
};

/**
 * Mapeia os ícones para cada contexto
 */
const contextIcons: Record<QuoteContext, React.ReactNode> = {
  dashboard: <Coffee className="h-5 w-5 text-primary-500" />,
  reservations: <Heart className="h-5 w-5 text-rose-500" />,
  properties: <SunMoon className="h-5 w-5 text-amber-500" />,
  finance: <Sparkles className="h-5 w-5 text-emerald-500" />,
  reports: <Book className="h-5 w-5 text-indigo-500" />,
  general: <Lightbulb className="h-5 w-5 text-sky-500" />
};

/**
 * Estilos para cada variante de exibição
 */
const variantStyles: Record<QuoteVariant, string> = {
  default: "bg-white border rounded-lg shadow-sm",
  minimal: "border-none shadow-none bg-transparent",
  subtle: "bg-muted/30 border border-muted rounded-lg",
  highlight: "bg-primary-50 border border-primary-200 shadow-md rounded-lg"
};

/**
 * Interface de propriedades do componente InspirationQuote
 */
interface InspirationQuoteProps {
  /** Contexto para selecionar citações relevantes */
  context?: QuoteContext;
  /** Variação visual do componente */
  variant?: QuoteVariant;
  /** Número fixo de citação (de 0 a 2) ou undefined para aleatório */
  quoteIndex?: number;
  /** Classe CSS adicional */
  className?: string;
  /** Se verdadeiro, muda a citação a cada intervalo de tempo */
  rotating?: boolean;
  /** Intervalo em ms para rotação (padrão: 12000ms) */
  rotationInterval?: number;
}

/**
 * Componente para exibir citações inspiradoras contextuais
 */
export function InspirationQuote({
  context = "general",
  variant = "default",
  quoteIndex,
  className = "",
  rotating = false,
  rotationInterval = 12000
}: InspirationQuoteProps) {
  const { t } = useTranslation();
  
  // Se quoteIndex for fornecido, usamos ele, senão escolhemos aleatoriamente
  const initialIndex = quoteIndex !== undefined 
    ? quoteIndex 
    : Math.floor(Math.random() * quotesByContext[context].length);
  
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  
  // Configurar rotação automática se rotating=true
  useEffect(() => {
    if (!rotating) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % quotesByContext[context].length;
        return nextIndex;
      });
    }, rotationInterval);
    
    return () => clearInterval(interval);
  }, [rotating, rotationInterval, context]);
  
  // Obter a citação atual
  const currentQuote = quotesByContext[context][currentIndex];
  
  // Formatar o componente com base na variante
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-3 px-3 py-2 ${className}`}>
        {contextIcons[context]}
        <div className="flex-1">
          <p className="text-sm italic text-muted-foreground">
            "{currentQuote.text}" <span className="font-semibold">— {currentQuote.author}</span>
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <Card className={`overflow-hidden ${variantStyles[variant]} ${className}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="mt-1">
            {contextIcons[context]}
          </div>
          <div>
            <p className="text-sm italic text-muted-foreground">
              "{currentQuote.text}"
            </p>
            <p className="text-sm font-semibold mt-1">
              — {currentQuote.author}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}