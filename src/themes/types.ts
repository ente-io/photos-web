import { PaletteColor, TypeText } from '@mui/material';

declare module '@mui/material/styles' {
    interface TypeBackground {
        overPaper?: string;
    }

    interface Strength {
        base: string;
        muted: string;
        faint: string;
    }

    interface FixedColor {
        white: string;
        black: string;
        strokeMutedWhite: string;
    }
    interface Theme {
        entePalette: EntePalette;
    }
    interface ThemeOptions {
        entePalette?: EntePaletteOptions;
    }
    interface EntePalette {
        text: Strength;
        accent: PaletteColor;
        fill: PaletteColor;
        backdrop: PaletteColor;
        blur: Strength;
        danger: PaletteColor;
        stroke: TypeText;
        fixed: FixedColor;
    }

    interface EntePaletteOptions {
        text?: Partial<Strength>;
        accent?: Partial<PaletteColor>;
        fill?: Partial<PaletteColor>;
        backdrop?: Partial<PaletteColor>;
        blur?: Partial<Strength>;
        danger?: Partial<PaletteColor>;
        stroke?: Partial<TypeText>;
        fixed?: Partial<FixedColor>;
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
export {};
