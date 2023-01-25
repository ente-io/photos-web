import Button, { ButtonProps } from '@mui/material/Button';
import { getButtonSxProps } from './constant';

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

    const buttonVariantSxProps = getButtonSxProps({
        size,
        state,
        type,
        trailingIcon,
    });

    return <Button sx={buttonVariantSxProps} {...otherProps} />;
};

export default EnteButton;
