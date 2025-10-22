from app import create_app
from read_config import debug, port
from waitress import serve

app = create_app()

if __name__ == '__main__':
    serve(app,host='0.0.0.0',port=port)