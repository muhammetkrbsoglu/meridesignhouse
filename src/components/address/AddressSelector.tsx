'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Il {
  id: string;
  name: string;
  code: string;
}

interface Ilce {
  id: string;
  name: string;
  code: string;
  ilId: string;
}

interface Mahalle {
  id: string;
  name: string;
  code: string;
  postaKodu: string;
  ilceId: string;
}

interface AddressSelectorProps {
  onAddressChange?: (address: {
    il: string;
    ilce: string;
    mahalle: string;
    postaKodu: string;
  }) => void;
  className?: string;
}

export function AddressSelector({ onAddressChange, className }: AddressSelectorProps) {
  const [iller, setIller] = useState<Il[]>([]);
  const [ilceler, setIlceler] = useState<Ilce[]>([]);
  const [mahalleler, setMahalleler] = useState<Mahalle[]>([]);
  
  const [selectedIl, setSelectedIl] = useState<string>('');
  const [selectedIlce, setSelectedIlce] = useState<string>('');
  const [selectedMahalle, setSelectedMahalle] = useState<string>('');

  const [loading, setLoading] = useState({
    iller: false,
    ilceler: false,
    mahalleler: false
  });

  // İl listesini yükle
  useEffect(() => {
    const fetchIller = async () => {
      setLoading(prev => ({ ...prev, iller: true }));
      try {
        const response = await fetch('/api/address/iller');
        const data = await response.json();
        if (data.success) {
          setIller(data.data);
        }
      } catch (error) {
        console.error('İl listesi yüklenemedi:', error);
      } finally {
        setLoading(prev => ({ ...prev, iller: false }));
      }
    };

    fetchIller();
  }, []);

  // İl değiştiğinde ilçeleri yükle
  useEffect(() => {
    if (!selectedIl) {
      setIlceler([]);
      setMahalleler([]);
      setSelectedIlce('');
      setSelectedMahalle('');
      return;
    }

    const fetchIlceler = async () => {
      setLoading(prev => ({ ...prev, ilceler: true }));
      try {
        const response = await fetch(`/api/address/ilceler?ilId=${selectedIl}`);
        const data = await response.json();
        if (data.success) {
          setIlceler(data.data);
        }
      } catch (error) {
        console.error('İlçe listesi yüklenemedi:', error);
      } finally {
        setLoading(prev => ({ ...prev, ilceler: false }));
      }
    };

    fetchIlceler();
    setMahalleler([]);
    setSelectedIlce('');
    setSelectedMahalle('');
  }, [selectedIl]);

  // İlçe değiştiğinde mahalleleri yükle
  useEffect(() => {
    if (!selectedIlce) {
      setMahalleler([]);
      setSelectedMahalle('');
      return;
    }

    const fetchMahalleler = async () => {
      setLoading(prev => ({ ...prev, mahalleler: true }));
      try {
        const response = await fetch(`/api/address/mahalleler?ilceId=${selectedIlce}`);
        const data = await response.json();
        if (data.success) {
          setMahalleler(data.data);
        }
      } catch (error) {
        console.error('Mahalle listesi yüklenemedi:', error);
      } finally {
        setLoading(prev => ({ ...prev, mahalleler: false }));
      }
    };

    fetchMahalleler();
    setSelectedMahalle('');
  }, [selectedIlce]);

  // Mahalle değiştiğinde callback'i çağır
  useEffect(() => {
    if (selectedMahalle && onAddressChange) {
      const mahalle = mahalleler.find(m => m.id === selectedMahalle);
      const ilce = ilceler.find(i => i.id === selectedIlce);
      const il = iller.find(i => i.id === selectedIl);

      if (mahalle && ilce && il) {
        onAddressChange({
          il: il.name,
          ilce: ilce.name,
          mahalle: mahalle.name,
          postaKodu: mahalle.postaKodu
        });
      }
    }
  }, [selectedMahalle, mahalleler, ilceler, iller, onAddressChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* İl Seçimi */}
      <div>
        <label className="block text-sm font-medium mb-2">İl</label>
        <Select value={selectedIl} onValueChange={setSelectedIl} disabled={loading.iller}>
          <SelectTrigger>
            <SelectValue placeholder={loading.iller ? "Yükleniyor..." : "İl seçin"} />
          </SelectTrigger>
          <SelectContent>
            {iller.map((il) => (
              <SelectItem key={il.id} value={il.id}>
                {il.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* İlçe Seçimi */}
      <div>
        <label className="block text-sm font-medium mb-2">İlçe</label>
        <Select 
          value={selectedIlce} 
          onValueChange={setSelectedIlce} 
          disabled={!selectedIl || loading.ilceler}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !selectedIl ? "Önce il seçin" : 
              loading.ilceler ? "Yükleniyor..." : 
              "İlçe seçin"
            } />
          </SelectTrigger>
          <SelectContent>
            {ilceler.map((ilce) => (
              <SelectItem key={ilce.id} value={ilce.id}>
                {ilce.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mahalle Seçimi */}
      <div>
        <label className="block text-sm font-medium mb-2">Mahalle</label>
        <Select 
          value={selectedMahalle} 
          onValueChange={setSelectedMahalle} 
          disabled={!selectedIlce || loading.mahalleler}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !selectedIlce ? "Önce ilçe seçin" : 
              loading.mahalleler ? "Yükleniyor..." : 
              "Mahalle seçin"
            } />
          </SelectTrigger>
          <SelectContent>
            {mahalleler.map((mahalle) => (
              <SelectItem key={mahalle.id} value={mahalle.id}>
                {mahalle.name} ({mahalle.postaKodu})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

