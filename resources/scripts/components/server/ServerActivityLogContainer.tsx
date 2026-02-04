import React, { useEffect, useState, useMemo } from 'react';
import { useActivityLogs } from '@/api/server/activity';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { ActivityLogFilters } from '@/api/account/activity';
import Input from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import tw from 'twin.macro';
import Translate from '@/components/elements/Translate';
import { getObjectKeys, isObject } from '@/lib/objects';

// Event types available for filtering
const EVENT_TYPES = [
    { value: '', label: 'ทุกประเภท' },
    { value: 'backup.create', label: 'backup.create' },
    { value: 'billing.renew', label: 'billing.renew' },
    { value: 'console.access', label: 'console.access' },
    { value: 'create.server', label: 'create.server' },
    { value: 'port.create', label: 'port.create' },
    { value: 'schedule.create', label: 'schedule.create' },
    { value: 'schedule.update', label: 'schedule.update' },
];

function wrapProperties(value: unknown): any {
    if (value === null || typeof value === 'string' || typeof value === 'number') {
        return `<strong>${String(value)}</strong>`;
    }

    if (isObject(value)) {
        return getObjectKeys(value).reduce((obj, key) => {
            if (key === 'count' || (typeof key === 'string' && key.endsWith('_count'))) {
                return { ...obj, [key]: value[key] };
            }
            return { ...obj, [key]: wrapProperties(value[key]) };
        }, {} as Record<string, unknown>);
    }

    if (Array.isArray(value)) {
        return value.map(wrapProperties);
    }

    return value;
}

const getStatusIcon = () => {
    // Blue circle with 'i' icon for information
    return (
        <div css={tw`flex items-center justify-center w-6 h-6 rounded-full bg-blue-500`}>
            <span css={tw`text-white text-xs font-bold`}>i</span>
        </div>
    );
};

const getStatusText = () => {
    return 'ข้อมูล';
};

const formatThaiDate = (date: Date): string => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543; // Convert to Buddhist era
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
};

export default () => {
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEventType, setSelectedEventType] = useState('');

    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    // Update filters when event type changes
    useEffect(() => {
        setFilters((value) => ({
            ...value,
            filters: {
                ...value.filters,
                event: selectedEventType || undefined,
            },
            page: 1, // Reset to first page when filter changes
        }));
    }, [selectedEventType]);

    // Filter activities by search query
    const filteredActivities = useMemo(() => {
        if (!data?.items) return [];
        if (!searchQuery.trim()) return data.items;

        const query = searchQuery.toLowerCase();
        return data.items.filter((activity) => {
            const actorEmail = activity.relationships.actor?.email?.toLowerCase() || '';
            const event = activity.event.toLowerCase();
            const ip = activity.ip?.toLowerCase() || '';
            const properties = JSON.stringify(activity.properties).toLowerCase();

            return (
                actorEmail.includes(query) || event.includes(query) || ip.includes(query) || properties.includes(query)
            );
        });
    }, [data?.items, searchQuery]);

    return (
        <ServerContentBlock title={'ประวัติ'}>
            <FlashMessageRender byKey={'server:activity'} />

            {/* Search and Filter Bar */}
            <div css={tw`mb-6 flex flex-col sm:flex-row gap-4`}>
                <div css={tw`flex-1`}>
                    <Input
                        type={'text'}
                        placeholder={'Q ค้นหาประวัติ...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div css={tw`w-full sm:w-48`}>
                    <Select value={selectedEventType} onChange={(e) => setSelectedEventType(e.target.value)}>
                        {EVENT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Activity Table */}
            {!data && isValidating ? (
                <Spinner centered />
            ) : !filteredActivities.length ? (
                <p css={tw`text-sm text-center text-gray-400`}>ไม่พบประวัติการใช้งาน</p>
            ) : (
                <div css={tw`bg-gray-700 rounded`}>
                    <table css={tw`w-full`}>
                        <thead>
                            <tr css={tw`border-b-2 border-gray-800`}>
                                <th css={tw`px-4 py-3 text-left text-sm font-medium text-gray-300`}>
                                    <div css={tw`flex items-center gap-2`}>
                                        สถานะ
                                        <span css={tw`text-gray-500`}>↑↓</span>
                                    </div>
                                </th>
                                <th css={tw`px-4 py-3 text-left text-sm font-medium text-gray-300`}>
                                    <div css={tw`flex items-center gap-2`}>
                                        ประเภท
                                        <span css={tw`text-gray-500`}>↑↓</span>
                                    </div>
                                </th>
                                <th css={tw`px-4 py-3 text-left text-sm font-medium text-gray-300`}>
                                    <div css={tw`flex items-center gap-2`}>
                                        รายละเอียด
                                        <span css={tw`text-gray-500`}>↑↓</span>
                                    </div>
                                </th>
                                <th css={tw`px-4 py-3 text-left text-sm font-medium text-gray-300`}>
                                    <div css={tw`flex items-center gap-2`}>
                                        ผู้ดำเนินการ
                                        <span css={tw`text-gray-500`}>↑↓</span>
                                    </div>
                                </th>
                                <th css={tw`px-4 py-3 text-left text-sm font-medium text-gray-300`}>
                                    <div css={tw`flex items-center gap-2`}>
                                        IP
                                        <span css={tw`text-gray-500`}>↑↓</span>
                                    </div>
                                </th>
                                <th css={tw`px-4 py-3 text-left text-sm font-medium text-gray-300`}>
                                    <div css={tw`flex items-center gap-2`}>
                                        วันที่
                                        <span css={tw`text-gray-500`}>↑↓</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredActivities.map((activity) => {
                                const actor = activity.relationships.actor;
                                const properties = wrapProperties(activity.properties);

                                return (
                                    <tr
                                        key={activity.id}
                                        css={tw`border-b border-gray-800 hover:bg-gray-600 transition-colors`}
                                    >
                                        <td css={tw`px-4 py-3`}>
                                            <div css={tw`flex items-center gap-2`}>
                                                {getStatusIcon()}
                                                <span css={tw`text-sm text-gray-300`}>{getStatusText()}</span>
                                            </div>
                                        </td>
                                        <td css={tw`px-4 py-3`}>
                                            <span css={tw`text-sm text-gray-300 font-mono`}>{activity.event}</span>
                                        </td>
                                        <td css={tw`px-4 py-3`}>
                                            <div css={tw`text-sm text-gray-300`}>
                                                <Translate
                                                    ns={'activity'}
                                                    values={properties}
                                                    i18nKey={activity.event.replace(':', '.')}
                                                />
                                            </div>
                                        </td>
                                        <td css={tw`px-4 py-3`}>
                                            <span css={tw`text-sm text-gray-300`}>{actor?.email || 'ระบบ'}</span>
                                        </td>
                                        <td css={tw`px-4 py-3`}>
                                            <span css={tw`text-sm text-gray-300 font-mono`}>{activity.ip || '-'}</span>
                                        </td>
                                        <td css={tw`px-4 py-3`}>
                                            <span css={tw`text-sm text-gray-300`}>
                                                {formatThaiDate(activity.timestamp)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {data && (
                <PaginationFooter
                    pagination={data.pagination}
                    onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                />
            )}
        </ServerContentBlock>
    );
};
