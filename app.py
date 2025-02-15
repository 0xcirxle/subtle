from flask import Flask
from flask_cors import CORS
from src.routes import api
from src.config import Config
import os

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(api, url_prefix='/api')

# Ensure required directories exist
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.TEMP_FOLDER, exist_ok=True)
os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)

if __name__ == '__main__':
    app.run(port=5001, debug=True) 