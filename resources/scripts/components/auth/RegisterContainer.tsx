import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import register from '@/api/auth/register';
import springRegister from '@/api/auth/springRegister';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers, Field as FormikField, FieldProps } from 'formik';
import { object, string, ref as yupRef } from 'yup';
import Input from '@/components/elements/Input';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import Turnstile from 'react-turnstile';
import useFlash from '@/plugins/useFlash';

interface Values {
    username: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}

const RegisterContainer = ({ history: _history }: RouteComponentProps) => {
    const recaptchaRef = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const settingsData = useStoreState((state) => state.settings.data);
    const recaptchaData = settingsData?.recaptcha || { enabled: false, siteKey: '' };
    const turnstileData = (settingsData as any)?.turnstile || { enabled: false, siteKey: '' };

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting, submitForm: _submitForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha/turnstile data is returned by the component.
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

        // Register with both Pterodactyl and Spring Boot
        // First register with Pterodactyl
        register({
            username: values.username,
            email: values.email,
            password: values.password,
            passwordConfirmation: values.passwordConfirmation,
            recaptchaData: token,
        })
            .then((pterodactylResponse) => {
                if (!pterodactylResponse.success || !pterodactylResponse.complete) {
                    throw new Error(pterodactylResponse.message || 'Pterodactyl registration failed');
                }

                // If Pterodactyl registration succeeds, register with Spring Boot
                return springRegister({
                    username: values.username,
                    email: values.email,
                    password: values.password,
                    passwordConfirmation: values.passwordConfirmation,
                })
                    .then(() => {
                        // Both registrations succeeded
                        addFlash({
                            key: 'register_success',
                            type: 'success',
                            message: 'สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...',
                        });

                        // Option 1: Redirect back to Next.js frontend
                        const nextjsUrl = new URLSearchParams(window.location.search).get('return');
                        if (nextjsUrl) {
                            window.location.href = nextjsUrl;
                            return;
                        }

                        // Option 2: Redirect to Panel dashboard
                        // @ts-expect-error this is valid
                        window.location = pterodactylResponse.intended || '/';
                    })
                    .catch((springError) => {
                        // Pterodactyl succeeded but Spring Boot failed
                        console.error('Spring Boot registration error:', springError);
                        setToken('');
                        if (recaptchaData?.enabled) {
                            recaptchaRef.current?.reset();
                        } else if (turnstileData?.enabled) {
                            // Turnstile will reset automatically via state changes
                            setToken('');
                        }
                        setSubmitting(false);
                        clearAndAddHttpError({
                            error: new Error(
                                `สมัครสมาชิกใน Pterodactyl สำเร็จ แต่ไม่สามารถสมัครใน Spring Boot ได้: ${
                                    springError.message || 'Unknown error'
                                }`
                            ),
                        });
                    });
            })
            .catch((error) => {
                console.error('Pterodactyl registration error:', error);

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
            initialValues={{ username: '', email: '', password: '', passwordConfirmation: '' }}
            validationSchema={object().shape({
                username: string()
                    .required('กรุณากรอกชื่อผู้ใช้งาน')
                    .min(3, 'ชื่อผู้ใช้งานต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),
                email: string().required('กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
                password: string().required('กรุณากรอกรหัสผ่าน').min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
                passwordConfirmation: string()
                    .required('กรุณายืนยันรหัสผ่าน')
                    .oneOf([yupRef('password')], 'รหัสผ่านไม่ตรงกัน'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title={'MineLan Portal'}>
                    <div css={tw`mb-6 text-center`}>
                        <p css={tw`text-neutral-300 text-lg`}>สมัครสมาชิก</p>
                    </div>
                    <div css={tw`space-y-4`}>
                        <FormikField name='username'>
                            {({ field, form: { errors, touched, setFieldValue } }: FieldProps) => (
                                <div>
                                    <label css={tw`block text-sm font-medium text-neutral-300 mb-2`}>
                                        ชื่อผู้ใช้งาน
                                    </label>
                                    <div css={tw`relative`}>
                                        <div
                                            css={tw`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10`}
                                        >
                                            <svg
                                                css={tw`h-5 w-5 text-blue-400`}
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                                />
                                            </svg>
                                        </div>
                                        <Input
                                            {...field}
                                            type='text'
                                            disabled={isSubmitting}
                                            css={tw`pl-10 pr-10 w-full bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                            style={{ paddingLeft: 'calc(2.5rem + 5px)' }}
                                            hasError={!!(touched.username && errors.username)}
                                        />
                                        {field.value && (
                                            <button
                                                type='button'
                                                onClick={() => setFieldValue('username', '')}
                                                css={tw`absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-600 hover:text-neutral-900`}
                                            >
                                                <svg
                                                    css={tw`h-5 w-5`}
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M6 18L18 6M6 6l12 12'
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    {touched.username && errors.username && (
                                        <p css={tw`mt-1 text-sm text-red-400`}>{errors.username as string}</p>
                                    )}
                                </div>
                            )}
                        </FormikField>
                        <FormikField name='email'>
                            {({ field, form: { errors, touched, setFieldValue } }: FieldProps) => (
                                <div>
                                    <label css={tw`block text-sm font-medium text-neutral-300 mb-2`}>อีเมล</label>
                                    <div css={tw`relative`}>
                                        <div
                                            css={tw`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10`}
                                        >
                                            <svg
                                                css={tw`h-5 w-5 text-blue-400`}
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                                                />
                                            </svg>
                                        </div>
                                        <Input
                                            {...field}
                                            type='email'
                                            disabled={isSubmitting}
                                            css={tw`pl-10 pr-10 w-full bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                            style={{ paddingLeft: 'calc(2.5rem + 5px)' }}
                                            hasError={!!(touched.email && errors.email)}
                                        />
                                        {field.value && (
                                            <button
                                                type='button'
                                                onClick={() => setFieldValue('email', '')}
                                                css={tw`absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-600 hover:text-neutral-900`}
                                            >
                                                <svg
                                                    css={tw`h-5 w-5`}
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M6 18L18 6M6 6l12 12'
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    {touched.email && errors.email && (
                                        <p css={tw`mt-1 text-sm text-red-400`}>{errors.email as string}</p>
                                    )}
                                </div>
                            )}
                        </FormikField>
                        <FormikField name='password'>
                            {({ field, form: { errors, touched, setFieldValue } }: FieldProps) => (
                                <div>
                                    <label css={tw`block text-sm font-medium text-neutral-300 mb-2`}>รหัสผ่าน</label>
                                    <div css={tw`relative`}>
                                        <div
                                            css={tw`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10`}
                                        >
                                            <svg
                                                css={tw`h-5 w-5 text-blue-400`}
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                                />
                                            </svg>
                                        </div>
                                        <Input
                                            {...field}
                                            type={showPassword ? 'text' : 'password'}
                                            disabled={isSubmitting}
                                            css={tw`pl-10 pr-20 w-full bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                            style={{ paddingLeft: 'calc(2.5rem + 5px)' }}
                                            hasError={!!(touched.password && errors.password)}
                                        />
                                        <div css={tw`absolute inset-y-0 right-0 pr-3 flex items-center gap-2`}>
                                            {field.value && (
                                                <button
                                                    type='button'
                                                    onClick={() => setFieldValue('password', '')}
                                                    css={tw`text-neutral-600 hover:text-neutral-900`}
                                                >
                                                    <svg
                                                        css={tw`h-5 w-5`}
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M6 18L18 6M6 6l12 12'
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                type='button'
                                                onClick={() => setShowPassword(!showPassword)}
                                                css={tw`text-blue-400 hover:text-blue-500 transition-colors`}
                                            >
                                                {showPassword ? (
                                                    <svg
                                                        css={tw`h-5 w-5`}
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        css={tw`h-5 w-5`}
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                                        />
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {touched.password && errors.password && (
                                        <p css={tw`mt-1 text-sm text-red-400`}>{errors.password as string}</p>
                                    )}
                                </div>
                            )}
                        </FormikField>
                        <FormikField name='passwordConfirmation'>
                            {({ field, form: { errors, touched, setFieldValue } }: FieldProps) => (
                                <div>
                                    <label css={tw`block text-sm font-medium text-neutral-300 mb-2`}>
                                        ยืนยันรหัสผ่าน
                                    </label>
                                    <div css={tw`relative`}>
                                        <div
                                            css={tw`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10`}
                                        >
                                            <svg
                                                css={tw`h-5 w-5 text-blue-400`}
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                                />
                                            </svg>
                                        </div>
                                        <Input
                                            {...field}
                                            type={showPasswordConfirmation ? 'text' : 'password'}
                                            disabled={isSubmitting}
                                            css={tw`pl-10 pr-20 w-full bg-neutral-200 border border-neutral-300 text-neutral-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                            style={{ paddingLeft: 'calc(2.5rem + 5px)' }}
                                            hasError={!!(touched.passwordConfirmation && errors.passwordConfirmation)}
                                        />
                                        <div css={tw`absolute inset-y-0 right-0 pr-3 flex items-center gap-2`}>
                                            {field.value && (
                                                <button
                                                    type='button'
                                                    onClick={() => setFieldValue('passwordConfirmation', '')}
                                                    css={tw`text-neutral-600 hover:text-neutral-900`}
                                                >
                                                    <svg
                                                        css={tw`h-5 w-5`}
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M6 18L18 6M6 6l12 12'
                                                        />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                type='button'
                                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                css={tw`text-blue-400 hover:text-blue-500 transition-colors`}
                                            >
                                                {showPasswordConfirmation ? (
                                                    <svg
                                                        css={tw`h-5 w-5`}
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        css={tw`h-5 w-5`}
                                                        fill='none'
                                                        stroke='currentColor'
                                                        viewBox='0 0 24 24'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                                        />
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {touched.passwordConfirmation && errors.passwordConfirmation && (
                                        <p css={tw`mt-1 text-sm text-red-400`}>
                                            {errors.passwordConfirmation as string}
                                        </p>
                                    )}
                                </div>
                            )}
                        </FormikField>
                        <div css={tw`mt-6`}>
                            <Button
                                type={'submit'}
                                size={'xlarge'}
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                                css={tw`w-full text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg`}
                                style={{
                                    background: 'linear-gradient(to right, #3b82f6, #2563eb)',
                                }}
                            >
                                สมัครสมาชิก
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
                        <div css={tw`mt-4 text-center`}>
                            <span css={tw`text-sm text-neutral-400`}>มีบัญชีอยู่แล้ว? </span>
                            <Link
                                to={'/auth/login'}
                                css={tw`text-sm text-blue-400 hover:text-blue-300 transition-colors`}
                            >
                                เข้าสู่ระบบ
                            </Link>
                        </div>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default RegisterContainer;
