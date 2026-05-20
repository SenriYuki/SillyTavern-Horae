import { createApp } from 'vue';
import MessagePanel from './MessagePanel.vue';
import './messagePanel.css';

export function mountMessagePanel(hostEl, options = {}) {
  if (!hostEl) return null;

  const app = createApp(MessagePanel, {
    ...options,
    setHostState(state = {}) {
      hostEl.classList.toggle('horae-sideplay', !!state.isSkipped);
      if (typeof state.visible === 'boolean') {
        hostEl.style.display = state.visible ? '' : 'none';
      }
      options.setHostState?.(state);
    },
  });

  const vm = app.mount(hostEl);
  const observer = new MutationObserver(() => {
    if (!document.body.contains(hostEl)) {
      app.unmount();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return {
    unmount() {
      observer.disconnect();
      app.unmount();
    },
    updateMeta(meta) {
      vm?.replaceMeta?.(meta);
    },
  };
}
