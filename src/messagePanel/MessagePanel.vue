<template>
  <div ref="panelRoot" class="horae-message-panel-shell">
    <div class="horae-panel-top" @click="onHeaderClick">
      <div class="toggle-left">
        <div class="toggle-icon">
          <i :class="['fa-regular', draft.isSkipped ? 'fa-eye-slash' : 'fa-clock']"></i>
        </div>
        <div class="toggle-info">
          <div class="toggle-time">
            <span v-if="draft.isSkipped" class="horae-sideplay-badge">{{ labels.sideplay }}</span>
            {{ headerTime }}
          </div>
          <div class="toggle-summary">{{ headerSummary }}</div>
        </div>
      </div>
      <div class="toggle-actions">
        <button
          v-show="config.sideplayMode"
          class="neo-btn-icon"
          :title="labels.sideplayTitle"
          @click.stop="toggleSideplay"
        >
          <i :class="['fa-solid', draft.isSkipped ? 'fa-eye' : 'fa-masks-theater']"></i>
        </button>
        <button class="neo-btn-icon" :title="labels.rescan" @click.stop="rescan">
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>
        <button class="neo-btn-icon btn-ai-analyze" :title="labels.aiAnalyze" :disabled="busy.ai" @click.stop="aiAnalyze">
          <i :class="['fa-solid', busy.ai ? 'fa-spinner fa-spin' : 'fa-magnifying-glass']"></i>
        </button>
      </div>
    </div>

    <div v-show="!collapsed" class="horae-panel-content">
      <div class="neo-dashboard">
        <div class="neo-tags">
          <span class="neo-chip">
            <i class="fa-solid fa-location-dot"></i>
            <input v-model="draft.scene.location" class="neo-chip-input" :placeholder="labels.location" @input="markDirty">
          </span>
          <span class="neo-chip">
            <i class="fa-solid fa-cloud-moon"></i>
            <input v-model="draft.scene.atmosphere" class="neo-chip-input" :placeholder="labels.atmosphere" @input="markDirty">
          </span>
          <span class="neo-chip">
            <i class="fa-solid fa-users"></i>
            <input v-model="charactersText" class="neo-chip-input" :placeholder="labels.characters" @input="onCharactersInput">
          </span>
        </div>

        <div class="neo-event-card editable-block" :class="{ 'is-editing': draft.event.editing }">
          <div class="event-header">
            <span class="event-badge">
              <i class="fa-solid fa-bolt"></i>
              {{ eventLevelLabel }}
            </span>
            <div class="action-group-hover">
              <button class="action-hover-btn btn-edit" @click="toggleRowEdit(draft.event)">
                <i class="fa-solid fa-pen"></i>
              </button>
            </div>
          </div>
          <div class="view-mode">
            <div class="event-body-text">{{ draft.event.summary || labels.noSpecialEvents }}</div>
          </div>
          <div class="edit-mode">
            <select v-model="draft.event.level" class="neo-input event-level-select" @change="markDirty">
              <option value="">{{ labels.levelNone }}</option>
              <option value="一般">{{ labels.levelNormal }}</option>
              <option value="重要">{{ labels.levelImportant }}</option>
              <option value="关键">{{ labels.levelCritical }}</option>
            </select>
            <textarea
              v-model="draft.event.summary"
              class="neo-textarea lg no-enter"
              rows="2"
              :placeholder="labels.eventPlaceholder"
              @input="markDirty"
              @keydown.enter.prevent="toggleRowEdit(draft.event)"
            ></textarea>
          </div>
        </div>

        <section class="neo-inset-section">
          <div class="neo-section-header compact">
            <span class="section-title"><i class="fa-solid fa-heart"></i> {{ labels.affection }}</span>
            <button class="neo-text-btn add" @click="addRow('affectionRows', 'affection')">
              <i class="fa-solid fa-plus"></i> {{ labels.add }}
            </button>
          </div>
          <div class="aff-grid list-container">
            <div v-for="row in draft.affectionRows" :key="row.id" class="aff-chip editable-block" :class="{ 'is-editing': row.editing }">
              <div class="view-mode">
                <span class="t-title">{{ row.name || labels.role }}</span>
                <span class="t-val">{{ row.value || 0 }}</span>
              </div>
              <div class="edit-mode">
                <input v-model="row.name" class="neo-input no-enter aff-name" :placeholder="labels.role" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                <input v-model="row.value" class="neo-input no-enter aff-value" :placeholder="labels.value" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
              </div>
              <RowActions :row="row" @edit="toggleRowEdit(row)" @delete="deleteRow('affectionRows', row.id)" />
            </div>
          </div>
        </section>

        <section class="neo-inset-section">
          <div class="neo-section-header compact">
            <span class="section-title"><i class="fa-solid fa-diagram-project"></i> {{ labels.relationships }}</span>
            <button class="neo-text-btn add" @click="addRow('relationshipRows', 'relationship')">
              <i class="fa-solid fa-plus"></i> {{ labels.add }}
            </button>
          </div>
          <div class="rel-list list-container">
            <div v-for="row in draft.relationshipRows" :key="row.id" class="rel-row editable-block" :class="{ 'is-editing': row.editing }">
              <div class="view-mode">
                <span class="rel-node">{{ row.from || labels.role }}</span>
                <i class="fa-solid fa-arrow-right-long rel-arrow"></i>
                <span class="rel-node">{{ row.to || labels.role }}</span>
                <span class="rel-label">{{ row.type || labels.relationshipHint }}</span>
              </div>
              <div class="edit-mode">
                <input v-model="row.from" class="neo-input no-enter rel-person" :placeholder="labels.relFrom" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                <i class="fa-solid fa-arrow-right-long"></i>
                <input v-model="row.to" class="neo-input no-enter rel-person" :placeholder="labels.relTo" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                <input v-model="row.type" class="neo-input no-enter" :placeholder="labels.relType" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
              </div>
              <RowActions :row="row" @edit="toggleRowEdit(row)" @delete="deleteRow('relationshipRows', row.id)" />
            </div>
          </div>
        </section>

        <DictSection
          :title="labels.costumes"
          icon="fa-shirt"
          :rows="draft.costumeRows"
          :labels="labels"
          @add="addRow('costumeRows', 'costume')"
          @edit="toggleRowEdit"
          @delete="deleteRow('costumeRows', $event)"
          @dirty="markDirty"
        />

        <section class="neo-inset-section">
          <div class="neo-section-header">
            <span class="section-title"><i class="fa-solid fa-box-open"></i> {{ labels.items }}</span>
            <button class="neo-text-btn add" @click="addRow('itemRows', 'item')">
              <i class="fa-solid fa-plus"></i> {{ labels.add }}
            </button>
          </div>
          <div class="neo-item-list list-container">
            <div v-for="row in draft.itemRows" :key="row.id" class="neo-item-card editable-block" :class="{ 'is-editing': row.editing }">
              <div class="view-mode">
                <div class="item-emoji">{{ row.icon || '📦' }}</div>
                <div class="item-info">
                  <div class="item-line-top">
                    <span>{{ row.name || labels.itemName }}</span>
                    <span v-if="row.holder" class="item-holder-badge">{{ row.holder }}</span>
                  </div>
                  <div v-if="row.location" class="item-meta">
                    <i class="fa-solid fa-location-dot"></i> {{ row.location }}
                  </div>
                  <div class="item-desc">{{ row.description || labels.itemDesc }}</div>
                </div>
              </div>
              <div class="edit-mode item-edit-mode">
                <div class="item-edit-line">
                  <input v-model="row.icon" class="neo-input no-enter item-icon-input" maxlength="2" placeholder="📦" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                  <input v-model="row.name" class="neo-input no-enter" :placeholder="labels.itemName" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                  <input v-model="row.holder" class="neo-input no-enter item-holder-input" :placeholder="labels.holder" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                </div>
                <input v-model="row.location" class="neo-input no-enter" :placeholder="labels.location" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                <textarea v-model="row.description" class="neo-textarea no-enter" :placeholder="labels.itemDesc" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)"></textarea>
              </div>
              <RowActions :row="row" delete-icon="fa-trash-can" @edit="toggleRowEdit(row)" @delete="deleteRow('itemRows', row.id)" />
            </div>
          </div>
        </section>

        <section class="neo-inset-section">
          <div class="neo-section-header">
            <span class="section-title"><i class="fa-solid fa-list-check"></i> {{ labels.agenda }}</span>
            <button class="neo-text-btn add" @click="addRow('agendaRows', 'agenda')">
              <i class="fa-solid fa-plus"></i> {{ labels.add }}
            </button>
          </div>
          <div class="neo-agenda-list list-container">
            <div
              v-for="row in draft.agendaRows"
              :key="row.id"
              class="agenda-card editable-block"
              :class="[agendaTypeClass(row.type), { 'is-editing': row.editing }]"
            >
              <div class="view-mode">
                <div class="agenda-date">{{ row.date || labels.unscheduled }}</div>
                <div class="agenda-content">
                  <span class="agenda-type">{{ agendaTypeLabel(row.type) }}</span>
                  <span class="agenda-text">{{ row.text || labels.agendaText }}</span>
                </div>
              </div>
              <div class="edit-mode agenda-edit-mode">
                <div class="agenda-edit-line">
                  <input v-model="row.date" class="neo-input no-enter agenda-date-input" :placeholder="labels.date" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                  <select v-model="row.type" class="neo-input no-enter" @change="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                    <option value="悬念">{{ labels.agendaMystery }}</option>
                    <option value="计划">{{ labels.agendaPlan }}</option>
                  </select>
                </div>
                <textarea v-model="row.text" class="neo-textarea no-enter" :placeholder="labels.agendaText" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)"></textarea>
              </div>
              <RowActions :row="row" @edit="toggleRowEdit(row)" @delete="deleteRow('agendaRows', row.id)" />
            </div>
          </div>
        </section>

        <div class="neo-footer-actions">
          <div class="action-group">
            <button class="neo-btn-text" :disabled="busy.scan" @click="quickScan">
              <i :class="['fa-solid', busy.scan ? 'fa-spinner fa-spin' : 'fa-arrows-rotate']"></i> {{ labels.quickScan }}
            </button>
            <button class="neo-btn-text btn-ai-text" :disabled="busy.ai" @click="aiAnalyze">
              <i :class="['fa-solid', busy.ai ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles']"></i> {{ labels.aiAnalyze }}
            </button>
          </div>
          <div class="action-group">
            <button class="neo-btn-text btn-save-apply" :disabled="busy.save" @click="save">
              <i :class="['fa-solid', busy.save ? 'fa-spinner fa-spin' : 'fa-check']"></i> {{ labels.apply }}
            </button>
            <button class="neo-btn-text" @click="collapsed = true">
              <i class="fa-solid fa-chevron-up"></i> {{ labels.collapse }}
            </button>
            <button class="neo-btn-text btn-drawer" :title="labels.openDrawer" @click="adapter.openDrawer?.()">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, reactive, ref, watch } from 'vue';
import {
  agendaTypeClass,
  agendaTypeLabel,
  createEmptyDraftRow,
  draftToMeta,
  metaToDraft,
  replaceDraft,
  splitCharacters,
} from './messagePanelBridge.js';

const props = defineProps({
  messageId: { type: Number, required: true },
  initialMeta: { type: Object, default: () => ({}) },
  adapter: { type: Object, default: () => ({}) },
  labels: { type: Object, default: () => ({}) },
  config: { type: Object, default: () => ({}) },
  setHostState: { type: Function, default: null },
});

const defaultLabels = {
  sideplay: '番外',
  sideplayTitle: '标记为番外',
  noTracking: '不追踪',
  rescan: '重新扫描',
  quickScan: '扫描标签',
  aiAnalyze: 'AI分析',
  apply: '应用',
  collapse: '收缩展开',
  add: '添加',
  role: '角色',
  value: '数值',
  location: '地点',
  atmosphere: '氛围',
  characters: '在场',
  event: '事件',
  noSpecialEvents: '无特殊事件',
  eventPlaceholder: '事件摘要',
  levelNone: '无',
  levelNormal: '一般',
  levelImportant: '重要',
  levelCritical: '关键',
  affection: '好感度追踪',
  relationships: '关系网络',
  relationshipHint: '关系简述',
  relFrom: '主',
  relTo: '客',
  relType: '关系',
  costumes: '服装与细节',
  items: '物品状态追踪',
  itemName: '物品名称',
  itemDesc: '物品描述',
  holder: '持有者',
  agenda: '悬念与计划',
  agendaMystery: '未解悬念',
  agendaPlan: '行动计划',
  agendaText: '事项内容',
  date: '时间设定',
  unscheduled: '未定',
  openDrawer: '打开 Horae 面板',
};

const labels = computed(() => ({ ...defaultLabels, ...props.labels })).value;
const config = computed(() => ({ sideplayMode: false, ...props.config })).value;
const adapter = props.adapter || {};
const panelRoot = ref(null);
const draft = reactive(metaToDraft(props.initialMeta));
const collapsed = ref(false);
const dirty = ref(false);
const busy = reactive({ save: false, scan: false, ai: false, sideplay: false });

const charactersText = ref((draft.scene.characters_present || []).join(', '));

watch(
  () => draft.scene.characters_present,
  (value) => {
    charactersText.value = (value || []).join(', ');
  },
  { deep: true },
);

watch(
  () => draft.isSkipped,
  (value) => {
    props.setHostState?.({ isSkipped: !!value, visible: config.showPanel !== false });
  },
  { immediate: true },
);

const headerTime = computed(() => {
  if (draft.isSkipped) return labels.noTracking;
  const date = draft.timestamp.story_date || '--';
  const time = draft.timestamp.story_time ? ` ${draft.timestamp.story_time}` : '';
  return `${date}${time}`;
});

const headerSummary = computed(() => {
  if (draft.isSkipped) return labels.sideplayTitle;
  const summary = draft.event.summary || labels.noSpecialEvents;
  const count = draft.scene.characters_present?.length || 0;
  return count ? `${summary} | ${count}${labels.characters}` : summary;
});

const eventLevelLabel = computed(() => {
  const level = draft.event.level || labels.levelNormal;
  return `${level}${labels.event}`;
});

function markDirty() {
  dirty.value = true;
}

function onHeaderClick(event) {
  if (event.target.closest('button, input, textarea, select')) return;
  collapsed.value = !collapsed.value;
}

function onCharactersInput() {
  draft.scene.characters_present = splitCharacters(charactersText.value);
  markDirty();
}

function toggleRowEdit(row) {
  row.editing = !row.editing;
  if (!row.editing) markDirty();
  nextTick(resizeTextareas);
}

function addRow(listName, kind) {
  draft[listName].push(createEmptyDraftRow(kind));
  markDirty();
  nextTick(resizeTextareas);
}

function deleteRow(listName, id) {
  const list = draft[listName];
  const index = list.findIndex((row) => row.id === id);
  if (index >= 0) {
    list.splice(index, 1);
    markDirty();
  }
}

function resetFromMeta(meta) {
  replaceDraft(draft, meta || {});
  charactersText.value = (draft.scene.characters_present || []).join(', ');
  dirty.value = false;
  nextTick(resizeTextareas);
}

async function save() {
  busy.save = true;
  try {
    const nextMeta = draftToMeta(draft);
    const savedMeta = await adapter.save?.(nextMeta);
    if (savedMeta) resetFromMeta(savedMeta);
    else dirty.value = false;
  } finally {
    busy.save = false;
  }
}

async function quickScan() {
  busy.scan = true;
  try {
    const nextMeta = await adapter.quickScan?.();
    if (nextMeta) resetFromMeta(nextMeta);
  } finally {
    busy.scan = false;
  }
}

async function rescan() {
  busy.scan = true;
  try {
    const nextMeta = await adapter.rescan?.();
    if (nextMeta) resetFromMeta(nextMeta);
  } finally {
    busy.scan = false;
  }
}

async function aiAnalyze() {
  busy.ai = true;
  try {
    const nextMeta = await adapter.aiAnalyze?.();
    if (nextMeta) resetFromMeta(nextMeta);
  } finally {
    busy.ai = false;
  }
}

async function toggleSideplay() {
  busy.sideplay = true;
  try {
    const nextMeta = await adapter.toggleSideplay?.();
    if (nextMeta) resetFromMeta(nextMeta);
  } finally {
    busy.sideplay = false;
  }
}

function resizeTextareas() {
  panelRoot.value?.querySelectorAll('textarea').forEach((textarea) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  });
}

const RowActions = defineComponent({
  props: {
    row: { type: Object, required: true },
    deleteIcon: { type: String, default: 'fa-xmark' },
  },
  emits: ['edit', 'delete'],
  setup(rowProps, { emit }) {
    return () => h('div', { class: 'action-group-hover' }, [
      h('button', { class: 'action-hover-btn btn-edit', onClick: () => emit('edit') }, [
        h('i', { class: 'fa-solid fa-pen' }),
      ]),
      h('button', { class: 'action-hover-btn btn-del', onClick: () => emit('delete') }, [
        h('i', { class: `fa-solid ${rowProps.deleteIcon}` }),
      ]),
    ]);
  },
});

const DictSection = defineComponent({
  props: {
    title: { type: String, required: true },
    icon: { type: String, required: true },
    rows: { type: Array, required: true },
    labels: { type: Object, required: true },
  },
  emits: ['add', 'edit', 'delete', 'dirty'],
  setup(sectionProps, { emit }) {
    return () => h('section', { class: 'neo-inset-section' }, [
      h('div', { class: 'neo-section-header' }, [
        h('span', { class: 'section-title' }, [
          h('i', { class: `fa-solid ${sectionProps.icon}` }),
          ` ${sectionProps.title}`,
        ]),
        h('button', { class: 'neo-text-btn add', onClick: () => emit('add') }, [
          h('i', { class: 'fa-solid fa-plus' }),
          ` ${sectionProps.labels.add}`,
        ]),
      ]),
      h('div', { class: 'neo-dict-list list-container' }, sectionProps.rows.map((row) => (
        h('div', { key: row.id, class: ['neo-dict-row editable-block', { 'is-editing': row.editing }] }, [
          h('div', { class: 'view-mode dict-view' }, [
            h('div', { class: 'dict-key' }, row.name || sectionProps.labels.role),
            h('div', { class: 'dict-value' }, row.desc || sectionProps.labels.itemDesc),
          ]),
          h('div', { class: 'edit-mode dict-edit-mode' }, [
            h('input', {
              class: 'neo-input short-key no-enter',
              value: row.name,
              placeholder: sectionProps.labels.role,
              onInput: (event) => {
                row.name = event.target.value;
                emit('dirty');
              },
              onKeydown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  emit('edit', row);
                }
              },
            }),
            h('textarea', {
              class: 'neo-textarea no-enter',
              value: row.desc,
              placeholder: sectionProps.labels.itemDesc,
              onInput: (event) => {
                row.desc = event.target.value;
                emit('dirty');
              },
              onKeydown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  emit('edit', row);
                }
              },
            }),
          ]),
          h(RowActions, {
            row,
            onEdit: () => emit('edit', row),
            onDelete: () => emit('delete', row.id),
          }),
        ])
      ))),
    ]);
  },
});

function replaceMeta(meta) {
  resetFromMeta(meta);
}

defineExpose({ replaceMeta });
</script>
