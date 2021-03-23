net start mongodb
setlocal
cd /d %~dp0
node server.js
net stop mongodb
pause