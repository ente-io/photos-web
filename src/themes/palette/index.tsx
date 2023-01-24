import { ColorPalette } from '@mui/material/styles';
import { THEME_COLOR } from 'constants/theme';
import darkThemePalette from 'themes/palette/dark';
import lightThemePalette from 'themes/palette/light';
import baseColorPalette from './base';

export const getColorPallette = (themeColor: THEME_COLOR): ColorPalette => {
    switch (themeColor) {
        case THEME_COLOR.DARK:
            return { ...baseColorPalette, ...darkThemePalette };
        case THEME_COLOR.LIGHT:
            return { ...baseColorPalette, ...lightThemePalette };
        default:
            Error('Theme color not found');
    }
};
