import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import { watch } from 'vue';
import esMX from 'src/i18n/es-MX.json';
import enUS from 'src/i18n/en-US.json';

const locale = localStorage.getItem('locale') || 'es-MX';

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'es-MX',
  messages: {
    'es-MX': esMX,
    'en-US': enUS,
  },
});

export default boot(({ app }) => {
  app.use(i18n);
  watch(
    () => i18n.global.locale.value,
    (val) => {
      localStorage.setItem('locale', val);
    }
  );
});
