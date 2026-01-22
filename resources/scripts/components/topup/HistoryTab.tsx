import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheckCircle, faTimesCircle, faSpinner, faBuilding, faWallet } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const Container = styled.div`
    ${tw`w-full`}
`;

const Card = styled.div`
    ${tw`bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-6 border border-white/10 backdrop-blur-sm`}
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;

const SectionTitle = styled.h3`
    ${tw`text-2xl font-bold text-white mb-6 flex items-center space-x-3`}
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
    ${tw`w-full rounded-lg overflow-hidden`}
    border-collapse: separate;
    border-spacing: 0;
    min-width: 1000px;
`;

const TableHeader = styled.thead`
    ${tw`bg-gradient-to-r from-neutral-700/90 via-neutral-800/90 to-neutral-800/90 backdrop-blur-sm`}
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const TableHeaderCell = styled.th`
    ${tw`px-4 md:px-6 py-4 text-left text-xs md:text-sm font-bold text-neutral-100 uppercase tracking-wider`}
    border-bottom: 2px solid rgba(56, 189, 248, 0.4);
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
    &:first-child {
        border-top-left-radius: 12px;
        padding-left: 1.5rem;
    }
    &:last-child {
        border-top-right-radius: 12px;
        padding-right: 1.5rem;
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
    ${tw`px-4 md:px-6 py-4 text-xs md:text-sm text-neutral-300`}

    &:first-child {
        padding-left: 1.5rem;
    }
    &:last-child {
        padding-right: 1.5rem;
    }
`;

const StatusBadge = styled.span<{ $status: string }>`
    ${tw`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm border transition-all duration-200`}
    ${(props) => {
        switch (props.$status) {
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

const MethodBadge = styled.span`
    ${tw`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm bg-blue-500/20 border border-blue-500/30 text-blue-300`}
`;

const EmptyMessage = styled.div`
    ${tw`text-center py-12 text-neutral-400 flex flex-col items-center justify-center space-y-4`}
    
    &::before {
        content: '📋';
        font-size: 3rem;
        opacity: 0.5;
    }
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400`}
`;

export interface TopupHistoryItem {
    id: number;
    amount: number;
    method: string;
    status: string;
    note?: string | null;
    createdAt: string;
    confirmedAt?: string | null;
    externalRef?: string | null;
}

export default () => {
    const [history, setHistory] = useState<TopupHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                // Backend returns array directly: [{ id, amount, method, status, note, createdAt, confirmedAt, externalRef }, ...]
                const items: TopupHistoryItem[] = Array.isArray(data) ? data : [];

                setHistory(items);
            } catch (err: any) {
                setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดประวัติ');
                console.error('Failed to fetch topup history:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const getStatusIcon = (status: string) => {
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

    const getMethodIcon = (method: string) => {
        if (method.toUpperCase().includes('BANK')) {
            return <FontAwesomeIcon icon={faBuilding} className={'w-3 h-3 mr-1'} />;
        }
        return <FontAwesomeIcon icon={faWallet} className={'w-3 h-3 mr-1'} />;
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
                        <div css={tw`text-6xl mb-4 opacity-30`}>📋</div>
                        <div css={tw`text-xl font-semibold mb-2`}>ไม่มีประวัติการเติมเงิน</div>
                        <div css={tw`text-sm text-neutral-500`}>เมื่อคุณทำการเติมเงิน ประวัติจะแสดงที่นี่</div>
                    </EmptyMessage>
                ) : (
                    <TableWrapper>
                        <Table>
                            <TableHeader>
                                <tr>
                                    <TableHeaderCell>วันที่/เวลา</TableHeaderCell>
                                    <TableHeaderCell>ยอดเงิน</TableHeaderCell>
                                    <TableHeaderCell>วิธีการ</TableHeaderCell>
                                    <TableHeaderCell>สถานะ</TableHeaderCell>
                                    <TableHeaderCell>รหัสอ้างอิง</TableHeaderCell>
                                    <TableHeaderCell>หมายเหตุ</TableHeaderCell>
                                </tr>
                            </TableHeader>
                            <TableBody>
                                {history.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell css={tw`font-mono text-xs`}>
                                            {formatDate(item.createdAt)}
                                            {item.confirmedAt && (
                                                <div css={tw`text-xs text-neutral-500 mt-1`}>
                                                    ยืนยัน: {formatDate(item.confirmedAt)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell css={tw`font-semibold text-white`}>
                                            {Number(item.amount).toFixed(2)} บาท
                                        </TableCell>
                                        <TableCell>
                                            <MethodBadge>
                                                {getMethodIcon(item.method)}
                                                <span>{item.method || 'N/A'}</span>
                                            </MethodBadge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge $status={item.status}>
                                                {getStatusIcon(item.status)}
                                                <span css={tw`ml-2`}>{item.status || 'UNKNOWN'}</span>
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell css={tw`font-mono text-xs text-neutral-400`}>
                                            {item.externalRef || '-'}
                                        </TableCell>
                                        <TableCell css={tw`text-xs text-neutral-400 max-w-xs truncate`} title={item.note || ''}>
                                            {item.note || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableWrapper>
                )}
            </Card>
        </Container>
    );
};

