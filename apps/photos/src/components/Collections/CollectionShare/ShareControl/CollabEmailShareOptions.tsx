import React, { useEffect, useMemo, useState } from 'react';
import { Formik, FormikHelpers, FormikState } from 'formik';
import * as Yup from 'yup';
import SubmitButton from 'components/SubmitButton';
import TextField from '@mui/material/TextField';
import { FlexWrapper } from 'components/Container';
import { Button, FormHelperText, Stack } from '@mui/material';
import { t } from 'i18next';
import { MenuItemGroup } from 'components/Menu/MenuItemGroup';
import { EnteMenuItem } from 'components/Menu/EnteMenuItem';
import MenuItemDivider from 'components/Menu/MenuItemDivider';
import MenuSectionTitle from 'components/Menu/MenuSectionTitle';
import AvatarCollectionShare from '../AvatarCollectionShare';
import DoneIcon from '@mui/icons-material/Done';

interface formValues {
    inputValue: string;
    selectedOptions: string[];
}

export interface CollabEmailShareOptionsProps {
    callback: (
        inputValue: string[],
        setFieldError: (errorMessage: string) => void,
        resetForm: (nextState?: Partial<FormikState<formValues>>) => void
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
    optionsList?: string[];
    onClose?: () => void;
}

export default function CollabEmailShareOptions(
    props: CollabEmailShareOptionsProps
) {
    console.log('OptionList Intial', props.optionsList);
    const { submitButtonProps } = props;
    const { sx: buttonSx, ...restSubmitButtonProps } = submitButtonProps ?? {};
    const [updatedOptionsList, setUpdatedOptionsList] = useState<string[]>(
        props.optionsList
    );
    const [disableInput, setDisableInput] = useState(false);
    console.log('updatedOptionsList list:', updatedOptionsList);

    const [loading, SetLoading] = useState(false);

    useEffect(() => {
        setUpdatedOptionsList(props.optionsList);
    }, [props.optionsList]);

    const submitForm = async (
        values: formValues,
        { setFieldError, resetForm }: FormikHelpers<formValues>
    ) => {
        SetLoading(true);

        if (values.inputValue !== '') {
            await props.callback(
                [values.inputValue],
                (message) => setFieldError('inputValue', message),
                resetForm
            );
        } else if (values.selectedOptions.length !== 0) {
            await props.callback(
                values.selectedOptions,
                (message) => setFieldError('inputValue', message),
                resetForm
            );
        }

        setDisableInput(false);
        SetLoading(false);
        props.onClose();
    };

    const validationSchema = useMemo(() => {
        switch (props.fieldType) {
            case 'text':
                return Yup.object().shape({
                    inputValue: Yup.string().required(t('REQUIRED')),
                });
            case 'email':
                return Yup.object().shape({
                    inputValue: Yup.string().email(t('EMAIL_ERROR')),
                });
        }
    }, [props.fieldType]);

    const handleInputFieldClick = (setFieldValue) => {
        setFieldValue('selectedOptions', []);
    };

    return (
        <Formik<formValues>
            initialValues={{
                inputValue: props.initialValue ?? '',
                selectedOptions: [],
            }}
            onSubmit={submitForm}
            validationSchema={validationSchema}
            validateOnChange={false}
            validateOnBlur={false}>
            {({
                values,
                errors,
                handleChange,
                handleSubmit,
                setFieldValue,
            }) => (
                <form noValidate onSubmit={handleSubmit}>
                    {props.hiddenPreInput}

                    <TextField
                        hiddenLabel={props.hiddenLabel}
                        fullWidth
                        type={props.fieldType}
                        id={props.fieldType}
                        onChange={handleChange('inputValue')}
                        onClick={() => handleInputFieldClick(setFieldValue)}
                        name={props.fieldType}
                        {...(props.hiddenLabel
                            ? { placeholder: props.placeholder }
                            : { label: props.placeholder })}
                        error={Boolean(errors.inputValue)}
                        helperText={errors.inputValue}
                        value={values.inputValue}
                        disabled={loading || disableInput}
                        autoFocus={!props.disableAutoFocus}
                        autoComplete={props.autoComplete}
                    />

                    <Stack py={'10px'} px={'8px'}>
                        {' '}
                    </Stack>
                    <MenuSectionTitle title={t('OR_ADD_EXISTING')} />

                    <MenuItemGroup>
                        {updatedOptionsList.map((item, index) => (
                            <>
                                <EnteMenuItem
                                    fontWeight="normal"
                                    key={item}
                                    onClick={() => {
                                        if (
                                            values.selectedOptions.includes(
                                                item
                                            )
                                        ) {
                                            setFieldValue(
                                                'selectedOptions',
                                                values.selectedOptions.filter(
                                                    (selectedOption) =>
                                                        selectedOption !== item
                                                )
                                            );
                                        } else {
                                            setFieldValue('selectedOptions', [
                                                ...values.selectedOptions,
                                                item,
                                            ]);
                                        }
                                    }}
                                    label={item}
                                    startIcon={
                                        <AvatarCollectionShare email={item} />
                                    }
                                    endIcon={
                                        values.selectedOptions.includes(
                                            item
                                        ) ? (
                                            <DoneIcon />
                                        ) : null
                                    }
                                />
                                {index !== props.optionsList.length - 1 && (
                                    <MenuItemDivider />
                                )}
                            </>
                        ))}
                    </MenuItemGroup>

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

                    <Stack py={'20px'} px={'8px'} spacing={'8px'}>
                        {' '}
                    </Stack>

                    <MenuSectionTitle
                        title={t(
                            'Collaborators can add photos and videos to the shared album.'
                        )}
                    />
                    <Stack py={'5px'} px={'8px'}>
                        {' '}
                    </Stack>

                    <FlexWrapper
                        justifyContent={'center'}
                        flexWrap={
                            props.blockButton ? 'wrap-reverse' : 'nowrap'
                        }>
                        {props.secondaryButtonAction && (
                            <Button
                                onClick={props.secondaryButtonAction}
                                size="large"
                                color="secondary"
                                sx={{
                                    '&&&': {
                                        mt: !props.blockButton ? 2 : 0.5,
                                        mb: !props.blockButton ? 4 : 0,
                                        mr: !props.blockButton ? 1 : 0,
                                        ...buttonSx,
                                    },
                                }}
                                {...restSubmitButtonProps}>
                                {t('CANCEL')}
                            </Button>
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