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
          <div className="p-4">
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
        {templates.slice(0, 5).map((t) => (
          <div key={t.id} className="border rounded p-2 flex items-center gap-2">
            <div className="w-10 h-10 bg-neutral-100 rounded" />
            <div className="flex-1">
              <div className="text-sm">{t.name}</div>
              <div className="text-xs text-neutral-500 line-clamp-1">{t.description}</div>
            </div>
            <ApplyTemplateButton template={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplyTemplateButton({ template }: { template: DesignTemplate }) {
  const { getToken } = useAuth();
  const doc = useDesignStore((s) => s.present);
  const setDocument = useDesignStore((s) => s.setDocument);
  const [loading, setLoading] = useState(false);

  const snapshot = useMemo(() => ({
    name: doc.name,
    width: doc.width,
    height: doc.height,
    background: doc.background,
    elements: doc.elements,
  }), [doc]);

  const apply = async () => {
    setLoading(true);
    try {
      setDocument({ elements: (template.elements as any)?.elements || [] });
      const token = await getToken();
      if (token) {
        await DesignService.createDesign(token, {
          name: `Tasarım - ${template.name}`,
          designData: snapshot,
          templateId: template.id,
        });
      }
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

function PropertiesPanel() {
  const doc = useDesignStore((s) => s.present);
  const selectionIds = useDesignStore((s) => s.selectionIds);
  const setSelection = useDesignStore((s) => s.setSelection);
  const updateElement = useDesignStore((s) => s.updateElement);
  const selected = doc.elements.find((e) => e.id === selectionIds[0]);

  if (!selected) {
    return <div className="text-xs text-neutral-500">Seçili öğe yok</div>;
  }

  return (
    <div className="space-y-2">
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
    </div>
  );
}

function CanvasEditor() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const rect = useDesignStore((s) => s.present.elements.find(e => e.id === 'rect-1')) as any;
  const updateElement = useDesignStore((s) => s.updateElement);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 800;
    const height = 500;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      // grid
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 20) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }
      // rectangle (representing a design element)
      ctx.fillStyle = '#A28D75';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      // selection outline
      ctx.strokeStyle = '#333';
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    };

    draw();
  }, [rect]);

  const withinRect = (x: number, y: number) => {
    if (!rect) return false;
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    if (rect && withinRect(x, y)) {
      setIsDragging(true);
      setOffset({ x: x - rect.x, y: y - rect.y });
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    updateElement('rect-1', { x: Math.round(x - offset.x), y: Math.round(y - offset.y) });
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


