import React, { useEffect, useState } from 'react';
import {
    Player,
    getPlayerAdvancements,
    getAdvancementsFromWiki,
    PlayerAdvancement,
    WikiAdvancement,
} from '@/api/server/mcpmanager';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';
interface Props {
    player: Player;
    serverUuid: string;
}
interface CombinedAdvancement extends WikiAdvancement {
    icon_background: string;
    icon_content: string | null;
    earned: boolean;
}
const Advancements: React.FC<Props> = ({ player, serverUuid }) => {
    const [combinedAdvancements, setCombinedAdvancements] = useState<CombinedAdvancement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (!player.uuid) {
            setError('Player UUID is not available.');
            setLoading(false);
            return;
        }
        const fetchAdvancements = async () => {
            try {
                const wikiData = await getAdvancementsFromWiki(serverUuid);
                const playerData = await getPlayerAdvancements(serverUuid, player.uuid!);
                const combined = wikiData
                    .map((wikiAdv) => ({
                        ...wikiAdv,
                        earned: playerData[`minecraft:${wikiAdv.resource_location}`]?.done || false,
                    }))
                    .filter((adv) => adv.earned);
                setCombinedAdvancements(combined);
            } catch (e: any) {
                setError(e.message || 'Failed to fetch advancements.');
            } finally {
                setLoading(false);
            }
        };
        fetchAdvancements();
    }, [player.uuid, serverUuid]);
    if (loading) {
        return <Spinner size={'large'} centered />;
    }
    if (error) {
        return <p tw='text-center text-red-500'>{error}</p>;
    }
    return (
        <div css={tw`bg-neutral-800 rounded-lg border border-neutral-700 shadow-md p-4`}>
            <div
                css={tw`grid grid-cols-12 gap-4 text-sm font-semibold text-neutral-300 border-b border-neutral-700 p-2`}
            >
                <div css={tw`col-span-1`}>Icon</div>
                <div css={tw`col-span-2`}>Advancement</div>
                <div css={tw`col-span-3`}>Description</div>
                <div css={tw`col-span-3`}>Requirements</div>
                <div css={tw`col-span-2`}>Resource</div>
            </div>
            <div css={tw`divide-y divide-neutral-700`}>
                {combinedAdvancements.map((advancement, index) => (
                    <div key={index} css={tw`grid grid-cols-12 gap-4 p-2 items-center`}>
                        <div className='relative flex-shrink-0 h-10 w-10 col-span-1'>
                            <img
                                src={advancement.icon_background}
                                alt={`${advancement.name} background`}
                                className='absolute top-0 left-0 h-full w-full'
                            />
                            {advancement.icon_content && (
                                <img
                                    src={advancement.icon_content}
                                    alt={advancement.name}
                                    className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7'
                                />
                            )}
                        </div>
                        <div css={tw`col-span-2 text-sm text-neutral-200`}>{advancement.name}</div>
                        <div
                            css={tw`col-span-3 text-xs text-neutral-300`}
                            dangerouslySetInnerHTML={{ __html: advancement.description }}
                        />
                        <div
                            css={tw`col-span-3 text-xs text-neutral-300`}
                            dangerouslySetInnerHTML={{ __html: advancement.requirements }}
                        />
                        <div css={tw`col-span-2 text-xs text-neutral-300`}>{advancement.resource_location}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Advancements;
