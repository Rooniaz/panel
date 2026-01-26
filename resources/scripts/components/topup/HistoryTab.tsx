import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock,
    faBuilding,
    faWallet,
    faCheckCircle,
    faTimesCircle,
    faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const Container = styled.div`
    ${tw`w-full px-2 sm:px-4 md:px-6`}
`;

const Card = styled.div`
    ${tw`bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-4 sm:p-6 border border-white/10 backdrop-blur-sm`}
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const SectionTitle = styled.h3`
    ${tw`text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2 sm:space-x-3`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const TableWrapper = styled.div`
    ${tw`overflow-x-auto rounded-lg`}
    &::-webkit-scrollbar {
        height: 8px;
    }
    &::-webkit-scrollbar-track {
        ${tw`bg-neutral-800/50 rounded-lg`}
    }
    &::-webkit-scrollbar-thumb {
        ${tw`bg-neutral-600 rounded-lg hover:bg-neutral-500`}
    }
`;

const Table = styled.table`
    ${tw`w-full rounded-lg overflow-hidden hidden md:table`}
    border-collapse: separate;
    border-spacing: 0;
    min-width: 600px;
`;

const TableHeader = styled.thead`
    ${tw`bg-gradient-to-r from-neutral-700/90 via-neutral-800/90 to-neutral-800/90 backdrop-blur-sm`}
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const TableHeaderCell = styled.th`
    ${tw`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-bold text-cyan-400`}
    border-bottom: 2px solid rgba(56, 189, 248, 0.4);
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
    &:first-child {
        border-top-left-radius: 12px;
        padding-left: 1rem;
        ${tw`sm:pl-6`}
    }
    &:last-child {
        border-top-right-radius: 12px;
        padding-right: 1rem;
        ${tw`sm:pr-6`}
    }
`;

const TableBody = styled.tbody`
    ${tw`bg-neutral-800/50`}
`;

const TableRow = styled.tr`
    ${tw`border-b border-white/5 transition-all duration-200`}
    background: linear-gradient(to right, transparent 0%, transparent 100%);

    &:hover {
        ${tw`bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent`}
        transform: translateX(4px);
        box-shadow: -4px 0 12px rgba(56, 189, 248, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
        border-left: 3px solid rgba(56, 189, 248, 0.5);
    }

    &:last-child {
        border-bottom: none;
    }
`;

const TableCell = styled.td`
    ${tw`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-neutral-300`}

    &:first-child {
        padding-left: 1rem;
        ${tw`sm:pl-6`}
    }
    &:last-child {
        padding-right: 1rem;
        ${tw`sm:pr-6`}
    }
`;

const MethodBadge = styled.span<{ $method?: string }>`
    ${tw`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm text-white border`}
    ${(props) => {
        const methodUpper = props.$method?.toUpperCase() || '';
        if (methodUpper.includes('TRUEMONEY') || methodUpper.includes('TRUE_MONEY')) {
            return `
                background-color: rgba(234, 88, 12, 0.8);
                border-color: rgba(234, 88, 12, 0.5);
            `;
        }
        if (methodUpper.includes('BANK')) {
            return `
                background-color: rgba(59, 130, 246, 0.2);
                border-color: rgba(59, 130, 246, 0.3);
            `;
        }
        return `
            background-color: rgba(75, 85, 99, 0.5);
            border-color: rgba(107, 114, 128, 0.3);
        `;
    }}
`;

const StatusBadge = styled.span<{ $status: string }>`
    ${tw`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm border transition-all duration-200`}
    ${(props) => {
        switch (props.$status?.toUpperCase()) {
            case 'COMPLETED':
            case 'SUCCESS':
                return tw`bg-green-500/20 border-green-500/30 text-green-300`;
            case 'PENDING':
            case 'PROCESSING':
                return tw`bg-yellow-500/20 border-yellow-500/30 text-yellow-300`;
            case 'FAILED':
            case 'REJECTED':
                return tw`bg-red-500/20 border-red-500/30 text-red-300`;
            default:
                return tw`bg-neutral-700/50 border-neutral-600/50 text-neutral-400`;
        }
    }}
`;

const EmptyMessage = styled.div`
    ${tw`text-center py-12 text-neutral-400 flex flex-col items-center justify-center space-y-4`}
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`}
`;

const TableFooter = styled.div`
    ${tw`mt-4 text-center text-xs sm:text-sm text-neutral-400`}
`;

const MobileCard = styled.div`
    ${tw`md:hidden space-y-3`}
`;

const MobileCardItem = styled.div`
    ${tw`bg-gradient-to-br from-neutral-800/90 to-neutral-900/90 rounded-xl p-4 border border-white/5`}
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const MobileCardRow = styled.div`
    ${tw`flex items-center justify-between py-2 border-b border-white/5 last:border-b-0`}
`;

const MobileCardLabel = styled.span`
    ${tw`text-xs text-neutral-400 font-medium`}
`;

const MobileCardValue = styled.div`
    ${tw`text-sm text-neutral-200 font-semibold`}
`;

export interface TopupHistoryItem {
    id: string;
    amount: number;
    type: string;
    date: string;
    status?: string | null;
    note?: string | null;
    externalRef?: string | null;
}

export default () => {
    const [history, setHistory] = useState<TopupHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = localStorage.getItem('auth_token');
                if (!token) {
                    throw new Error('กรุณาเข้าสู่ระบบก่อน');
                }

                const res = await fetch(`${SPRING_BOOT_API_URL}/api/wallet/topup/history`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (res.status === 401) {
                    throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
                }

                if (!res.ok) {
                    throw new Error(`ไม่สามารถโหลดประวัติได้ (${res.status})`);
                }

                const data = await res.json();
                // Backend returns paginated response: { hasNext, totalPages, totalRecords, records: [...] }
                let items: TopupHistoryItem[] = [];
                let total = 0;
                if (data.records && Array.isArray(data.records)) {
                    items = data.records.map((record: any) => ({
                        id: record.id,
                        amount: record.amount,
                        type: record.type,
                        date: record.date,
                        status: record.status || 'SUCCESS', // Default to SUCCESS if not provided
                        note: record.note || null,
                        externalRef: record.externalRef || null,
                    }));
                    total = data.totalRecords || data.records.length;
                } else if (Array.isArray(data)) {
                    // Fallback: if it's a direct array
                    items = data;
                    total = data.length;
                }

                setHistory(items);
                setTotalRecords(total);
            } catch (err: any) {
                setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดประวัติ');
                console.error('Failed to fetch topup history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) {
            return '-';
        }
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            const months = [
                'ม.ค.',
                'ก.พ.',
                'มี.ค.',
                'เม.ย.',
                'พ.ค.',
                'มิ.ย.',
                'ก.ค.',
                'ส.ค.',
                'ก.ย.',
                'ต.ค.',
                'พ.ย.',
                'ธ.ค.',
            ];
            const day = date.getDate();
            const month = months[date.getMonth()];
            const year = date.getFullYear() + 543; // Convert to Buddhist year
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${day} ${month} ${year} ${hours}:${minutes}`;
        } catch {
            return dateString;
        }
    };

    const getMethodIcon = (method: string | null | undefined) => {
        if (!method) {
            return <FontAwesomeIcon icon={faWallet} className={'w-3 h-3 mr-1'} />;
        }
        const methodUpper = method.toUpperCase();
        if (methodUpper.includes('BANK')) {
            return <FontAwesomeIcon icon={faBuilding} className={'w-3 h-3 mr-1'} />;
        }
        if (methodUpper.includes('TRUEMONEY') || methodUpper.includes('TRUE_MONEY')) {
            return <FontAwesomeIcon icon={faWallet} className={'w-3 h-3 mr-1'} />;
        }
        return <FontAwesomeIcon icon={faWallet} className={'w-3 h-3 mr-1'} />;
    };

    const formatMethod = (method: string | null | undefined) => {
        if (!method) {
            return 'N/A';
        }
        const methodUpper = method.toUpperCase();
        if (methodUpper.includes('TRUEMONEY') || methodUpper === 'TRUEMONEY' || methodUpper === 'TRUE_MONEY') {
            return 'ทรูมันนี่';
        }
        if (methodUpper.includes('BANK')) {
            return 'BANK';
        }
        return method;
    };

    const getStatusIcon = (status: string | null | undefined) => {
        if (!status) {
            return <FontAwesomeIcon icon={faClock} className={'w-4 h-4'} />;
        }
        switch (status.toUpperCase()) {
            case 'COMPLETED':
            case 'SUCCESS':
                return <FontAwesomeIcon icon={faCheckCircle} className={'w-4 h-4'} />;
            case 'PENDING':
            case 'PROCESSING':
                return <FontAwesomeIcon icon={faSpinner} className={'w-4 h-4 animate-spin'} />;
            case 'FAILED':
            case 'REJECTED':
                return <FontAwesomeIcon icon={faTimesCircle} className={'w-4 h-4'} />;
            default:
                return <FontAwesomeIcon icon={faClock} className={'w-4 h-4'} />;
        }
    };

    const formatStatus = (status: string | null | undefined) => {
        if (!status) {
            return 'UNKNOWN';
        }
        const statusUpper = status.toUpperCase();
        if (statusUpper === 'COMPLETED' || statusUpper === 'SUCCESS') {
            return 'SUCCESS';
        }
        if (statusUpper === 'PENDING' || statusUpper === 'PROCESSING') {
            return 'PENDING';
        }
        if (statusUpper === 'FAILED' || statusUpper === 'REJECTED') {
            return 'FAILED';
        }
        return statusUpper;
    };

    if (loading) {
        return (
            <Container>
                <Card>
                    <SectionTitle>
                        <FontAwesomeIcon icon={faClock} />
                        <span>ประวัติเติมเงิน</span>
                    </SectionTitle>
                    <div css={tw`flex items-center justify-center py-12`}>
                        <Spinner size={'large'} />
                    </div>
                </Card>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Card>
                    <SectionTitle>
                        <FontAwesomeIcon icon={faClock} />
                        <span>ประวัติเติมเงิน</span>
                    </SectionTitle>
                    <ErrorMessage>{error}</ErrorMessage>
                </Card>
            </Container>
        );
    }

    return (
        <Container>
            <Card>
                <SectionTitle>
                    <FontAwesomeIcon icon={faClock} />
                    <span>ประวัติเติมเงิน</span>
                </SectionTitle>

                {history.length === 0 ? (
                    <EmptyMessage>
                        <div css={tw`text-4xl sm:text-6xl mb-4 opacity-30`}>📋</div>
                        <div css={tw`text-lg sm:text-xl font-semibold mb-2`}>ไม่มีประวัติการเติมเงิน</div>
                        <div css={tw`text-xs sm:text-sm text-neutral-500`}>
                            เมื่อคุณทำการเติมเงิน ประวัติจะแสดงที่นี่
                        </div>
                    </EmptyMessage>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <TableWrapper css={tw`hidden md:block`}>
                            <Table>
                                <TableHeader>
                                    <tr>
                                        <TableHeaderCell>วันที่</TableHeaderCell>
                                        <TableHeaderCell>ประเภท</TableHeaderCell>
                                        <TableHeaderCell>จำนวนเงิน</TableHeaderCell>
                                        <TableHeaderCell>สถานะ</TableHeaderCell>
                                        <TableHeaderCell>รหัสอ้างอิง</TableHeaderCell>
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell css={tw`text-neutral-300`}>{formatDate(item.date)}</TableCell>
                                            <TableCell>
                                                <MethodBadge $method={item.type}>
                                                    {getMethodIcon(item.type)}
                                                    <span>{formatMethod(item.type)}</span>
                                                </MethodBadge>
                                            </TableCell>
                                            <TableCell css={tw`font-semibold text-cyan-400`}>
                                                {item.amount ? Number(item.amount).toFixed(0) : '0'} บาท
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge $status={item.status || 'SUCCESS'}>
                                                    {getStatusIcon(item.status || 'SUCCESS')}
                                                    <span css={tw`ml-2`}>{formatStatus(item.status || 'SUCCESS')}</span>
                                                </StatusBadge>
                                            </TableCell>
                                            <TableCell css={tw`font-mono text-xs text-neutral-300`}>
                                                {item.id ? item.id.split('-')[0] : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableWrapper>

                        {/* Mobile Card View */}
                        <MobileCard>
                            {history.map((item) => (
                                <MobileCardItem key={item.id}>
                                    <MobileCardRow>
                                        <MobileCardLabel>วันที่</MobileCardLabel>
                                        <MobileCardValue css={tw`text-neutral-300`}>
                                            {formatDate(item.date)}
                                        </MobileCardValue>
                                    </MobileCardRow>
                                    <MobileCardRow>
                                        <MobileCardLabel>ประเภท</MobileCardLabel>
                                        <MobileCardValue>
                                            <MethodBadge $method={item.type}>
                                                {getMethodIcon(item.type)}
                                                <span>{formatMethod(item.type)}</span>
                                            </MethodBadge>
                                        </MobileCardValue>
                                    </MobileCardRow>
                                    <MobileCardRow>
                                        <MobileCardLabel>จำนวนเงิน</MobileCardLabel>
                                        <MobileCardValue css={tw`font-semibold text-cyan-400`}>
                                            {item.amount ? Number(item.amount).toFixed(0) : '0'} บาท
                                        </MobileCardValue>
                                    </MobileCardRow>
                                    <MobileCardRow>
                                        <MobileCardLabel>สถานะ</MobileCardLabel>
                                        <MobileCardValue>
                                            <StatusBadge $status={item.status || 'SUCCESS'}>
                                                {getStatusIcon(item.status || 'SUCCESS')}
                                                <span css={tw`ml-2`}>{formatStatus(item.status || 'SUCCESS')}</span>
                                            </StatusBadge>
                                        </MobileCardValue>
                                    </MobileCardRow>
                                    <MobileCardRow>
                                        <MobileCardLabel>รหัสอ้างอิง</MobileCardLabel>
                                        <MobileCardValue css={tw`font-mono text-xs text-neutral-300`}>
                                            {item.id ? item.id.split('-')[0] : '-'}
                                        </MobileCardValue>
                                    </MobileCardRow>
                                </MobileCardItem>
                            ))}
                        </MobileCard>
                    </>
                )}

                {history.length > 0 && (
                    <TableFooter>
                        แสดง {history.length} รายการ จากทั้งหมด {totalRecords} รายการ
                    </TableFooter>
                )}
            </Card>
        </Container>
    );
};
