import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import styles from './style.module.css';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
}

export default ({ title, copyOnClick, icon, color, className, children }: StatBlockProps) => {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames(styles.stat_block, className)}>
                <div className={classNames(styles.status_bar, color || 'bg-gray-700')} />
                <div className={classNames(styles.icon, color || 'bg-gradient-to-br from-gray-600 to-gray-700')}>
                    <Icon
                        icon={icon}
                        className={classNames('transition-all duration-300', {
                            'text-gray-100': !color || color === 'bg-gray-700',
                            'text-white': color && color !== 'bg-gray-700',
                        })}
                    />
                </div>
                <div className={'flex flex-col justify-center overflow-hidden w-full'}>
                    <p
                        className={
                            'font-header leading-tight text-xs md:text-sm text-gray-300 font-medium tracking-wide uppercase'
                        }
                    >
                        {title}
                    </p>
                    <div
                        ref={ref}
                        className={'h-[1.75rem] w-full font-semibold text-white truncate transition-all duration-200'}
                        style={{ fontSize }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
