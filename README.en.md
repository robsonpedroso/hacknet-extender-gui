# Hacknet Extensions GUI

A local-first React application for managing Hacknet extension data (nodes, missions, factions, scripts, actions, links, and people) using an embedded SQLite database in the browser (`sql.js`).

## � Project Status

🚧 **In Development** - The project is in active development phase. All main features are implemented and functional, but there may be continuous improvements and possible adjustments.

### Implemented Features ✅
- Complete interface for extension management
- Local database system with SQLite
- Multilingual support (Portuguese/English)
- XML ​​file export to Hacknet
- Complete CRUD for all entities

### Upcoming Improvements 🔄
- Improve screens and menus to facilitate creation
- Improve XML export
- Implement other missing game features
- New features based on user feedback

## �🚀 Features

- **Complete CRUD**: Management of missions, nodes, factions, actions, scripts, and more
- **Offline Local Storage**: Data persistence with SQLite in `localStorage`
- **Initial Data Generation**: Sample data automatically created on first run
- **Multilingual Support**: Interface in English and Portuguese
- **XML Export**: Generation of Hacknet-compatible XML files
- **Modern Interface**: UI built with React, Tailwind CSS, and shadcn/ui

## 🏗️ How It Works

The application runs entirely in the browser, without requiring a backend server. The main workflow is:

1. **Extension Creation**: Start by creating a base extension with general information
2. **Content Management**:
   - **Nodes**: Define computers on the network with IPs, security, ports, etc.
   - **Missions**: Create objectives and mission sequences
   - **Factions**: Configure organizations with reputation and actions
   - **Actions**: Define automated events and triggers
   - **Scripts**: Create attack scripts for NPCs
   - **People**: Configure user accounts on computers
   - **Links**: Establish network connections between nodes
3. **Export**: Generate XML files ready for use in Hacknet

## 💾 Local Database

The application uses a **local-first** architecture with SQLite embedded in the browser:

### Technologies
- **sql.js**: SQLite compiled to WebAssembly, runs entirely in the browser
- **localStorage**: Automatic data persistence
- **IndexedDB**: Large blob storage (optional)

### Database Structure
The database contains the following main entities:

- **Extensions**: Base Hacknet extensions
- **HacknetNodes**: Computers on the network (nodes)
- **Missions**: Missions and objectives
- **Factions**: Factions and organizations
- **NodeActions**: Automated actions
- **HackerScripts**: Attack scripts
- **NodePeople**: User accounts
- **NodeLinks**: Network connections

### Advantages
- ✅ **Offline-first**: Works without internet connection
- ✅ **Privacy**: Data stays only on your device
- ✅ **Performance**: Fast queries with SQLite
- ✅ **Portability**: Data can be exported/imported
- ✅ **No Dependencies**: Doesn't require external server or database

## 🛠️ Installation and Usage

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
git clone <repository-url>
cd hacknet-extensions-gui
npm install
```

### Development
```bash
npm run dev
```
Access `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

### Type Checking
```bash
npm run typecheck
```

## 🌐 Multilingual Support

The application supports two languages:

- **English** (default)
- **Portuguese**

The language is automatically detected based on browser settings, but can be manually changed through the language selector in the sidebar.

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── layout/         # Layout and navigation
│   ├── missions/       # Mission-specific components
│   ├── shared/         # Shared components
│   └── ui/             # UI components (shadcn/ui)
├── db/                 # Database configuration
├── hooks/              # Custom hooks
├── i18n/               # Internationalization configuration
│   └── locales/        # Translation files
├── lib/                # Utilities and configurations
├── pages/              # Application pages
└── utils/              # Utility functions
```

## 🔧 Technologies Used

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Query** - Server state management
- **sql.js** - SQLite in the browser
- **React i18next** - Internationalization
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 📄 License

This project is open-source and available under the MIT license.