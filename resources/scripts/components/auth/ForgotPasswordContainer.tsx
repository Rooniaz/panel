import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import requestPasswordResetEmail from '@/api/auth/requestPasswordResetEmail';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import Field from '@/components/elements/Field';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import Turnstile from 'react-turnstile';
import useFlash from '@/plugins/useFlash';

interface Values {
    email: string;
}

export default () => {
    const recaptchaRef = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, addFlash } = useFlash();
    const settingsData = useStoreState((state) => state.settings.data);
    const recaptchaData = settingsData?.recaptcha || { enabled: false, siteKey: '' };
    const turnstileData = (settingsData as any)?.turnstile || { enabled: false, siteKey: '' };

    useEffect(() => {
        clearFlashes();
    }, []);

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha/turnstile data is returned by the component.
        if (!token) {
            if (recaptchaData?.enabled) {
                recaptchaRef.current?.execute().catch((error) => {
                    console.error(error);

                    setSubmitting(false);
                    addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
                });
                return;
            } else if (turnstileData?.enabled) {
                // Turnstile will execute automatically when rendered
                // Token will be set via onVerify callback
                setSubmitting(false);
                return;
            }
        }

        requestPasswordResetEmail(email, token)
            .then((response) => {
                resetForm();
                addFlash({ type: 'success', title: 'Success', message: response });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setToken('');
                if (recaptchaData?.enabled) {
                    recaptchaRef.current?.reset();
                } else if (turnstileData?.enabled) {
                    // Turnstile will reset automatically via state changes
                    setToken('');
                }

                setSubmitting(false);
            });
    };

    return (
        <Formik
            onSubmit={handleSubmission}
            initialValues={{ email: '' }}
            validationSchema={object().shape({
                email: string()
                    .email('A valid email address must be provided to continue.')
                    .required('A valid email address must be provided to continue.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title={'Request Password Reset'} css={tw`w-full flex`}>
                    <Field
                        light
                        label={'Email'}
                        description={
                            'Enter your account email address to receive instructions on resetting your password.'
                        }
                        name={'email'}
                        type={'email'}
                    />
                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={'xlarge'} disabled={isSubmitting} isLoading={isSubmitting}>
                            Send Email
                        </Button>
                    </div>
                    {recaptchaData?.enabled ? (
                        <Reaptcha
                            ref={recaptchaRef}
                            size={'invisible'}
                            sitekey={recaptchaData.siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    ) : turnstileData?.enabled ? (
                        <div css={tw`mt-3 flex justify-center`}>
                            <Turnstile
                                sitekey={turnstileData.siteKey || '_invalid_key'}
                                onVerify={(response) => {
                                    setToken(response);
                                    submitForm();
                                }}
                                onExpire={() => {
                                    setSubmitting(false);
                                    setToken('');
                                }}
                            />
                        </div>
                    ) : null}
                    <div css={tw`mt-6 text-center`}>
                        <Link
                            to={'/auth/login'}
                            css={tw`text-xs text-neutral-500 tracking-wide uppercase no-underline hover:text-neutral-700`}
                        >
                            Return to Login
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
