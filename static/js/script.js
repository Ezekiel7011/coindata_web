// Liquidations-table
let selectedInfoListButton1 = 'All';
let selectedInfoListButton2 = '1 hr';

// 初始化表格
updateTableData();
updatehourTableData();
updateTotalTableData();
updatelargestblock();

// 設定初始文字
document.getElementById('infoListButton1').textContent = selectedInfoListButton1;
document.getElementById('infoListButton2').textContent = selectedInfoListButton2;

document.getElementById('infoListButton1').addEventListener('click', function (event) {
    showOptionsList('infoListButton1');
    // 實作 info-list-block 按鈕1 的資料請求
    fetch('/api/liquidation_coin_names')
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新列表等
            console.log('Coin Names:', data);
            updateButtonText('infoListButton1', selectedInfoListButton1);
            updateTableData();
        });
    event.stopPropagation();
});

document.getElementById('infoListButton2').addEventListener('click', function (event) {
    showOptionsList('infoListButton2');
    // 實作 info-list-block 按鈕2 的資料請求
    fetch('/api/liquidation_time_ranges')
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新列表等
            console.log('Time Ranges:', data);
            updateButtonText('infoListButton2', selectedInfoListButton2);
            updateTableData();
        });
    event.stopPropagation();
});

function navigateTo(page) {
    if (page === 'index') {
        window.location.href = '/';  // '/' 是 Flask 應用中的首頁路徑
    } else if (page === 'longshort') {
        window.location.href = '/longshort';  // '/longshort' 是你的 longshort.html 的路徑
    }
}

// 在按鈕點擊後顯示列表
function showOptionsList(buttonId) {
    hideOptionsList(); // 隱藏已存在的列表

    const selectedButton = document.getElementById(buttonId);

    const optionsList = document.createElement('ul');
    optionsList.className = 'options-list';

    // 使用 fetch 發送請求，根據按鈕 ID 確定要請求的 API
    let apiUrl;

    if (buttonId === 'infoListButton1') {
        apiUrl = '/api/liquidation_coin_names';
    } else if (buttonId === 'infoListButton2') {
        apiUrl = '/api/liquidation_time_ranges';
    } else if (buttonId === 'realTimeButton1') {
        apiUrl = '/api/liquidation_real_time_Exchanges';
    } else if (buttonId === 'realTimeButton2') {
        apiUrl = '/api/liquidation_real_time_coinname';
    } else if (buttonId === 'realTimeButton3') {
        apiUrl = '/api/liquidation_real_time_value';
    }
    // 發送請求並處理返回的數據
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新列表等
            data.forEach(option => {
                const listItem = document.createElement('li');
                listItem.textContent = option;

                // 在每個選項上添加點擊事件
                listItem.addEventListener('click', function () {
                    console.log(`Selected option: ${option}`);
                    // 在這裡執行選項被點擊後的操作，例如發送資料請求等

                    // 更新按鈕文字
                    updateButtonText(buttonId, option);

                    // 這裡模擬點擊選項後隱藏選單
                    document.body.removeChild(optionsList);
                    document.removeEventListener('click', hideOptionsList);

                    // 更新表格
                    updateTableData();
                });

                optionsList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching options:', error);
        });

    // 這裡模擬將選單添加到 body 中
    document.body.appendChild(optionsList);

    // 設定選單的位置，這裡示範根據按鈕位置定位，你可能需要更準確的計算
    const rect = selectedButton.getBoundingClientRect();
    optionsList.style.top = `${rect.bottom}px`;
    optionsList.style.left = `${rect.left}px`;

    // 防止點擊選單時觸發 body 的 click 事件
    document.addEventListener('click', function (event) {
        if (event.target === selectedButton) {
            return;
        }
        hideOptionsList();
    });
}

// 隱藏列表
function hideOptionsList(event) {
    const existingOptionsList = document.querySelector('.options-list');
    if (existingOptionsList) {
        document.body.removeChild(existingOptionsList);
        document.removeEventListener('click', hideOptionsList);
    }
}

// 更新按鈕文字
function updateButtonText(buttonId, text) {
    const button = document.getElementById(buttonId);
    button.textContent = text;

    // 根據按鈕 ID 更新相應的選擇變數
    if (buttonId === 'infoListButton1') {

        selectedInfoListButton1 = text;
    } else if (buttonId === 'infoListButton2') {

        selectedInfoListButton2 = text;
    } else if (buttonId === 'realTimeButton1') {
        updateRealTimeTableData();
        selectedRealTimeButton1 = text;
    } else if (buttonId === 'realTimeButton2') {
        updateRealTimeTableData();
        selectedRealTimeButton2 = text;
    } else if (buttonId === 'realTimeButton3') {
        updateRealTimeTableData();
        selectedRealTimeButton3 = text;
    }
}

// 發送資料請求並更新表格
function updateTableData() {
    // 獲取目前 infoListButton1 和 infoListButton2 上的文字
    const selectedInfoListButton1 = document.getElementById('infoListButton1').textContent;
    const selectedInfoListButton2 = document.getElementById('infoListButton2').textContent;

    // 發送 AJAX 請求，根據按鈕上的文字更新資料
    fetch(`/api/liquidation_update_data?coinname=${selectedInfoListButton1}&time_range=${selectedInfoListButton2}`)
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新 table 的內容
            console.log('Updated Data:', data);
            updateTable(data);
        })
        .catch(error => {
            console.error('Error updating data:', error);
        });
}

// 更新info表格內容
function updateTable(data) {
    // 獲取表格主體
    const tableBody = document.getElementById('infoListTableBody');

    // 清空表格內容
    tableBody.innerHTML = '';

    // 遍歷每一行實時數據
    data.forEach(row => {
        const newRow = document.createElement('tr');

        // 檢查 row[9] 的值
        const textColor = row[9] === 'long' ? 'green' : (row[9] === 'short' ? 'red' : 'black');

        // 插入新行
        newRow.innerHTML = `
            <td>
                <div style="position: relative; display: inline-block;">
                    <img src="static/img/${row[3]}.png" style="width: 24px; height: 24px;">
                    ${row[3]} <!-- 在圖片後面插入文字 -->
                </div>
            </td>
            <td>${row[4]}</td>
            <td>${row[5]}</td>
            <td>${row[6]}</td>
            <td>${row[7]}</td>
            <td style="color: ${textColor};">${row[8]} ${row[9]}</td>
        `;

        tableBody.insertBefore(newRow, tableBody.firstChild);
    });
}


////////////////////////////////////////////////Liquidations-realtime-table/////////////////////////////////////////////////////////////
// 預設值
let selectedRealTimeButton1 = 'All';
let selectedRealTimeButton2 = 'All';
let selectedRealTimeButton3 = 'All';

// 初始化實時表格
updateRealTimeTableData();

// 設定初始文字
document.getElementById('realTimeButton1').textContent = selectedRealTimeButton1;
document.getElementById('realTimeButton2').textContent = selectedRealTimeButton2;
document.getElementById('realTimeButton3').textContent = selectedRealTimeButton3;

document.getElementById('realTimeButton1').addEventListener('click', function (event) {
    showOptionsList('realTimeButton1');
    // 實作 real-time-block 按鈕1 的資料請求
    fetch('/api/liquidation_real_time_Exchanges') // 替換成實際的服務端端點
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新列表等
            console.log('Real Time Options 1:', data);
            updateButtonText('realTimeButton1', selectedRealTimeButton1);
        });
    event.stopPropagation();
});

document.getElementById('realTimeButton2').addEventListener('click', function (event) {
    showOptionsList('realTimeButton2');
    // 實作 real-time-block 按鈕2 的資料請求
    fetch('/api/liquidation_real_time_coinname') // 替換成實際的服務端端點
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新列表等
            console.log('Real Time Options 2:', data);
            updateButtonText('realTimeButton2', selectedRealTimeButton2);
        });
    event.stopPropagation();
});

document.getElementById('realTimeButton3').addEventListener('click', function (event) {
    showOptionsList('realTimeButton3');
    // 實作 real-time-block 按鈕3 的資料請求
    fetch('/api/liquidation_real_time_value') // 替換成實際的服務端端點
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新列表等
            console.log('Real Time Options 3:', data);
            updateButtonText('realTimeButton3', selectedRealTimeButton3);
        });
    event.stopPropagation();
});

// 發送資料請求並更新實時表格
function updateRealTimeTableData() {
    // 獲取目前 realTimeButton1 和 realTimeButton2 上的文字
    const selectedRealTimeButton1 = document.getElementById('realTimeButton1').textContent;
    const selectedRealTimeButton2 = document.getElementById('realTimeButton2').textContent;
    const selectedRealTimeButton3 = document.getElementById('realTimeButton3').textContent;

    // 發送 AJAX 請求，根據按鈕上的文字更新實時表格數據
    fetch(`/api/liquidation_update_real_time_data?exchanges=${selectedRealTimeButton1}&coinname=${selectedRealTimeButton2}&value=${selectedRealTimeButton3}`)
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新實時表格的內容
            console.log('Updated Real Time Data:', data);
            updateRealTimeTable(data);
        })
        .catch(error => {
            console.error('Error updating real-time data:', error);
        });
}


// 更新實時表格內容
function updateRealTimeTable(data) {
    // 獲取實時表格主體
    const realTimeTableBody = document.getElementById('realTimeTableBody');

    // 清空實時表格內容
    realTimeTableBody.innerHTML = '';

    // 遍歷每一行實時數據
    data.forEach(row => {
        const newRow = document.createElement('tr');

        // 插入新行
        newRow.innerHTML = `
            <td class="${row[2]}">${row[0]}/${row[1]}</td>
            <td class="${row[2]}">${row[3]}</td>
            <td class="${row[2]}">${row[4]}</td>
            <td class="${row[2]}">${row[5]}</td>
        `;
        realTimeTableBody.insertBefore(newRow, realTimeTableBody.firstChild);
    });
}


////////////////////////////////////////////////Liquidations-Hourtable/////////////////////////////////////////////////////////////

function updatehourTableData() {
    // 發送 AJAX 請求，根據按鈕上的文字更新資料
    fetch(`/api/liquidation_update_hourdata`)
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新 table 的內容
            console.log('hourdata:', data);
            updatehourTable(data[0], 1);
            updatehourTable(data[1], 4);
            updatehourTable(data[2], 12);
            updatehourTable(data[3], 24);
        })
        .catch(error => {
            console.error('Error updating data:', error);
        });
}

// 更新info表格內容
function updatehourTable(data, selectorSuffix) {

    let blockSelector;
    if (selectorSuffix === 1) {
        blockSelector = "h1_rekt";
    } else if (selectorSuffix === 4) {
        blockSelector = "h4_rekt";
    } else if (selectorSuffix === 12) {
        blockSelector = "h12_rekt";
    } else if (selectorSuffix === 24) {
        blockSelector = "h24_rekt";
    }
    const newData = [
        { selector: `#${blockSelector} .exchange:nth-child(1) .right .number`, value: '$' + data[2] },
        { selector: `#${blockSelector} .exchange:nth-child(2) .right .number`, color: '#2ecc71', value: '$' + data[3] },
        { selector: `#${blockSelector} .exchange:nth-child(3) .right .number`, color: '#e74c3c', value: '$' + data[4] },
    ];

    // 遍歷每一行實時數據
    newData.forEach(item => {
        const element = document.querySelector(item.selector);
        if (element) {
            element.textContent = item.value;
            element.style.color = item.color;
        }
    });

}

////////////////////////////////////////////////Liquidations-total_table/////////////////////////////////////////////////////////////

// 每頁顯示的資料數量
const itemsPerPage = 20;

// 當前頁碼
let currentPage = 1;

// 全部資料
let allData = [];

// 發送資料請求並更新表格
function updateTotalTableData() {
    // 發送 AJAX 請求，根據按鈕上的文字更新資料
    fetch(`/api/liquidation_totaltable_update_data`)
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新 table 的內容
            allData = data;
            console.log('Updated Data:', data);
            updateTotalTable(data);
        })
        .catch(error => {
            console.error('Error updating data:', error);
        });
}

// 更新表格內容
function updateTotalTable() {
    const tableBody = document.getElementById('total_table');
    tableBody.innerHTML = '';

    // 計算當前頁的資料範圍
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allData.length);

    // 遍歷顯示資料
    for (let i = startIndex; i < endIndex; i++) {
        const row = allData[i];

        // 檢查 row[3] 的值
        const textColor = row[3] >= 0 ? '#00DB00' : 'red';

        const newRow = document.createElement('tr');

        // 插入新行
        newRow.innerHTML = `
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${row[2]}</td>
            <td style="color: ${textColor};">${row[3]}</td>
            <td style="color: ${textColor}">${row[4]}</td>
            <td style="color: red">${row[5]}</td>
            <td style="color: #00DB00">${row[6]}</td>
            <td style="color: red">${row[7]}</td>
            <td style="color: #00DB00">${row[8]}</td>
            <td style="color: red">${row[9]}</td>
        `;
        tableBody.appendChild(newRow);
    }

    // 更新頁碼按鈕
    const totalPages = Math.ceil(allData.length / itemsPerPage);
    generatePageButtons(totalPages);
}


// 生成翻頁按鈕
function generatePageButtons(totalPages) {
    const pageContainer = document.getElementById('pageButtons');
    pageContainer.innerHTML = '';

    // 加上顯示 "1" 的按鈕
    if (currentPage > 3) {
        const firstPageButton = createPageButton('1');
        firstPageButton.addEventListener('click', () => {
            currentPage = 1;
            updateTotalTableData();
        });
        pageContainer.appendChild(firstPageButton);

        // 加上省略符號
        const ellipsis = document.createElement('span');
        ellipsis.innerText = '...';
        pageContainer.appendChild(ellipsis);
    }

    const minPage = Math.max(1, currentPage - 2);
    const maxPage = Math.min(totalPages, currentPage + 2);

    for (let i = minPage; i <= maxPage; i++) {
        const button = createPageButton(`${i}`);
        button.addEventListener('click', () => {
            currentPage = i;
            updateTotalTableData();
        });

        if (i === currentPage) {
            button.classList.add('current-page');
        }

        pageContainer.appendChild(button);
    }

    // 加上顯示 "最後一頁" 的按鈕
    if (currentPage < totalPages - 2) {
        if (currentPage < totalPages - 3) {
            // 加上省略符號
            const ellipsis = document.createElement('span');
            ellipsis.innerText = '...';
            pageContainer.appendChild(ellipsis);
        }

        const lastPageButton = createPageButton(`${totalPages}`);
        lastPageButton.addEventListener('click', () => {
            currentPage = totalPages;
            updateTotalTableData();
        });
        pageContainer.appendChild(lastPageButton);
    }
}

// 創建頁碼按鈕的輔助函數
function createPageButton(text) {
    const button = document.createElement('button');
    button.innerText = text;
    button.classList.add('page-button');  // 添加獨特的 CSS 類別
    return button;
}


// 創建頁碼按鈕的輔助函數
function createPageButton(text) {
    const button = document.createElement('button');
    button.innerText = text;
    button.classList.add('page-button');  // 添加獨特的 CSS 類別
    return button;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
function updatelargestblock() {
    // 發送 AJAX 請求，根據按鈕上的文字更新資料
    fetch(`/api/liquidation_update_largest`)
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新 table 的內容
            console.log('Updated Data:', data);
            updatelargestData(data);
        })
        .catch(error => {
            console.error('Error updating data:', error);
        });
}

// 更新info表格內容
function updatelargestData(data) {
    // 獲取表格主體
    const tableBody1 = document.getElementById('largest_liquidation');

    // 清空表格內容
    tableBody1.innerHTML = '';

    // 遍歷每一行實時數據
    data.forEach(row => {
        const newRow = document.createElement('div');
        // 插入新行
        newRow.innerHTML = `
            <div>最近24小時，共有${row[0]}人被爆倉 ，爆倉總金額為 $${row[1]}
            最大單筆爆倉單發生在 ${row[2]} - ${row[3]} 價值 ${row[4]}</div>
        `;

        // 將新行添加到 DOM 中
        tableBody1.appendChild(newRow);
    });
}
