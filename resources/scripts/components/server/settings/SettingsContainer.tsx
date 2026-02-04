import React, { useEffect, useState } from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import DeleteServerBox from '@/components/server/settings/DeleteServerBox';
import reinstallServer from '@/api/server/reinstallServer';
import http from '@/api/http';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';
import AllocationRow from '@/components/server/network/AllocationRow';
import ButtonElement from '@/components/elements/Button';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Spinner from '@/components/elements/Spinner';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { useFlashKey } from '@/plugins/useFlash';
import VariableBox from '@/components/server/startup/VariableBox';
import getServerStartup from '@/api/swr/getServerStartup';
import Select from '@/components/elements/Select';
import InputSpinner from '@/components/elements/InputSpinner';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import useFlash from '@/plugins/useFlash';
import { ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import getServerSchedules from '@/api/server/schedules/getServerSchedules';
import SimpleScheduleModal from '@/components/server/settings/SimpleScheduleModal';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPowerOff, faPlay, faStop, faRedo, faTrash, faGlobe, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import deleteSchedule from '@/api/server/schedules/deleteSchedule';
import Switch from '@/components/elements/Switch';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { Dialog } from '@/components/elements/dialog';
import setServerAllocationAlias from '@/api/server/network/setServerAllocationAlias';

// Hostname Section Component
const HostnameSection = ({
    allocationData,
    uuid,
    mutateAllocations,
}: {
    allocationData: any;
    uuid: string;
    mutateAllocations: () => Promise<any>;
}) => {
    const primaryAllocation = allocationData?.find((a: any) => a.isDefault);
    const [hostname, setHostname] = useState(primaryAllocation?.alias || '');
    const [hostnameLoading, setHostnameLoading] = useState(false);
    const { addFlash, clearFlashes } = useFlash();

    useEffect(() => {
        if (primaryAllocation) {
            setHostname(primaryAllocation.alias || '');
        }
    }, [primaryAllocation?.alias]);

    const handleHostnameChange = async () => {
        if (!allocationData || allocationData.length === 0) return;

        setHostnameLoading(true);
        clearFlashes('settings');

        try {
            // Update hostname for all allocations
            const updatePromises = allocationData.map((allocation: any) =>
                setServerAllocationAlias(uuid, allocation.id, hostname || null, allocation.notes || null)
            );

            await Promise.all(updatePromises);
            await mutateAllocations();
            addFlash({
                key: 'settings',
                type: 'success',
                message: 'อัปเดตโฮสเนมเรียบร้อยแล้ว',
            });
        } catch (error) {
            addFlash({
                key: 'settings',
                type: 'error',
                message: httpErrorToHuman(error),
            });
        } finally {
            setHostnameLoading(false);
        }
    };

    if (!allocationData || !primaryAllocation) {
        return null;
    }

    return (
        <Can action={'allocation.update'}>
            <TitledGreyBox title={'โฮสเนม'} css={tw`mb-6 md:mb-10`}>
                <div>
                    <Label>โฮสเนม</Label>
                    <div css={tw`flex items-center gap-2`}>
                        <div css={tw`flex-1 relative`}>
                            <div css={tw`absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500`}>
                                <FontAwesomeIcon icon={faGlobe} />
                            </div>
                            <Input
                                type={'text'}
                                value={hostname}
                                onChange={(e) => setHostname(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleHostnameChange();
                                    }
                                }}
                                css={tw`pl-10`}
                            />
                        </div>
                        <span css={tw`text-neutral-300`}>.mc.in.th</span>
                        <CopyOnClick text={`${hostname || primaryAllocation?.ip || ''}.mc.in.th`}>
                            <Button css={tw`px-3`}>
                                <FontAwesomeIcon icon={faPencilAlt} />
                            </Button>
                        </CopyOnClick>
                    </div>
                    <div css={tw`mt-4 flex justify-end`}>
                        <Button onClick={handleHostnameChange} disabled={hostnameLoading} css={tw`w-full sm:w-auto`}>
                            {hostnameLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                        </Button>
                    </div>
                </div>
            </TitledGreyBox>
        </Can>
    );
};

export default () => {
    const history = useHistory();
    const match = useRouteMatch();
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);
    
    // Network/Allocation state
    const [loading, setLoading] = useState(false);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    
    const { clearFlashes: clearNetworkFlashes, clearAndAddHttpError: clearAndAddNetworkError } = useFlashKey('server:network');
    const { data: allocationData, error: allocationError, mutate: mutateAllocations } = getServerAllocations();
    
    useEffect(() => {
        mutateAllocations(allocations);
    }, []);
    
    useEffect(() => {
        clearAndAddNetworkError(allocationError);
    }, [allocationError]);
    
    useDeepCompareEffect(() => {
        if (!allocationData) return;
        setServerFromState((state) => ({ ...state, allocations: allocationData }));
    }, [allocationData]);
    
    const onCreateAllocation = () => {
        clearNetworkFlashes();
        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(allocation) }));
                return mutateAllocations(allocationData?.concat(allocation), false);
            })
            .catch((error) => clearAndAddNetworkError(error))
            .then(() => setLoading(false));
    };

    // Startup state
    const [startupLoading, setStartupLoading] = useState(false);
    const { clearFlashes: clearStartupFlashes, clearAndAddHttpError: clearAndAddStartupError } = useFlash();
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data!.variables,
            invocation: server.data!.invocation,
            dockerImage: server.data!.dockerImage,
        }),
        isEqual
    );

    const { data: startupData, error: startupError, isValidating: startupValidating, mutate: mutateStartup } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
    });

    const isCustomImage =
        startupData &&
        !Object.values(startupData.dockerImages)
            .map((v) => v.toLowerCase())
            .includes(variables.dockerImage.toLowerCase());

    useEffect(() => {
        if (startupData) {
            mutateStartup();
        }
    }, []);

    useDeepCompareEffect(() => {
        if (!startupData) return;
        setServerFromState((s) => ({
            ...s,
            invocation: startupData.invocation,
            variables: startupData.variables,
        }));
    }, [startupData]);

    const updateSelectedDockerImage = (v: React.ChangeEvent<HTMLSelectElement>) => {
        setStartupLoading(true);
        clearStartupFlashes('startup:image');

        const image = v.currentTarget.value;
        setSelectedDockerImage(uuid, image)
            .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
            .catch((error) => {
                console.error(error);
                clearAndAddStartupError({ key: 'startup:image', error });
            })
            .then(() => setStartupLoading(false));
    };

    // Schedules state
    const { clearFlashes: clearSchedulesFlashes, addError: addSchedulesError } = useFlash();
    const [schedulesLoading, setSchedulesLoading] = useState(true);
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>(undefined);
    const schedules = ServerContext.useStoreState((state) => state.schedules.data);
    const setSchedules = ServerContext.useStoreActions((actions) => actions.schedules.setSchedules);

    useEffect(() => {
        clearSchedulesFlashes('schedules');
        getServerSchedules(uuid)
            .then((schedules) => setSchedules(schedules))
            .catch((error) => {
                addSchedulesError({ message: httpErrorToHuman(error), key: 'schedules' });
                console.error(error);
            })
            .then(() => setSchedulesLoading(false));
    }, [uuid]);

    // กรอง schedule ที่เป็น backup อัตโนมัติออก และแสดงเฉพาะ power action
    const filteredSchedules = schedules.filter((schedule) => {
        // กรอง schedule ที่ชื่อขึ้นต้นด้วย "Auto Backup - Daily"
        if (schedule.name.startsWith('Auto Backup - Daily')) {
            return false;
        }
        // แสดงเฉพาะ schedule ที่มี task เป็น power action
        return schedule.tasks.some((task) => task.action === 'power');
    });

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'start':
                return faPlay;
            case 'stop':
                return faStop;
            case 'restart':
                return faRedo;
            default:
                return faPowerOff;
        }
    };

    const getActionName = (action: string): string => {
        const names: Record<string, string> = {
            start: 'เปิดเซิร์ฟเวอร์',
            stop: 'ปิดเซิร์ฟเวอร์',
            restart: 'รีสตาร์ท',
        };
        return names[action] || action;
    };

    // แสดงเวลาเป็น "ทุกวัน XX:XX"
    const formatScheduleTime = (schedule: Schedule): string => {
        const hour = schedule.cron.hour === '*' ? '0' : schedule.cron.hour;
        const minute = schedule.cron.minute === '*' ? '0' : schedule.cron.minute;
        const hourNum = parseInt(hour, 10);
        const minuteNum = parseInt(minute, 10);
        return `ทุกวัน ${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
    };

    const handleToggleSchedule = async (schedule: Schedule) => {
        try {
            await createOrUpdateSchedule(uuid, {
                id: schedule.id,
                name: schedule.name,
                cron: schedule.cron,
                onlyWhenOnline: schedule.onlyWhenOnline,
                isActive: !schedule.isActive,
            });
            // Refresh schedules
            const updatedSchedules = await getServerSchedules(uuid);
            setSchedules(updatedSchedules);
        } catch (error) {
            addSchedulesError({ message: httpErrorToHuman(error), key: 'schedules' });
        }
    };

    const handleDeleteSchedule = async (scheduleId: number) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตารางเวลานี้?')) {
            return;
        }
        
        try {
            await deleteSchedule(uuid, scheduleId);
            // Refresh schedules
            const updatedSchedules = await getServerSchedules(uuid);
            setSchedules(updatedSchedules);
        } catch (error) {
            addSchedulesError({ message: httpErrorToHuman(error), key: 'schedules' });
        }
    };

    // Reinstall Server Button Component
    const ReinstallServerButton = () => {
        const [modalVisible, setModalVisible] = useState(false);
        const { addFlash, clearFlashes } = useFlash();

        const reinstall = () => {
            clearFlashes('settings');
            reinstallServer(uuid)
                .then(() => {
                    addFlash({
                        key: 'settings',
                        type: 'success',
                        message: 'Your server has begun the reinstallation process.',
                    });
                })
                .catch((error) => {
                    console.error(error);
                    addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
                })
                .then(() => setModalVisible(false));
        };

        return (
            <>
                <Dialog.Confirm
                    open={modalVisible}
                    title={'Confirm server reinstallation'}
                    confirm={'Yes, reinstall server'}
                    onClose={() => setModalVisible(false)}
                    onConfirmed={reinstall}
                >
                    Your server will be stopped and some files may be deleted or modified during this process, are you sure
                    you wish to continue?
                </Dialog.Confirm>
                <Button.Danger variant={Button.Variants.Secondary} onClick={() => setModalVisible(true)}>
                    ติดตั้งใหม่
                </Button.Danger>
            </>
        );
    };

    // Delete Server Button Component
    const DeleteServerButton = () => {
        const [modalVisible, setModalVisible] = useState(false);
        const [isDeleting, setIsDeleting] = useState(false);
        const { addFlash, clearFlashes } = useFlash();

        const handleDelete = () => {
            setIsDeleting(true);
            clearFlashes('settings');

            const token = localStorage.getItem('auth_token');

            if (!token) {
                setIsDeleting(false);
                addFlash({
                    key: 'settings',
                    type: 'error',
                    message: 'Authentication token not found. Please login again.',
                });
                return;
            }

            http.delete(`/api/servers/${uuid}`, {
                baseURL: 'http://localhost:9000',
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then(() => {
                    addFlash({
                        key: 'settings',
                        type: 'success',
                        message: 'Server has been deleted successfully from both Panel and Spring Boot.',
                    });
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 500);
                })
                .catch((error) => {
                    setIsDeleting(false);
                    const errorMessage =
                        error.response?.data?.message || error.response?.data?.error || httpErrorToHuman(error);
                    addFlash({
                        key: 'settings',
                        type: 'error',
                        message: errorMessage,
                    });
                })
                .finally(() => {
                    setModalVisible(false);
                });
        };

        return (
            <>
                <Dialog.Confirm
                    open={modalVisible}
                    title={'Confirm server deletion'}
                    confirm={'Yes, delete server'}
                    onClose={() => setModalVisible(false)}
                    onConfirmed={handleDelete}
                >
                    <p css={tw`mb-4`}>
                        Your server will be permanently deleted from both the panel and Spring Boot system. This action
                        cannot be undone.
                    </p>
                    <p css={tw`text-red-400 font-medium`}>
                        <strong>Warning:</strong> All server data, files, databases, and backups will be permanently
                        removed.
                    </p>
                </Dialog.Confirm>
                <Button.Danger
                    variant={Button.Variants.Secondary}
                    onClick={() => setModalVisible(true)}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'กำลังลบ...' : 'ลบเซิร์ฟเวอร์'}
                </Button.Danger>
            </>
        );
    };

    return (
        <ServerContentBlock title={'Settings'} showFlashKey={'settings'}>
            <FlashMessageRender byKey={'settings'} css={tw`mb-4`} />
            <FlashMessageRender byKey={'server:network'} css={tw`mb-4`} />
            <FlashMessageRender byKey={'startup:image'} css={tw`mb-4`} />
            <FlashMessageRender byKey={'schedules'} css={tw`mb-4`} />

            {/* Startup Parameters Section */}
            {!startupData ? (
                !startupError || (startupError && startupValidating) ? (
                    <Spinner centered size={Spinner.Size.LARGE} css={tw`mt-6 md:mt-10`} />
                ) : (
                    <ServerError title={'Oops!'} message={httpErrorToHuman(startupError)} onRetry={() => mutateStartup()} />
                )
            ) : (
                <TitledGreyBox title={'Startup Parameters'} css={tw`mb-6 md:mb-10`}>
                    <div css={tw`mb-6`}>
                        <Label>Startup Command</Label>
                        <div css={tw`px-1 py-2`}>
                            <p css={tw`font-mono bg-neutral-900 rounded py-2 px-4`}>{startupData.invocation}</p>
                        </div>
                    </div>
                    <div css={tw`mb-6`}>
                        <Label>Docker Image</Label>
                        {Object.keys(startupData.dockerImages).length > 1 && !isCustomImage ? (
                            <>
                                <InputSpinner visible={startupLoading}>
                                    <Select
                                        disabled={Object.keys(startupData.dockerImages).length < 2}
                                        onChange={updateSelectedDockerImage}
                                        defaultValue={variables.dockerImage}
                                    >
                                        {Object.keys(startupData.dockerImages).map((key) => (
                                            <option key={startupData.dockerImages[key]} value={startupData.dockerImages[key]}>
                                                {key}
                                            </option>
                                        ))}
                                    </Select>
                                </InputSpinner>
                                <p css={tw`text-xs text-neutral-300 mt-2`}>
                                    This is an advanced feature allowing you to select a Docker image to use when running
                                    this server instance.
                                </p>
                            </>
                        ) : (
                            <>
                                <Input disabled readOnly value={variables.dockerImage} />
                                {isCustomImage && (
                                    <p css={tw`text-xs text-neutral-300 mt-2`}>
                                        This {"server's"} Docker image has been manually set by an administrator and cannot
                                        be changed through this UI.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    <div css={tw`mb-6`}>
                        <Label>Variables</Label>
                        <div css={tw`grid gap-4 md:grid-cols-2 mt-2`}>
                            {startupData.variables.map((variable) => (
                                <VariableBox key={variable.envVariable} variable={variable} />
                            ))}
                        </div>
                    </div>
                </TitledGreyBox>
            )}

            {/* Schedules Section */}
            <TitledGreyBox title={'ตารางเวลาอัตโนมัติ'} css={tw`mb-6 md:mb-10`}>
                {schedulesLoading ? (
                    <Spinner size={'large'} centered />
                ) : (
                    <>
                        {filteredSchedules.length === 0 ? (
                            <p css={tw`text-sm text-center text-neutral-300`}>
                                ยังไม่มีตารางเวลาอัตโนมัติ
                            </p>
                        ) : (
                            filteredSchedules.map((schedule) => {
                                const powerTask = schedule.tasks.find((task) => task.action === 'power');
                                const action = powerTask?.payload || 'start';
                                
                                return (
                                    <GreyRowBox
                                        key={schedule.id}
                                        css={tw`mb-2 flex-wrap items-center`}
                                    >
                                        <div css={tw`hidden md:block`}>
                                            <FontAwesomeIcon icon={getActionIcon(action)} fixedWidth />
                                        </div>
                                        <div css={tw`flex-1 md:ml-4`}>
                                            <p>{getActionName(action)}</p>
                                            <p css={tw`text-xs text-neutral-400`}>
                                                {schedule.lastRunAt ? format(schedule.lastRunAt, "MMM do 'at' h:mma") : 'ยังไม่เคยรัน'}
                                            </p>
                                        </div>
                                        <div css={tw`mx-auto sm:mx-8 w-full sm:w-auto mt-4 sm:mt-0 text-center`}>
                                            <p css={tw`text-sm font-medium`}>{formatScheduleTime(schedule)}</p>
                                        </div>
                                        <div css={tw`flex items-center gap-2`}>
                                            <div css={tw`flex items-center`}>
                                                <Switch
                                                    key={`schedule-${schedule.id}-${schedule.isActive}`}
                                                    name={`schedule-${schedule.id}-toggle`}
                                                    defaultChecked={schedule.isActive}
                                                    onChange={async (e) => {
                                                        e.preventDefault();
                                                        await handleToggleSchedule(schedule);
                                                    }}
                                                    readOnly={schedule.isProcessing}
                                                />
                                            </div>
                                            <Button
                                                type={'button'}
                                                variant={Button.Variants.Secondary}
                                                css={tw`ml-2`}
                                                onClick={() => {
                                                    setEditingSchedule(schedule);
                                                    setScheduleModalVisible(true);
                                                }}
                                            >
                                                แก้ไข
                                            </Button>
                                            <Button
                                                type={'button'}
                                                variant={Button.Variants.Danger}
                                                css={tw`ml-2`}
                                                onClick={() => handleDeleteSchedule(schedule.id)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </Button>
                                        </div>
                                    </GreyRowBox>
                                );
                            })
                        )}
                        <Can action={'schedule.create'}>
                            <div css={tw`mt-8 flex justify-end`}>
                                <SimpleScheduleModal 
                                    schedule={editingSchedule}
                                    visible={scheduleModalVisible} 
                                    onModalDismissed={() => {
                                        setScheduleModalVisible(false);
                                        setEditingSchedule(undefined);
                                    }} 
                                />
                                <Button type={'button'} onClick={() => {
                                    setEditingSchedule(undefined);
                                    setScheduleModalVisible(true);
                                }}>
                                    เพิ่ม
                                </Button>
                            </div>
                        </Can>
                    </>
                )}
            </TitledGreyBox>

            {/* Danger Zone Section */}
            <TitledGreyBox 
                title={'โซนอันตราย'} 
                css={tw`mb-6 md:mb-10 border-red-500 border-2`}
            >
                <Can action={'settings.reinstall'}>
                    <div css={tw`mb-6 pb-6 border-b border-neutral-700`}>
                        <div css={tw`flex items-start justify-between`}>
                            <div css={tw`flex-1`}>
                                <h4 css={tw`text-lg font-semibold mb-2`}>ติดตั้งใหม่</h4>
                                <p css={tw`text-sm text-neutral-300`}>
                                    ติดตั้งเซิร์ฟเวอร์ใหม่ ข้อมูลทั้งหมดจะถูกลบ
                                </p>
                            </div>
                            <div>
                                <ReinstallServerButton />
                            </div>
                        </div>
                    </div>
                </Can>
                <div>
                    <div css={tw`flex items-start justify-between`}>
                        <div css={tw`flex-1`}>
                            <h4 css={tw`text-lg font-semibold mb-2`}>ลบเซิร์ฟเวอร์</h4>
                            <p css={tw`text-sm text-neutral-300`}>
                                ลบเซิร์ฟเวอร์ถาวร ไม่สามารถย้อนกลับได้
                            </p>
                        </div>
                        <div>
                            <DeleteServerButton />
                        </div>
                    </div>
                </div>
            </TitledGreyBox>

            {/* SFTP Details Section */}
            <Can action={'file.sftp'}>
                <TitledGreyBox title={'SFTP Details'} css={tw`mb-6 md:mb-10`}>
                    <div>
                        <Label>Server Address</Label>
                        <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                            <Input type={'text'} value={`sftp://${ip(sftp.ip)}:${sftp.port}`} readOnly />
                        </CopyOnClick>
                    </div>
                    <div css={tw`mt-6`}>
                        <Label>Username</Label>
                        <CopyOnClick text={`${username}.${id}`}>
                            <Input type={'text'} value={`${username}.${id}`} readOnly />
                        </CopyOnClick>
                    </div>
                    <div css={tw`mt-6 flex items-center`}>
                        <div css={tw`flex-1`}>
                            <div css={tw`border-l-4 border-cyan-500 p-3`}>
                                <p css={tw`text-xs text-neutral-200`}>
                                    Your SFTP password is the same as the password you use to access this panel.
                                </p>
                            </div>
                        </div>
                        <div css={tw`ml-4`}>
                            <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                <Button.Text variant={Button.Variants.Secondary}>Launch SFTP</Button.Text>
                            </a>
                        </div>
                    </div>
                </TitledGreyBox>
            </Can>

            {/* Network/Allocations Section */}
            <TitledGreyBox title={'Network Allocations'} css={tw`mb-6 md:mb-10`}>
                {!allocationData ? (
                    <Spinner size={'large'} centered />
                ) : (
                    <>
                        {allocationData.map((allocation) => (
                            <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                        ))}
                        {allocationLimit > 0 && (
                            <Can action={'allocation.create'}>
                                <SpinnerOverlay visible={loading} />
                                <div css={tw`mt-6 sm:flex items-center justify-end`}>
                                    <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                                        You are currently using {allocationData.length} of {allocationLimit} allowed allocations for
                                        this server.
                                    </p>
                                    {allocationLimit > allocationData.length && (
                                        <ButtonElement css={tw`w-full sm:w-auto`} color={'primary'} onClick={onCreateAllocation}>
                                            Create Allocation
                                        </ButtonElement>
                                    )}
                                </div>
                            </Can>
                        )}
                    </>
                )}
            </TitledGreyBox>

            {/* Change Server Details Section */}
            <Can action={'settings.rename'}>
                <TitledGreyBox title={'เปลี่ยนรายละเอียดเซิร์ฟเวอร์'} css={tw`mb-6 md:mb-10`}>
                    <RenameServerBox />
                </TitledGreyBox>
            </Can>

            {/* Hostname Section */}
            <HostnameSection allocationData={allocationData} uuid={uuid} mutateAllocations={mutateAllocations} />

            {/* Debug Information Section */}
            <TitledGreyBox title={'Debug Information'} css={tw`mb-6 md:mb-10`}>
                <div css={tw`flex items-center justify-between text-sm`}>
                    <p>Node</p>
                    <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{node}</code>
                </div>
                <CopyOnClick text={uuid}>
                    <div css={tw`flex items-center justify-between mt-2 text-sm`}>
                        <p>Server ID</p>
                        <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{uuid}</code>
                    </div>
                </CopyOnClick>
            </TitledGreyBox>
        </ServerContentBlock>
    );
};
