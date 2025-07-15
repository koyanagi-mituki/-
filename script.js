document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const resetButton = document.getElementById('reset-button');

    const tubeCapacity = 4; // 各試験管の水の数 (固定)
    // すべて利用可能な色のリスト (難易度調整で増える)
    const allUniqueColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'magenta', 'lime', 'brown'];
    
    let tubes = []; // 試験管の状態を保持する配列
    let initialTubes = []; // 初期盤面を保存するための配列 (リセット用)

    let selectedTube = null; // 選択中の試験管のインデックス
    let clearedCount = 0; // クリア回数
    let currentDifficultyColors = []; // 現在の難易度で使用する色の種類

    // 効果音の定義と読み込み
    // アニメーションがない場合でも、クリック音やクリア音は残しておくと良いでしょう
    const soundSelectBottle = new Audio('sounds/select_bottle.mp3');
    const soundPourWater = new Audio('sounds/pour_water.mp3'); // 水移動音は残す
    const soundPuzzleClear = new Audio('sounds/puzzle_clear.mp3');

    // 効果音の音量調整 (任意)
    soundSelectBottle.volume = 0.5;
    soundPourWater.volume = 0.7;
    soundPuzzleClear.volume = 0.8;

    // --- 難易度を更新する関数 ---
    function updateDifficulty() {
        const minColors = 4; // 最初に使用する色の最小数
        const maxColors = allUniqueColors.length; // 利用可能な色の最大数
        
        // クリア回数に応じて使用する色を増やすロジック
        const colorsToAdd = Math.floor(clearedCount / 3); 
        let numColors = minColors + colorsToAdd;

        // 最大色数を超えないように調整
        if (numColors > maxColors) {
            numColors = maxColors;
        }

        // 使用する色のリストを更新
        currentDifficultyColors = allUniqueColors.slice(0, numColors);

        // 試験管の総数も色の数に合わせて調整 (色の数 + 2本の空試験管)
        const totalTubes = currentDifficultyColors.length + 2; 

        console.log(`現在の難易度: 使用する色数 ${currentDifficultyColors.length}, 試験管数 ${totalTubes}`);
        return totalTubes; // initializeGameに渡す試験管数
    }

    // --- ゲームの初期化 ---
    function initializeGame(isNewGame = true) { // isNewGame: 新しいゲームかリセットか
        gameBoard.innerHTML = ''; // ボードをクリア
        tubes = []; // 試験管データをリセット

        // 新しいゲームの場合のみ難易度を更新し、試験管数を取得
        const totalTubes = isNewGame ? updateDifficulty() : (initialTubes.length > 0 ? initialTubes.length : currentDifficultyColors.length + 2);

        // 全ての水の配列を作成 (現在の難易度の色のみ使用)
        const allWater = [];
        currentDifficultyColors.forEach(color => { 
            for (let i = 0; i < tubeCapacity; i++) {
                allWater.push(color);
            }
        });

        // 水をシャッフル (フィッシャー-イェーツ法)
        for (let i = allWater.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allWater[i], allWater[j]] = [allWater[j], allWater[i]];
        }

        // 試験管に水を分配
        let waterIndex = 0;
        for (let i = 0; i < totalTubes; i++) { 
            const tubeContent = [];
            // 色の数だけ水入り試験管を作成し、残りは空の試験管とする
            if (i < currentDifficultyColors.length) { 
                for (let j = 0; j < tubeCapacity; j++) {
                    if (waterIndex < allWater.length) {
                        tubeContent.push(allWater[waterIndex++]);
                    }
                }
            }
            tubes.push(tubeContent);
            createTubeElement(i, tubeContent);
        }

        // 初期盤面をディープコピーして保存 (リセット用)
        initialTubes = JSON.parse(JSON.stringify(tubes));

        updateTubeElements(); // DOMを初期状態に更新
        selectedTube = null; // 選択状態をリセット
    }

    // --- 試験管のDOM要素を作成 ---
    function createTubeElement(index, content) {
        const tubeDiv = document.createElement('div');
        tubeDiv.classList.add('tube');
        tubeDiv.dataset.index = index; // データ属性にインデックスを保存

        tubeDiv.addEventListener('click', () => handleTubeClick(index));
        gameBoard.appendChild(tubeDiv);
    }

    // --- 試験管のDOM要素を更新 (水の状態を反映) ---
    function updateTubeElements() {
        tubes.forEach((tubeContent, index) => {
            const tubeDiv = gameBoard.querySelector(`.tube[data-index="${index}"]`);
            if (!tubeDiv) return;

            // 古い水の要素を全て削除
            const oldWaterElements = tubeDiv.querySelectorAll('.water');
            oldWaterElements.forEach(el => el.remove());

            // 新しい水の要素を下から順に追加 (Flexboxのcolumn-reverseにより下から積み重なる)
            tubeContent.forEach(color => {
                const waterDiv = document.createElement('div');
                waterDiv.classList.add('water', `color-${color}`); // 色クラスを追加
                waterDiv.style.height = `${(1 / tubeCapacity) * 100}%`; // 各水の高さを設定
                tubeDiv.appendChild(waterDiv); 
            });

            // 選択状態のクラスをトグル
            if (selectedTube === index) {
                tubeDiv.classList.add('selected');
            } else {
                tubeDiv.classList.remove('selected');
            }
        });
    }

    // --- 試験管クリックハンドラ ---
    function handleTubeClick(clickedIndex) {
        if (selectedTube === null) {
            // 1つ目の試験管を選択 (空でない試験管のみ選択可能)
            if (tubes[clickedIndex].length > 0) {
                selectedTube = clickedIndex;
                updateTubeElements(); // 選択時にDOMを更新してselectedクラスを適用
                soundSelectBottle.currentTime = 0; // 音の再生位置をリセット
                soundSelectBottle.play();          // ボトル選択音を再生
            }
        } else if (selectedTube === clickedIndex) {
            // 同じ試験管を再クリック -> 選択解除
            selectedTube = null;
            updateTubeElements(); // 選択解除時にDOMを更新してselectedクラスを解除
        } else {
            // 2つ目の試験管を選択 -> 水を移動
            const prevSelectedTube = selectedTube; // 移動元を記憶
            selectedTube = null; // UIから選択を解除
            
            tryPourWater(prevSelectedTube, clickedIndex); // 水の移動処理を呼び出す
        }
    }

    // --- 水を移動するロジック (アニメーションなし版) ---
    function tryPourWater(fromIndex, toIndex) {
        const fromTube = tubes[fromIndex];
        const toTube = tubes[toIndex];

        if (fromTube.length === 0) {
            // 選択を解除して元の表示に戻す
            selectedTube = null;
            updateTubeElements();
            return; // 送り元が空なら何もしない
        }

        const topColorFrom = fromTube[fromTube.length - 1]; // 送り元の一番上の色
        const topColorTo = toTube.length > 0 ? toTube[toTube.length - 1] : null; // 受け側の一番上の色

        // 水を移動できる条件:
        // 1. 受け側が満タンでない (toTube.length < tubeCapacity)
        // 2. (受け側が空 または 受け側の一番上の色と送り元の一番上の色が同じ)
        if (toTube.length < tubeCapacity && (toTube.length === 0 || topColorTo === topColorFrom)) {
            let pourCount = 0;
            for (let i = fromTube.length - 1; i >= 0; i--) {
                if (fromTube[i] === topColorFrom) {
                    pourCount++;
                } else {
                    break;
                }
            }

            // 受け側の残りの空き容量
            const remainingSpace = tubeCapacity - toTube.length;
            pourCount = Math.min(pourCount, remainingSpace); // 移動できるのは空き容量まで

            if (pourCount > 0) {
                const pouredWaterColors = [];
                for (let i = 0; i < pourCount; i++) {
                    pouredWaterColors.push(fromTube.pop()); // fromTubeから水を取り出す
                }
                toTube.push(...pouredWaterColors.reverse()); // 受け側に水を逆順で追加 (正しい順序に戻す)
                
                soundPourWater.currentTime = 0; // 水移動音を再生
                soundPourWater.play();          

                updateTubeElements(); // DOMを即座に更新
                checkWinCondition(); // 勝利判定
            }
        }
        // 水を注げない場合、選択を解除
        selectedTube = null;
        updateTubeElements();
    }

    // --- 勝利条件のチェック ---
    function checkWinCondition() {
        const isWon = tubes.every(tube => {
            if (tube.length === 0) return true; // 空の試験管はOK
            if (tube.length < tubeCapacity) return false; // 満タンでない試験管はNG
            // 全て同じ色かチェック
            const firstColor = tube[0];
            return tube.every(color => color === firstColor);
        });

        if (isWon) {
            soundPuzzleClear.currentTime = 0; 
            soundPuzzleClear.play();          // クリア音を再生

            alert('おめでとうございます！パズルをクリアしました！');
            clearedCount++; // クリア回数をインクリメント
            alert(`累計クリア回数: ${clearedCount}回。次のパズルに挑戦します！`);
            setTimeout(() => initializeGame(true), 1000); // 新しいゲームとして初期化
        }
    }

    // --- イベントリスナー ---
    resetButton.addEventListener('click', () => {
        if (initialTubes.length > 0) {
            // initialTubes から現在のtubesをディープコピーで復元
            tubes = JSON.parse(JSON.stringify(initialTubes));
            selectedTube = null; // 選択状態をリセット
            updateTubeElements(); // DOMを更新
        } else {
            // initialTubes がまだ設定されていない場合は新規ゲームを開始
            initializeGame(true); // 新しいゲームとして初期化
        }
    });

    // 最初のゲーム開始 (初回は新しいゲームとして開始)
    initializeGame(true);
});