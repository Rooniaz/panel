import React from 'react';
import { Formik, FormikHelpers, Field as FormikField } from 'formik';
import { object, string, number } from 'yup';
import Modal from '@/components/elements/Modal';
import { Form } from 'formik';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import { createHardware } from '@/api/spring/admin';
import { Hardware } from '@/api/spring/hardware';

interface Values {
    name: string;
    description: string;
    priority: number;
    key: string;
}

interface Props {
    visible: boolean;
    onDismissed: () => void;
    onSuccess: (hardware: Hardware) => void;
}

const schema = object().shape({
    name: string().required('กรุณากรอกชื่อ Hardware'),
    description: string().required('กรุณากรอกคำอธิบาย'),
    priority: number().required('กรุณากรอก Priority').min(0, 'Priority ต้องมากกว่าหรือเท่ากับ 0'),
    key: string().required('กรุณากรอก Key'),
});

export default ({ visible, onDismissed, onSuccess }: Props) => {
    const submit = async (values: Values, { setSubmitting, setFieldError }: FormikHelpers<Values>) => {
        try {
            const hardware = await createHardware({
                name: values.name,
                description: values.description,
                priority: values.priority,
                key: values.key,
            });
            onSuccess(hardware);
            onDismissed();
        } catch (error: any) {
            setFieldError('name', error.message || 'เกิดข้อผิดพลาดในการสร้าง Hardware');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} onDismissed={onDismissed} appear>
            <Formik
                onSubmit={submit}
                initialValues={{ name: '', description: '', priority: 0, key: '' }}
                validationSchema={schema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Form>
                        <h2 css={tw`text-2xl font-bold text-white mb-6`}>เพิ่ม Hardware</h2>

                        <div css={tw`mb-6`}>
                            <FormikField name={'name'}>
                                {({ field, meta }: any) => (
                                    <>
                                        <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>
                                            ชื่อ Hardware
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

                        <div css={tw`mb-6`}>
                            <FormikField name={'key'}>
                                {({ field, meta }: any) => (
                                    <>
                                        <label css={tw`block text-sm font-semibold text-neutral-300 mb-2`}>Key</label>
                                        <Input {...field} hasError={meta.touched && !!meta.error} />
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
