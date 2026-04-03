// Seed data para uso local em sql.js (SQLite em browser)

export const initialEntities = {
  Extension: [
    {
      id: 'ext_1',
      name: 'Extensão Padrão',
      description: 'Extensão criada automaticamente para desenvolvimento',
      language: 'pt-br',
      starting_theme: 'green',
      starting_music: '',
      starting_mission_id: 'Missions/StartingMission.xml',
      player_comp_name: 'PlayerComp',
      allow_saves: true,
      starting_visible_nodes: 'testNode',
      starting_actions: 'Actions/StartingActions.xml',
      faction: 'startingfac',
      starts_with_tutorial: false,
      has_intro_startup: false,
      intro_startup_song: 'The_Quickening',
      workshop_description: 'Seed extension based on BlankExtension template',
      workshop_language: 'English',
      workshop_visibility: '2',
      workshop_tags: 'Extension',
      workshop_preview_image_path: 'Logo.png',
      workshop_publish_id: 'NONE',
      status: 'draft',
      created_at: Date.now(),
      updated_at: Date.now(),
    }
  ],
  Faction: [
    {
      id: 'faction_1',
      extension_id: 'ext_1',
      name: 'Facção Alfa',
      description: 'Facção inicial para testes de missões e reputação',
      created_at: Date.now(),
      updated_at: Date.now(),
    }
  ],
  HacknetNode: [
    {
      id: 'node_1',
      extension_id: 'ext_1',
      node_id: 'n_001',
      name: 'Servidor Local',
      ip: '192.168.0.10',
      security_level: 2,
      ports_required: 1,
      ports: [
        { port_number: 22, cracked: true },
        { port_number: 21, cracked: false },
        { port_number: 25, cracked: false }
      ],
      files: [
        { path: 'home', name: 'example.txt', content: 'This is a file!\nYou can write whatever you want here.' },
        { path: 'bin', name: 'ThemeChanger.exe', content: '#THEMECHANGER_EXE#' }
      ],
      admin_pass: 'admin123',
      has_proxy: false,
      proxy_time: -1,
      has_firewall: false,
      firewall_level: -1,
      firewall_solution: '',
      trace_time: -1,
      icon: 'server',
      node_type: 'standard',
      created_at: Date.now(),
      updated_at: Date.now(),
    }
  ],
  Mission: [
    {
      id: 'mission_1',
      extension_id: 'ext_1',
      mission_id: 'mission_001',
      title: 'Primeira missão',
      description: 'Hacker inicial deve invadir o nó local',
      posting: 'Hack o nó local e capture a flag',
      email_sender: 'HQ',
      email_subject: 'Inicie sua jornada',
      email_body: 'A sua primeira missão está pronta.',
      target_node_id: 'n_001',
      goal_type: 'filedownload',
      goal_file: 'flag.txt',
      goal_path: '/var/data',
      goal_keyword: 'FLAG',
      next_mission_id: '',
      mission_start: 'Actions/StartingActions.xml',
      mission_end: '',
      email_attachments: [],
      posting_title: 'Primeira Missão',
      faction_id: 'faction_1',
      required_rank: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
    }
  ],
  NodeAction: [],
  NodeLink: [],
  NodePerson: [],
  HackerScript: [
    {
      id: 'script_1',
      extension_id: 'ext_1',
      name: 'scan-port',
      description: 'Escaneia portas do nó alvo',
      code: 'print("Scanner iniciado")',
      created_at: Date.now(),
      updated_at: Date.now(),
    }
  ]
};

export const seedDatabase = (dbSqlite) => {
  const check = dbSqlite.prepare('SELECT COUNT(*) as cnt FROM entities');
  check.step();
  const row = check.getAsObject();
  check.free();

  if (row.cnt > 0) return;

  const insertSql = dbSqlite.prepare(
    `INSERT OR REPLACE INTO entities (id, entity, extension_id, data, created_at, updated_at)
     VALUES (:id, :entity, :extension_id, :data, :created_at, :updated_at)`
  );

  for (const [entity, items] of Object.entries(initialEntities)) {
    for (const item of items) {
      const rowData = {
        id: item.id,
        entity,
        extension_id: item.extension_id || null,
        data: JSON.stringify(item),
        created_at: item.created_at || Date.now(),
        updated_at: item.updated_at || Date.now(),
      };
      insertSql.bind({
        ':id': rowData.id,
        ':entity': rowData.entity,
        ':extension_id': rowData.extension_id,
        ':data': rowData.data,
        ':created_at': rowData.created_at,
        ':updated_at': rowData.updated_at,
      });
      insertSql.step();
      insertSql.reset();
    }
  }

  insertSql.free();
};
