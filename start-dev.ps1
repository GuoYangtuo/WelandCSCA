# CSCA 项目调试启动脚本 (PowerShell版本)
# 设置控制台编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CSCA 项目调试启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 是否安装
try {
    $nodeVersion = node --version
    Write-Host "[信息] 检测到 Node.js 版本: $nodeVersion" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[错误] 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

# 获取脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 检查并安装服务器端依赖
if (-not (Test-Path "$scriptPath\server\node_modules")) {
    Write-Host "[警告] 服务器端依赖未安装，正在安装..." -ForegroundColor Yellow
    Set-Location "$scriptPath\server"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 服务器端依赖安装失败" -ForegroundColor Red
        Read-Host "按 Enter 键退出"
        exit 1
    }
    Set-Location $scriptPath
    Write-Host "[成功] 服务器端依赖安装完成" -ForegroundColor Green
    Write-Host ""
}

# 检查并安装客户端依赖
if (-not (Test-Path "$scriptPath\client\node_modules")) {
    Write-Host "[警告] 客户端依赖未安装，正在安装..." -ForegroundColor Yellow
    Set-Location "$scriptPath\client"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] 客户端依赖安装失败" -ForegroundColor Red
        Read-Host "按 Enter 键退出"
        exit 1
    }
    Set-Location $scriptPath
    Write-Host "[成功] 客户端依赖安装完成" -ForegroundColor Green
    Write-Host ""
}

# 启动服务器端
Write-Host "[信息] 正在启动服务器端..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\server'; npm run dev" -WindowStyle Normal

# 等待服务器启动
Start-Sleep -Seconds 2

# 启动客户端
Write-Host "[信息] 正在启动客户端..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\client'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "服务器端和客户端已在新的窗口中启动" -ForegroundColor Yellow
Write-Host "关闭对应的窗口即可停止对应的服务" -ForegroundColor Yellow
Write-Host ""
Read-Host "按 Enter 键退出"
