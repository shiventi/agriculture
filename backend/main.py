import http.server
import socketserver

PORT = 8000

# Use the simple handler to serve files from the current directory
Handler = http.server.SimpleHTTPRequestHandler

print(f"Starting server... Open your browser to http://localhost:{PORT}")

# Start the server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")