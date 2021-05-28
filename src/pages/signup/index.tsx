import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import constants from 'utils/strings/constants';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { getOtt } from 'services/userService';
import Container from 'components/Container';
import { setData, LS_KEYS, getData } from 'utils/storage/localStorage';
import SubmitButton from 'components/SubmitButton';
import { Button, Carousel } from 'react-bootstrap';
import {
    generateAndSaveIntermediateKeyAttributes,
    generateKeyAttributes,
    setSessionKeys,
} from 'utils/crypto';
import { setJustSignedUp } from 'utils/storage';
import { DeadCenter } from 'pages/gallery';
import englishConstants from 'utils/strings/englishConstants';
import styled from 'styled-components';

const Image = styled.img`
    width: 250px;
    height: 250px;
    margin-bottom: 30px;
`;
const HighlightedText = styled.span`
    color: #2dc262;
    font-weight: 900;
    font-size: 20px;
    margin-bottom: 20px;
`;
interface FormValues {
    email: string;
    passphrase: string;
    confirm: string;
}

export default function SignUp() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [understood, setUnderstood] = useState(false);
    useEffect(() => {
        router.prefetch('/verify');
        const user = getData(LS_KEYS.USER);
        if (user?.email) {
            router.push('/verify');
        }
    }, []);

    const registerUser = async (
        { email, passphrase, confirm }: FormValues,
        { setFieldError }: FormikHelpers<FormValues>
    ) => {
        setLoading(true);
        try {
            setData(LS_KEYS.USER, { email });
            await getOtt(email);
        } catch (e) {
            setFieldError('email', `${constants.UNKNOWN_ERROR} ${e.message}`);
        }
        try {
            if (passphrase === confirm) {
                const { keyAttributes, masterKey } =
                    await generateKeyAttributes(passphrase);
                setData(LS_KEYS.ORIGINAL_KEY_ATTRIBUTES, keyAttributes);
                await generateAndSaveIntermediateKeyAttributes(
                    passphrase,
                    keyAttributes,
                    masterKey
                );

                await setSessionKeys(masterKey);
                setJustSignedUp(true);
                router.push('/verify');
            } else {
                setFieldError('confirm', constants.PASSPHRASE_MATCH_ERROR);
            }
        } catch (e) {
            console.error(e);
            setFieldError('passphrase', constants.PASSWORD_GENERATION_FAILED);
        }
        setLoading(false);
    };

    return (
        <Container>
            <Carousel style={{ width: '400px' }} className="text-center" controls={false}>
                <Carousel.Item>
                    <DeadCenter>
                        <Image
                            src="/protected.png"
                            alt="protected"
                            style={{ width: '175px', height: '207px' }}
                        />
                        <HighlightedText>
                            {englishConstants.PROTECTED}
                        </HighlightedText>
                        <span>
                            {englishConstants.PROTECTED_MESSAGE()}
                        </span>
                    </DeadCenter>
                </Carousel.Item>
                <Carousel.Item>
                    <DeadCenter>
                        <Image src="/synced.png" alt="synced"
                            style={{ width: '224px', height: '207px' }} />
                        <HighlightedText>
                            {englishConstants.SYNCED}
                        </HighlightedText>
                        <span>{englishConstants.SYNCED_MESSAGE()}</span>
                    </DeadCenter>
                </Carousel.Item>
                <Carousel.Item>
                    <DeadCenter>
                        <Image
                            src="/preserved.png"
                            alt="preserved"
                            style={{ width: '260px', height: '207px' }}
                        />
                        <HighlightedText>
                            {englishConstants.PRESERVED}
                        </HighlightedText>
                        <span>
                            {englishConstants.PRESERVED_MESSAGE()}
                        </span>
                    </DeadCenter>
                </Carousel.Item>
            </Carousel>
            <Card style={{ width: '460px', marginTop: '50px' }} className="text-center">
                <Card.Body style={{ padding: '30px 30px' }}>

                    <Card.Title
                        style={{
                            marginBottom: '32px',
                            fontSize: '25px',
                        }}
                    >
                        {constants.SIGN_UP}
                    </Card.Title>
                    <div style={{ margin: 'auto', width: '360px' }}>
                        <Formik<FormValues>
                            initialValues={{
                                email: '',
                                passphrase: '',
                                confirm: '',
                            }}
                            validationSchema={Yup.object().shape({
                                email: Yup.string()
                                    .email(constants.EMAIL_ERROR)
                                    .required(constants.REQUIRED),
                                passphrase: Yup.string().required(
                                    constants.REQUIRED
                                ),
                                confirm: Yup.string().required(
                                    constants.REQUIRED
                                ),
                            })}
                            validateOnChange={false}
                            validateOnBlur={false}
                            onSubmit={registerUser}
                        >
                            {({
                                values,
                                errors,
                                touched,
                                handleChange,
                                handleSubmit,
                            }): JSX.Element => (
                                <Form noValidate onSubmit={handleSubmit}>
                                    <Form.Group controlId="registrationForm.email">
                                        <Form.Control
                                            type="email"
                                            placeholder={constants.ENTER_EMAIL}
                                            value={values.email}
                                            onChange={handleChange('email')}
                                            isInvalid={Boolean(
                                                touched.email && errors.email
                                            )}
                                            autoFocus={true}
                                            disabled={loading}
                                        />
                                        <FormControl.Feedback type="invalid">
                                            {errors.email}
                                        </FormControl.Feedback>
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Control
                                            type="password"
                                            placeholder={
                                                constants.PASSPHRASE_HINT
                                            }
                                            value={values.passphrase}
                                            onChange={handleChange(
                                                'passphrase'
                                            )}
                                            isInvalid={Boolean(
                                                touched.passphrase &&
                                                errors.passphrase
                                            )}
                                            disabled={loading}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.passphrase}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group>
                                        <Form.Control
                                            type="password"
                                            placeholder={
                                                constants.RE_ENTER_PASSPHRASE
                                            }
                                            value={values.confirm}
                                            onChange={handleChange('confirm')}
                                            isInvalid={Boolean(
                                                touched.confirm &&
                                                errors.confirm
                                            )}
                                            disabled={loading}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {errors.confirm}
                                        </Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group
                                        style={{
                                            textAlign: 'left',
                                            paddingTop: '12px',
                                            marginBottom: '20px',
                                        }}
                                    >
                                        <label className="container">
                                            {constants.TERMS_AND_CONDITIONS()}
                                            <input
                                                type="checkbox"
                                                checked={acceptTerms}
                                                onChange={(e) =>
                                                    setAcceptTerms(
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            <span className="checkmark"></span>
                                        </label>
                                    </Form.Group>
                                    {/* <Form.Group
                                        style={{
                                            textAlign: 'left',
                                        }}
                                    >
                                        <label className="container">
                                            {constants.CONFIRM_PASSWORD_NOT_SAVED()}
                                            <input
                                                type="checkbox"
                                                checked={understood}
                                                onChange={(e) =>
                                                    setUnderstood(
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            <span className="checkmark"></span>
                                        </label>
                                    </Form.Group> */}
                                    <SubmitButton
                                        buttonText={constants.SUBMIT}
                                        loading={loading}
                                        disabled={!acceptTerms || !understood}
                                    />
                                </Form>
                            )}
                        </Formik>
                    </div>
                    <Button variant="link" onClick={router.back} style={{ marginTop: "32px" }}>
                        {constants.GO_BACK}
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
}
