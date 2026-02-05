import React, { useEffect, useState, useContext } from 'react';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import { Button } from '@/components/elements/button/index';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import http, { httpErrorToHuman } from '@/api/http';
import Select from '@/components/elements/Select';
import asDialog from '@/hoc/asDialog';
import Alert from '@/components/elements/alert/Alert';
import FormikSwitch from '@/components/elements/FormikSwitch';
import { Form, Formik } from 'formik';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faDownload, faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';

interface Version {
    version_number: string;
    update_title?: string;
    server_version?: string;
}

interface VersionDetails {
    update_title: string;
    description: string;
    server_version: string;
    version_number: string;
}

interface InstallStatus {
    type: 'success' | 'info' | null;
    message: string;
}

const InstallVersionDialog = asDialog({
    title: 'เลือกเวอร์ชัน Minecraft Bedrock',
})(({ version, onClose }: { version: string; onClose: () => void }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [versionDetails, setVersionDetails] = useState<VersionDetails | null>(null);
    const [availableVersions, setAvailableVersions] = useState<Version[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>(version);
    const [installStatus, setInstallStatus] = useState<InstallStatus>({ type: null, message: '' });
    const [isLoadingVersions, setIsLoadingVersions] = useState(true);
    const [showWarning, setShowWarning] = useState(true);
    const { addError, clearFlashes } = useFlash();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { close } = useContext(DialogWrapperContext);

    // Fetch version details for all available versions
    const fetchVersionDetails = async (versions: Version[]) => {
        try {
            const detailedVersions = await Promise.all(
                versions.map(async (v) => {
                    try {
                        const { data } = await http.get(`/api/client/servers/${uuid}/mcbe/version/${v.version_number}`);
                        return {
                            ...v,
                            update_title: data.update_title,
                            server_version: data.server_version,
                        };
                    } catch (error) {
                        console.error(`Error fetching details for version ${v.version_number}:`, error);
                        return v;
                    }
                })
            );
            setAvailableVersions(detailedVersions);
        } finally {
            setIsLoadingVersions(false);
        }
    };

    useEffect(() => {
        clearFlashes();
        setIsLoadingVersions(true);
        http.get(`/api/client/servers/${uuid}/mcbe/versions`)
            .then(({ data }) => {
                const selectedMajorMinor = version.split('.').slice(0, 2).join('.');

                const filteredVersions = data.versions
                    .filter((v: Version) => {
                        const versionMajorMinor = v.version_number.split('.').slice(0, 2).join('.');
                        return versionMajorMinor === selectedMajorMinor;
                    })
                    .sort((a: Version, b: Version) =>
                        b.version_number.localeCompare(a.version_number, undefined, { numeric: true })
                    );

                if (filteredVersions.length > 0) {
                    setSelectedVersion(filteredVersions[0].version_number);
                }

                // Fetch details for all filtered versions
                fetchVersionDetails(filteredVersions);
            })
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error) });
                setIsLoadingVersions(false);
            });
    }, [version]);

    useEffect(() => {
        if (!selectedVersion) return;

        http.get(`/api/client/servers/${uuid}/mcbe/version/${selectedVersion}`)
            .then(({ data }) => {
                setVersionDetails(data);
            })
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error) });
            });
    }, [selectedVersion]);

    const doInstallation = (values: { deleteFiles: boolean }) => {
        setIsSubmitting(true);
        setShowWarning(false);
        clearFlashes();
        setInstallStatus({ type: 'info', message: 'Installing version, please wait...' });

        http.post(`/api/client/servers/${uuid}/mcbe/install`, {
            version: selectedVersion,
            deleteFiles: values.deleteFiles,
        })
            .then(() => {
                setInstallStatus({ type: 'success', message: 'Version installed successfully!' });
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            })
            .catch((error) => {
                console.error(error);
                setInstallStatus({ type: null, message: '' });
                setShowWarning(true);
                addError({ message: httpErrorToHuman(error) });
                setIsSubmitting(false);
            });
    };

    const isVersionSupported = (v: Version) => {
        return v.server_version && v.server_version !== 'N/A';
    };

    return (
        <>
            <FlashMessageRender byKey='mcbe:version:install' />
            <div>
                <Formik
                    initialValues={{
                        deleteFiles: false,
                    }}
                    onSubmit={(values) => {
                        setIsSubmitting(true);
                        setShowWarning(false);
                        clearFlashes();
                        setInstallStatus({ type: 'info', message: 'กำลังติดตั้งเวอร์ชัน กรุณารอสักครู่...' });

                        http.post(`/api/client/servers/${uuid}/mcbe/install`, {
                            version: selectedVersion,
                            deleteFiles: values.deleteFiles,
                        })
                            .then(() => {
                                setInstallStatus({ type: 'success', message: 'ติดตั้งเวอร์ชันสำเร็จแล้ว!' });
                                setTimeout(() => {
                                    window.location.reload();
                                }, 1500);
                            })
                            .catch((error) => {
                                console.error(error);
                                setInstallStatus({ type: null, message: '' });
                                setShowWarning(true);
                                addError({ message: httpErrorToHuman(error) });
                                setIsSubmitting(false);
                            });
                    }}
                >
                    {({ submitForm }) => (
                        <div className='flex flex-col space-y-4'>
                            {showWarning && (
                                <Alert type='warning' className='mb-2'>
                                    <div className='flex items-center'>
                                        <p>การเปลี่ยนเวอร์ชันอาจส่งผลต่อความเข้ากันได้ของข้อมูลโลก</p>
                                    </div>
                                </Alert>
                            )}
                            {installStatus.type && (
                                <Alert type={installStatus.type} className='mb-4'>
                                    {installStatus.message}
                                </Alert>
                            )}

                            <div>
                                {isLoadingVersions ? (
                                    <div className='flex items-center justify-center p-3'>
                                        <Spinner size='small' />
                                        <p className='ml-2 text-sm text-neutral-300'>กำลังโหลดเวอร์ชัน...</p>
                                    </div>
                                ) : availableVersions.length > 0 ? (
                                    <Select
                                        onChange={(e) => setSelectedVersion(e.target.value)}
                                        value={selectedVersion}
                                    >
                                        {availableVersions.map((v) => (
                                            <option
                                                key={v.version_number}
                                                value={v.version_number}
                                                className={!isVersionSupported(v) ? 'text-red-500' : ''}
                                            >
                                                {v.version_number}
                                                {v.update_title ? ` - ${v.update_title}` : ''}
                                                {!isVersionSupported(v) ? ' (ยังไม่เปิดตัว)' : ''}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <p className='text-sm text-neutral-300 text-center'>ไม่มีเวอร์ชันพร้อมใช้งาน</p>
                                )}
                            </div>
                            {versionDetails && (
                                <div>
                                    <div className='text-sm text-neutral-300'>
                                        <p className='mb-2'>รายละเอียดเวอร์ชัน</p>
                                        <div css={tw`bg-neutral-800 rounded p-4`}>
                                            <h3 className='text-md font-bold text-neutral-100'>
                                                {versionDetails.update_title || versionDetails.version_number}
                                            </h3>
                                            <p className='mb-2'>
                                                เวอร์ชันเซิร์ฟเวอร์:{' '}
                                                <u>
                                                    {versionDetails.server_version === 'N/A'
                                                        ? 'ยังไม่เปิดตัว '
                                                        : versionDetails.server_version}
                                                </u>
                                                <Tooltip
                                                    placement='top'
                                                    content={
                                                        versionDetails.server_version === 'N/A'
                                                            ? 'เซิร์ฟเวอร์ยังไม่พร้อมสำหรับเวอร์ชันนี้'
                                                            : 'เซิร์ฟเวอร์พร้อมสำหรับเวอร์ชันนี้'
                                                    }
                                                >
                                                    <span>
                                                        {versionDetails.server_version === 'N/A' ? (
                                                            <FontAwesomeIcon
                                                                icon={faExclamationCircle}
                                                                className='ml-1 text-red-400'
                                                            />
                                                        ) : (
                                                            <FontAwesomeIcon
                                                                icon={faCheckCircle}
                                                                className='ml-1 text-green-400'
                                                            />
                                                        )}
                                                    </span>
                                                </Tooltip>
                                            </p>
                                            {versionDetails.description}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                                <FormikSwitch
                                    name='deleteFiles'
                                    label='ลบไฟล์ที่มีอยู่'
                                    description='ลบไฟล์ทั้งหมดที่มีอยู่ก่อนติดตั้งเวอร์ชันใหม่'
                                />
                            </div>
                            <Dialog.Footer>
                                <Button.Text
                                    type='button'
                                    className={'w-full sm:w-auto'}
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        close();
                                        onClose();
                                        window.dispatchEvent(new CustomEvent('mcbe:version:close'));
                                    }}
                                >
                                    ยกเลิก
                                </Button.Text>
                                <Button
                                    type='button'
                                    className={'w-full sm:w-auto'}
                                    disabled={isSubmitting || !!(versionDetails && !isVersionSupported(versionDetails))}
                                    onClick={() => {
                                        submitForm();
                                    }}
                                >
                                    <FontAwesomeIcon
                                        icon={isSubmitting ? faSpinner : faDownload}
                                        spin={isSubmitting}
                                        css={tw`mr-1`}
                                    />
                                    ติดตั้ง
                                </Button>
                            </Dialog.Footer>
                        </div>
                    )}
                </Formik>
            </div>
        </>
    );
});

export default ({ version }: { version: string | null }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(!!version);
    }, [version]);

    return (
        <InstallVersionDialog
            open={open}
            onClose={() => {
                setOpen(false);
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('mcbe:version:close'));
                }, 100);
            }}
            version={version || ''}
        />
    );
};
