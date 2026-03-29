# OMNI Super App

## Current State
Chat modülü (`ChatModule.tsx`) arkadaş ekleme ve mesaj gönderme fonksiyonları var ancak aşağıdaki kritik sorunlar tespit edildi:
1. `addFriendById` çağrısı başarılı görünse de state güncellemesi UI'ya yansımıyor olabilir (store subscription sorunu)
2. Arkadaşlar sekmesindeki mesaj butonu `createConversation` + `setActiveConversation` + `setActiveTab` çağırıyor ama race condition veya render döngüsü sorunu var
3. `createConversation` içinde `myId` null ise conversation tek participantlı oluşuyor, filtreler bozuluyor
4. `sendMessage` input validasyonu ve feedback yetersiz
5. Friends module ve Chat module ayrı ama aynı friends store'u paylaşıyor — senkronizasyon sorunu

## Requested Changes (Diff)

### Add
- `addFriendById` sonrası immediate UI feedback (toast + liste anında güncellenmeli)
- Mesaj butonuna basınca chat thread'e kesin geçiş (state flush ile)
- `myId` null durumunda güvenli fallback — permanent localStorage ID kullan
- Friends sekmesinde boş durum iyileştirme + yenile butonu
- Mesaj gönder inputunda `Enter` ve buton her ikisi de çalışmalı
- Konuşma başlığı: arkadaş adı/ID doğru gösterilmeli

### Modify
- `addFriendById` çağrısı: validation daha toleranslı (boşluklu/boşluksuz format)
- `createConversation`: `myId` null ise `localStorage.getItem("omni-permanent-id")` kullan
- Mesaj butonu onClick: `setTimeout(0)` ile state flush garantisi
- Store version 6'ya çıkar, eski friend/conv verilerini temizle
- `handleSend`: boş mesaj güvenli engelleme, başarı feedback

### Remove
- `setActiveTab("dms")` çağrısı mesaj butonundan — gereksiz, zaten activeConversationId set edilince tab mantığı devreye girmiyor

## Implementation Plan
1. `omniStore.ts`: `createConversation` içinde myId null ise localStorage'dan oku; store version 6, migration temizliği
2. `ChatModule.tsx`: arkadaş ekle butonu — validation fix, anında feedback
3. `ChatModule.tsx`: mesaj butonu — `setTimeout(0)` ile kesin geçiş, `setActiveTab` kaldır
4. `ChatModule.tsx`: `handleSend` — input trim, Enter ve buton ikisi de çalışır
5. `ChatModule.tsx`: sohbet başlığı — arkadaş adını doğru göster
6. Validate + build
