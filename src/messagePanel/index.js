import { createApp } from 'vue';
import MessagePanel from './MessagePanel.vue';
import messagePanelCss from './messagePanel.css?inline';

const FONT_AWESOME_STYLESHEET_RE = /(?:fontawesome|font-awesome|\/css\/all(?:\.min)?\.css|\/css\/fontawesome(?:\.min)?\.css)/i;
const FONT_AWESOME_FALLBACK_HREF = '/css/fontawesome.min.css';

function resetShadowHostChrome(hostEl) {
  hostEl.style.setProperty('margin-top', '10px', 'important');
  hostEl.style.setProperty('margin-bottom', '18px', 'important');
  hostEl.style.setProperty('padding', '0', 'important');
  hostEl.style.setProperty('background', 'transparent', 'important');
  hostEl.style.setProperty('border', '0', 'important');
  hostEl.style.setProperty('border-radius', '0', 'important');
  hostEl.style.setProperty('box-shadow', 'none', 'important');
  hostEl.style.setProperty('overflow', 'visible', 'important');
  hostEl.style.setProperty('opacity', '1', 'important');
  hostEl.style.setProperty('order', '9999', 'important');
}

function injectPanelStyles(shadowRoot) {
  if (!shadowRoot.querySelector('style[data-horae-message-panel-style]')) {
    const styleEl = document.createElement('style');
    styleEl.dataset.horaeMessagePanelStyle = 'true';
    styleEl.textContent = messagePanelCss;
    shadowRoot.append(styleEl);
  }

  const stylesheetHrefs = new Set();
  document.querySelectorAll('link[rel~="stylesheet"][href]').forEach((link) => {
    if (FONT_AWESOME_STYLESHEET_RE.test(link.href)) {
      stylesheetHrefs.add(link.href);
    }
  });
  if (!stylesheetHrefs.size) stylesheetHrefs.add(FONT_AWESOME_FALLBACK_HREF);

  stylesheetHrefs.forEach((href) => {
    const exists = Array.from(shadowRoot.querySelectorAll('link[data-horae-fontawesome]'))
      .some((link) => link.href === href);
    if (exists) return;
    const linkEl = document.createElement('link');
    linkEl.dataset.horaeFontawesome = 'true';
    linkEl.rel = 'stylesheet';
    linkEl.href = href;
    shadowRoot.append(linkEl);
  });
}

function createShadowMount(hostEl) {
  resetShadowHostChrome(hostEl);

  const shadowRoot = hostEl.shadowRoot || hostEl.attachShadow({ mode: 'open' });
  shadowRoot.textContent = '';
  injectPanelStyles(shadowRoot);

  const panelContainer = document.createElement('div');
  panelContainer.style.setProperty('margin-top', '0', 'important');
  panelContainer.style.setProperty('margin-bottom', '0', 'important');
  shadowRoot.append(panelContainer);

  const syncPanelContainer = () => {
    const classes = ['horae-message-panel', 'horae-message-panel-vue'];
    if (hostEl.classList.contains('horae-sideplay')) {
      classes.push('horae-sideplay');
    }
    panelContainer.className = classes.join(' ');
    panelContainer.dataset.messageId = hostEl.dataset.messageId || '';
  };
  syncPanelContainer();

  const classObserver = new MutationObserver(syncPanelContainer);
  classObserver.observe(hostEl, {
    attributes: true,
    attributeFilter: ['class', 'data-message-id'],
  });

  return { panelContainer, classObserver, syncPanelContainer };
}

export function mountMessagePanel(hostEl, options = {}) {
  if (!hostEl) return null;

  const { panelContainer, classObserver, syncPanelContainer } = createShadowMount(hostEl);
  const app = createApp(MessagePanel, {
    ...options,
    setHostState(state = {}) {
      hostEl.classList.toggle('horae-sideplay', !!state.isSkipped);
      if (typeof state.visible === 'boolean') {
        hostEl.style.display = state.visible ? '' : 'none';
      }
      syncPanelContainer();
      options.setHostState?.(state);
    },
  });

  const vm = app.mount(panelContainer);
  const observer = new MutationObserver(() => {
    if (!document.body.contains(hostEl)) {
      app.unmount();
      observer.disconnect();
      classObserver.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return {
    unmount() {
      observer.disconnect();
      classObserver.disconnect();
      app.unmount();
    },
    updateMeta(meta) {
      vm?.replaceMeta?.(meta);
    },
    updateConfig(config) {
      vm?.replaceConfig?.(config);
    },
  };
}
