from configparser import NoOptionError
from flask import Flask, Blueprint, render_template, request, send_file, Response
from os import environ
from io import StringIO

import json
import csv
import codecs

from pathlib import Path
import datetime
from datetime import timedelta
from flask_npm import Npm
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import serialization

import parameters as params

views = Blueprint('views', __name__, template_folder='templates')

app = Flask(__name__)

Npm(app)

app.register_blueprint(views)

@app.route("/")
def start():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def save_document():
    output = []

    try:

        files = request.files

        for file in files:
            fileContent = request.files.get(file)
            data = []
            stream = codecs.iterdecode(fileContent.stream, 'utf-8')
            for row in csv.reader(stream, dialect=csv.excel):
                if row:
                    print(row)
                    data.append(row)
                output.append({
                     "document": data
                })

    except Exception as e:

        output = [] 

        output.append({
            "status": 'fail',
            "error": str(e)
        })

    return json.dumps(output, sort_keys=True), 200

@app.route("/keys", methods=["GET"])
def keys():

    output = {}

    issuer = request.values.get('issuer').lower()
    organisation_name = request.values.get('org').lower()
    common_name = request.values.get('cn').lower()

    print("[KEYS] - 'CERT: %s - %s - %s" % (issuer, organisation_name, common_name))

    one_day = datetime.timedelta(1, 0, 0)

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()
    builder = x509.CertificateBuilder()
    builder = builder.subject_name(x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, organisation_name)]))
    builder = builder.issuer_name(x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, request.remote_addr),
    ]))
    builder = builder.not_valid_before(datetime.datetime.today() - one_day)
    builder = builder.not_valid_after(datetime.datetime.today() + (one_day * 30))
    builder = builder.serial_number(x509.random_serial_number())
    builder = builder.public_key(public_key)
    builder = builder.add_extension(
        x509.SubjectAlternativeName(
            [x509.DNSName(issuer)]
        ),
        critical=False
    )
    builder = builder.add_extension(
        x509.BasicConstraints(ca=False, path_length=None), critical=True,
    )
    certificate = builder.sign(
        private_key=private_key, algorithm=hashes.SHA256(),
    )

    bytes = certificate.public_bytes(serialization.Encoding.PEM)

    output['certificate'] = bytes.decode("UTF-8")

    bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    output['private-key'] = bytes.decode("UTF-8")
    output['serial-number'] = certificate.serial_number
    output['issuer'] = certificate.serial_number

    return json.dumps(output, sort_keys=True), 200

if __name__ == "__main__":
    PORT = int(environ.get('PORT', '8000'))
    app.run(host='0.0.0.0', port=PORT)