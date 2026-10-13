# ไฟล์ต้นฉบับของ Taoob Arcade

เว็บที่พร้อมใช้งานอยู่ที่โฟลเดอร์นอก (`index.html`, `chess/`, `sudoku/` ...) — โฟลเดอร์นี้คือไฟล์ต้นฉบับที่ใช้สร้างมันขึ้นมา

| ไฟล์ | คืออะไร |
|---|---|
| `amath.html`, `sudoku.html`, `game24.html` | โค้ดต้นฉบับของเกมนั้นๆ (ไฟล์เดียวจบ) |
| `bg/` | หมากรุก + หมากฮอส: `*-core.js` กติกา/AI, `*-ui.js` หน้าจอ, `common.js/css` ส่วนที่ใช้ร่วมกัน (ห้อง คนดู ฯลฯ), `build.py` รวมเป็น `chess.html` / `checkers.html` |
| `emo/` | ระบบอิโมจิ: `emoji.tpl.js` โค้ด, `sheet.webp` สติกเกอร์ 16 ตัว, `stickers-original.png` รูปต้นฉบับ, `apply.py` ฝังเข้าเกม |
| `arcade-build.py` | ใส่แถบเมนู Arcade + ระบบเตือนก่อนออก แล้วสร้างโฟลเดอร์เกมของเว็บ |
| `make-demo.py` | สร้างหน้าเดโมแบบรวมหน้าเดียว |

## ขั้นตอนสร้างเว็บใหม่หลังแก้เกม
สคริปต์ใช้พาธ `/home/claude` (แก้ตัวแปร `H` ต้นไฟล์ถ้าจะรันที่อื่น) ให้วางไฟล์ในโฟลเดอร์เดียวกันแล้วรันตามลำดับ:

```
python3 emo/apply.py      # ฝังอิโมจิลงเกม
python3 bg/build.py       # สร้าง chess.html / checkers.html
python3 arcade-build.py   # สร้างโฟลเดอร์เว็บ arcade-site/
```
จากนั้นนำเนื้อใน `arcade-site/` ไปวางทับรากของ repo
