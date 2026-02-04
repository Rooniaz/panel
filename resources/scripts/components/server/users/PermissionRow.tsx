import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Checkbox from '@/components/elements/Checkbox';
import React from 'react';
import { useStoreState } from 'easy-peasy';
import Label from '@/components/elements/Label';

// Thai translations for permission keys
const PERMISSION_KEY_NAMES: Record<string, string> = {
    console: 'คอนโซล',
    start: 'เริ่ม',
    stop: 'หยุด',
    restart: 'รีสตาร์ท',
    create: 'สร้าง',
    read: 'ดู',
    update: 'แก้ไข',
    delete: 'ลบ',
    archive: 'เก็บถาวร',
    sftp: 'SFTP',
    download: 'ดาวน์โหลด',
    restore: 'กู้คืน',
    view_password: 'ดูรหัสผ่าน',
};

// Thai translations for permission descriptions
const PERMISSION_KEY_DESCRIPTIONS: Record<string, string> = {
    'control.console': 'อนุญาตให้ผู้ใช้ส่งคำสั่งไปยังอินสแตนซ์เซิร์ฟเวอร์ผ่านคอนโซล',
    'control.start': 'อนุญาตให้ผู้ใช้เริ่มเซิร์ฟเวอร์หากมันหยุดอยู่',
    'control.stop': 'อนุญาตให้ผู้ใช้หยุดเซิร์ฟเวอร์หากมันกำลังทำงานอยู่',
    'control.restart': 'อนุญาตให้ผู้ใช้ทำการรีสตาร์ทเซิร์ฟเวอร์ สิ่งนี้ช่วยให้พวกเขาสามารถเริ่มเซิร์ฟเวอร์ได้หากมันออฟไลน์ แต่ไม่สามารถทำให้เซิร์ฟเวอร์อยู่ในสถานะหยุดสมบูรณ์ได้',
    'user.create': 'อนุญาตให้ผู้ใช้สร้างผู้ใช้ย่อยใหม่สำหรับเซิร์ฟเวอร์',
    'user.read': 'อนุญาตให้ผู้ใช้ดูผู้ใช้ย่อยและสิทธิ์ของพวกเขาสำหรับเซิร์ฟเวอร์',
    'user.update': 'อนุญาตให้ผู้ใช้แก้ไขผู้ใช้ย่อยอื่นๆ',
    'user.delete': 'อนุญาตให้ผู้ใช้ลบผู้ใช้ย่อยออกจากเซิร์ฟเวอร์',
    'file.create': 'อนุญาตให้ผู้ใช้สร้างไฟล์และโฟลเดอร์ใหม่',
    'file.read': 'อนุญาตให้ผู้ใช้ดูไฟล์และโฟลเดอร์ที่เกี่ยวข้องกับอินสแตนซ์เซิร์ฟเวอร์ รวมถึงดูเนื้อหาของพวกเขา',
    'file.update': 'อนุญาตให้ผู้ใช้อัปเดตไฟล์และโฟลเดอร์ที่เกี่ยวข้องกับเซิร์ฟเวอร์',
    'file.delete': 'อนุญาตให้ผู้ใช้ลบไฟล์และโฟลเดอร์',
    'file.archive': 'อนุญาตให้ผู้ใช้สร้างไฟล์เก็บถาวรและขยายไฟล์เก็บถาวรที่มีอยู่',
    'file.sftp': 'อนุญาตให้ผู้ใช้ดำเนินการไฟล์ข้างต้นโดยใช้ SFTP client',
    'backup.read': 'อนุญาตให้ผู้ใช้ดูการสำรองข้อมูลสำหรับเซิร์ฟเวอร์',
    'backup.create': 'อนุญาตให้ผู้ใช้สร้างการสำรองข้อมูลใหม่สำหรับเซิร์ฟเวอร์',
    'backup.delete': 'อนุญาตให้ผู้ใช้ลบการสำรองข้อมูลจากเซิร์ฟเวอร์',
    'backup.download': 'อนุญาตให้ผู้ใช้ดาวน์โหลดการสำรองข้อมูลจากเซิร์ฟเวอร์',
    'backup.restore': 'อนุญาตให้ผู้ใช้กู้คืนการสำรองข้อมูลไปยังเซิร์ฟเวอร์',
    'database.create': 'อนุญาตให้ผู้ใช้สร้างฐานข้อมูลใหม่สำหรับเซิร์ฟเวอร์',
    'database.read': 'อนุญาตให้ผู้ใช้ดูฐานข้อมูลสำหรับเซิร์ฟเวอร์',
    'database.update': 'อนุญาตให้ผู้ใช้แก้ไขฐานข้อมูลสำหรับเซิร์ฟเวอร์',
    'database.delete': 'อนุญาตให้ผู้ใช้ลบฐานข้อมูลจากเซิร์ฟเวอร์',
    'database.view_password': 'อนุญาตให้ผู้ใช้ดูรหัสผ่านของฐานข้อมูล',
    'schedule.create': 'อนุญาตให้ผู้ใช้สร้างตารางเวลาใหม่สำหรับเซิร์ฟเวอร์',
    'schedule.read': 'อนุญาตให้ผู้ใช้ดูตารางเวลาสำหรับเซิร์ฟเวอร์',
    'schedule.update': 'อนุญาตให้ผู้ใช้แก้ไขตารางเวลาสำหรับเซิร์ฟเวอร์',
    'schedule.delete': 'อนุญาตให้ผู้ใช้ลบตารางเวลาจากเซิร์ฟเวอร์',
    'allocation.read': 'อนุญาตให้ผู้ใช้ดูการจัดสรรเครือข่ายสำหรับเซิร์ฟเวอร์',
    'allocation.update': 'อนุญาตให้ผู้ใช้แก้ไขการจัดสรรเครือข่ายสำหรับเซิร์ฟเวอร์',
    'startup.read': 'อนุญาตให้ผู้ใช้ดูการตั้งค่าเริ่มต้นสำหรับเซิร์ฟเวอร์',
    'startup.update': 'อนุญาตให้ผู้ใช้แก้ไขการตั้งค่าเริ่มต้นสำหรับเซิร์ฟเวอร์',
    'activity.read': 'อนุญาตให้ผู้ใช้ดูประวัติการใช้งานสำหรับเซิร์ฟเวอร์',
};

const Container = styled.label`
    ${tw`flex items-center border border-transparent rounded md:p-2 transition-colors duration-75`};
    text-transform: none;

    &:not(.disabled) {
        ${tw`cursor-pointer`};

        &:hover {
            ${tw`border-neutral-500 bg-neutral-800`};
        }
    }

    &:not(:first-of-type) {
        ${tw`mt-4 sm:mt-2`};
    }

    &.disabled {
        ${tw`opacity-50`};

        & input[type='checkbox']:not(:checked) {
            ${tw`border-0`};
        }
    }
`;

interface Props {
    permission: string;
    disabled: boolean;
}

const PermissionRow = ({ permission, disabled }: Props) => {
    const [key, pkey] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);

    return (
        <Container htmlFor={`permission_${permission}`} className={disabled ? 'disabled' : undefined}>
            <div css={tw`p-2`}>
                <Checkbox
                    id={`permission_${permission}`}
                    name={'permissions'}
                    value={permission}
                    css={tw`w-5 h-5 mr-2`}
                    disabled={disabled}
                />
            </div>
            <div css={tw`flex-1`}>
                <Label as={'p'} css={tw`font-medium`}>
                    {PERMISSION_KEY_NAMES[pkey] || pkey}
                </Label>
                {permissions[key].keys[pkey].length > 0 && (
                    <p css={tw`text-xs text-neutral-400 mt-1`}>
                        {PERMISSION_KEY_DESCRIPTIONS[permission] || permissions[key].keys[pkey]}
                    </p>
                )}
            </div>
        </Container>
    );
};

export default PermissionRow;
