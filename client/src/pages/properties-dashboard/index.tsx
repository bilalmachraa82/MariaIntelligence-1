import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Euro,
  Users,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Banknote
} from 'lucide-react';

interface Property {
  id: number;
  name: string;
  cleaningCost: string;
  checkInFee: string;
  commission: string;
  teamPayment: string;
  active: boolean;
  ownerName: string;
}

interface PropertyStats {
  totalReservations: number;
  yearReservations: number;
  recentReservations: any[];
}

interface CleaningSchedule {
  property: string;
  month: number;
  year: number;
  cleanings: any[];
  totalCleanings: number;
  totalCost: string;
}

export default function PropertiesDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null);
  const [cleaningSchedule, setCleaningSchedule] = useState<CleaningSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);

  // Carregar propriedades
  useEffect(() => {
    fetchProperties();
  }, []);

  // Filtrar propriedades
  useEffect(() => {
    let filtered = properties;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (filterActive !== 'all') {
      filtered = filtered.filter(property =>
        filterActive === 'active' ? property.active : !property.active
      );
    }

    setFilteredProperties(filtered);
  }, [properties, searchTerm, filterActive]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      setProperties(data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar propriedades:', error);
      setLoading(false);
    }
  };

  const fetchPropertyStats = async (propertyId: number) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/stats`);
      const data = await response.json();
      setPropertyStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const fetchCleaningSchedule = async (propertyId: number) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/cleaning-schedule`);
      const data = await response.json();
      setCleaningSchedule(data);
    } catch (error) {
      console.error('Erro ao carregar agenda de limpezas:', error);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    fetchPropertyStats(property.id);
    fetchCleaningSchedule(property.id);
  };

  // Cálculos financeiros
  const calculateFinancialSummary = () => {
    const activeProperties = properties.filter(p => p.active);

    return {
      totalProperties: properties.length,
      activeProperties: activeProperties.length,
      totalCleaningCost: activeProperties.reduce((sum, p) => sum + parseFloat(p.cleaningCost || '0'), 0),
      totalCheckInFees: activeProperties.reduce((sum, p) => sum + parseFloat(p.checkInFee || '0'), 0),
      propertiesWithCommission: activeProperties.filter(p => parseFloat(p.commission || '0') > 0).length,
      totalTeamPayments: activeProperties.reduce((sum, p) => sum + parseFloat(p.teamPayment || '0'), 0)
    };
  };

  const financialSummary = calculateFinancialSummary();

  if (loading) {
    return (
      <div className=\"flex items-center justify-center h-64\">
        <div className=\"text-center\">
          <Clock className=\"h-8 w-8 animate-spin mx-auto mb-2\" />
          <p>Carregando propriedades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"container mx-auto p-6 space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold\">Dashboard de Propriedades</h1>
          <p className=\"text-muted-foreground\">
            Gestão completa das suas {properties.length} propriedades
          </p>
        </div>
        <Button>
          <Building2 className=\"h-4 w-4 mr-2\" />
          Nova Propriedade
        </Button>
      </div>

      {/* Resumo Financeiro */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
        <Card>
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-muted-foreground\">Total de Propriedades</p>
                <p className=\"text-2xl font-bold\">{financialSummary.totalProperties}</p>
              </div>
              <Building2 className=\"h-8 w-8 text-blue-600\" />
            </div>
            <div className=\"mt-2\">
              <Badge variant={financialSummary.activeProperties === financialSummary.totalProperties ? \"default\" : \"secondary\"}>
                {financialSummary.activeProperties} ativas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-muted-foreground\">Custo Total Limpeza</p>
                <p className=\"text-2xl font-bold\">€{financialSummary.totalCleaningCost.toFixed(0)}</p>
              </div>
              <Euro className=\"h-8 w-8 text-green-600\" />
            </div>
            <p className=\"text-xs text-muted-foreground mt-2\">
              Média: €{(financialSummary.totalCleaningCost / financialSummary.activeProperties).toFixed(0)} por propriedade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-muted-foreground\">Propriedades c/ Comissão</p>
                <p className=\"text-2xl font-bold\">{financialSummary.propertiesWithCommission}</p>
              </div>
              <TrendingUp className=\"h-8 w-8 text-orange-600\" />
            </div>
            <Progress
              value={(financialSummary.propertiesWithCommission / financialSummary.activeProperties) * 100}
              className=\"mt-2\"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-muted-foreground\">Total Pagamentos Equipa</p>
                <p className=\"text-2xl font-bold\">€{financialSummary.totalTeamPayments.toFixed(0)}</p>
              </div>
              <Users className=\"h-8 w-8 text-purple-600\" />
            </div>
            <p className=\"text-xs text-muted-foreground mt-2\">
              {properties.filter(p => parseFloat(p.teamPayment || '0') > 0).length} propriedades com pagamentos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
        {/* Lista de Propriedades */}
        <Card className=\"lg:col-span-2\">
          <CardHeader>
            <CardTitle>Todas as Propriedades</CardTitle>
            <div className=\"flex gap-2\">
              <Input
                placeholder=\"Procurar propriedades...\"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className=\"max-w-sm\"
              />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as any)}
                className=\"px-3 py-2 border rounded-md\"
              >
                <option value=\"all\">Todas</option>
                <option value=\"active\">Ativas</option>
                <option value=\"inactive\">Inativas</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-3 max-h-96 overflow-y-auto\">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProperty?.id === property.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handlePropertySelect(property)}
                >
                  <div className=\"flex items-center justify-between\">
                    <div className=\"flex items-center gap-3\">
                      <div className={`w-3 h-3 rounded-full ${property.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <h3 className=\"font-semibold\">{property.name}</h3>
                        <p className=\"text-sm text-muted-foreground\">{property.ownerName}</p>
                      </div>
                    </div>
                    <div className=\"text-right\">
                      <p className=\"text-sm font-medium\">€{property.cleaningCost}</p>
                      <p className=\"text-xs text-muted-foreground\">limpeza</p>
                    </div>
                  </div>

                  <div className=\"mt-2 flex gap-2\">
                    {parseFloat(property.checkInFee || '0') > 0 && (
                      <Badge variant=\"outline\" className=\"text-xs\">
                        Check-in: €{property.checkInFee}
                      </Badge>
                    )}
                    {parseFloat(property.commission || '0') > 0 && (
                      <Badge variant=\"outline\" className=\"text-xs\">
                        Comissão: {property.commission}%
                      </Badge>
                    )}
                    {parseFloat(property.teamPayment || '0') > 0 && (
                      <Badge variant=\"outline\" className=\"text-xs\">
                        Equipa: €{property.teamPayment}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes da Propriedade Selecionada */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedProperty ? selectedProperty.name : 'Selecione uma Propriedade'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProperty ? (
              <Tabs defaultValue=\"details\">
                <TabsList className=\"grid w-full grid-cols-2\">
                  <TabsTrigger value=\"details\">Detalhes</TabsTrigger>
                  <TabsTrigger value=\"cleaning\">Limpezas</TabsTrigger>
                </TabsList>

                <TabsContent value=\"details\" className=\"space-y-4\">
                  <div className=\"space-y-3\">
                    <div className=\"flex items-center gap-2\">
                      <MapPin className=\"h-4 w-4 text-muted-foreground\" />
                      <span className=\"text-sm\">{selectedProperty.ownerName}</span>
                    </div>

                    <div className=\"grid grid-cols-2 gap-4 text-sm\">
                      <div>
                        <p className=\"text-muted-foreground\">Limpeza</p>
                        <p className=\"font-semibold\">€{selectedProperty.cleaningCost}</p>
                      </div>
                      <div>
                        <p className=\"text-muted-foreground\">Check-in</p>
                        <p className=\"font-semibold\">€{selectedProperty.checkInFee}</p>
                      </div>
                      <div>
                        <p className=\"text-muted-foreground\">Comissão</p>
                        <p className=\"font-semibold\">{selectedProperty.commission}%</p>
                      </div>
                      <div>
                        <p className=\"text-muted-foreground\">Equipa</p>
                        <p className=\"font-semibold\">€{selectedProperty.teamPayment}</p>
                      </div>
                    </div>

                    {propertyStats && (
                      <div className=\"pt-4 border-t\">
                        <h4 className=\"font-semibold mb-2\">Estatísticas</h4>
                        <div className=\"space-y-2 text-sm\">
                          <div className=\"flex justify-between\">
                            <span>Total de reservas:</span>
                            <span className=\"font-semibold\">{propertyStats.totalReservations}</span>
                          </div>
                          <div className=\"flex justify-between\">
                            <span>Este ano:</span>
                            <span className=\"font-semibold\">{propertyStats.yearReservations}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value=\"cleaning\" className=\"space-y-4\">
                  {cleaningSchedule && (
                    <div>
                      <div className=\"flex items-center justify-between mb-3\">
                        <h4 className=\"font-semibold\">
                          {new Date(2024, cleaningSchedule.month - 1).toLocaleDateString('pt-PT', { month: 'long' })} {cleaningSchedule.year}
                        </h4>
                        <Badge>
                          {cleaningSchedule.totalCleanings} limpezas
                        </Badge>
                      </div>

                      <div className=\"text-sm mb-3\">
                        <p className=\"text-muted-foreground\">Custo total do mês:</p>
                        <p className=\"text-lg font-bold text-green-600\">€{cleaningSchedule.totalCost}</p>
                      </div>

                      <div className=\"space-y-2 max-h-40 overflow-y-auto\">
                        {cleaningSchedule.cleanings.map((cleaning, index) => (
                          <div key={index} className=\"p-3 border rounded-lg\">
                            <div className=\"flex items-center justify-between\">
                              <div>
                                <p className=\"font-medium text-sm\">{cleaning.guestName}</p>
                                <p className=\"text-xs text-muted-foreground\">{cleaning.date}</p>
                              </div>
                              <Badge variant={cleaning.status === 'scheduled' ? 'default' : 'secondary'}>
                                €{cleaning.cleaningCost}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className=\"text-center text-muted-foreground py-8\">
                <Building2 className=\"h-12 w-12 mx-auto mb-2 opacity-50\" />
                <p>Clique numa propriedade para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}