import { Theme } from '@mui/material';
import { SxProps, SystemStyleObject } from '@mui/system';
import { EnteButtonProps } from '.';

type ButtonVariantsProps = {
    [key in EnteButtonProps['type']]:
        | Partial<
              {
                  [key in EnteButtonProps['state']]: SystemStyleObject<Theme>;
              }
          >
        | Partial<{ default: SystemStyleObject<Theme> }>;
};

type ButtonVariantsPropsOverrides = Partial<
    {
        [key in EnteButtonProps['type'] | 'common']: Partial<
            {
                [key in
                    | EnteButtonProps['state']
                    | 'common']: SystemStyleObject<Theme>;
            }
        >;
    }
>;

const BUTTON_VARIANT_SX_PROPS = ({ colors }: Theme): ButtonVariantsProps => {
    return {
        primary: {
            default: {
                color: colors.white.base,
                backgroundColor: colors.primary[500],
            },
            hover: {
                backgroundColor: colors.primary[700],
                borderColor: colors.primary[500],
            },
            pressed: {
                backgroundColor: colors.primary[700],
            },
            disabled: {
                backgroundColor: colors.fill.muted,
                color: colors.text.faint,
            },
        },
        secondary: {
            default: {
                backgroundColor: colors.fill.faint,
                color: colors.text.base,
            },
            hover: {
                backgroundColor: colors.fill.faintPressed,
                borderColor: colors.stroke.fainter,
            },
            pressed: {
                backgroundColor: colors.fill.faintPressed,
            },
            disabled: {
                backgroundColor: colors.fill.faint,
                color: colors.text.faint,
            },
        },
        neutral: {
            default: {
                backgroundColor: colors.fill.base,
                color: colors.text.base,
            },
            hover: {
                backgroundColor: colors.fill.basePressed,
                borderColor: colors.stroke.base,
            },
            pressed: {
                backgroundColor: colors.fill.basePressed,
            },
            disabled: {
                backgroundColor: colors.fill.muted,
                color: colors.text.faint,
            },
        },
        tertiary: {
            default: {
                backgroundColor: 'transparent',
                color: colors.text.base,
            },
            hover: {
                color: colors.fill.basePressed,
            },
            pressed: {
                color: colors.fill.basePressed,
            },
            disabled: {
                color: colors.text.faint,
            },
        },
        critical: {
            default: {
                backgroundColor: colors.warning[700],
                color: colors.white.base,
            },
            hover: {
                backgroundColor: colors.warning[800],
                borderColor: colors.warning[500],
            },
            pressed: {
                backgroundColor: colors.warning[800],
            },
            disabled: {
                backgroundColor: colors.fill.muted,
                color: colors.text.faint,
            },
        },
        tertiaryCritical: {
            default: {
                backgroundColor: 'transparent',
                color: colors.warning[500],
            },
            hover: {
                color: colors.warning[700],
            },
            pressed: {
                color: colors.warning[700],
            },
            disabled: {
                color: colors.text.faint,
            },
        },
    };
};

const LARGE_BUTTON_VARIANT_SX_PROPS_OVERRIDES = ({
    colors,
}: Theme): ButtonVariantsPropsOverrides => {
    return {
        primary: {
            disabled: {
                backgroundColor: colors.fill.faint,
                color: colors.text.faint,
            },
        },
        neutral: {
            disabled: {
                backgroundColor: colors.fill.faint,
                color: colors.text.faint,
            },
        },
        critical: {
            disabled: {
                backgroundColor: colors.fill.faint,
                color: colors.text.faint,
            },
        },
        tertiaryCritical: {
            common: {
                borderColor: colors.warning[500],
            },
            pressed: {
                borderColor: colors.warning[700],
            },
            disabled: {
                borderColor: colors.stroke.muted,
                color: colors.text.faint,
            },
        },
    };
};

const TRAILING_ICON_BUTTON_VARIANT_SX_PROPS_OVERRIDES: ButtonVariantsPropsOverrides =
    {
        common: {
            default: {
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
            },
        },
    };

export const getButtonSxProps =
    (options: {
        type: EnteButtonProps['type'];
        state: EnteButtonProps['state'];
        size: EnteButtonProps['size'];
        trailingIcon: EnteButtonProps['trailingIcon'];
    }): SxProps<Theme> =>
    (theme) => {
        const { type, state, size, trailingIcon } = options;
        const baseProps = BUTTON_VARIANT_SX_PROPS(theme);
        const largeButtonProps = LARGE_BUTTON_VARIANT_SX_PROPS_OVERRIDES(theme);
        const buttonVariantSxProps = {
            ...baseProps[type][state],
            ...baseProps[type].default,
            ...baseProps,
            ...(size === 'large'
                ? {
                      ...largeButtonProps[type][state],
                      ...largeButtonProps[type].default,
                      ...largeButtonProps.common,
                  }
                : undefined),
            ...(trailingIcon
                ? TRAILING_ICON_BUTTON_VARIANT_SX_PROPS_OVERRIDES.common.default
                : undefined),
        };
        return buttonVariantSxProps;
    };
