import Button, { ButtonProps } from '@mui/material/Button';
import {
    BUTTON_VARIANT_SX_PROPS,
    LARGE_BUTTON_VARIANT_SX_PROPS_OVERRIDES,
    TRAILING_ICON_BUTTON_VARIANT_SX_PROPS_OVERRIDES,
} from './constant';

export interface EnteButtonProps extends Omit<ButtonProps, 'type' | 'size'> {
    state: 'default' | 'hover' | 'pressed' | 'disabled' | 'loading' | 'success';
    type:
        | 'primary'
        | 'secondary'
        | 'neutral'
        | 'tertiary'
        | 'critical'
        | 'tertiaryCritical';

    size: 'small' | 'large';
    trailingIcon?: boolean;
}

const EnteButton: React.FC<EnteButtonProps> = (props) => {
    const { state, type, size, trailingIcon, ...otherProps } = props;

    const buttonVariantSxProps = {
        ...BUTTON_VARIANT_SX_PROPS[type][state],
        ...(size === 'large'
            ? LARGE_BUTTON_VARIANT_SX_PROPS_OVERRIDES[type][state]
            : undefined),
        ...(trailingIcon
            ? TRAILING_ICON_BUTTON_VARIANT_SX_PROPS_OVERRIDES.common.default
            : undefined),
    };

    return <Button sx={buttonVariantSxProps} {...otherProps} />;
};

export default EnteButton;
