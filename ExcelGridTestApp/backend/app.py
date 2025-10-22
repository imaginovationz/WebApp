from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
from urllib.parse import unquote
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTS = {".xlsx", ".xlsm"}


def sanitize_filename_exact(name: str) -> str:
    """
    Keep spaces and hyphens intact; block traversal and disallowed extensions.
    """
    # remove any directory components
    base = os.path.basename(name)
    # forbid slashes/backslashes just in case
    if "/" in base or "\\" in base:
        abort(400, "Invalid filename")
    # enforce extension
    ext = os.path.splitext(base)[1].lower()
    if ext not in ALLOWED_EXTS:
        abort(400, "Only .xlsx allowed")
    # optional: trim control chars
    base = "".join(ch for ch in base if ch >= " " )
    if not base:
        abort(400, "Empty filename")
    return base

@app.route("/api/upload_xlsx", methods=["POST"])
def upload_xlsx():
    if "file" not in request.files:
        return "No file", 400
    f = request.files["file"]

    # keep the original client name (with spaces), safely
    original = f.filename or "workbook.xlsx"
    try:
        original = unquote(original)
    except Exception:
        pass
    filename = sanitize_filename_exact(original)

    path = os.path.join(UPLOAD_DIR, filename)
    f.save(path)
    return jsonify({"saved_as": filename})

@app.route("/api/files/<path:filename>", methods=["GET"])
def get_file(filename):
    decoded = unquote(filename)
    path = os.path.join(UPLOAD_DIR, decoded)
    if os.path.isfile(path):
        return send_from_directory(UPLOAD_DIR, decoded)
    abort(404)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
