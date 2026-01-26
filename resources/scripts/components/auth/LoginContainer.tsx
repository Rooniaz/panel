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
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border-radius: 0.75rem;
    padding: 0.875rem 1rem;
    
    &::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }
    
    &:focus {
        background: rgba(15, 23, 42, 0.9);
        border-color: rgba(99, 102, 241, 0.6);
        box-shadow: 
            0 0 0 3px rgba(99, 102, 241, 0.15),
            0 4px 12px rgba(99, 102, 241, 0.1);
        outline: none;
    }
    
    &:hover:not(:focus) {
        border-color: rgba(255, 255, 255, 0.25);
        background: rgba(15, 23, 42, 0.75);
    }
    
    &[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const StyledButton = styled(Button)`
    ${tw`w-full transition-all duration-300 font-semibold tracking-wide uppercase text-sm py-3`}
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
    border: none;
    border-radius: 0.75rem;
    box-shadow: 
        0 10px 25px rgba(79, 70, 229, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
    }
    
    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #4338ca 0%, #5b21b6 50%, #6366f1 100%);
        box-shadow: 
            0 15px 35px rgba(79, 70, 229, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.15) inset;
        transform: translateY(-2px);
        
        &::before {
            left: 100%;
        }
    }
    
    &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 
            0 8px 20px rgba(79, 70, 229, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    }
    
    &[disabled] {
        opacity: 0.7;
        cursor: not-allowed;
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
                username: string().required('กรุณากรอกชื่อผู้ใช้หรืออีเมล'),
                password: string().required('กรุณากรอกรหัสผ่าน'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title={'Welcome Back'}>
                    <FormikField name='username'>
                        {({ field, form: { errors, touched } }: FieldProps) => (
                            <div>
                                <StyledInput
                                    {...field}
                                    type='text'
                                    placeholder={'Username or Email'}
                                    disabled={isSubmitting}
                                    hasError={!!(touched.username && errors.username)}
                                />
                                {touched.username && errors.username && (
                                    <p css={tw`text-xs text-red-400 mt-2 ml-1`}>{errors.username}</p>
                                )}
                            </div>
                        )}
                    </FormikField>

                    <div css={tw`mt-5`}>
                        <FormikField name='password'>
                            {({ field, form: { errors, touched } }: FieldProps) => (
                                <div>
                                    <StyledInput
                                        {...field}
                                        type='password'
                                        placeholder={'Password'}
                                        disabled={isSubmitting}
                                        hasError={!!(touched.password && errors.password)}
                                    />
                                    {touched.password && errors.password && (
                                        <p css={tw`text-xs text-red-400 mt-2 ml-1`}>{errors.password}</p>
                                    )}
                                </div>
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
