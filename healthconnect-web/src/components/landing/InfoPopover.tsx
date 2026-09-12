'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type InfoPopoverProps={
  title:string;
  children:ReactNode;
  ariaLabel:string;
  width?:number;
};

type PanelPosition={top:number;left:number;width:number};

export default function InfoPopover({title,children,ariaLabel,width=210}:InfoPopoverProps){
  const [open,setOpen]=useState(false);
  const [mounted,setMounted]=useState(false);
  const [position,setPosition]=useState<PanelPosition>({top:0,left:0,width});
  const wrapRef=useRef<HTMLSpanElement>(null);
  const buttonRef=useRef<HTMLButtonElement>(null);
  const panelRef=useRef<HTMLDivElement>(null);
  const popoverId=useId();

  useEffect(()=>setMounted(true),[]);

  useEffect(()=>{
    if(!open)return;

    const place=()=>{
      const button=buttonRef.current;
      if(!button)return;
      const rect=button.getBoundingClientRect();
      const safeWidth=Math.min(width,Math.max(180,window.innerWidth-24));
      const left=Math.min(Math.max(12,rect.right-safeWidth),Math.max(12,window.innerWidth-safeWidth-12));
      const panelHeight=panelRef.current?.offsetHeight??132;
      const below=rect.bottom+8;
      const above=rect.top-panelHeight-8;
      const top=below+panelHeight<=window.innerHeight-10?below:Math.max(10,above);
      setPosition({top,left,width:safeWidth});
    };

    place();
    const raf=window.requestAnimationFrame(place);
    const onPointerDown=(event:PointerEvent)=>{
      const target=event.target as Node;
      if(!wrapRef.current?.contains(target)&&!panelRef.current?.contains(target))setOpen(false);
    };
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onViewportChange=()=>place();

    document.addEventListener('pointerdown',onPointerDown);
    document.addEventListener('keydown',onKeyDown);
    window.addEventListener('resize',onViewportChange);
    window.addEventListener('scroll',onViewportChange,true);
    return()=>{
      window.cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown',onPointerDown);
      document.removeEventListener('keydown',onKeyDown);
      window.removeEventListener('resize',onViewportChange);
      window.removeEventListener('scroll',onViewportChange,true);
    };
  },[open,width]);

  const panelStyle={top:position.top,left:position.left,width:position.width} as CSSProperties;

  return <span className="hc-info-popover-wrap" ref={wrapRef}>
    <style>{`
      .hc-info-popover-wrap{position:relative;display:inline-flex;vertical-align:middle}
      .hc-info-popover-trigger{width:24px;height:24px;border-radius:50%;border:1.5px solid #466378;background:#fff;color:#23475E;display:grid;place-items:center;padding:0;cursor:pointer;font:900 11px 'DM Sans',Arial,sans-serif;transition:background .16s,color .16s,border-color .16s,transform .16s}
      .hc-info-popover-trigger:hover,.hc-info-popover-trigger:focus-visible,.hc-info-popover-trigger[aria-expanded='true']{background:#0B948B;color:#fff;border-color:#0B948B;outline:none;transform:translateY(-1px)}
      .hc-info-popover-portal{position:fixed;padding:11px 12px;border-radius:12px;background:#0B2B45;color:#fff;box-shadow:0 18px 44px rgba(11,43,69,.28);font:500 11.2px/1.45 'DM Sans',Arial,sans-serif;z-index:5000}
      .hc-info-popover-title{display:block;color:#D9FFFA;font-size:11.8px;font-weight:900;margin-bottom:4px}
    `}</style>
    <button ref={buttonRef} type="button" className="hc-info-popover-trigger" aria-label={ariaLabel} aria-expanded={open} aria-controls={popoverId} onClick={()=>setOpen(value=>!value)}>i</button>
    {mounted&&open&&createPortal(<div ref={panelRef} id={popoverId} role="tooltip" className="hc-info-popover-portal" style={panelStyle}><span className="hc-info-popover-title">{title}</span>{children}</div>,document.body)}
  </span>;
}
