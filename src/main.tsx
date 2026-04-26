import ReactDOM from 'react-dom/client';
import { Provider as JotaiProvider } from 'jotai/react';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';

import { App } from './App';
import { I18nProvider } from './i18n';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <JotaiProvider>
    <MantineProvider
      theme={{
        primaryColor: 'teal',
        fontFamily: 'Segoe UI, Arial, sans-serif',
      }}
    >
      <I18nProvider>
        <App />
      </I18nProvider>
    </MantineProvider>
  </JotaiProvider>,
);
