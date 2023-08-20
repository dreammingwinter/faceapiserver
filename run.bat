net start mongodb
setlocal
cd /d %~dp0
npm run start
net stop mongodb
pause
