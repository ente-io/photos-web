import { SxProps, Theme } from '@mui/material';
import { MenuItemProps } from '@mui/material/MenuItem';

export interface OverflowMenuOptionProps extends MenuItemProps {
    state: 'default' | 'pressed';
    type: 'primary' | 'critical' | 'option';
}

export const getOverflowMenuOptionSxProps =
    (
        options: Partial<{
            type: OverflowMenuOptionProps['type'];
            state: OverflowMenuOptionProps['state'];
        }>
    ): SxProps<Theme> =>
    ({ colors }) => {
        const { type = 'primary', state = 'default' } = options;
        const sxProps = {
            common: {
                width: 180,
                padding: 1.5,
                '& .MuiSvgIcon-root': {
                    fontSize: '20px',
                },
            },
            primary: {
                default: {
                    color: colors.text.base,
                },
                pressed: {
                    backgroundColor: colors.fill.faint,
                },
            },
            critical: {
                default: {
                    color: colors.warning[500],
                    backgroundColor: colors.warning[800],
                },
            },
            option: {
                default: {
                    color: colors.text.base,
                },
                pressed: {
                    backgroundColor: colors.fill.faint,
                },
            },
        };

        return {
            ...sxProps[type][state],
            ...sxProps[type].default,
            ...sxProps.common,
        };
    };
