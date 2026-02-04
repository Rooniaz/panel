import React, { memo, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Console from '@/components/server/console/Console';
import PowerButtons from '@/components/server/console/PowerButtons';
import { Alert } from '@/components/elements/alert';
import styles from './style.module.css';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import classNames from 'classnames';
import UptimeDuration from '@/components/server/UptimeDuration';
import {
    ClipboardCopyIcon,
    ClockIcon,
    ColorSwatchIcon,
    ServerIcon,
    LightningBoltIcon,
    CashIcon,
} from '@heroicons/react/solid';
import Features from '@feature/Features';
import { getServersWithBilling, ServerBilling, ServerWithBilling } from '@/api/spring/servers';
import Toast from '@/components/topup/Toast';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime', number>;

const getStatusText = (status: string | null): string => {
    if (!status) return 'ไม่ทราบสถานะ';
    const statusMap: Record<string, string> = {
        running: 'กำลังทำงาน',
        offline: 'ออฟไลน์',
        starting: 'กำลังเริ่ม',
        stopping: 'กำลังหยุด',
        suspended: 'ระงับ',
        installing: 'กำลังติดตั้ง',
        restoring_backup: 'กำลังกู้คืนสำรอง',
        transferring: 'กำลังโอนย้าย',
    };
    return statusMap[status] || status;
};

const formatThaiDate = (date: Date | undefined | null): string => {
    if (!date) return '—';
    const thaiMonths = [
        'มกราคม',
        'กุมภาพันธ์',
        'มีนาคม',
        'เมษายน',
        'พฤษภาคม',
        'มิถุนายน',
        'กรกฎาคม',
        'สิงหาคม',
        'กันยายน',
        'ตุลาคม',
        'พฤศจิกายน',
        'ธันวาคม',
    ];
    const d = new Date(date);
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
};

const formatLimit = (value?: number | null) => {
    if (!value) return null;
    return bytesToString(mbToBytes(value));
};

const ProgressRow = ({
    label,
    value,
    maxText,
    percent,
}: {
    label: string;
    value: string;
    maxText?: string | null;
    percent: number;
}) => (
    <div className={'space-y-1'}>
        <div className={styles.stat_row}>
            <span className={'text-sm text-white/80'}>{label}</span>
            <span className={'text-sm font-semibold text-white'}>
                {value}
                {maxText ? <span className={'text-white/60'}> / {maxText}</span> : null}
            </span>
        </div>
        <div className={styles.progress_track}>
            <div className={styles.progress_fill} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
        </div>
    </div>
);

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations);
    const pteroInternalId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const pteroIdentifier = ServerContext.useStoreState((state) => state.server.data?.id);
    const pteroUuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const serverData = ServerContext.useStoreState((state) => state.server.data);

    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0 });
    const [billing, setBilling] = useState<ServerBilling | null>(null);
    const [billingError, setBillingError] = useState<string | null>(null);
    const [loadingBilling, setLoadingBilling] = useState<boolean>(false);
    const [packageName, setPackageName] = useState<string | undefined>(undefined);
    const [copiedAddress, setCopiedAddress] = useState(false);

    const allocation = useMemo(() => {
        const match = allocations.find((a) => a.isDefault);
        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    }, [allocations]);

    useEffect(() => {
        if (!connected || !instance) return;
        instance.send(SocketRequest.SEND_STATS);
    }, [connected, instance]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        try {
            const parsed = JSON.parse(data);
            setStats({
                memory: parsed.memory_bytes,
                cpu: parsed.cpu_absolute,
                disk: parsed.disk_bytes,
                uptime: parsed.uptime || 0,
            });
        } catch {
            return;
        }
    });

    const cpuLimit = limits?.cpu ? `${limits.cpu}%` : null;
    const memLimit = formatLimit(limits?.memory);
    const diskLimit = formatLimit(limits?.disk);

    const cpuPercent = limits?.cpu ? Math.min(100, (stats.cpu / limits.cpu) * 100) : stats.cpu;
    const memPercent = limits?.memory ? (stats.memory / mbToBytes(limits.memory)) * 100 : 0;
    const diskPercent = limits?.disk ? (stats.disk / mbToBytes(limits.disk)) * 100 : 0;

    useEffect(() => {
        const fetchBilling = async () => {
            setLoadingBilling(true);
            try {
                const list: ServerWithBilling[] = await getServersWithBilling();
                const match = list.find((s) => {
                    if (pteroIdentifier && s.pterodactylIdentifier === pteroIdentifier) return true;
                    if (pteroInternalId && s.pterodactylServerId === Number(pteroInternalId)) return true;
                    if (pteroUuid && s.pterodactylUuid === pteroUuid) return true;
                    return false;
                });
                if (!match) {
                    setBillingError('ไม่พบข้อมูล billing');
                    setBilling(null);
                    return;
                }
                setBilling({
                    price_per_hour: Number(match.price_per_hour) || 0,
                    started_at: match.started_at,
                    paid_amount: Number(match.paid_amount) || 0,
                    rented_hours: Number(match.rented_hours) || 0,
                    package_name: match.package?.name,
                });
                setPackageName(match.package?.name);
                setBillingError(null);
            } catch (err: any) {
                setBillingError('โหลดข้อมูล billing ไม่สำเร็จ');
                setBilling(null);
            } finally {
                setLoadingBilling(false);
            }
        };
        fetchBilling();
    }, [pteroInternalId, pteroIdentifier, pteroUuid]);

    return (
        <ServerContentBlock title={'Console'}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                        : isInstalling
                        ? 'This server is currently running its installation process and most actions are unavailable.'
                        : 'This server is currently being transferred to another node and all actions are unavailable.'}
                </Alert>
            )}
            <div className={classNames(styles.banner, 'mb-4')}>
                <span className={'font-semibold'}>ระบบจะทำการตัดสิทธิ์บางอย่างหากการใช้งานไม่เป็นไปตามเงื่อนไข</span>
                <span className={'text-amber-200/80'}>โปรดตรวจสอบสถานะและรีสตาร์ทหากจำเป็น</span>
            </div>

            <div className={'grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5'}>
                <div className={styles.card}>
                    <div className={styles.card_header}>
                        <div className={'min-w-0 flex-1'}>
                            <p className={'text-xs uppercase text-white/60 mb-1 flex items-center gap-1.5 sm:gap-2'}>
                                <ServerIcon className={'w-3 h-3 sm:w-4 sm:h-4 text-sky-300 flex-shrink-0'} />
                                <span className={'truncate'}>เซิร์ฟเวอร์ Minecraft</span>
                            </p>
                            <h1
                                className={
                                    'font-header text-xl sm:text-2xl text-white leading-tight line-clamp-1 break-words'
                                }
                            >
                                {name}
                            </h1>
                            <p className={'text-xs sm:text-sm text-white/70 line-clamp-2 mt-1 break-words'}>
                                {packageName || description || '—'}
                            </p>
                        </div>
                        <span
                            className={`${styles.badge} ${
                                !status || status === 'offline'
                                    ? 'bg-red-500/20 text-red-100 border-red-300/30'
                                    : status === 'running'
                                    ? 'bg-green-500/20 text-green-100 border-green-300/30'
                                    : 'bg-yellow-500/20 text-yellow-100 border-yellow-300/30'
                            }`}
                        >
                            {getStatusText(status)}
                        </span>
                    </div>
                    <div className={styles.pill_row}>
                        <span className={styles.badge}>คอนโซล</span>
                        <span className={styles.badge}>เบดร็อก</span>
                        <span className={styles.badge}>บันทึก</span>
                    </div>
                    <div className={'space-y-2 mt-3'}>
                        <div className={styles.stat_row}>
                            <span className={'text-white/70 flex items-center gap-2'}>
                                <CashIcon className={'w-4 h-4 text-sky-300'} />
                                จ่ายไปแล้ว
                            </span>
                            <span className={'text-white font-semibold'}>
                                {billing
                                    ? `${(billing.price_per_hour * billing.rented_hours).toFixed(2)} เครดิต`
                                    : billingError || (loadingBilling ? 'กำลังโหลด...' : '—')}
                            </span>
                        </div>
                        <div className={styles.stat_row}>
                            <span className={'text-white/70 flex items-center gap-2'}>
                                <ClockIcon className={'w-4 h-4 text-sky-300'} />
                                เช่ามาแล้ว
                            </span>
                            <span className={'text-white font-semibold'}>
                                {billing
                                    ? `${billing.rented_hours} ชม`
                                    : billingError || (loadingBilling ? 'กำลังโหลด...' : '—')}
                            </span>
                        </div>
                        <div className={styles.stat_row}>
                            <span className={'text-white/70 flex items-center gap-2'}>
                                <LightningBoltIcon className={'w-4 h-4 text-sky-300'} />
                                ราคาต่อชั่วโมง
                            </span>
                            <span className={'text-white font-semibold'}>
                                {billing
                                    ? `${billing.price_per_hour.toFixed(2)} เครดิต/ชม`
                                    : billingError || (loadingBilling ? 'กำลังโหลด...' : '—')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.card_header}>
                        <div className={'min-w-0 flex-1'}>
                            <p className={'text-xs uppercase text-white/60 mb-1 flex items-center gap-1.5 sm:gap-2'}>
                                <LightningBoltIcon className={'w-3 h-3 sm:w-4 sm:h-4 text-sky-300 flex-shrink-0'} />
                                <span className={'truncate'}>การควบคุม</span>
                            </p>
                        </div>
                        <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                            <PowerButtons className={'flex flex-wrap sm:justify-end gap-1.5 sm:gap-2'} />
                        </Can>
                    </div>

                    <div className={'space-y-3 mt-2'}>
                        <ProgressRow
                            label={'ซีพียู'}
                            value={`${stats.cpu.toFixed(1)}%`}
                            maxText={cpuLimit}
                            percent={cpuPercent}
                        />
                        <ProgressRow
                            label={'หน่วยความจำ'}
                            value={bytesToString(stats.memory)}
                            maxText={memLimit}
                            percent={memPercent}
                        />
                        <ProgressRow
                            label={'ดิสก์'}
                            value={bytesToString(stats.disk)}
                            maxText={diskLimit}
                            percent={diskPercent}
                        />
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.card_header}>
                        <div>
                            <p className={'text-xs uppercase text-white/60 mb-1 flex items-center gap-2'}>
                                <ColorSwatchIcon className={'w-4 h-4 text-sky-300'} />
                                ข้อมูลเซิร์ฟเวอร์
                            </p>
                            <p className={'text-sm text-white/80 flex items-center gap-2'}>
                                ที่อยู่
                                <ClockIcon className={'w-4 h-4 text-white/60'} />
                            </p>
                            <button
                                type={'button'}
                                className={
                                    'text-base font-semibold text-white flex items-center gap-2 hover:text-sky-300 transition-colors'
                                }
                                onClick={async () => {
                                    try {
                                        await navigator?.clipboard?.writeText(allocation);
                                        setCopiedAddress(true);
                                        setTimeout(() => setCopiedAddress(false), 2500);
                                    } catch (err) {
                                        console.error('Failed to copy:', err);
                                    }
                                }}
                                title={'คัดลอกที่อยู่'}
                            >
                                {allocation}
                                <ClipboardCopyIcon className={'w-4 h-4 text-sky-300'} />
                            </button>
                        </div>
                    </div>
                    <div className={'space-y-2 mt-2'}>
                        <div className={styles.stat_row}>
                            <span className={'text-white/70'}>สถานะ</span>
                            <span
                                className={`font-semibold ${
                                    !status || status === 'offline'
                                        ? 'text-red-400'
                                        : status === 'running'
                                        ? 'text-green-400'
                                        : 'text-yellow-400'
                                }`}
                            >
                                {status || '—'}
                            </span>
                        </div>
                        <div className={styles.stat_row}>
                            <span className={'text-white/70'}>เวลาทำงาน</span>
                            <span className={'text-white font-semibold'}>
                                {stats.uptime > 0 ? <UptimeDuration uptime={stats.uptime / 1000} /> : '—'}
                            </span>
                        </div>
                        <div className={styles.stat_row}>
                            <span className={'text-white/70'}>วันที่สร้าง</span>
                            <span className={'text-white font-semibold'}>
                                {formatThaiDate(serverData?.createdAt)}
                            </span>
                        </div>
                        <div className={styles.stat_row}>
                            <span className={'text-white/70'}>พอร์ตหลัก</span>
                            <span className={'text-white font-semibold'}>{allocation}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={'grid grid-cols-4 gap-2 sm:gap-4'}>
                <div className={'flex col-span-4'}>
                    <Spinner.Suspense>
                        <Console />
                    </Spinner.Suspense>
                </div>
            </div>
            <Features enabled={eggFeatures} />
            <Toast show={copiedAddress} type='success' onClose={() => setCopiedAddress(false)} duration={2500}>
                คัดลอก "{allocation}" ลงคลิปบอร์ดแล้ว
            </Toast>
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
