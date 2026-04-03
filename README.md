# Hacknet Extensions GUI

Uma aplicação React local-first para gerenciar dados de extensões do Hacknet (nós, missões, facções, scripts, ações, links e pessoas) usando um banco de dados SQLite incorporado no navegador (`sql.js`).

## � Status do Projeto

🚧 **Em Desenvolvimento** - O projeto está em fase ativa de desenvolvimento. Todas as funcionalidades principais estão implementadas e funcionais, mas pode haver melhorias contínuas e possíveis ajustes.

### Funcionalidades Implementadas ✅
- Interface completa para gerenciamento de extensões
- Sistema de banco de dados local com SQLite
- Suporte multilíngue (Português/Inglês)
- Exportação de arquivos XML para Hacknet
- CRUD completo para todas as entidades

### Próximas Melhorias 🔄
- Testes automatizados
- Documentação da API
- Otimizações de performance
- Novos recursos baseados no feedback dos usuários

## �🚀 Funcionalidades

- **CRUD Completo**: Gerenciamento de missões, nós, facções, ações, scripts e mais
- **Armazenamento Local Offline**: Persistência de dados com SQLite no `localStorage`
- **Geração de Dados Iniciais**: Dados de exemplo criados automaticamente na primeira execução
- **Suporte Multilíngue**: Interface em Inglês e Português
- **Exportação XML**: Geração de arquivos XML compatíveis com Hacknet
- **Interface Moderna**: UI construída com React, Tailwind CSS e shadcn/ui

## 🏗️ Como Funciona

A aplicação funciona inteiramente no navegador, sem necessidade de servidor backend. O fluxo principal é:

1. **Criação de Extensões**: Comece criando uma extensão base com informações gerais
2. **Gerenciamento de Conteúdo**:
   - **Nós**: Defina computadores na rede com IPs, segurança, portas, etc.
   - **Missões**: Crie objetivos e sequências de missões
   - **Facções**: Configure organizações com reputação e ações
   - **Ações**: Defina eventos automatizados e gatilhos
   - **Scripts**: Crie scripts de ataque para NPCs
   - **Pessoas**: Configure contas de usuário nos computadores
   - **Links**: Estabeleça conexões de rede entre nós
3. **Exportação**: Gere arquivos XML prontos para uso no Hacknet

## 💾 Banco de Dados Local

O aplicativo utiliza uma arquitetura **local-first** com SQLite incorporado no navegador:

### Tecnologias
- **sql.js**: SQLite compilado para WebAssembly, roda inteiramente no navegador
- **localStorage**: Persistência automática dos dados
- **IndexedDB**: Armazenamento de blobs grandes (opcional)

### Estrutura do Banco
O banco contém as seguintes entidades principais:

- **Extensions**: Extensões base do Hacknet
- **HacknetNodes**: Computadores na rede (nós)
- **Missions**: Missões e objetivos
- **Factions**: Facções e organizações
- **NodeActions**: Ações automatizadas
- **HackerScripts**: Scripts de ataque
- **NodePeople**: Contas de usuário
- **NodeLinks**: Conexões de rede

### Vantagens
- ✅ **Offline-first**: Funciona sem conexão com internet
- ✅ **Privacidade**: Dados ficam apenas no seu dispositivo
- ✅ **Performance**: Consultas rápidas com SQLite
- ✅ **Portabilidade**: Dados podem ser exportados/importados
- ✅ **Sem Dependências**: Não requer servidor ou banco externo

## 🛠️ Instalação e Uso

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
git clone <repository-url>
cd hacknet-extensions-gui
npm install
```

### Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:5173` no navegador.

### Build para Produção
```bash
npm run build
npm run preview
```

### Verificação de Tipos
```bash
npm run typecheck
```

## 🌐 Suporte Multilíngue

A aplicação suporta dois idiomas:

- **Inglês** (padrão)
- **Português**

O idioma é detectado automaticamente baseado nas configurações do navegador, mas pode ser alterado manualmente através do seletor de idioma na barra lateral.

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── layout/         # Layout e navegação
│   ├── missions/       # Componentes específicos de missões
│   ├── shared/         # Componentes compartilhados
│   └── ui/             # Componentes de UI (shadcn/ui)
├── db/                 # Configuração do banco de dados
├── hooks/              # Hooks customizados
├── i18n/               # Configuração de internacionalização
│   └── locales/        # Arquivos de tradução
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
└── utils/              # Funções utilitárias
```

## 🔧 Tecnologias Utilizadas

- **React 18** - Framework frontend
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado server
- **sql.js** - SQLite no navegador
- **React i18next** - Internacionalização
- **Framer Motion** - Animações
- **Lucide React** - Ícones

## 📄 Licença

Este projeto é open-source e está disponível sob a licença MIT.

