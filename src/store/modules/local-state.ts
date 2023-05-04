import { defineStore } from 'pinia';

export const useLocalState = defineStore({
  id: 'local-state',
  state: () => ({
    filename: '',
  }),
  getters: {
    getFileName(): string {
      return this.filename;
    },
  },
  actions: {
    setFileName(filename: string) {
      this.filename = filename;
    },
  },
});
