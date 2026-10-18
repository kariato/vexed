#!/usr/bin/env python3
"""SPDX-License-Identifier: GPL-2.0-or-later. Test only extracted ZIP content."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import unquote, urlsplit
import zipfile

HERE = Path(__file__).resolve().parent
PREFIX = '/html/12345/'
with TemporaryDirectory(prefix='vexed-itch-test-') as folder:
    root = Path(folder)
    with zipfile.ZipFile(HERE / 'releases/vexed-itch.zip') as archive:
        for name in archive.namelist():
            if name.startswith('/') or '..' in Path(name).parts:
                raise ValueError('Unsafe ZIP member')
        archive.extractall(root)
    class Handler(SimpleHTTPRequestHandler):
        def do_GET(self):
            path = unquote(urlsplit(self.path).path)
            if path == '/embed.html':
                body = b'<!doctype html><html lang="en"><head><title>itch.io embed test</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe title="Vexed game" src="/html/12345/index.html" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" style="display:block;border:0;width:100%;height:100dvh"></iframe></body></html>'
                self.send_response(200); self.send_header('Content-Type', 'text/html'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
                return
            if not path.startswith(PREFIX) or path.endswith('/'):
                self.send_error(403); return
            super().do_GET()
        def translate_path(self, path):
            name = unquote(urlsplit(path).path)[len(PREFIX):]
            if '..' in Path(name).parts:
                return str(root / '_forbidden_')
            return str(root / name)
        def log_message(self, format, *args):
            pass
    ThreadingHTTPServer(('127.0.0.1', 4177), Handler).serve_forever()
