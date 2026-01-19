import React, { useState, useEffect, useRef, useCallback } from 'react';
import tw from 'twin.macro';
import styled, { css } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faTimes, faChevronDown } from '@fortawesome/free-solid-svg-icons';
interface MinecraftItem {
    id: string;
    nama: string;
    displayName: string;
    stackSize: number;
}
interface GiveItemProps {
    nama?: string;
    value: string;
    onChange: (value: string) => void;
    onSelect: (item: MinecraftItem) => void;
    serverVersion?: string;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
    description?: string;
    hasError?: boolean;
    error?: string;
}
const AutocompleteContainer = styled.div`
    ${tw`relative`};
`;
const AutocompleteLabel = styled.label<{ isLight?: boolean }>`
    ${tw`block text-xs uppercase text-neutral-200 mb-1 sm:mb-2`};
    ${(props) => props.isLight && tw`text-neutral-700`};
`;
const AutocompleteInput = styled.input<{ hasError?: boolean }>`
    resize: none;
    ${tw`appearance-none outline-none w-full min-w-0`};
    ${tw`p-3 pr-10 border-2 rounded text-sm transition-all duration-150`};
    ${tw`bg-neutral-600 border-neutral-500 hover:border-neutral-400 text-neutral-200 shadow-none focus:ring-0`};
    &:required,
    &:invalid {
        ${tw`shadow-none`};
    }
    &:not(:disabled):not(:read-only):focus {
        ${tw`shadow-md border-primary-300 ring-2 ring-primary-400 ring-opacity-50`};
        ${(props) => props.hasError && tw`border-red-300 ring-red-200`};
    }
    &:disabled {
        ${tw`opacity-75`};
    }
    ${(props) => props.hasError && tw`text-red-100 border-red-400 hover:border-red-300`};
`;
const ClearButton = styled.button`
    ${tw`absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors duration-200`};
`;
const DropdownContainer = styled.div<{ top: number; left: number; width: number }>`
    ${tw`fixed bg-neutral-600 border-2 border-neutral-500 rounded shadow-lg max-h-64 overflow-y-auto z-[9999]`};
    ${tw`shadow-none focus:ring-0`};
    top: ${(props) => props.top}px;
    left: ${(props) => props.left}px;
    width: ${(props) => props.width}px;
    &:hover:not(:disabled),
    &:focus {
        ${tw`border-neutral-400`};
    }
`;
const DropdownItem = styled.div<{ selected: boolean }>`
    ${tw`flex items-center px-3 py-2 cursor-pointer transition-all duration-150 border-b border-neutral-500 last:border-b-0`};
    ${(props) => (props.selected ? tw`bg-primary-500/20 border-primary-500/50` : tw`hover:bg-neutral-500/50`)};
`;
const ItemIcon = styled.img`
    ${tw`w-6 h-6 rounded-md mr-3 border border-neutral-500`};
`;
const ItemInfo = styled.div`
    ${tw`flex-grow`};
`;
const ItemName = styled.div`
    ${tw`font-medium text-neutral-100 text-sm`};
`;
const ItemId = styled.div`
    ${tw`text-xs text-neutral-400`};
`;
const LoadingSpinner = styled.div`
    ${tw`absolute right-3 top-1/2 transform -translate-y-1/2`};
`;
const HelpText = styled.p<{ hasError?: boolean }>`
    ${tw`mt-1 text-xs`};
    ${(props) => (props.hasError ? tw`text-red-200` : tw`text-neutral-200`)}
`;
const extractVersionNumber = (serverVersion?: string): string => {
    if (!serverVersion) return '1.20.4';
    const match = serverVersion.match(/(\d+\.\d+(?:\.\d+)?)/);
    return match ? match[1] : '1.20.4';
};
const getItemIconUrl = (itemId: string, serverVersion?: string): string => {
    const cleanId = itemId.replace('minecraft:', '');
    const mcVersion = extractVersionNumber(serverVersion);
    return `https://mc.nerothe.com/img/1.21.8/minecraft_${cleanId}.png`;
};
const formatItemName = (itemId: string): string => {
    const cleanId = itemId.replace('minecraft:', '');
    return cleanId
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
const GiveItem: React.FC<GiveItemProps> = ({
    nama,
    value,
    onChange,
    onSelect,
    serverVersion,
    placeholder = 'Search for an item...',
    disabled = false,
    label,
    description,
    hasError,
    error,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<MinecraftItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<MinecraftItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [allItemsLoaded, setAllItemsLoaded] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fetchItems = useCallback(async () => {
        if (allItemsLoaded) return;
        setIsLoading(true);
        const FALLBACK_VERSION = '1.21.8';
        const mcVersion = extractVersionNumber(serverVersion);
        const tryFetchItems = async (mcVersion: string): Promise<any[]> => {
            const response = await fetch(
                `https://raw.githubusercontent.com/PrismarineJS/minecraft-data/refs/heads/master/data/pc/${mcVersion}/items.json`
            );
            if (!response.ok) {
                throw new Error(`Failed to fetch items for version ${mcVersion}`);
            }
            return response.json();
        };
        try {
            let data: any[];
            try {
                data = await tryFetchItems(mcVersion);
            } catch (error) {
                console.warn(`Version ${mcVersion} not found, falling back to ${FALLBACK_VERSION}`);
                data = await tryFetchItems(FALLBACK_VERSION);
            }
            const minecraftItems: MinecraftItem[] = data.map((item: any) => ({
                id: item.name,
                nama: item.name,
                displayName: item.displayName || formatItemName(item.name),
                stackSize: item.stackSize || 64,
            }));
            setItems(minecraftItems);
            setAllItemsLoaded(true);
        } catch (error) {
            console.error('Error fetching items:', error);
            setAllItemsLoaded(true);
        } finally {
            setIsLoading(false);
        }
    }, [serverVersion, allItemsLoaded]);
    useEffect(() => {
        if (!value.trim()) {
            setFilteredItems([]);
            setSelectedIndex(-1);
            return;
        }
        const searchTerm = value.toLowerCase();
        const filtered = items
            .filter(
                (item) =>
                    item.displayName.toLowerCase().includes(searchTerm) ||
                    item.nama.toLowerCase().includes(searchTerm) ||
                    item.id.toLowerCase().includes(searchTerm)
            )
            .slice(0, 10);
        setFilteredItems(filtered);
        setSelectedIndex(filtered.length > 0 ? 0 : -1);
    }, [value, items]);
    const updatePosition = useCallback(() => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, []);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
                    handleSelectItem(filteredItems[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };
    const handleSelectItem = (item: MinecraftItem) => {
        onChange(item.nama);
        onSelect(item);
        setIsOpen(false);
        setSelectedIndex(-1);
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setIsOpen(true);
        updatePosition();
        if (!allItemsLoaded && !isLoading) {
            fetchItems();
        }
    };
    const handleFocus = () => {
        setIsOpen(true);
        updatePosition();
        if (!allItemsLoaded && !isLoading) {
            fetchItems();
        }
    };
    const handleClear = () => {
        onChange('');
        setIsOpen(false);
        setSelectedIndex(-1);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSelectedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    return (
        <AutocompleteContainer>
            {label && <AutocompleteLabel htmlFor={nama}>{label}</AutocompleteLabel>}
            <AutocompleteInput
                ref={inputRef}
                type='text'
                value={value}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                hasError={hasError}
            />
            {isLoading && (
                <LoadingSpinner>
                    <FontAwesomeIcon icon={faSpinner} spin />
                </LoadingSpinner>
            )}
            {value.trim() && !isLoading && (
                <ClearButton onClick={handleClear}>
                    <FontAwesomeIcon icon={faTimes} />
                </ClearButton>
            )}
            {isOpen && filteredItems.length > 0 && (
                <DropdownContainer
                    ref={dropdownRef}
                    top={dropdownPosition.top}
                    left={dropdownPosition.left}
                    width={dropdownPosition.width}
                >
                    {filteredItems.map((item, index) => (
                        <DropdownItem
                            key={item.id}
                            selected={index === selectedIndex}
                            onClick={() => handleSelectItem(item)}
                        >
                            <ItemIcon
                                src={getItemIconUrl(item.id, serverVersion)}
                                alt={item.displayName}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <ItemInfo>
                                <ItemName>{item.displayName}</ItemName>
                                <ItemId>{item.nama}</ItemId>
                            </ItemInfo>
                        </DropdownItem>
                    ))}
                </DropdownContainer>
            )}
            {hasError && error ? (
                <HelpText hasError={true}>{error.charAt(0).toUpperCase() + error.slice(1)}</HelpText>
            ) : description ? (
                <HelpText hasError={false}>{description}</HelpText>
            ) : null}
        </AutocompleteContainer>
    );
};
export default GiveItem;
