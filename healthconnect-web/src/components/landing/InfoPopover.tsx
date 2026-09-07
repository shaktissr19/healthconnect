'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

type InfoPopoverProps={
  title:string;
  children:ReactNode;
  ariaLabel:string;
  width?:number;
};

export default function InfoPopover({title,children,ariaLabel,width=210}:InfoPopoverProps){
  const [open,setOpen]=useState(false);
  const wrapRef=useRef<HTMLSpanElement>(null);
  const buttonRef=useRef<HTMLButtonElement>(null);
  const popoverId=useId();

  useEffect(()=>{
    if(!open)return;
    const onPointerDown=(event:PointerEvent)=>{
      if(!wrapRef.current?.contains(event.target as Node))setOpen(false);
    };
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown',onPointerDown);
    document.addEventListener('keydown',onKeyDown);
    return()=>{
      document.removeEventListener('pointerdown',onPointerDown);
      document.removeEventListener('keydown',onKeyDown);
    };
  },[open]);

  return <span className="hc-info-popover-wrap" ref={wrapRef}>
    <style>{`
      .hc-info-popover-wrap{position:relative;display:inline-flex;z-index:40}
      .hc-info-popover-trigger{width:26px;height:26px;border-radius:50%;border:1.5px solid #466378;background:#fff;color:#23475E;display:grid;place-items:center;padding:0;cursor:pointer;font:900 12px 'DM Sans',Arial,sans-serif;transition:background .16s,color .16s,border-color .16s,transform .16s}
      .hc-info-popover-trigger:hover,.hc-info-popover-trigger:focus-visible,.hc-info-popover-trigger[aria-expanded='true']{background:#0B948B;color:#fff;border-color:#0B948B;outline:none;transform:translateY(-1px)}
      .hc-info-popover-panel{position:absolute;right:0;top:34px;padding:11px 12px;border-radius:12px;background:#0B2B45;color:#fff;box-shadow:0 16px 36px rgba(11,43,69,.24);font:500 11.2px/1.45 'DM Sans',Arial,sans-serif;z-index:60}
      .hc-info-popover-panel:before{content:'';position:absolute;right:9px;top:-5px;width:10px;height:10px;background:#0B2B45;transform:rotate(45deg)}
      .hc-info-popover-title{display:block;color:#D9FFFA;font-size:11.8px;font-weight:900;margin-bottom:4px}
      @media(max-width:560px){.hc-info-popover-panel{right:-4px;max-width:min(220px,72vw)}}
    `}</style>
    <button ref={buttonRef} type="button" className="hc-info-popover-trigger" aria-label={ariaLabel} aria-expanded={open} aria-controls={popoverId} onClick={()=>setOpen(value=>!value)}>i</button>
    {open&&<span id={popoverId} role="tooltip" className="hc-info-popover-panel" style={{width}}><span className="hc-info-popover-title">{title}</span>{children}</span>}
  </span>;
}
