# PEAPOD - Manager

A PKI protected secure file storage system built on **couchdb**.  

it is based on **PKI** and utilised **CouchDB** as a metatdata store see: [https://couchdb.apache.org/] for further information.  PEAPOD can store small files no greater than 50M and reference to a large file or database connection.  However, file store within the *POD* are encrypted with a session key.  The session key is encrypted with a RSA key stored within the *Passport*.

Some Terms:

- **POD**  a container of files, databases connections and cryptographic artfiacts (Certificates and Session Keys). Each POD is idenified by an unique POD ID.
- **PASSPORT** a P12 file that conatins the certificate (which containes the POD identifer, issuer, email, common name, validaty period and the Public Key).  Also, the associated private key to decrypt the session key.The passpord is dowloaded as a P12 file and can later uploaded to open a POD.  Each Passport has an associated Password cannot be changed but a new Passport can be generated with a different Password.  It is also possible to create a new Passport and invalidate any existing Passports. 
- **SESSION KEY** this ais a *fernet* key which is encrypted by the RSA Key within the certificate.  The session key is used to encrypt the files, database connections contained within the POD.
- **FILE** a *csv*, *pdf*, *image* or text file.  There may be any number of files contained within a POD.  There are viewers for CSVand PDF files as for other file types there is a hexadecimal display available.
- **COUCHDB** is the underlying database that supports PEAPOD.  COUCHDB is a no-sql document store.  This dabase was also chosen because of its replication capabilities.
- **CERTIFICATE** contains the PEAPOD identifier and the *public key* used to encrypt the artificats contained within the POD.
- **OTHER CERTIFICATE** these are certificates that idetify people who have read access to a POD.
- **REGISTER** is a store of Passports within a browser.  This utilises local storage within a browser and thefore may not be replicated in other browsers.
- **POD Identifier** is an unqiue identifier to select the pod.  Each certificate contains a unique POD Identifier.
- **PRIVATE KEY** is a key contained within the Pasport to encrypt the session key.  This is never stored in a POD.
- **BACKUP** is a zip file that contains the contents (except certificates and keys) of all files and database connections.
- **VIEWERS** there are 3 viewers available:
    - a **CSV** viewer,
    - a **PDF** viewer,
    - and a **HEX** viewer for all other file formats.

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

![Main Console - PEAPOD Manager File Viewer!](/assets/images/Screenshot-console-002.png "PEAPOD Manager File Viewer")

PEADPOD Manager Actions:

#### File Commands ####
- **New POD** Creates a new POD and Passport
- **Unlock POD** Opens a POD for a given passport. The password is requested to open the Passport. 
- **Open Register** Displays the register and allows a user to select a register.  Each POD within the register will also require a password to unlock it.  All entries within the register can be completely erased from the settings menu.
  
#### Action Commands ####
- **Register Passport** Registers a passport witin the *Register*.  This passport will be selected within the **Open Register** console.
- **Unregister Passport** Removes the Passport from the register therefore makes this POD unavailable from the register.  This does not **delete** the POD.
- **Upload File** Uploads a file into the POD. Can be of any file type.
- **Add User** Adds an *other person* certificate into the POD.  This identifies users who have read access to the POD.
- **Edit Readme** Edits the README file.  Each POD has a README file.  The README utlises the *Markdown* language.

#### Support Commands ####
- **Save Passport** Can save a passport with a different password. In addition, the passport could be regenerated with a completely different private key when is used to encrypt the session key.
> **Warning:** The *regenerate keys* option will invalidate all paspports associated with this pod. The register entry is also invalid.  
- **Delete POD** This will delete the POD and its contents. Use with caution because this command is not reversable.
- **Backup POD** This will generate a *ZIP file* that contains all the files within a POD.  The contents of the *ZIP file* are not encrypted.  In addition, the ZIP file is not password protected.
> **Warning:** This is a destructive command and irreversable.  Ensure all the files are backed up before the issuing this command.
- **Restore POD** This can ingest a Backup from the previous command and load the files and database connections into the POD.  The contents are then encrypted ans secured.

#### The PEAPOD Manager - Register ####

The register is store within the browser (local storage).  The *action command* menu allows for the registration of a POD and the removal of a POD from the register

![Main Console - PEAPOD Manager Register!](/assets/images/Screenshot-console-003.png "PEAPOD Manager Register")

> **Note:** Each browser has its own local storage and this storage is not usually shared between browsers.

## The Settings Display ##

The setting's display controls what is display within the centre pane.  There are 4 options:

- **Certificate** - this display the certificate used to identify the POD
- **Key** - this will display the public elements of the key and the detail that relate to the assoicated certificate.
- **Other Certificates** - this display the *other* certificate(s)
- **Files** - This will display the files contained within the POD.

> **Note:** The *Clear POD Cache* will remove all entries with in the register.

![Main Console - PEAPOD Manager Settings!](/assets/images/Screenshot-console-004.png "PEAPOD Manager Settings")

## Acknowledgments ##

- *README* Editor - Great little Control
- *Python's Crypotographic Library Support* - wish it included more PKCS7 support
- *CouchDB* - Great NoSQL Document Store 
