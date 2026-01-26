import React, { useState, useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faServer, faSpinner, faUser } from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';
import Fade from '@/components/elements/Fade';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const ModalMask = styled.div`
    ${tw`fixed z-50 overflow-auto flex w-full inset-0 items-center justify-center p-4`}
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
    ${tw`max-w-4xl w-full bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-6 space-y-6 border border-white/10 backdrop-blur-sm relative`}
    max-height: calc(90vh - 2rem);
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    margin: auto;
`;

const CloseButton = styled.button`
    ${tw`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors`}
`;

const Title = styled.h2`
    ${tw`text-2xl font-bold text-white mb-6 flex items-center space-x-3`}
`;

const UserInfoSection = styled.div`
    ${tw`bg-neutral-900/50 rounded-xl p-4 border border-white/5`}
`;

const UserInfoRow = styled.div`
    ${tw`flex items-center justify-between py-2 border-b border-white/5 last:border-b-0`}
`;

const UserInfoLabel = styled.div`
    ${tw`text-neutral-400 text-sm`}
`;

const UserInfoValue = styled.div`
    ${tw`text-white font-medium`}
`;

const ServersSection = styled.div`
    ${tw`space-y-4`}
`;

const ServersTitle = styled.h3`
    ${tw`text-lg font-bold text-white mb-4`}
`;

const ServerCard = styled.div`
    ${tw`bg-neutral-900/50 rounded-xl p-4 border border-white/5 hover:border-blue-500/30 transition-colors`}
`;

const ServerName = styled.div`
    ${tw`text-white font-semibold text-lg mb-2 flex items-center gap-2`}
`;

const ServerInfo = styled.div`
    ${tw`grid grid-cols-2 md:grid-cols-3 gap-4 mt-3`}
`;

const ServerInfoItem = styled.div``;

const ServerInfoLabel = styled.div`
    ${tw`text-neutral-400 text-xs mb-1`}
`;

const ServerInfoValue = styled.div`
    ${tw`text-white text-sm`}
`;

const LoadingContainer = styled.div`
    ${tw`flex items-center justify-center py-12`}
`;

const EmptyContainer = styled.div`
    ${tw`flex flex-col items-center justify-center py-12 text-neutral-400`}
`;

interface User {
    id: number;
    username: string;
    email: string;
    credit: number;
    createdAt?: string;
    registrationDate?: string;
}

interface Server {
    id: number;
    name?: string;
    serverName?: string;
    gameType?: string;
    version?: string;
    status?: string;
    createdAt?: string;
    edition?: string;
    impl?: string;
}

interface Props {
    user: User;
    visible: boolean;
    onClose: () => void;
}

export default ({ user, visible, onClose }: Props) => {
    const [servers, setServers] = useState<Server[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserDetail = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setError('ไม่พบ token');
                setLoading(false);
                return;
            }

            const response = await fetch(`${SPRING_BOOT_API_URL}/api/admin/users/${user.id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // If response is not JSON, use default message
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // Handle different field names for servers
            if (data.rentedServers && Array.isArray(data.rentedServers)) {
                // Response format: { rentedServers: [...] }
                setServers(data.rentedServers);
            } else if (data.servers && Array.isArray(data.servers)) {
                // Response format: { servers: [...] }
                setServers(data.servers);
            } else {
                setServers([]);
            }
        } catch (err: any) {
            console.error('Failed to fetch user detail:', err);
            setError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchUserDetail();
        }
    }, [visible, user.id]);

    if (!visible) {
        return null;
    }

    const content = (
        <Fade in={visible} timeout={150} appear unmountOnExit>
            <ModalMask onClick={onClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <CloseButton onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </CloseButton>

                    <Title>
                        <FontAwesomeIcon icon={faUser} css={tw`text-blue-400`} />
                        <span>รายละเอียดผู้ใช้: {user.username}</span>
                    </Title>

                    <UserInfoSection>
                        <UserInfoRow>
                            <UserInfoLabel>ชื่อผู้ใช้</UserInfoLabel>
                            <UserInfoValue>{user.username}</UserInfoValue>
                        </UserInfoRow>
                        <UserInfoRow>
                            <UserInfoLabel>อีเมล</UserInfoLabel>
                            <UserInfoValue>{user.email}</UserInfoValue>
                        </UserInfoRow>
                        <UserInfoRow>
                            <UserInfoLabel>เครดิตคงเหลือ</UserInfoLabel>
                            <UserInfoValue>{user.credit.toFixed(2)} B</UserInfoValue>
                        </UserInfoRow>
                        <UserInfoRow>
                            <UserInfoLabel>วันที่สมัคร</UserInfoLabel>
                            <UserInfoValue>
                                {user.registrationDate || user.createdAt
                                    ? new Date(user.registrationDate || user.createdAt || '').toLocaleDateString(
                                          'th-TH',
                                          {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          }
                                      )
                                    : '-'}
                            </UserInfoValue>
                        </UserInfoRow>
                    </UserInfoSection>

                    <ServersSection>
                        <ServersTitle>
                            <FontAwesomeIcon icon={faServer} css={tw`mr-2`} />
                            เซิร์ฟเวอร์ที่เช่า ({servers.length})
                        </ServersTitle>

                        {loading ? (
                            <LoadingContainer>
                                <FontAwesomeIcon icon={faSpinner} spin css={tw`text-2xl text-neutral-400`} />
                            </LoadingContainer>
                        ) : error ? (
                            <EmptyContainer>
                                <div css={tw`text-red-400 mb-2`}>เกิดข้อผิดพลาด</div>
                                <div css={tw`text-sm`}>{error}</div>
                            </EmptyContainer>
                        ) : servers.length === 0 ? (
                            <EmptyContainer>
                                <FontAwesomeIcon icon={faServer} css={tw`text-4xl mb-2`} />
                                <div>ผู้ใช้รายนี้ยังไม่มีการเช่าเซิร์ฟเวอร์</div>
                            </EmptyContainer>
                        ) : (
                            servers.map((server) => (
                                <ServerCard key={server.id}>
                                    <ServerName>
                                        <FontAwesomeIcon icon={faServer} css={tw`text-blue-400`} />
                                        {server.serverName || server.name || `Server #${server.id}`}
                                    </ServerName>
                                    <ServerInfo>
                                        {server.gameType && (
                                            <ServerInfoItem>
                                                <ServerInfoLabel>ประเภทเกม</ServerInfoLabel>
                                                <ServerInfoValue>{server.gameType}</ServerInfoValue>
                                            </ServerInfoItem>
                                        )}
                                        {server.version && (
                                            <ServerInfoItem>
                                                <ServerInfoLabel>เวอร์ชัน</ServerInfoLabel>
                                                <ServerInfoValue>{server.version}</ServerInfoValue>
                                            </ServerInfoItem>
                                        )}
                                        {server.status && (
                                            <ServerInfoItem>
                                                <ServerInfoLabel>สถานะ</ServerInfoLabel>
                                                <ServerInfoValue
                                                    css={
                                                        server.status === 'ACTIVE'
                                                            ? tw`text-green-400`
                                                            : tw`text-red-400`
                                                    }
                                                >
                                                    {server.status}
                                                </ServerInfoValue>
                                            </ServerInfoItem>
                                        )}
                                        {server.createdAt && (
                                            <ServerInfoItem>
                                                <ServerInfoLabel>วันที่สร้าง</ServerInfoLabel>
                                                <ServerInfoValue>
                                                    {new Date(server.createdAt).toLocaleDateString('th-TH', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </ServerInfoValue>
                                            </ServerInfoItem>
                                        )}
                                    </ServerInfo>
                                </ServerCard>
                            ))
                        )}
                    </ServersSection>
                </ModalContent>
            </ModalMask>
        </Fade>
    );

    return createPortal(content, document.body);
};
