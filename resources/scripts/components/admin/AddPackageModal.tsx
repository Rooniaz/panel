import React from 'react';
import { Formik, FormikHelpers, Field as FormikField } from 'formik';
import { object, string, number } from 'yup';
import Modal from '@/components/elements/Modal';
import { Form } from 'formik';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import { createPackage } from '@/api/spring/admin';

interface Values {
    name: string;
    description: string;
    priority: number;
    cpu: string;
    ram: string;
    storage: string;
    hourlyRate: number;
}

interface Props {
    visible: boolean;
    onDismissed: () => void;
    onSuccess: () => void;
    hwId: string;
    categoryId: string;
}

const schema = object().shape({
    name: string().required('กรุณากรอกชื่อ Package'),
    description: string().required('กรุณากรอกคำอธิบาย'),
    priority: number().required('กรุณากรอก Priority').min(0, 'Priority ต้องมากกว่าหรือเท่ากับ 0'),
    cpu: string().required('กรุณากรอก CPU'),
    ram: string().required('กรุณากรอก RAM'),
    storage: string().required('กรุณากรอก Storage'),
    hourlyRate: number().required('กรุณากรอก Hourly Rate').min(0, 'Hourly Rate ต้องมากกว่าหรือเท่ากับ 0'),
});

export default ({ visible, onDismissed, onSuccess, hwId, categoryId }: Props) => {
    const submit = async (values: Values, { setSubmitting, setFieldError }: FormikHelpers<Values>) => {
        try {
            await createPackage(hwId, categoryId, {
                name: values.name,
                description: values.description,
                priority: values.priority,
                cpu: values.cpu,
                ram: values.ram,
                storage: values.storage,
                hourlyRate: values.hourlyRate,
            });
            onSuccess();
            onDismissed();
        } catch (error: any) {
            setFieldError('name', error.message || 'เกิดข้อผิดพลาดในการสร้าง Package');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} onDismissed={onDismissed} appear>
            <Formik
                onSubmit={submit}
                initialValues={{
                    name: '',
                    description: '',
                    priority: 0,
                    cpu: '',
                    ram: '',
                    storage: '',
                    hourlyRate: 0,
                }}
                validationSchema={schema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Form>
                        <h2 css={tw`text-2xl font-bold text-white mb-6`}>เพิ่ม Package</h2>

                        <div css={tw`mb-6`}>
                            <FormikField name={'name'}>
                                {({ field, meta }: any) => (
                                    <>
                                        <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>
                                            ชื่อ Package
                                        </label>
                                        <Input {...field} hasError={meta.touched && !!meta.error} />
                                        {meta.touched && meta.error && (
                                            <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                        )}
                                    </>
                                )}
                            </FormikField>
                        </div>

                        <div css={tw`mb-6`}>
                            <FormikField name={'description'}>
                                {({ field, meta }: any) => (
                                    <>
                                        <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>
                                            คำอธิบาย
                                        </label>
                                        <Input {...field} hasError={meta.touched && !!meta.error} />
                                        {meta.touched && meta.error && (
                                            <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                        )}
                                    </>
                                )}
                            </FormikField>
                        </div>

                        <div css={tw`grid grid-cols-2 gap-4 mb-6`}>
                            <div>
                                <FormikField name={'cpu'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>
                                                CPU
                                            </label>
                                            <Input
                                                {...field}
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 2 Core'}
                                            />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>

                            <div>
                                <FormikField name={'ram'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>
                                                RAM
                                            </label>
                                            <Input
                                                {...field}
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 4 GB'}
                                            />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>
                        </div>

                        <div css={tw`grid grid-cols-2 gap-4 mb-6`}>
                            <div>
                                <FormikField name={'storage'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>
                                                Storage
                                            </label>
                                            <Input
                                                {...field}
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 50 GB'}
                                            />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>

                            <div>
                                <FormikField name={'hourlyRate'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>
                                                Hourly Rate (เครดิต)
                                            </label>
                                            <Input {...field} type={'number'} hasError={meta.touched && !!meta.error} />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>
                        </div>

                        <div css={tw`mb-6`}>
                            <FormikField name={'priority'}>
                                {({ field, meta }: any) => (
                                    <>
                                        <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>
                                            Priority
                                        </label>
                                        <Input {...field} type={'number'} hasError={meta.touched && !!meta.error} />
                                        {meta.touched && meta.error && (
                                            <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                        )}
                                    </>
                                )}
                            </FormikField>
                        </div>

                        <div css={tw`flex justify-end space-x-3 mt-6`}>
                            <Button
                                type={'button'}
                                onClick={() => {
                                    resetForm();
                                    onDismissed();
                                }}
                                css={tw`bg-neutral-700 hover:bg-neutral-600`}
                            >
                                ยกเลิก
                            </Button>
                            <Button type={'submit'} disabled={isSubmitting} css={tw`bg-blue-500 hover:bg-blue-600`}>
                                {isSubmitting ? 'กำลังสร้าง...' : 'สร้าง'}
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};
