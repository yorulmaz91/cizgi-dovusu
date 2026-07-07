@echo off
cd /d "%~dp0"
echo GitHub'a gonderiliyor...
git push origin main
if %errorlevel%==0 (
  echo.
  echo TAMAM! 1-2 dakika icinde su adreste guncellenir:
  echo https://yorulmaz91.github.io/cizgi-dovusu/
) else (
  echo.
  echo Bir sorun cikti. Claude'a "GONDER.bat hata verdi" yazabilirsin.
)
pause
