// キャッシュ名 (バージョン管理のために変更することが推奨されます)
const CACHE_NAME = 'water-sort-puzzle-v1'; 

// キャッシュするファイルの一覧
const urlsToCache = [
    '/', // ルートパス (index.html)
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/sounds/select_bottle.mp3', // ★追加: 効果音ファイル
    '/sounds/pour_water.mp3',    // ★追加: 効果音ファイル
    '/sounds/puzzle_clear.mp3',  // ★追加: 効果音ファイル
    '/icons/icon-192x192.png',   // アイコンファイル
    '/icons/icon-512x512.png'    // アイコンファイル
];

// インストールイベント: Service Workerがインストールされる際に、指定されたファイルをキャッシュに保存
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME) // 新しいキャッシュを開く
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache); // 指定されたURLのファイルを全てキャッシュに追加
            })
            .catch(error => {
                console.error('Failed to cache:', error);
            })
    );
});

// フェッチイベント: アプリケーションからのネットワークリクエストを傍受し、キャッシュから応答する
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request) // リクエストがキャッシュ内に存在するかチェック
            .then(response => {
                // キャッシュにレスポンスがあればそれを返す
                if (response) {
                    return response;
                }
                // キャッシュになければネットワークから取得
                return fetch(event.request).then(
                    response => {
                        // 有効なレスポンスかチェック (例: 200 OK で、CORS問題がない basic タイプ)
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // レスポンスをキャッシュにコピーして返す
                        // クローンを作成しないと、レスポンスストリームは一度しか消費できないためエラーになる
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache); // キャッシュに保存
                            });
                        return response;
                    }
                );
            })
    );
});

// アクティベートイベント: 新しいService Workerがアクティブ化される際に、古いキャッシュを削除
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME]; // 現在アクティブなキャッシュ名
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // ホワイトリストにない古いキャッシュを削除
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});