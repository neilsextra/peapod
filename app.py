from configparser import NoOptionError
from flask import Flask, Blueprint, render_template, request, send_file, Response
from os import environ
from io import StringIO

import io
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
from cryptography.x509.oid import NameOID, ObjectIdentifier
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import BestAvailableEncryption, load_pem_private_key, pkcs12
from cryptography.hazmat.backends import default_backend

import pycouchdb

import parameters as params

views = Blueprint('views', __name__, template_folder='templates')

app = Flask(__name__)

Npm(app)

app.register_blueprint(views)

def createInstance(server, name):
    print(f"Creating: {name}")
    
    instance = server.create(name)
    
    print(f"Created: {name}")
       
    return instance

def getInstance(server, name):

    instance = None

    try:
        instance = server.database(name)
    
    except pycouchdb.exceptions.NotFound as e:
        print(f"{type(e).__name__} was raised: {e}")

    if instance == None:
        instance = createInstance(server, name)

    return instance

@app.route("/")
def start():
    return render_template("index.html")

@app.route("/keys", methods=["GET"])
def keys():

    output = {}

    issuer = request.values.get('issuer').lower()
    organisation_name = request.values.get('org').lower()
    common_name = request.values.get('cn').lower()
    validity = int(request.values.get('validity'))
    key_size = int(request.values.get('keysize'))
    exponent = int(request.values.get('exponent'))

    print("[KEYS] - 'CERT: %s - %s - %s - %d - %d - %d" % (issuer, organisation_name, common_name, validity, key_size, exponent))

    one_day = datetime.timedelta(1, 0, 0)

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
    )
    public_key = private_key.public_key()
    builder = x509.CertificateBuilder()
    builder = builder.subject_name(x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, organisation_name)]))
    builder = builder.issuer_name(x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, issuer),
    ]))
    builder = builder.not_valid_before(datetime.datetime.today() - one_day)
    builder = builder.not_valid_after(datetime.datetime.today() + (one_day * validity))
    builder = builder.serial_number(x509.random_serial_number())
    builder = builder.public_key(public_key)
    builder = builder.add_extension(
        x509.SubjectAlternativeName(
            [x509.DNSName(issuer)]
        ),
        critical=False
    )
    
    builder = builder.add_extension(x509.UnrecognizedExtension(NameOID.USER_ID, b'b-3434374837483-548984958945894'),
        critical=False)

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
    output['serial-number'] = '{0:x}'.format(certificate.serial_number)
    output['issuer'] = certificate.issuer.rfc4514_string()
    output['subject'] = certificate.subject.rfc4514_string()
    output['key-size'] = private_key.key_size

    public_numbers = private_key.public_key().public_numbers()

    output['private-key-modulus'] = str(public_numbers.n)
    output['private-key-exponent'] = str(public_numbers.e)

    print("[KEYS] - KEY: %s" % output['private-key-modulus'])

    return json.dumps(output, sort_keys=True), 200
    
@app.route("/generate", methods=["POST"])
def generate():
    password = request.values.get('password')
    private_key_pem = request.values.get('private-key')
    certificate_pem = request.values.get('certificate')

    print(certificate_pem)
    print(private_key_pem)

    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

    key = load_pem_private_key(private_key_pem.encode(), None)

    p12 = pkcs12.serialize_key_and_certificates(
        b"friendlyname", key, certificate, None, BestAvailableEncryption(b"password")
    )

    return send_file(io.BytesIO(p12), mimetype='application/pdf')

if __name__ == "__main__":
    PORT = int(environ.get('PORT', '8000'))
    app.run(host='0.0.0.0', port=PORT)