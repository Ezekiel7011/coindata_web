# 虛擬貨幣資訊平台

## 簡介

這是一個基於 Flask 框架的 Web 應用，旨在提爆倉資料和多空比資料之平台。它利用 MySQL 作為後端資料庫，並通過一個直觀的 Web 界面與用戶互動。

## 功能

- **爆倉 API**：處理與資產爆倉相關的請求。
- **多空比 API**：提供關於多空比的資訊和分析。
- **用戶界面**：提供用戶友好的 Web 界面，用於展示 API 的使用和結果。

## 安裝指南

### 前提條件

- Python 3.6+
- MySQL

### 安裝步驟

1. clone 專案到本地：

```bash
git clone <專案Git倉庫URL>
```

2. 進入專案目錄：

```bash
cd 專案目錄
```

3. 安裝依賴：

```bash
pip install -r requirements.txt
```

## 配置

- 根據`db_config`目錄下的`liquidation_db_config.txt`和`lonshort_db_config.txt`文件配置資料庫連接。
- `db`目錄下的`schema.sql`有提供部分資料供網頁展示。
- 修改`app.py`中的配置（如果需要）。

## 運行應用

```bash
python app.py
```

訪問 http://localhost:5000 （或配置的端口）來查看應用。

## 開發

- `app.py`：應用的主入口和路由配置。
- `liquidation_api.py`和`longshort_api.py`：實現 API 邏輯。
- `templates/`：存放 HTML 模板。
- `static/`：存放 CSS 和 JavaScript 文件。
