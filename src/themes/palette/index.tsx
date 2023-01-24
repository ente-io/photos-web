import { EnteBasePaletteOptions } from '@mui/material';
import { THEME_COLOR } from 'constants/theme';
import darkThemePalette from 'themes/palette/dark';
import lightThemePalette from 'themes/palette/light';

export const getPallette = (
    themeColor: THEME_COLOR
): EnteBasePaletteOptions => {
    switch (themeColor) {
        case THEME_COLOR.DARK:
            return darkThemePalette;
        case THEME_COLOR.LIGHT:
            return lightThemePalette;
        default:
            Error('Theme color not found');
    }
};
