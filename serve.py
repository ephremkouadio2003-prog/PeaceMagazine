#!/usr/bin/env python3
"""
Serveur de développement pour Peace Magazine.

`python3 -m http.server` laisse le navigateur mettre la page en cache : on se
retrouve alors avec un ancien index.html associé aux nouveaux scripts, et plus
rien ne fonctionne (galerie muette, vidéos introuvables). Ce serveur interdit
toute mise en cache, donc un simple rechargement suffit toujours.
"""

import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def send_response(self, code, message=None):
        # Ne jamais répondre « 304 Non modifié » : le navigateur réutiliserait
        # sa copie en cache, ce qu'on cherche justement à éviter.
        if code == 304:
            code = 200
        super().send_response(code, message)

    def log_message(self, fmt, *args):
        code = str(args[1]) if len(args) > 1 else ''
        if code.startswith('4') or code.startswith('5'):
            sys.stderr.write(f'  ⚠️  {args[0]} → {code}\n')


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == '__main__':
    with Server(('', PORT), NoCacheHandler) as httpd:
        print(f'Peace Magazine → http://localhost:{PORT}')
        print('Cache désactivé. Ctrl+C pour arrêter.\n')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nArrêté.')
