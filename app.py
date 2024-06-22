from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from tensorflow.keras.models import load_model
import os
import numpy as np
from PIL import Image
from tensorflow.keras.preprocessing.image import img_to_array, array_to_img

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['GENERATED_FOLDER'] = 'static/generated'

model = load_model('AI-model/generator.h5')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['GENERATED_FOLDER'], exist_ok=True)

def preprocess_image(image_path):
    try:
        image = Image.open(image_path).convert('RGB')
        image = image.resize((128, 128)) 
        image = img_to_array(image)
        image = (image / 127.5) - 1.0  
        image = np.expand_dims(image, axis=0) 
        return image, None  
    except Exception as e:
        return None, str(e)  

def postprocess_image(image_array, output_path):
    try:
        image_array = (image_array[0] * 128) + 128  
        image = array_to_img(image_array)
        image.save(output_path)  
    except Exception as e:
        raise e

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify(error="No file part"), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify(error="No selected file"), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    input_image, preprocess_error = preprocess_image(file_path)

    if preprocess_error:
        return jsonify(error=f"Error processing image: {preprocess_error}"), 400

    try:
        enhanced_image = model.predict(input_image)
    except Exception as e:
        return jsonify(error=f"Error during model prediction: {str(e)}"), 500

    generated_image_path = os.path.join(app.config['GENERATED_FOLDER'], filename)

    try:
        postprocess_image(enhanced_image, generated_image_path)
    except Exception as e:
        return jsonify(error=f"Error saving enhanced image: {str(e)}"), 500

    return jsonify(image=filename)

@app.route('/result/<image>')
def result(image):
    return render_template('result.html', image=image)

@app.route("/error/<error>")
def error(error):
    return render_template('error.html', error=error)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/generated/<filename>')
def generated_file(filename):
    return send_from_directory(app.config['GENERATED_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
