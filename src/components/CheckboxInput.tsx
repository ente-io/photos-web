import {
    FormControlLabel,
    Checkbox,
    FormGroup,
    Typography,
    TypographyTypeMap,
} from '@mui/material';

interface Iprops {
    disabled?: boolean;
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    labelProps?: TypographyTypeMap['props'];
}
export function CheckboxInput({
    disabled,
    checked,
    onChange,
    label,
    labelProps,
}: Iprops) {
    return (
        <FormGroup sx={{ width: '100%' }}>
            <FormControlLabel
                control={
                    <Checkbox
                        size="small"
                        disabled={disabled}
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        color="accent"
                    />
                }
                label={
                    <Typography color="text.secondary" {...labelProps}>
                        {label}
                    </Typography>
                }
            />
        </FormGroup>
    );
}
