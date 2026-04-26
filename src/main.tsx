import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setColorScheme(event.matches ? 'dark' : 'light');
    };

    setColorScheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <JotaiProvider>
      <MantineProvider
        forceColorScheme={colorScheme}
        theme={{
          primaryColor: 'teal',
          fontFamily: 'Ubuntu, Noto Sans, DejaVu Sans, Liberation Sans, system-ui, sans-serif',
        }}
      >
        <I18nProvider>
          <App />
        </I18nProvider>
      </MantineProvider>
    </JotaiProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
