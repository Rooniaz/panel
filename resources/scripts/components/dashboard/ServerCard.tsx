import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHdd, faMemory, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components/macro';
import isEqual from 'react-fast-compare';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const CardContainer = styled(Link)<{ $backgroundImage?: string; $status?: ServerPowerState }>`
    ${tw`relative rounded-lg overflow-hidden transition-all duration-300 hover:transform hover:scale-[1.02]`};
    ${tw`bg-neutral-800 border-2 shadow-xl`};
    min-height: 220px;
    display: flex;
    flex-direction: column;
    background-image: ${({ $backgroundImage }) => ($backgroundImage ? `url(${$backgroundImage})` : 'none')};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    ${({ $backgroundImage }) =>
        !$backgroundImage && tw`bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800`};

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${({ $backgroundImage }) =>
            $backgroundImage
                ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.75))'
                : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.85))'};
        z-index: 1;
    }

    ${({ $status }) =>
        !$status || $status === 'offline'
            ? tw`border-red-500/30 hover:border-red-500/60`
            : $status === 'running'
            ? tw`border-green-500/30 hover:border-green-500/60`
            : tw`border-yellow-500/30 hover:border-yellow-500/60`};
`;

const CardContent = styled.div`
    ${tw`relative z-10 flex flex-col h-full p-6 text-white`};
`;

const CardHeader = styled.div`
    ${tw`mb-4`};
`;

const ServerName = styled.h3`
    ${tw`text-2xl font-bold mb-1 text-white`};
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.5);
`;

const ServerSubtitle = styled.p`
    ${tw`text-sm text-neutral-200 uppercase tracking-wider font-medium`};
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.9);
`;

const StatsContainer = styled.div`
    ${tw`mt-auto space-y-3`};
`;

const StatRow = styled.div<{ $alarm: boolean }>`
    ${tw`flex items-center justify-between`};
    ${({ $alarm }) => ($alarm ? tw`text-red-300` : tw`text-neutral-200`)};
`;

const StatIcon = styled(FontAwesomeIcon)<{ $alarm: boolean }>`
    ${tw`mr-3 text-lg`};
    ${({ $alarm }) => ($alarm ? tw`text-red-400` : tw`text-neutral-400`)};
`;

const StatInfo = styled.div`
    ${tw`flex-1`};
`;

const StatValue = styled.span`
    ${tw`text-sm font-semibold`};
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

const StatusBadge = styled.div<{ $status?: ServerPowerState }>`
    ${tw`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold z-20`};
    ${({ $status }) =>
        !$status || $status === 'offline'
            ? tw`bg-red-500/80 text-red-100`
            : $status === 'running'
            ? tw`bg-green-500/80 text-green-100`
            : tw`bg-yellow-500/80 text-yellow-100`};
    backdrop-filter: blur(4px);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

type Timer = ReturnType<typeof setInterval>;

interface ServerCardProps {
    server: Server;
    backgroundImage?: string;
}

export default memo(({ server, backgroundImage }: ServerCardProps) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [cardBackground, setCardBackground] = useState<string | undefined>(backgroundImage);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    // Default background images based on egg name, description, or server name
    const getDefaultBackground = (eggName?: string, description?: string, serverName?: string): string | undefined => {
        const base = process.env.PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        const bedrockBg = `${base}/bedrock.png?v=1`;
        const vanillaBg = `${base}/vanilla.png?v=1`;
        const modBg = `${base}/mod.png?v=1`;
        const pluginBg = `${base}/plugin.jpg?v=1`;
        const crossBg = `${base}/cross.jpg?v=1`;

        // รวม egg name, description, และ server name เพื่อตรวจสอบ
        const combinedText = `${eggName || ''} ${description || ''} ${serverName || ''}`.toLowerCase();

        // Bedrock
        if (combinedText.includes('bedrock') || combinedText.includes('mcbe')) {
            return bedrockBg;
        }

        // Cross-play (Paper + Geyser) - ตรวจสอบจาก server name, egg name, หรือ description
        if (combinedText.includes('geyser') || combinedText.includes('cross')) {
            return crossBg;
        }

        // Mod (Forge/Fabric)
        if (combinedText.includes('forge') || combinedText.includes('fabric')) {
            return modBg;
        }

        // Plugin (Paper/Spigot without Geyser)
        if (combinedText.includes('paper') || combinedText.includes('spigot')) {
            return pluginBg;
        }

        // Vanilla Minecraft
        if (combinedText.includes('minecraft') || combinedText.includes('mc') || combinedText.includes('vanilla')) {
            return vanillaBg;
        }

        // DayZ backgrounds
        if (combinedText.includes('dayz')) {
            return 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop';
        }
        // Rust backgrounds
        if (combinedText.includes('rust')) {
            return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop';
        }
        // Database backgrounds
        if (
            combinedText.includes('mysql') ||
            combinedText.includes('mongo') ||
            combinedText.includes('database') ||
            combinedText.includes('db')
        ) {
            return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop';
        }
        // Discord bot backgrounds
        if (combinedText.includes('discord') || combinedText.includes('bot')) {
            return 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800&h=600&fit=crop';
        }

        return undefined;
    };

    // Set default background based on egg name, description, or server name
    useEffect(() => {
        if (!cardBackground && (server.egg?.name || server.description || server.name)) {
            const defaultBg = getDefaultBackground(server.egg?.name, server.description, server.name);
            if (defaultBg) {
                setCardBackground(defaultBg);
            }
        }
    }, [server.egg?.name, server.description, server.name, cardBackground]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';

    // Determine game type for subtitle display
    const getGameType = (eggName?: string, description?: string, serverName?: string): string => {
        // รวม egg name, description, และ server name เพื่อตรวจสอบ
        const combinedText = `${eggName || ''} ${description || ''} ${serverName || ''}`.toLowerCase();

        // Bedrock
        if (combinedText.includes('bedrock') || combinedText.includes('mcbe')) {
            return 'BEDROCK MINECRAFT';
        }

        // Cross-play (Paper + Geyser) - แสดง "CROSS" แทน "PAPER"
        // ตรวจสอบจาก server name, egg name, หรือ description
        if (combinedText.includes('geyser') || combinedText.includes('cross')) {
            return 'CROSS MINECRAFT';
        }

        // Forge
        if (combinedText.includes('forge')) {
            return 'FORGE-MOD MINECRAFT';
        }

        // Fabric
        if (combinedText.includes('fabric')) {
            return 'FABRIC MINECRAFT';
        }

        // Plugin (Paper/Spigot without Geyser)
        if (combinedText.includes('paper') || combinedText.includes('spigot')) {
            return 'PAPER-PLUGIN MINECRAFT';
        }

        // Vanilla Minecraft
        if (combinedText.includes('minecraft') || combinedText.includes('mc') || combinedText.includes('vanilla')) {
            return 'VANILLA MINECRAFT';
        }

        // Default: ใช้ egg name หรือ description
        return eggName || description || 'SERVER';
    };

    const subtitle = getGameType(server.egg?.name, server.description, server.name);

    return (
        <CardContainer to={`/server/${server.id}`} $backgroundImage={cardBackground} $status={stats?.status}>
            <CardContent>
                <CardHeader>
                    <ServerName>{server.name}</ServerName>
                    <ServerSubtitle>{subtitle}</ServerSubtitle>
                </CardHeader>

                {!stats || isSuspended ? (
                    <div css={tw`mt-auto`}>
                        {isSuspended ? (
                            <StatusBadge $status={stats?.status}>
                                {server.status === 'suspended' ? 'Suspended' : 'Connection Error'}
                            </StatusBadge>
                        ) : server.isTransferring || server.status ? (
                            <StatusBadge $status={stats?.status}>
                                {server.isTransferring
                                    ? 'Transferring'
                                    : server.status === 'installing'
                                    ? 'Installing'
                                    : server.status === 'restoring_backup'
                                    ? 'Restoring Backup'
                                    : 'Unavailable'}
                            </StatusBadge>
                        ) : (
                            <div css={tw`flex justify-center items-center py-8`}>
                                <Spinner size={'small'} />
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <StatusBadge $status={stats.status}>
                            {stats.status === 'running'
                                ? 'Online'
                                : stats.status === 'offline'
                                ? 'Offline'
                                : 'Starting'}
                        </StatusBadge>
                        <StatsContainer>
                            <StatRow $alarm={alarms.cpu}>
                                <div css={tw`flex items-center`}>
                                    <StatIcon icon={faMicrochip} $alarm={alarms.cpu} />
                                    <StatInfo>
                                        <StatValue>
                                            {stats.cpuUsagePercent.toFixed(2)} % of {cpuLimit}
                                        </StatValue>
                                    </StatInfo>
                                </div>
                            </StatRow>
                            <StatRow $alarm={alarms.memory}>
                                <div css={tw`flex items-center`}>
                                    <StatIcon icon={faMemory} $alarm={alarms.memory} />
                                    <StatInfo>
                                        <StatValue>
                                            {bytesToString(stats.memoryUsageInBytes)} of {memoryLimit}
                                        </StatValue>
                                    </StatInfo>
                                </div>
                            </StatRow>
                            <StatRow $alarm={alarms.disk}>
                                <div css={tw`flex items-center`}>
                                    <StatIcon icon={faHdd} $alarm={alarms.disk} />
                                    <StatInfo>
                                        <StatValue>
                                            {bytesToString(stats.diskUsageInBytes)} of {diskLimit}
                                        </StatValue>
                                    </StatInfo>
                                </div>
                            </StatRow>
                        </StatsContainer>
                    </>
                )}
            </CardContent>
        </CardContainer>
    );
}, isEqual);
