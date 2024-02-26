function navigateTo(page) {
    if (page === 'index') {
        window.location.href = '/';  // '/' 是 Flask 應用中的首頁路徑
    } else if (page === 'longshort') {
        window.location.href = '/longshort';  // '/longshort' 是你的 longshort.html 的路徑
    }
}

// 初始化表格
updateTableData();
updateTotalTableData();
updateRealTimeTableData();
updatetopblockData(1);
// longshort-table
let selectedInfoListButton1 = 'BTC';
let selectedInfoListButton3 = '5 minute';

// 設定初始文字
document.getElementById('infoListButton1').textContent = selectedInfoListButton1;
document.getElementById('infoListButton3').textContent = selectedInfoListButton3;

document.getElementById('infoListButton1').addEventListener('click', function (event) {
    showOptionsList('infoListButton1');
    // 實作 info-list-block 按鈕1 的資料請求
    fetch('/api/longshort_coin_names')
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新列表等
            console.log('Coin Names:', data);
            updateButtonText('infoListButton1', selectedInfoListButton1);
            updateTableData();
        });
    event.stopPropagation();
});

document.getElementById('infoListButton3').addEventListener('click', function (event) {
    showOptionsList('infoListButton3');
    // 實作 info-list-block 按鈕2 的資料請求
    fetch('/api/longshort_time_ranges')
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新列表等
            console.log('Time Ranges:', data);
            updateButtonText('infoListButton3', selectedInfoListButton3);
            updateTableData();
        });
    event.stopPropagation();
});

// 在按鈕點擊後顯示列表
function showOptionsList(buttonId) {
    hideOptionsList(); // 隱藏已存在的列表

    const selectedButton = document.getElementById(buttonId);

    const optionsList = document.createElement('ul');
    optionsList.className = 'options-list';

    // 使用 fetch 發送請求，根據按鈕 ID 確定要請求的 API
    let apiUrl;

    if (buttonId === 'infoListButton1') {
        apiUrl = '/api/longshort_coin_names';
    } else if (buttonId === 'infoListButton3') {
        apiUrl = '/api/longshort_time_ranges';
    } else if (buttonId === 'realTimeButton1') {
        apiUrl = '/api/longshort_real_time_Exchanges';
    } else if (buttonId === 'realTimeButton2') {
        apiUrl = '/api/longshort_real_time_coinname';
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
    } else if (buttonId === 'infoListButton3') {
        selectedInfoListButton3 = text;
    }
}


// 發送資料請求並更新表格
function updateTableData() {
    // 獲取目前 infoListButton1 和 infoListButton3 上的文字
    const selectedInfoListButton1 = document.getElementById('infoListButton1').textContent;
    const selectedInfoListButton3 = document.getElementById('infoListButton3').textContent;

    // 發送 AJAX 請求，根據按鈕上的文字更新資料
    fetch(`/api/longshort_update_data?coinname=${selectedInfoListButton1}&time_range=${selectedInfoListButton3}`)
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

        // 插入新行
        newRow.innerHTML = `
            <td>
                <div style="position: relative; display: inline-block;">
                    <img src="static/img/${row[3]}.png" style="width: 24px; height: 24px;">
                    ${row[3]} <!-- 在圖片後面插入文字 -->
                </div>
            </td>
            <td>
                <div class="percentage-bar-container">
                    <div class="percentage-bar green-bar" style="width: ${row[4]}%;">${row[4]}%</div>
                    <div class="percentage-bar red-bar" style="width: ${row[5]}%;">${row[5]}%</div>
                </div>
            </td>
            <td>long: ${row[6]}</td>
            <td>short: ${row[7]}</td>
        `;
        tableBody.insertBefore(newRow, tableBody.firstChild);
    });
}


//longshort-realtime-table-----------------------------------------------
// 預設值

// 發送資料請求並更新實時表格
function updateRealTimeTableData() {
    // 獲取目前 realTimeButton1 和 realTimeButton2 上的文字


    // 發送 AJAX 請求，根據按鈕上的文字更新實時表格數據
    fetch(`/api/longshort_update_real_time_data?exchanges=All&coinname=All`)
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

///////////////////////////////////////////////////////////////////////////
// 每頁顯示的資料數量
const itemsPerPage = 20;

// 當前頁碼
let currentPage = 1;

// 全部資料
let allData = [];

// 發送資料請求並更新表格
function updateTotalTableData() {
    // 發送 AJAX 請求，根據按鈕上的文字更新資料
    fetch(`/api/longshort_totaltable_update_data`)
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

        // 使用條件運算子檢查資料是否為 undefined，如果是，則顯示為 0
        const formattedRow5 = row[5] !== undefined ? row[5] : 0;
        const formattedRow7 = row[7] !== undefined ? row[7] : 0;
        const formattedRow9 = row[9] !== undefined ? row[9] : 0;
        const formattedRow4 = row[4] !== undefined ? row[4] : 0;
        const formattedRow6 = row[6] !== undefined ? row[6] : 0;
        const formattedRow8 = row[8] !== undefined ? row[8] : 0;

        const newRow = document.createElement('tr');

        // 插入新行
        newRow.innerHTML = `
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${row[2]}</td>
            <td style="color: ${textColor};">${row[3]}</td>
            <td style="color: #00DB00">${formattedRow4}</td>
            <td style="color: red">${formattedRow5}</td>
            <td style="color: #00DB00">${formattedRow6}</td>
            <td style="color: red">${formattedRow7}</td>
            <td style="color: #00DB00">${formattedRow8}</td>
            <td style="color: red">${formattedRow9}</td>
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

///////////////////////////////////////////////////////////////////////
// 發送資料請求並更新實時表格
document.addEventListener('DOMContentLoaded', function () {
    // 頁面載入之初預設 "1hr_btn" 被點擊
    document.getElementById('1hr_btn').click();

    // 監聽按鈕點擊事件
    const buttons = document.querySelectorAll('.block-buttons button');
    buttons.forEach(button => {
        button.addEventListener('click', function () {
            // 移除所有按鈕的染色
            buttons.forEach(b => b.classList.remove('selected'));

            // 染色被點擊的按鈕
            this.classList.toggle('selected', true);

            // 更新實時表格數據
            const timeRange = this.getAttribute('data-time-range');
            updatetopblockData(timeRange);
        });
    });
});


function updatetopblockData(timeRange) {
    // 發送 AJAX 請求，根據按鈕上的文字更新實時表格數據
    fetch(`/api/longshort_update_topblock_data?time_range=${timeRange}`)
        .then(response => response.json())
        .then(data => {
            // 在這裡處理返回的數據，例如更新實時表格的內容
            console.log('Updated top block data:', data);
            updateBlockTable('#longblock', data.left); // 传递左侧表格数据
            updateBlockTable('#shortblock', data.right); // 传递右侧表格数据
        })
        .catch(error => {
            console.error('Error updating top block data:', error);
        });
}

function updateBlockTable(blockType, data) {
    const formattedHour = data[0][1] + "小時";
    const blockSelector = blockType

    const newData = [
        { selector: `${blockSelector} .exchange:nth-child(1) .left span`, value: formattedHour + "虛擬貨幣交易" },
        {
            selector: `${blockSelector} .exchange:nth-child(1) .right .number:nth-child(1)`,
            value: data[0][2], color: data[0][2] >= 0 ? "#2ecc71" : "#e74c3c", prefix: data[0][2] >= 0 ? "+" : ""
        },
        { selector: `${blockSelector} .exchange:nth-child(1) .right .number:nth-child(2)`, value: data[0][3] },
        { selector: `${blockSelector} .exchange:nth-child(2) .left span.details`, value: "小額交易地址" },
        {
            selector: `${blockSelector} .exchange:nth-child(2) .right .number:nth-child(1)`,
            value: data[0][4], color: data[0][4] >= 0 ? "#2ecc71" : "#e74c3c", prefix: data[0][4] >= 0 ? "+" : ""
        },
        { selector: `${blockSelector} .exchange:nth-child(2) .right .number:nth-child(2)`, value: data[0][5] },
        { selector: `${blockSelector} .exchange:nth-child(3) .left span.details`, value: "大額賣單交易地址" },
        {
            selector: `${blockSelector} .exchange:nth-child(3) .right .number:nth-child(1)`,
            value: data[0][6], color: data[0][6] >= 0 ? "#2ecc71" : "#e74c3c", prefix: data[0][6] >= 0 ? "+" : ""
        },
        { selector: `${blockSelector} .exchange:nth-child(3) .right .number:nth-child(2)`, value: data[0][7] },
        { selector: `${blockSelector} .exchange:nth-child(4) .left div.details`, value: "大額買單交易地址" },
        {
            selector: `${blockSelector} .exchange:nth-child(4) .right .number:nth-child(1)`,
            value: data[0][8], color: data[0][8] >= 0 ? "#2ecc71" : "#e74c3c", prefix: data[0][8] >= 0 ? "+" : ""
        },
        {
            selector: `${blockSelector} .exchange:nth-child(4) .right .number:nth-child(2)`,
            value: data[0][9], color: data[0][9] >= 1 ? "#2ecc71" : "#e74c3c"
        },
        { selector: `${blockSelector} .exchange:nth-child(5) .right .number`, value: data[0][10] }
    ];

    newData.forEach(item => {
        const element = document.querySelector(item.selector);
        if (element) {
            element.textContent = item.prefix ? item.prefix + item.value : item.value;
            if (item.color) {
                element.style.color = item.color;
            }
        }
    });
}