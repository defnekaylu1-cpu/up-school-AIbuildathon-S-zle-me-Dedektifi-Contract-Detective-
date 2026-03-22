# Sözleşme Dedektifi — Geliştirme Görev Listesi

Bu liste, `prd.md` dosyasındaki ürün tanımına göre uygulamayı adım adım inşa etmek içindir. Görevleri sırayla tamamlamak MVP’yi tamamlamanızı sağlar.

---

## Faz 0: Hazırlık

- [ ] **0.1** Proje klasör yapısını oluştur (örn. `index.html`, `styles/` veya tek dosya, `js/` veya modüler script).
- [ ] **0.2** [Google AI Studio](https://aistudio.google.com/) üzerinden Gemini API anahtarı al; güvenlik için anahtarı yalnızca ortam değişkeni veya Netlify/Lovable gibi platformun gizli değişken alanında tut (istemci tarafında doğrudan gömme — mümkünse backend veya sunucusuz fonksiyon ile koru).
- [ ] **0.3** Netlify veya Lovable’da dağıtım hesabını ve repo/klasör bağlantısını planla (PRD’de belirtildiği gibi).

---

## Faz 1: Arayüz iskeleti (HTML + Tailwind)

- [ ] **1.1** `index.html` oluştur; UTF-8, responsive viewport meta etiketleri ekle.
- [ ] **1.2** Tailwind’i projeye ekle (CDN ile MVP veya `npm` + build — tercihine göre).
- [ ] **1.3** Uygulama başlığı ve kısa açıklama metni (Sözleşme Dedektifi ne işe yarar).
- [ ] **1.4** Geniş, erişilebilir **textarea** (sözleşme metni için); placeholder ve karakter/uzunluk ipucu (isteğe bağlı).
- [ ] **1.5** **“Analiz Et”** butonu; boş metinde devre dışı veya uyarı mesajı.
- [ ] **1.6** Sonuç alanı için iskelet: üç bölüm başlığı — **Özet**, **Kritik Riskler (Kırmızı Bayraklar)**, **Sadeleştirilmiş Açıklama** (başlangıçta boş veya gizli).
- [ ] **1.7** **Yükleniyor** durumu için UI (spinner, skeleton veya metin); analiz sırasında göster, bitince gizle.

---

## Faz 2: Gemini API entegrasyonu

- [ ] **2.1** Gemini REST API veya resmi JS SDK dokümantasyonunu incele; kullanılacak model adını sabitle (örn. `gemini-1.5-flash` veya güncel önerilen model).
- [ ] **2.2** Tek bir **istemci modülü** veya fonksiyon yaz: giriş metnini alıp modele gönderen çağrı.
- [ ] **2.3** **Sistem / kullanıcı prompt’u** tasarla: çıktının yapılandırılmış olmasını iste (JSON: `ozet`, `kirmizi_bayraklar` (dizi), `sade_aciklama` gibi) — böylece sonuçları güvenle parse edebilirsin.
- [ ] **2.4** API hataları için kullanıcıya anlaşılır mesaj; ağ zaman aşımı ve boş yanıt senaryolarını ele al.
- [ ] **2.5** Uzun metinlerde token sınırı: gerekirse metni böl veya kullanıcıya maksimum uzunluk uyarısı göster (PRD’de “uzun metin” vurgusu var).

---

## Faz 3: Sonuçların gösterimi ve akış

- [ ] **3.1** “Analiz Et” tıklanınca: textarea’dan metni oku, doğrula, yüklemeyi başlat, API’yi çağır.
- [ ] **3.2** Dönen JSON’u parse et; parse hatasında ham metinden kurtarma veya genel hata mesajı.
- [ ] **3.3** **Özet** bölümünü doldur (kısa paragraf).
- [ ] **3.4** **Kritik Riskler** listesini madde madde veya kartlar halinde göster; görsel olarak “kırmızı bayrak” vurgusu (ikon, renk — Tailwind ile).
- [ ] **3.5** **Sadeleştirilmiş Açıklama** bölümünü düz metin veya paragraflar halinde göster.
- [ ] **3.6** İkinci analiz: önceki sonuçları temizle veya üzerine yaz; formu sıfırlama butonu (isteğe bağlı ama kullanışlı).

---

## Faz 4: UX, erişilebilirlik ve cilalama

- [ ] **4.1** Klavye ile buton ve odak sırası; textarea etiketi (`label` veya `aria-label`).
- [ ] **4.2** Mobil görünümde textarea ve butonların kullanılabilirliği (touch, yeterli boşluk).
- [ ] **4.3** Basit hata ve boş durum metinleri (Türkçe, PRD hedef kitlesine uygun dil).
- [ ] **4.4** İsteğe bağlı: karanlık mod veya marka renkleri ile tutarlı tipografi.

---

## Faz 5: Yayınlama

- [ ] **5.1** API anahtarını üretim ortamında güvenli şekilde yapılandır (Netlify Environment Variables / Lovable secrets).
- [ ] **5.2** Statik dosyaları derle (Tailwind build kullanıyorsan) ve dağıt.
- [ ] **5.3** Canlı URL’de bir örnek sözleşme metni ile uçtan uca test.

---

## MVP tamamlandı sayılır

PRD’deki MVP maddeleri karşılandığında:

- Geniş textarea ile metin girişi
- Gemini ile risk analizi
- Özet, kırmızı bayraklar ve sadeleştirilmiş açıklamanın kategorize gösterimi
- Analiz sırasında yükleniyor geri bildirimi

---

## Sonraki sürümler (PRD dışı, isteğe bağlı)

- PDF veya dosya yükleme
- Analiz geçmişi (yerel depolama)
- Çoklu dil desteği
- Yasal uyarı footer’ı (“Bu araç hukuki tavsiye değildir.”)
