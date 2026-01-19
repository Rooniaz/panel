import React, { useCallback, useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import {
    FastQueryResponse,
    Player,
    PlayerItemsResponse,
    WorldInfo,
    getFastQueryData,
    getDetectedWorlds,
    getPlayerItems,
    checkAutosave,
    unbanIpWithCommand,
} from '@/api/server/mcpmanager';
import PlayersList from './List';
import PlayerDetails from './Details';
import Spinner from '@/components/elements/Spinner';
import ContentBox from '@/components/elements/ContentBox';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
const PlayerManagerContainer = () => {
    const [loading, setLoading] = useState(true);
    // Removed refreshing state to avoid annoying loading indicator
    const [data, setData] = useState<FastQueryResponse | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('online');
    const [playerItems, setPlayerItems] = useState<PlayerItemsResponse | null>(null);
    const [worlds, setWorlds] = useState<WorldInfo[]>([]);
    const [selectedWorld, setSelectedWorld] = useState<string>('world');
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const uuid = server.uuid;
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const handleModalStateChange = useCallback((modalOpen: boolean) => {
        setIsModalOpen(modalOpen);
    }, []);
    const refreshData = useCallback(() => {
        // Removed setRefreshing to avoid annoying loading indicator
        clearFlashes('player-manager');
        getFastQueryData(uuid)
            .then((data) => {
                setData(data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setError(null);
                }
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'player-manager', error });
                setError(httpErrorToHuman(error));
            })
            .finally(() => {
                setLoading(false);
            });
    }, [uuid, clearFlashes, clearAndAddHttpError]);
    const loadWorlds = useCallback(() => {
        getDetectedWorlds(uuid)
            .then((response) => {
                setWorlds(response.worlds);
                if (response.worlds.length > 0) {
                    const worldWithData = response.worlds.find((w) => w.has_player_data);
                    if (worldWithData) {
                        setSelectedWorld(worldWithData.name);
                    } else if (response.worlds.length > 0) {
                        setSelectedWorld(response.worlds[0].name);
                    }
                }
            })
            .catch((error) => {
                console.error('Failed to load worlds:', error);
            });
    }, [uuid]);
    const loadPlayerItems = useCallback(
        (player: Player) => {
            if (!player.uuid) {
                // If player doesn't have UUID, set empty items
                setPlayerItems({
                    inventory: [],
                    ender_chest: [],
                    armor: [],
                    offhand: [],
                    error: 'Player UUID not available',
                });
                return;
            }
            console.log(
                '[PlayerItems] Loading inventory for player:',
                player.name,
                'UUID:',
                player.uuid,
                'World:',
                selectedWorld
            );
            setPlayerItems(null); // Set to null while loading
            getPlayerItems(uuid, player.uuid, selectedWorld)
                .then((data) => {
                    console.log('[PlayerItems] Received inventory data:', data);
                    // ✅ ตรวจสอบว่า response มี error หรือไม่ (แม้ status code จะเป็น 200)
                    if (data.error) {
                        console.warn('[PlayerItems] Server returned error in response:', data.error);
                        // ไม่แสดง error ถ้าเป็น 404, 500, หรือ "not found" (normal case หรือ server issue)
                        const errorMsg = data.error.toLowerCase();
                        if (
                            errorMsg.includes('not found') ||
                            errorMsg.includes('404') ||
                            errorMsg.includes('500') ||
                            errorMsg.includes('error while communicating') ||
                            errorMsg.includes('modded server') ||
                            errorMsg.includes("hasn't joined")
                        ) {
                            // Player อาจยังไม่ได้ join, ไม่มี inventory data, หรือ server error ชั่วคราว
                            // → ไม่แสดง error, แสดง empty inventory แทน
                            setPlayerItems({
                                inventory: [],
                                ender_chest: [],
                                armor: [],
                                offhand: [],
                                // ไม่ตั้ง error เพื่อไม่ให้แสดง error message
                            });
                        } else {
                            // Error อื่นๆ → แสดง error message
                            setPlayerItems({
                                inventory: [],
                                ender_chest: [],
                                armor: [],
                                offhand: [],
                                error: data.error,
                            });
                        }
                    } else {
                        console.log('[PlayerItems] Setting inventory data:', {
                            inventoryCount: data.inventory?.length || 0,
                            enderChestCount: data.ender_chest?.length || 0,
                            armorCount: data.armor?.length || 0,
                            offhandCount: data.offhand?.length || 0,
                        });
                        setPlayerItems(data);
                    }
                })
                .catch((error) => {
                    console.error('[PlayerItems] Failed to load player items:', error);

                    // ✅ ไม่แสดง error ถ้าเป็น 404 หรือ 500 (อาจเป็น server issue ชั่วคราว หรือ player ยังไม่มี inventory)
                    const statusCode = error.response?.status;
                    const errorMessage = httpErrorToHuman(error);

                    // ไม่แสดง error ถ้าเป็น:
                    // - 404: player ไม่มี inventory data (normal case)
                    // - 500: server error (อาจเป็น server issue ชั่วคราว หรือ modded server)
                    if (statusCode === 404 || statusCode === 500) {
                        console.warn(
                            '[PlayerItems] Status code:',
                            statusCode,
                            '- Showing empty inventory instead of error'
                        );
                        setPlayerItems({
                            inventory: [],
                            ender_chest: [],
                            armor: [],
                            offhand: [],
                            // ไม่ตั้ง error เพื่อไม่ให้แสดง error message
                            // Player สามารถเห็น inventory grid (ว่างเปล่า) แทน
                        });
                    } else {
                        // Error อื่นๆ → แสดง error message
                        setPlayerItems({
                            inventory: [],
                            ender_chest: [],
                            armor: [],
                            offhand: [],
                            error: errorMessage,
                        });
                    }
                });
        },
        [uuid, selectedWorld]
    );
    useEffect(() => {
        checkAutosave(uuid).catch((error: any) => console.error('Failed to check autosave:', error));
        loadWorlds();
    }, [uuid, loadWorlds]);
    // ✅ Load data เมื่อ component mount ครั้งแรกเท่านั้น
    useEffect(() => {
        refreshData();
        loadWorlds();
        checkAutosave(uuid).catch((error: any) => console.error('Failed to check autosave:', error));
    }, [uuid, refreshData, loadWorlds]);

    // ✅ Load player items เมื่อเลือก player หรือเปลี่ยน world (ไม่ refresh fast-query)
    useEffect(() => {
        if (selectedPlayer && selectedPlayer.uuid && !isModalOpen) {
            loadPlayerItems(selectedPlayer);
        }
    }, [selectedPlayer, selectedWorld, isModalOpen, loadPlayerItems]);

    // ✅ ปิด auto-refresh - ให้ใช้ manual refresh button แทน (แต่ยังคง force save เมื่อ refresh)
    // useEffect(() => {
    //     if (!selectedPlayer || !selectedPlayer.uuid || isModalOpen) {
    //         return;
    //     }

    //     const interval = setInterval(() => {
    //         console.log('[PlayerItems] Auto-refreshing player data...');
    //         loadPlayerItems(selectedPlayer);
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, [selectedPlayer, selectedWorld, isModalOpen, loadPlayerItems]);

    // ✅ ปิด auto-refresh fast-query - ให้ใช้ manual refresh button แทน
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         if (!isModalOpen) {
    //             refreshData();
    //             if (selectedPlayer && selectedPlayer.uuid) {
    //                 console.log('[PlayerItems] Auto-refreshing inventory...');
    //                 loadPlayerItems(selectedPlayer);
    //             }
    //         }
    //     }, 3000);
    //     return () => clearInterval(interval);
    // }, [selectedPlayer, selectedWorld, refreshData, loadPlayerItems, handleModalStateChange, isModalOpen]);

    // ✅ ปิด window focus refresh - ให้ใช้ manual refresh button แทน
    // useEffect(() => {
    //     const handleFocus = () => {
    //         if (selectedPlayer && selectedPlayer.uuid && !isModalOpen) {
    //             console.log('[PlayerItems] Window focused - refreshing inventory...');
    //             refreshData();
    //             loadPlayerItems(selectedPlayer);
    //         }
    //     };
    //     window.addEventListener('focus', handleFocus);
    //     return () => window.removeEventListener('focus', handleFocus);
    // }, [selectedPlayer, selectedWorld, refreshData, loadPlayerItems, isModalOpen]);
    const handlePlayerSelect = (player: Player) => {
        setSelectedPlayer(player);
    };
    const handleRefresh = () => {
        refreshData();
        if (selectedPlayer && selectedPlayer.uuid) {
            loadPlayerItems(selectedPlayer);
        }
    };
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setSelectedPlayer(null);
        setPlayerItems(null);
    };
    const handleWorldChange = (world: string) => {
        setSelectedWorld(world);
        if (selectedPlayer && selectedPlayer.uuid) {
            loadPlayerItems(selectedPlayer);
        }
    };
    const handleUnbanIp = (ip: string) => {
        if (!window.confirm(`Are you sure you want to unban IP: ${ip}?`)) {
            return;
        }
        clearFlashes('player-manager');
        unbanIpWithCommand(uuid, ip)
            .then(() => {
                clearFlashes('player-manager');
                useFlash().addFlash({
                    key: 'player-manager',
                    message: `Successfully unbanned IP: ${ip}`,
                    type: 'success',
                });
                refreshData();
            })
            .catch((error: any) => {
                clearAndAddHttpError({ key: 'player-manager', error });
            });
    };
    return (
        <ServerContentBlock title={'Player Manager'} showFlashKey={'player-manager'}>
            {loading ? (
                <Spinner size={'large'} centered />
            ) : error ? (
                <ContentBox css={tw`relative`}>
                    <div css={tw`p-6 text-center`}>
                        <FontAwesomeIcon icon={faExclamationTriangle} css={tw`text-yellow-400 text-3xl mb-3`} />
                        <p css={tw`text-red-400 text-lg mb-2`}>{error}</p>
                        <p css={tw`text-neutral-300 mt-2`}>
                            Make sure your Minecraft server is running and properly configured.
                        </p>
                    </div>
                </ContentBox>
            ) : (
                <div css={tw`grid grid-cols-1 md:grid-cols-3 gap-6 mb-10`}>
                    <div css={tw`md:col-span-1`}>
                        <div css={tw`sticky top-6`}>
                            <PlayersList
                                data={data}
                                selectedCategory={selectedCategory}
                                onCategoryChange={handleCategoryChange}
                                onPlayerSelect={handlePlayerSelect}
                                selectedPlayer={selectedPlayer}
                                onUnbanIp={handleUnbanIp}
                                serverStatus={status}
                            />
                        </div>
                    </div>
                    <div css={tw`md:col-span-2`}>
                        {selectedPlayer ? (
                            <PlayerDetails
                                player={selectedPlayer}
                                serverUuid={uuid}
                                onRefresh={handleRefresh}
                                onRefreshPlayerItems={() => {
                                    if (selectedPlayer && selectedPlayer.uuid) {
                                        loadPlayerItems(selectedPlayer);
                                    }
                                }}
                                playerItems={playerItems}
                                worlds={worlds}
                                selectedWorld={selectedWorld}
                                onWorldChange={handleWorldChange}
                                rootAdmin={rootAdmin}
                                fastQueryData={data}
                                onModalStateChange={handleModalStateChange}
                            />
                        ) : (
                            <ContentBox css={tw`relative`}>
                                <div css={tw`p-8 text-center`}>
                                    <FontAwesomeIcon icon={faGamepad} css={tw`text-neutral-500 text-4xl mb-4`} />
                                    <p css={tw`text-neutral-300 text-lg`}>
                                        Select a player from the list to view details
                                    </p>
                                </div>
                            </ContentBox>
                        )}
                    </div>
                </div>
            )}
        </ServerContentBlock>
    );
};
export default PlayerManagerContainer;
