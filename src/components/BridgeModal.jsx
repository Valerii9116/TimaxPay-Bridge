const widgetConfig = {
  integrator: 'Timax_swap',
  containerStyle: {
    border: `1px solid rgb(55, 65, 81)`,
    borderRadius: '16px',
  },
  theme: {
    palette: {
      primary: { main: '#6366f1' },
      secondary: { main: '#a855f7' },
      background: {
        paper: '#1f2937',
        default: '#111827',
      },
      text: {
        primary: '#ffffff',
        secondary: '#d1d5db',
      },
    },
    shape: {
      borderRadius: '12px',
      borderRadiusSecondary: '12px',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }
  },
  appearance: 'dark',
  // Remove this line to allow wallet switching:
  // hiddenUI: ['walletMenu'],
};