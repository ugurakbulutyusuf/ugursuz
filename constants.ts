
export const GEMINI_PROMPT = `
## 🎯 Ana Hedef
Bir YouTube videosunun transkriptini, konuya hakim ancak uzman olmayan bir hedef kitle için, videodaki **uzman seviyesindeki temel bilgileri ve fark yaratan içgörüleri** öne çıkaran, damıtılmış ve yapılandırılmış bir metne dönüştür.

## ⚠️ Temel Prensip: Sinyali Güçlendir, Gürültüyü Temizle
Bu bir özetleme değil, **damıtma** görevidir. Amaç, konuşmadaki "gürültüyü" (dolgu kelimeleri, tekrarlar, giriş/kapanış sohbetleri) temizleyerek "sinyali" (ana fikirler, kritik detaylar, uzman tavsiyeleri, stratejiler) güçlendirmektir. Sıradan ve genel geçer bilgiler yerine, konunun kilit noktalarını ve pratik değer taşıyan bilgileri korumaya odaklan.

## 📐 Uygulama Kuralları
1. **Formatlama:** Çıktıyı tamamen **Markdown** kullanarak yapılandır.
   - Ana konu başlıkları için \`##\` kullan.
   - Alt başlıklar veya listeler için madde imi (\`-\`, \`*\`) kullan.
   - Önemli kavramları, araç isimlerini, teknik terimleri ve özel isimleri \`**kalın**\` yazarak vurgula.

2. **İçerik Temizliği:**
   - **Giriş/Kapanış:** "Merhaba", "kanalıma hoş geldiniz", "videoyu beğenmeyi unutmayın" gibi standart YouTube ifadelerini tamamen kaldır.
   - **Dolgu Kelimeleri:** \`yani\`, \`işte\`, \`şey\`, \`gibi\`, \`falan\`, \`aslında\` gibi anlamsal değeri olmayan kelimeleri çıkar.
   - **Anlamsal Tekrarlar:** Aynı fikri farklı kelimelerle ifade eden cümleleri birleştirerek en net ve tek bir ifadeye dönüştür.

3. **Cümle Yapısı ve Ton:**
   - Cümleleri aktif ve net bir dilde yeniden kur.
   - **Öncelik: Okunabilirlik.** Metnin net, profesyonel ve bilgilendirici bir tona sahip olmasını sağla. Konuşmacının orijinal samimi tonunu korumak yerine, metnin akıcılığını ve anlaşılırlığını önceliklendir.
   - **Hedef:** Cümleleri ortalama 15-20 kelime uzunluğunda tutarak okunabilirliği artır. Ancak, bir fikrin bütünlüğünü korumak için bu kuralı esnetebilirsin. Anlamı bozacak şekilde cümleleri bölme.

4. **Özel İsimlerin Korunması:**
   - Bahsedilen tüm **araç, yazılım, teknoloji, YouTube kanalı** ve **kişi** isimlerini koru ve \`**\` ile vurgula.

5. **Örneklerin ve Hikayelerin İşlenmesi:**
   - Uzun kişisel hikayelerden veya örneklerden sadece bahsederek geçme. Bunun yerine, hikayenin ana dersini veya **Problem -> Eylem -> Sonuç** yapısını 1-2 cümleyle özetle.
   - *Örnek:* "Geçen hafta bir projede Notion kullanırken yaşadığım bir sorunu anlatayım..." yerine, \`- **Notion**'da filtre ayarlarının yanlış yapılmasının görev takibini engellediği bir vaka paylaştı ve çözüm olarak filtrelerin yeniden yapılandırılması gerektiğini gösterdi.\` şeklinde, öğrenimi içeren bir ifade kullan.

6. **Mantıksal Akış:**
   - Konuşmanın orijinal **mantıksal sırasını** koru. Fikirleri konularına göre yeniden gruplama, konuşmacının anlattığı sırayı takip et.

7. **Teknik ve Görsel Unsurlar:**
   - Endüstri standardı teknik terimleri (\`API\`, \`Git\`, \`React\`) olduğu gibi koru.
   - Konuşmacının videodaki görsellere, grafiklere veya seslere yaptığı referansları (\`ekranda gördüğünüz gibi...\`, \`şimdi bu sese kulak verin...\`) tamamen metinden çıkar.

8. **Birden Fazla Konuşmacı:**
   - Eğer transkriptte birden fazla konuşmacı varsa, her birini \`**Konuşmacı Adı:**\` formatında belirterek konuşmalarını ayır.

Transkript:
`;
