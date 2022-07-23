/* eslint-disable @typescript-eslint/no-unused-vars */
import { Formik, FormikHelpers } from 'formik';
import React, { FC, useRef, useState } from 'react';
import OtpInput from 'react-otp-input';
import constants from 'utils/strings/constants';
import SubmitButton from 'components/SubmitButton';
import VerticallyCentered, { CenteredFlex } from 'components/Container';
import { Box, Typography, TypographyProps } from '@mui/material';
import InvalidInputMessage from './InvalidInputMessage';
import { sleep } from 'utils/common';

interface formValues {
    otp: string;
}
interface Props {
    onSubmit: VerifyTwoFactorCallback;
    buttonText: string;
}

export type VerifyTwoFactorCallback = (
    otp: string,
    markSuccessful: () => Promise<void>
) => Promise<void>;

export default function VerifyTwoFactor(props: Props) {
    const [waiting, setWaiting] = useState(false);
    const otpInputRef = useRef(null);
    const [success, setSuccess] = useState(false);

    const markSuccessful = async () => {
        setWaiting(false);
        setSuccess(true);
        await sleep(1000);
    };

    const submitForm = async (
        { otp }: formValues,
        { setFieldError, resetForm }: FormikHelpers<formValues>
    ) => {
        try {
            setWaiting(true);
            await props.onSubmit(otp, markSuccessful);
        } catch (e) {
            resetForm();
            for (let i = 0; i < 6; i++) {
                otpInputRef.current?.focusPrevInput();
            }
            setFieldError('otp', `${constants.UNKNOWN_ERROR} ${e.message}`);
        }
        setWaiting(false);
    };

    const onChange =
        (callback: Function, triggerSubmit: Function) => (otp: string) => {
            callback(otp);
            if (otp.length === 6) {
                triggerSubmit(otp);
            }
        };
    return (
        <Formik<formValues>
            initialValues={{ otp: '' }}
            validateOnChange={false}
            validateOnBlur={false}
            onSubmit={submitForm}>
            {({ values, errors, handleChange, handleSubmit, submitForm }) => (
                <VerticallyCentered>
                    <form noValidate onSubmit={handleSubmit}>
                        <Typography
                            mb={2}
                            variant="body2"
                            color="text.secondary">
                            {constants.ENTER_TWO_FACTOR_OTP}
                        </Typography>
                        <Box my={2}>
                            <OtpInput
                                ref={otpInputRef}
                                shouldAutoFocus
                                value={values.otp}
                                onChange={onChange(
                                    handleChange('otp'),
                                    submitForm
                                )}
                                numInputs={6}
                                separator={'-'}
                                isInputNum
                                className={'otp-input'}
                            />
                            {errors.otp && (
                                <CenteredFlex sx={{ mt: 1 }}>
                                    <InvalidInputMessage>
                                        {constants.INCORRECT_CODE}
                                    </InvalidInputMessage>
                                </CenteredFlex>
                            )}
                        </Box>
                        <SubmitButton
                            buttonText={props.buttonText}
                            loading={waiting}
                            success={success}
                            disabled={values.otp.length < 6}
                        />
                    </form>
                </VerticallyCentered>
            )}
        </Formik>
    );
}
