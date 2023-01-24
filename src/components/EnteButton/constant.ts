import { ButtonProps } from '@mui/material';
import { EnteButtonProps } from '.';

type ButtonVariantsProps = {
    [key in EnteButtonProps['type']]:
        | Partial<
              {
                  [key in EnteButtonProps['state']]: ButtonProps['sx'];
              }
          >
        | Partial<{ default: ButtonProps['sx'] }>;
};

type ButtonVariantsPropsOverrides = Partial<
    {
        [key in EnteButtonProps['type'] | 'common']: Partial<
            {
                [key in EnteButtonProps['state'] | 'common']: ButtonProps['sx'];
            }
        >;
    }
>;

export const BUTTON_VARIANT_SX_PROPS: ButtonVariantsProps = {
    primary: {
        default: {
            color: 'fixed.white.base',
            backgroundColor: 'primary.500',
        },
        hover: {
            backgroundColor: 'primary.700',
            borderColor: 'primary.500',
        },
        pressed: {
            backgroundColor: 'primary.700',
        },
        disabled: {
            backgroundColor: 'fill.muted',
            color: 'text.faint',
        },
    },
    secondary: {
        default: {
            backgroundColor: 'fill.faint',
            color: 'text.base',
        },
        hover: {
            backgroundColor: 'fill.faintPressed',
            borderColor: 'stroke.fainter',
        },
        pressed: {
            backgroundColor: 'fill.faintPressed',
        },
        disabled: {
            backgroundColor: 'fill.faint',
            color: 'text.faint',
        },
    },
    neutral: {
        default: {
            backgroundColor: 'fill.base',
            color: 'text.base',
        },
        hover: {
            backgroundColor: 'fill.basePressed',
            borderColor: 'stroke.base',
        },
        pressed: {
            backgroundColor: 'fill.basePressed',
        },
        disabled: {
            backgroundColor: 'fill.muted',
            color: 'text.faint',
        },
    },
    tertiary: {
        default: {
            backgroundColor: 'transparent',
            color: 'text.base',
        },
        hover: {
            color: 'text.basedPressed',
        },
        pressed: {
            color: 'text.basedPressed',
        },
        disabled: {
            color: 'text.faint',
        },
    },
    critical: {
        default: {
            backgroundColor: 'warning.700',
            color: 'fixed.white.base',
        },
        hover: {
            backgroundColor: 'warning.800',
            borderColor: 'warning.500',
        },
        pressed: {
            backgroundColor: 'warning.800',
        },
        disabled: {
            backgroundColor: 'fill.muted',
            color: 'text.faint',
        },
    },
    tertiaryCritical: {
        default: {
            backgroundColor: 'transparent',
            color: 'warning.500',
        },
        hover: {
            color: 'warning.700',
        },
        pressed: {
            color: 'warning.700',
        },
        disabled: {
            color: 'text.faint',
        },
    },
};

export const LARGE_BUTTON_VARIANT_SX_PROPS_OVERRIDES: ButtonVariantsPropsOverrides =
    {
        primary: {
            disabled: {
                backgroundColor: 'fill.faint',
                color: 'text.faint',
            },
        },
        neutral: {
            disabled: {
                backgroundColor: 'fill.faint',
                color: 'text.faint',
            },
        },
        critical: {
            disabled: {
                backgroundColor: 'fill.faint',
                color: 'text.faint',
            },
        },
        tertiaryCritical: {
            common: {
                borderColor: 'warning.500',
            },
            pressed: {
                borderColor: 'warning.700',
            },
            disabled: {
                borderColor: 'stroke.muted',
                color: 'text.faint',
            },
        },
    };

export const TRAILING_ICON_BUTTON_VARIANT_SX_PROPS_OVERRIDES: ButtonVariantsPropsOverrides =
    {
        common: {
            default: {
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
            },
        },
    };
