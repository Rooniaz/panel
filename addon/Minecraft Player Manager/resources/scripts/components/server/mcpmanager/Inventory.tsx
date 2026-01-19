import React, { useState, useEffect, useRef, useContext } from 'react';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBox,
    faUser,
    faTrash,
    faQuestion,
    faHardHat,
    faVest,
    faTshirt,
    faSocks,
    faExclamationTriangle,
    faChess,
    faChessBoard,
    faBoxOpen,
} from '@fortawesome/free-solid-svg-icons';
import { PlayerItemsResponse, removePlayerItem } from '@/api/server/mcpmanager';
import { ServerContext } from '@/state/server';
import useFlash from '@/plugins/useFlash';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { Button } from '@/components/elements/button';
import { Options as ButtonOptions } from '@/components/elements/button/types';
import Spinner from '@/components/elements/Spinner';
interface PlayerInventoryProps {
    playerItems: PlayerItemsResponse | null;
    isLoading: boolean;
    playerName: string;
    serverVersion?: string;
    onRefresh?: () => void;
    onGiveItem?: (slot: number, type: string) => void;
    onModalStateChange?: (isModalOpen: boolean) => void;
}
type InventoryType = 'inventory' | 'ender_chest';
const extractVersionNumber = (serverVersion?: string): string => {
    if (!serverVersion) return '1.20.4';
    const match = serverVersion.match(/(\d+\.\d+(?:\.\d+)?)/);
    return match ? match[1] : '1.20.4';
};
interface IconCacheEntry {
    url: string;
    timestamp: number;
    status: 'loading' | 'success' | 'failed';
}
class ItemIconCache {
    private cache = new Map<string, IconCacheEntry>();
    private readonly CACHE_DURATION = 30 * 60 * 1000;
    private readonly MAX_CACHE_SIZE = 500;
    getCacheKey(itemId: string, serverVersion?: string): string {
        const cleanId = itemId.replace('minecraft:', '');
        const version = extractVersionNumber(serverVersion);
        return `${cleanId}_${version}`;
    }
    get(itemId: string, serverVersion?: string): IconCacheEntry | null {
        const key = this.getCacheKey(itemId, serverVersion);
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }
        return entry;
    }
    set(itemId: string, url: string, status: 'loading' | 'success' | 'failed', serverVersion?: string): void {
        const key = this.getCacheKey(itemId, serverVersion);
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            const iterator = this.cache.keys();
            const firstEntry = iterator.next();
            if (!firstEntry.done && firstEntry.value) {
                this.cache.delete(firstEntry.value);
            }
        }
        this.cache.set(key, {
            url,
            timestamp: Date.now(),
            status,
        });
    }
    preloadImage(url: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }
    async preloadItemIcon(itemId: string, serverVersion?: string): Promise<string | null> {
        const cleanId = itemId.replace('minecraft:', '');
        const version = extractVersionNumber(serverVersion);
        const imageSources = [
            `https://mc.nerothe.com/img/1.21.8/minecraft_${cleanId}.png`,
            `https://assets.mcasset.cloud/${version}/assets/minecraft/textures/item/${cleanId}.png`,
            `https://assets.mcasset.cloud/${version}/assets/minecraft/textures/block/${cleanId}.png`,
        ];
        for (const url of imageSources) {
            const success = await this.preloadImage(url);
            if (success) {
                this.set(itemId, url, 'success', serverVersion);
                return url;
            }
        }
        this.set(itemId, '', 'failed', serverVersion);
        return null;
    }
    clear(): void {
        this.cache.clear();
    }
    getStats(): { size: number; hitRate: number } {
        return {
            size: this.cache.size,
            hitRate: 0,
        };
    }
}
const iconCache = new ItemIconCache();
const formatItemName = (itemId: string): string => {
    const cleanId = itemId.replace('minecraft:', '');
    return cleanId
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
const ItemIcon: React.FC<{
    itemId: string;
    itemName: string;
    size?: string;
    serverVersion?: string;
}> = ({ itemId, itemName, size = 'w-6 h-6', serverVersion }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showFallback, setShowFallback] = useState(false);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);
    useEffect(() => {
        if (!itemId || itemId === 'minecraft:air') {
            setShowFallback(true);
            setIsLoading(false);
            return;
        }
        const loadIcon = async () => {
            setIsLoading(true);
            setShowFallback(false);
            const cached = iconCache.get(itemId, serverVersion);
            if (cached) {
                if (cached.status === 'success' && cached.url) {
                    if (mountedRef.current) {
                        setImageUrl(cached.url);
                        setIsLoading(false);
                    }
                    return;
                } else if (cached.status === 'failed') {
                    if (mountedRef.current) {
                        setShowFallback(true);
                        setIsLoading(false);
                    }
                    return;
                }
            }
            try {
                const url = await iconCache.preloadItemIcon(itemId, serverVersion);
                if (mountedRef.current) {
                    if (url) {
                        setImageUrl(url);
                        setShowFallback(false);
                    } else {
                        setShowFallback(true);
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                if (mountedRef.current) {
                    setShowFallback(true);
                    setIsLoading(false);
                }
            }
        };
        loadIcon();
    }, [itemId, serverVersion]);
    if (!itemId || itemId === 'minecraft:air') {
        return (
            <div className={`${size} flex items-center justify-center text-gray-400 text-xs font-bold`}>
                <FontAwesomeIcon icon={faQuestion} />
            </div>
        );
    }
    const cleanId = itemId.replace('minecraft:', '');
    const formattedName = formatItemName(itemId);
    if (isLoading) {
        return (
            <div className={`${size} flex items-center justify-center text-gray-400 text-xs`}>
                <Spinner size='small' />
            </div>
        );
    }
    if (showFallback || !imageUrl) {
        return (
            <div
                className={`${size} flex items-center justify-center text-gray-400 bg-gray-700 rounded border text-xs font-bold`}
            >
                <FontAwesomeIcon icon={faQuestion} />
            </div>
        );
    }
    return (
        <img
            src={imageUrl}
            alt={itemName || formattedName}
            className={`${size} object-contain`}
            onError={() => {
                if (mountedRef.current) {
                    setShowFallback(true);
                    iconCache.set(itemId, '', 'failed', serverVersion);
                }
            }}
            onLoad={() => {
                if (imageUrl && mountedRef.current) {
                    iconCache.set(itemId, imageUrl, 'success', serverVersion);
                }
            }}
            title={`${itemName || formattedName} (${cleanId})`}
        />
    );
};
const isShulkerBox = (itemId: string): boolean => {
    if (!itemId) return false;
    const cleanId = itemId.replace('minecraft:', '').toLowerCase();
    return cleanId.includes('shulker_box');
};
const getShulkerBoxColor = (itemId: string): string => {
    if (!itemId) return 'gray';
    const cleanId = itemId.replace('minecraft:', '').toLowerCase();
    const colorMap: { [key: string]: string } = {
        white_shulker_box: '#F9FAFB',
        orange_shulker_box: '#F97316',
        magenta_shulker_box: '#D946EF',
        light_blue_shulker_box: '#38BDF8',
        yellow_shulker_box: '#FACC15',
        lime_shulker_box: '#84CC16',
        pink_shulker_box: '#F472B6',
        gray_shulker_box: '#6B7280',
        light_gray_shulker_box: '#9CA3AF',
        cyan_shulker_box: '#06B6D4',
        purple_shulker_box: '#A855F7',
        blue_shulker_box: '#3B82F6',
        brown_shulker_box: '#A16207',
        green_shulker_box: '#22C55E',
        red_shulker_box: '#EF4444',
        black_shulker_box: '#1F2937',
        shulker_box: '#8B5CF6',
    };
    return colorMap[cleanId] || '#8B5CF6';
};
const ShulkerSlot: React.FC<{
    item: any;
    serverVersion?: string;
}> = ({ item, serverVersion }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    return (
        <div
            css={tw`w-8 h-8 bg-neutral-800 rounded border border-neutral-700 flex items-center justify-center relative`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {item ? (
                <>
                    <ItemIcon
                        itemId={item.id}
                        itemName={item.displayName || formatItemName(item.id)}
                        size='w-6 h-6'
                        serverVersion={serverVersion}
                    />
                    {item.count > 1 && (
                        <div
                            css={tw`absolute bottom-0 right-0 text-xs bg-black bg-opacity-80 px-0.5 rounded-tl text-white font-medium`}
                            style={{ fontSize: '9px' }}
                        >
                            {item.count}
                        </div>
                    )}
                    {showTooltip && (
                        <div
                            css={tw`absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 pointer-events-none`}
                        >
                            <div
                                css={tw`bg-neutral-900 border border-neutral-700 rounded-md p-2 shadow-lg whitespace-nowrap`}
                            >
                                <div css={tw`text-neutral-100 text-xs font-medium`}>
                                    {item.displayName || formatItemName(item.id)}
                                </div>
                                <div css={tw`text-neutral-400 text-xs`}>{item.id.replace('minecraft:', '')}</div>
                                {item.count > 1 && <div css={tw`text-neutral-400 text-xs`}>Count: {item.count}</div>}
                                {item.enchantments && item.enchantments.length > 0 && (
                                    <div css={tw`text-purple-400 text-xs mt-1`}>Enchanted</div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
};
const InventorySlot: React.FC<{
    item: any;
    index: number;
    isHotbar?: boolean;
    isArmor?: boolean;
    armorType?: string;
    isOffhand?: boolean;
    onClick?: () => void;
    isSelected?: boolean;
    serverVersion?: string;
}> = ({
    item,
    index,
    isHotbar = false,
    isArmor = false,
    armorType,
    isOffhand = false,
    onClick,
    isSelected = false,
    serverVersion,
}) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const isEmpty = !item || !item.id || item.id === 'minecraft:air';
    const hasShulkerContents = item?.shulker_contents && item.shulker_contents.length > 0;
    const itemIsShulker = item && isShulkerBox(item.id);
    const getFormattedItemName = () => {
        if (!item || !item.id) return '';
        return item.displayName || formatItemName(item.id);
    };
    const getArmorIcon = () => {
        if (!armorType) return faQuestion;
        switch (armorType) {
            case 'helmet':
                return faHardHat;
            case 'chestplate':
                return faVest;
            case 'leggings':
                return faTshirt;
            case 'boots':
                return faSocks;
            default:
                return faQuestion;
        }
    };
    return (
        <div
            css={
                isSelected
                    ? tw`w-8 h-8 md:w-10 md:h-10 bg-neutral-900 rounded border border-neutral-700 shadow-sm flex items-center justify-center relative cursor-pointer hover:bg-neutral-800 hover:border-neutral-600 transition-all ring-2 ring-primary-500 border-primary-500`
                    : tw`w-8 h-8 md:w-10 md:h-10 bg-neutral-900 rounded border border-neutral-700 shadow-sm flex items-center justify-center relative cursor-pointer hover:bg-neutral-800 hover:border-neutral-600 transition-all`
            }
            onClick={onClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {isEmpty ? (
                <>
                    {isArmor && <FontAwesomeIcon icon={getArmorIcon()} css={tw`text-neutral-500`} />}
                    {isOffhand && <FontAwesomeIcon icon={faUser} css={tw`text-neutral-500`} />}
                    {isHotbar && !isArmor && !isOffhand && <span css={tw`text-neutral-500 text-xs`}>{index + 1}</span>}
                </>
            ) : (
                <>
                    <ItemIcon itemId={item.id} itemName={getFormattedItemName()} serverVersion={serverVersion} />
                    {item.count > 1 && (
                        <div
                            css={tw`absolute bottom-0 right-0 text-xs bg-black bg-opacity-80 px-1 rounded-tl shadow-sm text-white font-medium`}
                        >
                            {item.count}
                        </div>
                    )}
                    {isHotbar && <div css={tw`absolute top-0 left-0 text-xs text-neutral-400 px-0.5`}>{index + 1}</div>}
                </>
            )}
            {showTooltip && !isEmpty && item && (
                <div
                    css={tw`absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 pointer-events-none`}
                >
                    <div css={tw`bg-neutral-900 border border-neutral-700 rounded-md p-2 shadow-lg whitespace-nowrap`}>
                        <div css={tw`text-neutral-100 text-xs font-medium`}>{getFormattedItemName()}</div>
                        <div css={tw`text-neutral-400 text-xs`}>{item.id.replace('minecraft:', '')}</div>
                        {item.count > 1 && <div css={tw`text-neutral-400 text-xs`}>Count: {item.count}</div>}
                        {itemIsShulker && hasShulkerContents && (
                            <div css={tw`text-purple-400 text-xs mt-1`}>
                                <FontAwesomeIcon icon={faBoxOpen} css={tw`mr-1`} />
                                {item.shulker_contents.length} items inside
                            </div>
                        )}
                        {itemIsShulker && !hasShulkerContents && (
                            <div css={tw`text-neutral-500 text-xs mt-1`}>
                                <FontAwesomeIcon icon={faBoxOpen} css={tw`mr-1`} />
                                Empty Shulker Box
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Shulker Box indicator */}
            {itemIsShulker && hasShulkerContents && (
                <div
                    css={tw`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-neutral-800`}
                    style={{ backgroundColor: getShulkerBoxColor(item.id) }}
                />
            )}
        </div>
    );
};
export default function PlayerInventory({
    playerItems,
    isLoading,
    playerName,
    serverVersion,
    onRefresh,
    onGiveItem,
    onModalStateChange,
}: PlayerInventoryProps) {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const { addError, clearFlashes, addFlash } = useFlash();
    const [inventoryType, setInventoryType] = useState<InventoryType>('inventory');
    const [selectedItem, setSelectedItem] = useState<{
        item: any;
        slot: number;
        type: 'inventory' | 'armor' | 'offhand' | 'ender_chest';
    } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedShulker, setSelectedShulker] = useState<any | null>(null);
    const [showShulkerModal, setShowShulkerModal] = useState(false);
    const isAnyModalOpen = showConfirmModal || showShulkerModal;
    useEffect(() => {
        if (onModalStateChange) {
            onModalStateChange(isAnyModalOpen);
        }
    }, [isAnyModalOpen, onModalStateChange]);
    if (isLoading) {
        return (
            <div css={tw`bg-neutral-800 rounded-lg border border-neutral-700 shadow-md`}>
                <div css={tw`p-4 border-b border-neutral-700`}>
                    <div css={tw`flex items-center justify-between`}>
                        <h4 css={tw`text-base md:text-lg font-semibold text-neutral-100 flex items-center`}>
                            <img
                                src='https://mc.nerothe.com/img/1.21.8/minecraft_chest.png'
                                alt='Chest Icon'
                                css={tw`w-6 h-6 mr-2`}
                            />
                            Player Inventory
                        </h4>
                        <Spinner size='small' />
                    </div>
                </div>
                <div css={tw`p-6 flex flex-col items-center justify-center`}>
                    <Spinner size='large' />
                    <p css={tw`mt-4 text-neutral-300`}>Loading inventory data...</p>
                </div>
            </div>
        );
    }
    if (!playerItems || playerItems.error) {
        return (
            <div css={tw`bg-neutral-800 rounded-lg border border-neutral-700 shadow-md`}>
                <div css={tw`p-4 border-b border-neutral-700`}>
                    <div css={tw`flex items-center justify-between`}>
                        <h4 css={tw`text-base md:text-lg font-semibold text-neutral-100 flex items-center`}>
                            <img
                                src='https://mc.nerothe.com/img/1.21.8/minecraft_chest.png'
                                alt='Chest Icon'
                                css={tw`w-6 h-6 mr-2`}
                            />
                            Player Inventory
                        </h4>
                    </div>
                </div>
                <div css={tw`p-6 text-center`}>
                    <div css={tw`bg-neutral-900 bg-opacity-50 rounded-lg p-6 border border-neutral-700`}>
                        <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            css={tw`text-yellow-400 text-3xl md:text-4xl mb-3`}
                        />
                        <p css={tw`text-sm md:text-base text-neutral-200 mb-2`}>
                            {playerItems?.error || 'No inventory data available'}
                        </p>
                        {playerItems?.error && (
                            <p css={tw`text-xs text-neutral-400 mt-2`}>
                                This may happen with modded servers or if the player hasn't joined yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    const currentInventory = Array.isArray(
        inventoryType === 'inventory' ? playerItems?.inventory : playerItems?.ender_chest
    )
        ? inventoryType === 'inventory'
            ? playerItems.inventory
            : playerItems.ender_chest
        : [];
    const armor = Array.isArray(playerItems?.armor) ? playerItems.armor : [];
    const offhand = Array.isArray(playerItems?.offhand) ? playerItems.offhand : [];
    let mainInventory: (any | null)[] = [];
    let hotbar: (any | null)[] = [];
    let enderChestSlots: (any | null)[] = [];
    if (inventoryType === 'inventory') {
        hotbar = new Array(9).fill(null);
        mainInventory = new Array(27).fill(null);
        currentInventory.forEach((item: any) => {
            if (item && typeof item.slot === 'number') {
                if (item.slot >= 0 && item.slot <= 8) {
                    hotbar[item.slot] = item;
                } else if (item.slot >= 9 && item.slot <= 35) {
                    mainInventory[item.slot - 9] = item;
                }
            }
        });
    } else {
        enderChestSlots = new Array(27).fill(null);
        currentInventory.forEach((item: any) => {
            if (item && typeof item.slot === 'number' && item.slot >= 0 && item.slot < 27) {
                enderChestSlots[item.slot] = item;
            }
        });
    }
    const armorSlots: (any | null)[] = [...armor];
    while (armorSlots.length < 4) {
        armorSlots.push(null);
    }
    const offhandItem = offhand[0] || null;
    const handleItemClick = (item: any, slot: number, type: 'inventory' | 'armor' | 'offhand' | 'ender_chest') => {
        if (!item || item.id === 'minecraft:air') return;
        setSelectedItem({ item, slot, type });
        setShowConfirmModal(true);
    };
    const RemoveItemDialog = asDialog({ title: 'Remove Item' })(() => {
        const { close } = useContext(DialogWrapperContext);
        const handleRemoveItem = async () => {
            if (!selectedItem) return;
            clearFlashes();
            try {
                let slotToRemove = selectedItem.slot;
                if (selectedItem.type === 'armor') {
                    slotToRemove = 3 - selectedItem.slot;
                }
                await removePlayerItem(server.uuid, playerName, slotToRemove, selectedItem.type);
                addFlash({
                    key: 'inventory',
                    type: 'success',
                    message: `Item removed from ${playerName}'s ${
                        selectedItem.type === 'armor'
                            ? ['helmet', 'chestplate', 'leggings', 'boots'][selectedItem.slot] || 'armor'
                            : selectedItem.type === 'offhand'
                            ? 'offhand'
                            : selectedItem.type === 'ender_chest'
                            ? 'ender chest'
                            : `slot ${selectedItem.slot + 1}`
                    } successfully.`,
                });
                if (onRefresh) onRefresh();
                close();
            } catch (error) {
                addError({ key: 'inventory', message: 'Failed to remove item. Please try again.' });
            }
        };
        return (
            <>
                <div css={tw`mb-6`}>
                    <p css={tw`text-sm text-neutral-300 mb-3`}>
                        Are you sure you want to remove this item from {playerName}'s inventory?
                    </p>
                    {selectedItem && (
                        <div
                            css={tw`bg-neutral-900 p-4 rounded-lg border border-neutral-700 shadow-md flex items-center gap-4`}
                        >
                            <div
                                css={tw`w-12 h-12 bg-neutral-800 rounded-md border border-neutral-700 shadow-sm flex items-center justify-center`}
                            >
                                <ItemIcon
                                    itemId={selectedItem.item.id}
                                    itemName={
                                        selectedItem.item.displayName || selectedItem.item.id.replace('minecraft:', '')
                                    }
                                    size='w-10 h-10'
                                    serverVersion={serverVersion}
                                />
                            </div>
                            <div>
                                <div css={tw`font-semibold text-neutral-100`}>
                                    {selectedItem.item.displayName || formatItemName(selectedItem.item.id)}
                                </div>
                                <div css={tw`text-sm text-neutral-400 flex items-center`}>
                                    <span>{selectedItem.item.id.replace('minecraft:', '')}</span>
                                    {selectedItem.item.count > 1 && (
                                        <span
                                            css={tw`ml-2 bg-neutral-800 px-1.5 py-0.5 rounded-full text-xs font-medium border border-neutral-700`}
                                        >
                                            × {selectedItem.item.count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <Dialog.Footer>
                    <Button.Text onClick={close}>Cancel</Button.Text>
                    {selectedItem &&
                        isShulkerBox(selectedItem.item.id) &&
                        selectedItem.item.shulker_contents &&
                        selectedItem.item.shulker_contents.length > 0 && (
                            <Button
                                onClick={() => {
                                    close();
                                    setSelectedShulker(selectedItem.item);
                                    setShowShulkerModal(true);
                                }}
                            >
                                <FontAwesomeIcon icon={faBoxOpen} css={tw`mr-2`} />
                                Open Shulker
                            </Button>
                        )}
                    <Button color='red' onClick={handleRemoveItem}>
                        <FontAwesomeIcon icon={faTrash} css={tw`mr-2`} />
                        Remove Item
                    </Button>
                </Dialog.Footer>
            </>
        );
    });
    const ShulkerBoxDialog = asDialog({
        title: selectedShulker?.displayName || formatItemName(selectedShulker?.id || 'shulker_box'),
    })(() => {
        const { close } = useContext(DialogWrapperContext);
        if (!selectedShulker) return null;
        return (
            <>
                <div css={tw`mb-4`}>
                    {/* Shulker Header Info */}
                    <div
                        css={tw`flex items-center gap-3 mb-4 p-3 bg-neutral-900 rounded-lg border border-neutral-700`}
                        style={{ borderLeftColor: getShulkerBoxColor(selectedShulker.id), borderLeftWidth: '4px' }}
                    >
                        <div
                            css={tw`w-10 h-10 bg-neutral-800 rounded-md border border-neutral-700 flex items-center justify-center`}
                        >
                            <ItemIcon
                                itemId={selectedShulker.id}
                                itemName={selectedShulker.displayName || formatItemName(selectedShulker.id)}
                                size='w-8 h-8'
                                serverVersion={serverVersion}
                            />
                        </div>
                        <div>
                            <div css={tw`font-semibold text-neutral-100`}>
                                {selectedShulker.displayName || formatItemName(selectedShulker.id)}
                            </div>
                            <div css={tw`text-xs text-neutral-400`}>
                                {selectedShulker.shulker_contents?.length || 0} items stored
                            </div>
                        </div>
                    </div>
                    {/* Shulker Contents Grid */}
                    <div css={tw`bg-neutral-900 rounded-lg p-3 border border-neutral-700`}>
                        <div css={tw`text-xs text-neutral-400 mb-2 font-medium flex items-center`}>
                            <FontAwesomeIcon icon={faBoxOpen} css={tw`mr-1.5`} />
                            Contents
                        </div>
                        <div css={tw`grid grid-cols-9 gap-1`}>
                            {Array.from({ length: 27 }).map((_, index) => {
                                const item = selectedShulker.shulker_contents?.find((i: any) => i.slot === index);
                                return (
                                    <ShulkerSlot
                                        key={`shulker-slot-${index}`}
                                        item={item}
                                        serverVersion={serverVersion}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
                <Dialog.Footer>
                    <Button.Text onClick={close}>Close</Button.Text>
                </Dialog.Footer>
            </>
        );
    });
    const isItemSelected = (slot: number, type: 'inventory' | 'armor' | 'offhand' | 'ender_chest') => {
        return selectedItem?.slot === slot && selectedItem?.type === type;
    };
    const armorTypes = ['helmet', 'chestplate', 'leggings', 'boots'];
    return (
        <div css={tw`bg-neutral-800 rounded-lg border border-neutral-700 shadow-md`}>
            <div css={tw`p-4 border-b border-neutral-700`}>
                <div css={tw`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-0`}>
                    <h4 css={tw`text-base md:text-lg font-semibold text-neutral-100 flex items-center gap-1 md:gap-2`}>
                        <img
                            src={
                                inventoryType === 'inventory'
                                    ? 'https://mc.nerothe.com/img/1.21.8/minecraft_chest.png'
                                    : 'https://mc.nerothe.com/img/1.21.8/minecraft_ender_chest.png'
                            }
                            alt='Inventory Icon'
                            css={tw`w-6 h-6`}
                        />
                        <span css={tw`truncate`}>
                            {playerName}'s {inventoryType === 'inventory' ? 'Inventory' : 'Ender Chest'}
                        </span>
                    </h4>
                    <button
                        onClick={() => setInventoryType(inventoryType === 'inventory' ? 'ender_chest' : 'inventory')}
                        css={[
                            tw`flex items-center gap-1 md:gap-2 px-3 py-1.5 rounded-lg transition-colors text-xs md:text-sm border shadow-sm`,
                            inventoryType === 'inventory'
                                ? tw`bg-gray-900 border-cyan-400 text-cyan-300 hover:bg-gray-800 hover:border-cyan-300`
                                : tw`bg-gray-900 border-purple-400 text-purple-300 hover:bg-gray-800 hover:border-purple-300`,
                        ]}
                    >
                        {inventoryType === 'inventory' ? (
                            <img
                                src='https://mc.nerothe.com/img/1.21.8/minecraft_ender_chest.png'
                                alt='Ender Chest Icon'
                                css={tw`w-5 h-5`}
                            />
                        ) : (
                            <img
                                src='https://mc.nerothe.com/img/1.21.8/minecraft_chest.png'
                                alt='Inventory Icon'
                                css={tw`w-5 h-5`}
                            />
                        )}
                        <span css={tw`truncate`}>{inventoryType === 'inventory' ? 'Ender Chest' : 'Inventory'}</span>
                    </button>
                </div>
            </div>
            <div css={tw`p-4`}>
                <div
                    css={tw`bg-neutral-900 rounded-lg p-3 md:p-4 border border-neutral-700 shadow-inner overflow-x-auto`}
                >
                    {inventoryType === 'inventory' ? (
                        <div css={tw`flex flex-col lg:flex-row gap-4 lg:gap-8 min-w-max lg:min-w-0`}>
                            <div
                                css={tw`flex flex-row lg:flex-col items-center justify-center lg:justify-start gap-4 lg:gap-6`}
                            >
                                <div css={tw`flex flex-col`}>
                                    <div
                                        css={tw`text-xs md:text-sm text-neutral-300 font-medium mb-1 md:mb-2 flex items-center`}
                                    >
                                        <FontAwesomeIcon icon={faVest} css={tw`text-primary-400 mr-1.5`} />
                                        Armor
                                    </div>
                                    <div
                                        css={tw`flex flex-col gap-1 md:gap-2 bg-neutral-800 bg-opacity-50 p-2 rounded-lg border border-neutral-700`}
                                    >
                                        {armorSlots.map((item, index) => (
                                            <InventorySlot
                                                key={`armor-${index}`}
                                                item={item}
                                                index={index}
                                                isArmor={true}
                                                armorType={armorTypes[index]}
                                                onClick={() => {
                                                    if (item) {
                                                        handleItemClick(item, index, 'armor');
                                                    } else if (onGiveItem) {
                                                        onGiveItem(index, 'armor');
                                                    }
                                                }}
                                                isSelected={isItemSelected(index, 'armor')}
                                                serverVersion={serverVersion}
                                            />
                                        ))}
                                    </div>
                                    <div
                                        css={tw`flex flex-col gap-1 md:gap-2 bg-neutral-800 bg-opacity-50 p-2 rounded-lg border border-neutral-700 mt-1 md:mt-2`}
                                    >
                                        <InventorySlot
                                            item={offhandItem}
                                            index={0}
                                            isOffhand={true}
                                            onClick={() => {
                                                if (offhandItem) {
                                                    handleItemClick(offhandItem, 0, 'offhand');
                                                } else if (onGiveItem) {
                                                    onGiveItem(0, 'offhand');
                                                }
                                            }}
                                            isSelected={isItemSelected(0, 'offhand')}
                                            serverVersion={serverVersion}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div css={tw`flex-1`}>
                                <div
                                    css={tw`text-xs md:text-sm text-neutral-300 font-medium mb-1 md:mb-2 flex items-center`}
                                >
                                    <FontAwesomeIcon icon={faBox} css={tw`text-primary-400 mr-1.5`} />
                                    Main Inventory
                                </div>
                                <div
                                    css={tw`grid grid-cols-9 gap-1 md:gap-2 mb-7 bg-neutral-800 bg-opacity-50 p-2 rounded-lg border border-neutral-700`}
                                >
                                    {mainInventory.map((item, index) => (
                                        <InventorySlot
                                            key={`main-${index}`}
                                            item={item}
                                            index={index + 9}
                                            onClick={() => {
                                                if (item) {
                                                    handleItemClick(item, item?.slot ?? index + 9, 'inventory');
                                                } else if (onGiveItem) {
                                                    onGiveItem(index + 9, 'inventory');
                                                }
                                            }}
                                            isSelected={isItemSelected(index + 9, 'inventory')}
                                            serverVersion={serverVersion}
                                        />
                                    ))}
                                </div>
                                <div
                                    css={tw`text-xs md:text-sm text-neutral-300 font-medium mb-1 md:mb-2 flex items-center`}
                                >
                                    <FontAwesomeIcon icon={faChessBoard} css={tw`text-primary-400 mr-1.5`} />
                                    Hotbar
                                </div>
                                <div
                                    css={tw`grid grid-cols-9 gap-1 md:gap-2 bg-neutral-800 bg-opacity-50 p-2 rounded-lg border border-neutral-700`}
                                >
                                    {hotbar.map((item, index) => (
                                        <InventorySlot
                                            key={`hotbar-${index}`}
                                            item={item}
                                            index={index}
                                            isHotbar={true}
                                            onClick={() => {
                                                if (item) {
                                                    handleItemClick(item, item?.slot ?? index, 'inventory');
                                                } else if (onGiveItem) {
                                                    onGiveItem(index, 'inventory');
                                                }
                                            }}
                                            isSelected={isItemSelected(index, 'inventory')}
                                            serverVersion={serverVersion}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div css={tw`flex-1`}>
                            <div
                                css={tw`text-xs md:text-sm text-neutral-300 font-medium mb-1 md:mb-2 flex items-center`}
                            >
                                <FontAwesomeIcon icon={faChess} css={tw`text-primary-400 mr-1.5`} />
                                Ender Chest
                            </div>
                            <div
                                css={tw`grid grid-cols-9 gap-1 md:gap-2 bg-neutral-800 bg-opacity-50 p-2 rounded-lg border border-neutral-700`}
                            >
                                {enderChestSlots.map((item, index) => (
                                    <InventorySlot
                                        key={`ender-${index}`}
                                        item={item}
                                        index={index}
                                        onClick={() => {
                                            if (item) {
                                                handleItemClick(item, item?.slot ?? index, 'ender_chest');
                                            } else if (onGiveItem) {
                                                onGiveItem(index, 'ender_chest');
                                            }
                                        }}
                                        isSelected={isItemSelected(item?.slot ?? index, 'ender_chest')}
                                        serverVersion={serverVersion}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showConfirmModal && selectedItem && (
                <RemoveItemDialog
                    open={showConfirmModal}
                    onClose={() => {
                        setShowConfirmModal(false);
                        setSelectedItem(null);
                    }}
                />
            )}
            {showShulkerModal && selectedShulker && (
                <ShulkerBoxDialog
                    open={showShulkerModal}
                    onClose={() => {
                        setShowShulkerModal(false);
                        setSelectedShulker(null);
                    }}
                />
            )}
        </div>
    );
}
