import React from 'react';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faSkull, faBolt, faShoePrints, faChartLine, faArrowDown, faHammer, faFistRaised, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { PlayerStats as PlayerStatsType } from '@/api/server/mcpmanager';
import ContentBox from '@/components/elements/ContentBox';
import Spinner from '@/components/elements/Spinner';
interface PlayerStatsBoardsProps {
    stats: PlayerStatsType | undefined;
    isLoading: boolean;
}
interface StatEntry {
    name: string;
    value: number;
}
const formatStatName = (name: string): string => {
    return name.replace('minecraft:', '').replace(/_/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};
const formatStatValue = (name: string, value: number): string => {
    if (name.includes('_time') || name.includes('since_')) {
        const seconds = value / 20; 
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        let result = '';
        if (d > 0) result += `${d}d `;
        if (h > 0) result += `${h}h `;
        if (m > 0) result += `${m}m`;
        return result.trim() || '0m';
    }
    if (name.includes('_cm')) {
        const meters = value / 100;
        if (meters > 1000) {
            return `${(meters / 1000).toFixed(2)} km`;
        }
        return `${meters.toFixed(1)} m`;
    }
    return value.toLocaleString();
};
const getIconUrl = (name: string, type: 'item' | 'mob'): string => {
    const formattedName = name.replace('minecraft:', '');
    if (type === 'item') {
        return `https://mc.nerothe.com/img/1.21.6/minecraft_${formattedName}.png`;
    }
    return `https://mc-heads.net/avatar/${formattedName}`;
};
const StatItem: React.FC<{ name: string; value: string | number; type: 'item' | 'mob' | 'custom' }> = ({ name, value, type }) => (
    <div tw="flex items-center p-1.5">
        {type !== 'custom' && (
            <img
                src={getIconUrl(name, type)}
                alt={formatStatName(name)}
                tw="w-6 h-6 mr-3 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
        )}
        <p tw="flex-1 text-neutral-300 text-sm truncate">{formatStatName(name)}</p>
        <p tw="font-mono text-sm text-neutral-200">{value}</p>
    </div>
);
const StatBoard: React.FC<{ title: string; icon: any; stats: StatEntry[]; type: 'item' | 'mob' | 'custom' }> = ({ title, icon, stats, type }) => (
    <div tw="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
        <h3 tw="text-sm font-semibold text-neutral-200 mb-3 flex items-center">
            <FontAwesomeIcon icon={icon} tw="mr-2 text-neutral-400" />
            <span>{title}</span>
        </h3>
        <div tw="space-y-1 max-h-64 overflow-y-auto pr-2">
            {stats.map((stat) => (
                <StatItem key={stat.name} name={stat.name} value={formatStatValue(stat.name, stat.value)} type={type} />
            ))}
            {stats.length === 0 && (
                <div tw="text-center py-10">
                    <p tw="text-neutral-400 text-sm">No data</p>
                </div>
            )}
        </div>
    </div>
);
export const PlayerStatsBoards: React.FC<PlayerStatsBoardsProps> = ({ stats, isLoading }) => {
    if (isLoading) {
        return <Spinner size="large" centered />;
    }
    if (!stats?.raw_stats_data?.stats) {
        return (
            <ContentBox>
                <div tw="bg-neutral-800 rounded-lg p-4 text-center">
                    <FontAwesomeIcon icon={faEyeSlash} tw="text-yellow-400 text-2xl mb-2" />
                    <p tw="text-neutral-300">No detailed statistics available</p>
                </div>
            </ContentBox>
        );
    }
    const rawStats = stats.raw_stats_data.stats;
    const processStats = (category: 'used' | 'dropped' | 'mined' | 'killed' | 'killed_by' | 'picked_up', limit = 20): StatEntry[] => {
        const categoryData = rawStats[`minecraft:${category}`] || {};
        return Object.entries(categoryData)
            .map(([name, value]) => ({ name, value: value as number }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
    };
        const processTravelStats = (): { stats: StatEntry[], total: number } => {
        const customStats = rawStats['minecraft:custom'] || {};
        const travelKeys = {
            Walk: 'minecraft:walk_one_cm',
            Sprint: 'minecraft:sprint_one_cm',
            Crouch: 'minecraft:crouch_one_cm',
            Swim: 'minecraft:swim_one_cm',
            Ride: 'minecraft:boat_one_cm',
            Fly: 'minecraft:fly_one_cm',
        };
        let totalCm = 0;
        const processedStats = Object.entries(travelKeys).map(([name, key]) => {
            const valueCm = customStats[key] || 0;
            totalCm += valueCm;
            return { name, value: Math.round(valueCm / 100) }; 
        });
        return { stats: processedStats, total: Math.round(totalCm / 100) };
    };
    const processCustomStats = (limit = 20): StatEntry[] => {
        const customData = rawStats['minecraft:custom'] || {};
        const a = Object.entries(customData)
            .map(([name, value]) => ({ name, value: value as number }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
        return a
    };
    const usedStats = processStats('used');
    const droppedStats = processStats('dropped');
    const deathsStats = processStats('killed_by');
    const minedStats = processStats('mined');
    const killsStats = processStats('killed');
    const activitiesStats = processCustomStats();
    const pickedUpStats = processStats('picked_up');
    const { stats: travelStats, total: totalTravel } = processTravelStats();
    return (
        <div tw="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatBoard title="Activities" icon={faChartLine} stats={activitiesStats} type="custom" />
            <StatBoard title="Items Used" icon={faBolt} stats={usedStats} type="item" />
            <StatBoard title="Items Dropped" icon={faArrowDown} stats={droppedStats} type="item" />
            <StatBoard title="Deaths" icon={faSkull} stats={deathsStats} type="mob" />
            <StatBoard title="Blocks Mined" icon={faHammer} stats={minedStats} type="item" />
            <StatBoard title="Mobs Killed" icon={faFistRaised} stats={killsStats} type="mob" />
            <StatBoard title="Items Picked Up" icon={faClipboardList} stats={pickedUpStats} type="item" />
            <StatBoard title="Blocks Travelled" icon={faShoePrints} stats={travelStats} type="custom" />
        </div>
    );
};
export default PlayerStatsBoards;
