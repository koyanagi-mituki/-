document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const resetButton = document.getElementById('reset-button');

    const tubeCapacity = 4;
    const allUniqueColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'magenta', 'lime', 'brown'];
    
    let tubes = [];
    let initialTubes = [];

    let selectedTube = null;
    let clearedCount = 0;
    let currentDifficultyColors = [];

    // ★追加: 効果音の定義
    const soundSelectBottle = new Audio('sounds/select_bottle.mp3');
    const soundPourWater = new Audio('sounds/pour_water.mp3');
    const soundPuzzleClear = new Audio('sounds/puzzle_clear.mp3');

    // ★追加: 効果音の音量調整 (任意)
    soundSelectBottle.volume = 0.5; // 半分の音量
    soundPourWater.volume = 0.7;    // 70%の音量
    soundPuzzleClear.volume = 0.8;  // 80%の音量

    // --- 難易度を更新する関数 --- (変更なし)
    function updateDifficulty() {
        const minColors = 4; 
        const maxColors = allUniqueColors.length; 
        
        const colorsToAdd = Math.floor(clearedCount / 3); 
        let numColors = minColors + colorsToAdd;

        if (numColors > maxColors) {
            numColors = maxColors;
        }

        currentDifficultyColors = allUniqueColors.slice(0, numColors);
        const totalTubes = currentDifficultyColors.length + 2; 

        console.log(`現在の難易度: 使用する色数 ${currentDifficultyColors.length}, 試験管数 ${totalTubes}`);
        return totalTubes; 
    }

    // --- ゲームの初期化 --- (変更なし)
    function initializeGame(isNewGame = true) { 
        gameBoard.innerHTML = ''; 
        tubes = []; 

        const totalTubes = isNewGame ? updateDifficulty() : (initialTubes.length > 0 ? initialTubes.length : currentDifficultyColors.length + 2);

        const allWater = [];
        currentDifficultyColors.forEach(color => { 
            for (let i = 0; i < tubeCapacity; i++) {
                allWater.push(color);
            }
        });

        for (let i = allWater.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allWater[i], allWater[j]] = [allWater[j], allWater[i]];
        }

        let waterIndex = 0;
        for (let i = 0; i < totalTubes; i++) { 
            const tubeContent = [];
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

        initialTubes = JSON.parse(JSON.stringify(tubes));

        updateTubeElements();
        selectedTube = null;
    }

    // --- 試験管のDOM要素を作成 --- (変更なし)
    function createTubeElement(index, content) {
        const tubeDiv = document.createElement('div');
        tubeDiv.classList.add('tube');
        tubeDiv.dataset.index = index;

        tubeDiv.addEventListener('click', () => handleTubeClick(index));
        gameBoard.appendChild(tubeDiv);
    }

    // --- 試験管のDOM要素を更新 (水の状態を反映) --- (変更なし)
    function updateTubeElements() {
        tubes.forEach((tubeContent, index) => {
            const tubeDiv = gameBoard.querySelector(`.tube[data-index="${index}"]`);
            if (!tubeDiv) return;

            const oldWaterElements = tubeDiv.querySelectorAll('.water');
            oldWaterElements.forEach(el => el.remove());

            tubeContent.forEach(color => {
                const waterDiv = document.createElement('div');
                waterDiv.classList.add('water', `color-${color}`);
                waterDiv.style.height = `${(1 / tubeCapacity) * 100}%`; 
                tubeDiv.appendChild(waterDiv); 
            });

            if (selectedTube === index) {
                tubeDiv.classList.add('selected');
            } else {
                tubeDiv.classList.remove('selected');
            }
        });
    }

    // --- 試験管クリックハンドラ (★変更あり) ---
    function handleTubeClick(clickedIndex) {
        if (selectedTube === null) {
            if (tubes[clickedIndex].length > 0) {
                selectedTube = clickedIndex;
                updateTubeElements();
                soundSelectBottle.currentTime = 0; // ★追加: 音の再生位置をリセット
                soundSelectBottle.play();          // ★追加: ボトル選択音を再生
            }
        } else if (selectedTube === clickedIndex) {
            selectedTube = null;
            updateTubeElements();
            // soundSelectBottle.currentTime = 0; // 同じボトルを再クリックでは音を鳴らさないことが多い
            // soundSelectBottle.play();
        } else {
            const prevSelectedTube = selectedTube;
            selectedTube = null;
            updateTubeElements();

            tryPourWater(prevSelectedTube, clickedIndex); 
        }
    }

    // --- 水を移動するロジック (★変更あり) ---
    function tryPourWater(fromIndex, toIndex) {
        const fromTube = tubes[fromIndex];
        const toTube = tubes[toIndex];

        if (fromTube.length === 0) return; 

        const topColorFrom = fromTube[fromTube.length - 1]; 
        const topColorTo = toTube.length > 0 ? toTube[toTube.length - 1] : null; 

        if (toTube.length < tubeCapacity && (toTube.length === 0 || topColorTo === topColorFrom)) {
            let pourCount = 0;
            for (let i = fromTube.length - 1; i >= 0; i--) {
                if (fromTube[i] === topColorFrom) {
                    pourCount++;
                } else {
                    break;
                }
            }

            const remainingSpace = tubeCapacity - toTube.length;
            pourCount = Math.min(pourCount, remainingSpace); 

            if (pourCount > 0) {
                const pouredWaterColors = [];
                for (let i = 0; i < pourCount; i++) {
                    pouredWaterColors.push(fromTube.pop()); 
                }
                
                const fromTubeDiv = gameBoard.querySelector(`.tube[data-index="${fromIndex}"]`);
                const toTubeDiv = gameBoard.querySelector(`.tube[data-index="${toIndex}"]`);

                if (!fromTubeDiv || !toTubeDiv) return;

                updateTubeElements(); 

                const pourDirection = fromIndex < toIndex ? 1 : -1; 
                const rotateDeg = pourDirection * 5; 

                fromTubeDiv.style.transform = `translateY(-10px) rotateZ(${rotateDeg}deg)`; 
                fromTubeDiv.classList.add('pour-origin'); 

                // ★追加: 水移動音を再生
                soundPourWater.currentTime = 0; // 音の再生位置をリセット
                soundPourWater.play();          // 音を再生


                const pouringWaterAnim = document.createElement('div');
                pouringWaterAnim.classList.add('water', 'pouring-water-anim', `color-${pouredWaterColors[0]}`);
                pouringWaterAnim.style.width = '100%';
                pouringWaterAnim.style.height = `${(pourCount / tubeCapacity) * 100}%`;

                const fromRect = fromTubeDiv.getBoundingClientRect();
                const toRect = toTubeDiv.getBoundingClientRect();

                const waterHeightPx = fromRect.height / tubeCapacity; 
                const initialBottomPx = fromTube.length * waterHeightPx; 

                pouringWaterAnim.style.left = `${fromRect.left}px`;
                pouringWaterAnim.style.top = `${fromRect.bottom - initialBottomPx - pouringWaterAnim.clientHeight}px`;
                pouringWaterAnim.style.width = `${fromRect.width}px`;

                document.body.appendChild(pouringWaterAnim);

                requestAnimationFrame(() => {
                    const targetX = toRect.left;
                    const targetY = toRect.top - (fromRect.height * 0.1); 

                    const deltaX = targetX - fromRect.left;
                    const deltaY = targetY - (fromRect.bottom - initialBottomPx - pouringWaterAnim.clientHeight);

                    const waterRotateDeg = pourDirection * 90; 

                    pouringWaterAnim.style.transform = `translate(${deltaX}px, ${deltaY}px) rotateZ(${waterRotateDeg}deg)`;
                    pouringWaterAnim.style.opacity = '0'; 
                });

                setTimeout(() => {
                    toTube.push(...pouredWaterColors.reverse()); 
                    pouringWaterAnim.remove();
                    
                    fromTubeDiv.style.transform = ''; 
                    fromTubeDiv.classList.remove('pour-origin');

                    updateTubeElements();
                    checkWinCondition(); 
                }, 800); 
            }
        }
    }

    // --- 勝利条件のチェック (★変更あり) ---
    function checkWinCondition() {
        const isWon = tubes.every(tube => {
            if (tube.length === 0) return true; 
            if (tube.length < tubeCapacity) return false; 
            const firstColor = tube[0];
            return tube.every(color => color === firstColor);
        });

        if (isWon) {
            soundPuzzleClear.currentTime = 0; // ★追加: 音の再生位置をリセット
            soundPuzzleClear.play();          // ★追加: クリア音を再生

            alert('おめでとうございます！パズルをクリアしました！');
            clearedCount++; 
            alert(`累計クリア回数: ${clearedCount}回。次のパズルに挑戦します！`);
            setTimeout(() => initializeGame(true), 1000); 
        }
    }

    // --- イベントリスナー --- (変更なし)
    resetButton.addEventListener('click', () => {
        if (initialTubes.length > 0) {
            tubes = JSON.parse(JSON.stringify(initialTubes));
            selectedTube = null; 
            updateTubeElements(); 
        } else {
            initializeGame(true); 
        }
    });

    initializeGame(true);
});