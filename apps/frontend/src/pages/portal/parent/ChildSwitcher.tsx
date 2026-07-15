/**
 * ChildSwitcher — 多孩子切换下拉菜单
 *
 * UI 原型 Section 21: 家长门户 — 孩子切换器
 *
 * 显示家长关联的所有孩子，当前选中的孩子高亮。
 * 切换后通过 onChange 回调通知父组件。
 */

import React, { useState, useRef, useEffect } from 'react';
import type { ChildInfo } from './api';

interface ChildSwitcherProps {
  childrenList: ChildInfo[];
  currentChildId: string;
  onChange: (child: ChildInfo) => void;
}

const ChildSwitcher: React.FC<ChildSwitcherProps> = ({
  childrenList,
  currentChildId,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = childrenList.find((c) => c.id === currentChildId);
  const displayName = current ? `${current.name} ${current.class_name}` : '请选择孩子';

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!childrenList.length) {
    return (
      <div className="child-switcher">
        <span className="child-switcher__label">暂无关联孩子</span>
      </div>
    );
  }

  return (
    <div className="child-switcher" ref={ref}>
      <button
        className="child-switcher__toggle"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="child-switcher__icon">👤</span>
        <span className="child-switcher__text">{displayName}</span>
        <span className={`child-switcher__arrow ${open ? 'child-switcher__arrow--up' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <ul className="child-switcher__menu" role="listbox">
          {childrenList.map((child) => {
            const isActive = child.id === currentChildId;
            return (
              <li
                key={child.id}
                role="option"
                aria-selected={isActive}
                className={`child-switcher__item ${isActive ? 'child-switcher__item--active' : ''}`}
                onClick={() => {
                  if (!isActive) {
                    onChange(child);
                  }
                  setOpen(false);
                }}
              >
                <span className="child-switcher__item-icon">🧒</span>
                <span className="child-switcher__item-name">{child.name}</span>
                <span className="child-switcher__item-class">{child.class_name}</span>
                {isActive && <span className="child-switcher__item-badge">当前</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ChildSwitcher;
