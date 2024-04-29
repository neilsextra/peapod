# PEAPOD - Manager

A PKI protected secure file storage system built on **couchdb**.  

it is based on **PKI** and utilised **CouchDB** as a metatdata store see: [https://couchdb.apache.org/] for further information.  PEAPOD can store small files no greater than 50M and reference to a large file or database connection.  However, file store within the *POD* are encrypted with a session key.  The session key is encrypted with a RSA key stored within the *Passport*.

Some Terms:

- **POD**  a container of files, databases connections and cryptographic artfiacts (Certificates and Session Keys). Each POD is idenified by an unique POD ID.
- **PASSPORT** a P12 file that conatins the certificate (which containes the POD identifer, issuer, email, common name, validaty period and the Public Key).  Also, the associated private key to decrypt the session key.The passpord is dowloaded as a P12 file and can later uploaded to open a POD.  Each Passport has an associated Password cannot be changed but a new Passport can be generated with a different Password.  It is also possible to create a new Passport and invalidate any existing Passports. 
- **SESSION KEY** this ais a *fernet* key which is encrypted by the RSA Key within the certificate.  The session key is used to encrypt the files, database connections contained within the POD.
- **FILE** a *csv*, *pdf*, *image* or text file.  There may be any number of files contained within a POD.  There are viewers for CSVand PDF files as for other file types there is a hexadecimal display available.
- **COUCHDB** is the underlying database that supports PEAPOD.  COUCHDB is a no-sql document store.
- **CERTIFICATE** contains the PEAPOD identifier and the *public key* used to encrypt the artificats contained within the POD.
- **OTHER CERTIFICATE** these are certificates that idetify people who have read access to a POD.
- **REGISTER** is a store of Passports within a browser.  This utilises local storage within a browser and thefore may not be replicated in other browsers.
- **POD Identifier** is an unqiue identifier to select the pod.  Each certificate contains a unique POD Identifier.
- **PRIVATE KEY** is a key contained within the Pasport to encrypt the session key.  This is never stored in a POD.
- **VIEWERS** there are 3 viewers, a CSV viewer, PDF viewer and a Hex viewer for everything else.

PEAPOD manager has a javascript front-end and Python backend.  The Python back-end utilised the Flask web framework to generate the HTML.  
> **Note:** The console is written in javascript and is a Single Page Application - *SPA*. It avoids using web-frameworks like REACT, jQuery, VUE, etc.

## Build and Deploy

Peapod is best run in a docker container to build PEAPOD

    docker build -t "peapod:*version*" .

To execute/run Peapod

    docker run -p 8080"8080 --name peapod "peapod:*version*" .

# The Main Console

The main console is where pods are created, deleted, and maintained.  This is where PASSPORTs are created and files are uploaded. The PEAPOD Manager requires a CouchDB connection URL in the form or set as a parameter set within the docker run command:

    http://userid:password@host.docker.internal:5984

or

    docker run -p 8080"8080 --name peapod -d "couchdbURL=http://userid:password@host.docker.internal:5984" "peapod:*version*" .

Then main console (modelled on windows setings applet) then allows. the administrater to create or maintain PODS.

![Main Console - PEAPOD Manager!](/assets/images/Screenshot-console-001.png "PEAPOD Manager")

This is example of the CSV File Viewer =- the file viewer has been designed to display millions of records and doesn't utilise the HTML Table Tag. 

![Main Console - PEAPOD Manager Filoe Viewer!](/assets/images/Screenshot-console-002.png "PEAPOD Manager File Viewer")

PEADPOD Manager Actions:

- **New POD** Creates a new POD and Passport
- **Unlock POD** Opens a POD for a given passport. The passport is upload.
- 
