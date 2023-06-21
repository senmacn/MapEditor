import { App } from 'vue';
import { setupRepeatDirective } from './repeatClick';

export default function setCustomDirectives(app: App) {
  setupRepeatDirective(app);
}
