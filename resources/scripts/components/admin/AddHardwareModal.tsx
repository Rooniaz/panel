import React from 'react';
import { Formik, FormikHelpers, Field as FormikField } from 'formik';
import { object, string, number } from 'yup';
import Modal from '@/components/elements/Modal';
import { Form } from 'formik';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faInfoCircle, faKey, faSortNumericDown } from '@fortawesome/free-solid-svg-icons';
import { createHardware, updateHardware } from '@/api/spring/admin';
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
    hardware?: Hardware | null; // If provided, edit mode; otherwise, create mode
}

const schema = object().shape({
    name: string().required('กรุณากรอกชื่อ Hardware'),
    description: string().required('กรุณากรอกคำอธิบาย'),
    priority: number().required('กรุณากรอก Priority').min(0, 'Priority ต้องมากกว่าหรือเท่ากับ 0'),
    key: string().required('กรุณากรอก Key'),
});

export default ({ visible, onDismissed, onSuccess, hardware }: Props) => {
    const isEditMode = !!hardware;

    const submit = async (values: Values, { setSubmitting, setFieldError }: FormikHelpers<Values>) => {
        try {
            let result: Hardware;
            if (isEditMode && hardware) {
                result = await updateHardware(hardware.id, {
                    name: values.name,
                    description: values.description,
                    priority: values.priority,
                    key: values.key,
                });
            } else {
                result = await createHardware({
                    name: values.name,
                    description: values.description,
                    priority: values.priority,
                    key: values.key,
                });
            }
            onSuccess(result);
            onDismissed();
        } catch (error: any) {
            setFieldError('name', error.message || `เกิดข้อผิดพลาดในการ${isEditMode ? 'แก้ไข' : 'สร้าง'} Hardware`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} onDismissed={onDismissed} appear>
            <Formik
                onSubmit={submit}
                initialValues={{
                    name: hardware?.name || '',
                    description: hardware?.description || '',
                    priority: hardware?.priority || 0,
                    key: hardware?.key || '',
                }}
                enableReinitialize
                validationSchema={schema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Form>
                        <div css={tw`mb-6 pb-4 border-b border-white/10`}>
                            <h2 css={tw`text-2xl font-bold text-white flex items-center space-x-3`}>
                                <span css={tw`w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-xl`}>
                                    <FontAwesomeIcon icon={faServer} css={tw`w-6 h-6`} />
                                </span>
                                <span>{isEditMode ? ' แก้ไข Hardware' : ' เพิ่ม Hardware'}</span>
                            </h2>
                            <p css={tw`text-sm text-neutral-400 mt-2 flex items-center space-x-2`}>
                                <FontAwesomeIcon icon={faInfoCircle} css={tw`w-4 h-4 text-blue-400`} />
                                <span>กรอกข้อมูล Hardware สำหรับระบบ</span>
                            </p>
                        </div>

                        <div css={tw`mb-6`}>
                            <FormikField name={'name'}>
                                {({ field, meta }: any) => (
                                    <>
                                        <label css={tw`block text-sm font-bold text-neutral-200 mb-2 flex items-center space-x-2`}>
                                            <FontAwesomeIcon icon={faServer} css={tw`w-4 h-4 text-blue-400`} />
                                            <span>ชื่อ Hardware</span>
                                        </label>
                                        <Input 
                                            {...field} 
                                            hasError={meta.touched && !!meta.error}
                                            placeholder={'เช่น Ryzen 9 7950x @4.5-5.7 GHz'}
                                            css={tw`bg-neutral-800/50 border-neutral-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                                        />
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
                                        <label css={tw`block text-sm font-bold text-neutral-200 mb-2`}>
                                            คำอธิบาย
                                        </label>
                                        <Input 
                                            {...field} 
                                            hasError={meta.touched && !!meta.error}
                                            placeholder={'เช่น AMD Ryzen 9 7950x'}
                                            css={tw`bg-neutral-800/50 border-neutral-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                                        />
                                        {meta.touched && meta.error && (
                                            <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                        )}
                                    </>
                                )}
                            </FormikField>
                        </div>

                        <div css={tw`grid grid-cols-2 gap-4 mb-6`}>
                            <div>
                                <FormikField name={'priority'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-bold text-neutral-200 mb-2 flex items-center space-x-2`}>
                                                <FontAwesomeIcon icon={faSortNumericDown} css={tw`w-4 h-4 text-green-400`} />
                                                <span>Priority</span>
                                            </label>
                                            <Input 
                                                {...field} 
                                                type={'number'} 
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 0'}
                                                css={tw`bg-neutral-800/50 border-neutral-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20`}
                                            />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>

                            <div>
                                <FormikField name={'key'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-bold text-neutral-200 mb-2 flex items-center space-x-2`}>
                                                <FontAwesomeIcon icon={faKey} css={tw`w-4 h-4 text-yellow-400`} />
                                                <span>Key</span>
                                            </label>
                                            <Input 
                                                {...field} 
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น AMD, INTEL'}
                                                css={tw`bg-neutral-800/50 border-neutral-700 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20`}
                                            />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>
                        </div>

                        <div css={tw`flex justify-end space-x-3 mt-8 pt-6 border-t border-white/10`}>
                            <Button
                                type={'button'}
                                onClick={() => {
                                    resetForm();
                                    onDismissed();
                                }}
                                css={tw`bg-neutral-700/80 hover:bg-neutral-600 border border-neutral-600 text-neutral-200 font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95`}
                            >
                                ยกเลิก
                            </Button>
                            <Button 
                                type={'submit'} 
                                disabled={isSubmitting} 
                                css={tw`bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white font-bold px-8 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span css={tw`animate-spin`}>⏳</span>
                                        <span>กำลัง{isEditMode ? 'บันทึก' : 'สร้าง'}...</span>
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faServer} css={tw`w-4 h-4`} />
                                        <span>{isEditMode ? ' บันทึกการแก้ไข' : ' สร้าง Hardware'}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};
