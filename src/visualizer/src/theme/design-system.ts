import { createTheme, type Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    customGlass: {
      panelBg: string;
      panelBorder: string;
      softShadow: string;
    };
  }
  interface ThemeOptions {
    customGlass?: {
      panelBg?: string;
      panelBorder?: string;
      softShadow?: string;
    };
  }
}

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    glassPanel: true;
    glassPill: true;
    providerNode: true;
    entityNode: true;
    hintPanel: true;
  }
}

export function createVisualizerTheme(mode: 'light' | 'dark'): Theme {
  const isDark = mode === 'dark';
  const panelBorder = isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(16, 24, 40, 0.09)';
  const panelBg = isDark
    ? 'color-mix(in srgb, var(--mui-palette-background-paper) 80%, transparent)'
    : 'color-mix(in srgb, var(--mui-palette-background-paper) 90%, transparent)';
  const panelBgPill = isDark
    ? 'color-mix(in srgb, var(--mui-palette-background-paper) 78%, transparent)'
    : 'color-mix(in srgb, var(--mui-palette-background-paper) 88%, transparent)';
  const shadow = isDark
    ? '0 18px 46px color-mix(in srgb, #000000 38%, transparent)'
    : '0 8px 28px color-mix(in srgb, #101828 7%, transparent)';

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: { main: isDark ? '#7da7ff' : '#356ef3' },
      secondary: { main: isDark ? '#a78bfa' : '#0891b2' },
      background: {
        default: isDark ? '#0d1017' : '#fbfbfc',
        paper: isDark ? '#131e33' : '#ffffff',
      },
    },
    customGlass: {
      panelBg,
      panelBorder,
      softShadow: shadow,
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Sora", "IBM Plex Sans", "Segoe UI", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark ? '#0d1017' : '#fbfbfc',
          },
          '.workspace-shell': {
            position: 'relative',
            minHeight: '100dvh',
            overflow: 'auto',
            backgroundColor: 'var(--mui-palette-background-default)',
            backgroundImage: isDark
              ? 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(16,24,40,0.10) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          },
          '.workspace-loading': {
            height: '100dvh',
            display: 'grid',
            placeItems: 'center',
          },
          '.workspace-closed': {
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: 'var(--mui-palette-background-default)',
          },
          '.workspace-closed-card': {
            width: 360,
            textAlign: 'center',
          },
          '.workspace-stage': {
            position: 'relative',
            minWidth: 1260,
            minHeight: '100dvh',
            boxSizing: 'border-box',
            padding: '70px 42px 52px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 336px)',
            gridTemplateRows: 'repeat(3, auto)',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 104,
            rowGap: 80,
          },
          '.provider-slot': {
            position: 'relative',
            zIndex: 1,
          },
          '.provider-slot::before, .provider-slot::after': {
            content: '""',
            position: 'absolute',
            zIndex: -1,
            backgroundColor:
              'color-mix(in srgb, var(--mui-palette-primary-main) 24%, var(--mui-palette-divider))',
          },
          '.provider-slot-north': {
            gridColumn: 2,
            gridRow: 1,
          },
          '.provider-slot-north::after': {
            top: '100%',
            left: '50%',
            width: 1,
            height: 80,
          },
          '.provider-slot-west': {
            gridColumn: 1,
            gridRow: 2,
          },
          '.provider-slot-west::after': {
            top: '50%',
            left: '100%',
            width: 104,
            height: 1,
          },
          '.provider-slot-center': {
            gridColumn: 2,
            gridRow: 2,
          },
          '.provider-slot-east': {
            gridColumn: 3,
            gridRow: 2,
          },
          '.provider-slot-east::before': {
            top: '50%',
            right: '100%',
            width: 104,
            height: 1,
          },
          '.provider-slot-south': {
            gridColumn: 2,
            gridRow: 3,
          },
          '.provider-slot-south::before': {
            bottom: '100%',
            left: '50%',
            width: 1,
            height: 80,
          },
          '.provider-satellites': {
            position: 'relative',
            gridColumn: '1 / -1',
            gridRow: 4,
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 24,
          },
          '.provider-satellites::before': {
            content: '""',
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            width: 1,
            height: 80,
            backgroundColor:
              'color-mix(in srgb, var(--mui-palette-primary-main) 24%, var(--mui-palette-divider))',
          },
          '.provider-satellite-slot': {
            position: 'relative',
            zIndex: 1,
          },
          '.provider-satellite-slot::before': {
            content: '""',
            position: 'absolute',
            zIndex: -1,
            bottom: '100%',
            left: '50%',
            width: 1,
            height: 80,
            backgroundColor:
              'color-mix(in srgb, var(--mui-palette-primary-main) 24%, var(--mui-palette-divider))',
          },
          '.provider-card': {
            position: 'relative',
            zIndex: 1,
          },
          '.provider-node-header': {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          },
          '.provider-node-avatar': {
            width: 24,
            height: 24,
          },
          '.provider-card-hub': {
            borderColor:
              'color-mix(in srgb, var(--mui-palette-primary-main) 54%, var(--mui-palette-divider))',
            boxShadow: isDark
              ? '0 18px 48px rgba(0,0,0,0.42), 0 0 0 1px rgba(125,167,255,0.12)'
              : '0 14px 42px rgba(16,24,40,0.08), 0 0 0 1px rgba(53,110,243,0.10)',
          },
          '.provider-node-status': {
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: 'var(--mui-palette-success-main)',
            boxShadow:
              '0 0 0 8px color-mix(in srgb, var(--mui-palette-success-main) 20%, transparent)',
            animation: 'wasla-pulse 1.4s infinite',
          },
          '.entity-node-row': {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          },
          '.entity-node-label': {
            fontWeight: 600,
          },
          '.entity-node-instruction': {
            borderLeftColor: 'var(--mui-palette-info-main)',
          },
          '.entity-node-agent': {
            borderLeftColor: 'var(--mui-palette-warning-main)',
          },
          '.entity-node-skill': {
            borderLeftColor: 'var(--mui-palette-secondary-main)',
          },
          '.entity-node-mcp': {
            borderLeftColor: 'var(--mui-palette-success-main)',
          },
          '.floating-row': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          '.floating-inline': {
            display: 'flex',
            alignItems: 'center',
          },
          '.floating-chip-wrap': {
            display: 'flex',
            flexWrap: 'wrap',
            rowGap: 6,
          },
          '.provider-chip-wrap': {
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          },
          '.provider-groups': {
            gap: 14,
          },
          '.provider-group': {
            gap: 6,
          },
          '.provider-group-title': {
            color: 'var(--mui-palette-text-secondary)',
            letterSpacing: '0.1em',
            fontSize: 10,
            lineHeight: 1,
          },
          '.entity-content-preview': {
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 13,
          },
          '.loading-state': {
            alignItems: 'center',
          },
          '@keyframes wasla-pulse': {
            '0%': { transform: 'scale(1)', opacity: 1 },
            '50%': { transform: 'scale(1.15)', opacity: 0.6 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
        },
      },
      MuiCard: {
        variants: [
          {
            props: { variant: 'glassPanel' },
            style: {
              padding: 8,
              borderRadius: 16,
              backdropFilter: 'blur(18px)',
              backgroundColor: panelBg,
              border: `1px solid ${panelBorder}`,
              boxShadow: shadow,
            },
          },
          {
            props: { variant: 'glassPill' },
            style: {
              borderRadius: 999,
              padding: 6,
              backdropFilter: 'blur(18px)',
              backgroundColor: panelBgPill,
              border: `1px solid ${panelBorder}`,
            },
          },
          {
            props: { variant: 'providerNode' },
            style: {
              width: 336,
              minHeight: 188,
              borderRadius: 14,
              border: `1px solid ${panelBorder}`,
              backdropFilter: 'blur(20px)',
              backgroundColor: panelBg,
              boxShadow: shadow,
            },
          },
          {
            props: { variant: 'entityNode' },
            style: {
              minWidth: 190,
              padding: '8px 10px',
              borderLeftWidth: 4,
              borderLeftStyle: 'solid',
              borderRadius: 12,
              backdropFilter: 'blur(18px)',
              backgroundColor: panelBg,
              boxShadow: shadow,
            },
          },
          {
            props: { variant: 'hintPanel' },
            style: {
              padding: '8px 12px',
              borderRadius: 16,
              border: `1px solid ${panelBorder}`,
              backdropFilter: 'blur(18px)',
              backgroundColor: panelBg,
            },
          },
        ],
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            height: 26,
            borderRadius: 8,
            border: `1px solid ${panelBorder}`,
            backgroundColor: isDark
              ? 'color-mix(in srgb, var(--mui-palette-background-paper) 82%, white 3%)'
              : '#f7f7f8',
            '&.entity-chip': {
              cursor: 'grab',
            },
            '&.entity-chip:active': {
              cursor: 'grabbing',
            },
          },
          label: {
            paddingLeft: 9,
            paddingRight: 9,
            fontSize: 11,
            color: 'var(--mui-palette-text-secondary)',
          },
          deleteIcon: {
            fontSize: 15,
            marginRight: 4,
            color: 'var(--mui-palette-text-disabled)',
            '&:hover': {
              color: 'var(--mui-palette-error-main)',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.palette-toggle': {
              padding: 0,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}
