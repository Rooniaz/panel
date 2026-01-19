import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers, Field as FormikField, FieldProps } from 'formik';
import { object, string } from 'yup';
import Input from '@/components/elements/Input';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import Turnstile from 'react-turnstile';
import useFlash from '@/plugins/useFlash';

interface Values {
    username: string;
    password: string;
}

const StyledInput = styled(Input)`
    ${tw`transition-all duration-300`}
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }
    
    &:focus {
        background: rgba(15, 23, 42, 0.8);
        border-color: rgba(56, 189, 248, 0.5);
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
    }
    
    &:hover:not(:focus) {
        border-color: rgba(255, 255, 255, 0.2);
    }
`;

const StyledButton = styled(Button)`
    ${tw`w-full transition-all duration-300 font-semibold tracking-wide uppercase text-sm`}
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    border: none;
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
    
    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
        box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
        transform: translateY(-2px);
    }
    
    &:active:not(:disabled) {
        transform: translateY(0);
    }
`;

const ForgotPasswordLink = styled(Link)`
    ${tw`text-neutral-300 no-underline transition-all duration-200`}
    
    &:hover {
        color: #38bdf8;
        text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
    }
`;

const RegisterLink = styled(Link)`
    ${tw`transition-all duration-200 font-semibold`}
    color: #60a5fa;
    
    &:hover {
        color: #38bdf8;
        text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
    }
`;

const LinksContainer = styled.div`
    ${tw`mt-8 text-center text-sm space-y-3`}
`;

const LoginContainer = ({ history }: RouteComponentProps) => {
    const recaptchaRef = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const settingsData = useStoreState((state) => state.settings.data);
    const recaptchaData = settingsData?.recaptcha || { enabled: false, siteKey: '' };
    const turnstileData = (settingsData as any)?.turnstile || { enabled: false, siteKey: '' };

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (!token) {
            if (recaptchaData?.enabled) {
                recaptchaRef.current?.execute().catch((error) => {
                    console.error(error);
                    setSubmitting(false);
                    clearAndAddHttpError({ error });
                });
                return;
            } else if (turnstileData?.enabled) {
                // Turnstile will execute automatically when rendered
                // Token will be set via onVerify callback
                setSubmitting(false);
                return;
            }
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }
                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);
                setToken('');
                if (recaptchaData?.enabled) {
                    recaptchaRef.current?.reset();
                } else if (turnstileData?.enabled) {
                    // Turnstile will reset automatically via state changes
                    setToken('');
                }
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title={'Welcome Back'}>
                    <FormikField name='username'>
                        {({ field, form: { errors, touched } }: FieldProps) => (
                            <StyledInput
                                {...field}
                                type='text'
                                placeholder={'Username or Email'}
                                disabled={isSubmitting}
                                hasError={!!(touched.username && errors.username)}
                            />
                        )}
                    </FormikField>

                    <div css={tw`mt-5`}>
                        <FormikField name='password'>
                            {({ field, form: { errors, touched } }: FieldProps) => (
                                <StyledInput
                                    {...field}
                                    type='password'
                                    placeholder={'Password'}
                                    disabled={isSubmitting}
                                    hasError={!!(touched.password && errors.password)}
                                />
                            )}
                        </FormikField>
                    </div>

                    <div css={tw`mt-7`}>
                        <StyledButton type={'submit'} size={'xlarge'} isLoading={isSubmitting} disabled={isSubmitting}>
                            Login
                        </StyledButton>
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

                    <LinksContainer>
                        <div>
                            <ForgotPasswordLink to={'/auth/password'}>
                                Forgot your password?
                            </ForgotPasswordLink>
                        </div>
                        <div>
                            <span css={tw`text-neutral-400`}>ยังไม่มีบัญชี? </span>
                            <RegisterLink to={'/auth/register'}>
                                สมัครสมาชิก
                            </RegisterLink>
                        </div>
                    </LinksContainer>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
