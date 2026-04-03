import React, { useState } from 'react';
import { db } from '@/db/database';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import TerminalHeader from '@/components/shared/TerminalHeader';
import ExtensionSelector from '@/components/shared/ExtensionSelector';
import EmptyState from '@/components/shared/EmptyState';
import { useTranslation } from 'react-i18next';

function generateExtensionXML(ext, nodes, missions, factions) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<HacknetExtension>\n`;
  xml += `  <Name>${esc(ext.name)}</Name>\n`;
  xml += `  <Language>${esc(ext.language || 'en-us')}</Language>\n`;
  xml += `  <Description>${esc(ext.description || '')}</Description>\n`;
  xml += `  <PlayerCompName>${esc(ext.player_comp_name || 'PlayerComp')}</PlayerCompName>\n`;
  xml += `  <AllowSaves>${ext.allow_saves === false ? 'false' : 'true'}</AllowSaves>\n`;
  if (ext.starting_visible_nodes) xml += `  <StartingVisibleNodes>${esc(ext.starting_visible_nodes)}</StartingVisibleNodes>\n`;
  if (ext.starting_mission_id) xml += `  <StartingMission>${esc(ext.starting_mission_id)}</StartingMission>\n`;
  if (ext.starting_actions) xml += `  <StartingActions>${esc(ext.starting_actions)}</StartingActions>\n`;
  if (ext.faction) xml += `  <Faction>${esc(ext.faction)}</Faction>\n`;
  xml += `  <StartsWithTutorial>${ext.starts_with_tutorial ? 'true' : 'false'}</StartsWithTutorial>\n`;
  xml += `  <HasIntroStartup>${ext.has_intro_startup ? 'true' : 'false'}</HasIntroStartup>\n`;
  if (ext.intro_startup_song) xml += `  <IntroStartupSong>${esc(ext.intro_startup_song)}</IntroStartupSong>\n`;
  xml += `  <StartingTheme>${esc(ext.starting_theme || 'green')}</StartingTheme>\n`;
  if (ext.starting_music) xml += `  <StartingMusic>${esc(ext.starting_music)}</StartingMusic>\n`;
  if (ext.workshop_description) xml += `  <WorkshopDescription>${esc(ext.workshop_description)}</WorkshopDescription>\n`;
  if (ext.workshop_language) xml += `  <WorkshopLanguage>${esc(ext.workshop_language)}</WorkshopLanguage>\n`;
  if (ext.workshop_visibility) xml += `  <WorkshopVisibility>${esc(ext.workshop_visibility)}</WorkshopVisibility>\n`;
  if (ext.workshop_tags) xml += `  <WorkshopTags>${esc(ext.workshop_tags)}</WorkshopTags>\n`;
  if (ext.workshop_preview_image_path) xml += `  <WorkshopPreviewImagePath>${esc(ext.workshop_preview_image_path)}</WorkshopPreviewImagePath>\n`;
  if (ext.workshop_publish_id) xml += `  <WorkshopPublishID>${esc(ext.workshop_publish_id)}</WorkshopPublishID>\n`;
  xml += `</HacknetExtension>`;
  return xml;
}

function generateNodeXML(node) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<Computer id="${esc(node.node_id)}" name="${esc(node.name)}" ip="${esc(node.ip || '0.0.0.0')}" security="${node.security_level || 1}" allowsDefaultBootModule="true" icon="${esc(node.icon || 'laptop')}" type="${esc(node.node_type || 'standard')}">\n`;
  xml += `  <adminPass>${esc(node.admin_pass || 'password')}</adminPass>\n`;
  xml += `  <portsForCrack>${node.ports_required || 0}</portsForCrack>\n`;
  if (node.trace_time >= 0) xml += `  <traceTime>${node.trace_time}</traceTime>\n`;
  if (node.has_proxy) xml += `  <proxy time="${node.proxy_time || -1}" />\n`;
  if (node.has_firewall) xml += `  <firewall level="${node.firewall_level || 1}" solution="${esc(node.firewall_solution || '')}" />\n`;
  if (node.ports?.length > 0) {
    xml += `  <ports>\n`;
    node.ports.forEach(p => { xml += `    <port>${p.port_number}</port>\n`; });
    xml += `  </ports>\n`;
  }
  if (node.files?.length > 0) {
    xml += `  <filesystem>\n`;
    node.files.forEach(f => {
      xml += `    <file path="${esc(f.path || '/home')}" name="${esc(f.name)}">${esc(f.content || '')}</file>\n`;
    });
    xml += `  </filesystem>\n`;
  }
  xml += `</Computer>`;
  return xml;
}

function generateMissionXML(mission) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<mission id="${esc(mission.mission_id)}" activeCheck="true">\n`;
  xml += `  <goals>\n`;
  if (mission.goal_type === 'filedownload') {
    xml += `    <goal type="filedownload" target="${esc(mission.target_node_id || '')}" file="${esc(mission.goal_file || '')}" path="${esc(mission.goal_path || '')}" />\n`;
  } else if (mission.goal_type === 'filedelete') {
    xml += `    <goal type="filedelete" target="${esc(mission.target_node_id || '')}" file="${esc(mission.goal_file || '')}" path="${esc(mission.goal_path || '')}" />\n`;
  } else if (mission.goal_type === 'getadmin') {
    xml += `    <goal type="getadmin" target="${esc(mission.target_node_id || '')}" />\n`;
  } else if (mission.goal_type === 'getstring') {
    xml += `    <goal type="getstring" target="${esc(mission.goal_keyword || '')}" />\n`;
  } else if (mission.goal_type === 'delay') {
    xml += `    <goal type="delay" time="${esc(mission.goal_keyword || '5')}" />\n`;
  } else if (mission.goal_type === 'hasflag') {
    xml += `    <goal type="hasflag" target="${esc(mission.goal_keyword || '')}" />\n`;
  } else {
    xml += `    <goal type="${esc(mission.goal_type)}" target="${esc(mission.target_node_id || '')}" file="${esc(mission.goal_file || '')}" path="${esc(mission.goal_path || '')}" />\n`;
  }
  xml += `  </goals>\n`;
  if (mission.next_mission_id) xml += `  <nextMission>${esc(mission.next_mission_id)}</nextMission>\n`;
  if (mission.mission_start) xml += `  <missionStart>${esc(mission.mission_start)}</missionStart>\n`;
  if (mission.mission_end) xml += `  <missionEnd>${esc(mission.mission_end)}</missionEnd>\n`;
  if (mission.email_sender || mission.email_subject || mission.email_body || (mission.email_attachments || []).length > 0) {
    xml += `  <email>\n`;
    if (mission.email_sender) xml += `    <sender>${esc(mission.email_sender)}</sender>\n`;
    if (mission.email_subject) xml += `    <subject>${esc(mission.email_subject)}</subject>\n`;
    if (mission.email_body) xml += `    <body>${esc(mission.email_body)}</body>\n`;
    if (mission.email_attachments && mission.email_attachments.length > 0) {
      xml += `    <attachments>\n`;
      mission.email_attachments.forEach(att => {
        xml += `      <attachment>${esc(att)}</attachment>\n`;
      });
      xml += `    </attachments>\n`;
    }
    xml += `  </email>\n`;
  }
  if (mission.posting) {
    const postingTitle = mission.posting_title || mission.title || '';
    xml += `  <posting title="${esc(postingTitle)}">${esc(mission.posting)}</posting>\n`;
  }
  xml += `</mission>`;
  return xml;
}

function generateFactionXML(faction, missions) {
  const factionMissions = missions.filter(m => m.faction_id === faction.faction_id);
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<CustomFaction id="${esc(faction.faction_id)}" name="${esc(faction.name)}" playerVal="${faction.player_value || 0}" maxVal="${faction.max_value || 100}" neededVal="${faction.neededValue || 0}">\n`;
  factionMissions.forEach(m => {
    xml += `  <Mission id="${esc(m.mission_id)}" reqRank="${m.required_rank || 0}" />\n`;
  });
  xml += `</CustomFaction>`;
  return xml;
}

function generateNodeActionXML(action) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<NodeAction id="${esc(action.id)}" extension="${esc(action.extension_id || '')}" type="${esc(action.action_type || '')}">\n`;
  const properties = [
    'delay', 'delay_host', 'target_comp', 'faction_id', 'value_required',
    'mission_filepath', 'function_name', 'function_value', 'file_name', 'file_contents',
    'file_path', 'source_comp', 'source_file_name', 'source_file_path', 'theme_path',
    'flicker_duration', 'script_filepath', 'require_logs_on_source', 'alert_title',
    'total_duration', 'content', 'exe_name', 'assignment_tag'
  ];

  properties.forEach(field => {
    if (action[field] !== undefined && action[field] !== null && action[field] !== '') {
      xml += `  <${field}>${esc(action[field])}</${field}>\n`;
    }
  });

  xml += `</NodeAction>`;
  return xml;
}

function generateNodeLinkXML(link) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<NodeLink id="${esc(link.id)}" extension="${esc(link.extension_id || '')}" source="${esc(link.source_node_id || '')}" target="${esc(link.target_node_id || '')}">\n`;

  if (link.position_near) xml += `  <positionNear>${esc(link.position_near)}</positionNear>\n`;
  if (link.position !== undefined) xml += `  <position>${esc(link.position)}</position>\n`;
  if (link.total !== undefined) xml += `  <total>${esc(link.total)}</total>\n`;
  if (link.extra_distance !== undefined) xml += `  <extraDistance>${esc(link.extra_distance)}</extraDistance>\n`;
  xml += `  <force>${link.force ? 'true' : 'false'}</force>\n`;

  xml += `</NodeLink>`;
  return xml;
}

function generateNodePersonXML(person) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<NodePerson id="${esc(person.id)}" extension="${esc(person.extension_id || '')}" node="${esc(person.node_id || '')}">\n`;
  xml += `  <username>${esc(person.username || '')}</username>\n`;
  xml += `  <password>${esc(person.password || '')}</password>\n`;
  xml += `  <account_type>${esc(person.account_type || 'ALL')}</account_type>\n`;
  xml += `</NodePerson>`;
  return xml;
}

function generateHackerScriptXML(script) {
  let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
  xml += `<HackerScript id="${esc(script.id)}" extension="${esc(script.extension_id || '')}" name="${esc(script.script_name || '')}">\n`;
  if (script.description) xml += `  <description>${esc(script.description)}</description>\n`;
  if (script.player_comp) xml += `  <playerComp>${esc(script.player_comp)}</playerComp>\n`;
  if (script.target_comp_name_or_ip) xml += `  <target>${esc(script.target_comp_name_or_ip)}</target>\n`;
  if (script.config_delay !== undefined) xml += `  <config_delay>${esc(script.config_delay)}</config_delay>\n`;

  if (script.commands && script.commands.length > 0) {
    xml += `  <commands>\n`;
    script.commands.forEach(cmd => {
      xml += `    <command type="${esc(cmd.type || '')}" arg1="${esc(cmd.arg1 || '')}" arg2="${esc(cmd.arg2 || '')}" />\n`;
    });
    xml += `  </commands>\n`;
  }

  xml += `</HackerScript>`;
  return xml;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function XMLBlock({ title, filename, content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs text-foreground">{title}</span>
          <span className="font-mono text-[10px] text-muted-foreground">({filename})</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <pre className="p-4 text-xs font-mono text-foreground/80 overflow-x-auto max-h-64 overflow-y-auto">
        {content}
      </pre>
    </div>
  );
}

export default function Export() {
  const [selectedExt, setSelectedExt] = useState('');
  const { t } = useTranslation();

  const { data: extensions = [] } = useQuery({ queryKey: ['extensions'], queryFn: () => db.entities.Extension.list() });
  const { data: nodes = [] } = useQuery({
    queryKey: ['nodes-export', selectedExt],
    queryFn: () => db.entities.HacknetNode.filter({ extension_id: selectedExt }),
    enabled: !!selectedExt,
  });
  const { data: missions = [] } = useQuery({
    queryKey: ['missions-export', selectedExt],
    queryFn: () => db.entities.Mission.filter({ extension_id: selectedExt }),
    enabled: !!selectedExt,
  });
  const { data: factions = [] } = useQuery({
    queryKey: ['factions-export', selectedExt],
    queryFn: () => db.entities.Faction.filter({ extension_id: selectedExt }),
    enabled: !!selectedExt,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions-export', selectedExt],
    queryFn: () => db.entities.NodeAction.filter({ extension_id: selectedExt }),
    enabled: !!selectedExt,
  });

  const { data: links = [] } = useQuery({
    queryKey: ['links-export', selectedExt],
    queryFn: () => db.entities.NodeLink.filter({ extension_id: selectedExt }),
    enabled: !!selectedExt,
  });

  const { data: people = [] } = useQuery({
    queryKey: ['people-export', selectedExt],
    queryFn: () => db.entities.NodePerson.filter({ extension_id: selectedExt }),
    enabled: !!selectedExt,
  });

  const { data: scripts = [] } = useQuery({
    queryKey: ['scripts-export', selectedExt],
    queryFn: () => db.entities.HackerScript.filter({ extension_id: selectedExt }),
    enabled: !!selectedExt,
  });

  const ext = extensions.find(e => e.id === selectedExt);

  const handleDownloadAll = () => {
    if (!ext) return;
    const files = [
      { name: 'ExtensionInfo.xml', content: generateExtensionXML(ext, nodes, missions, factions) },
      ...nodes.map(n => ({ name: `Nodes/${n.node_id}.xml`, content: generateNodeXML(n) })),
      ...missions.map(m => ({ name: `Missions/${m.mission_id}.xml`, content: generateMissionXML(m) })),
      ...factions.map(f => ({ name: `Factions/${f.faction_id}.xml`, content: generateFactionXML(f, missions) })),
      ...actions.map(a => ({ name: `Actions/${a.id}.xml`, content: generateNodeActionXML(a) })),
      ...links.map(l => ({ name: `Links/${l.id}.xml`, content: generateNodeLinkXML(l) })),
      ...people.map(p => ({ name: `Accounts/${p.id}.xml`, content: generateNodePersonXML(p) })),
      ...scripts.map(s => ({ name: `HackerScripts/${s.script_name || s.id}.xml`, content: generateHackerScriptXML(s) })),
    ];
    files.forEach(f => {
      const blob = new Blob([f.content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = f.name.replace('/', '_');
      a.click();
      URL.revokeObjectURL(url);
    });
    toast.success(t('export.downloadSuccess', { count: files.length }));
  };

  return (
    <div className="min-h-screen">
      <TerminalHeader
        title={t('export.title')}
        subtitle={t('export.subtitle')}
        actions={
          <div className="flex items-center gap-3">
            <ExtensionSelector value={selectedExt} onChange={setSelectedExt} />
            {ext && (
              <Button onClick={handleDownloadAll} className="font-mono text-xs gap-2">
                <Download className="w-3.5 h-3.5" /> {t('export.downloadAll')}
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {!selectedExt ? (
          <EmptyState icon={Download} title={t('export.selectExtension')} description={t('export.selectExtensionDesc')} />
        ) : (
          <>
            {ext && <XMLBlock title="ExtensionInfo" filename="ExtensionInfo.xml" content={generateExtensionXML(ext, nodes, missions, factions)} />}

            {nodes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t('export.nodes')} ({nodes.length})</h3>
                {nodes.map(n => <XMLBlock key={n.id} title={n.name} filename={`${n.node_id}.xml`} content={generateNodeXML(n)} />)}
              </div>
            )}

            {missions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t('export.missions')} ({missions.length})</h3>
                {missions.map(m => <XMLBlock key={m.id} title={m.title} filename={`${m.mission_id}.xml`} content={generateMissionXML(m)} />)}
              </div>
            )}

            {factions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t('export.factions')} ({factions.length})</h3>
                {factions.map(f => <XMLBlock key={f.id} title={f.name} filename={`${f.faction_id}.xml`} content={generateFactionXML(f, missions)} />)}
              </div>
            )}

            {actions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t('export.actions')} ({actions.length})</h3>
                {actions.map(a => <XMLBlock key={a.id} title={`${a.action_type || a.id}`} filename={`${a.id}.xml`} content={generateNodeActionXML(a)} />)}
              </div>
            )}

            {links.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t('export.links')} ({links.length})</h3>
                {links.map(l => <XMLBlock key={l.id} title={`${l.source_node_id} → ${l.target_node_id}`} filename={`${l.id}.xml`} content={generateNodeLinkXML(l)} />)}
              </div>
            )}

            {people.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t('export.accounts')} ({people.length})</h3>
                {people.map(p => <XMLBlock key={p.id} title={`${p.username}@${p.node_id}`} filename={`${p.id}.xml`} content={generateNodePersonXML(p)} />)}
              </div>
            )}

            {scripts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{t('export.hackerScripts')} ({scripts.length})</h3>
                {scripts.map(s => <XMLBlock key={s.id} title={s.script_name || s.id} filename={`${s.script_name || s.id}.xml`} content={generateHackerScriptXML(s)} />)}
              </div>
            )}

            {(nodes.length === 0 && missions.length === 0 && factions.length === 0 && actions.length === 0 && links.length === 0 && people.length === 0 && scripts.length === 0) && (
              <div className="text-center py-10">
                <p className="text-muted-foreground text-sm">{t('export.emptyExtension')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}