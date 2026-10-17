#!/usr/bin/env python3
"""สร้าง arcade-demo-pub (หน้าทดลองสำหรับ Artifact) จาก arcade-site: แก้ลิงก์ให้ชี้ไปไฟล์ index.html และใช้ platform.js แบบ localStorage"""
import os, re, shutil
H = '/home/claude'; S = H + '/arcade-site'; D = H + '/arcade-demo-pub'
for g in ['amath', 'sudoku', 'game24', 'chess', 'checkers', 'profile']:
    t = open('%s/%s/index.html' % (S, g), encoding='utf8').read()
    t = t.replace('href="../#', 'href="../index.html#').replace('href="../"', 'href="../index.html"')
    t = re.sub(r'href="\.\./(amath|sudoku|game24|chess|checkers|profile)/"', r'href="../\1/index.html"', t)
    t = t.replace("href=\"../'+g[0]+'/\"", "href=\"../'+g[0]+'/index.html\"")
    os.makedirs('%s/%s' % (D, g), exist_ok=True)
    open('%s/%s/index.html' % (D, g), 'w', encoding='utf8').write(t)
shutil.copy(H + '/arcade-demo/platform.js', D + '/platform.js')
print('demo ok')
