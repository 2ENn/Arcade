import base64
def block():
    b=base64.b64encode(open('/home/claude/emo/sheet.webp','rb').read()).decode()
    return open('/home/claude/emo/emoji.tpl.js').read().replace('@SHEET@',b)
