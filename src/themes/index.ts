import { createTheme } from '@mui/material';
import { THEME_COLOR } from 'constants/theme';
import { components } from './components';
import { getPallette } from './palette';
import { typography } from './typography';

export const getTheme = (themeColor: THEME_COLOR) => {
    const palette = getPallette(themeColor);
    const theme = createTheme({
        entePalette: palette,
        components,
        typography,
    });
    return theme;
};
