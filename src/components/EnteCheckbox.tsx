import { Checkbox, FormControlLabel } from '@mui/material';
import React from 'react';

export function EnteCheckbox({ loading, checked, onChange, label }) {
    const handleChange: any = (e) => onChange(e.target.checked);
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
                    checked={checked}
                    onChange={handleChange}
                    color="accent"
                />
            }
            label={label}
        />
    );
}
