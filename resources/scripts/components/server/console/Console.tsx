import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import { SearchBarAddon } from 'xterm-addon-search-bar';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { ScrollDownHelperAddon } from '@/plugins/XtermScrollDownHelperAddon';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import { theme as th } from 'twin.macro';
import useEventListener from '@/plugins/useEventListener';
import { debounce } from 'debounce';
import { usePersistedState } from '@/plugins/usePersistedState';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import classNames from 'classnames';
import { ChevronDoubleRightIcon, ClipboardCopyIcon } from '@heroicons/react/solid';

import 'xterm/css/xterm.css';
import styles from './style.module.css';

const theme = {
    background: th`colors.black`.toString(),
    cursor: 'transparent',
    black: th`colors.black`.toString(),
    red: '#E54B4B',
    green: '#9ECE58',
    yellow: '#FAED70',
    blue: '#396FE2',
    magenta: '#BB80B3',
    cyan: '#2DDAFD',
    white: '#d0d0d0',
    brightBlack: 'rgba(255, 255, 255, 0.2)',
    brightRed: '#FF5370',
    brightGreen: '#C3E88D',
    brightYellow: '#FFCB6B',
    brightBlue: '#82AAFF',
    brightMagenta: '#C792EA',
    brightCyan: '#89DDFF',
    brightWhite: '#ffffff',
    selection: '#FAF089',
};

const terminalProps: ITerminalOptions = {
    disableStdin: true,
    cursorStyle: 'underline',
    allowTransparency: true,
    fontSize: 12,
    fontFamily: th('fontFamily.mono'),
    rows: 30,
    theme: theme,
};

type LogType = 'all' | 'info' | 'error' | 'warning';

interface LogEntry {
    line: string;
    type: LogType;
    timestamp: number;
    hasPrelude?: boolean;
    isError?: boolean;
}

export default () => {
    const TERMINAL_PRELUDE = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';
    const ref = useRef<HTMLDivElement>(null);
    const terminal = useMemo(() => new Terminal({ ...terminalProps }), []);
    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const searchBar = new SearchBarAddon({ searchAddon });
    const webLinksAddon = new WebLinksAddon();
    const scrollDownHelperAddon = new ScrollDownHelperAddon();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const [canSendCommands] = usePermissions(['control.console']);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const [history, setHistory] = usePersistedState<string[]>(`${serverId}:command_history`, []);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [activeFilter, setActiveFilter] = useState<LogType>('all');
    const [copied, setCopied] = useState(false);
    // SearchBarAddon has hardcoded z-index: 999 :(
    const zIndex = `
    .xterm-search-bar__addon {
        z-index: 10;
    }`;

    const detectLogType = (line: string): LogType => {
        const lowerLine = line.toLowerCase();
        // Check for error patterns
        if (
            lowerLine.includes('[error]') ||
            lowerLine.includes('error:') ||
            lowerLine.includes('exception') ||
            lowerLine.includes('failed') ||
            lowerLine.includes('fatal') ||
            lowerLine.includes('cannot') ||
            lowerLine.includes('could not') ||
            lowerLine.includes('nosuchfileexception') ||
            lowerLine.includes('at java.') ||
            lowerLine.includes('at sun.')
        ) {
            return 'error';
        }
        // Check for warning patterns
        if (
            lowerLine.includes('[warn]') ||
            lowerLine.includes('warning:') ||
            lowerLine.includes('warn:') ||
            lowerLine.includes('[warning]')
        ) {
            return 'warning';
        }
        // Check for info patterns
        if (
            lowerLine.includes('[info]') ||
            lowerLine.includes('info:') ||
            lowerLine.includes('starting') ||
            lowerLine.includes('loaded') ||
            lowerLine.includes('server started')
        ) {
            return 'info';
        }
        return 'all';
    };

    const handleConsoleOutput = (line: string, prelude = false) => {
        const cleanLine = line.replace(/(?:\r\n|\r|\n)$/im, '');
        const logType = detectLogType(cleanLine);
        const logEntry: LogEntry = {
            line: cleanLine,
            type: logType,
            timestamp: Date.now(),
            hasPrelude: prelude,
        };
        
        setLogs((prevLogs) => [...prevLogs, logEntry]);
        
        // Only write to terminal if it matches the active filter
        if (activeFilter === 'all' || activeFilter === logType || (activeFilter === 'info' && logType === 'all')) {
            terminal.writeln((prelude ? TERMINAL_PRELUDE : '') + cleanLine + '\u001b[0m');
        }
    };

    const handleTransferStatus = (status: string) => {
        switch (status) {
            // Sent by either the source or target node if a failure occurs.
            case 'failure':
                const failureLine = 'Transfer has failed.';
                const logEntry: LogEntry = {
                    line: failureLine,
                    type: 'error',
                    timestamp: Date.now(),
                    hasPrelude: true,
                };
                setLogs((prevLogs) => [...prevLogs, logEntry]);
                
                if (activeFilter === 'all' || activeFilter === 'error') {
                    terminal.writeln(TERMINAL_PRELUDE + failureLine + '\u001b[0m');
                }
                return;
        }
    };

    const handleDaemonErrorOutput = (line: string) => {
        const cleanLine = line.replace(/(?:\r\n|\r|\n)$/im, '');
        const logEntry: LogEntry = {
            line: cleanLine,
            type: 'error',
            timestamp: Date.now(),
            hasPrelude: true,
            isError: true,
        };
        setLogs((prevLogs) => [...prevLogs, logEntry]);
        
        if (activeFilter === 'all' || activeFilter === 'error') {
            terminal.writeln(TERMINAL_PRELUDE + '\u001b[1m\u001b[41m' + cleanLine + '\u001b[0m');
        }
    };

    const handlePowerChangeEvent = (state: string) => {
        const powerLine = 'Server marked as ' + state + '...';
        const logEntry: LogEntry = {
            line: powerLine,
            type: 'info',
            timestamp: Date.now(),
            hasPrelude: true,
        };
        setLogs((prevLogs) => [...prevLogs, logEntry]);
        
        if (activeFilter === 'all' || activeFilter === 'info') {
            terminal.writeln(TERMINAL_PRELUDE + powerLine + '\u001b[0m');
        }
    };

    const handleClearConsole = () => {
        if (terminal.element) {
            terminal.clear();
            setLogs([]);
        }
    };

    const handleCopyToClipboard = async () => {
        const filteredLogs = logs.filter((log) => {
            if (activeFilter === 'all') return true;
            return log.type === activeFilter || (activeFilter === 'info' && log.type === 'all');
        });

        const logText = filteredLogs.map((log) => log.line).join('\n');
        
        try {
            await navigator.clipboard.writeText(logText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getLogCount = (type: LogType): number => {
        if (type === 'all') return logs.length;
        return logs.filter((log) => log.type === type || (type === 'info' && log.type === 'all')).length;
    };

    const handleFilterChange = (filter: LogType) => {
        setActiveFilter(filter);
        
        // Clear and re-render terminal with filtered logs
        if (terminal.element) {
            terminal.clear();
            
            const filteredLogs = logs.filter((log) => {
                if (filter === 'all') return true;
                return log.type === filter || (filter === 'info' && log.type === 'all');
            });

            filteredLogs.forEach((log) => {
                const prelude = log.hasPrelude ? TERMINAL_PRELUDE : '';
                const errorStyle = log.isError ? '\u001b[1m\u001b[41m' : '';
                terminal.writeln(prelude + errorStyle + log.line + '\u001b[0m');
            });
        }
    };

    const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            const newIndex = Math.min(historyIndex + 1, history!.length - 1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex] || '';

            // By default up arrow will also bring the cursor to the start of the line,
            // so we'll preventDefault to keep it at the end.
            e.preventDefault();
        }

        if (e.key === 'ArrowDown') {
            const newIndex = Math.max(historyIndex - 1, -1);

            setHistoryIndex(newIndex);
            e.currentTarget.value = history![newIndex] || '';
        }

        const command = e.currentTarget.value;
        if (e.key === 'Enter' && command.length > 0) {
            setHistory((prevHistory) => [command, ...prevHistory!].slice(0, 32));
            setHistoryIndex(-1);

            instance && instance.send('send command', command);
            e.currentTarget.value = '';
        }
    };

    useEffect(() => {
        if (connected && ref.current && !terminal.element) {
            terminal.loadAddon(fitAddon);
            terminal.loadAddon(searchAddon);
            terminal.loadAddon(searchBar);
            terminal.loadAddon(webLinksAddon);
            terminal.loadAddon(scrollDownHelperAddon);

            terminal.open(ref.current);
            fitAddon.fit();
            searchBar.addNewStyle(zIndex);

            // Add support for capturing keys
            terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                    document.execCommand('copy');
                    return false;
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    searchBar.show();
                    return false;
                } else if (e.key === 'Escape') {
                    searchBar.hidden();
                }
                return true;
            });
        }
    }, [terminal, connected]);

    useEventListener(
        'resize',
        debounce(() => {
            if (terminal.element) {
                fitAddon.fit();
            }
        }, 100)
    );

    useEffect(() => {
        const listeners: Record<string, (s: string) => void> = {
            [SocketEvent.STATUS]: handlePowerChangeEvent,
            [SocketEvent.CONSOLE_OUTPUT]: handleConsoleOutput,
            [SocketEvent.INSTALL_OUTPUT]: handleConsoleOutput,
            [SocketEvent.TRANSFER_LOGS]: handleConsoleOutput,
            [SocketEvent.TRANSFER_STATUS]: handleTransferStatus,
            [SocketEvent.DAEMON_MESSAGE]: (line) => handleConsoleOutput(line, true),
            [SocketEvent.DAEMON_ERROR]: handleDaemonErrorOutput,
        };

        if (connected && instance) {
            // Do not clear the console if the server is being transferred.
            if (!isTransferring) {
                terminal.clear();
                setLogs([]);
            }

            Object.keys(listeners).forEach((key: string) => {
                instance.addListener(key, listeners[key]);
            });
            instance.send(SocketRequest.SEND_LOGS);
        }

        return () => {
            if (instance) {
                Object.keys(listeners).forEach((key: string) => {
                    instance.removeListener(key, listeners[key]);
                });
            }
        };
    }, [connected, instance]);

    return (
        <div className={classNames(styles.terminal, 'relative')}>
            <SpinnerOverlay visible={!connected} size={'large'} />
            <div className={styles.log_header}>
                <div className={styles.log_tabs}>
                    <button
                        type={'button'}
                        onClick={() => handleFilterChange('all')}
                        className={classNames(styles.log_tab, { [styles.log_tab_active]: activeFilter === 'all' })}
                    >
                        View all ({getLogCount('all')})
                    </button>
                    <button
                        type={'button'}
                        onClick={() => handleFilterChange('info')}
                        className={classNames(styles.log_tab, { [styles.log_tab_active]: activeFilter === 'info' })}
                    >
                        Info ({getLogCount('info')})
                    </button>
                    <button
                        type={'button'}
                        onClick={() => handleFilterChange('error')}
                        className={classNames(styles.log_tab, { [styles.log_tab_active]: activeFilter === 'error' })}
                    >
                        Error ({getLogCount('error')})
                    </button>
                    <button
                        type={'button'}
                        onClick={() => handleFilterChange('warning')}
                        className={classNames(styles.log_tab, { [styles.log_tab_active]: activeFilter === 'warning' })}
                    >
                        Warning ({getLogCount('warning')})
                    </button>
                </div>
                <div className={styles.log_actions}>
                    <button
                        type={'button'}
                        onClick={handleCopyToClipboard}
                        className={styles.copy_button}
                        title={'Copy logs to clipboard'}
                        disabled={logs.length === 0}
                    >
                        <ClipboardCopyIcon className={'w-4 h-4'} />
                        {copied && <span className={styles.copied_indicator}>Copied!</span>}
                    </button>
                    <button
                        type={'button'}
                        onClick={handleClearConsole}
                        className={styles.copy_button}
                        title={'Clear console'}
                        disabled={!instance || !connected}
                    >
                        Clear
                    </button>
                </div>
            </div>
            <div
                className={classNames(styles.container, styles.overflows_container, { 'rounded-b': !canSendCommands })}
            >
                <div className={'h-full'}>
                    <div id={styles.terminal} ref={ref} />
                </div>
            </div>
            {canSendCommands && (
                <div className={classNames('relative', styles.overflows_container)}>
                    <input
                        className={classNames('peer', styles.command_input)}
                        type={'text'}
                        placeholder={'Type a command...'}
                        aria-label={'Console command input.'}
                        disabled={!instance || !connected}
                        onKeyDown={handleCommandKeyDown}
                        autoCorrect={'off'}
                        autoCapitalize={'none'}
                    />
                    <div
                        className={classNames(
                            'text-gray-100 peer-focus:text-gray-50 peer-focus:animate-pulse',
                            styles.command_icon
                        )}
                    >
                        <ChevronDoubleRightIcon className={'w-4 h-4'} />
                    </div>
                </div>
            )}
        </div>
    );
};
