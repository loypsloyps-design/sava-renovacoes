# SAVA SEGUROS — Central de Renovações (do zero)

## O que foi incluído

- Login e senha antes do acesso.
- Usuário e senha alteráveis em Configurações.
- Cliente com nome, nascimento, telefone/WhatsApp obrigatório e validado, CPF/CNPJ, e-mail e observações.
- Início e fim da vigência da apólice.
- Lista ampliada de seguradoras.
- Lista de tipos solicitados:
  Auto, Auto Frota, Residencial, Empresarial, Vida PJ, Vida PF, RC Cyber,
  RC Profissional, RC Obra, RC Médico, Fiança Locatícia, Garantia,
  Transporte, Viagem, Vida AP, Evento, D&O, Bike, Bike Elétrica, Vida e Outro.
- Tipo "Moto" removido.
- Vários seguros do mesmo cliente no mesmo cadastro de cliente.
- Status de renovação: Pendente, Em andamento e Ganho.
- Renovação: cria nova apólice vinculada à antiga e mantém histórico.
- PDF da apólice armazenado no navegador via IndexedDB.
- Visualização do PDF dentro do CRM.
- Dashboard novo.
- Filtros e busca.
- Pipeline de renovações.
- Histórico de alterações.
- WhatsApp manual apenas como atalho; não é WhatsApp Business API.
- Lembretes por e-mail com marcos de 30, 15, 7, 1 dia e pós-vencimento.
- Endpoint Google Apps Script incluído para envio gratuito de e-mail dentro das cotas do Google.
- Backup/restauração dos dados, incluindo PDFs.
- Relatório inteligente local, sem enviar dados para IA externa.

## Importante sobre e-mail automático

Um site hospedado apenas no GitHub Pages não pode guardar com segurança uma senha SMTP nem executar um processo no servidor 24 horas por dia.

Por isso o projeto usa `email.gs` como endpoint opcional do Google Apps Script. O Google executa o envio e o CRM chama o endpoint.

Há duas situações:

1. Com o endpoint configurado: o CRM consegue disparar os e-mails pelos marcos quando a rotina automática do sistema é executada.
2. Sem endpoint: o botão de e-mail abre o aplicativo de e-mail do computador.

Para automação 100% independente de o CRM estar aberto, é necessário colocar a lista de apólices em uma fonte acessível ao Google Apps Script (por exemplo, Google Sheets) e criar um gatilho diário.

Essa é uma etapa de backend/integração; GitHub Pages sozinho não executa tarefas agendadas.

## Segurança

O login desta versão é proteção de interface local, não autenticação de servidor.

Não use a senha padrão em ambiente compartilhado.

Para múltiplos usuários, permissões, sessões reais e dados centralizados, será necessário backend (ex.: Supabase/Firebase ou Apps Script + Sheets).

## Instalação

Coloque:

- `index.html`
- `style.css`
- `script.js`

na mesma pasta e publique a pasta no GitHub Pages.

Para o e-mail:

- abra `email.gs` no Google Apps Script;
- publique como aplicativo da Web;
- copie a URL `/exec`;
- cole em Configurações > Automação de e-mail.

## Migração

Na primeira abertura, o sistema tenta migrar automaticamente os registros encontrados na chave antiga `savaApolices` do localStorage para a nova estrutura.

Apólices antigas que não possuíam início de vigência ficam sem essa data e devem ser completadas manualmente.

## Observação

Os PDFs ficam no navegador que os cadastrou.

O backup é recomendado antes de trocar de computador ou navegador.
