//fonts
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
//
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useInventariosStore } from './store/useProductoStore';

if (import.meta.env.DEV) {
  // @ts-ignore
  window.useInventariosStore = useInventariosStore;
}

createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
    <App />
  </StrictMode>,
  
)
