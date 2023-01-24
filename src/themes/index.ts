import { createTheme, PaletteOptions } from '@mui/material';
import { THEME_COLOR } from 'constants/theme';
import { components } from './components';
import darkThemePalette from './darkThemeOptions';
import lightThemeOptions from './lightThemeOptions';
import { typography } from './typography';

export const getPlalette = (themeColor: THEME_COLOR): PaletteOptions => {
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
    const palette = getPlalette(themeColor);
    const theme = createTheme({
        palette,
        components,
        typography,
    });
    return theme;
};
