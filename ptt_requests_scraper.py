"""
PTT Requests Scraper - Statik HTML ile scraping
Browser kullanmadan, sadece HTTP istekleri ile
"""
import json
import logging
import random
import time
import os
import requests
from datetime import datetime
from typing import List, Dict, Optional

from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import base64

class PTTRequestsScraper:
    """PTT Requests Scraper - Statik HTML ile scraping"""
    
    def __init__(self):
        self.ua = UserAgent()
        self.session = requests.Session()
        self.scraped_data = []
        self.setup_logging()
        self.setup_session()
        
    def setup_logging(self):
        """Logging sistemini kur"""
        os.makedirs('logs', exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'logs/ptt_requests_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def setup_session(self):
        """HTTP session'ı kur"""
        self.session.headers.update({
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
        self.logger.info("HTTP session kuruldu")
    
    def extract_form_fields(self, html: str) -> Dict[str, str]:
        """Formdaki input/select name/value çiftlerini çıkarır (ASP.NET uyumlu)."""
        fields: Dict[str, str] = {}
        try:
            soup = BeautifulSoup(html, 'html5lib')
            form = soup.find('form')
            if not form:
                return fields
            for inp in form.find_all('input'):
                name = inp.get('name')
                if not name:
                    continue
                fields[name] = inp.get('value', '')
            for sel in form.find_all('select'):
                name = sel.get('name')
                if name and name not in fields:
                    selected = sel.find('option', selected=True)
                    fields[name] = selected.get('value', '') if selected else ''
        except Exception:
            pass
        return fields

    def set_tab_state(self, fields: Dict[str, str], active_index: int = 1) -> None:
        """Tab durumunu ayarla: 0=Sokak/Cadde, 1=Posta Kodu, 2=Kurum."""
        key = None
        if 'MainContent_tabbb_ClientState' in fields:
            key = 'MainContent_tabbb_ClientState'
        elif 'ctl00$MainContent$tabbb$ClientState' in fields:
            key = 'ctl00$MainContent$tabbb$ClientState'
        if key:
            fields[key] = '{"ActiveTabIndex":' + str(active_index) + ',"TabEnabledState":[true,true,true],"TabWasLoadedOnceState":[true,true,true]}'

    def post_form(self, url: str, data: Dict[str, str], ajax: bool = False) -> Optional[str]:
        """Form POST isteği gönderir. ajax=False ise full postback beklenir."""
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://postakodu.ptt.gov.tr/',
            'Origin': 'https://postakodu.ptt.gov.tr'
        }
        if ajax:
            headers.update({
                'X-MicrosoftAjax': 'Delta=true',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*'
            })
        try:
            resp = self.session.post(url, data=data, headers=headers, timeout=30)
            resp.raise_for_status()
            return resp.text
        except requests.exceptions.SSLError as e:
            # Bazı makinelerde PTT cert zinciri problemi olabiliyor; verify=False ile tekrar dene
            self.logger.warning(f"SSL doğrulama hatası, verify=False ile tekrar deneniyor: {e}")
            try:
                resp = self.session.post(url, data=data, headers=headers, timeout=30, verify=False)
                resp.raise_for_status()
                return resp.text
            except Exception as e2:
                self.logger.error(f"POST hatası (verify=False): {e2}")
                return None
        except Exception as e:
            self.logger.error(f"POST hatası: {e}")
            return None

    def fetch_captcha_image(self) -> Optional[bytes]:
        """CAPTCHA resmini mevcut session ile indirir."""
        try:
            url = 'https://postakodu.ptt.gov.tr/GuvenlikResim.aspx'
            headers = {
                'Referer': 'https://postakodu.ptt.gov.tr/default.aspx',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
            }
            resp = self.session.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
            img = resp.content
            os.makedirs('logs', exist_ok=True)
            path = os.path.join('logs', f'captcha_{int(time.time())}.png')
            with open(path, 'wb') as f:
                f.write(img)
            self.logger.info(f"CAPTCHA resmi kaydedildi: {path}")
            return img
        except Exception as e:
            self.logger.error(f"CAPTCHA indirme hatası: {e}")
            return None

    def solve_captcha_2captcha(self, image_bytes: bytes, api_key: Optional[str] = None, timeout_sec: int = 120) -> Optional[str]:
        """2Captcha ile görsel CAPTCHA çözümü."""
        try:
            key = api_key or os.environ.get('TWOCAPTCHA_API_KEY') or os.environ.get('ANTICAPTCHA_API_KEY')
            if not key:
                self.logger.error('2Captcha API anahtarı bulunamadı (TWOCAPTCHA_API_KEY).')
                return None
            b64 = base64.b64encode(image_bytes).decode('ascii')
            in_url = 'http://2captcha.com/in.php'
            payload = {
                'key': key,
                'method': 'base64',
                'body': b64,
                'json': 1
            }
            r = requests.post(in_url, data=payload, timeout=30)
            r.raise_for_status()
            resp = r.json()
            if resp.get('status') != 1:
                self.logger.error(f"2Captcha in.php hata: {resp}")
                return None
            cap_id = resp.get('request')
            res_url = 'http://2captcha.com/res.php'
            start = time.time()
            while time.time() - start < timeout_sec:
                time.sleep(5)
                rr = requests.get(res_url, params={'key': key, 'action': 'get', 'id': cap_id, 'json': 1}, timeout=30)
                rr.raise_for_status()
                data = rr.json()
                if data.get('status') == 1:
                    code = data.get('request')
                    self.logger.info('CAPTCHA çözüldü')
                    return code
                if data.get('request') == 'CAPCHA_NOT_READY':
                    continue
                self.logger.error(f"2Captcha res.php hata: {data}")
                return None
            self.logger.error('2Captcha zaman aşımı')
            return None
        except Exception as e:
            self.logger.error(f"2Captcha entegrasyon hatası: {e}")
            return None

    def safe_delay(self, min_seconds=2, max_seconds=5):
        """Güvenli gecikme"""
        delay = random.uniform(min_seconds, max_seconds)
        time.sleep(delay)
    
    def get_page(self, url, max_retries=3):
        """Sayfayı güvenli şekilde çek"""
        for attempt in range(max_retries):
            try:
                self.logger.info(f"Sayfa çekiliyor: {url} (Deneme {attempt + 1}/{max_retries})")
                
                # User agent'ı değiştir
                self.session.headers['User-Agent'] = self.ua.random
                
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                self.logger.info(f"Sayfa başarıyla çekildi: {response.status_code}")
                return response.text
                
            except Exception as e:
                self.logger.error(f"Sayfa çekme hatası (Deneme {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    self.safe_delay(5, 10)
                else:
                    return None
    
    def get_il_list_from_html(self, html):
        """HTML'den il listesini çıkar"""
        try:
            soup = BeautifulSoup(html, 'html5lib')
            
            # İl dropdown'ını bul
            il_dropdown = soup.find('select', {'id': 'MainContent_DropDownList1'})
            if not il_dropdown:
                self.logger.error("İl dropdown bulunamadı")
                return []
            
            il_list = []
            options = il_dropdown.find_all('option')
            
            for option in options[1:]:  # İlk option "Seçiniz"
                il_name = option.get_text(strip=True)
                il_value = option.get('value', '')
                
                if il_name and il_value and il_name != 'Seçiniz':
                    il_list.append({
                        "name": il_name,
                        "value": il_value
                    })
            
            self.logger.info(f"{len(il_list)} il bulundu")
            return il_list
            
        except Exception as e:
            self.logger.error(f"İl listesi çıkarma hatası: {e}")
            return []

    def _parse_dropdown(self, html: str, select_id: str) -> List[Dict[str, str]]:
        results: List[Dict[str, str]] = []
        soup = BeautifulSoup(html, 'html5lib')
        sel = soup.find('select', {'id': select_id})
        if not sel:
            return results
        for opt in sel.find_all('option')[1:]:
            name = opt.get_text(strip=True)
            value = opt.get('value', '')
            if name and value and name != 'Seçiniz':
                results.append({'name': name, 'value': value})
        return results

    def _parse_dropdown_multi_try(self, html: str, select_ids: List[str]) -> List[Dict[str, str]]:
        for sid in select_ids:
            items = self._parse_dropdown(html, sid)
            if items:
                return items
        return []

    def get_ilce_list(self, html: str, il_value: str) -> List[Dict[str, str]]:
        """İl seçilip full postback ile ilçe dropdown'ını döndür."""
        fields = self.extract_form_fields(html)
        # UniqueID tahmini
        def key_by_suffix(suffix: str) -> Optional[str]:
            for k in fields.keys():
                if k.endswith(suffix):
                    return k
            return None
        dl1 = key_by_suffix('$DropDownList1') or 'ctl00$MainContent$DropDownList1'
        dl2 = key_by_suffix('$DropDownList2') or 'ctl00$MainContent$DropDownList2'
        dl3 = key_by_suffix('$DropDownList3') or 'ctl00$MainContent$DropDownList3'

        fields['__EVENTTARGET'] = dl1
        fields['__EVENTARGUMENT'] = ''
        fields[dl1] = il_value
        if dl2 in fields:
            fields[dl2] = ''
        if dl3 in fields:
            fields[dl3] = ''
        self.set_tab_state(fields, active_index=1)

        html2 = self.post_form('https://postakodu.ptt.gov.tr/default.aspx', fields, ajax=False)
        if not html2:
            return []
        # Sonraki adımlar aynı HTML üzerinde çalışacak
        self._last_html = html2
        return self._parse_dropdown(html2, 'MainContent_DropDownList2')

    def get_mahalle_list(self, html: str, il_value: str, ilce_value: str) -> List[Dict[str, str]]:
        fields = self.extract_form_fields(self._last_html if hasattr(self, '_last_html') else html)
        def key_by_suffix(suffix: str) -> Optional[str]:
            for k in fields.keys():
                if k.endswith(suffix):
                    return k
            return None
        dl1 = key_by_suffix('$DropDownList1') or 'ctl00$MainContent$DropDownList1'
        dl2 = key_by_suffix('$DropDownList2') or 'ctl00$MainContent$DropDownList2'
        dl3 = key_by_suffix('$DropDownList3') or 'ctl00$MainContent$DropDownList3'

        fields['__EVENTTARGET'] = dl2
        fields['__EVENTARGUMENT'] = ''
        fields[dl1] = il_value
        fields[dl2] = ilce_value
        if dl3 in fields:
            fields[dl3] = ''
        self.set_tab_state(fields, active_index=1)

        html2 = self.post_form('https://postakodu.ptt.gov.tr/default.aspx', fields, ajax=False)
        if not html2:
            return []
        self._last_html = html2
        try:
            os.makedirs('logs', exist_ok=True)
            with open('logs/ptt_last_mahalle.html', 'w', encoding='utf-8') as f:
                f.write(html2)
        except Exception:
            pass
        return self._parse_dropdown(html2, 'MainContent_DropDownList3')

    def get_street_list(self, html: str, il_value: str, ilce_value: str, mahalle_value: str) -> List[Dict[str, str]]:
        # mahalle seçimi sonrası sokak/cadde dropdown (id tahminleri: MainContent_DropDownList4, DropDownList4)
        fields = self.extract_form_fields(self._last_html if hasattr(self, '_last_html') else html)
        def key_by_suffix(suffix: str) -> Optional[str]:
            for k in fields.keys():
                if k.endswith(suffix):
                    return k
            return None
        dl1 = key_by_suffix('$DropDownList1') or 'ctl00$MainContent$DropDownList1'
        dl2 = key_by_suffix('$DropDownList2') or 'ctl00$MainContent$DropDownList2'
        dl3 = key_by_suffix('$DropDownList3') or 'ctl00$MainContent$DropDownList3'
        # Bazı akışlarda sokak listesi mahalle seçimi POST’undan sonra direkt gelir; önce mevcut HTML’de ara
        current_html = self._last_html if hasattr(self, '_last_html') else html
        streets = self._parse_dropdown_multi_try(current_html, ['MainContent_DropDownList4', 'DropDownList4'])
        if streets:
            return streets
        # değilse mahalleyi tekrar seçip güncel HTML al
        fields['__EVENTTARGET'] = dl3
        fields['__EVENTARGUMENT'] = ''
        fields[dl1] = il_value
        fields[dl2] = ilce_value
        fields[dl3] = mahalle_value
        # Sokak sorgusu yapacağız; sekmeyi 0'a alın
        self.set_tab_state(fields, active_index=0)
        html2 = self.post_form('https://postakodu.ptt.gov.tr/default.aspx', fields, ajax=False)
        if not html2:
            return []
        self._last_html = html2
        try:
            os.makedirs('logs', exist_ok=True)
            with open('logs/ptt_last_street.html', 'w', encoding='utf-8') as f:
                f.write(html2)
        except Exception:
            pass
        return self._parse_dropdown_multi_try(html2, ['MainContent_DropDownList4', 'DropDownList4'])

    def get_addresses(self, html: str, il_value: str, ilce_value: str, mahalle_value: str, street_value: Optional[str] = None) -> List[Dict[str, str]]:
        def attempt_query(use_street_text: bool, street_text: Optional[str]) -> List[Dict[str, str]]:
            fields = self.extract_form_fields(self._last_html if hasattr(self, '_last_html') else html)
            def key_by_suffix(suffix: str) -> Optional[str]:
                for k in fields.keys():
                    if k.endswith(suffix):
                        return k
                return None
            dl1 = key_by_suffix('$DropDownList1') or 'ctl00$MainContent$DropDownList1'
            dl2 = key_by_suffix('$DropDownList2') or 'ctl00$MainContent$DropDownList2'
            dl3 = key_by_suffix('$DropDownList3') or 'ctl00$MainContent$DropDownList3'
            dl4 = key_by_suffix('$DropDownList4') or 'ctl00$MainContent$DropDownList4'
            btn = key_by_suffix('$Button1') or 'ctl00$MainContent$Button1'
            captcha_field = key_by_suffix('$yazilankod') or 'ctl00$MainContent$yazilankod'
            btn_refresh = key_by_suffix('$Button3') or 'ctl00$MainContent$Button3'

            fields['__EVENTTARGET'] = btn
            fields['__EVENTARGUMENT'] = ''
            fields[dl1] = il_value
            fields[dl2] = ilce_value
            fields[dl3] = mahalle_value
            if street_value is not None and dl4:
                fields[dl4] = street_value

            if use_street_text:
                street_text_key = 'ctl00$MainContent$tabbb$sokakTab$TextBox1'
                fields[street_text_key] = street_text or 'cad'
                self.set_tab_state(fields, active_index=0)
            else:
                self.set_tab_state(fields, active_index=1)

            # 0) (Opsiyonel) Resmi Yenile → bazı akışlarda zorunlu
            try:
                refresh_fields = fields.copy()
                refresh_fields['__EVENTTARGET'] = btn_refresh
                refresh_fields['__EVENTARGUMENT'] = ''
                self.set_tab_state(refresh_fields, active_index=(0 if use_street_text else 1))
                html_refresh = self.post_form('https://postakodu.ptt.gov.tr/default.aspx', refresh_fields, ajax=False)
                if html_refresh:
                    self._last_html = html_refresh
                    fields = self.extract_form_fields(html_refresh)
                    # Unique alanları yeniden ata
                    dl1 = key_by_suffix('$DropDownList1') or dl1
                    dl2 = key_by_suffix('$DropDownList2') or dl2
                    dl3 = key_by_suffix('$DropDownList3') or dl3
                    dl4 = key_by_suffix('$DropDownList4') or dl4
                    btn = key_by_suffix('$Button1') or btn
                    captcha_field = key_by_suffix('$yazilankod') or captcha_field
                    # seçimleri tekrar yaz
                    fields[dl1] = il_value
                    fields[dl2] = ilce_value
                    fields[dl3] = mahalle_value
                    if street_value is not None and dl4:
                        fields[dl4] = street_value
                    if use_street_text:
                        street_text_key = 'ctl00$MainContent$tabbb$sokakTab$TextBox1'
                        fields[street_text_key] = street_text or 'cad'
            except Exception:
                pass

            # CAPTCHA çöz ve ekle (her denemede taze kod)
            captcha_img = self.fetch_captcha_image()
            if not captcha_img:
                return []
            captcha_code = self.solve_captcha_2captcha(captcha_img)
            if not captcha_code:
                return []
            fields[captcha_field] = captcha_code

            html2 = self.post_form('https://postakodu.ptt.gov.tr/default.aspx', fields, ajax=False)
            if not html2:
                return []
            self._last_html = html2
            try:
                os.makedirs('logs', exist_ok=True)
                with open('logs/ptt_last_address_response.html', 'w', encoding='utf-8') as f:
                    f.write(html2)
            except Exception:
                pass
            soup = BeautifulSoup(html2, 'html5lib')
            # Uyarı mesajı varsa logla
            if 'notif({' in html2:
                try:
                    start = html2.index('msg:')
                    snippet = html2[start:start+150]
                    self.logger.warning(f"PTT uyarı: {snippet}")
                except Exception:
                    pass
            table = soup.find('table', {'id': lambda x: x and 'GridView' in x})
            if not table:
                return []
            rows = table.find_all('tr')[1:]
            addrs: List[Dict[str, str]] = []
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 4:
                    addrs.append({
                        'sokak': cells[1].get_text(strip=True),
                        'bina_no': cells[2].get_text(strip=True),
                        'posta_kodu': cells[3].get_text(strip=True)
                    })
            return addrs

        # 1) Posta Kodu sekmesiyle dene (sokak metni olmadan)
        result = attempt_query(use_street_text=False, street_text=None)
        if result:
            return result
        # 2) Sokak sekmesiyle kalıp denemeleri
        for token in ['cad', 'sok', 'bul', 'mah']:
            result = attempt_query(use_street_text=True, street_text=token)
            if result:
                return result
        return []

    
    def test_requests_scraping(self):
        """Requests ile test scraping (full postback akışı)"""
        try:
            self.logger.info("PTT Requests Scraping test başlıyor...")
            
            # PTT ana sayfasını çek
            html = self.get_page("https://postakodu.ptt.gov.tr/")
            if not html:
                self.logger.error("Ana sayfa çekilemedi!")
                return []
            
            # İl listesini çıkar
            il_list = self.get_il_list_from_html(html)
            if not il_list:
                self.logger.error("İl listesi çıkarılamadı!")
                return []
            # 1 il, 2 ilçe, 2 mahalle için adres denemesi
            first = il_list[0]
            ilceler = self.get_ilce_list(html, first['value'])
            self.logger.info(f"{first['name']} için ilçe sayısı: {len(ilceler)}")
            out = []
            for ilce in ilceler[:2]:
                # her adımda en güncel html'i kullan
                html_ilce = self.get_page("https://postakodu.ptt.gov.tr/")
                mahalleler = self.get_mahalle_list(html_ilce, first['value'], ilce['value'])
                self.logger.info(f"  {ilce['name']} için mahalle sayısı: {len(mahalleler)}")
                for mah in mahalleler[:2]:
                    html_mah = self.get_page("https://postakodu.ptt.gov.tr/")
                    streets = self.get_street_list(html_mah, first['value'], ilce['value'], mah['value'])
                    self.logger.info(f"    {mah['name']} için sokak sayısı: {len(streets)}")
                    for st in streets[:2]:
                        html_st = self.get_page("https://postakodu.ptt.gov.tr/")
                        adresler = self.get_addresses(html_st, first['value'], ilce['value'], mah['value'], st['value'])
                        self.logger.info(f"      {st['name']} için adres satırı: {len(adresler)}")
                        for a in adresler[:10]:  # sınırlı örnek
                            out.append({
                                'il': first['name'],
                                'ilce': ilce['name'],
                                'mahalle': mah['name'],
                                'sokak': st['name'],
                                **a
                            })
                    self.safe_delay(1, 2)
                self.safe_delay(1, 2)
            self.scraped_data = out
            return out
            
        except Exception as e:
            self.logger.error(f"Test hatası: {e}")
            return []
    
    def save_data(self, filename=None):
        """Veriyi dosyaya kaydet"""
        try:
            os.makedirs('data/ptt', exist_ok=True)
            
            if not filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"ptt_requests_{timestamp}.json"
            
            filepath = os.path.join('data/ptt', filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self.scraped_data, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"Veri kaydedildi: {filepath}")
            return filepath
            
        except Exception as e:
            self.logger.error(f"Veri kaydetme hatası: {e}")
            return None

def main():
    """Ana fonksiyon"""
    scraper = PTTRequestsScraper()
    
    try:
        print("PTT Requests Scraper başlıyor...")
        print("Browser kullanmadan, sadece HTTP istekleri ile!")
        print("Test parametreleri: İl listesi çekme")
        
        data = scraper.test_requests_scraping()
        
        if data:
            print(f"✅ Test başarılı! {len(data)} test verisi oluşturuldu")
            # Veriyi göster (genel yazdırma)
            for i, item in enumerate(data[:5]):
                print(f"  {i+1}. {item}")
            
            # Veriyi kaydet
            filepath = scraper.save_data()
            if filepath:
                print(f"💾 Veri kaydedildi: {filepath}")
        else:
            print("❌ Test başarısız!")
            
    except Exception as e:
        print(f"❌ Hata: {e}")

if __name__ == "__main__":
    main()
