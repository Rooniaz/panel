import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button/index';
import Spinner from '@/components/elements/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLayerGroup,
    faArrowUp,
    faArrowDown,
    faTrash,
    faGlobe,
    faCode,
    faPalette,
    faCheck,
} from '@fortawesome/free-solid-svg-icons';
import {
    getInstalledAddons,
    deleteAddon,
    updateAddonPriority,
    getPackIconUrl,
    setDefaultWorld,
    deleteWorld,
    InstalledAddon,
    World,
    PackConfig,
    UpdatePriorityRequest,
} from '@/api/server/addons';
interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
}
interface AddonIconContainerProps {
    type: 'behavior' | 'resource';
    children: React.ReactNode;
}
interface ComponentProps {
    children: React.ReactNode;
}
interface TabButtonProps extends ComponentProps {
    active: boolean;
    onClick: () => void;
}
interface WorldBadgeProps extends ComponentProps {
    isDefault: boolean;
}
const AddonIconContainer = ({ type, children }: AddonIconContainerProps) => (
    <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            type === 'behavior' ? 'bg-red-500/20' : 'bg-blue-500/20'
        }`}
    >
        {children}
    </div>
);
const TabContainer = ({ children }: ComponentProps) => (
    <div className='flex border-b border-neutral-700 mb-6'>{children}</div>
);
const TabButton = ({ active, children, onClick }: TabButtonProps) => (
    <button
        className={`px-4 py-2 text-sm transition-colors duration-150 ${
            active ? 'border-b-2 border-primary-500 text-neutral-200' : 'text-neutral-400 hover:text-neutral-200'
        }`}
        onClick={onClick}
    >
        {children}
    </button>
);
const AddonItem = ({ children }: ComponentProps) => (
    <div className='bg-neutral-700 rounded-lg p-4 mb-3 border border-neutral-600'>{children}</div>
);
const AddonHeader = ({ children }: ComponentProps) => (
    <div className='flex items-center justify-between'>{children}</div>
);
const AddonTitle = ({ children }: ComponentProps) => (
    <h3 className='font-medium text-neutral-100 flex items-center gap-2'>{children}</h3>
);
const AddonVersion = ({ children }: ComponentProps) => <span className='text-xs text-neutral-400'>{children}</span>;
const AddonActions = ({ children }: ComponentProps) => <div className='flex items-center gap-2'>{children}</div>;
const WorldItem = ({ children }: ComponentProps) => (
    <div className='bg-neutral-700 rounded-lg p-4 mb-3 border border-neutral-600'>{children}</div>
);
const WorldHeader = ({ children }: ComponentProps) => (
    <div className='flex items-center justify-between'>{children}</div>
);
const WorldTitle = ({ children }: ComponentProps) => (
    <h3 className='font-medium text-neutral-100 flex items-center gap-2'>{children}</h3>
);
const WorldBadge = ({ isDefault, children }: WorldBadgeProps) => (
    <span
        className={`text-xs px-2 py-1 rounded ${
            isDefault ? 'bg-green-600 text-green-100' : 'bg-neutral-600 text-neutral-300'
        }`}
    >
        {children}
    </span>
);
const DragHandle = ({ children }: ComponentProps) => (
    <div className='cursor-move text-neutral-400 hover:text-neutral-200 mr-3'>{children}</div>
);
export default ({ open, onClose, onSuccess }: Props) => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState<'behavior' | 'resource' | 'worlds'>('behavior');
    const [behaviorPacks, setBehaviorPacks] = useState<InstalledAddon[]>([]);
    const [resourcePacks, setResourcePacks] = useState<InstalledAddon[]>([]);
    const [worlds, setWorlds] = useState<World[]>([]);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [settingDefault, setSettingDefault] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const loadInstalledAddons = async () => {
        setLoading(true);
        try {
            const response = await getInstalledAddons(id);
            const behaviorPacks = response.addons.filter((addon: InstalledAddon) => addon.type === 'behavior');
            const resourcePacks = response.addons.filter((addon: InstalledAddon) => addon.type === 'resource');
            setBehaviorPacks(behaviorPacks);
            setResourcePacks(resourcePacks);
            setWorlds(response.worlds);
            setHasChanges(false);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };
    const deleteAddonHandler = async (addonType: 'behavior' | 'resource', addonUuid: string) => {
        setDeleting(addonUuid);
        try {
            await deleteAddon(id, addonType, addonUuid);
            if (addonType === 'behavior') {
                setBehaviorPacks((prev) => prev.filter((pack) => pack.uuid !== addonUuid));
            } else {
                setResourcePacks((prev) => prev.filter((pack) => pack.uuid !== addonUuid));
            }
            onSuccess(`Addon deleted successfully`);
            setHasChanges(true);
        } catch (error) {
        } finally {
            setDeleting(null);
        }
    };
    const moveAddon = (addonType: 'behavior' | 'resource', fromIndex: number, toIndex: number) => {
        const packs = addonType === 'behavior' ? [...behaviorPacks] : [...resourcePacks];
        const [movedPack] = packs.splice(fromIndex, 1);
        packs.splice(toIndex, 0, movedPack);
        if (addonType === 'behavior') {
            setBehaviorPacks(packs);
        } else {
            setResourcePacks(packs);
        }
        setHasChanges(true);
    };
    const savePriority = async () => {
        setSaving(true);
        try {
            const behaviorPackConfigs: PackConfig[] = behaviorPacks
                .filter((p) => p.uuid)
                .map((p) => ({
                    pack_id: p.uuid!,
                    version: Array.isArray(p.version)
                        ? p.version.map((v) => parseInt(v, 10))
                        : p.version.split('.').map((v: string) => parseInt(v, 10)),
                }));
            const resourcePackConfigs: PackConfig[] = resourcePacks
                .filter((p) => p.uuid)
                .map((p) => ({
                    pack_id: p.uuid!,
                    version: Array.isArray(p.version)
                        ? p.version.map((v) => parseInt(v, 10))
                        : p.version.split('.').map((v: string) => parseInt(v, 10)),
                }));
            await updateAddonPriority(id, {
                behavior_packs: behaviorPackConfigs,
                resource_packs: resourcePackConfigs,
            });
            onSuccess('Addon priority updated successfully.');
            setHasChanges(false);
            await loadInstalledAddons();
        } catch (error) {
        } finally {
            setSaving(false);
        }
    };
    const setDefaultWorldHandler = async (worldName: string) => {
        setSettingDefault(worldName);
        try {
            await setDefaultWorld(id, worldName);
            setWorlds((prev) =>
                prev.map((world) => ({
                    ...world,
                    isDefault: world.name === worldName,
                }))
            );
            onSuccess(`Default world set to ${worldName}`);
        } catch (error) {
        } finally {
            setSettingDefault(null);
        }
    };
    const deleteWorldHandler = async (worldName: string) => {
        try {
            await deleteWorld(id, worldName);
            setWorlds((prev) => prev.filter((world) => world.name !== worldName));
            onSuccess(`World ${worldName} deleted`);
        } catch (error) {}
    };
    useEffect(() => {
        if (open) {
            loadInstalledAddons();
        }
    }, [open]);
    return (
        <Dialog open={open} onClose={onClose} title='Manage Addons'>
            {loading ? (
                <div className='flex justify-center items-center py-8'>
                    <Spinner size='large' />
                </div>
            ) : (
                <>
                    <TabContainer>
                        <TabButton active={activeTab === 'behavior'} onClick={() => setActiveTab('behavior')}>
                            Behavior Packs ({behaviorPacks.length})
                        </TabButton>
                        <TabButton active={activeTab === 'resource'} onClick={() => setActiveTab('resource')}>
                            Resource Packs ({resourcePacks.length})
                        </TabButton>
                        <TabButton active={activeTab === 'worlds'} onClick={() => setActiveTab('worlds')}>
                            Worlds ({worlds.length})
                        </TabButton>
                    </TabContainer>
                    <div className='max-h-96 overflow-y-auto'>
                        {activeTab === 'behavior' && (
                            <>
                                {behaviorPacks.length === 0 ? (
                                    <p className='text-center text-neutral-400 py-8'>No behavior packs installed</p>
                                ) : (
                                    behaviorPacks.map((pack, index) => (
                                        <AddonItem key={pack.uuid}>
                                            <AddonHeader>
                                                <AddonTitle>
                                                    <AddonIconContainer type='behavior'>
                                                        {pack.has_icon ? (
                                                            <img
                                                                src={getPackIconUrl(id, pack.path)}
                                                                alt={pack.name}
                                                                className='w-10 h-10 object-cover'
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.nextElementSibling?.classList.remove(
                                                                        'hidden'
                                                                    );
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`${pack.has_icon ? 'hidden' : ''}`}>
                                                            <FontAwesomeIcon
                                                                icon={faCode}
                                                                className='w-5 h-5 text-orange-400'
                                                            />
                                                        </div>
                                                    </AddonIconContainer>
                                                    <div className='flex-1 min-w-0'>
                                                        <div className='font-medium truncate'>{pack.name}</div>
                                                        <AddonVersion>
                                                            v
                                                            {Array.isArray(pack.version)
                                                                ? pack.version.join('.')
                                                                : pack.version}
                                                        </AddonVersion>
                                                    </div>
                                                </AddonTitle>
                                                <AddonActions>
                                                    <Button.Text
                                                        size={'small' as any}
                                                        variant={'text' as any}
                                                        onClick={() =>
                                                            moveAddon('behavior', index, Math.max(0, index - 1))
                                                        }
                                                        disabled={index === 0}
                                                    >
                                                        <FontAwesomeIcon icon={faArrowUp} />
                                                    </Button.Text>
                                                    <Button.Text
                                                        size={'small' as any}
                                                        variant={'text' as any}
                                                        onClick={() =>
                                                            moveAddon(
                                                                'behavior',
                                                                index,
                                                                Math.min(behaviorPacks.length - 1, index + 1)
                                                            )
                                                        }
                                                        disabled={index === behaviorPacks.length - 1}
                                                    >
                                                        <FontAwesomeIcon icon={faArrowDown} />
                                                    </Button.Text>
                                                    <Button.Danger
                                                        size={'small' as any}
                                                        variant={'text' as any}
                                                        color='red'
                                                        onClick={() => deleteAddonHandler('behavior', pack.uuid)}
                                                        disabled={deleting === pack.uuid}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </Button.Danger>
                                                </AddonActions>
                                            </AddonHeader>
                                        </AddonItem>
                                    ))
                                )}
                            </>
                        )}
                        {activeTab === 'resource' && (
                            <>
                                {resourcePacks.length === 0 ? (
                                    <p className='text-center text-neutral-400 py-8'>No resource packs installed</p>
                                ) : (
                                    resourcePacks.map((pack, index) => (
                                        <AddonItem key={pack.uuid}>
                                            <AddonHeader>
                                                <AddonTitle>
                                                    <AddonIconContainer type='resource'>
                                                        {pack.has_icon ? (
                                                            <img
                                                                src={getPackIconUrl(id, pack.path)}
                                                                alt={pack.name}
                                                                className='w-10 h-10 object-cover'
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.nextElementSibling?.classList.remove(
                                                                        'hidden'
                                                                    );
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`${pack.has_icon ? 'hidden' : ''}`}>
                                                            <FontAwesomeIcon
                                                                icon={faPalette}
                                                                className='w-5 h-5 text-blue-400'
                                                            />
                                                        </div>
                                                    </AddonIconContainer>
                                                    <div className='flex-1 min-w-0'>
                                                        <div className='font-medium truncate'>{pack.name}</div>
                                                        <AddonVersion>
                                                            v
                                                            {Array.isArray(pack.version)
                                                                ? pack.version.join('.')
                                                                : pack.version}
                                                        </AddonVersion>
                                                    </div>
                                                </AddonTitle>
                                                <AddonActions>
                                                    <Button.Text
                                                        size={'small' as any}
                                                        variant={'text' as any}
                                                        onClick={() =>
                                                            moveAddon('resource', index, Math.max(0, index - 1))
                                                        }
                                                        disabled={index === 0}
                                                    >
                                                        <FontAwesomeIcon icon={faArrowUp} />
                                                    </Button.Text>
                                                    <Button.Text
                                                        size={'small' as any}
                                                        variant={'text' as any}
                                                        onClick={() =>
                                                            moveAddon(
                                                                'resource',
                                                                index,
                                                                Math.min(resourcePacks.length - 1, index + 1)
                                                            )
                                                        }
                                                        disabled={index === resourcePacks.length - 1}
                                                    >
                                                        <FontAwesomeIcon icon={faArrowDown} />
                                                    </Button.Text>
                                                    <Button.Danger
                                                        size={'small' as any}
                                                        variant={'text' as any}
                                                        color='red'
                                                        onClick={() => deleteAddonHandler('resource', pack.uuid)}
                                                        disabled={deleting === pack.uuid}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </Button.Danger>
                                                </AddonActions>
                                            </AddonHeader>
                                        </AddonItem>
                                    ))
                                )}
                            </>
                        )}
                        {activeTab === 'worlds' && (
                            <>
                                {worlds.length === 0 ? (
                                    <p className='text-center text-neutral-400 py-8'>No worlds found</p>
                                ) : (
                                    worlds.map((world) => (
                                        <WorldItem key={world.name}>
                                            <WorldHeader>
                                                <WorldTitle>
                                                    <FontAwesomeIcon icon={faGlobe} />
                                                    {world.name}
                                                    <WorldBadge isDefault={world.isDefault}>
                                                        {world.isDefault ? 'Default' : 'Available'}
                                                    </WorldBadge>
                                                </WorldTitle>
                                                <AddonActions>
                                                    {!world.isDefault && (
                                                        <Button
                                                            size={'small' as any}
                                                            variant={'text' as any}
                                                            onClick={() => setDefaultWorldHandler(world.name)}
                                                            disabled={settingDefault === world.name}
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} />
                                                        </Button>
                                                    )}
                                                    <Button.Danger
                                                        size={'small' as any}
                                                        variant={'text' as any}
                                                        color='red'
                                                        onClick={() => deleteWorldHandler(world.name)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </Button.Danger>
                                                </AddonActions>
                                            </WorldHeader>
                                        </WorldItem>
                                    ))
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
            <Dialog.Footer>
                <Button.Text onClick={onClose}>Close</Button.Text>
                {hasChanges && (
                    <Button onClick={savePriority} disabled={saving}>
                        {saving ? (
                            <span className='flex items-center'>
                                <Spinner size='small' />
                                <span className='ml-2'>Applied</span>
                            </span>
                        ) : (
                            'Apply'
                        )}
                    </Button>
                )}
            </Dialog.Footer>
        </Dialog>
    );
};
