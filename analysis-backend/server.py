from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from dotenv import load_dotenv

load_dotenv()

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Hello, world!')

class CustomHTTPRequestHandler(BaseHTTPRequestHandler):

    def _hierarchical_clustering(self):
        """ Controller for hierarchical clustering endpoint (/api/h-clustering).
        Query parameters
        """
        content_length = int(self.headers['Content-Length'])  # Get the size of data
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        print(data)
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def do_GET(self):
        # Check the path of the request
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Hello, world!')
        elif self.path == '/api/h-clustering':
            # Example data
            data = {"message": "This is some data from the API."}
            # Convert the data dictionary to a JSON string
            json_data = json.dumps(data)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            # Write the JSON data to the response
            self.wfile.write(json_data.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'404 Not Found')
    
    def do_POST(self):
        if self.path == '/api/h-clustering':
            self._hierarchical_clustering()

if __name__ == '__main__':
    httpd = HTTPServer(('localhost', 8000), SimpleHTTPRequestHandler)
    print("Serving HTTP on port 8000...")
    httpd.serve_forever()