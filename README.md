# PEAPOD - Manager

A PKI protected secure file storage system built on **couchdb**.  

it is based on **PKI** and utilised **CouchDB** as a metatdata store see: [https://couchdb.apache.org/] for further information.  PEAPOD can store small files no greater than 50M and reference to a large file or database connection.  However, file store within the *POD* are encrypted with a session key.  The session key is encrypted with a RSA key stored within the *Passport*.

Some Terms:

- **POD**  a container of files, databases connections and cryptographic artfiacts (Certificates and Session Keys). Each POD is idenified by an unique POD ID.
- **PASSPORT** a P12 file that conatins the certificate (which containes the POD identifer, issuer, email, common name, validaty period and the Public Key).  Also, the associated private key to decrypt the session key.
- **SESSION KEY** this ais a *fernet* key encrypted by the RSA Key within the certificate.  The session key is used to encrypt the files contained within the POD.
- **FILE** a *csv*, *pdf*, *image* or text file.  There may be any number of files contained within a POD.  There are viewers for CSVand PDF files as for other file types there is a hexadecimal display available.
- **COUCHDB** is the underlying database that supports PEAPOD.
- **CERTIFICATE**

PEAPOD manager has a javascript front-end and Python backend.  The Python back-end utilised the Flask web framework to generate the HTML.  
> **Note:** The javascript is a Single Page Application - SPA - and avoids using web-frameworks like react.

## Build and Deploy

Peapod is best run in a docker container to build PEAPOD

    docker build -t "peapod:*version*" .

To execute Peapod

    docker run -p 8080"8080 --name peapod "peapod:*version*" .

![The San Juan Mountains are beautiful!](/assets/images/Screenshot-2024-04-30-085705.png "San Juan Mountains")
