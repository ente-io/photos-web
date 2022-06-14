import { Checkbox, FormControlLabel } from '@mui/material';
import React from 'react';

interface Iprops {
    loading?: boolean;
    value: boolean;
    onChange: (v: boolean) => void;
    label: any;
}
export function EnteCheckbox({ loading, value, onChange, label }: Iprops) {
    const handleChange: any = (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.checked);
    return (
        <FormControlLabel
            sx={{
                color: 'text.secondary',
                ml: -1,
                mt: 2,
            }}
            control={
                <Checkbox
                    size="small"
                    disabled={loading}
                    checked={value}
                    onChange={handleChange}
                    color="accent"
                />
            }
            label={label}
        />
    );
}
