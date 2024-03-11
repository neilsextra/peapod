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

import base64

from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID, ObjectIdentifier
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import BestAvailableEncryption, load_pem_private_key, pkcs12
from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.fernet import Fernet, MultiFernet

import pycouchdb

import parameters as params

views = Blueprint('views', __name__, template_folder='templates')

app = Flask(__name__)

Npm(app)

app.register_blueprint(views)

template = {
    "passport" :{
        "certificate": ""
    },
    "certificates": {
        "active": []
    },
    "keys" : {
    }

}

def create_instance(server, name):
    print(f"Creating: {name}")
    
    instance = server.create(name)
    
    print(f"Created: {name}")
       
    return instance

def get_instance(server, name):

    instance = None

    try:
        instance = server.database(name)
    
    except pycouchdb.exceptions.NotFound as e:
        print(f"{type(e).__name__} was raised: {e}")

    if instance == None:
        instance = create_instance(server, name)

    return instance

def get_document(couchdb_URL, id):
    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)

    document = instance.get(id)

    return document

def save(instance, document):
    output = []
 
    try:
        
        annotated_document = instance.save(document)

        return annotated_document

    except Exception as e:
        print(f"{type(e).__name__} was raised: {e}")

        output.append({
            "status": 'fail',
            "error": str(e)
        })   

    return output

def encrypt_key(certificate, content):

    ciphertext = certificate.public_key().encrypt(
            content,
            padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

    return base64.b64encode(ciphertext).decode("UTF-8")

def encrypt_content(key, content):
    f = Fernet(key)
    token = f.encrypt(content)
    print(token)

    return token

@app.route("/")
def start():
    return render_template("index.html")

@app.route("/connect", methods=["GET"])
def connect():

    output = {}

    couchdb_URL = request.values.get('couchdbURL')

    print("[CONNECT] - 'URL: %s' " % (couchdb_URL))

    server = pycouchdb.Server(couchdb_URL)

    get_instance(server, params.PEAPOD_DATABASE)
    
    output['version'] = server.info()['version']
    
    print("[CONNECTED] - 'Version: %s' " % (output['version']))

    return json.dumps(output, sort_keys=True), 200

@app.route("/keys", methods=["GET"])
def keys():

    output = {}

    couchdb_URL = request.values.get('couchdbURL')

    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)

    document = save(instance, template)

    email = request.values.get('email').lower()
    issuer = request.values.get('issuer').lower()
    organisation_name = request.values.get('org').lower()
    common_name = request.values.get('cn').lower()
    validity = int(request.values.get('validity'))
    key_size = int(request.values.get('keysize'))
    exponent = int(request.values.get('exponent'))

    print("[KEYS] - 'CERT: %s - %s - %s - %s - %d - %d - %d" % (email, issuer, organisation_name, common_name, validity, key_size, exponent))

    one_day = datetime.timedelta(1, 0, 0)

    private_key = rsa.generate_private_key(
        public_exponent=exponent,
        key_size=key_size,
    )
    public_key = private_key.public_key()
    builder = x509.CertificateBuilder()
    builder = builder.subject_name(x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, organisation_name),
        x509.NameAttribute(NameOID.EMAIL_ADDRESS, email)]))
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
    
    builder = builder.add_extension(x509.UnrecognizedExtension(NameOID.USER_ID, document["_id"].encode()),
        critical=False)

    builder = builder.add_extension(
        x509.BasicConstraints(ca=False, path_length=None), critical=True,
    )

    certificate = builder.sign(
        private_key=private_key, algorithm=hashes.SHA256(),
    )

    bytes = certificate.public_bytes(serialization.Encoding.PEM)

    output['certificate'] = bytes.decode("UTF-8")

    document["passport"]["certificate"] = bytes.decode("UTF-8") 

    save(instance, document)

    bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    output['id'] =  document["_id"]
    output['private-key'] = bytes.decode("UTF-8")
    output['serial-number'] = '{0:x}'.format(certificate.serial_number)
    output['issuer'] = certificate.issuer.rfc4514_string()
    output['subject'] = certificate.subject.rfc4514_string()
    output['email'] = certificate.subject.get_attributes_for_oid(NameOID.EMAIL_ADDRESS)[0].value
    output['id'] = document["_id"]

    output['key-size'] = private_key.key_size

    public_numbers = private_key.public_key().public_numbers()

    output['private-key-modulus'] = str(public_numbers.n)
    output['private-key-exponent'] = str(public_numbers.e)
    output['document'] = document

    return json.dumps(output, sort_keys=True), 200
    
@app.route("/generate", methods=["POST"])
def generate():
    password = request.values.get('password')
    private_key_pem = request.values.get('private-key')
    certificate_pem = request.values.get('certificate')

    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

    key = load_pem_private_key(private_key_pem.encode(), None)

    p12 = pkcs12.serialize_key_and_certificates(
        b"peo-pod-passport", key, certificate, None, BestAvailableEncryption(password.encode())
    )

    return send_file(io.BytesIO(p12), mimetype='application/pdf')

@app.route("/open", methods=["POST"])
def open():
    output = {}

    couchdb_URL = request.values.get('couchdbURL')
    password = request.values.get('password')

    print("[OPEN] Files: %d " % len(request.files))

    print("[OPEN] - URL: '%s' " % (couchdb_URL))
    print("[OPEN] - Password: '%s' " % (password))

    try:

        files = request.files

        for file in files:

            passport = request.files.get(file).stream.read()
            artifacts = pkcs12.load_key_and_certificates(passport, password.encode(), backend=None)

            print("[OPEN] - Tuples: '%d' " % len(artifacts))

            for artifact in artifacts:
                print("[OPEN] - Object: '%s' " %  type(artifact).__name__)

                if  type(artifact).__name__ == "_RSAPrivateKey":
                    print("[OPEN] - Decoding Key")

                    public_numbers = artifact.public_key().public_numbers()

                    output['private-key-modulus'] = str(public_numbers.n)
                    output['private-key-exponent'] = str(public_numbers.e)
                    
                    output['key-size'] = artifact.key_size

                    bytes = artifact.private_bytes(
                                 encoding=serialization.Encoding.PEM,
                                 format=serialization.PrivateFormat.TraditionalOpenSSL,
                                 encryption_algorithm=serialization.NoEncryption()
                    )

                    output['private-key'] = bytes.decode("UTF-8")

                elif type(artifact).__name__ == "Certificate":
                    print("[OPEN] - Decoding Certifcate")

                    bytes = artifact.public_bytes(serialization.Encoding.PEM)

                    output['certificate'] = bytes.decode("UTF-8")
                    
                    output['issuer'] = artifact.issuer.rfc4514_string()
                    output['subject'] = artifact.subject.rfc4514_string()
                    output['email'] = artifact.subject.get_attributes_for_oid(NameOID.EMAIL_ADDRESS)[0].value
                    output['serial-number'] = '{0:x}'.format(artifact.serial_number)

                    user_id = artifact.extensions.get_extension_for_oid(NameOID.USER_ID)

                    print(user_id.value.value.decode("utf-8"))

                    output['id'] = user_id.value.value.decode("utf-8")

                    output['document'] = get_document(couchdb_URL, output['id'])

                    print(output['document'])

    except Exception as e:

        print("[OPEN] - ERROR '%s'" % str(e))
        output = [] 

        output.append({
            "status": 'fail',
            "error": str(e)
        })

    return json.dumps(output, sort_keys=True), 200

@app.route("/upload", methods=["POST"])
def upload():
    output = {}

    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')

    print("[UPLOAD] Files: %d " % len(request.files))
    print("[UPLOAD] - URL: '%s' " % (couchdb_URL))
    print("[UPLOAD] - Certificate: '%s' " % (certificate_pem))

    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)

    try:

        certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

        user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

        document = instance.get(user_id)
        certificate = x509.load_pem_x509_certificate(certificate_pem.encode())        
        files = request.files

        for file in files:

            content = request.files.get(file)
            
            key = Fernet.generate_key()

            encrypted_key = encrypt_key(certificate, key)

            document["keys"][content.filename] = encrypted_key 
            
            document = save(instance, document)

            encrypted_content = encrypt_content(key, content.stream.read())

            document = instance.put_attachment(document, encrypted_content , filename=content.filename, content_type=content.mimetype)

            output['document'] = document

    except Exception as e:

        print("[UPLOAD] - ERROR '%s'" % str(e))
        output = [] 

        output.append({
            "status": 'fail',
            "error": str(e)
        })

    return json.dumps(output, sort_keys=True), 200
 
 
if __name__ == "__main__":
    print("Listening: "  + environ.get('PORT', '8000'))
    PORT = int(environ.get('PORT', '8000'))
    app.run(host='0.0.0.0', port=PORT)