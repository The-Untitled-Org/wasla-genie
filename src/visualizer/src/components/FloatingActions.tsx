import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import { Card, IconButton, Stack, Tooltip } from '@mui/material';

interface FloatingActionsProps {
  isDark: boolean;
  connected: boolean;
  onToggleTheme: () => void;
  onRefresh: () => void;
  onShutdown: () => void;
}

export function FloatingActions(props: FloatingActionsProps) {
  const { isDark, connected, onToggleTheme, onRefresh, onShutdown } = props;

  return (
    <Card variant="glassPill" sx={{ position: 'absolute', top: 20, right: 20, zIndex: 12 }}>
      <Stack direction="row" spacing={1}>
        <Tooltip title={connected ? 'Connected to Local System' : 'Disconnected'}>
          <IconButton color={connected ? 'success' : 'default'} size="small">
            <SyncRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton size="small" onClick={onToggleTheme}>
            {isDark ? (
              <LightModeRoundedIcon fontSize="small" />
            ) : (
              <DarkModeRoundedIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Close Visualizer">
          <IconButton size="small" color="error" onClick={onShutdown}>
            <PowerSettingsNewRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reload canvas config">
          <IconButton size="small" onClick={onRefresh}>
            <SyncRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Card>
  );
}
