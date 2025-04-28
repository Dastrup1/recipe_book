import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>   {/* Apply MUI Theme */}
      <CssBaseline />               {/* Normalize styles */}
      <BrowserRouter>               {/* Routing */}
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

// Measure performance
reportWebVitals();
