import { PaletteMode } from '@mui/material';

declare module '@mui/material/styles' {
    interface Theme {
        entePalette: EntePalette;
    }
    interface ThemeOptions {
        entePalette?: EntePaletteOptions;
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
    interface EntePalette extends EnteBasePalette {
        mode: PaletteMode;
        background: Background;
        backdrop: Strength;
        text: Strength;
        fill: FillStrength;
        stroke: StrokeStrength;
        shadows: Shadows;
    }

    interface EntePaletteOptions extends EnteBasePaletteOptions {
        mode?: Partial<PaletteMode>;
        background?: Partial<Background>;
        backdrop?: Partial<Strength>;
        text?: Partial<Strength>;
        fill?: Partial<FillStrength>;
        stroke?: Partial<StrokeStrength>;
        shadows?: ShadowsOptions;
    }

    interface EnteBasePalette {
        primary: EnteColorPartial;
        warning: EnteColorPartial;
        caution: EnteColorPartial;
        blur: BlurStrength;
        white: Strength;
        black: string;
    }

    interface EnteBasePaletteOptions {
        primary?: Partial<EnteColorPartial>;
        warning?: Partial<EnteColorPartial>;
        caution?: Partial<EnteColorPartial>;
        blur?: Partial<BlurStrength>;
        white?: Partial<Strength>;
        black?: string;
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
        float: Shadow;
        menu: Shadow;
        Button: Shadow;
    }

    interface ShadowsOptions {
        float?: Array<Partial<Shadow>>;
        menu?: Array<Partial<Shadow>>;
        button?: Array<Partial<Shadow>>;
    }

    interface Shadow {
        y: number;
        blur: number;
        color: string;
    }

    interface EnteColorPartial {
        800: string;
        700: string;
        500: string;
        400: string;
        300: string;
    }

    interface BlurStrength {
        base: number;
        muted: number;
        faint: number;
    }
}
export {};
