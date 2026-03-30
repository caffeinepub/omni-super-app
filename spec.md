# OMNI Super App — Temel Refactor

## Current State

OMNI, 8 modüllü (Chat, Social, Dating, Market, Wallet, AI, Profile, Ride) bir super app. Ana sorun: aynı hatalar her build'de tekrar ediyor çünkü köklü mimari sorunlar var:

1. **Chat tab geçişi**: `activeTab` local state, `activeConversationId` Zustand store — aralarında güvenilir sinyal yok.
2. **Store tek dosya (1501 satır)**: tüm modüllerin state'i karışık, migration karmaşık.
3. **WebRTC**: ICP actor null ise sessiz failure.
4. **Wallet**: ICP girişsiz kullanıcı için UX belirsiz.
5. **+777 ID race condition**: bazı render'larda modüller null ID görüyor.

## Requested Changes (Diff)

### Add
- `openConversationWith(friendId)` action: store'da atomic olarak conversation oluştur + `chatPendingNavigate` flag set et — ChatModule bunu useEffect ile okuyarak tab'ı güvenilir biçimde değiştirir.
- `chatPendingNavigate: string | null` + `clearChatNavigate()` store action.
- Store version 8 migration: eski "me" participant'lı conversationları temizle.
- ICP actor null için Türkçe toast.error + "ICP ile giriş yap" yönlendirmesi (ChatModule WebRTC).
- Wallet'ta ICP girişsiz uyarı banner (zaten var, daha belirgin yapılacak).

### Modify
- **omniStore.ts**: `STORE_VERSION` → 8; `createConversation` içinde `myId` fallback'i `localStorage.getItem("omni-permanent-id")` ile sağlamlaştır; `openConversationWith` ekle.
- **ChatModule.tsx**: Friends tab'daki mesaj butonundan `openConversationWith(friend.friendId)` çağır (setActiveConversation + setActiveTab kombinasyonu yerine). `useEffect` ile `chatPendingNavigate` izle → tab'ı "dms"e çevir + `clearChatNavigate()` çağır.
- **ChatModule.tsx WebRTC**: `if (!actor || !myId777)` → Türkçe hata mesajı göster, return.
- **Store init**: `myId` initial value `localStorage.getItem("omni-permanent-id")` zaten set, ama tüm aksiyonlarda null fallback da `localStorage`'dan geliyor — tutarlı hale getir.

### Remove
- ChatModule'dan `setActiveTab("dms")` + `setActiveConversation` kombinasyon çağrıları → `openConversationWith` ile değiştir.
- Kalan hardcoded/mock veri kontrolü: hiçbir modülde sabit veri kalmamalı.

## Implementation Plan

1. **omniStore.ts**:
   - `STORE_VERSION` → 8
   - `chatPendingNavigate: null` field ekle (runtime, persist edilmez)
   - `clearChatNavigate()` action
   - `openConversationWith(friendId)`: existing conv bul veya `createConversation` çağır, `setActiveConversation(id)` + `chatPendingNavigate: id` set et
   - `createConversation` içinde myId fallback sağlamlaştır
   - Migration v8: `conversations`'daki "me" participant'lı kayıtları temizle

2. **ChatModule.tsx**:
   - `chatPendingNavigate`, `clearChatNavigate` store'dan al
   - `useEffect([chatPendingNavigate])`: değer gelince `setActiveTab("dms")` + `clearChatNavigate()`
   - Friends listesindeki mesaj butonu onClick → sadece `openConversationWith(friend.friendId)`
   - WebRTC `initiateCall`: actor null ise `toast.error("Sesli/görüntülü arama için ICP ile giriş yapman gerekiyor")`

3. **Validate**: lint + typecheck + build
