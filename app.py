from configparser import NoOptionError
from flask import Flask, Blueprint, render_template, request, send_file, jsonify, Response
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
from zipfile import ZipFile, ZipInfo

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
    "owners" :{
    },
    "folder": {
        "readme.md": "" 
    },
    "others": {}

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

    return token

def decrypt_content(key, content):
    f = Fernet(key)
    decrypted_content = f.decrypt(content)

    return decrypted_content

def decrypt_key(private_key, ciphertext):
    plaintext = private_key.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

    return plaintext

def get_session_key(document, certificate_pem, private_key_pem):
    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())     

    private_key = serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
        )

    encoded_key = document['owners'][certificate.issuer.rfc4514_string()]['{0:x}'.format(certificate.serial_number)]["key"]
    session_key = decrypt_key(private_key, base64.b64decode(encoded_key))

    return session_key

def get_pod(instance, certificate_pem):
    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())
    user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

    document = instance.get(user_id)

    return document

def expand_others(document):
    output = []
    try:

        others = document['others']

        issuers = others.keys()

        for issuer in issuers:
            serials = others[issuer].keys()

            for serial in serials:

                certificate = x509.load_pem_x509_certificate(others[issuer][serial]["certificate"].encode())

                output.append({
                    "issuer": certificate.issuer.rfc4514_string(),
                    "serial-number": '{0:x}'.format(certificate.serial_number),
                    "email":  certificate.subject.get_attributes_for_oid(NameOID.EMAIL_ADDRESS)[0].value,
                    "common-name": certificate.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value,
                    "organisation": certificate.subject.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)[0].value,
                    "not-valid-before": certificate.not_valid_before.strftime("%B %d, %Y"),
                    "not-valid-after" : certificate.not_valid_after.strftime("%B %d, %Y"),
                    "certificate": others[issuer][serial]["certificate"]
                })
                
    except Exception as e:
        print(f"{type(e).__name__} was raised: {e}")

    return output

@app.route("/")
def start():
    return render_template("index.html")

@app.route("/connect", methods=["GET"])
def connect():

    output = {}

    try:
        output = {}
        couchdb_URL = request.values.get('couchdbURL')

        print("[CONNECT] 'URL: %s' " % (couchdb_URL))

        # Connect to the CouchDB Database

        server = pycouchdb.Server(couchdb_URL)
        get_instance(server, params.PEAPOD_DATABASE)
        output['version'] = server.info()['version']
        
        print("[CONNECTED] 'Version: %s' " % (output['version']))

        return json.dumps(output, sort_keys=True), 200
    
    except Exception as e:
        print(f"{type(e).__name__} was raised: {e}")

        return str(e), 500
    
@app.route("/create", methods=["GET"])
def create():

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

    print("[Create] - 'Certificate: %s - %s - %s - %s - %d - %d - %d" % (email, issuer, organisation_name, common_name, validity, key_size, exponent))

    # Build the Certificate

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

    certificate_pem = certificate.public_bytes(serialization.Encoding.PEM)

    # Generate the Fernet Key and encrypt with RSA Key

    fernet_key = Fernet.generate_key()
    encrypted_key = encrypt_key(certificate, fernet_key)

    # Store the Certificate

    document["owners"][certificate.issuer.rfc4514_string()] = {
         '{0:x}'.format(certificate.serial_number) : {     
            "certificate": certificate_pem.decode("UTF-8"),
            "key": encrypted_key
             
         }
    }

    save(instance, document)

    # Return the Key and Cerrtificate Attrributes to the User

    bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    output['id'] =  document["_id"]
    output['certificate'] = certificate_pem.decode("UTF-8")
    output['private-key'] = bytes.decode("UTF-8")
    output['serial-number'] = '{0:x}'.format(certificate.serial_number)
    output['not-valid-before'] = certificate.not_valid_before.strftime("%B %d, %Y")
    output['not-valid-after'] = certificate.not_valid_after.strftime("%B %d, %Y")
    output['issuer'] = certificate.issuer.rfc4514_string()
    output['subject'] = certificate.subject.rfc4514_string()
    output['email'] = certificate.subject.get_attributes_for_oid(NameOID.EMAIL_ADDRESS)[0].value
    output['common-name'] = certificate.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
    output['organisation'] = certificate.subject.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)[0].value

    output['id'] = document["_id"]

    output['key-size'] = private_key.key_size

    public_numbers = private_key.public_key().public_numbers()

    output['private-key-modulus'] = str(public_numbers.n)
    output['private-key-exponent'] = str(public_numbers.e)
    output['document'] = document
    output['others'] = {}

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

    return send_file(io.BytesIO(p12), mimetype='application/x-pkcs12')

@app.route("/regenerate", methods=["POST"])
def regenerate():
    couchdb_URL = request.values.get('couchdbURL')
    password = request.values.get('password')
    private_key_pem = request.values.get('private-key')
    certificate_pem = request.values.get('certificate')

    print("[Regenerate] URL: '%s' " % (couchdb_URL))

    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

    print("[Regenerate] Certificate: '%s' " % ('{0:x}'.format(certificate.serial_number)))

    key = load_pem_private_key(private_key_pem.encode(), None)
    server = pycouchdb.Server(couchdb_URL)

    # Obtain session key

    instance = get_instance(server, params.PEAPOD_DATABASE)
    document = get_pod(instance, certificate_pem) 
    
    session_key = get_session_key(document, certificate_pem, private_key_pem)

    # Generate a new private key

    private_key = rsa.generate_private_key(
        public_exponent=key.public_key().public_numbers().e,
        key_size=key.key_size,
    )

    public_key = private_key.public_key()

    # Build the new Certificate 

    builder = x509.CertificateBuilder()

    public_key = private_key.public_key()
    builder = x509.CertificateBuilder()
    builder = builder.subject_name(x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, 
                           certificate.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, 
                           certificate.subject.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)[0].value),
        x509.NameAttribute(NameOID.EMAIL_ADDRESS, 
                           certificate.subject.get_attributes_for_oid(NameOID.EMAIL_ADDRESS)[0].value)]))
    
    builder = builder.issuer_name(x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, certificate.issuer.rfc4514_string()),
    ]))

    builder = builder.not_valid_before(certificate.not_valid_before)
    builder = builder.not_valid_after(certificate.not_valid_after)
    builder = builder.serial_number(certificate.serial_number)
    builder = builder.public_key(public_key)
    builder = builder.add_extension(
        x509.SubjectAlternativeName(
            [x509.DNSName(certificate.issuer.rfc4514_string())]
        ),
        critical=False
    )
    
    builder = builder.add_extension(x509.UnrecognizedExtension(NameOID.USER_ID, document["_id"].encode()),
        critical=False)

    builder = builder.add_extension(
        x509.BasicConstraints(ca=False, path_length=None), critical=True,
    )

    new_certificate = builder.sign(
        private_key=private_key, algorithm=hashes.SHA256(),
    )

    # Generate the Fernet Key and encrypt with RSA Key

    new_encrypted_key = encrypt_key(new_certificate, session_key)

    # Store the Certificate and key

    new_certificate_pem = new_certificate.public_bytes(serialization.Encoding.PEM)
    
    document["owners"][new_certificate.issuer.rfc4514_string()] = {
         '{0:x}'.format(new_certificate.serial_number) : {     
            "certificate": new_certificate_pem.decode("UTF-8"),
            "key": new_encrypted_key
             
         }
    }

    save(instance, document)
    
    print("[Regenerate] Regenerated Certificate Saved")
 
    # Serialize the Passport

    p12 = pkcs12.serialize_key_and_certificates(
        b"peo-pod-passport", private_key, new_certificate, None, BestAvailableEncryption(password.encode())
    )

    # Return Passport

    return send_file(io.BytesIO(p12), mimetype='application/x-pkcs12')

@app.route("/open", methods=["POST"])
def open_pod():
    output = {}

    couchdb_URL = request.values.get('couchdbURL')
    password = request.values.get('password')

    print("[Open] Files: %d " % len(request.files))
    print("[Open] URL: '%s' " % (couchdb_URL))

    try:

        files = request.files

        # Open the P12 - there should only be one file uploaded

        for file in files:

            passport = request.files.get(file).stream.read()
            artifacts = pkcs12.load_key_and_certificates(passport, password.encode(), backend=None)

            print("[Open] Tuples: '%d' " % len(artifacts))

            for artifact in artifacts:
                
                # Found the RSA Key - decode the key

                if  type(artifact).__name__ == "_RSAPrivateKey":
                    print("[Open] - Decoding Key")

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

               # Found the Certificate in the file

                elif type(artifact).__name__ == "Certificate":
                    print("[Open] - Decoding Certifcate")

                    bytes = artifact.public_bytes(serialization.Encoding.PEM)

                    output['certificate'] = bytes.decode("UTF-8")
                    
                    output['issuer'] = artifact.issuer.rfc4514_string()
                    output['subject'] = artifact.subject.rfc4514_string()
                    output['email'] = artifact.subject.get_attributes_for_oid(NameOID.EMAIL_ADDRESS)[0].value
                    output['common-name'] = artifact.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
                    output['organisation'] = artifact.subject.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)[0].value

                    output['not-valid-before'] = artifact.not_valid_before.strftime("%B %d, %Y")
                    output['not-valid-after'] = artifact.not_valid_after.strftime("%B %d, %Y")
                    output['serial-number'] = '{0:x}'.format(artifact.serial_number)

                    user_id = artifact.extensions.get_extension_for_oid(NameOID.USER_ID)

                    output['id'] = user_id.value.value.decode("utf-8")
                    output['document'] = get_document(couchdb_URL, output['id'])
                    output['others'] = expand_others(output['document'])


        return json.dumps(output, sort_keys=True), 200

    except Exception as e:
        print("[Open] Err: '%s' " % (str(e)))

        return str(e), 500

@app.route("/upload", methods=["POST"])
def upload():
    output = {}

    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')
    private_key_pem = request.values.get('key')

    print("[Upload] Files: %d " % len(request.files))
    print("[Upload] URL: '%s' " % (couchdb_URL))
 
    try:

        server = pycouchdb.Server(couchdb_URL)

        instance = get_instance(server, params.PEAPOD_DATABASE)
        certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

        user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

        document = get_pod(instance, certificate_pem)

        session_key = get_session_key(document, certificate_pem, private_key_pem)

        files = request.files

        for file in files:

            content = request.files.get(file)

            encrypted_content = encrypt_content(session_key, content.stream.read())

            document = instance.put_attachment(document, encrypted_content, filename=content.filename, content_type=content.mimetype)

            output['document'] = document

    except Exception as e:

        print("[Upload] - ERROR '%s'" % str(e))
        output = {} 

        output = {
            "status": 'fail',
            "error": str(e)
        }

    return json.dumps(output, sort_keys=True), 200
 
@app.route("/download", methods=["POST"])
def download():

    try:
        couchdb_URL = request.values.get('couchdbURL')
        certificate_pem = request.values.get('certificate')
        private_key_pem = request.values.get('key')
        attachment_name = request.values.get('attachment')

        print("[Download] CouchDB URL: %s " % (couchdb_URL))
        print("[Download] Attachment: '%s' " % (attachment_name))

        private_key = serialization.load_pem_private_key(
            private_key_pem.encode('utf-8'),
            password=None,
        )

        server = pycouchdb.Server(couchdb_URL)
        instance = get_instance(server, params.PEAPOD_DATABASE)

        document = get_pod(instance, certificate_pem) 
        session_key = get_session_key(document, certificate_pem, private_key_pem)
        attachment_bytes = instance.get_attachment(document, attachment_name, False)

        decrypted_bytes = decrypt_content(session_key.decode("utf-8"), attachment_bytes)

        return send_file(io.BytesIO(decrypted_bytes), mimetype=document['_attachments'][attachment_name]['content_type'])

    except Exception as e:

        print("[Download] - ERROR '%s'" % str(e))

        output = {
            "status": 'fail',
            "error": str(e)
        }

        return json.dumps(output, sort_keys=True), 500

@app.route("/remove", methods=["POST"])
def remove():

    couchdb_URL = request.values.get('couchdb-url')
    certificate_pem = request.values.get('certificate')
    attachment_name = request.values.get('attachment-name')

    print("[Remove] CouchDB URL: %s " % (couchdb_URL))
    print("[Remove] Attachment: '%s' " % (attachment_name))
    
    try:        

        server = pycouchdb.Server(couchdb_URL)
                
        instance = get_instance(server, params.PEAPOD_DATABASE)
        
        certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

        user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

        document = instance.get(user_id)

        result = instance.delete_attachment(document, attachment_name)

        output = {
            "status": 'success',
            "id": user_id,
            "document": result,
            "attachment": attachment_name
        }
    
        return json.dumps(output, sort_keys=True), 200

    except Exception as e:

        print("[Remove] - ERROR '%s'" % str(e))
        output = {
            "status": 'fail',
            "error": str(e)
        }

        return json.dumps(output, sort_keys=True), 500

@app.route("/delete", methods=["POST"])
def delete():

    couchdb_URL = request.values.get('couchdb-url')
    certificate_pem = request.values.get('certificate')
    print("[Delete] CouchDB URL: %s " % (couchdb_URL))
 
    try:        
        server = pycouchdb.Server(couchdb_URL)
                
        instance = get_instance(server, params.PEAPOD_DATABASE)

        certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

        user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

        instance.delete(user_id)

        print("[Delete] Document: '%s' " % (user_id))

        output = {
            "status": 'success',
            "id": user_id
        }

        return json.dumps(output, sort_keys=True), 200
    
    except Exception as e:

        print("[Delete] - ERROR '%s'" % str(e))

        return str(e), 500
        
@app.route("/backup", methods=["POST"])
def backup():
    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')
    private_key_pem = request.values.get('key')
    
    print("[Backup] CouchDB URL: %s " % (couchdb_URL))

    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)

    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

    user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

    document = instance.get(user_id)
    
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
    )

    print("[Backup] Document ID: '%s' " % (user_id))

    server = pycouchdb.Server(couchdb_URL)
    instance = get_instance(server, params.PEAPOD_DATABASE)

    document = get_pod(instance, certificate_pem) 
    session_key = get_session_key(document, certificate_pem, private_key_pem)

    archive = io.BytesIO()

    with ZipFile(archive, 'w') as zip_archive:

        for attachment_name in document["_attachments"]:

            attachment_bytes = instance.get_attachment(document, attachment_name, False)
            decrypted_bytes = decrypt_content(session_key.decode("utf-8"), attachment_bytes)

            file = ZipInfo(attachment_name)
            file.comment = document["_attachments"][attachment_name]["content_type"].encode()

            zip_archive.writestr(file, decrypted_bytes)

            print("[Backup] Attachment: '%s' - '%s' " % (attachment_name, file.comment.decode('utf-8')))

    return send_file(io.BytesIO(archive.getvalue()), "application/x-zip")

@app.route("/restore", methods=["POST"])
def restore():
    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')
    private_key_pem = request.values.get('key')
    
    print("[Restore] CouchDB URL: %s " % (couchdb_URL))

    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)

    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())

    user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

    document = instance.get(user_id)
    
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
    )

    print("[Restore] Document ID: '%s' " % (user_id))

    server = pycouchdb.Server(couchdb_URL)
    instance = get_instance(server, params.PEAPOD_DATABASE)

    session_key = get_session_key(document, certificate_pem, private_key_pem)

    files = request.files

    output = {}
    count = 0

    for file in files:

        content = request.files.get(file)

        with ZipFile(io.BytesIO(content.stream.read())) as zip_file:
                for name in zip_file.namelist():
                    print("[Restore] Document ID: '%s' - '%s'" % (name, zip_file.getinfo (name).comment.decode("utf-8")))

                    encrypted_content = encrypt_content(session_key, zip_file.read(name))
                    document = instance.put_attachment(document, encrypted_content, filename=name, content_type=zip_file.getinfo (name).comment)
                    count += 1

                    output['document'] = document
    
    output["count"] = count

    return output, 200

@app.route("/get", methods=["POST"])
def get():
    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')
    
    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)

    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())
    user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

    print("[Get] Document ID: '%s' " % (user_id))

    return jsonify(instance.get(user_id))

@app.route("/set", methods=["POST"])
def set():
    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')
    name = request.values.get('name')
    value = request.values.get('value')
    
    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)

    certificate = x509.load_pem_x509_certificate(certificate_pem.encode())
    user_id = certificate.extensions.get_extension_for_oid(NameOID.USER_ID).value.value.decode("utf-8")

    print("[Set] Document ID: '%s' - '%s'='%s'" % (user_id, name, value))

    document = instance.get(user_id)

    document['folder'] = {
        name: value
    }
    
    revised_document = save(instance, document)

    return revised_document, 200

@app.route("/share", methods=["POST"])
def share():
    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')
    
    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)
  
    document = get_pod(instance, certificate_pem)

    print("[Share] Document ID: '%s'" % document["_id"])

    others = document["others"]

    try:

        files = request.files

        for file in files:
            user_certificate_pem = request.files.get(file).stream.read()
            user_certificate = x509.load_pem_x509_certificate(user_certificate_pem)

            if not user_certificate.issuer.rfc4514_string() in others:
                others[user_certificate.issuer.rfc4514_string()] = {}
            
            others[user_certificate.issuer.rfc4514_string()]['{0:x}'.format(user_certificate.serial_number)] = {
                "certificate" : user_certificate_pem.decode("UTF-8")
            }
                              
        document['others'] = others
        revised_document = save(instance, document)
 
        return revised_document, 200

    except Exception as e:
        print(f"{type(e).__name__} was raised: {e}")

        return str(e), 500

@app.route("/unshare", methods=["POST"])
def unshare():
    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')
    other_pem = request.values.get('other')
    
    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)
  
    document = get_pod(instance, certificate_pem)

    print("[Unshare] Document ID: '%s'" % document["_id"])  
    print("[Unshare] Other: '%s'" % other_pem)

    others = document["others"]

    try:

        other_certificate = x509.load_pem_x509_certificate(other_pem.encode("utf-8"))
                              
        others[other_certificate.issuer.rfc4514_string()].pop('{0:x}'.format(other_certificate.serial_number), None);
        
        if len(others[other_certificate.issuer.rfc4514_string()]) == 0:
            others.pop(other_certificate.issuer.rfc4514_string(), None)

        document["others"] = others
        revised_document = save(instance, document)
 
        return revised_document, 200

    except Exception as e:
        print(f"{type(e).__name__} was raised: {e}")

        return str(e), 500
    
@app.route("/expand", methods=["POST"])
def expand():
    couchdb_URL = request.values.get('couchdbURL')
    certificate_pem = request.values.get('certificate')
    
    server = pycouchdb.Server(couchdb_URL)

    instance = get_instance(server, params.PEAPOD_DATABASE)
  
    document = get_pod(instance, certificate_pem)

    print("[Expand] Document ID: '%s'" % document["_id"])

    output = {}

    output['document'] = document
    output['others'] = expand_others(document)
    
    return output, 200

if __name__ == "__main__":
    print("Listening: "  + environ.get('PORT', '8080'))
    PORT = int(environ.get('PORT', '8080'))
    app.run(host='0.0.0.0', port=PORT)