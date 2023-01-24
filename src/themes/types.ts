import { PaletteMode } from '@mui/material';

declare module '@mui/material/styles' {
    interface Theme {
        colors: ColorPalette;
    }
    interface ThemeOptions {
        colors?: ColorPalette;
    }
    interface TypographyVariants {
        title: React.CSSProperties;
        subtitle: React.CSSProperties;
        mini: React.CSSProperties;
    }
    interface TypographyVariantsOptions {
        title?: React.CSSProperties;
        subtitle?: React.CSSProperties;
        mini?: React.CSSProperties;
    }
}

declare module '@mui/material/Button' {
    export interface ButtonPropsColorOverrides {
        accent: true;
        danger: true;
    }
}
declare module '@mui/material/Checkbox' {
    export interface CheckboxPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        title: true;
        subtitle: true;
    }
}

declare module '@mui/material/Switch' {
    interface SwitchPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/SvgIcon' {
    interface SvgIconPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/Alert' {
    export interface AlertPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/CircularProgress' {
    export interface CircularProgressPropsColorOverrides {
        accent: true;
    }
}

// =================================================
// Custom Interfaces
// =================================================

declare module '@mui/material/styles' {
    interface ColorPalette extends BaseColorPalette {
        mode: PaletteMode;
        background: Background;
        backdrop: Strength;
        text: Strength;
        fill: FillStrength;
        stroke: StrokeStrength;
        shadows: Shadows;
    }

    interface BaseColorPalette {
        primary: PrimaryColor;
        warning: WarningColor;
        caution: CautionColor;
        blur: BlurStrength;
        white: Omit<Strength, 'faint'>;
        black: string;
    }

    interface Background {
        base: string;
        elevated: string;
        elevated2: string;
    }

    interface Strength {
        base: string;
        muted: string;
        faint: string;
    }

    type FillStrength = Strength & StrengthFillPressed & StrengthFillStrong;

    interface StrengthFillPressed {
        basePressed: string;
        faintPressed: string;
    }

    interface StrengthFillStrong {
        strong: string;
    }

    type StrokeStrength = Strength & StrengthExtras;

    interface StrengthExtras {
        fainter: string;
    }

    interface Shadows {
        float: Shadow[];
        menu: Shadow[];
        button: Shadow[];
    }

    interface Shadow {
        y: number;
        blur: number;
        color: string;
    }

    interface PrimaryColor {
        700: string;
        500: string;
        400: string;
        300: string;
    }

    interface WarningColor {
        800: string;
        700: string;
        500: string;
        400: string;
    }

    interface CautionColor {
        500: string;
    }

    interface BlurStrength {
        base: number;
        muted: number;
        faint: number;
    }
}
export {};
