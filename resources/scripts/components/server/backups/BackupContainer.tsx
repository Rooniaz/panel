import React, { useContext, useEffect, useState } from 'react';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import Can from '@/components/elements/Can';
import CreateBackupButton from '@/components/server/backups/CreateBackupButton';
import FlashMessageRender from '@/components/FlashMessageRender';
import BackupRow from '@/components/server/backups/BackupRow';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudDownloadAlt } from '@fortawesome/free-solid-svg-icons';
import getServerBackups, { Context as ServerBackupContext } from '@/api/swr/getServerBackups';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Pagination from '@/components/elements/Pagination';

const BackupNotification = styled.div`
    ${tw`mb-6 p-4 sm:p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden`}
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
    border-color: rgba(59, 130, 246, 0.3);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.1);

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6);
    }
`;

const NotificationContent = styled.div`
    ${tw`flex items-start gap-4`}
`;

const NotificationIcon = styled.div`
    ${tw`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center`}
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2));
    color: #60a5fa;
`;

const NotificationText = styled.div`
    ${tw`flex-1`}
`;

const NotificationTitle = styled.h3`
    ${tw`text-lg font-bold text-white mb-1`}
    background: linear-gradient(135deg, #ffffff, #a0aec0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const NotificationDescription = styled.p`
    ${tw`text-sm text-neutral-300`}
`;

const BackupContainer = () => {
    const { page, setPage } = useContext(ServerBackupContext);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { data: backups, error, isValidating } = getServerBackups();
    const [backupScheduleTime, setBackupScheduleTime] = useState<{ hour: number; minute: number } | null>(null);

    const backupLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.backups);

    useEffect(() => {
        if (!error) {
            clearFlashes('backups');

            return;
        }

        clearAndAddHttpError({ error, key: 'backups' });
    }, [error]);

    useEffect(() => {
        // Hardcode backup time to 02:00 (ตี 2)
        setBackupScheduleTime({ hour: 2, minute: 0 });
    }, []);

    if (!backups || (error && isValidating)) {
        return <Spinner size={'large'} centered />;
    }

    return (
        <ServerContentBlock title={'Backups'}>
            <FlashMessageRender byKey={'backups'} css={tw`mb-4`} />
            {backupScheduleTime && (
                <BackupNotification>
                    <NotificationContent>
                        <NotificationIcon>
                            <FontAwesomeIcon icon={faCloudDownloadAlt} className={'text-xl'} />
                        </NotificationIcon>
                        <NotificationText>
                            <NotificationTitle>ระบบสำรองข้อมูลอัตโนมัติ</NotificationTitle>
                            <NotificationDescription>
                                ระบบจะทำการสำรองข้อมูลอัตโนมัติทุกวัน เวลา{' '}
                                <strong className={'text-white'}>
                                    {String(backupScheduleTime.hour).padStart(2, '0')}:
                                    {String(backupScheduleTime.minute).padStart(2, '0')}
                                </strong>{' '}
                                น.
                            </NotificationDescription>
                        </NotificationText>
                    </NotificationContent>
                </BackupNotification>
            )}
            <Pagination data={backups} onPageSelect={setPage}>
                {({ items }) =>
                    !items.length ? (
                        // Don't show any error messages if the server has no backups and the user cannot
                        // create additional ones for the server.
                        !backupLimit ? null : (
                            <p css={tw`text-center text-sm text-neutral-300`}>
                                {page > 1
                                    ? 'ดูเหมือนว่าเราแสดงแบ็คอัพหมดแล้ว ลองกลับไปหน้าที่แล้ว'
                                    : 'ดูเหมือนว่ายังไม่มีแบ็คอัพที่เก็บไว้สำหรับเซิร์ฟเวอร์นี้'}
                            </p>
                        )
                    ) : (
                        items.map((backup, index) => (
                            <BackupRow key={backup.uuid} backup={backup} css={index > 0 ? tw`mt-2` : undefined} />
                        ))
                    )
                }
            </Pagination>
            {backupLimit === 0 && (
                <p css={tw`text-center text-sm text-neutral-300`}>
                    ไม่สามารถสร้างแบ็คอัพสำหรับเซิร์ฟเวอร์นี้ได้ เนื่องจากขีดจำกัดแบ็คอัพถูกตั้งเป็น 0
                </p>
            )}
            <Can action={'backup.create'}>
                <div css={tw`mt-6 sm:flex items-center justify-end`}>
                    {backupLimit > 0 && backups.backupCount > 0 && (
                        <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                            สร้างแบ็คอัพ {backups.backupCount} จาก {backupLimit} รายการสำหรับเซิร์ฟเวอร์นี้แล้ว
                        </p>
                    )}
                    {backupLimit > 0 && backups.backupCount < backupLimit ? (
                        <CreateBackupButton css={tw`w-full sm:w-auto`} />
                    ) : backupLimit > 0 && backups.backupCount >= backupLimit ? (
                        <p css={tw`text-sm text-neutral-300`}>
                            ถึงขีดจำกัดแบ็คอัพแล้ว ({backups.backupCount}/{backupLimit})
                        </p>
                    ) : null}
                </div>
            </Can>
        </ServerContentBlock>
    );
};

export default () => {
    const [page, setPage] = useState<number>(1);
    return (
        <ServerBackupContext.Provider value={{ page, setPage }}>
            <BackupContainer />
        </ServerBackupContext.Provider>
    );
};
