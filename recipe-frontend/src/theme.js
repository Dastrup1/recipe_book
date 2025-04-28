import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#477491',
    },
    secondary: {
      main: '#D28415',
    },
    background: {
      default: '#D2D2D2',
    },
  },
  typography: {
    fontFamily: '"Patrick Hand", Arial, sans-serif',
  },
  shape: {
    borderRadius: 12,  // Rounded corners
  },
});

export default theme;