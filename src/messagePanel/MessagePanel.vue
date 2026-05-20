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

    <Transition
      :css="false"
      @before-enter="beforePanelEnter"
      @enter="panelEnter"
      @after-enter="afterPanelEnter"
      @before-leave="beforePanelLeave"
      @leave="panelLeave"
      @after-leave="afterPanelLeave"
    >
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

        <div
          class="neo-event-card editable-block"
          :class="{ 'is-editing': draft.event.editing, 'is-action-open': isActionOpen('event', draft.event) }"
          @click="toggleActionControls('event', draft.event)"
        >
          <div class="event-header">
            <span class="event-badge">
              <i class="fa-solid fa-bolt"></i>
              {{ eventLevelLabel }}
            </span>
            <div class="action-group-hover">
              <button class="action-hover-btn btn-edit" @click.stop="toggleRowEdit(draft.event)">
                <i class="fa-solid fa-pen"></i>
              </button>
            </div>
          </div>
          <div class="view-mode">
            <div class="event-body-text">{{ draft.event.summary || labels.noSpecialEvents }}</div>
          </div>
          <div class="edit-mode" @click.stop>
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
            <div
              v-for="row in draft.affectionRows"
              :key="row.id"
              class="aff-chip editable-block"
              :class="{ 'is-editing': row.editing, 'is-action-open': isActionOpen('affectionRows', row) }"
              @click="toggleActionControls('affectionRows', row)"
            >
              <div class="view-mode">
                <span class="t-title">{{ row.name || labels.role }}</span>
                <span class="t-val">{{ row.value || 0 }}</span>
              </div>
              <div class="edit-mode" @click.stop>
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
            <div
              v-for="row in draft.relationshipRows"
              :key="row.id"
              class="rel-row editable-block"
              :class="{ 'is-editing': row.editing, 'is-action-open': isActionOpen('relationshipRows', row) }"
              @click="toggleActionControls('relationshipRows', row)"
            >
              <div class="view-mode">
                <span class="rel-node">{{ row.from || labels.role }}</span>
                <i class="fa-solid fa-arrow-right-long rel-arrow"></i>
                <span class="rel-node">{{ row.to || labels.role }}</span>
                <span class="rel-label">{{ row.type || labels.relationshipHint }}</span>
              </div>
              <div class="edit-mode" @click.stop>
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
            <div
              v-for="row in draft.itemRows"
              :key="row.id"
              class="neo-item-card editable-block"
              :class="{ 'is-editing': row.editing, 'is-action-open': isActionOpen('itemRows', row) }"
              @click="toggleActionControls('itemRows', row)"
            >
              <div class="view-mode">
                <div class="item-info">
                  <div class="item-line-top">
                    <span class="item-title">
                      <span class="item-emoji">{{ row.icon || '📦' }}</span>
                      <span class="item-name">{{ row.name || labels.itemName }}</span>
                    </span>
                    <span v-if="row.holder" class="item-holder-badge">{{ row.holder }}</span>
                  </div>
                  <div v-if="row.location" class="item-meta">
                    <i class="fa-solid fa-location-dot"></i> {{ row.location }}
                  </div>
                  <div class="item-desc">{{ row.description || labels.itemDesc }}</div>
                </div>
              </div>
              <div class="edit-mode item-edit-mode" @click.stop>
                <div class="item-edit-line">
                  <input v-model="row.icon" class="neo-input no-enter item-icon-input" maxlength="2" placeholder="📦" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                  <input v-model="row.name" class="neo-input no-enter" :placeholder="labels.itemName" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                  <input v-model="row.holder" class="neo-input no-enter item-holder-input" :placeholder="labels.holder" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                </div>
                <input v-model="row.location" class="neo-input no-enter" :placeholder="labels.location" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)">
                <textarea v-model="row.description" class="neo-textarea no-enter" :placeholder="labels.itemDesc" @input="markDirty" @keydown.enter.prevent="toggleRowEdit(row)"></textarea>
              </div>
              <RowActions :row="row" delete-icon="fa-trash-can" @edit="toggleRowEdit(row)" @delete="deleteItemRow(row.id)" />
            </div>
          </div>
          <div v-if="draft.deletedItemRows?.length" class="deleted-items-zone" :aria-label="labels.deletedItems">
            <div
              v-for="row in draft.deletedItemRows"
              :key="row.id"
              class="deleted-chip"
            >
              <span>{{ row.name }}</span>
              <button
                type="button"
                class="action-hover-btn btn-del"
                :title="labels.deleteForever"
                @click.stop="deleteDeletedItem(row.id)"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
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
              :class="[agendaTypeClass(row.type), { 'is-editing': row.editing, 'is-action-open': isActionOpen('agendaRows', row) }]"
              @click="toggleActionControls('agendaRows', row)"
            >
              <div class="view-mode">
                <div class="agenda-date">{{ row.date || labels.unscheduled }}</div>
                <div class="agenda-content">
                  <span class="agenda-type">{{ agendaTypeLabel(row.type) }}</span>
                  <span class="agenda-text">{{ row.text || labels.agendaText }}</span>
                </div>
              </div>
              <div class="edit-mode agenda-edit-mode" @click.stop>
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

      </div>

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
          <button style="display: none;" class="neo-btn-text btn-drawer" :title="labels.openDrawer" @click="adapter.openDrawer?.()">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </button>
        </div>
      </div>
    </div>
    </Transition>
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
  deletedItems: '物品消耗/删除',
  deleteForever: '彻底移除',
  agenda: '悬念与计划',
  agendaMystery: '未解悬念',
  agendaPlan: '行动计划',
  agendaText: '事项内容',
  date: '时间设定',
  unscheduled: '未定',
  openDrawer: '打开 Horae 面板',
};

const labels = computed(() => ({ ...defaultLabels, ...props.labels })).value;
const config = reactive({ sideplayMode: false, showPanel: true, ...props.config });
const adapter = props.adapter || {};
const panelRoot = ref(null);
const draft = reactive(metaToDraft(props.initialMeta));
const collapsed = ref(true);
const dirty = ref(false);
const activeActionKey = ref(null);
const busy = reactive({ save: false, scan: false, ai: false, sideplay: false });
const PANEL_ENTER_MS = 240;
const PANEL_LEAVE_MS = 200;
const PANEL_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const PANEL_EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

const charactersText = ref((draft.scene.characters_present || []).join(', '));

watch(
  () => draft.scene.characters_present,
  (value) => {
    charactersText.value = (value || []).join(', ');
  },
  { deep: true },
);

watch(
  () => [draft.isSkipped, config.showPanel],
  ([isSkipped]) => {
    props.setHostState?.({ isSkipped: !!isSkipped, visible: config.showPanel !== false });
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

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function clearPanelMotion(el) {
  el._horaePanelCleanup?.();
  el._horaePanelCleanup = null;
  el.style.height = '';
  el.style.opacity = '';
  el.style.transform = '';
  el.style.transition = '';
  el.style.overflow = '';
  el.style.willChange = '';
}

function waitPanelMotion(el, done, duration) {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    el._horaePanelCleanup = null;
    done();
  };
  const onEnd = (event) => {
    if (event.target === el && event.propertyName === 'height') finish();
  };
  const cleanup = () => {
    el.removeEventListener('transitionend', onEnd);
    if (el._horaePanelTimer) window.clearTimeout(el._horaePanelTimer);
    el._horaePanelTimer = null;
  };
  el.addEventListener('transitionend', onEnd);
  el._horaePanelTimer = window.setTimeout(finish, duration + 80);
  el._horaePanelCleanup = cleanup;
}

function beforePanelEnter(el) {
  clearPanelMotion(el);
  if (prefersReducedMotion()) return;
  el.style.height = '0px';
  el.style.opacity = '0';
  el.style.transform = 'translateY(-6px)';
  el.style.overflow = 'hidden';
  el.style.willChange = 'height, opacity, transform';
}

function panelEnter(el, done) {
  if (prefersReducedMotion()) {
    done();
    return;
  }
  el.style.transition = `height ${PANEL_ENTER_MS}ms ${PANEL_EASE_OUT}, opacity 180ms ease-out, transform ${PANEL_ENTER_MS}ms ${PANEL_EASE_OUT}`;
  requestAnimationFrame(() => {
    el.style.height = `${el.scrollHeight}px`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  waitPanelMotion(el, done, PANEL_ENTER_MS);
}

function afterPanelEnter(el) {
  clearPanelMotion(el);
  nextTick(resizeTextareas);
}

function beforePanelLeave(el) {
  clearPanelMotion(el);
  if (prefersReducedMotion()) return;
  el.style.height = `${el.scrollHeight}px`;
  el.style.opacity = '1';
  el.style.transform = 'translateY(0)';
  el.style.overflow = 'hidden';
  el.style.willChange = 'height, opacity, transform';
}

function panelLeave(el, done) {
  if (prefersReducedMotion()) {
    done();
    return;
  }
  void el.offsetHeight;
  el.style.transition = `height ${PANEL_LEAVE_MS}ms ${PANEL_EASE_IN}, opacity 140ms ease-in, transform ${PANEL_LEAVE_MS}ms ${PANEL_EASE_IN}`;
  requestAnimationFrame(() => {
    el.style.height = '0px';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-4px)';
  });
  waitPanelMotion(el, done, PANEL_LEAVE_MS);
}

function afterPanelLeave(el) {
  clearPanelMotion(el);
}

function onCharactersInput() {
  draft.scene.characters_present = splitCharacters(charactersText.value);
  markDirty();
}

function actionKey(listName, row) {
  return `${listName}:${row?.id || 'single'}`;
}

function isActionOpen(listName, row) {
  return activeActionKey.value === actionKey(listName, row);
}

function toggleActionControls(listName, row) {
  if (row?.editing) return;
  const key = actionKey(listName, row);
  activeActionKey.value = activeActionKey.value === key ? null : key;
}

function toggleRowEdit(row) {
  row.editing = !row.editing;
  activeActionKey.value = null;
  if (!row.editing) markDirty();
  nextTick(resizeTextareas);
}

function addRow(listName, kind) {
  draft[listName].push(createEmptyDraftRow(kind));
  activeActionKey.value = null;
  markDirty();
  nextTick(resizeTextareas);
}

function deleteRow(listName, id) {
  const list = draft[listName];
  const index = list.findIndex((row) => row.id === id);
  if (index >= 0) {
    list.splice(index, 1);
    activeActionKey.value = null;
    markDirty();
  }
}

function deleteItemRow(id) {
  const index = draft.itemRows.findIndex((row) => row.id === id);
  if (index < 0) return;

  const [row] = draft.itemRows.splice(index, 1);
  const name = String(row?.name || '').trim();
  if (name) {
    const exists = draft.deletedItemRows.some((item) => String(item.name || '').trim() === name);
    if (!exists) {
      draft.deletedItemRows.push({
        id: `deleted-${row.id}`,
        name,
      });
    }
  }

  activeActionKey.value = null;
  markDirty();
}

function deleteDeletedItem(id) {
  const index = draft.deletedItemRows.findIndex((row) => row.id === id);
  if (index >= 0) {
    draft.deletedItemRows.splice(index, 1);
    activeActionKey.value = null;
    markDirty();
  }
}

function resetFromMeta(meta) {
  replaceDraft(draft, meta || {});
  charactersText.value = (draft.scene.characters_present || []).join(', ');
  activeActionKey.value = null;
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
      h('button', {
        class: 'action-hover-btn btn-edit',
        onClick: (event) => {
          event.stopPropagation();
          emit('edit');
        },
      }, [
        h('i', { class: 'fa-solid fa-pen' }),
      ]),
      h('button', {
        class: 'action-hover-btn btn-del',
        onClick: (event) => {
          event.stopPropagation();
          emit('delete');
        },
      }, [
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
        h('div', {
          key: row.id,
          class: ['neo-dict-row editable-block', {
            'is-editing': row.editing,
            'is-action-open': isActionOpen('costumeRows', row),
          }],
          onClick: () => toggleActionControls('costumeRows', row),
        }, [
          h('div', { class: 'view-mode dict-view' }, [
            h('div', { class: 'dict-key' }, row.name || sectionProps.labels.role),
            h('div', { class: 'dict-value' }, row.desc || sectionProps.labels.itemDesc),
          ]),
          h('div', {
            class: 'edit-mode dict-edit-mode',
            onClick: (event) => event.stopPropagation(),
          }, [
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

function replaceConfig(nextConfig) {
  Object.assign(config, { sideplayMode: false, showPanel: true, ...(nextConfig || {}) });
}

defineExpose({ replaceMeta, replaceConfig });
</script>
