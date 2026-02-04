import React, { useContext, useEffect, useRef } from 'react';
import { Subuser } from '@/state/server/subusers';
import { Form, Formik } from 'formik';
import { array, object, string } from 'yup';
import Field from '@/components/elements/Field';
import { Actions, useStoreActions, useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import { ServerContext } from '@/state/server';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { usePermissions } from '@/plugins/usePermissions';
import { useDeepCompareMemo } from '@/plugins/useDeepCompareMemo';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import PermissionTitleBox from '@/components/server/users/PermissionTitleBox';
import asModal from '@/hoc/asModal';
import PermissionRow from '@/components/server/users/PermissionRow';
import ModalContext from '@/context/ModalContext';

// Thai translations for permission categories
const PERMISSION_CATEGORY_NAMES: Record<string, string> = {
    control: 'การควบคุม',
    user: 'ผู้ใช้',
    file: 'ไฟล์',
    backup: 'แบ็คอัพ',
    database: 'ฐานข้อมูล',
    schedule: 'ตารางเวลา',
    allocation: 'การจัดสรร',
    startup: 'เริ่มต้น',
    activity: 'ประวัติ',
    websocket: 'Websocket',
};

// Thai translations for permission descriptions
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    control: 'สิทธิ์ที่ควบคุมความสามารถของผู้ใช้ในการควบคุมสถานะพลังงานของเซิร์ฟเวอร์ หรือส่งคำสั่ง',
    user: 'สิทธิ์ที่อนุญาตให้ผู้ใช้จัดการผู้ใช้ย่อยอื่นๆ บนเซิร์ฟเวอร์ พวกเขาจะไม่สามารถแก้ไขบัญชีของตัวเอง หรือกำหนดสิทธิ์ที่พวกเขาไม่มี',
    file: 'สิทธิ์ที่ควบคุมการเข้าถึงระบบไฟล์ของเซิร์ฟเวอร์',
    backup: 'สิทธิ์ที่ควบคุมการเข้าถึงการสำรองข้อมูลของเซิร์ฟเวอร์',
    database: 'สิทธิ์ที่ควบคุมการเข้าถึงฐานข้อมูลของเซิร์ฟเวอร์',
    schedule: 'สิทธิ์ที่ควบคุมการเข้าถึงตารางเวลาของเซิร์ฟเวอร์',
    allocation: 'สิทธิ์ที่ควบคุมการเข้าถึงการจัดสรรเครือข่ายของเซิร์ฟเวอร์',
    startup: 'สิทธิ์ที่ควบคุมการเข้าถึงการตั้งค่าเริ่มต้นของเซิร์ฟเวอร์',
    activity: 'สิทธิ์ที่ควบคุมการเข้าถึงประวัติการใช้งานของเซิร์ฟเวอร์',
    websocket: 'อนุญาตให้ผู้ใช้เชื่อมต่อกับ websocket ของเซิร์ฟเวอร์ เพื่อดูผลลัพธ์คอนโซลและสถิติเซิร์ฟเวอร์แบบเรียลไทม์',
};

type Props = {
    subuser?: Subuser;
};

interface Values {
    email: string;
    permissions: string[];
}

const EditSubuserModal = ({ subuser }: Props) => {
    const ref = useRef<HTMLHeadingElement>(null);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSubuser = ServerContext.useStoreActions((actions) => actions.subusers.appendSubuser);
    const { clearFlashes, clearAndAddHttpError } = useStoreActions(
        (actions: Actions<ApplicationStore>) => actions.flashes
    );
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const isRootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const permissions = useStoreState((state) => state.permissions.data);
    // The currently logged in user's permissions. We're going to filter out any permissions
    // that they should not need.
    const loggedInPermissions = ServerContext.useStoreState((state) => state.server.permissions);
    const [canEditUser] = usePermissions(subuser ? ['user.update'] : ['user.create']);

    // The permissions that can be modified by this user.
    const editablePermissions = useDeepCompareMemo(() => {
        const cleaned = Object.keys(permissions).map((key) =>
            Object.keys(permissions[key].keys).map((pkey) => `${key}.${pkey}`)
        );

        const list: string[] = ([] as string[]).concat.apply([], Object.values(cleaned));

        if (isRootAdmin || (loggedInPermissions.length === 1 && loggedInPermissions[0] === '*')) {
            return list;
        }

        return list.filter((key) => loggedInPermissions.indexOf(key) >= 0);
    }, [isRootAdmin, permissions, loggedInPermissions]);

    const submit = (values: Values) => {
        setPropOverrides({ showSpinnerOverlay: true });
        clearFlashes('user:edit');

        createOrUpdateSubuser(uuid, values, subuser)
            .then((subuser) => {
                appendSubuser(subuser);
                dismiss();
            })
            .catch((error) => {
                console.error(error);
                setPropOverrides(null);
                clearAndAddHttpError({ key: 'user:edit', error });

                if (ref.current) {
                    ref.current.scrollIntoView();
                }
            });
    };

    useEffect(
        () => () => {
            clearFlashes('user:edit');
        },
        []
    );

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    email: subuser?.email || '',
                    permissions: subuser?.permissions || [],
                } as Values
            }
            validationSchema={object().shape({
                email: string()
                    .max(191, 'อีเมลต้องไม่เกิน 191 ตัวอักษร')
                    .email('ต้องระบุอีเมลที่ถูกต้อง')
                    .required('ต้องระบุอีเมลที่ถูกต้อง'),
                permissions: array().of(string()),
            })}
        >
            <Form>
                <div css={tw`flex justify-between`}>
                    <h2 css={tw`text-2xl`} ref={ref}>
                        {subuser
                            ? `${canEditUser ? 'แก้ไข' : 'ดู'} สิทธิ์สำหรับ ${subuser.email}`
                            : 'สร้างผู้ใช้ย่อยใหม่'}
                    </h2>
                    <div>
                        <Button type={'submit'} css={tw`w-full sm:w-auto`}>
                            {subuser ? 'บันทึก' : 'เชิญผู้ใช้'}
                        </Button>
                    </div>
                </div>
                <FlashMessageRender byKey={'user:edit'} css={tw`mt-4`} />
                {!isRootAdmin && loggedInPermissions[0] !== '*' && (
                    <div css={tw`mt-4 pl-4 py-2 border-l-4 border-cyan-400`}>
                        <p css={tw`text-sm text-neutral-300`}>
                            คุณสามารถเลือกได้เฉพาะสิทธิ์ที่บัญชีของคุณได้รับมอบหมายเท่านั้นเมื่อสร้างหรือแก้ไขผู้ใช้อื่น
                        </p>
                    </div>
                )}
                {!subuser && (
                    <div css={tw`mt-6`}>
                        <Field
                            name={'email'}
                            label={'อีเมลผู้ใช้'}
                            description={'กรอกอีเมลของผู้ใช้ที่คุณต้องการเชิญเป็นผู้ใช้ย่อยสำหรับเซิร์ฟเวอร์นี้'}
                        />
                    </div>
                )}
                <div css={tw`my-6`}>
                    {Object.keys(permissions)
                        .filter((key) => key !== 'websocket')
                        .map((key, index) => (
                            <PermissionTitleBox
                                key={`permission_${key}`}
                                title={PERMISSION_CATEGORY_NAMES[key] || key}
                                isEditable={canEditUser}
                                permissions={Object.keys(permissions[key].keys).map((pkey) => `${key}.${pkey}`)}
                                css={index > 0 ? tw`mt-4` : undefined}
                            >
                                <p css={tw`text-sm text-neutral-400 mb-4`}>
                                    {PERMISSION_DESCRIPTIONS[key] || permissions[key].description}
                                </p>
                                {Object.keys(permissions[key].keys).map((pkey) => (
                                    <PermissionRow
                                        key={`permission_${key}.${pkey}`}
                                        permission={`${key}.${pkey}`}
                                        disabled={!canEditUser || editablePermissions.indexOf(`${key}.${pkey}`) < 0}
                                    />
                                ))}
                            </PermissionTitleBox>
                        ))}
                </div>
                <Can action={subuser ? 'user.update' : 'user.create'}>
                    <div css={tw`pb-6 flex justify-end`}>
                        <Button type={'submit'} css={tw`w-full sm:w-auto`}>
                            {subuser ? 'บันทึก' : 'เชิญผู้ใช้'}
                        </Button>
                    </div>
                </Can>
            </Form>
        </Formik>
    );
};

export default asModal<Props>({
    top: false,
})(EditSubuserModal);
