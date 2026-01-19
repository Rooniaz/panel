import React, { useState, useContext, useEffect } from 'react';
import { Player, PlayerItemsResponse, WorldInfo, FastQueryResponse } from '@/api/server/mcpmanager';
import ContentBox from '@/components/elements/ContentBox';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import GiveItem from './GiveItem';
import {
    faBan,
    faUserCheck,
    faUserShield,
    faTrash,
    faGamepad,
    faSkull,
    faCopy,
    faBoxOpen,
    faHeartbeat,
    faBroom,
    faPlus,
    faMinus,
    faHandRock,
    faCommentDots,
    faMapMarkerAlt,
    faBolt,
    faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/elements/button';
import Select from '@/components/elements/Select';
import { Form, Formik } from 'formik';
import Field from '@/components/elements/Field';
import { Field as FormikField } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import PlayerInventory from './Inventory';
import PlayerStats from './Stats';
import PlayerDetailsTabs from './DetailsTabs';
import Advancements from './Advancements';
import {
    banPlayer,
    unbanPlayer,
    whitelistPlayer,
    unwhitelistPlayer,
    opPlayer,
    deopPlayer,
    clearPlayerInventory,
    wipePlayerData,
    changePlayerGamemode,
    banIp,
    unbanIp,
    giveItem,
    addEffect,
    clearEffect,
    kickPlayerWithReason,
    whisperPlayer,
    teleportPlayer,
    killPlayer,
    modifyPlayerStat,
} from '@/api/server/mcpmanager';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Switch from '@/components/elements/Switch';
import * as Yup from 'yup';
interface Props {
    player: Player;
    serverUuid: string;
    onRefresh: () => void;
    playerItems: PlayerItemsResponse | null;
    worlds: WorldInfo[];
    selectedWorld: string;
    onWorldChange: (world: string) => void;
    rootAdmin: boolean;
    fastQueryData: FastQueryResponse | null;
    onModalStateChange?: (isModalOpen: boolean) => void;
}
const StatusBadge = styled.span<{ status: string }>`
    ${tw`px-2 py-1 rounded-full text-xs font-semibold mr-2 shadow-sm border flex items-center`};
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
            default:
                return tw`bg-neutral-600 text-neutral-50 border-neutral-500`;
        }
    }}
`;
const PlayerDetails: React.FC<Props> = ({
    player,
    serverUuid,
    onRefresh,
    playerItems,
    worlds,
    selectedWorld,
    onWorldChange,
    rootAdmin,
    fastQueryData,
    onModalStateChange,
}) => {
    const [showBanModal, setShowBanModal] = useState<boolean>(false);
    const [showKickModal, setShowKickModal] = useState<boolean>(false);
    const [showWhisperModal, setShowWhisperModal] = useState<boolean>(false);
    const [showTeleportModal, setShowTeleportModal] = useState<boolean>(false);
    const [showGamemodeModal, setShowGamemodeModal] = useState<boolean>(false);
    const [showBanIpModal, setShowBanIpModal] = useState<boolean>(false);
    const [showGiveItemModal, setShowGiveItemModal] = useState<boolean>(false);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [selectedSlotType, setSelectedSlotType] = useState<string | null>(null);
    const [showAddEffectModal, setShowAddEffectModal] = useState<boolean>(false);
    const [showOpModal, setShowOpModal] = useState<boolean>(false);
    const [showKillModal, setShowKillModal] = useState<boolean>(false);
    const [showClearInventoryModal, setShowClearInventoryModal] = useState<boolean>(false);
    const [showWipeDataModal, setShowWipeDataModal] = useState<boolean>(false);
    const isAnyModalOpen =
        showBanModal ||
        showKickModal ||
        showWhisperModal ||
        showTeleportModal ||
        showGamemodeModal ||
        showBanIpModal ||
        showGiveItemModal ||
        showAddEffectModal ||
        showOpModal ||
        showKillModal ||
        showClearInventoryModal ||
        showWipeDataModal;
    useEffect(() => {
        if (onModalStateChange) {
            onModalStateChange(isAnyModalOpen);
        }
    }, [isAnyModalOpen, onModalStateChange]);
    const [loading, setLoading] = useState<string | null>(null);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const flashKey = `player-details-${player.uuid || player.name}`;
    const [isBanned, setIsBanned] = useState(
        fastQueryData?.players?.banned?.some((p) => (p.uuid && p.uuid === player.uuid) || p.name === player.name) ||
            false
    );
    const [isIpBanned, setIsIpBanned] = useState(false);
    const [isWhitelisted, setIsWhitelisted] = useState(
        fastQueryData?.players?.whitelisted?.some(
            (p) => (p.uuid && p.uuid === player.uuid) || p.name === player.name
        ) || false
    );
    const [isOp, setIsOp] = useState(
        fastQueryData?.players?.ops?.some((p) => (p.uuid && p.uuid === player.uuid) || p.name === player.name) || false
    );
    useEffect(() => {
        setIsBanned(
            fastQueryData?.players?.banned?.some((p) => (p.uuid && p.uuid === player.uuid) || p.name === player.name) ||
                false
        );
        setIsWhitelisted(
            fastQueryData?.players?.whitelisted?.some(
                (p) => (p.uuid && p.uuid === player.uuid) || p.name === player.name
            ) || false
        );
        setIsOp(
            fastQueryData?.players?.ops?.some((p) => (p.uuid && p.uuid === player.uuid) || p.name === player.name) ||
                false
        );
    }, [fastQueryData, player]);
    const isOnline = fastQueryData?.players?.online?.some((p) => p.name === player.name) || false;
    const handleModifyStat = async (stat: 'health' | 'hunger' | 'experience', amount: number) => {
        setLoading(`modify-${stat}`);
        clearFlashes(flashKey);
        try {
            await modifyPlayerStat(serverUuid, player.uuid || '', player.name, stat, amount);
            addFlash({ key: flashKey, type: 'success', message: `Successfully modified ${stat} for ${player.name}.` });
            onRefresh();
        } catch (error) {
            clearAndAddHttpError({ key: flashKey, error });
        } finally {
            setLoading(null);
        }
    };
    const handlePlayerAction = async (action: string, data?: any) => {
        setLoading(action);
        clearFlashes(flashKey);
        try {
            const uuid = player.uuid || 'unknown';
            let message = '';
            switch (action) {
                case 'unban':
                    await unbanPlayer(serverUuid, uuid);
                    message = `Successfully unbanned player ${player.name}.`;
                    setIsBanned(false);
                    break;
                case 'unbanIp':
                    await unbanIp(serverUuid, uuid, player.ip || '');
                    message = `Successfully unbanned IP for player ${player.name}.`;
                    setIsIpBanned(false);
                    break;
                case 'whitelist':
                    await whitelistPlayer(serverUuid, uuid, player.name);
                    message = `Successfully whitelisted player ${player.name}.`;
                    setIsWhitelisted(true);
                    break;
                case 'unwhitelist':
                    await unwhitelistPlayer(serverUuid, uuid, player.name);
                    message = `Successfully removed ${player.name} from whitelist.`;
                    setIsWhitelisted(false);
                    break;
                case 'op':
                    await opPlayer(serverUuid, uuid, player.name);
                    message = `Successfully made ${player.name} an operator.`;
                    setIsOp(true);
                    break;
                case 'deop':
                    await deopPlayer(serverUuid, uuid, player.name);
                    message = `Successfully removed operator status from ${player.name}.`;
                    setIsOp(false);
                    break;
                case 'kill':
                    await killPlayer(serverUuid, player.name);
                    message = `Successfully killed player ${player.name}.`;
                    break;
                case 'clearInventory':
                    await clearPlayerInventory(serverUuid, uuid, player.name);
                    message = `Successfully cleared inventory for ${player.name}.`;
                    break;
                case 'wipeData':
                    await wipePlayerData(serverUuid, uuid, player.name);
                    message = `Successfully wiped all data for player ${player.name}.`;
                    break;
                case 'unbanIp':
                    await unbanIp(serverUuid, player.uuid || '', player.ip || '');
                    message = `Successfully unbanned IP for player ${player.name}.`;
                    break;
                case 'clearEffect':
                    await clearEffect(serverUuid, uuid, player.name);
                    message = `Successfully cleared all effects from player ${player.name}.`;
                    break;
            }
            if (message) {
                addFlash({ key: flashKey, type: 'success', message });
            }
            onRefresh();
        } catch (error) {
            clearAndAddHttpError({ key: flashKey, error });
        } finally {
            setLoading(null);
        }
    };
    const BanIpDialog = asDialog({ title: 'Ban IP Address' })(() => {
        const { close } = useContext(DialogWrapperContext);
        const submit = (values: { reason: string }, { setSubmitting }: any) => {
            clearFlashes(flashKey);
            banIp(serverUuid, player.uuid || '', player.name, values.reason)
                .then(() => {
                    addFlash({
                        key: flashKey,
                        type: 'success',
                        message: `Successfully banned IP for player ${player.name}.`,
                    });
                    setIsIpBanned(true);
                    close();
                    onRefresh();
                })
                .catch((error) => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: flashKey, error });
                });
        };
        return (
            <Formik onSubmit={submit} initialValues={{ reason: '' }}>
                {({ submitForm, isSubmitting }) => (
                    <>
                        <Form css={tw`m-0`}>
                            <Field autoFocus id='reason' name='reason' label='Ban IP Reason' />
                        </Form>
                        <Dialog.Footer>
                            <Button.Text onClick={close}>Cancel</Button.Text>
                            <Button onClick={submitForm} disabled={isSubmitting}>
                                Ban IP
                            </Button>
                        </Dialog.Footer>
                    </>
                )}
            </Formik>
        );
    });
    const BanPlayerDialog = asDialog({ title: 'Ban Player' })(() => {
        const { close } = useContext(DialogWrapperContext);
        const submit = (values: { reason: string }, { setSubmitting }: any) => {
            clearFlashes(flashKey);
            banPlayer(serverUuid, player.uuid || '', player.name, values.reason)
                .then(() => {
                    addFlash({ key: flashKey, type: 'success', message: `Successfully banned player ${player.name}.` });
                    setIsBanned(true);
                    close();
                    onRefresh();
                })
                .catch((error) => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: flashKey, error });
                });
        };
        return (
            <Formik onSubmit={submit} initialValues={{ reason: '' }}>
                {({ submitForm, isSubmitting }) => (
                    <>
                        <Form css={tw`m-0`}>
                            <Field autoFocus id='reason' name='reason' label='Ban Reason' />
                        </Form>
                        <Dialog.Footer>
                            <Button.Text onClick={close}>Cancel</Button.Text>
                            <Button onClick={submitForm} disabled={isSubmitting}>
                                Ban Player
                            </Button>
                        </Dialog.Footer>
                    </>
                )}
            </Formik>
        );
    });
    const KickPlayerDialog = asDialog({ title: 'Kick Player' })(() => {
        const { close } = useContext(DialogWrapperContext);
        const submit = (values: { reason: string }, { setSubmitting }: any) => {
            clearFlashes(flashKey);
            kickPlayerWithReason(serverUuid, player.name, values.reason)
                .then(() => {
                    addFlash({ key: flashKey, type: 'success', message: `Successfully kicked player ${player.name}.` });
                    close();
                    onRefresh();
                })
                .catch((error) => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: flashKey, error });
                });
        };
        return (
            <Formik onSubmit={submit} initialValues={{ reason: '' }}>
                {({ submitForm, isSubmitting }) => (
                    <>
                        <Form css={tw`m-0`}>
                            <Field autoFocus id='reason' name='reason' label='Kick Reason' />
                        </Form>
                        <Dialog.Footer>
                            <Button.Text onClick={close}>Cancel</Button.Text>
                            <Button onClick={submitForm} disabled={isSubmitting}>
                                Kick Player
                            </Button>
                        </Dialog.Footer>
                    </>
                )}
            </Formik>
        );
    });
    const WhisperPlayerDialog = asDialog({ title: 'Send Message' })(() => {
        const { close } = useContext(DialogWrapperContext);
        const submit = (values: { message: string }, { setSubmitting }: any) => {
            clearFlashes(flashKey);
            whisperPlayer(serverUuid, player.name, values.message)
                .then(() => {
                    addFlash({ key: flashKey, type: 'success', message: `Message sent to ${player.name}.` });
                    close();
                    onRefresh();
                })
                .catch((error) => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: flashKey, error });
                });
        };
        return (
            <Formik onSubmit={submit} initialValues={{ message: '' }}>
                {({ submitForm, isSubmitting }) => (
                    <>
                        <Form css={tw`m-0`}>
                            <Field autoFocus id='message' name='message' label='Message' />
                        </Form>
                        <Dialog.Footer>
                            <Button.Text onClick={close}>Cancel</Button.Text>
                            <Button onClick={submitForm} disabled={isSubmitting}>
                                Send
                            </Button>
                        </Dialog.Footer>
                    </>
                )}
            </Formik>
        );
    });
    const TeleportPlayerDialog = asDialog({ title: 'Teleport Player' })(() => {
        const { close } = useContext(DialogWrapperContext);
        const [teleportMode, setTeleportMode] = useState<'player' | 'coordinates'>('player');
        const submit = (values: { targetPlayer: string; x: string; y: string; z: string }, { setSubmitting }: any) => {
            clearFlashes(flashKey);
            let target: string;
            if (teleportMode === 'player') {
                target = values.targetPlayer;
            } else {
                const x = parseFloat(values.x);
                const y = parseFloat(values.y);
                const z = parseFloat(values.z);
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                    setSubmitting(false);
                    addFlash({ key: flashKey, type: 'error', message: 'Please enter valid coordinates.' });
                    return;
                }
                target = `${x} ${y} ${z}`;
            }
            teleportPlayer(serverUuid, player.name, target)
                .then(() => {
                    addFlash({
                        key: flashKey,
                        type: 'success',
                        message:
                            teleportMode === 'player'
                                ? `Teleported ${player.name} to ${values.targetPlayer}.`
                                : `Teleported ${player.name} to coordinates ${target}.`,
                    });
                    close();
                    onRefresh();
                })
                .catch((error) => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: flashKey, error });
                });
        };
        const onlinePlayers = fastQueryData?.players?.online || [];
        const availablePlayers = onlinePlayers.filter((p) => p.name !== player.name);
        return (
            <Formik
                onSubmit={submit}
                initialValues={{
                    targetPlayer: availablePlayers.length > 0 ? availablePlayers[0].name : '',
                    x: '0',
                    y: '64',
                    z: '0',
                }}
            >
                {({ submitForm, isSubmitting, values, setFieldValue }) => (
                    <>
                        <Form css={tw`m-0`}>
                            <div css={tw`mb-4`}>
                                <Switch
                                    name='teleportMode'
                                    label='Teleport to coordinates'
                                    description='Toggle to teleport to specific coordinates instead of a player'
                                    defaultChecked={teleportMode === 'coordinates'}
                                    onChange={(e) => setTeleportMode(e.target.checked ? 'coordinates' : 'player')}
                                />
                            </div>
                            {teleportMode === 'player' ? (
                                <FormikField name='targetPlayer'>
                                    {({ field, form }: any) => (
                                        <Select
                                            {...field}
                                            label='Target Player'
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                form.setFieldValue(field.name, e.target.value);
                                            }}
                                            disabled={availablePlayers.length === 0}
                                        >
                                            {availablePlayers.length === 0 ? (
                                                <option value=''>No other players online</option>
                                            ) : (
                                                availablePlayers.map((p) => (
                                                    <option key={p.name} value={p.name}>
                                                        {p.name}
                                                    </option>
                                                ))
                                            )}
                                        </Select>
                                    )}
                                </FormikField>
                            ) : (
                                <div css={tw`space-y-4`}>
                                    <div css={tw`grid grid-cols-3 gap-4`}>
                                        <Field
                                            id='x'
                                            name='x'
                                            label='X Coordinate'
                                            type='text'
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = e.target.value;
                                                if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                                                    setFieldValue('x', value);
                                                }
                                            }}
                                        />
                                        <Field
                                            id='y'
                                            name='y'
                                            label='Y Coordinate'
                                            type='text'
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = e.target.value;
                                                if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                                                    setFieldValue('y', value);
                                                }
                                            }}
                                        />
                                        <Field
                                            id='z'
                                            name='z'
                                            label='Z Coordinate'
                                            type='text'
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = e.target.value;
                                                if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                                                    setFieldValue('z', value);
                                                }
                                            }}
                                        />
                                    </div>
                                    <p css={tw`text-neutral-400 text-xs`}>
                                        Enter coordinates where you want to teleport the player. Only numbers and
                                        negative signs are allowed.
                                    </p>
                                </div>
                            )}
                        </Form>
                        <Dialog.Footer>
                            <Button.Text onClick={close}>Cancel</Button.Text>
                            <Button
                                onClick={submitForm}
                                disabled={isSubmitting || (teleportMode === 'player' && availablePlayers.length === 0)}
                            >
                                Teleport
                            </Button>
                        </Dialog.Footer>
                    </>
                )}
            </Formik>
        );
    });
    const GamemodePlayerDialog = asDialog({ title: 'Change Gamemode' })(() => {
        const { close } = useContext(DialogWrapperContext);
        const submit = (values: { gamemode: string }, { setSubmitting }: any) => {
            clearFlashes(flashKey);
            changePlayerGamemode(serverUuid, player.uuid || '', parseInt(values.gamemode), player.name)
                .then(() => {
                    addFlash({ key: flashKey, type: 'success', message: `Gamemode changed for ${player.name}.` });
                    close();
                    onRefresh();
                })
                .catch((error) => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: flashKey, error });
                });
        };
        return (
            <Formik onSubmit={submit} initialValues={{ gamemode: player.gamemode?.toString() || '0' }}>
                {({ submitForm, isSubmitting }) => (
                    <>
                        <Form css={tw`m-0`}>
                            <FormikField name='gamemode'>
                                {({ field, form }: any) => (
                                    <Select
                                        {...field}
                                        label='Gamemode'
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                            form.setFieldValue(field.name, e.target.value);
                                        }}
                                    >
                                        <option value='0'>Survival</option>
                                        <option value='1'>Creative</option>
                                        <option value='2'>Adventure</option>
                                        <option value='3'>Spectator</option>
                                    </Select>
                                )}
                            </FormikField>
                        </Form>
                        <Dialog.Footer>
                            <Button.Text onClick={close}>Cancel</Button.Text>
                            <Button onClick={submitForm} disabled={isSubmitting}>
                                Change Gamemode
                            </Button>
                        </Dialog.Footer>
                    </>
                )}
            </Formik>
        );
    });
    interface GiveItemDialogProps {
        slot: number | null;
        type: string | null;
    }
    const GiveItemDialog = asDialog({ title: 'Give Item' })(({ slot, type }: GiveItemDialogProps) => {
        console.log('Rendering GiveItemDialog with slot:', slot, 'and type:', type);
        const GiveItemSchema = Yup.object().shape({
            item: Yup.string().required('An item ID is required.'),
            quantity: Yup.number().min(1, 'Quantity must be at least 1.').required('A quantity is required.'),
        });
        const { close } = useContext(DialogWrapperContext);
        const submit = (values: { target: string; item: string; quantity: string }, { setSubmitting }: any) => {
            console.log('Submitting give item with slot:', slot, 'and type:', type);
            clearFlashes(flashKey);
            giveItem(
                serverUuid,
                player.uuid || '',
                values.target,
                values.item,
                parseInt(values.quantity),
                0,
                slot,
                type
            )
                .then(() => {
                    addFlash({
                        key: flashKey,
                        type: 'success',
                        message: `Successfully gave ${values.quantity} of ${values.item} to ${values.target}.`,
                    });
                    close();
                    onRefresh();
                })
                .catch((error) => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: flashKey, error });
                });
        };
        return (
            <Formik
                onSubmit={submit}
                initialValues={{ target: player.name, item: '', quantity: '1' }}
                validationSchema={GiveItemSchema}
            >
                {({ submitForm, isSubmitting, values, setFieldValue, errors }) => (
                    <>
                        <Form css={tw`m-0`}>
                            <FormikField as={Select} name='target' label='Target'>
                                <option value={player.name}>Selected Player ({player.name})</option>
                                <option value='@a'>All Players</option>
                            </FormikField>
                            <div css={tw`flex space-x-4`}>
                                <div css={tw`flex-grow`}>
                                    <GiveItem
                                        nama='item'
                                        value={values.item}
                                        onChange={(value) => setFieldValue('item', value)}
                                        onSelect={(item) => setFieldValue('item', item.nama)}
                                        serverVersion={fastQueryData?.info.version?.name}
                                        placeholder='Search for an item...'
                                        label='Item ID'
                                        description='e.g., stone, diamond_sword, apple'
                                        hasError={!!errors.item}
                                        error={errors.item}
                                    />
                                </div>
                                <div css={tw`w-1/4`}>
                                    <Field id='quantity' name='quantity' label='Quantity' type='number' />
                                </div>
                            </div>
                        </Form>
                        <Dialog.Footer>
                            <Button.Text onClick={close}>Cancel</Button.Text>
                            <Button onClick={submitForm} disabled={isSubmitting}>
                                Give Item
                            </Button>
                        </Dialog.Footer>
                    </>
                )}
            </Formik>
        );
    });
    const OpPlayerDialog = asDialog({ title: 'Op Player' })(() => {
        const { close } = useContext(DialogWrapperContext);
        return (
            <>
                <p>Are you sure you want to make {player.name} an operator?</p>
                <Dialog.Footer>
                    <Button.Text onClick={close}>Cancel</Button.Text>
                    <Button.Danger onClick={() => handlePlayerAction('op').then(close)}>Op Player</Button.Danger>
                </Dialog.Footer>
            </>
        );
    });
    const KillPlayerDialog = asDialog({ title: 'Kill Player' })(() => {
        const { close } = useContext(DialogWrapperContext);
        return (
            <>
                <p>Are you sure you want to kill {player.name}?</p>
                <Dialog.Footer>
                    <Button.Text onClick={close}>Cancel</Button.Text>
                    <Button.Danger onClick={() => handlePlayerAction('kill').then(close)}>Kill Player</Button.Danger>
                </Dialog.Footer>
            </>
        );
    });
    const ClearInventoryDialog = asDialog({ title: 'Clear Inventory' })(() => {
        const { close } = useContext(DialogWrapperContext);
        return (
            <>
                <p>Are you sure you want to clear the inventory for {player.name}?</p>
                <Dialog.Footer>
                    <Button.Text onClick={close}>Cancel</Button.Text>
                    <Button.Danger onClick={() => handlePlayerAction('clearInventory').then(close)}>
                        Clear Inventory
                    </Button.Danger>
                </Dialog.Footer>
            </>
        );
    });
    const WipeDataDialog = asDialog({ title: 'Wipe Player Data' })(() => {
        const { close } = useContext(DialogWrapperContext);
        return (
            <>
                <p>Are you sure you want to wipe all data for {player.name}? This cannot be undone.</p>
                <Dialog.Footer>
                    <Button.Text onClick={close}>Cancel</Button.Text>
                    <Button.Danger onClick={() => handlePlayerAction('wipeData').then(close)}>Wipe Data</Button.Danger>
                </Dialog.Footer>
            </>
        );
    });
    const AddEffectDialog = asDialog({ title: 'Add Effect' })(() => {
        const { close } = useContext(DialogWrapperContext);
        const submit = (
            values: { target: string; effect: string; duration: string; amplifier: string },
            { setSubmitting }: any
        ) => {
            clearFlashes(flashKey);
            addEffect(
                serverUuid,
                player.uuid || '',
                values.target,
                values.effect,
                parseInt(values.duration),
                parseInt(values.amplifier)
            )
                .then(() => {
                    addFlash({
                        key: flashKey,
                        type: 'success',
                        message: `Successfully added effect ${values.effect} to ${values.target}.`,
                    });
                    close();
                    onRefresh();
                })
                .catch((error) => {
                    setSubmitting(false);
                    clearAndAddHttpError({ key: flashKey, error });
                });
        };
        return (
            <Formik
                onSubmit={submit}
                initialValues={{ target: player.name, effect: '', duration: '30', amplifier: '1' }}
            >
                {({ submitForm, isSubmitting, values }) => (
                    <>
                        <Form css={tw`m-0`}>
                            <FormikField as={Select} name='target' label='Target'>
                                <option value={player.name}>Selected Player ({player.name})</option>
                                <option value='@a'>All Players</option>
                            </FormikField>
                            <Field
                                autoFocus
                                id='effect'
                                name='effect'
                                label='Effect ID'
                                description='e.g., minecraft:speed'
                            />
                            <Field id='duration' name='duration' label='Duration (seconds)' type='number' />
                            <Field id='amplifier' name='amplifier' label='Amplifier' type='number' />
                        </Form>
                        <Dialog.Footer>
                            <Button.Text onClick={close}>Cancel</Button.Text>
                            <Button onClick={submitForm} disabled={isSubmitting}>
                                Add Effect
                            </Button>
                        </Dialog.Footer>
                    </>
                )}
            </Formik>
        );
    });
    const tabs = [
        {
            id: 'inventory',
            title: 'Inventory',
            icon: faBoxOpen,
            content: (
                <PlayerInventory
                    playerName={player.name}
                    playerItems={playerItems}
                    isLoading={!playerItems}
                    onRefresh={onRefresh}
                    serverVersion={fastQueryData?.info?.version?.name}
                    onGiveItem={(slot: number, type: string) => {
                        setSelectedSlot(slot);
                        setSelectedSlotType(type);
                        setShowGiveItemModal(true);
                    }}
                    onModalStateChange={onModalStateChange}
                />
            ),
        },
        {
            id: 'statistics',
            title: 'Statistics',
            icon: faHeartbeat,
            content: (
                <PlayerStats
                    stats={playerItems?.player_stats}
                    isLoading={!playerItems}
                    error={playerItems?.error}
                    onModifyStat={handleModifyStat}
                    isOnline={isOnline}
                />
            ),
        },
        {
            id: 'advancements',
            title: 'Advancements',
            icon: faPlus,
            content: <Advancements player={player} serverUuid={serverUuid} />,
        },
    ];
    return (
        <ContentBox css={tw`relative`}>
            <FlashMessageRender byKey={flashKey} css={tw`mb-4`} />
            {showBanModal && <BanPlayerDialog open={showBanModal} onClose={() => setShowBanModal(false)} />}
            {showBanIpModal && <BanIpDialog open={showBanIpModal} onClose={() => setShowBanIpModal(false)} />}
            {showKickModal && <KickPlayerDialog open={showKickModal} onClose={() => setShowKickModal(false)} />}
            {showWhisperModal && (
                <WhisperPlayerDialog open={showWhisperModal} onClose={() => setShowWhisperModal(false)} />
            )}
            {showTeleportModal && (
                <TeleportPlayerDialog open={showTeleportModal} onClose={() => setShowTeleportModal(false)} />
            )}
            {showGamemodeModal && (
                <GamemodePlayerDialog open={showGamemodeModal} onClose={() => setShowGamemodeModal(false)} />
            )}
            {showGiveItemModal && (
                <GiveItemDialog
                    open={showGiveItemModal}
                    onClose={() => {
                        setShowGiveItemModal(false);
                        setSelectedSlot(null);
                        setSelectedSlotType(null);
                    }}
                    slot={selectedSlot}
                    type={selectedSlotType}
                />
            )}
            {showAddEffectModal && (
                <AddEffectDialog open={showAddEffectModal} onClose={() => setShowAddEffectModal(false)} />
            )}
            {showOpModal && <OpPlayerDialog open={showOpModal} onClose={() => setShowOpModal(false)} />}
            {showKillModal && <KillPlayerDialog open={showKillModal} onClose={() => setShowKillModal(false)} />}
            {showClearInventoryModal && (
                <ClearInventoryDialog
                    open={showClearInventoryModal}
                    onClose={() => setShowClearInventoryModal(false)}
                />
            )}
            {showWipeDataModal && (
                <WipeDataDialog open={showWipeDataModal} onClose={() => setShowWipeDataModal(false)} />
            )}
            <div tw='flex items-start p-4 bg-neutral-800 rounded-t-lg border-b-2 border-neutral-700'>
                <img
                    src={
                        player.name.startsWith('.')
                            ? `https://minotar.net/helm/herobrine`
                            : `https://minotar.net/helm/${player.uuid}`
                    }
                    alt={player.uuid}
                    tw='w-16 h-16 rounded-md mr-4 border-2 border-neutral-600'
                />
                <div tw='flex-grow'>
                    <h2 tw='text-2xl font-bold text-white'>{player.name}</h2>
                    {player.uuid && (
                        <CopyOnClick text={player.uuid}>
                            <div tw='flex items-center cursor-pointer'>
                                <code tw='text-sm text-neutral-400 font-mono'>{player.uuid}</code>
                                <FontAwesomeIcon icon={faCopy} tw='ml-2 text-neutral-500' />
                            </div>
                        </CopyOnClick>
                    )}
                    <div tw='flex items-center mt-2 flex-wrap'>
                        {isOnline && <StatusBadge status='online'>Online</StatusBadge>}
                        {isBanned && <StatusBadge status='banned'>Banned</StatusBadge>}
                        {isIpBanned && <StatusBadge status='banned'>IP Banned</StatusBadge>}
                        {isOp && <StatusBadge status='op'>Operator</StatusBadge>}
                        {isWhitelisted && <StatusBadge status='whitelisted'>Whitelisted</StatusBadge>}
                    </div>
                </div>
            </div>
            <div tw='p-4'>
                <div tw='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div>
                        <h3 tw='text-sm font-semibold text-neutral-300 mb-2 uppercase'>General</h3>
                        <div tw='flex flex-col space-y-2'>
                            <Button
                                size={Button.Sizes.Small}
                                onClick={() => setShowWhisperModal(true)}
                                disabled={!isOnline}
                            >
                                <FontAwesomeIcon icon={faCommentDots} tw='mr-2' /> Message
                            </Button>
                            <Button
                                size={Button.Sizes.Small}
                                onClick={() => setShowTeleportModal(true)}
                                disabled={!isOnline}
                            >
                                <FontAwesomeIcon icon={faMapMarkerAlt} tw='mr-2' /> Teleport
                            </Button>
                            <Button.Text
                                size={Button.Sizes.Small}
                                onClick={() => setShowGamemodeModal(true)}
                                disabled={!isOnline}
                            >
                                <FontAwesomeIcon icon={faGamepad} tw='mr-2' /> Gamemode
                            </Button.Text>
                            <Button.Danger
                                size={Button.Sizes.Small}
                                onClick={() => setShowKillModal(true)}
                                disabled={!isOnline || loading === 'kill'}
                            >
                                <FontAwesomeIcon icon={faSkull} tw='mr-2' /> Kill
                            </Button.Danger>
                        </div>
                    </div>
                    <div>
                        <h3 tw='text-sm font-semibold text-neutral-300 mb-2 uppercase'>Inventory & Effects</h3>
                        <div tw='flex flex-col space-y-2'>
                            <Button
                                size={Button.Sizes.Small}
                                onClick={() => setShowGiveItemModal(true)}
                                disabled={!isOnline}
                            >
                                <FontAwesomeIcon icon={faHandRock} tw='mr-2' /> Give Item
                            </Button>
                            <Button.Text
                                size={Button.Sizes.Small}
                                onClick={() => setShowAddEffectModal(true)}
                                disabled={!isOnline}
                            >
                                <FontAwesomeIcon icon={faBolt} tw='mr-2' /> Add Effect
                            </Button.Text>
                            <Button.Text
                                size={Button.Sizes.Small}
                                onClick={() => handlePlayerAction('clearEffect')}
                                disabled={!isOnline || loading === 'clearEffect'}
                            >
                                <FontAwesomeIcon icon={faBroom} tw='mr-2' /> Clear Effects
                            </Button.Text>
                            <Button.Danger
                                size={Button.Sizes.Small}
                                onClick={() => setShowClearInventoryModal(true)}
                                disabled={!isOnline || loading === 'clearInventory'}
                            >
                                <FontAwesomeIcon icon={faBoxOpen} tw='mr-2' /> Clear Inventory
                            </Button.Danger>
                        </div>
                    </div>
                    <div>
                        <h3 tw='text-sm font-semibold text-neutral-300 mb-2 uppercase'>Moderation</h3>
                        <div tw='flex flex-col space-y-2'>
                            {isBanned ? (
                                <Button.Text
                                    size={Button.Sizes.Small}
                                    onClick={() => handlePlayerAction('unban')}
                                    disabled={loading === 'unban'}
                                >
                                    <FontAwesomeIcon icon={faUserCheck} tw='mr-2' /> Unban
                                </Button.Text>
                            ) : (
                                <Button.Danger
                                    size={Button.Sizes.Small}
                                    onClick={() => setShowBanModal(true)}
                                    disabled={loading === 'ban'}
                                >
                                    <FontAwesomeIcon icon={faBan} tw='mr-2' /> Ban
                                </Button.Danger>
                            )}
                            {isIpBanned ? (
                                <Button.Text
                                    size={Button.Sizes.Small}
                                    onClick={() => handlePlayerAction('unbanIp')}
                                    disabled={loading === 'unbanIp'}
                                >
                                    <FontAwesomeIcon icon={faUserCheck} tw='mr-2' /> Unban IP
                                </Button.Text>
                            ) : (
                                <Button.Danger
                                    size={Button.Sizes.Small}
                                    onClick={() => setShowBanIpModal(true)}
                                    disabled={loading === 'banIp'}
                                >
                                    <FontAwesomeIcon icon={faBan} tw='mr-2' /> Ban IP
                                </Button.Danger>
                            )}
                            <Button.Text
                                size={Button.Sizes.Small}
                                onClick={() => setShowKickModal(true)}
                                disabled={!isOnline || loading === 'kick'}
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} tw='mr-2' /> Kick
                            </Button.Text>
                            {isWhitelisted ? (
                                <Button
                                    size={Button.Sizes.Small}
                                    onClick={() => handlePlayerAction('unwhitelist')}
                                    disabled={loading === 'unwhitelist'}
                                >
                                    <FontAwesomeIcon icon={faMinus} tw='mr-2' /> Unwhitelist
                                </Button>
                            ) : (
                                <Button
                                    size={Button.Sizes.Small}
                                    onClick={() => handlePlayerAction('whitelist')}
                                    disabled={loading === 'whitelist'}
                                >
                                    <FontAwesomeIcon icon={faPlus} tw='mr-2' /> Whitelist
                                </Button>
                            )}
                            {isOp ? (
                                <Button.Text
                                    size={Button.Sizes.Small}
                                    onClick={() => handlePlayerAction('deop')}
                                    disabled={loading === 'deop'}
                                >
                                    <FontAwesomeIcon icon={faUserShield} tw='mr-2' /> De-Op
                                </Button.Text>
                            ) : (
                                <Button.Text
                                    size={Button.Sizes.Small}
                                    onClick={() => setShowOpModal(true)}
                                    disabled={loading === 'op'}
                                >
                                    <FontAwesomeIcon icon={faUserShield} tw='mr-2' /> Op
                                </Button.Text>
                            )}
                            <Button.Danger
                                size={Button.Sizes.Small}
                                onClick={() => setShowWipeDataModal(true)}
                                disabled={loading === 'wipeData'}
                            >
                                <FontAwesomeIcon icon={faTrash} tw='mr-2' /> Wipe Data
                            </Button.Danger>
                        </div>
                    </div>
                </div>
            </div>
            <div tw='px-4 pb-4'>
                <PlayerDetailsTabs tabs={tabs} />
            </div>
        </ContentBox>
    );
};
export default PlayerDetails;
