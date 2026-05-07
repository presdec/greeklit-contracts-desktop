import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider as JotaiProvider } from 'jotai/react';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';

import { App } from './App';
import { I18nProvider } from './i18n';
import './styles.css';

function Root() {
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  return (
    <JotaiProvider>
      <MantineProvider
        forceColorScheme={colorScheme}
        theme={{
          primaryColor: 'teal',
          primaryShade: { light: 6, dark: 7 },
          white: '#ffffff',
          black: '#111111',
          fontFamily: 'Ubuntu, Noto Sans, DejaVu Sans, Liberation Sans, system-ui, sans-serif',
        }}
      >
        <I18nProvider>
          <App colorScheme={colorScheme} setColorScheme={setColorScheme} />
        </I18nProvider>
      </MantineProvider>
    </JotaiProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
