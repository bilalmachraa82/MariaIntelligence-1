# Resolução de Pendências - Maria Faz MVP

Este documento contém sugestões e planos para resolver as pendências identificadas no projeto Maria Faz MVP.

## 1. Erros de Tipo no storage.ts

Os erros de tipo no arquivo `storage.ts` estão impedindo a execução dos testes unitários. As principais ocorrências são:

- Propriedades faltantes em interfaces de tipo (missing `updatedAt`, `source`, etc.)
- Propriedades não existentes sendo acessadas (como `platform`)
- Incompatibilidades entre tipos no sistema de gerenciamento de tarefas

### Solução Proposta:

1. **Correção das Interfaces**: Atualizar as interfaces de tipo para garantir consistência:

```typescript
// Exemplo de correção da interface Reservation
interface Reservation {
  id: number;
  propertyId: number;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number | null;
  totalAmount: string;
  status: string;
  source: string | null;        // Adicionado para compatibilidade
  platformFee: string | null;   // Adicionado para compatibilidade
  cleaningFee: string | null;   // Adicionado para compatibilidade
  checkInFee: string | null;
  commission: string | null;
  teamPayment: string | null;
  netAmount: string | null;
  nights: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;       // Adicionado para compatibilidade
}
```

2. **Mock Completo para Testes**: Melhorar o arquivo `storage.mock.ts` para incluir todas as propriedades necessárias:

```typescript
export const storage = {
  getProperties: jest.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Test Property',
      aliases: ['Test Alias', 'Another Test Alias'],
      ownerId: 1,
      cleaningCost: '50',
      checkInFee: '10',
      commission: '5',
      teamPayment: '20',
      cleaningTeam: 'Team A',
      cleaningTeamId: 1,
      monthlyFixedCost: '100',
      active: true
    }
  ]),
  // Adicionar outros métodos mockados conforme necessário
};
```

3. **Isolamento de Testes**: Usar interfaces de teste específicas que sejam independentes das interfaces de produção, quando necessário.

## 2. Finalização do Handoff (BLOCO 7)

Para completar o processo de handoff, precisamos:

### Backup do Banco e Uploads

```bash
# Backup do banco de dados
pg_dump $(railway variables get DATABASE_URL) > backup-$(date +%Y%m%d).sql

# Backup dos uploads
zip -r uploads-$(date +%Y%m%d).zip uploads/
```

### Tag Git e Push

```bash
# Criar e publicar a tag
git tag v1.0.0-mvp -a -m "MVP pronto"
git push origin --tags
```

### Documentação dos Endpoints

Criar um documento com os endpoints de staging e produção:

```
Frontend: https://maria-faz-1.netlify.app
Backend API: https://<endpoint-railway> (obter de railway status)

Endpoints Principais:
- POST /api/ocr - Upload e processamento de PDFs
- GET /api/properties - Listagem de propriedades
- etc.
```

## 3. Testes End-to-End

Para os testes E2E, é necessário:

1. Garantir que o diretório `uploads` tenha arquivos PDF de teste
2. Atualizar o arquivo `e2e/upload.spec.ts` para lidar com os casos onde os uploads não existem:

```typescript
// Verificar se diretório existe e tem PDFs antes de executar o teste
const hasTestFiles = fs.existsSync(uploadsDir) && 
                    fs.readdirSync(uploadsDir).some(file => file.endsWith('.pdf'));

if (!hasTestFiles) {
  console.warn('Nenhum arquivo de teste encontrado. Criando arquivos de teste...');
  // Criar dados de teste mínimos
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadsDir, 'test-file.pdf'), 'PDF content');
}
```

## Conclusão

Estas medidas permitirão finalizar o projeto e resolver as pendências existentes. O sistema já está operacional em produção, e as correções acima são principalmente para melhorar a manutenibilidade e completar formalmente todos os requisitos do projeto.

Com estas correções, todos os blocos do Runbook estarão completos e o handoff poderá ser realizado com sucesso.
