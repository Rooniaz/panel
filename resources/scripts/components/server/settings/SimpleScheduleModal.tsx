import React, { useContext, useEffect, useState } from 'react';
import { Schedule } from '@/api/server/schedules/getServerSchedules';
import Field from '@/components/elements/Field';
import { Form, Formik, FormikHelpers } from 'formik';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import createOrUpdateScheduleTask from '@/api/server/schedules/createOrUpdateScheduleTask';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import ModalContext from '@/context/ModalContext';
import asModal, { AsModalProps } from '@/hoc/asModal';
import Select from '@/components/elements/Select';
import Label from '@/components/elements/Label';

interface Props {
    schedule?: Schedule;
}

interface Values {
    action: string;
    hour: string;
    minute: string;
    enabled: boolean;
}

const SimpleScheduleModal = ({ schedule }: Props & AsModalProps) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:simple');
        };
    }, []);

    const submit = async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:simple');
        
        try {
            // สร้างหรืออัปเดต schedule
            const scheduleData = await createOrUpdateSchedule(uuid, {
                id: schedule?.id,
                name: getActionName(values.action),
                cron: {
                    minute: values.minute,
                    hour: values.hour,
                    dayOfMonth: '*',
                    month: '*',
                    dayOfWeek: '*',
                },
                onlyWhenOnline: false,
                isActive: values.enabled,
            });

            // ถ้าเป็น schedule ใหม่ ให้สร้าง task
            if (!schedule?.id) {
                await createOrUpdateScheduleTask(uuid, scheduleData.id, undefined, {
                    action: 'power',
                    payload: values.action,
                    timeOffset: 0,
                    continueOnFailure: false,
                });
            } else {
                // ถ้าเป็น schedule เก่า ให้อัปเดต task แรก (ถ้ามี)
                const firstTask = schedule.tasks?.[0];
                if (firstTask && firstTask.action === 'power') {
                    await createOrUpdateScheduleTask(uuid, scheduleData.id, firstTask.id, {
                        action: 'power',
                        payload: values.action,
                        timeOffset: 0,
                        continueOnFailure: false,
                    });
                }
            }

            // Refresh schedules เพื่อให้ได้ข้อมูลล่าสุด
            const updatedSchedules = await getServerSchedules(uuid);
            setSchedules(updatedSchedules);
            
            setSubmitting(false);
            dismiss();
        } catch (error) {
            console.error(error);
            setSubmitting(false);
            addError({ key: 'schedule:simple', message: httpErrorToHuman(error) });
        }
    };

    const getActionName = (action: string): string => {
        const names: Record<string, string> = {
            start: 'เปิดเซิร์ฟเวอร์',
            stop: 'ปิดเซิร์ฟเวอร์',
            restart: 'รีสตาร์ท',
        };
        return names[action] || action;
    };

    // หา action จาก task ถ้ามี
    const getInitialAction = (): string => {
        if (schedule?.tasks?.[0]?.action === 'power') {
            return schedule.tasks[0].payload;
        }
        return 'start';
    };

    // หา hour และ minute จาก cron
    const getInitialHour = (): string => {
        return schedule?.cron?.hour || '8';
    };

    const getInitialMinute = (): string => {
        return schedule?.cron?.minute || '0';
    };

    // สร้างตัวเลือกเวลา
    const timeOptions = [
        { label: 'ทุกวัน 08:00', hour: '8', minute: '0' },
        { label: 'ทุกวัน 12:00', hour: '12', minute: '0' },
        { label: 'ทุกวัน 18:00', hour: '18', minute: '0' },
        { label: 'ทุกวัน 22:00', hour: '22', minute: '0' },
        { label: 'ทุกวัน 00:00', hour: '0', minute: '0' },
    ];

    const [selectedTimeOption, setSelectedTimeOption] = useState<string>('');

    // ตรวจสอบว่าเวลาปัจจุบันตรงกับตัวเลือกหรือไม่
    const getCurrentTimeOption = (hour: string, minute: string): string => {
        const found = timeOptions.find(opt => opt.hour === hour && opt.minute === minute);
        return found ? `${found.hour}:${found.minute}` : 'custom';
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                action: getInitialAction(),
                hour: getInitialHour(),
                minute: getInitialMinute(),
                enabled: schedule?.isActive ?? true,
            } as Values}
        >
            {({ isSubmitting, values, setFieldValue }) => {
                // ตรวจสอบว่าเวลาปัจจุบันตรงกับตัวเลือกหรือไม่
                const currentTimeOption = getCurrentTimeOption(values.hour, values.minute);
                const isCustom = currentTimeOption === 'custom';
                
                return (
                <Form>
                    <h3 css={tw`text-2xl mb-6`}>
                        {schedule ? 'แก้ไขตารางเวลา' : 'สร้างตารางเวลาอัตโนมัติ'}
                    </h3>
                    <FlashMessageRender byKey={'schedule:simple'} css={tw`mb-6`} />
                    
                    <div css={tw`mb-6`}>
                        <Label>การกระทํา</Label>
                        <Select
                            name={'action'}
                            value={values.action}
                            onChange={(e) => setFieldValue('action', e.target.value)}
                        >
                            <option value={'start'}>เปิดเซิร์ฟเวอร์</option>
                            <option value={'stop'}>ปิดเซิร์ฟเวอร์</option>
                            <option value={'restart'}>รีสตาร์ท</option>
                        </Select>
                    </div>

                    <div css={tw`mb-6`}>
                        <Label>เวลา</Label>
                        <Select
                            value={currentTimeOption}
                            onChange={(e) => {
                                if (e.target.value === 'custom') {
                                    setSelectedTimeOption('custom');
                                    return;
                                }
                                setSelectedTimeOption('');
                                const [hour, minute] = e.target.value.split(':');
                                setFieldValue('hour', hour);
                                setFieldValue('minute', minute);
                            }}
                        >
                            {timeOptions.map((option) => (
                                <option key={option.label} value={`${option.hour}:${option.minute}`}>
                                    {option.label}
                                </option>
                            ))}
                            <option value={'custom'}>กำหนดเอง</option>
                        </Select>
                        
                        {(isCustom || selectedTimeOption === 'custom') && (
                            <div css={tw`mt-4 grid grid-cols-2 gap-4`}>
                                <div>
                                    <Label>ชั่วโมง (0-23)</Label>
                                    <Field 
                                        name={'hour'} 
                                        type={'number'} 
                                        min={0} 
                                        max={23}
                                        value={values.hour}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setFieldValue('hour', e.target.value);
                                            setSelectedTimeOption('custom');
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label>นาที (0-59)</Label>
                                    <Field 
                                        name={'minute'} 
                                        type={'number'} 
                                        min={0} 
                                        max={59}
                                        value={values.minute}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setFieldValue('minute', e.target.value);
                                            setSelectedTimeOption('custom');
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div css={tw`mt-6 text-right`}>
                        <Button className={'w-full sm:w-auto'} type={'submit'} disabled={isSubmitting}>
                            {schedule ? 'บันทึก' : 'สร้าง'}
                        </Button>
                    </div>
                </Form>
                );
            }}
        </Formik>
    );
};

export default asModal<Props>()(SimpleScheduleModal);

