@echo off
chcp 65001 >nul
echo ========================================
echo    CSCA 项目调试启动脚本
echo ========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [信息] 检测到 Node.js 版本:
node --version
echo.

REM 检查依赖是否已安装
if not exist "server\node_modules\" (
    echo [警告] 服务器端依赖未安装，正在安装...
    cd server
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 服务器端依赖安装失败
        pause
        exit /b 1
    )
    cd ..
    echo [成功] 服务器端依赖安装完成
    echo.
)

if not exist "client\node_modules\" (
    echo [警告] 客户端依赖未安装，正在安装...
    cd client
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 客户端依赖安装失败
        pause
        exit /b 1
    )
    cd ..
    echo [成功] 客户端依赖安装完成
    echo.
)

echo [信息] 正在启动服务器端...
start "CSCA-服务器" cmd /k "cd /d %~dp0server && npm run dev"

REM 等待服务器启动
timeout /t 2 /nobreak >nul

echo [信息] 正在启动客户端...
start "CSCA-客户端" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ========================================
echo    启动完成！
echo ========================================
echo 服务器端和客户端已在新的窗口中启动
echo 关闭对应的窗口即可停止对应的服务
echo.
pause
