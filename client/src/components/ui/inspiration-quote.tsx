import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Heart, Coffee, Sparkles, Sun, Moon, Star } from "lucide-react";

// Coleção de ícones para variar a apresentação visual
const icons = [
  Lightbulb, 
  Heart, 
  Coffee, 
  Sparkles, 
  Sun, 
  Moon, 
  Star
];

interface InspirationQuoteProps {
  context?: 'dashboard' | 'reservations' | 'finance' | 'property' | 'reports' | 'general';
  className?: string;
  variant?: 'default' | 'subtle' | 'minimal';
}

export const InspirationQuote: React.FC<InspirationQuoteProps> = ({
  context = 'general',
  className,
  variant = 'default'
}) => {
  const [quote, setQuote] = useState<{ text: string; author: string }>();
  const [Icon, setIcon] = useState<React.ElementType>(Lightbulb);

  useEffect(() => {
    // Selecionamos um ícone aleatório quando o componente é montado
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    setIcon(randomIcon);
    
    // Seleciona uma citação baseada no contexto
    setQuote(getRandomQuote(context));
  }, [context]);

  if (!quote) return null;

  if (variant === 'minimal') {
    return (
      <div className={cn("text-muted-foreground italic text-sm flex items-center gap-2", className)}>
        <Icon className="h-4 w-4 text-primary" />
        <span>"{quote.text}" — {quote.author}</span>
      </div>
    );
  }

  if (variant === 'subtle') {
    return (
      <div className={cn("p-3 bg-muted/50 rounded-md text-sm flex items-start gap-3", className)}>
        <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="italic mb-1">"{quote.text}"</p>
          <p className="text-xs text-muted-foreground">— {quote.author}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden border-primary/20", className)}>
      <CardContent className="p-4 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="italic text-sm mb-2">"{quote.text}"</p>
          <p className="text-xs text-muted-foreground">— {quote.author}</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Coleção de citações organizadas por contexto
const quotes = {
  dashboard: [
    { text: "Gerenciar com sabedoria hoje traz paz amanhã.", author: "Maria Faz" },
    { text: "A organização é o primeiro passo para o sucesso.", author: "Peter Drucker" },
    { text: "Cada dia é uma nova oportunidade para ser melhor.", author: "Anónimo" },
    { text: "O êxito é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
    { text: "A felicidade está em fazer os outros felizes.", author: "Baden-Powell" }
  ],
  reservations: [
    { text: "Cada hóspede traz consigo uma nova história para contar.", author: "Maria Faz" },
    { text: "O detalhe faz a diferença entre o bom e o extraordinário.", author: "Anónimo" },
    { text: "Receba os hóspedes como receberia amigos em sua casa.", author: "Confúcio" },
    { text: "Viva, ame, receba com alegria.", author: "Maria Faz" },
    { text: "O sorriso é o idioma universal da hospitalidade.", author: "William Arthur Ward" }
  ],
  finance: [
    { text: "Vá atrás dos seus sonhos, mas leve a contabilidade junto.", author: "Anónimo" },
    { text: "O dinheiro não traz felicidade, mas a organização financeira traz paz.", author: "Maria Faz" },
    { text: "Quem guarda tem.", author: "Provérbio Português" },
    { text: "Prosperidade vem quando gerimos com sabedoria o que temos.", author: "Maria Faz" },
    { text: "Economizar é ganhar duas vezes.", author: "Provérbio Português" }
  ],
  property: [
    { text: "Uma casa não é feita de paredes, mas de memórias.", author: "Anónimo" },
    { text: "Cada propriedade tem uma história para contar.", author: "Maria Faz" },
    { text: "Cuide dos pequenos detalhes e os grandes cuidarão de si mesmos.", author: "Maria Faz" },
    { text: "O ambiente que criamos reflete o que somos por dentro.", author: "Anónimo" },
    { text: "Quando a casa está limpa, a mente descansa.", author: "Provérbio Japonês" }
  ],
  reports: [
    { text: "Os números contam uma história, basta saber ler.", author: "Maria Faz" },
    { text: "Dados são apenas dados até se tornarem conhecimento.", author: "Anónimo" },
    { text: "O que medimos, melhoramos.", author: "Peter Drucker" },
    { text: "Ver o passado com clareza ajuda a projetar um futuro melhor.", author: "Maria Faz" },
    { text: "Os números não mentem, mas precisam de um intérprete.", author: "Edward Deming" }
  ],
  general: [
    { text: "Cada manhã é uma nova página em branco, escreva uma boa história hoje.", author: "Anónimo" },
    { text: "A vida é 10% do que acontece connosco e 90% como reagimos a isso.", author: "Charles Swindoll" },
    { text: "Grandes coisas nunca vêm do conforto.", author: "Maria Faz" },
    { text: "A felicidade não é algo pronto. Ela vem das nossas próprias ações.", author: "Dalai Lama" },
    { text: "Quem sabe concentrar-se numa coisa e insistir nela como único objetivo, obtém, ao fim e ao cabo, a capacidade de fazer qualquer coisa.", author: "Fernando Pessoa" },
    { text: "Há apenas uma maneira de evitar críticas: não fazer nada, não dizer nada e não ser nada.", author: "Aristóteles" },
    { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
    { text: "Acredite que pode e já está a meio caminho.", author: "Theodore Roosevelt" },
    { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
    { text: "No meio da dificuldade encontra-se a oportunidade.", author: "Albert Einstein" }
  ]
};

// Função para selecionar uma citação aleatória com base no contexto
function getRandomQuote(context: string): { text: string; author: string } {
  const contextQuotes = quotes[context as keyof typeof quotes] || quotes.general;
  return contextQuotes[Math.floor(Math.random() * contextQuotes.length)];
}