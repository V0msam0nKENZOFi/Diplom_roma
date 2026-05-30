@echo off
chcp 65001 >nul
cd /d "%~dp0"
python generate_figures.py > generate_log.txt 2>&1
echo DONE >> generate_log.txt
