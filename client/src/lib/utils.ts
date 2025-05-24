import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// UI Utility Functions
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatting Functions
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Calculation Functions
export function calculateDays(checkIn: string, checkOut: string): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(checkIn);
  const secondDate = new Date(checkOut);
  const diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay));
  return diffDays;
}

export function calculateDuration(startDate: string, endDate: string): string {
  const days = calculateDays(startDate, endDate);
  
  if (days === 1) {
    return "1 dia";
  }
  return `${days} dias`;
}

// Daily Inspirational Quotes
export function getDailyInspirationalQuote(): string {
  const quotes = [
    "O sucesso é a soma de pequenos esforços repetidos dia após dia. Continue a excelência no teu negócio!",
    "Cada hóspede satisfeito é uma nova oportunidade de crescimento. Faz a diferença hoje!",
    "A hospitalidade verdadeira vem do coração. Tu transforms casas em lares para os teus hóspedes.",
    "A gestão eficiente é a chave para o sucesso. Cada detalhe conta na tua jornada empresarial!",
    "Inovação e dedicação andam de mãos dadas. O teu alojamento local é um exemplo de excelência!",
    "O atendimento excepcional distingue-te da concorrência. Continua a superar expectativas!",
    "Cada reserva é uma história nova. Tu és o autor das melhores experiências de hospedagem!",
    "A paixão pelo que fazes reflete-se em cada detalhe. O teu trabalho faz a diferença!",
    "Sustentabilidade e qualidade são os pilares do futuro. O teu negócio está no caminho certo!",
    "A tecnologia é uma aliada poderosa. Usa-a para elevar o teu negócio ao próximo nível!",
    "Cada dia é uma nova oportunidade para exceder expectativas. Brilha hoje!",
    "A excelência não é um acto, mas um hábito. O teu padrão de qualidade é inspirador!",
    "O sucesso vem para quem se dedica com alma e coração. O teu trabalho é excepcional!",
    "Transforma desafios em oportunidades. A tua resiliência é admirável!",
    "A satisfação dos hóspedes é o reflexo da tua dedicação. Continua essa missão!",
    "Cada propriedade gerida com carinho torna-se especial. O teu toque pessoal faz a diferença!",
    "A organização é o primeiro passo para o sucesso. A tua gestão é exemplar!",
    "O futuro pertence aos que acreditam na beleza dos seus sonhos. Continua a sonhar alto!",
    "Qualidade e inovação são as marcas do teu sucesso. Mantém-te sempre à frente!",
    "Cada conquista começa com a decisão de tentar. O teu empreendedorismo é inspirador!",
    "A experiência do hóspede é o coração do negócio. Tu dominas essa arte!",
    "O profissionalismo e a paixão caminham juntos no teu trabalho. És uma referência!",
    "Cada detalhe cuidado com atenção constrói reputação. O teu trabalho é impecável!",
    "A gestão inteligente maximiza resultados. As tuas estratégias são brilhantes!",
    "O equilíbrio entre tecnologia e toque humano é a tua especialidade. Perfeito!",
    "Cada problema resolvido fortalece a tua experiência. Continua a crescer!",
    "A satisfação no trabalho reflete-se nos resultados. A tua paixão é contagiosa!",
    "Inovar é adaptar-se ao futuro. O teu negócio está sempre evoluindo!",
    "A excelência no atendimento é a tua marca registada. Continua essa tradição!",
    "Cada meta alcançada abre portas para novos objetivos. O céu é o limite!",
    "O teu compromisso com a qualidade inspira toda a equipa. És um verdadeiro líder!"
  ];
  
  // Use current date as seed for consistent daily quote
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % quotes.length;
  
  return quotes[quoteIndex];
}

export function calculateNetAmount(
  totalAmount: number, 
  platformFee: number = 0, 
  cleaningFee: number = 0, 
  teamPayment: number = 0,
  checkInFee: number = 0,
  commissionFee: number = 0
): number {
  return totalAmount - platformFee - cleaningFee - teamPayment - checkInFee - commissionFee;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Color Functions
export function calculateOccupancyColor(occupancy: number): string {
  if (occupancy >= 80) {
    return "bg-green-600";
  } else if (occupancy >= 50) {
    return "bg-yellow-600";
  } else {
    return "bg-red-600";
  }
}

// UI Colors and Variants
export const reservationStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-600/20 hover:bg-yellow-500/20",
  confirmed: "bg-green-500/10 text-green-600 border-green-600/20 hover:bg-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-600/20 hover:bg-red-500/20",
  completed: "bg-blue-500/10 text-blue-600 border-blue-600/20 hover:bg-blue-500/20"
};

export const platformColors: Record<string, string> = {
  airbnb: "text-pink-600",
  booking: "text-blue-600",
  expedia: "text-yellow-600",
  direct: "text-green-600",
  other: "text-gray-600"
};