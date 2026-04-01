'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CloseIcon } from './Icons';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

function getChartThemeColors(theme) {
  if (theme === 'light') {
    return {
      danger: '#dc2626',
      success: '#059669',
      muted: '#475569',
      border: '#e2e8f0',
      text: '#0f172a',
    };
  }
  return {
    danger: '#f87171',
    success: '#34d399',
    muted: '#9ca3af',
    border: '#1f2937',
    text: '#e5e7eb',
  };
}

export default function FundDailyEarningsDetailModal({
  open,
  onOpenChange,
  series = [],
  theme = 'dark',
  masked = false,
  title = '收益明细',
}) {
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef(null);
  const colors = useMemo(() => getChartThemeColors(theme), [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const rows = useMemo(() => {
    if (!Array.isArray(series) || series.length === 0) return [];
    return [...series].reverse();
  }, [series]);

  const totalEarnings = useMemo(() => {
    if (!rows.length) return 0;
    return rows.reduce((sum, d) => {
      const v = d?.earnings;
      return (typeof v === 'number' && Number.isFinite(v)) ? sum + v : sum;
    }, 0);
  }, [rows]);

  const maxAbs = useMemo(() => {
    if (!rows.length) return 1;
    let m = 0;
    for (const r of rows) {
      const v = r?.earnings;
      if (typeof v === 'number' && Number.isFinite(v)) {
        const a = Math.abs(v);
        if (a > m) m = a;
      }
    }
    return m || 1;
  }, [rows]);

  const handleOpenChange = (next) => {
    if (!next) onOpenChange?.(false);
  };

  const header = (
    <div className="title" style={{ marginBottom: 10, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{title}</span>
      </div>
      <button
        type="button"
        className="icon-button"
        onClick={() => onOpenChange?.(false)}
        style={{ border: 'none', background: 'transparent' }}
      >
        <CloseIcon width="20" height="20" />
      </button>
    </div>
  );

  const sumColor = masked
    ? 'var(--muted)'
    : totalEarnings >= 0
      ? colors.danger
      : colors.success;

  const body = (
    <div ref={scrollRef} style={{ maxHeight: '78vh', overflowY: 'auto', paddingRight: 4 }}>
      <div style={{ padding: '6px 2px 12px', textAlign: 'center' }}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>累计收益(元)</div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: sumColor,
            lineHeight: 1.1,
          }}
        >
          {masked ? '***' : `${totalEarnings >= 0 ? '+' : '-'}${Math.abs(totalEarnings).toFixed(2)}`}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '6px 2px 2px' }}>
        {rows.length === 0 && (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>暂无数据</span>
          </div>
        )}

        {rows.map((row, idx) => {
          const v = row?.earnings;
          const isValid = typeof v === 'number' && Number.isFinite(v);
          const value = isValid ? v : 0;
          const rate = typeof row?.rate === 'number' && Number.isFinite(row.rate) ? row.rate : null;
          const ratio = Math.min(1, Math.abs(value) / maxAbs);

          // 参照截图：涨红跌绿（CN 市场风格）
          const barColor = value > 0 ? colors.danger : value < 0 ? colors.success : '#94a3b8';
          const trackBg = theme === 'light' ? '#eef2f7' : '#0b1220';

          const centerPct = 50;
          const halfWidthPct = ratio * 50;
          const barLeft = value >= 0 ? centerPct : centerPct - halfWidthPct;
          const barWidth = halfWidthPct;

          const textColor = theme === 'light' ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.92)';
          const showValue = masked
            ? '***'
            : isValid
              ? `${value > 0 ? '' : value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}`
              : '—';
          const showRate = masked
            ? ''
            : (rate == null ? '' : `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`);

          return (
            <div
              key={`${row?.date || 'row'}_${idx}`}
              style={{
                position: 'relative',
                height: 38,
                borderRadius: 10,
                overflow: 'hidden',
                background: trackBg,
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '50%',
                  width: 1,
                  background: theme === 'light' ? 'rgba(148,163,184,0.6)' : 'rgba(148,163,184,0.35)',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${barLeft}%`,
                  width: `${barWidth}%`,
                  background: barColor,
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                  color: textColor,
                }}
              >
                {row?.date || '—'}
              </div>

              <div
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                  color: textColor,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.05, gap: 2 }}>
                  <div>{showValue}</div>
                  {showRate ? (
                    <div className="muted" style={{ fontSize: 11, opacity: 0.9, fontVariantNumeric: 'tabular-nums' }}>
                      {showRate}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!open) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
        <DrawerContent className="glass" defaultHeight="80vh" minHeight="40vh" maxHeight="90vh">
          <DrawerHeader className="flex flex-row items-center justify-between gap-2 py-3">
            <DrawerTitle className="flex items-center gap-2.5 text-left">
              <span>{title}</span>
            </DrawerTitle>
            <DrawerClose
              className="icon-button border-none bg-transparent p-1"
              title="关闭"
              style={{ borderColor: 'transparent', backgroundColor: 'transparent' }}
            >
              <CloseIcon width="20" height="20" />
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 px-4 pb-4">
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="glass card modal"
        overlayClassName="modal-overlay"
        overlayStyle={{ zIndex: 9998 }}
        style={{
          maxWidth: '640px',
          width: '92vw',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {header}
        {body}
      </DialogContent>
    </Dialog>
  );
}

