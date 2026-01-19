import React, { useState, useMemo } from 'react';
import { FastQueryResponse, Player, BannedIp } from '@/api/server/mcpmanager';
import ContentBox from '@/components/elements/ContentBox';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUsers,
    faUserCheck,
    faUserSlash,
    faUserShield,
    faBan,
    faSearch,
    faSortAlphaDown,
    faSortAlphaUp,
    faExclamationCircle,
    faGamepad,
    faServer,
    faCircle,
} from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';
interface Props {
    data: FastQueryResponse | null;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    onPlayerSelect: (player: Player) => void;
    selectedPlayer: Player | null;
    onUnbanIp?: (ip: string) => void;
    serverStatus: string | null;
}
const CategoryButton = styled.button<{ active: boolean }>`
    ${tw`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2`};
    ${({ active }) =>
        active
            ? tw`bg-primary-500/20 text-primary-50 border-primary-500/80 shadow-md`
            : tw`bg-neutral-800 text-neutral-200 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-700/50 cursor-pointer`}
`;
const PlayerItem = styled.div<{ selected: boolean }>`
    ${tw`relative flex items-center p-3 rounded-lg mb-2 cursor-pointer transition-all duration-150 border-2 overflow-hidden`};
    ${(props) =>
        props.selected
            ? tw`bg-primary-500/20 border-primary-500/80 shadow-md`
            : tw`bg-neutral-800 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-700/50`};
`;
const PlayerAvatar = styled.img`
    ${tw`w-10 h-10 rounded-md mr-3 border-2 border-neutral-600 shadow-sm`};
`;
const StatusBadge = styled.span<{ status: string }>`
    ${tw`px-3 py-1 rounded-full text-xs font-semibold ml-auto shadow-sm border`};
    ${(props) => {
        switch (props.status) {
            case 'online':
                return tw`bg-green-600 text-green-50 border-green-500`;
            case 'banned':
                return tw`bg-red-600 text-red-50 border-red-500`;
            case 'whitelisted':
                return tw`bg-blue-600 text-blue-50 border-blue-500`;
            case 'op':
                return tw`bg-yellow-600 text-yellow-50 border-yellow-500`;
            case 'offline':
                return tw`bg-neutral-600 text-neutral-200 border-neutral-500`;
            default:
                return tw`bg-neutral-600 text-neutral-50 border-neutral-500`;
        }
    }}
`;
const PlayersList: React.FC<Props> = ({
    data,
    selectedCategory,
    onCategoryChange,
    onPlayerSelect,
    selectedPlayer,
    onUnbanIp,
    serverStatus,
}) => {
    const info = data?.info;
    const players = data?.players;
    const isOnline = serverStatus === 'running' && !!data && !data.error;
    const Stat = ({
        label,
        value,
        children,
    }: {
        label: string;
        value: string | number;
        children?: React.ReactNode;
    }) => (
        <div tw='bg-neutral-800 p-3 rounded-lg text-center'>
            <p tw='text-xs text-neutral-300 uppercase tracking-wider'>{label}</p>
            <div tw='flex items-center justify-center space-x-2'>
                {children}
                <p tw='text-base font-semibold text-neutral-200'>{value}</p>
            </div>
        </div>
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const categories = useMemo(() => {
        const counts = data?.players?.counts;
        const onlineCount = data?.players?.online?.length ?? data?.players?.current ?? 0;
        return [
            { id: 'online', name: 'Online', icon: faUsers, count: onlineCount },
            { id: 'all', name: 'All', icon: faUsers, count: counts?.all ?? 0 },
            { id: 'banned', name: 'Banned', icon: faUserSlash, count: counts?.banned ?? 0 },
            { id: 'whitelisted', name: 'Whitelist', icon: faUserCheck, count: counts?.whitelisted ?? 0 },
            { id: 'ops', name: 'Operators', icon: faUserShield, count: counts?.ops ?? 0 },
            { id: 'banned_ips', name: 'Banned IPs', icon: faBan, count: counts?.banned_ips ?? 0 },
        ];
    }, [data]);
    const getPlayerList = (): (Player | BannedIp)[] => {
        if (!data || !data.players) return [];
        const list = data.players[selectedCategory as keyof typeof data.players] || [];
        return list as (Player | BannedIp)[];
    };
    const filteredPlayers = useMemo(() => {
        const players = getPlayerList();
        if (!players.length) return [];
        return players
            .filter((player) => {
                if ('ip' in player && !('name' in player)) {
                    return (player as BannedIp).ip.toLowerCase().includes(searchTerm.toLowerCase());
                } else {
                    return (player as Player).name.toLowerCase().includes(searchTerm.toLowerCase());
                }
            })
            .sort((a, b) => {
                const nameA = 'name' in a ? (a as Player).name : (a as BannedIp).ip;
                const nameB = 'name' in b ? (b as Player).name : (b as BannedIp).ip;
                if (sortOrder === 'asc') {
                    return nameA.localeCompare(nameB);
                } else {
                    return nameB.localeCompare(nameA);
                }
            });
    }, [data, selectedCategory, searchTerm, sortOrder]);
    const getPlayerStatus = (player: Player): string => {
        if (!data?.players) return 'offline';
        const { online, banned, ops, whitelisted } = data.players;
        const match = (p: Player) => p.uuid === player.uuid || p.name === player.name;
        if (online?.some(match)) return 'online';
        if (banned?.some(match)) return 'banned';
        if (ops?.some(match)) return 'op';
        if (whitelisted?.some(match)) return 'whitelisted';
        return 'offline';
    };
    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };
    const formatGameModeShort = (gamemode: string | number | undefined): string => {
        if (gamemode === undefined) return '?';
        if (typeof gamemode === 'number') {
            return ['S', 'C', 'A', 'Sp'][gamemode] || '?';
        }
        return gamemode.charAt(0).toUpperCase();
    };
    const renderPlayerItem = (player: Player | BannedIp, index: number) => {
        if ('ip' in player && !('name' in player)) {
            const bannedIp = player as BannedIp;
            return (
                <PlayerItem
                    key={`ip-${index}-${bannedIp.ip}`}
                    selected={false}
                    css={tw`cursor-pointer hover:bg-red-900/20`}
                    onClick={() => onUnbanIp && onUnbanIp(bannedIp.ip)}
                >
                    <div tw='absolute top-0 left-0 h-full w-full bg-red-500/10' />
                    <div tw='flex items-center z-10'>
                        <div tw='w-10 h-10 rounded-md mr-3 flex items-center justify-center bg-neutral-800 border-2 border-neutral-600'>
                            <FontAwesomeIcon icon={faBan} tw='text-red-400' />
                        </div>
                        <div tw='flex-1'>
                            <p tw='font-semibold text-red-200'>{bannedIp.ip}</p>
                            <p tw='text-xs text-neutral-400'>{bannedIp.reason || 'No reason provided'}</p>
                        </div>
                    </div>
                </PlayerItem>
            );
        } else {
            const playerItem = player as Player;
            const isSelected = !!(selectedPlayer && selectedPlayer.uuid === playerItem.uuid);
            const status = getPlayerStatus(playerItem);
            return (
                <PlayerItem
                    key={`player-${index}-${playerItem.uuid}`}
                    selected={isSelected}
                    onClick={() => onPlayerSelect(playerItem)}
                >
                    {isSelected && <div tw='absolute top-0 left-0 h-full w-full bg-primary-500/10' />}
                    <PlayerAvatar
                        src={
                            playerItem.name.startsWith('.')
                                ? `https://minotar.net/helm/herobrine`
                                : `https://minotar.net/helm//${playerItem.uuid}`
                        }
                        alt={playerItem.name}
                    />
                    <div tw='flex-1'>
                        <div tw='flex items-center'>
                            <p tw='font-semibold text-base text-neutral-100'>{playerItem.name}</p>
                            {status === 'online' && playerItem.gamemode !== undefined && (
                                <div tw='flex items-center ml-2 px-2 py-0.5 rounded-full bg-neutral-600/50 border border-neutral-500/50'>
                                    <FontAwesomeIcon icon={faGamepad} tw='text-xs text-neutral-300 mr-1.5' />
                                    <span tw='text-xs font-bold text-neutral-200'>
                                        {formatGameModeShort(playerItem.gamemode)}
                                    </span>
                                </div>
                            )}
                        </div>
                        {playerItem.uuid && <p tw='text-xs text-neutral-400 font-mono'>{playerItem.uuid}</p>}
                    </div>
                    {status && <StatusBadge status={status}>{status}</StatusBadge>}
                </PlayerItem>
            );
        }
    };
    return (
        <ContentBox css={tw`relative`}>
            <div css={tw`p-4 border-b border-neutral-700`}>
                <div css={tw`grid grid-cols-2 gap-4 mb-4`}>
                    <Stat label='Players' value={`${players?.online?.length || 0} / ${players?.max || 'N/A'}`}>
                        <FontAwesomeIcon
                            icon={faCircle}
                            css={[tw`text-xs`, isOnline ? tw`text-green-500 animate-pulse` : tw`text-red-500`]}
                        />
                    </Stat>
                    <Stat label='Version' value={info?.version?.name || 'N/A'} />
                </div>
                <div css={tw`grid grid-cols-2 gap-3 mb-4`}>
                    {categories.map((category) => (
                        <CategoryButton
                            key={category.id}
                            active={selectedCategory === category.id}
                            onClick={() => onCategoryChange(category.id)}
                        >
                            <FontAwesomeIcon icon={category.icon} />
                            <span>
                                {category.name} <span css={tw`text-neutral-400`}>({category.count})</span>
                            </span>
                        </CategoryButton>
                    ))}
                </div>
                <div css={tw`flex items-center gap-3`}>
                    <div
                        css={tw`
                        flex-1 flex items-center gap-3 px-4 py-2.5 rounded-lg
                        border-2 border-neutral-700 bg-neutral-800 
                        transition-colors duration-150
                        focus-within:border-primary-500
                        hover:border-neutral-600
                    `}
                    >
                        <FontAwesomeIcon icon={faSearch} css={tw`text-neutral-400`} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder='Search players...'
                            css={tw`w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-neutral-100 placeholder-neutral-400`}
                        />
                    </div>
                    <button
                        css={tw`p-2.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg border border-neutral-600 hover:border-neutral-500 transition-colors duration-150 shadow-sm`}
                        onClick={toggleSortOrder}
                        title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                    >
                        <FontAwesomeIcon
                            icon={sortOrder === 'asc' ? faSortAlphaDown : faSortAlphaUp}
                            css={tw`text-neutral-200`}
                        />
                    </button>
                </div>
            </div>
            <div css={tw`px-4 max-h-[600px] overflow-y-auto`}>
                {!data ? (
                    <div css={tw`flex flex-col items-center justify-center py-8`}>
                        <Spinner size='large' />
                        <p css={tw`mt-4 text-neutral-300`}>Loading player data...</p>
                    </div>
                ) : filteredPlayers.length === 0 ? (
                    <div css={tw`flex flex-col items-center justify-center py-8 text-center`}>
                        <FontAwesomeIcon icon={faExclamationCircle} css={tw`text-yellow-400 text-3xl mb-3`} />
                        <p css={tw`text-neutral-300`}>No players found in this category</p>
                    </div>
                ) : (
                    filteredPlayers.map((player, index) => renderPlayerItem(player, index))
                )}
            </div>
        </ContentBox>
    );
};
export default PlayersList;
