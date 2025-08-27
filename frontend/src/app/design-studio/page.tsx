'use client';

import React from 'react';
import { useDesignStore } from '../../stores/design.store';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { DesignService, type DesignTemplate } from '../../services/design.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import type { Product } from '@shared/types/product';

export default function DesignStudioPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Tasarım Atölyesi (MVP)</h1>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/">Ana sayfa</Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-600">design-studio</span>
        </nav>
      </header>

      <main className="flex-1 grid grid-cols-[260px_1fr_320px] gap-0">
        <aside className="border-r p-3 space-y-3">
          <div className="text-sm font-medium">Öğeler</div>
          <div className="flex gap-2">
            <AddRectButton />
            <AddTextButton />
          </div>
          <div className="text-xs text-neutral-500">Metin, şekil ve görseller yakında</div>
          <TemplateGallery />
        </aside>
        <section className="relative">
          <div className="border-b p-2 flex items-center gap-2">
            <UndoRedo />
            <div className="flex-1" />
            <button className="px-2 py-1 border rounded text-sm">Önizleme</button>
            <AutosaveIndicator />
            <AddToCartButton />
          </div>
          <div className="p-4 flex items-center justify-center">
            <CanvasEditor />
          </div>
        </section>
        <aside className="border-l p-3 space-y-3">
          <div className="text-sm font-medium">Özellikler</div>
          <PropertiesPanel />
        </aside>
      </main>
    </div>
  );
}
function AddToCartButton() {
  const { getToken } = useAuth();
  const doc = useDesignStore((s) => s.present);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    ProductService.getProducts({ limit: 10 }).then((res: any) => {
      const list: Product[] = res?.products || res || [];
      if (mounted) {
        setProducts(list);
        if (list.length > 0) setSelectedId(list[0].id);
      }
    }).catch(() => {}).finally(() => {});
    return () => { mounted = false; };
  }, []);
  const addToCart = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      if (!selectedId) return;
      await CartService.addToCart(token, {
        productId: selectedId,
        quantity: 1,
        designData: {
          name: doc.name,
          width: doc.width,
          height: doc.height,
          background: doc.background,
          elements: doc.elements,
        },
      });
      // TODO: toast success
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-2 py-1 text-sm"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <button className="px-2 py-1 border rounded text-sm" onClick={addToCart} disabled={loading || !selectedId}>
        {loading ? 'Sepete ekleniyor…' : 'Sepete Ekle'}
      </button>
    </div>
  );
}

function TemplateGallery() {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    DesignService.getTemplates().then((data) => {
      if (mounted) setTemplates(data);
    }).finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Şablonlar</div>
      {loading && <div className="text-xs text-neutral-500">Yükleniyor…</div>}
      {!loading && templates.length === 0 && (
        <div className="text-xs text-neutral-400">Şablon bulunamadı</div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {templates.slice(0, 12).map((t) => (
          <div key={t.id} className="border rounded p-2 flex items-center gap-2">
            <div className="w-10 h-10 bg-neutral-100 rounded" />
            <div className="flex-1">
              <div className="text-sm">{t.name}</div>
              <div className="text-xs text-neutral-500 line-clamp-1">{t.description}</div>
            </div>
            <ApplyTemplateButton template={t} />
          </div>
        ))}
        <QuickTemplateSN001 />
      </div>
    </div>
  );
}

function ApplyTemplateButton({ template }: { template: DesignTemplate }) {
  const setDocument = useDesignStore((s) => s.setDocument);
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    setLoading(true);
    try {
      // Only apply to editor; do not save to server automatically
      setDocument({ elements: (template.elements as any)?.elements || [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="px-2 py-1 border rounded text-xs" onClick={apply} disabled={loading}>
      {loading ? 'Uygulanıyor…' : 'Uygula'}
    </button>
  );
}

function QuickTemplateSN001() {
  // Quick template: 10x15 cm, background from static asset, two text fields
  const setDocument = useDesignStore((s) => s.setDocument);
  const apply = () => {
    // Canvas target size ~ 378x567 px (100x150mm @ ~96dpi)
    setDocument({
      name: 'SN001 – 10×15',
      width: 378,
      height: 567,
      background: '#ffffff',
      elements: [
        // Background image placeholder (positioned at 0,0)
        { id: 'bg-sn001', type: 'image', x: 0, y: 0, width: 378, height: 567 },
        // Names text (center)
        { id: 'names', type: 'text', x: 200, y: 300, width: 220, height: 60, content: 'Elif & Mert', fontFamily: 'Playfair Display', fontSize: 28, color: '#111', textAlign: 'center' },
        // Date text (bottom)
        { id: 'date', type: 'text', x: 220, y: 500, width: 180, height: 30, content: '16/12/2023', fontFamily: 'Montserrat', fontSize: 18, color: '#111', textAlign: 'center' },
      ],
    });
  };
  return (
    <button className="px-2 py-1 border rounded text-xs" onClick={apply}>SN001 – 10×15 (Hızlı)</button>
  );
}


function AutosaveIndicator() {
  const isSaving = useDesignStore((s) => s.isSaving);
  const lastSavedAt = useDesignStore((s) => s.lastSavedAt);
  return (
    <div className="text-xs text-neutral-500">
      {isSaving ? 'Kaydediliyor…' : lastSavedAt ? `Kaydedildi` : 'Henüz kaydedilmedi'}
    </div>
  );
}

function UndoRedo() {
  const undo = useDesignStore((s) => s.undo);
  const redo = useDesignStore((s) => s.redo);
  return (
    <>
      <button className="px-2 py-1 border rounded text-sm" onClick={undo}>Geri Al</button>
      <button className="px-2 py-1 border rounded text-sm" onClick={redo}>İleri Al</button>
    </>
  );
}

function AddRectButton() {
  const addElement = useDesignStore((s) => s.addElement);
  return (
    <button
      className="px-2 py-1 border rounded text-sm"
      onClick={() => {
        const id = `rect-${Math.random().toString(36).slice(2, 7)}`;
        addElement({ id, type: 'rect', x: 40, y: 40, width: 140, height: 90 });
      }}
    >
      Dikdörtgen
    </button>
  );
}

function AddTextButton() {
  const addElement = useDesignStore((s) => s.addElement);
  return (
    <button
      className="px-2 py-1 border rounded text-sm"
      onClick={() => {
        const id = `text-${Math.random().toString(36).slice(2, 7)}`;
        addElement({ id, type: 'text', x: 60, y: 60, width: 200, height: 40, content: 'Yeni Metin', fontFamily: 'Montserrat', fontSize: 18, color: '#111', textAlign: 'left' });
      }}
    >
      Metin
    </button>
  );
}

function PropertiesPanel() {
  const doc = useDesignStore((s) => s.present);
  const selectionIds = useDesignStore((s) => s.selectionIds);
  const setSelection = useDesignStore((s) => s.setSelection);
  const updateElement = useDesignStore((s) => s.updateElement);
  const selected = doc.elements.find((e) => e.id === selectionIds[0]);

  // Hooks must be declared unconditionally
  const [localFontSize, setLocalFontSize] = useState<string>('');
  useEffect(() => {
    if (selected && (selected as any).type === 'text') {
      setLocalFontSize(String((selected as any).fontSize || 18));
    } else {
      setLocalFontSize('');
    }
  }, [selected]);

  if (!selected) {
    return <div className="text-xs text-neutral-500">Seçili öğe yok</div>;
  }

  const isText = (selected as any).type === 'text';
  const isImage = (selected as any).type === 'image';

  return (
    <div className="space-y-3">
      <div className="text-xs text-neutral-500">Seçili: {selected.id}</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">X</span>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={selected.x}
            onChange={(e) => updateElement(selected.id, { x: Number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Y</span>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={selected.y}
            onChange={(e) => updateElement(selected.id, { y: Number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Genişlik</span>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={(selected as any).width}
            onChange={(e) => updateElement(selected.id, { width: Number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Yükseklik</span>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={(selected as any).height}
            onChange={(e) => updateElement(selected.id, { height: Number(e.target.value) })}
          />
        </label>
      </div>

      {isText && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Metin</div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-neutral-500">İçerik</span>
            <input
              type="text"
              className="border rounded px-2 py-1"
              value={(selected as any).content || ''}
              onChange={(e) => updateElement(selected.id, { content: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-neutral-500">Font</span>
              <select
                className="border rounded px-2 py-1"
                value={(selected as any).fontFamily || 'Playfair Display'}
                onChange={(e) => updateElement(selected.id, { fontFamily: e.target.value })}
              >
                <option>Playfair Display</option>
                <option>Montserrat</option>
                <option>Courier New</option>
                <option>Arial</option>
                <option>Georgia</option>
                <option>Times New Roman</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-neutral-500">Boyut</span>
              <input
                type="number"
                className="border rounded px-2 py-1"
                value={localFontSize}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocalFontSize(v);
                  if (v === '') return;
                  const n = Number(v);
                  if (!Number.isNaN(n)) updateElement(selected.id, { fontSize: n });
                }}
                onBlur={() => {
                  const n = Number(localFontSize || '0');
                  const safe = n > 0 ? n : 1;
                  setLocalFontSize(String(safe));
                  updateElement(selected.id, { fontSize: safe });
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-neutral-500">Renk</span>
              <input
                type="color"
                className="border rounded px-2 py-1 h-9"
                value={(selected as any).color || '#111111'}
                onChange={(e) => updateElement(selected.id, { color: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-neutral-500">Hizalama</span>
              <select
                className="border rounded px-2 py-1"
                value={(selected as any).textAlign || 'left'}
                onChange={(e) => updateElement(selected.id, { textAlign: e.target.value as any })}
              >
                <option value="left">Sol</option>
                <option value="center">Orta</option>
                <option value="right">Sağ</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {isImage && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Görsel</div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-neutral-500">Kategori</span>
            <select className="border rounded px-2 py-1">
              <option>Doğum Günü</option>
              <option>Düğün</option>
              <option>Hoşgeldiniz</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-neutral-500">Öğe (örnek)</span>
            <select
              className="border rounded px-2 py-1"
              onChange={(e) => updateElement(selected.id, { src: e.target.value })}
            >
              <option value="">— Seç —</option>
              <option value="/assets/mock/cat.png">Kedi</option>
              <option value="/assets/mock/bear.png">Ayıcık</option>
              <option value="/assets/mock/flower.png">Çiçek</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

function CanvasEditor() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const doc = useDesignStore((s) => s.present);
  const selectionIds = useDesignStore((s) => s.selectionIds);
  const setSelection = useDesignStore((s) => s.setSelection);
  const updateElement = useDesignStore((s) => s.updateElement);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Fixed card size (10x15 ratio) in pixels, centered by wrapper
    const width = 378; // ~10cm
    const height = 567; // ~15cm
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // white card background only
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      // render all elements from document
      for (const el of doc.elements as any[]) {
        if (el.type === 'image') {
          // draw image if src available, else placeholder
          const imgEl = el as any;
          if (imgEl.src) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, imgEl.x, imgEl.y, imgEl.width, imgEl.height);
            };
            img.src = imgEl.src;
          } else {
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(el.x, el.y, el.width, el.height);
            ctx.strokeStyle = '#d1d5db';
            ctx.strokeRect(el.x, el.y, el.width, el.height);
          }
        } else if (el.type === 'rect' || el.type === 'shape') {
          ctx.fillStyle = '#A28D75';
          ctx.fillRect(el.x, el.y, el.width, el.height);
          ctx.strokeStyle = '#333';
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        } else if (el.type === 'text') {
          ctx.fillStyle = el.color || '#111';
          const size = el.fontSize || 18;
          const family = el.fontFamily || 'serif';
          ctx.font = `${size}px ${family}`;
          ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left';
          const tx = el.textAlign === 'center' ? el.x + el.width / 2 : el.x;
          ctx.fillText(el.content || '', tx, el.y + size);
        }
        // selection outline
        if (selectionIds[0] === el.id) {
          ctx.strokeStyle = '#111';
          ctx.strokeRect(el.x, el.y, el.width, el.height);
        }
      }
    };

    draw();
  }, [doc, selectionIds]);

  const hitTest = (x: number, y: number) => {
    for (let i = doc.elements.length - 1; i >= 0; i--) {
      const el: any = doc.elements[i];
      if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
        return el as any;
      }
    }
    return undefined;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const target = hitTest(x, y);
    if (target) {
      setSelection([target.id]);
      setIsDragging(true);
      setOffset({ x: x - target.x, y: y - target.y });
    } else {
      setSelection([]);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    const id = selectionIds[0];
    if (id) {
      updateElement(id, { x: Math.round(x - offset.x), y: Math.round(y - offset.y) });
    }
  };

  const onPointerUp = () => setIsDragging(false);

  return (
    <div className="w-full flex items-center justify-center">
      <div className="shadow border bg-neutral-50">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>
    </div>
  );
}


