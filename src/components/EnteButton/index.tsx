import Button, { ButtonProps } from '@mui/material/Button';
import { getButtonSxProps } from './constant';

export interface EnteButtonProps
    extends Omit<ButtonProps, 'size' | 'color' | 'variant'> {
    state?:
        | 'default'
        | 'hover'
        | 'pressed'
        | 'disabled'
        | 'loading'
        | 'success';
    variant?:
        | 'primary'
        | 'secondary'
        | 'neutral'
        | 'tertiary'
        | 'critical'
        | 'tertiaryCritical';

    size?: 'small' | 'large';
    trailingIcon?: boolean;
}

const EnteButton: React.FC<EnteButtonProps> = (props) => {
    const {
        state = 'default',
        variant = 'primary',
        size = 'small',
        trailingIcon = false,
        ...otherProps
    } = props;

    const buttonVariantSxProps = getButtonSxProps({
        size,
        state,
        variant,
        trailingIcon,
    });

    return <Button sx={buttonVariantSxProps} {...otherProps} />;
};

export default EnteButton;
