import React from 'react';
import { Formik, FormikHelpers, Field as FormikField } from 'formik';
import { object, string, number, mixed } from 'yup';
import Modal from '@/components/elements/Modal';
import { Form } from 'formik';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faMemory, faHdd, faClock, faBox, faUsers, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { createPackage, updatePackage } from '@/api/spring/admin';
import { PackageContainer } from '@/api/spring/hardware';

interface Values {
    name: string;
    description: string;
    priority: number;
    cpu: string;
    ram: string;
    storage: string;
    hourlyRate: number;
    capacity: number | null;
}

interface Props {
    visible: boolean;
    onDismissed: () => void;
    onSuccess: () => void;
    hwId: string;
    categoryId: string | null; // ✅ null = Spring Boot will generate categoryId automatically
    package?: PackageContainer | null; // If provided, edit mode; otherwise, create mode
    originalPackageName?: string; // Original package name for edit mode
}

const schema = object().shape({
    name: string().required('กรุณากรอกชื่อ Package'),
    description: string().required('กรุณากรอกคำอธิบาย'),
    priority: number().required('กรุณากรอก Priority').min(0, 'Priority ต้องมากกว่าหรือเท่ากับ 0'),
    cpu: string().required('กรุณากรอก CPU'),
    ram: string().required('กรุณากรอก RAM'),
    storage: string().required('กรุณากรอก Storage'),
    hourlyRate: number().required('กรุณากรอก Hourly Rate').min(0, 'Hourly Rate ต้องมากกว่าหรือเท่ากับ 0'),
    capacity: mixed()
        .nullable()
        .transform((value) => (value === '' ? null : value))
        .test('is-valid-capacity', 'Capacity ต้องมากกว่าหรือเท่ากับ 1', (value) => {
            if (value === null || value === undefined || value === '') return true;
            return typeof value === 'number' && value >= 1;
        }),
});

/**
 * Helper function to extract numeric value from string (remove "GB", spaces, etc.)
 * Example: "10 GB" -> "10", "16GB" -> "16"
 */
const extractNumericValue = (value: string | undefined): string => {
    if (!value) return '';
    // Remove "GB", spaces, and any non-numeric characters except decimal point
    return value.replace(/\s*GB\s*/gi, '').replace(/[^\d.]/g, '').trim();
};

export default ({ visible, onDismissed, onSuccess, hwId, categoryId, package: packageData, originalPackageName }: Props) => {
    const isEditMode = !!packageData;

    const handleSubmit = async (
        values: Values,
        { setSubmitting, setFieldError }: FormikHelpers<Values>
    ): Promise<void> => {
        try {
            if (isEditMode && originalPackageName && categoryId) {
                await updatePackage(hwId, categoryId, originalPackageName, {
                    name: values.name,
                    description: values.description,
                    priority: values.priority,
                    cpu: values.cpu,
                    ram: values.ram,
                    storage: values.storage,
                    hourlyRate: values.hourlyRate,
                    capacity: values.capacity || null,
                });
            } else {
                // ✅ ถ้า categoryId เป็น null Spring Boot จะ generate อัตโนมัติ
                await createPackage(hwId, categoryId, {
                    name: values.name,
                    description: values.description,
                    priority: values.priority,
                    cpu: values.cpu,
                    ram: values.ram,
                    storage: values.storage,
                    hourlyRate: values.hourlyRate,
                    capacity: values.capacity || null,
                });
            }
            onSuccess();
            onDismissed();
        } catch (error: any) {
            // Display error message to user
            const errorMessage = error?.response?.data?.message || 
                                error?.response?.data?.error || 
                                error?.message || 
                                `เกิดข้อผิดพลาดในการ${isEditMode ? 'แก้ไข' : 'สร้าง'} Package`;
            setFieldError('name', errorMessage);
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} package:`, error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} onDismissed={onDismissed} appear>
            <Formik<Values>
                onSubmit={handleSubmit}
                initialValues={{
                    name: packageData?.name || '',
                    description: packageData?.description || '',
                    priority: packageData?.priority || 0,
                    cpu: extractNumericValue(packageData?.cpu) || '',
                    ram: extractNumericValue(packageData?.ram) || '',
                    storage: extractNumericValue(packageData?.storage) || '',
                    hourlyRate: packageData?.hourlyRate || 0,
                    capacity: packageData?.capacity ?? null,
                }}
                enableReinitialize
                validationSchema={schema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Form>
                        <div css={tw`mb-6 pb-4 border-b border-white/10`}>
                            <h2 css={tw`text-2xl font-bold text-white flex items-center space-x-3`}>
                                <span
                                    css={tw`w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-xl`}
                                >
                                    <FontAwesomeIcon icon={faBox} css={tw`w-6 h-6`} />
                                </span>
                                <span>{isEditMode ? 'แก้ไข Package' : 'เพิ่ม Package'}</span>
                            </h2>
                            <p css={tw`text-sm text-neutral-400 mt-2 flex items-center space-x-2`}>
                                <FontAwesomeIcon icon={faInfoCircle} css={tw`w-4 h-4 text-blue-400`} />
                                <span>กรอกข้อมูล Package สำหรับ Hardware ที่เลือก</span>
                            </p>
                        </div>

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

                        <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6`}>
                            <div>
                                <FormikField name={'cpu'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-bold text-neutral-200 mb-2 flex items-center space-x-2`}>
                                                <FontAwesomeIcon icon={faMicrochip} css={tw`w-4 h-4 text-blue-400`} />
                                                <span>CPU</span>
                                            </label>
                                            <Input
                                                {...field}
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 2 Core'}
                                                css={tw`bg-neutral-800/50 border-neutral-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
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
                                            <label css={tw`block text-sm font-bold text-neutral-200 mb-2 flex items-center space-x-2`}>
                                                <FontAwesomeIcon icon={faMemory} css={tw`w-4 h-4 text-green-400`} />
                                                <span>RAM</span>
                                            </label>
                                            <Input
                                                {...field}
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 4 GB'}
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
                                <FormikField name={'storage'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-bold text-neutral-200 mb-2 flex items-center space-x-2`}>
                                                <FontAwesomeIcon icon={faHdd} css={tw`w-4 h-4 text-purple-400`} />
                                                <span>Storage</span>
                                            </label>
                                            <Input
                                                {...field}
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 50 GB'}
                                                css={tw`bg-neutral-800/50 border-neutral-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20`}
                                            />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>
                        </div>

                        <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6`}>
                            <div>
                                <FormikField name={'hourlyRate'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-bold text-neutral-200 mb-2 flex items-center space-x-2`}>
                                                <FontAwesomeIcon icon={faClock} css={tw`w-4 h-4 text-yellow-400`} />
                                                <span>Hourly Rate (เครดิต)</span>
                                            </label>
                                            <Input 
                                                {...field} 
                                                type={'number'} 
                                                step="0.01"
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 0.62'}
                                                css={tw`bg-neutral-800/50 border-neutral-700 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20`}
                                            />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>

                            <div>
                                <FormikField name={'priority'}>
                                    {({ field, meta }: any) => (
                                        <>
                                            <label css={tw`block text-sm font-bold text-neutral-200 mb-2`}>
                                                Priority
                                            </label>
                                            <Input 
                                                {...field} 
                                                type={'number'} 
                                                hasError={meta.touched && !!meta.error}
                                                placeholder={'เช่น 0'}
                                                css={tw`bg-neutral-800/50 border-neutral-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                                            />
                                            {meta.touched && meta.error && (
                                                <p css={tw`mt-1 text-sm text-red-400`}>{meta.error}</p>
                                            )}
                                        </>
                                    )}
                                </FormikField>
                            </div>
                        </div>

                        <div css={tw`mb-6 p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-xl border border-indigo-500/20`}>
                            <FormikField name={'capacity'}>
                                {({ field, meta }: any) => (
                                    <>
                                        <label css={tw`block text-sm font-bold text-neutral-200 mb-3 flex items-center space-x-2`}>
                                            <FontAwesomeIcon icon={faUsers} css={tw`w-5 h-5 text-indigo-400`} />
                                            <span>Capacity (จำนวนสูงสุดที่เช่าได้)</span>
                                        </label>
                                        <div css={tw`relative`}>
                                            <Input
                                                {...field}
                                                type={'number'}
                                                placeholder={'เช่น 10 (เว้นว่าง = ไม่จำกัด)'}
                                                hasError={meta.touched && !!meta.error}
                                                value={field.value || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const value = e.target.value;
                                                    const numValue = value === '' ? null : parseInt(value, 10);
                                                    field.onChange({
                                                        target: {
                                                            name: field.name,
                                                            value: isNaN(numValue as number) ? null : numValue,
                                                        },
                                                    });
                                                }}
                                                css={tw`bg-neutral-800/70 border-indigo-500/30 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 pr-16 text-lg font-semibold`}
                                            />
                                            <span css={tw`absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-semibold text-indigo-400 pointer-events-none flex items-center space-x-1`}>
                                                <FontAwesomeIcon icon={faUsers} css={tw`w-3 h-3`} />
                                                <span>อัน</span>
                                            </span>
                                        </div>
                                        <div css={tw`mt-3 p-3 bg-neutral-800/50 rounded-lg border border-indigo-500/10`}>
                                            <p css={tw`text-xs text-neutral-400 flex items-start space-x-2`}>
                                                <FontAwesomeIcon icon={faInfoCircle} css={tw`w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0`} />
                                                <span>
                                                    <strong css={tw`text-indigo-300`}>หมายเหตุ:</strong> กำหนดจำนวนสูงสุดที่ทุกคนรวมกันเช่าได้ 
                                                    ถ้าไม่กำหนด (เว้นว่าง) = ไม่จำกัดจำนวน
                                                </span>
                                            </p>
                                        </div>
                                        {meta.touched && meta.error && (
                                            <p css={tw`mt-2 text-sm text-red-400 flex items-center space-x-1`}>
                                                <FontAwesomeIcon icon={faInfoCircle} css={tw`w-3 h-3`} />
                                                <span>{meta.error}</span>
                                            </p>
                                        )}
                                    </>
                                )}
                            </FormikField>
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
                                        <FontAwesomeIcon icon={faBox} css={tw`w-4 h-4`} />
                                        <span>{isEditMode ? ' บันทึกการแก้ไข' : ' สร้าง Package'}</span>
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

