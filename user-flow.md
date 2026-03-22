# 🚶 Kullanıcı Akışı (User Flow) 

**Giriş ve İlk Karşılaşma:** Kullanıcı uygulamayı açtığında sade, güven veren ve profesyonel bir arayüzle karşılaşır. Ekranın merkezinde "Sözleşmeni Yapıştır, Riskleri Yakala" gibi net bir başlık ve altında geniş bir metin giriş alanı (textarea) yer alır.

&#x20;**Veri Girişi:** Kullanıcı incelemek istediği uzun ve karmaşık sözleşme metnini (Kullanıcı Sözleşmesi, Gizlilik Politikası vb.) kopyalayıp bu metin kutusuna yapıştırır. 

**Analizi Başlatma:** Kullanıcı metin kutusunun hemen altında bulunan, dikkat çekici renkteki "Sözleşmeyi İncele" veya "Analiz Et" butonuna tıklar. 

**İşlem Süreci (Bekleme):** Uygulama, metni Gemini API'ye gönderirken kullanıcıya bir "Dedektif inceliyor..." animasyonu veya yüklenme çubuğu gösterilir. Bu adımda arka planda yapay zeka metni tarar ve kritik maddeleri ayıklar. 

**Sonuçların Görüntülenmesi:** Analiz tamamlandığında ekran otomatik olarak aşağı kayar veya yeni bir panel açılır.  **Kullanıcı şu üç ana bölümü görür:*Özet:*** Sözleşmenin ne hakkında olduğuna dair 2-3 cümlelik çok kısa bir bilgi. ***Kritik Riskler (⚠️):*** Kullanıcı aleyhine olabilecek (veri satışı, gizli ücretler, cayma hakkı kısıtlaması gibi) maddeler madde madde listelenir. ***Halk Dilinde Tercüme:*** Ağır hukuk terimlerinin herkesin anlayabileceği basit ve sade bir dille açıklaması sunulur. 

**Geri Bildirim veya Yeni Analiz:** Kullanıcı sonuçları okuduktan sonra dilerse "Yeni Sözleşme Tara" butonuna basarak başa döner veya sunulan sonuçların kalitesi hakkında kısa bir değerlendirme yapabilir. 

