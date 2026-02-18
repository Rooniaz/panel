import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import tw, { css } from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle,
    faCreditCard,
    faClock,
    faHourglassHalf,
    faSync,
} from '@fortawesome/free-solid-svg-icons';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { getServersWithBilling } from '@/api/spring/servers';
import { ServerContext } from '@/state/server';

const SuspendedContainer = styled.div`
    ${tw`flex flex-col items-center justify-center min-h-[60vh] p-6`}
`;

const SuspendedCard = styled.div`
    ${tw`max-w-2xl w-full rounded-2xl p-8 border-2`}
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.15) 100%);
    border-color: rgba(239, 68, 68, 0.3);
    box-shadow: 0 20px 60px rgba(239, 68, 68, 0.2), 0 0 0 1px rgba(239, 68, 68, 0.1);
`;

const IconWrapper = styled.div`
    ${tw`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto`}
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3));
    border: 3px solid rgba(239, 68, 68, 0.4);
`;

const Title = styled.h2`
    ${tw`text-3xl font-bold text-white mb-4 text-center`}
    background: linear-gradient(135deg, #ffffff 0%, #fca5a5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const Message = styled.p`
    ${tw`text-lg text-neutral-200 mb-6 text-center`}
`;

const ReasonBox = styled.div`
    ${tw`bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6`}
`;

const ReasonLabel = styled.div`
    ${tw`text-sm text-red-300 mb-2 font-semibold`}
`;

const ReasonText = styled.div`
    ${tw`text-base text-white`}
`;

const InfoRow = styled.div`
    ${tw`flex items-center gap-3 mb-4 text-neutral-300`}
`;

const ButtonGroup = styled.div`
    ${tw`flex flex-col sm:flex-row gap-4 justify-center mt-6`}
`;

const TopupButton = styled.button`
    ${tw`px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2`}
`;

const BackButton = styled.button`
    ${tw`px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2`}
`;

const RefreshButton = styled.button`
    ${tw`px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2`}
`;

const CountdownBox = styled.div`
    ${tw`rounded-xl p-5 mb-6 border-2`}
    background: rgba(245, 158, 11, 0.2);
    border-color: rgba(245, 158, 11, 0.4);
    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.2);
`;

const CountdownTitle = styled.div`
    ${tw`text-lg font-bold mb-3 flex items-center gap-2`}
    color: #fcd34d; /* yellow-300 equivalent */
`;

const CountdownTimer = styled.div`
    ${tw`text-4xl font-bold text-white mb-2 text-center font-mono`}
    background: linear-gradient(135deg, #ffffff 0%, #fbbf24 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
`;

const CountdownWarning = styled.div`
    ${tw`text-sm text-center`}
    color: #fde68a; /* yellow-200 equivalent */
`;

interface SuspendedMessageProps {
    serverName?: string;
    suspendedReason?: string;
    suspendedAt?: string;
}

export default ({ serverName, suspendedReason, suspendedAt }: SuspendedMessageProps) => {
    const history = useHistory();
    const pteroIdentifier = ServerContext.useStoreState((state) => state.server.data?.id);
    const pteroInternalId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const pteroUuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const [timeRemaining, setTimeRemaining] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
        total: number;
    } | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'ไม่ทราบ';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    // คำนวณเวลาที่เหลือก่อนจะถูกลบ (3 ชั่วโมงจาก suspendedAt)
    // Backend Scheduler จะลบ server อัตโนมัติเมื่อเวลาหมด
    useEffect(() => {
        if (!suspendedAt) {
            setTimeRemaining(null);
            return;
        }

        const calculateTimeRemaining = () => {
            try {
                const suspendedDate = new Date(suspendedAt);
                const deletionTime = new Date(suspendedDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
                const now = new Date();
                const diffMs = deletionTime.getTime() - now.getTime();

                if (diffMs <= 0) {
                    // เวลาหมดแล้ว - Backend Scheduler จะลบให้อัตโนมัติ
                    setTimeRemaining({
                        hours: 0,
                        minutes: 0,
                        seconds: 0,
                        total: 0,
                    });
                    return;
                }

                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

                setTimeRemaining({
                    hours,
                    minutes,
                    seconds,
                    total: diffMs,
                });
            } catch (err) {
                setTimeRemaining(null);
            }
        };

        calculateTimeRemaining();
        // อัพเดททุกวินาที
        const interval = setInterval(calculateTimeRemaining, 1000);
        return () => clearInterval(interval);
    }, [suspendedAt]);

    // ตรวจสอบว่า server ถูกลบไปแล้วหรือยัง (Backend Scheduler จะลบให้อัตโนมัติ)
    useEffect(() => {
        if (!timeRemaining || timeRemaining.total > 0) {
            return;
        }

        // เวลาหมดแล้ว - ตรวจสอบว่า server ถูกลบไปแล้วหรือยัง
        const checkIfServerDeleted = async () => {
            try {
                const list = await getServersWithBilling();
                const match = list.find((s) => {
                    if (pteroIdentifier && s.pterodactylIdentifier === pteroIdentifier) return true;
                    if (pteroInternalId && s.pterodactylServerId === Number(pteroInternalId)) return true;
                    if (pteroUuid && s.pterodactylUuid === pteroUuid) return true;
                    return false;
                });

                // ถ้าไม่พบ server แสดงว่า Backend ลบไปแล้ว
                if (!match) {
                    console.log('[SuspendedMessage] Server has been deleted by Backend Scheduler');
                    // Redirect to dashboard
                    setTimeout(() => {
                        history.push('/servers');
                    }, 1000);
                }
            } catch (err) {
                // Ignore error - Backend will handle deletion
                console.warn('[SuspendedMessage] Failed to check if server deleted:', err);
            }
        };

        // ตรวจสอบทุก 30 วินาทีว่า server ถูกลบไปแล้วหรือยัง
        // (Backend Scheduler.cleanupExpiredServers() ทำงานทุก 30 นาที และจะลบ server ที่เกิน grace period)
        checkIfServerDeleted();
        const interval = setInterval(checkIfServerDeleted, 30000);
        return () => clearInterval(interval);
    }, [timeRemaining, pteroIdentifier, pteroInternalId, pteroUuid, history]);

    // ตรวจสอบสถานะอัตโนมัติทุก 30 วินาที เพื่อตรวจสอบว่า server ถูก resume แล้วหรือยัง
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const list = await getServersWithBilling();
                const match = list.find((s) => {
                    if (pteroIdentifier && s.pterodactylIdentifier === pteroIdentifier) return true;
                    if (pteroInternalId && s.pterodactylServerId === Number(pteroInternalId)) return true;
                    if (pteroUuid && s.pterodactylUuid === pteroUuid) return true;
                    return false;
                });
                
                // ถ้า server ไม่ถูก suspend แล้ว ให้ refresh หน้า
                if (match && !match.isSuspended && match.status !== 'SUSPENDED') {
                    // Refresh server data
                    if (pteroUuid) {
                        await getServer(pteroUuid);
                    }
                    // Reload page to show normal console
                    window.location.reload();
                }
            } catch (err) {
                // Ignore error
                console.warn('Failed to check server status:', err);
            }
        };

        // ตรวจสอบทันทีเมื่อ component mount
        checkServerStatus();
        
        // ตรวจสอบทุก 15 วินาที เพื่อตรวจสอบว่า server ถูก resume แล้วหรือยัง
        // (Backend ทำงานทุก 1 นาที และจะ resume ทันทีเมื่อเติมเงิน)
        const interval = setInterval(checkServerStatus, 15000);
        return () => clearInterval(interval);
    }, [pteroIdentifier, pteroInternalId, pteroUuid, getServer]);

    const handleRefresh = async () => {
        setIsChecking(true);
        try {
            const list = await getServersWithBilling();
            const match = list.find((s) => {
                if (pteroIdentifier && s.pterodactylIdentifier === pteroIdentifier) return true;
                if (pteroInternalId && s.pterodactylServerId === Number(pteroInternalId)) return true;
                if (pteroUuid && s.pterodactylUuid === pteroUuid) return true;
                return false;
            });
            
            // ถ้า server ไม่ถูก suspend แล้ว ให้ refresh หน้า
            if (match && !match.isSuspended && match.status !== 'SUSPENDED') {
                // Refresh server data
                if (pteroUuid) {
                    await getServer(pteroUuid);
                }
                // Reload page to show normal console
                window.location.reload();
            } else {
                alert('ยังไม่พบการเปลี่ยนแปลง กรุณารอสักครู่แล้วลองอีกครั้ง');
            }
        } catch (err) {
            alert('ไม่สามารถตรวจสอบสถานะได้ กรุณาลองอีกครั้ง');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <ServerContentBlock title={serverName || 'Server'}>
            <SuspendedContainer>
                <SuspendedCard>
                    <IconWrapper>
                        <FontAwesomeIcon icon={faExclamationTriangle} className={'text-4xl text-red-400'} />
                    </IconWrapper>
                    <Title>⚠️ Server ถูกระงับการใช้งาน</Title>
                    <Message>เซิร์ฟเวอร์นี้ถูกระงับการใช้งานเนื่องจากเครดิตไม่เพียงพอ</Message>

                    {suspendedReason && (
                        <ReasonBox>
                            <ReasonLabel>สาเหตุ:</ReasonLabel>
                            <ReasonText>{suspendedReason}</ReasonText>
                        </ReasonBox>
                    )}

                    {suspendedAt && (
                        <InfoRow>
                            <FontAwesomeIcon icon={faClock} className={'text-neutral-400'} />
                            <span>ถูก suspend เมื่อ: {formatDate(suspendedAt)}</span>
                        </InfoRow>
                    )}

                    {timeRemaining && timeRemaining.total > 0 && (
                        <CountdownBox>
                            <CountdownTitle>
                                <FontAwesomeIcon icon={faHourglassHalf} style={{ color: '#fbbf24' }} />
                                <span>เวลาที่เหลือก่อนจะถูกลบ</span>
                            </CountdownTitle>
                            <CountdownTimer>
                                {String(timeRemaining.hours).padStart(2, '0')}:
                                {String(timeRemaining.minutes).padStart(2, '0')}:
                                {String(timeRemaining.seconds).padStart(2, '0')}
                            </CountdownTimer>
                            <CountdownWarning>
                                ⚠️ หากไม่เติมเครดิตภายในเวลานี้ เซิร์ฟเวอร์จะถูกลบอัตโนมัติ
                            </CountdownWarning>
                        </CountdownBox>
                    )}

                    {timeRemaining && timeRemaining.total <= 0 && (
                        <CountdownBox
                            css={css`
                                background: rgba(239, 68, 68, 0.2);
                                border-color: rgba(239, 68, 68, 0.4);
                            `}
                        >
                            <CountdownTitle css={tw`text-red-300`}>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                <span>หมดเวลาแล้ว</span>
                            </CountdownTitle>
                            <CountdownWarning css={tw`text-red-200`}>
                                เซิร์ฟเวอร์จะถูกลบอัตโนมัติโดยระบบภายใน 30 นาที
                                <br />
                                (Backend Scheduler.cleanupExpiredServers() จะลบให้อัตโนมัติ)
                            </CountdownWarning>
                        </CountdownBox>
                    )}

                    <InfoRow>
                        <FontAwesomeIcon icon={faCreditCard} className={'text-neutral-400'} />
                        <span>กรุณาเติมเครดิตเพื่อใช้งานต่อ</span>
                    </InfoRow>

                    <ButtonGroup>
                        <TopupButton onClick={() => history.push('/topup')}>
                            <FontAwesomeIcon icon={faCreditCard} />
                            <span>เติมเครดิต</span>
                        </TopupButton>
                        <RefreshButton onClick={handleRefresh} disabled={isChecking}>
                            <FontAwesomeIcon icon={faSync} className={isChecking ? 'animate-spin' : ''} />
                            <span>{isChecking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบอีกครั้ง'}</span>
                        </RefreshButton>
                        <BackButton onClick={() => history.push('/servers')}>
                            <span>กลับไปหน้าเซิร์ฟเวอร์</span>
                        </BackButton>
                    </ButtonGroup>
                </SuspendedCard>
            </SuspendedContainer>
        </ServerContentBlock>
    );
};

