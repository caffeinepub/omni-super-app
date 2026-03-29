# OMNI Super App

## Current State
- Social ve Profile modülleri farklı sahte +777 ID fallback'leri kullanıyor
- Store myId null başlıyor, bileşenler erken render'da sahte ID yazıyor
- Profile'dan direkt fotoğraf/video yükleme yok
- Post filtreleri ID uyumsuzluğu nedeniyle çalışmıyor

## Requested Changes (Diff)

### Add
- Tüm ID fallback'leri `localStorage.getItem("omni-permanent-id")` ile değiştirilecek (senkron, her zaman erişilebilir)
- Profile → Posts ve Videos sekmelerine direkt upload butonu eklenecek
- `getMyId()` utility helper: store.myId ?? localStorage permanent ID

### Modify
- SocialModule: `storeMyId ?? "+777 0000 0001"` → `getMyId()` helper
- SocialModule ProfileTab: `activeIdentity?.id ?? "+777 0000 0001"` → `getMyId()`
- ProfileModule: `myId ?? "+777 3821 4490"` → `getMyId()`
- Profile Posts/Videos sekmesine Social modülü ile aynı upload modal'ı eklenmeli
- Social'dan gelen post'lar Profile'da doğru filtrelenmeli

### Remove
- Tüm hardcoded sahte +777 ID fallback değerleri

## Implementation Plan
1. `getMyId()` utility ekle (store.myId ?? localStorage fallback)
2. SocialModule içindeki tüm sahte ID fallback'lerini düzelt
3. ProfileModule içindeki sahte ID fallback'i düzelt
4. Profile Posts sekmesine fotoğraf yükleme butonu ekle
5. Profile Videos sekmesine video yükleme butonu ekle
6. Upload sonrası authorId garantili set edilmeli
