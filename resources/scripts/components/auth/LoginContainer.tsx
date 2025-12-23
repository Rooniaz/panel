import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers, Field as FormikField, FieldProps } from 'formik';
import { object, string } from 'yup';
import Input from '@/components/elements/Input';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState(
        (state) => state.settings.data?.recaptcha || { enabled: false, siteKey: '' }
    );

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
            return;
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
                if (ref.current) ref.current.reset();
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
                            <Input
                                {...field}
                                type='text'
                                placeholder={'Username or Email'}
                                disabled={isSubmitting}
                                hasError={!!(touched.username && errors.username)}
                            />
                        )}
                    </FormikField>

                    <div css={tw`mt-6`}>
                        <FormikField name='password'>
                            {({ field, form: { errors, touched } }: FieldProps) => (
                                <Input
                                    {...field}
                                    type='password'
                                    placeholder={'Password'}
                                    disabled={isSubmitting}
                                    hasError={!!(touched.password && errors.password)}
                                />
                            )}
                        </FormikField>
                    </div>

                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={'xlarge'} isLoading={isSubmitting} disabled={isSubmitting}>
                            Login
                        </Button>
                    </div>

                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}

                    <div css={tw`mt-6 text-center text-sm space-y-2`}>
                        <div>
                            <Link
                                to={'/auth/password'}
                                css={tw`text-neutral-300 no-underline hover:text-neutral-200 transition-colors duration-150`}
                            >
                                Forgot your password?
                            </Link>
                        </div>
                        <div>
                            <span css={tw`text-neutral-400`}>ยังไม่มีบัญชี? </span>
                            <Link
                                to={'/auth/register'}
                                css={tw`text-blue-400 hover:text-blue-300 transition-colors duration-150`}
                            >
                                สมัครสมาชิก
                            </Link>
                        </div>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
