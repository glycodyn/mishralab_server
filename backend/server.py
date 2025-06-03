# server.py
from flask import Flask, request, jsonify, send_from_directory
import os
import subprocess
import uuid

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    input_file = request.files['file']
    filename = str(uuid.uuid4()) + '_' + input_file.filename
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    input_file.save(filepath)

    # Run AlphaFold in Docker — adjust paths and volumes accordingly
    output_subdir = os.path.join(OUTPUT_FOLDER, filename.split('.')[0])
    os.makedirs(output_subdir, exist_ok=True)

    try:
        subprocess.run([
            'docker', 'run', '--rm',
            '-v', f"{os.path.abspath(UPLOAD_FOLDER)}:/app/input",
            '-v', f"{os.path.abspath(OUTPUT_FOLDER)}:/app/output",
            'alphafold3_image_name',  # change to your image name
            '--input', f"/app/input/{filename}",
            '--output', f"/app/output/{filename.split('.')[0]}"
        ], check=True)
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

    return jsonify({'message': 'Prediction complete', 'output_folder': filename.split('.')[0]}), 200

@app.route('/download/<path:filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(OUTPUT_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
