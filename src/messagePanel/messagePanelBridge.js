let nextRowId = 1;

function cloneData(value) {
  if (value == null) return value;
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
}

function rowId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${nextRowId++}`;
}

function ensureMetaShape(meta) {
  const source = cloneData(meta || {});
  return {
    ...source,
    timestamp: { ...(source.timestamp || {}) },
    scene: { ...(source.scene || {}) },
    costumes: { ...(source.costumes || {}) },
    items: { ...(source.items || {}) },
    deletedItems: Array.isArray(source.deletedItems) ? [...source.deletedItems] : [],
    events: Array.isArray(source.events)
      ? cloneData(source.events)
      : source.event
        ? [cloneData(source.event)]
        : [],
    affection: { ...(source.affection || {}) },
    npcs: cloneData(source.npcs || {}),
    agenda: Array.isArray(source.agenda) ? cloneData(source.agenda) : [],
    deletedAgenda: Array.isArray(source.deletedAgenda) ? [...source.deletedAgenda] : [],
    mood: cloneData(source.mood || {}),
    relationships: Array.isArray(source.relationships) ? cloneData(source.relationships) : [],
  };
}

function affectionValueToDisplay(value) {
  if (value && typeof value === 'object') {
    return value.value ?? '';
  }
  return value ?? '';
}

function normalizeAgendaType(type) {
  const raw = String(type || '').trim();
  if (raw === '悬念' || raw === '未解悬念' || raw.toLowerCase() === 'mystery') return '悬念';
  return '计划';
}

export function agendaTypeLabel(type) {
  return normalizeAgendaType(type) === '悬念' ? '未解悬念' : '行动计划';
}

export function agendaTypeClass(type) {
  return normalizeAgendaType(type) === '悬念' ? 'type-suspense' : 'type-plan';
}

export function createEmptyDraftRow(kind) {
  switch (kind) {
    case 'affection':
      return { id: rowId('aff'), name: '', value: 0, editing: true };
    case 'relationship':
      return { id: rowId('rel'), from: '', to: '', type: '', note: '', editing: true };
    case 'costume':
      return { id: rowId('costume'), name: '', desc: '', editing: true };
    case 'item':
      return {
        id: rowId('item'),
        icon: '',
        name: '',
        holder: '',
        location: '',
        description: '',
        importance: '',
        editing: true,
      };
    case 'agenda':
      return { id: rowId('agenda'), date: '', type: '悬念', text: '', source: 'user', editing: true };
    default:
      return { id: rowId('row'), editing: true };
  }
}

export function metaToDraft(meta) {
  const source = ensureMetaShape(meta);
  const firstEvent = source.events[0] || {};

  return {
    baseMeta: cloneData(source),
    timestamp: {
      story_date: source.timestamp.story_date || '',
      story_time: source.timestamp.story_time || '',
    },
    scene: {
      location: source.scene.location || '',
      atmosphere: source.scene.atmosphere || '',
      characters_present: Array.isArray(source.scene.characters_present)
        ? [...source.scene.characters_present]
        : [],
      scene_desc: source.scene.scene_desc || '',
    },
    event: {
      level: firstEvent.level || '',
      summary: firstEvent.summary || '',
      editing: false,
    },
    affectionRows: Object.entries(source.affection || {}).map(([name, value]) => ({
      id: rowId('aff'),
      name,
      value: affectionValueToDisplay(value),
      editing: false,
    })),
    relationshipRows: (source.relationships || []).map((row) => ({
      id: rowId('rel'),
      from: row.from || '',
      to: row.to || '',
      type: row.type || '',
      note: row.note || '',
      editing: false,
    })),
    costumeRows: Object.entries(source.costumes || {}).map(([name, desc]) => ({
      id: rowId('costume'),
      name,
      desc,
      editing: false,
    })),
    itemRows: Object.entries(source.items || {}).map(([name, info]) => ({
      id: rowId('item'),
      icon: info?.icon || '',
      name,
      holder: info?.holder || '',
      location: info?.location || '',
      description: info?.description || '',
      importance: info?.importance || '',
      editing: false,
    })),
    deletedItemRows: (source.deletedItems || []).map((name) => ({
      id: rowId('deleted-item'),
      name: String(name || '').trim(),
    })).filter((row) => row.name),
    agendaRows: (source.agenda || []).map((item) => ({
      id: rowId('agenda'),
      date: item.date || '',
      type: normalizeAgendaType(item.type),
      text: item.text || '',
      source: item.source || 'user',
      done: !!item.done,
      editing: false,
    })),
    isSkipped: !!source._skipHorae,
  };
}

export function draftToMeta(draft) {
  const base = ensureMetaShape(draft.baseMeta);
  const meta = cloneData(base);

  meta.timestamp = {
    ...(base.timestamp || {}),
    story_date: String(draft.timestamp.story_date || '').trim(),
    story_time: String(draft.timestamp.story_time || '').trim(),
    absolute: new Date().toISOString(),
  };

  meta.scene = {
    ...(base.scene || {}),
    location: String(draft.scene.location || '').trim(),
    atmosphere: String(draft.scene.atmosphere || '').trim(),
    characters_present: Array.isArray(draft.scene.characters_present)
      ? draft.scene.characters_present.map((name) => String(name || '').trim()).filter(Boolean)
      : [],
  };
  if (draft.scene.scene_desc) meta.scene.scene_desc = draft.scene.scene_desc;

  meta.costumes = {};
  for (const row of draft.costumeRows || []) {
    const name = String(row.name || '').trim();
    const desc = String(row.desc || '').trim();
    if (name && desc) meta.costumes[name] = desc;
  }

  meta.items = {};
  for (const row of draft.itemRows || []) {
    const name = String(row.name || '').trim();
    if (!name) continue;
    meta.items[name] = {
      icon: String(row.icon || '').trim() || null,
      importance: row.importance || '',
      holder: String(row.holder || '').trim() || null,
      location: String(row.location || '').trim(),
      description: String(row.description || '').trim(),
    };
  }

  meta.affection = {};
  for (const row of draft.affectionRows || []) {
    const name = String(row.name || '').trim();
    if (!name) continue;
    const value = Number.parseFloat(row.value);
    meta.affection[name] = {
      type: 'absolute',
      value: Number.isFinite(value) ? value : String(row.value || '').trim(),
    };
  }

  meta.relationships = [];
  for (const row of draft.relationshipRows || []) {
    const from = String(row.from || '').trim();
    const to = String(row.to || '').trim();
    const type = String(row.type || '').trim();
    const note = String(row.note || '').trim();
    if (from && to && type) meta.relationships.push({ from, to, type, note });
  }

  const eventSummary = String(draft.event.summary || '').trim();
  const eventLevel = String(draft.event.level || '').trim();
  meta.events = eventSummary
    ? [{
        is_important: eventLevel === '重要' || eventLevel === '关键' || eventLevel === '關鍵',
        level: eventLevel || '一般',
        summary: eventSummary,
      }]
    : [];
  delete meta.event;

  meta.agenda = [];
  for (const row of draft.agendaRows || []) {
    const text = String(row.text || '').trim();
    if (!text) continue;
    meta.agenda.push({
      type: normalizeAgendaType(row.type),
      date: String(row.date || '').trim(),
      text,
      source: row.source || 'user',
      done: !!row.done,
    });
  }

  const deletedItemsSource = Array.isArray(draft.deletedItemRows)
    ? draft.deletedItemRows.map((row) => row?.name)
    : base.deletedItems;
  meta.deletedItems = [];
  const deletedItemNames = new Set();
  for (const value of deletedItemsSource || []) {
    const name = String(value || '').trim();
    if (!name || deletedItemNames.has(name)) continue;
    deletedItemNames.add(name);
    meta.deletedItems.push(name);
  }
  meta.deletedAgenda = Array.isArray(base.deletedAgenda) ? [...base.deletedAgenda] : [];
  meta.npcs = cloneData(base.npcs || {});
  meta.mood = cloneData(base.mood || {});

  if (base._skipHorae) meta._skipHorae = true;
  if (base._aiScanned) meta._aiScanned = true;
  if (base._rpgChanges) meta._rpgChanges = cloneData(base._rpgChanges);
  if (base.tableContributions) meta.tableContributions = cloneData(base.tableContributions);

  return meta;
}

export function replaceDraft(target, meta) {
  const next = metaToDraft(meta);
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, next);
}

export function splitCharacters(input) {
  if (Array.isArray(input)) return input.map((v) => String(v || '').trim()).filter(Boolean);
  return String(input || '').split(/[,，]/).map((v) => v.trim()).filter(Boolean);
}
