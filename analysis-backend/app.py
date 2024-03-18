from hca import create_distance_matrix

import os

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)
load_dotenv()

host = os.getenv('DB_HOST', 'default_host')
user = os.getenv('DB_USER', 'default_user')
password = os.getenv('DB_PASSWORD', 'default_password')
database = os.getenv('DB_NAME', 'default_db')

DB_CONFIG = {
    'host': host,
    'user': user,
    'password': password,
    'database': database
}

def determine_functional_oncogenes(sample: str) -> set[str]:
    """ Query for the set of functional oncogenes in a sample.

    Args:
        sample (str): Sample name

    Returns:
        set[str]: HGNC symbols of functional oncogenes for the sample.
    """
    conn = mysql.connector.connect(**DB_CONFIG)
    # TODO: parameterize
    query = f"SELECT Hugo_Symbol FROM TCGA2015 WHERE SampleName = '{sample}' AND RSEM_Zscore>3 AND CNA>3 AND oncokbAnnotated is true"
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query)
    rows = cursor.fetchall()
    return rows
    

def compute_distance(sample1, sample2):
    """ Computes genomic distance metric between two samples. This is just a temporary metric for now until
    a better approach is defined. We'll determine functional oncogene sets (i.e. sets of overexpressed, amplified oncogenes)
    in the two samples, then count the overlap.
    """
    return 'to implement'
    

@app.route('/')
def home():
    return "Welcome to the Flask API!"

@app.route('/api/h-clustering', methods=['POST'])
def handle_data():
    """ This endpoint should provide the following:
    """
    data = request.json
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM testdata")
    return jsonify({"message": "Data received", "data": data}), 200

@app.route('/api/distance-matrix', methods=['POST'])
def distance_matrix():
    dist_mat = create_distance_matrix(include_zeros=False, include_diagonal=False)
    return jsonify(dist_mat), 200

@app.route('/api/functional-oncogenes', methods=['GET'])
def functional_oncogenes():
    sample = request.args.get('sample', default=None, type=str)
    functional_oncogenes_list = determine_functional_oncogenes(sample)
    return jsonify(functional_oncogenes_list), 200

if __name__ == '__main__':
    app.run(debug=True)