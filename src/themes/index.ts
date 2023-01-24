import { createTheme } from '@mui/material';
import { THEME_COLOR } from 'constants/theme';
import { components } from './components';
import { getColorPallette } from './palette';
import { typography } from './typography';

export const getTheme = (themeColor: THEME_COLOR) => {
    const palette = getColorPallette(themeColor);
    const theme = createTheme({
        colors: palette,
        components,
        typography,
    });
    return theme;
};
