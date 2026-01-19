import React, { useEffect, useState, useRef } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';
import Switch from '@/components/elements/Switch';
import Select from '@/components/elements/Select';
import GreyRowBox from '@/components/elements/GreyRowBox';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import {
    CogIcon,
    BeakerIcon,
    GlobeIcon,
    InformationCircleIcon,
    ExclamationIcon,
    AdjustmentsIcon,
} from '@heroicons/react/outline';
import {
    getProperties,
    saveProperties,
    getWorlds,
    getExperiments,
    saveExperiments,
    getWorldSettings,
    saveWorldSettings,
    syncStartupWithProperties,
    World,
    Experiment,
    WorldSetting,
} from '@/api/server/bedrock/config';
import { ServerEggVariable } from '@/api/server/types';
type TabType = 'properties' | 'experiments' | 'world-settings';
const TAB_OPTIONS = [
    { value: 'properties', label: 'Server Properties', icon: CogIcon },
    { value: 'experiments', label: 'Experiments', icon: BeakerIcon },
    { value: 'world-settings', label: 'World Settings', icon: AdjustmentsIcon },
] as const;
const VIEW_MODE_OPTIONS = [
    { value: 'visual', label: 'Visual' },
    { value: 'raw', label: 'Raw Code' },
] as const;
const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    difficulty: [
        { value: 'peaceful', label: 'Peaceful' },
        { value: 'easy', label: 'Easy' },
        { value: 'normal', label: 'Normal' },
        { value: 'hard', label: 'Hard' },
    ],
    gamemode: [
        { value: 'survival', label: 'Survival' },
        { value: 'creative', label: 'Creative' },
        { value: 'adventure', label: 'Adventure' },
    ],
    'default-player-permission-level': [
        { value: 'visitor', label: 'Visitor' },
        { value: 'member', label: 'Member' },
        { value: 'operator', label: 'Operator' },
    ],
    'server-authoritative-movement': [
        { value: 'client-auth', label: 'Client Auth' },
        { value: 'server-auth', label: 'Server Auth' },
        { value: 'server-auth-with-rewind', label: 'Server Auth with Rewind' },
    ],
    'chat-restriction': [
        { value: 'None', label: 'None' },
        { value: 'Dropped', label: 'Dropped' },
        { value: 'Disabled', label: 'Disabled' },
    ],
    'compression-algorithm': [
        { value: 'zlib', label: 'Zlib' },
        { value: 'snappy', label: 'Snappy' },
    ],
};
export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [activeTab, setActiveTab] = useState<TabType>('properties');
    const [propertiesContent, setPropertiesContent] = useState<Record<string, string>>({});
    const [propertiesRaw, setPropertiesRaw] = useState<string>('');
    const [propertiesLoading, setPropertiesLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'visual' | 'raw'>('visual');
    const [search, setSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstLoad = useRef(true);
    const lastSavedRawContent = useRef<string | null>(null);
    const getRawContent = useRef<() => Promise<string>>(() => Promise.reject('no editor'));
    const [worlds, setWorlds] = useState<World[]>([]);
    const [selectedWorld, setSelectedWorld] = useState<string>('');
    const [experiments, setExperiments] = useState<Record<string, Experiment>>({});
    const [experimentsLoading, setExperimentsLoading] = useState(false);
    const [experimentsSaving, setExperimentsSaving] = useState(false);
    const [experimentsLastSaved, setExperimentsLastSaved] = useState<Date | null>(null);
    const experimentsFirstLoad = useRef(true);
    const experimentsSaveTimeout = useRef<NodeJS.Timeout | null>(null);
    const [worldSettings, setWorldSettings] = useState<Record<string, WorldSetting>>({});
    const [worldSettingsLoading, setWorldSettingsLoading] = useState(false);
    const [worldSettingsSaving, setWorldSettingsSaving] = useState(false);
    const [worldSettingsLastSaved, setWorldSettingsLastSaved] = useState<Date | null>(null);
    const worldSettingsFirstLoad = useRef(true);
    const worldSettingsSaveTimeout = useRef<NodeJS.Timeout | null>(null);
    const useAutoSave = (
        data: any,
        saveFunction: () => Promise<void>,
        dependencies: any[],
        enabled: boolean = true
    ) => {
        const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const [isSaving, setIsSaving] = useState(false);
        useEffect(() => {
            if (!enabled) return;
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            setIsSaving(true);
            saveTimeoutRef.current = setTimeout(() => {
                saveFunction()
                    .catch(console.error)
                    .finally(() => setIsSaving(false));
            }, 1000);
            return () => {
                if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            };
        }, dependencies);
        return isSaving;
    };
    const loadData = async (loader: () => Promise<any>, setter: (data: any) => void, loadingSetter: (loading: boolean) => void) => {
        loadingSetter(true);
        try {
            const data = await loader();
            setter(data);
        } catch (error) {
            clearAndAddHttpError({ key: 'bedrock-config', error });
        } finally {
            loadingSetter(false);
        }
    };
    const handleGetRawContent = React.useCallback((callback: () => Promise<string>) => {
        getRawContent.current = callback;
    }, []);
    const loadProperties = () => {
        setPropertiesLoading(true);
        clearFlashes('bedrock-config');
        getProperties(uuid)
            .then((data) => {
                if (data.success) {
                    setPropertiesContent(data.content);
                    setPropertiesRaw(data.raw);
                    lastSavedRawContent.current = data.raw;
                    isFirstLoad.current = true;
                } else {
                    addFlash({
                        key: 'bedrock-config',
                        type: 'warning',
                        message: data.error || 'server.properties not found',
                    });
                }
            })
            .catch((error) => clearAndAddHttpError({ key: 'bedrock-config', error }))
            .finally(() => setPropertiesLoading(false));
    };
    const loadWorlds = () => {
        getWorlds(uuid)
            .then((data) => {
                if (data.success) {
                    setWorlds(data.worlds);
                    if (data.default_world && !selectedWorld) {
                        setSelectedWorld(data.default_world);
                    } else if (data.worlds.length > 0 && !selectedWorld) {
                        setSelectedWorld(data.worlds[0].name);
                    }
                }
            })
            .catch((error) => console.error('Failed to load worlds:', error));
    };
    const loadExperiments = (worldName: string) => {
        if (!worldName) return;
        setExperimentsLoading(true);
        experimentsFirstLoad.current = true;
        getExperiments(uuid, worldName)
            .then((data) => {
                if (data.success) {
                    setExperiments(data.experiments);
                } else {
                    addFlash({
                        key: 'bedrock-config',
                        type: 'error',
                        message: data.error || 'Failed to load experiments',
                    });
                }
            })
            .catch((error) => clearAndAddHttpError({ key: 'bedrock-config', error }))
            .finally(() => setExperimentsLoading(false));
    };
    const loadWorldSettings = (worldName: string) => {
        if (!worldName) return;
        setWorldSettingsLoading(true);
        worldSettingsFirstLoad.current = true;
        getWorldSettings(uuid, worldName)
            .then((data) => {
                if (data.success) {
                    setWorldSettings(data.settings);
                } else {
                    addFlash({
                        key: 'bedrock-config',
                        type: 'error',
                        message: data.error || 'Failed to load world settings',
                    });
                }
            })
            .catch((error) => clearAndAddHttpError({ key: 'bedrock-config', error }))
            .finally(() => setWorldSettingsLoading(false));
    };
    const handleExperimentToggle = (key: string, enabled: boolean) => {
        setExperiments((prev) => ({
            ...prev,
            [key]: { ...prev[key], enabled },
        }));
    };
    const handleWorldSettingChange = (key: string, value: any) => {
        setWorldSettings((prev) => ({
            ...prev,
            [key]: { ...prev[key], value },
        }));
    };
    useEffect(() => {
        loadProperties();
        loadWorlds();
    }, [uuid]);
    useEffect(() => {
        if (activeTab === 'experiments') {
            loadExperiments(selectedWorld);
        }
    }, [activeTab, uuid, selectedWorld]);
    useEffect(() => {
        if (activeTab === 'world-settings') {
            loadWorldSettings(selectedWorld);
        }
    }, [activeTab, uuid, selectedWorld]);
    useEffect(() => {
        if (viewMode !== 'visual' || isFirstLoad.current || activeTab !== 'properties') {
            if (isFirstLoad.current) isFirstLoad.current = false;
            return;
        }
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setIsSaving(true);
        saveTimeoutRef.current = setTimeout(() => {
            saveProperties(uuid, propertiesContent, null)
                .then(async () => {
                    setLastSaved(new Date());
                    setIsSaving(false);
                    const syncResult = await syncStartupWithProperties(uuid, propertiesContent);
                })
                .catch((error) => {
                    console.error('Auto-save failed:', error);
                    setIsSaving(false);
                });
        }, 1000);
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [propertiesContent, uuid, viewMode, activeTab]);
    useEffect(() => {
        if (viewMode !== 'raw' || activeTab !== 'properties') return;
        const interval = setInterval(() => {
            getRawContent
                .current()
                .then((content) => {
                    if (content !== lastSavedRawContent.current) {
                        setIsSaving(true);
                        saveProperties(uuid, null, content)
                            .then(async () => {
                                setLastSaved(new Date());
                                lastSavedRawContent.current = content;
                                const lines = content.split('\n');
                                const properties: Record<string, string> = {};
                                lines.forEach(line => {
                                    const trimmed = line.trim();
                                    if (trimmed && !trimmed.startsWith('#')) {
                                        const equalIndex = trimmed.indexOf('=');
                                        if (equalIndex > 0) {
                                            const key = trimmed.substring(0, equalIndex).trim();
                                            const value = trimmed.substring(equalIndex + 1).trim();
                                            properties[key] = value;
                                        }
                                    }
                                });
                                const syncResult = await syncStartupWithProperties(uuid, properties);
                            })
                            .catch(console.error)
                            .finally(() => setIsSaving(false));
                    }
                })
                .catch(() => { });
        }, 1000);
        return () => clearInterval(interval);
    }, [viewMode, uuid, activeTab]);
    const handleRawSave = () => {
        setIsSaving(true);
        getRawContent
            .current()
            .then((content) => {
                return saveProperties(uuid, null, content).then(() => content);
            })
            .then((content) => {
                addFlash({ key: 'bedrock-config', type: 'success', message: 'Configuration saved successfully.' });
                setLastSaved(new Date());
                lastSavedRawContent.current = content;
            })
            .catch((error) => clearAndAddHttpError({ key: 'bedrock-config', error }))
            .finally(() => setIsSaving(false));
    };
    useEffect(() => {
        if (experimentsFirstLoad.current || experimentsLoading || Object.keys(experiments).length === 0) {
            if (experimentsFirstLoad.current && Object.keys(experiments).length > 0) {
                experimentsFirstLoad.current = false;
            }
            return;
        }
        if (experimentsSaveTimeout.current) clearTimeout(experimentsSaveTimeout.current);
        setExperimentsSaving(true);
        experimentsSaveTimeout.current = setTimeout(() => {
            const experimentUpdates: Record<string, boolean> = {};
            Object.entries(experiments).forEach(([key, exp]) => {
                experimentUpdates[key] = exp.enabled;
            });
            saveExperiments(uuid, selectedWorld, experimentUpdates)
                .then((data) => {
                    if (data.success) {
                        setExperimentsLastSaved(new Date());
                    } else {
                        console.error('Failed to auto-save experiments:', data.error);
                    }
                })
                .catch(console.error)
                .finally(() => setExperimentsSaving(false));
        }, 1000);
        return () => {
            if (experimentsSaveTimeout.current) clearTimeout(experimentsSaveTimeout.current);
        };
    }, [experiments, uuid, selectedWorld]);
    useEffect(() => {
        if (worldSettingsFirstLoad.current || worldSettingsLoading || Object.keys(worldSettings).length === 0) {
            if (worldSettingsFirstLoad.current && Object.keys(worldSettings).length > 0) {
                worldSettingsFirstLoad.current = false;
            }
            return;
        }
        if (worldSettingsSaveTimeout.current) clearTimeout(worldSettingsSaveTimeout.current);
        setWorldSettingsSaving(true);
        worldSettingsSaveTimeout.current = setTimeout(() => {
            const settingsUpdates: Record<string, any> = {};
            Object.entries(worldSettings).forEach(([key, setting]) => {
                settingsUpdates[key] = setting.value;
            });
            saveWorldSettings(uuid, selectedWorld, settingsUpdates)
                .then((data) => {
                    if (data.success) {
                        setWorldSettingsLastSaved(new Date());
                    } else {
                        console.error('Failed to auto-save world settings:', data.error);
                    }
                })
                .catch(console.error)
                .finally(() => setWorldSettingsSaving(false));
        }, 1000);
        return () => {
            if (worldSettingsSaveTimeout.current) clearTimeout(worldSettingsSaveTimeout.current);
        };
    }, [worldSettings, uuid, selectedWorld]);
    const renderPropertiesEditor = () => {
        if (propertiesLoading) {
            return (
                <div className='flex justify-center py-8'>
                    <Spinner size='large' />
                </div>
            );
        }
        if (Object.keys(propertiesContent).length === 0) {
            return (
                <div className='text-neutral-400 text-center p-8 bg-neutral-700/50 rounded border-2 border-dashed border-neutral-600'>
                    <ExclamationIcon className='w-12 h-12 mx-auto mb-2 opacity-50' />
                    <p>server.properties not found.</p>
                    <p className='text-sm mt-2'>Start the server once to generate the configuration file.</p>
                </div>
            );
        }
        if (viewMode === 'raw') {
            return (
                <div
                    className='bg-neutral-900 border border-neutral-800 rounded overflow-hidden'
                    style={{ minHeight: '500px' }}
                >
                    <CodemirrorEditor
                        mode='properties'
                        filename='server.properties'
                        initialContent={propertiesRaw}
                        fetchContent={handleGetRawContent}
                        onContentSaved={handleRawSave}
                        onModeChanged={() => { }}
                    />
                </div>
            );
        }
        const filteredKeys = Object.entries(propertiesContent).filter(([key]) => {
            return key.toLowerCase().includes(search.toLowerCase());
        });
        if (filteredKeys.length === 0) {
            return <div className='text-neutral-400 text-center p-8'>No matching settings found.</div>;
        }
        return (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                {filteredKeys.map(([key, value]) => (
                    <GreyRowBox key={key} className='flex-col items-start p-4 group'>
                        <div className='flex items-center justify-between w-full mb-2'>
                            <Label className='mb-0 truncate' title={key}>
                                {key.replace(/-|_/g, ' ').toUpperCase()}
                            </Label>
                        </div>
                        <div className='w-full'>
                            {value === 'true' || value === 'false' ? (
                                <div className='flex items-center mt-2'>
                                    <Switch
                                        name={key}
                                        defaultChecked={value === 'true'}
                                        onChange={() => {
                                            setPropertiesContent({
                                                ...propertiesContent,
                                                [key]: value === 'true' ? 'false' : 'true',
                                            });
                                        }}
                                    />
                                    <span className='ml-3 text-xs uppercase font-bold text-neutral-400'>
                                        {value === 'true' ? 'Enabled' : 'Disabled'}
                                    </span>
                                </div>
                            ) : SELECT_OPTIONS[key] ? (
                                <Select
                                    value={value}
                                    onChange={(e) =>
                                        setPropertiesContent({ ...propertiesContent, [key]: e.target.value })
                                    }
                                >
                                    {!SELECT_OPTIONS[key].find((opt) => opt.value === value) && (
                                        <option value={value}>{value}</option>
                                    )}
                                    {SELECT_OPTIONS[key].map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                            ) : !isNaN(Number(value)) && value !== '' ? (
                                <Input
                                    type='number'
                                    value={value}
                                    onChange={(e) =>
                                        setPropertiesContent({ ...propertiesContent, [key]: e.target.value })
                                    }
                                />
                            ) : (
                                <Input
                                    value={value}
                                    onChange={(e) =>
                                        setPropertiesContent({ ...propertiesContent, [key]: e.target.value })
                                    }
                                />
                            )}
                        </div>
                    </GreyRowBox>
                ))}
            </div>
        );
    };
    const renderExperimentsEditor = () => {
        if (worlds.length === 0) {
            return (
                <div className='text-neutral-400 text-center p-8 bg-neutral-700/50 rounded border-2 border-dashed border-neutral-600'>
                    <GlobeIcon className='w-12 h-12 mx-auto mb-2 opacity-50' />
                    <p>No worlds found.</p>
                    <p className='text-sm mt-2'>Start the server once to generate a world.</p>
                </div>
            );
        }
        if (experimentsLoading) {
            return (
                <div className='flex justify-center py-8'>
                    <Spinner size='large' />
                </div>
            );
        }
        const experimentList = Object.values(experiments);
        return (
            <div className='space-y-4'>
                {experimentList.length === 0 ? (
                    <div className='text-neutral-400 text-center p-8 bg-neutral-700/50 rounded border-2 border-dashed border-neutral-600'>
                        <BeakerIcon className='w-12 h-12 mx-auto mb-2 opacity-50' />
                        <p>Could not read experiments from level.dat.</p>
                        <p className='text-sm mt-2'>Make sure the world has been loaded at least once.</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                        {experimentList
                            .filter((exp) => {
                                if (!search) return true;
                                const searchLower = search.toLowerCase();
                                return (
                                    exp.key.toLowerCase().includes(searchLower) ||
                                    exp.name.toLowerCase().includes(searchLower) ||
                                    exp.description.toLowerCase().includes(searchLower)
                                );
                            })
                            .map((exp) => (
                                <GreyRowBox key={exp.key} className='flex items-center justify-between p-4'>
                                    <div className='flex-1 min-w-0 mr-4'>
                                        <p className='text-neutral-100 font-medium'>{exp.name}</p>
                                        <p className='text-neutral-400 text-xs mt-1'>{exp.description}</p>
                                    </div>
                                    <Switch
                                        name={exp.key}
                                        defaultChecked={exp.enabled}
                                        onChange={() => handleExperimentToggle(exp.key, !exp.enabled)}
                                    />
                                </GreyRowBox>
                            ))}
                    </div>
                )}
            </div>
        );
    };
    const renderWorldSettingsEditor = () => {
        if (worlds.length === 0) {
            return (
                <div className='text-neutral-400 text-center p-8 bg-neutral-700/50 rounded border-2 border-dashed border-neutral-600'>
                    <GlobeIcon className='w-12 h-12 mx-auto mb-2 opacity-50' />
                    <p>No worlds found.</p>
                    <p className='text-sm mt-2'>Start the server once to generate a world.</p>
                </div>
            );
        }
        if (worldSettingsLoading) {
            return (
                <div className='flex justify-center py-8'>
                    <Spinner size='large' />
                </div>
            );
        }
        const settingsList = Object.values(worldSettings);
        const filteredSettings = settingsList.filter((setting) => {
            if (!search) return true;
            const searchLower = search.toLowerCase();
            return setting.key.toLowerCase().includes(searchLower) || setting.name.toLowerCase().includes(searchLower);
        });
        const categories = {
            general: { name: 'General', settings: [] as WorldSetting[] },
            features: { name: 'World Features', settings: [] as WorldSetting[] },
            gamerules: { name: 'Game Rules', settings: [] as WorldSetting[] },
            spawn: { name: 'Spawn Settings', settings: [] as WorldSetting[] },
        };
        filteredSettings.forEach((setting) => {
            const cat = setting.category as keyof typeof categories;
            if (categories[cat]) {
                categories[cat].settings.push(setting);
            }
        });
        return (
            <div className='space-y-6'>
                {settingsList.length === 0 ? (
                    <div className='text-neutral-400 text-center p-8 bg-neutral-700/50 rounded border-2 border-dashed border-neutral-600'>
                        <AdjustmentsIcon className='w-12 h-12 mx-auto mb-2 opacity-50' />
                        <p>Could not read world settings from level.dat.</p>
                        <p className='text-sm mt-2'>Make sure the world has been loaded at least once.</p>
                    </div>
                ) : (
                    Object.entries(categories).map(([catKey, cat]) => {
                        if (cat.settings.length === 0) return null;
                        return (
                            <div key={catKey}>
                                <h3 className='text-lg font-medium text-neutral-200 mb-3'>{cat.name}</h3>
                                <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                                    {cat.settings.map((setting) => (
                                        <GreyRowBox key={setting.key} className='flex-col items-start p-4'>
                                            <div className='flex items-center justify-between w-full mb-2'>
                                                <Label className='mb-0'>{setting.name}</Label>
                                            </div>
                                            <div className='w-full'>
                                                {setting.type === 'byte' ? (
                                                    <div className='flex items-center'>
                                                        <Switch
                                                            name={setting.key}
                                                            defaultChecked={setting.value === 1}
                                                            onChange={() =>
                                                                handleWorldSettingChange(
                                                                    setting.key,
                                                                    setting.value === 1 ? 0 : 1
                                                                )
                                                            }
                                                        />
                                                        <span className='ml-3 text-xs uppercase font-bold text-neutral-400'>
                                                            {setting.value === 1 ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                ) : setting.options ? (
                                                    <Select
                                                        value={String(setting.value)}
                                                        onChange={(e) =>
                                                            handleWorldSettingChange(
                                                                setting.key,
                                                                parseInt(e.target.value)
                                                            )
                                                        }
                                                    >
                                                        {Object.entries(setting.options).map(([val, label]) => (
                                                            <option key={val} value={val}>
                                                                {label}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                ) : setting.type === 'string' ? (
                                                    <Input
                                                        value={setting.value || ''}
                                                        onChange={(e) =>
                                                            handleWorldSettingChange(setting.key, e.target.value)
                                                        }
                                                    />
                                                ) : (
                                                    <Input
                                                        type='number'
                                                        value={setting.value ?? ''}
                                                        onChange={(e) =>
                                                            handleWorldSettingChange(setting.key, e.target.value)
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </GreyRowBox>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    };
    return (
        <ServerContentBlock title='Bedrock Config Editor'>
            <FlashMessageRender byKey='bedrock-config' className='mb-4' />
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                <div className='w-full'>
                    <Select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as TabType)}
                    >
                        {TAB_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                {activeTab === 'properties' && (
                    <div className='w-full'>
                        <Select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'visual' | 'raw')}
                        >
                            {VIEW_MODE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}
                {(activeTab === 'experiments' || activeTab === 'world-settings') && worlds.length > 0 && (
                    <div className='w-full'>
                        <Select value={selectedWorld} onChange={(e) => setSelectedWorld(e.target.value)}>
                            {worlds.map((world) => (
                                <option key={world.name} value={world.name}>
                                    {world.name} {world.is_default ? '(Default)' : ''}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}
                <div className='w-full col-span-2'>
                    <Input
                        type='search'
                        placeholder='Search settings...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className='w-full'>
                {activeTab === 'properties' && renderPropertiesEditor()}
                {activeTab === 'experiments' && renderExperimentsEditor()}
                {activeTab === 'world-settings' && renderWorldSettingsEditor()}
            </div>
        </ServerContentBlock>
    );
};
