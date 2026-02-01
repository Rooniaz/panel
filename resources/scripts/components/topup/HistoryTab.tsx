import React, { useState, useEffect, useMemo } from 'react';
import tw, { css } from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock,
    faBuilding,
    faWallet,
    faCheckCircle,
    faTimesCircle,
    faSpinner,
    faLandmark,
    faChartLine,
    faCoins,
} from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const MainContainer = styled.div`
    ${tw`w-full space-y-6`}
`;

const HeaderCard = styled.div`
    ${tw`rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
    }
`;

const HeaderTitle = styled.h2`
    ${tw`text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3 flex-wrap`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const HeaderSubtitle = styled.p`
    ${tw`text-neutral-400 text-xs sm:text-sm`}
`;

const NavigationButtons = styled.div`
    ${tw`flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4`}
`;

const NavButton = styled.button<{ $active?: boolean }>`
    ${tw`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm`}
    ${({ $active }) =>
        $active
            ? css`
                  background: linear-gradient(135deg, #3b82f6, #22d3ee);
                  color: white;
                  box-shadow: 0 8px 25px rgba(34, 211, 238, 0.35), 0 0 0 1px rgba(56, 189, 248, 0.2);
                  transform: translateY(-2px);
              `
            : css`
                  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  color: #9ca3af;
                  &:hover {
                      background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
                      border-color: rgba(59, 130, 246, 0.3);
                      color: white;
                      transform: translateY(-1px);
                  }
              `}
`;

const NavButtonIcon = styled(FontAwesomeIcon)`
    ${tw`w-3 h-3 sm:w-4 sm:h-4`}
`;

const StatsGrid = styled.div`
    ${tw`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6`}
`;

const StatCard = styled.div`
    ${tw`rounded-xl p-4 sm:p-5 border border-white/10 backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const StatIcon = styled.div`
    ${tw`w-12 h-12 rounded-xl flex items-center justify-center mb-3`}
    background: linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
`;

const StatLabel = styled.div`
    ${tw`text-xs text-neutral-400 mb-1`}
`;

const StatValue = styled.div`
    ${tw`text-2xl font-bold text-white`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const HistoryCard = styled.div`
    ${tw`rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const SectionTitle = styled.h3`
    ${tw`text-2xl font-bold text-white mb-6 flex items-center gap-3`}
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
    min-width: 700px;
`;

const TableHeader = styled.thead`
    ${tw`bg-gradient-to-r from-neutral-800/90 via-neutral-800/95 to-neutral-800/90 backdrop-blur-sm`}
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const TableHeaderCell = styled.th`
    ${tw`px-4 py-4 text-left text-sm font-bold text-cyan-400`}
    border-bottom: 2px solid rgba(56, 189, 248, 0.4);
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
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
    ${tw`bg-neutral-800/30`}
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
    ${tw`px-4 py-4 text-sm text-neutral-300`}

    &:first-child {
        padding-left: 1.5rem;
    }
    &:last-child {
        padding-right: 1.5rem;
    }
`;

const MethodBadge = styled.span<{ $method?: string }>`
    ${tw`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm text-white border gap-2`}
    ${(props) => {
        const methodUpper = props.$method?.toUpperCase() || '';
        if (methodUpper.includes('TRUEMONEY') || methodUpper.includes('TRUE_MONEY')) {
            return `
                background: linear-gradient(135deg, rgba(234, 88, 12, 0.8) 0%, rgba(249, 115, 22, 0.8) 100%);
                border-color: rgba(234, 88, 12, 0.5);
                box-shadow: 0 2px 8px rgba(234, 88, 12, 0.3);
            `;
        }
        if (methodUpper.includes('BANK')) {
            return `
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(34, 211, 238, 0.2) 100%);
                border-color: rgba(59, 130, 246, 0.4);
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
            `;
        }
        return `
            background: linear-gradient(135deg, rgba(75, 85, 99, 0.5) 0%, rgba(107, 114, 128, 0.4) 100%);
            border-color: rgba(107, 114, 128, 0.3);
        `;
    }}
`;

const StatusBadge = styled.span<{ $status: string }>`
    ${tw`inline-flex items-center px-3 py-1.5 rounded-lg font-semibold text-sm border transition-all duration-200 gap-2`}
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
    ${tw`text-center py-16 text-neutral-400 flex flex-col items-center justify-center space-y-4`}
`;

const EmptyIconWrapper = styled.div`
    ${tw`w-24 h-24 rounded-full flex items-center justify-center mb-4`}
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
    border: 2px dashed rgba(59, 130, 246, 0.3);
`;

const EmptyIcon = styled.div`
    ${tw`text-5xl opacity-50`}
`;

const EmptyTitle = styled.div`
    ${tw`text-xl font-bold mb-2 text-white`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const EmptyDescription = styled.div`
    ${tw`text-sm text-neutral-500 max-w-md`}
`;

const ErrorMessage = styled.div`
    ${tw`bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300`}
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
`;

const TableFooter = styled.div`
    ${tw`mt-6 text-center text-sm text-neutral-400`}
    padding: 1rem;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
`;

const MobileCard = styled.div`
    ${tw`md:hidden space-y-4`}
`;

const MobileCardItem = styled.div`
    ${tw`rounded-xl p-4 sm:p-5 border border-white/10`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const MobileCardHeader = styled.div`
    ${tw`flex items-center justify-between mb-4 pb-4 border-b border-white/10`}
`;

const MobileCardDate = styled.div`
    ${tw`text-sm text-neutral-400`}
`;

const MobileCardAmount = styled.div`
    ${tw`text-lg sm:text-xl font-bold text-cyan-400`}
`;

const MobileCardRow = styled.div`
    ${tw`flex items-center justify-between py-3 border-b border-white/5 last:border-b-0`}
`;

const MobileCardLabel = styled.span`
    ${tw`text-xs text-neutral-400 font-medium flex items-center gap-2`}
`;

const MobileCardValue = styled.div`
    ${tw`text-sm text-neutral-200 font-semibold`}
`;

const SpinnerContainer = styled.div`
    ${tw`flex items-center justify-center py-16`}
`;

const TableWrapperDesktop = styled(TableWrapper)`
    ${tw`hidden md:block`}
`;

const TableCellNeutral = styled(TableCell)`
    ${tw`text-neutral-300`}
`;

const TableCellCyan = styled(TableCell)`
    ${tw`font-bold text-cyan-400 text-base`}
`;

const TableCellMono = styled(TableCell)`
    ${tw`font-mono text-xs text-neutral-300`}
`;

const StatusSpan = styled.span``;

const MobileCardValueMono = styled(MobileCardValue)`
    ${tw`font-mono text-xs text-neutral-300`}
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

interface Props {
    onNavigateToBank?: () => void;
    onNavigateToTrueMoney?: () => void;
    onNavigateToHistory?: () => void;
    activeTab?: 'bank' | 'truemoney' | 'history';
}

export default ({ onNavigateToBank, onNavigateToTrueMoney, onNavigateToHistory, activeTab = 'history' }: Props) => {
    const [history, setHistory] = useState<TopupHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalRecords, setTotalRecords] = useState(0);

    const stats = useMemo(() => {
        const totalAmount = history.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const successCount = history.filter((item) => {
            const status = item.status?.toUpperCase() || 'SUCCESS';
            return status === 'SUCCESS' || status === 'COMPLETED';
        }).length;
        const pendingCount = history.filter((item) => {
            const status = item.status?.toUpperCase() || '';
            return status === 'PENDING' || status === 'PROCESSING';
        }).length;

        return {
            totalAmount,
            successCount,
            pendingCount,
            totalCount: history.length,
        };
    }, [history]);

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
                let items: TopupHistoryItem[] = [];
                let total = 0;
                if (data.records && Array.isArray(data.records)) {
                    items = data.records.map((record: any) => ({
                        id: record.id,
                        amount: record.amount,
                        type: record.type,
                        date: record.date,
                        status: record.status || 'SUCCESS',
                        note: record.note || null,
                        externalRef: record.externalRef || null,
                    }));
                    total = data.totalRecords || data.records.length;
                } else if (Array.isArray(data)) {
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
            const year = date.getFullYear() + 543;
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${day} ${month} ${year} ${hours}:${minutes}`;
        } catch {
            return dateString;
        }
    };

    const getMethodIcon = (method: string | null | undefined) => {
        if (!method) {
            return <FontAwesomeIcon icon={faWallet} className={'w-3 h-3'} />;
        }
        const methodUpper = method.toUpperCase();
        if (methodUpper.includes('BANK')) {
            return <FontAwesomeIcon icon={faBuilding} className={'w-3 h-3'} />;
        }
        if (methodUpper.includes('TRUEMONEY') || methodUpper.includes('TRUE_MONEY')) {
            return <FontAwesomeIcon icon={faWallet} className={'w-3 h-3'} />;
        }
        return <FontAwesomeIcon icon={faWallet} className={'w-3 h-3'} />;
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
            <MainContainer>
                <HeaderCard>
                    <HeaderTitle>
                        <FontAwesomeIcon icon={faClock} />
                        <span>ประวัติเติมเงิน</span>
                    </HeaderTitle>
                    <HeaderSubtitle>ดูประวัติการเติมเงินทั้งหมดของคุณ</HeaderSubtitle>
                    <NavigationButtons>
                        <NavButton $active={activeTab === 'bank'} onClick={onNavigateToBank}>
                            <NavButtonIcon icon={faLandmark} />
                            <span>ธนาคาร</span>
                        </NavButton>
                        <NavButton $active={activeTab === 'truemoney'} onClick={onNavigateToTrueMoney}>
                            <NavButtonIcon icon={faWallet} />
                            <span>เติมเงินผ่าน TrueMoney</span>
                        </NavButton>
                        <NavButton $active={activeTab === 'history'} onClick={onNavigateToHistory}>
                            <NavButtonIcon icon={faClock} />
                            <span>ประวัติเติมเงิน</span>
                        </NavButton>
                    </NavigationButtons>
                </HeaderCard>
                <HistoryCard>
                    <SectionTitle>
                        <FontAwesomeIcon icon={faClock} />
                        <span>ประวัติเติมเงิน</span>
                    </SectionTitle>
                    <SpinnerContainer>
                        <Spinner size={'large'} />
                    </SpinnerContainer>
                </HistoryCard>
            </MainContainer>
        );
    }

    if (error) {
        return (
            <MainContainer>
                <HeaderCard>
                    <HeaderTitle>
                        <FontAwesomeIcon icon={faClock} />
                        <span>ประวัติเติมเงิน</span>
                    </HeaderTitle>
                    <HeaderSubtitle>ดูประวัติการเติมเงินทั้งหมดของคุณ</HeaderSubtitle>
                    <NavigationButtons>
                        <NavButton $active={activeTab === 'bank'} onClick={onNavigateToBank}>
                            <NavButtonIcon icon={faLandmark} />
                            <span>ธนาคาร</span>
                        </NavButton>
                        <NavButton $active={activeTab === 'truemoney'} onClick={onNavigateToTrueMoney}>
                            <NavButtonIcon icon={faWallet} />
                            <span>เติมเงินผ่าน TrueMoney</span>
                        </NavButton>
                        <NavButton $active={activeTab === 'history'} onClick={onNavigateToHistory}>
                            <NavButtonIcon icon={faClock} />
                            <span>ประวัติเติมเงิน</span>
                        </NavButton>
                    </NavigationButtons>
                </HeaderCard>
                <HistoryCard>
                    <SectionTitle>
                        <FontAwesomeIcon icon={faClock} />
                        <span>ประวัติเติมเงิน</span>
                    </SectionTitle>
                    <ErrorMessage>{error}</ErrorMessage>
                </HistoryCard>
            </MainContainer>
        );
    }

    return (
        <MainContainer>
            <HeaderCard>
                <HeaderTitle>
                    <FontAwesomeIcon icon={faClock} />
                    <span>ประวัติเติมเงิน</span>
                </HeaderTitle>
                <HeaderSubtitle>ดูประวัติการเติมเงินทั้งหมดของคุณ</HeaderSubtitle>
                <NavigationButtons>
                    <NavButton $active={activeTab === 'bank'} onClick={onNavigateToBank}>
                        <NavButtonIcon icon={faLandmark} />
                        <span>ธนาคาร</span>
                    </NavButton>
                    <NavButton $active={activeTab === 'truemoney'} onClick={onNavigateToTrueMoney}>
                        <NavButtonIcon icon={faWallet} />
                        <span>เติมเงินผ่าน TrueMoney</span>
                    </NavButton>
                    <NavButton $active={activeTab === 'history'} onClick={onNavigateToHistory}>
                        <NavButtonIcon icon={faClock} />
                        <span>ประวัติเติมเงิน</span>
                    </NavButton>
                </NavigationButtons>
            </HeaderCard>

            {history.length > 0 && (
                <StatsGrid>
                    <StatCard>
                        <StatIcon>
                            <FontAwesomeIcon icon={faCoins} className={'text-white text-xl'} />
                        </StatIcon>
                        <StatLabel>ยอดรวมทั้งหมด</StatLabel>
                        <StatValue>{stats.totalAmount.toFixed(2)} บาท</StatValue>
                    </StatCard>
                    <StatCard>
                        <StatIcon>
                            <FontAwesomeIcon icon={faCheckCircle} className={'text-white text-xl'} />
                        </StatIcon>
                        <StatLabel>สำเร็จ</StatLabel>
                        <StatValue>{stats.successCount} รายการ</StatValue>
                    </StatCard>
                    <StatCard>
                        <StatIcon>
                            <FontAwesomeIcon icon={faChartLine} className={'text-white text-xl'} />
                        </StatIcon>
                        <StatLabel>ทั้งหมด</StatLabel>
                        <StatValue>{stats.totalCount} รายการ</StatValue>
                    </StatCard>
                </StatsGrid>
            )}

            <HistoryCard>
                <SectionTitle>
                    <FontAwesomeIcon icon={faClock} />
                    <span>ประวัติเติมเงิน</span>
                </SectionTitle>

                {history.length === 0 ? (
                    <EmptyMessage>
                        <EmptyIconWrapper>
                            <EmptyIcon>📋</EmptyIcon>
                        </EmptyIconWrapper>
                        <EmptyTitle>ไม่มีประวัติการเติมเงิน</EmptyTitle>
                        <EmptyDescription>เมื่อคุณทำการเติมเงิน ประวัติจะแสดงที่นี่</EmptyDescription>
                    </EmptyMessage>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <TableWrapperDesktop>
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
                                            <TableCellNeutral>{formatDate(item.date)}</TableCellNeutral>
                                            <TableCell>
                                                <MethodBadge $method={item.type}>
                                                    {getMethodIcon(item.type)}
                                                    <span>{formatMethod(item.type)}</span>
                                                </MethodBadge>
                                            </TableCell>
                                            <TableCellCyan>
                                                {item.amount ? Number(item.amount).toFixed(2) : '0.00'} บาท
                                            </TableCellCyan>
                                            <TableCell>
                                                <StatusBadge $status={item.status || 'SUCCESS'}>
                                                    {getStatusIcon(item.status || 'SUCCESS')}
                                                    <StatusSpan>{formatStatus(item.status || 'SUCCESS')}</StatusSpan>
                                                </StatusBadge>
                                            </TableCell>
                                            <TableCellMono>{item.id ? item.id.split('-')[0] : '-'}</TableCellMono>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableWrapperDesktop>

                        {/* Mobile Card View */}
                        <MobileCard>
                            {history.map((item) => (
                                <MobileCardItem key={item.id}>
                                    <MobileCardHeader>
                                        <MobileCardDate>{formatDate(item.date)}</MobileCardDate>
                                        <MobileCardAmount>
                                            {item.amount ? Number(item.amount).toFixed(2) : '0.00'} บาท
                                        </MobileCardAmount>
                                    </MobileCardHeader>
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
                                        <MobileCardLabel>สถานะ</MobileCardLabel>
                                        <MobileCardValue>
                                            <StatusBadge $status={item.status || 'SUCCESS'}>
                                                {getStatusIcon(item.status || 'SUCCESS')}
                                                <StatusSpan>{formatStatus(item.status || 'SUCCESS')}</StatusSpan>
                                            </StatusBadge>
                                        </MobileCardValue>
                                    </MobileCardRow>
                                    <MobileCardRow>
                                        <MobileCardLabel>รหัสอ้างอิง</MobileCardLabel>
                                        <MobileCardValueMono>
                                            {item.id ? item.id.split('-')[0] : '-'}
                                        </MobileCardValueMono>
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
            </HistoryCard>
        </MainContainer>
    );
};
