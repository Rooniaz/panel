import React, { useState } from 'react';
import copy from 'copy-to-clipboard';
import classNames from 'classnames';
import Toast from '@/components/topup/Toast';

interface CopyOnClickProps {
    text: string | number | null | undefined;
    showInNotification?: boolean;
    children: React.ReactNode;
}

const CopyOnClick = ({ text, showInNotification = true, children }: CopyOnClickProps) => {
    const [copied, setCopied] = useState(false);

    if (!React.isValidElement(children)) {
        throw new Error('Component passed to <CopyOnClick/> must be a valid React element.');
    }

    const child = !text
        ? React.Children.only(children)
        : React.cloneElement(React.Children.only(children), {
              className: classNames(children.props.className || '', 'cursor-pointer'),
              onClick: (e: React.MouseEvent<HTMLElement>) => {
                  copy(String(text));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                  if (typeof children.props.onClick === 'function') {
                      children.props.onClick(e);
                  }
              },
          });

    return (
        <>
            <Toast show={copied} type='success' onClose={() => setCopied(false)} duration={2500}>
                {showInNotification ? `คัดลอก "${String(text)}" ลงคลิปบอร์ดแล้ว` : 'คัดลอกข้อความลงคลิปบอร์ดแล้ว'}
            </Toast>
            {child}
        </>
    );
};

export default CopyOnClick;
