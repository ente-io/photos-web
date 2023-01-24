import { createTheme, EnteBasePaletteOptions } from '@mui/material';
import { THEME_COLOR } from 'constants/theme';
import { components } from './components';
import darkThemePalette from './darkPalette';
import lightThemeOptions from './lightPalette';
import { typography } from './typography';

export const getPallette = (
    themeColor: THEME_COLOR
): EnteBasePaletteOptions => {
    switch (themeColor) {
        case THEME_COLOR.DARK:
            return darkThemePalette;
        case THEME_COLOR.LIGHT:
            return lightThemeOptions;
        default:
            Error('Theme color not found');
    }
};

export const getTheme = (themeColor: THEME_COLOR) => {
    const palette = getPallette(themeColor);
    const theme = createTheme({
        entePalette: palette,
        components,
        typography,
    });
    return theme;
};
