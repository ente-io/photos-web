import React, { useMemo, useState } from 'react';
import constants from 'utils/strings/constants';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import SubmitButton from './SubmitButton';
import TextField from '@mui/material/TextField';
import ShowHidePassword from './Form/ShowHidePassword';
import { FlexWrapper } from './Container';
import { FormHelperText } from '@mui/material';
import EnteButton from './EnteButton';

interface formValues {
    inputValue: string;
}
export interface SingleInputFormProps {
    callback: (
        inputValue: string,
        setFieldError: (errorMessage: string) => void
    ) => Promise<void>;
    fieldType: 'text' | 'email' | 'password';
    placeholder: string;
    buttonText: string;
    submitButtonProps?: any;
    initialValue?: string;
    secondaryButtonAction?: () => void;
    disableAutoFocus?: boolean;
    hiddenPreInput?: any;
    caption?: any;
    hiddenPostInput?: any;
    autoComplete?: string;
    blockButton?: boolean;
    hiddenLabel?: boolean;
}

export default function SingleInputForm(props: SingleInputFormProps) {
    const { submitButtonProps } = props;
    const { sx: buttonSx, ...restSubmitButtonProps } = submitButtonProps ?? {};

    const [loading, SetLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const submitForm = async (
        values: formValues,
        { setFieldError }: FormikHelpers<formValues>
    ) => {
        SetLoading(true);
        await props.callback(values.inputValue, (message) =>
            setFieldError('inputValue', message)
        );
        SetLoading(false);
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        event.preventDefault();
    };

    const validationSchema = useMemo(() => {
        switch (props.fieldType) {
            case 'text':
                return Yup.object().shape({
                    inputValue: Yup.string().required(constants.REQUIRED),
                });
            case 'password':
                return Yup.object().shape({
                    inputValue: Yup.string().required(constants.REQUIRED),
                });
            case 'email':
                return Yup.object().shape({
                    inputValue: Yup.string()
                        .email(constants.EMAIL_ERROR)
                        .required(constants.REQUIRED),
                });
        }
    }, [props.fieldType]);

    return (
        <Formik<formValues>
            initialValues={{ inputValue: props.initialValue ?? '' }}
            onSubmit={submitForm}
            validationSchema={validationSchema}
            validateOnChange={false}
            validateOnBlur={false}>
            {({ values, errors, handleChange, handleSubmit }) => (
                <form noValidate onSubmit={handleSubmit}>
                    {props.hiddenPreInput}
                    <TextField
                        hiddenLabel={props.hiddenLabel}
                        variant="filled"
                        fullWidth
                        type={showPassword ? 'text' : props.fieldType}
                        id={props.fieldType}
                        name={props.fieldType}
                        {...(props.hiddenLabel
                            ? { placeholder: props.placeholder }
                            : { label: props.placeholder })}
                        value={values.inputValue}
                        onChange={handleChange('inputValue')}
                        error={Boolean(errors.inputValue)}
                        helperText={errors.inputValue}
                        disabled={loading}
                        autoFocus={!props.disableAutoFocus}
                        autoComplete={props.autoComplete}
                        InputProps={{
                            endAdornment: props.fieldType === 'password' && (
                                <ShowHidePassword
                                    showPassword={showPassword}
                                    handleClickShowPassword={
                                        handleClickShowPassword
                                    }
                                    handleMouseDownPassword={
                                        handleMouseDownPassword
                                    }
                                />
                            ),
                        }}
                    />
                    <FormHelperText
                        sx={{
                            position: 'relative',
                            top: errors.inputValue ? '-22px' : '0',
                            float: 'right',
                            padding: '0 8px',
                        }}>
                        {props.caption}
                    </FormHelperText>
                    {props.hiddenPostInput}
                    <FlexWrapper
                        justifyContent={'flex-end'}
                        flexWrap={
                            props.blockButton ? 'wrap-reverse' : 'nowrap'
                        }>
                        {props.secondaryButtonAction && (
                            <EnteButton
                                onClick={props.secondaryButtonAction}
                                size="large"
                                variant="secondary"
                                sx={{
                                    '&&&': {
                                        mt: !props.blockButton ? 2 : 0.5,
                                        mb: !props.blockButton ? 4 : 0,
                                        mr: !props.blockButton ? 1 : 0,
                                        ...buttonSx,
                                    },
                                }}
                                {...restSubmitButtonProps}>
                                {constants.CANCEL}
                            </EnteButton>
                        )}
                        <SubmitButton
                            sx={{
                                '&&&': {
                                    mt: 2,
                                    ...buttonSx,
                                },
                            }}
                            buttonText={props.buttonText}
                            loading={loading}
                            {...restSubmitButtonProps}
                        />
                    </FlexWrapper>
                </form>
            )}
        </Formik>
    );
}
