'use strict'

var bigTable = undefined;

var xOffset = 20;
var yOffset = 16;

var rows = [];
var types = {};
var columns = null;

var uploadedFile = null;

var stringUtil = new StringUtil();

var cryptoArtificats = null;
var couchdb = null;

var tableView = null;

class DataView extends SyncTableModel {

    constructor(columns, data) {
        super();

        this.__columns = columns;
        this.__data = data;
        this.__records = data.length;
    }

    get Length() {
        return this.__records;
    }

    getCellSync(i, j, cb) {

        return this.__data[i][j];

    }

    getHeaderSync(j) {

        return this.__columns[j];

    };

    hasCell(i, j) {

        return i < this.__data.length && j < this.__columns.length;

    }

}

var settings = {
    view_certificates: false,
    view_keys: false,
    view_files: true
}

/**
 * Capitalize the first letter of a String e.g. "fred" -> "Fred"
 * 
 * @param {String} string the string to capitalize e.g. "fred" -> "Fred"
 * @returns a capitalized String
 */
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Parameter Substitution for templates
 * 
 * @param {String} template the template 
 * @param {*} values the values as a dictionary
 * @returns a string with substituted values that conform to the template
 */
function substitute(template, values) {
    let value = template;

    let keys = Object.keys(values);

    for (let key in keys) {
        value = value.split("${" + keys[key] + "}").join(values[keys[key]]);
    }

    return value;

}

/**
 * Convert an Array to a string
 * 
 * @param {arrayBuffer} buffer 
 * @returns  base 64 representation
 */
function arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    
    return window.btoa( binary );

}

/**
 * Remove all the event listeners for an element
 * @param {String} id the element Identifier
 */

function removeAllEventListeners(id) {
    var oldElement = document.getElementById(id);
    var newElement = oldElement.cloneNode(true);

    oldElement.parentNode.replaceChild(newElement, oldElement);

}

/**
 * Set the Collapsible Handler
 */
function setCollapsible() {
    var collapsible = document.getElementsByClassName("collapsible");
    for (var content = 0; content < collapsible.length; content++) {
        collapsible[content].addEventListener("click", function () {

            this.classList.toggle("collapsible-active");

            var content = this.nextElementSibling;

            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }

        });

    }

}

/**
 * Expand the Collapsible
 * @param {string} id the Element Identifier to expand
 */
function expandCollapsible(id) {

    var collapsible = document.getElementById(id);

    if (!collapsible.classList.contains("collapsible-active")) {
       
        collapsible.classList.toggle("collapsible-active");

        var content = collapsible.nextElementSibling;

        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }

    }

}

/**
 * Get the Connection
 */
async function getConnection() {

    document.getElementById("connect-dialog").showModal();

}

/**
 * Show the CSV File in a scrollable table display
 * 
 * @param {string} id the attachment identifier   
 */
async function showCSV(id) {
    var waitDialog = document.getElementById("wait-dialog");

    waitDialog.showModal();

    var message = new Message()
    var result = await message.download(couchdb.getURL(), window.cryptoArtificats['certificate'], 
                                                          window.cryptoArtificats['private-key'], 
                                                          id, false);

    let results = Papa.parse(result);
    let lines = results.data;
    rows = [];
    columns = null;
    let widths = [];

    loop: for (var line in lines) {

        if (!columns) {
            columns = lines[line];
            for (var iColumn in columns) {
                widths.push(200);
            }

        } else {

            if (lines[line].length == columns.length) {
                rows.push(lines[line]);
            }

        }

    }

    let dataview = new DataView(columns, rows);
    let painter = new Painter();

    tableView = new TableView({
        "container": "#table",
        "model": dataview,
        "nbRows": dataview.Length,
        "rowHeight": 20,
        "headerHeight": 20,
        "painter": painter,
        "columnWidths": widths
    });

    window.setTimeout(function () {
        tableView.show();
    }, 100);

    waitDialog.close();

    document.getElementById("display-csv-dialog").showModal();

}

/**
 * Show the File as Hex in a pageable display
 * 
 * @param {string} id the attachment identifier   
 */
async function showHex(id) {
    var waitDialog = document.getElementById("wait-dialog");

    waitDialog.showModal();

    var result = await (new Message()).download(couchdb.getURL(), window.cryptoArtificats['certificate'], 
                                                          window.cryptoArtificats['private-key'], 
                                                          id, true)

    var hex = hexview(result);

    document.getElementById("hex-view").innerHTML = hex;

    waitDialog.close();

    document.getElementById("display-hex-dialog").showModal();
    
}

/**
 * Show the PDF
 * @param {string} id the Attachment Name
 * @param {string} mimetype always "application/pdf"
 */
async function showPDF(id, mimetype) {
    var waitDialog = document.getElementById("wait-dialog");

    waitDialog.showModal();

    var message = new Message()
    var result = await message.download(couchdb.getURL(), window.cryptoArtificats['certificate'], 
                                                          window.cryptoArtificats['private-key'], id, true);

    var pdfView = new PDFView(result, "attachment-view", 1.0);

    pdfView.view();

    document.getElementById('pagne-no').textContent = "1";

    waitDialog.close();

    var attachmentDialog = document.getElementById("attachment-dialog");

    attachmentDialog.showModal();

    removeAllEventListeners("page-left");
    removeAllEventListeners("page-right");

    document.getElementById('page-left').addEventListener('click', (e) => {

        pdfView.previous();
        document.getElementById('pagne-no').textContent = pdfView.currentPage;

    });

    document.getElementById('page-right').addEventListener('click', (e) => {

        pdfView.next();
        document.getElementById('pagne-no').textContent = pdfView.currentPage;

    });

}

/**
 * Show the Cryptographic Artifacts - Certificate Information
 * @param {json} artifcats the Artifacts to show
 */
function showArtifacts(artifcats) {
    document.getElementById("artifacts-container").innerHTML = "";
    if (artifcats != null) {
        if (settings.view_certificates) {
            let template = document.querySelector('script[data-template="certificate-card-item"]').text;
            let value = stringUtil.substitute(template, {
                "id": artifcats['id'],
                "email": artifcats['email'],
            });

            let fragment = document.createRange().createContextualFragment(value);
            document.getElementById("artifacts-container").appendChild(fragment);

        }

        if (settings.view_keys) {
            var template = document.querySelector('script[data-template="key-card-item"]').text;
            var value = stringUtil.substitute(template, {
                "id": artifcats['id'],
                "email": artifcats['email'],
            });

            let fragment = document.createRange().createContextualFragment(value);

            document.getElementById("artifacts-container").appendChild(fragment);

        }

        if (settings.view_files) {
            if ((artifcats != null) && 'document' in artifcats && '_attachments' in artifcats.document) {
                let attachments = Object.keys(artifcats.document['_attachments']);

                for (var attachment in attachments) {
                    var template = document.querySelector('script[data-template="attachment-card-item"]').text;

                    value = stringUtil.substitute(template, {
                        "filename": attachments[attachment],
                        "mimetype": artifcats.document['_attachments'][attachments[attachment]]['content_type']
                    });

                    let fragment = document.createRange().createContextualFragment(value);

                    document.getElementById("artifacts-container").appendChild(fragment);

                }

            }

        }

        document.getElementById("pod-status").innerHTML = `Pod ID: ${artifcats['id']} - &#128275;`;

    } else {
        document.getElementById("pod-status").innerHTML = "";
    }

}

/**
 * Show the details about the Artifcat in the Detail's Pane
 * @param {json} artificate the type of artifact, certificate, key, file, etc
 * @param {id} id the identifier of the artifact
 */
function view(artificate, id, mimetype) {
    document.getElementById("details").innerHTML = "";

    if (artificate == 'attachment') {
        let template = document.querySelector('script[data-template="attachment-details"]').text
        let value = stringUtil.substitute(template, {
            "filename": id,
            "mimetype": mimetype
        });

        var fragment = document.createRange().createContextualFragment(value);
        document.getElementById("details").appendChild(fragment);

    } else {
        let template = (artificate == "certificate") ? document.querySelector('script[data-template="certificate-details"]').text
            : document.querySelector('script[data-template="key-details"]').text;

        let value = stringUtil.substitute(template, {
            "id": window.cryptoArtificats['id'],
            "email": window.cryptoArtificats['email'],
            "private-key-modulus": window.cryptoArtificats['private-key-modulus'],
            "private-key-exponent": window.cryptoArtificats['private-key-exponent'],
            "issuer": window.cryptoArtificats['issuer'],
            "serial-number": window.cryptoArtificats['serial-number'],
            "certificate": window.cryptoArtificats['certificate']
        });

        var fragment = document.createRange().createContextualFragment(value);
        document.getElementById("details").appendChild(fragment);

    }

}

async function details(artificate, id, mimetype) {

    if (mimetype == "text/csv" || id.endsWith("csv")) {
        showCSV(id);
    } else if (mimetype == "application/pdf") {
        showPDF(id, mimetype);
    } else {
        showHex(id)
    }

}

/**
 * Donwloadload the Artifact
 * 
 * @param {string} artifact 
 */
async function download(artifact) {

    if (artifact == "certificate") {
        var fileUtil = new FileUtil(document);

        fileUtil.saveAs(window.cryptoArtificats['certificate'], `pod-${window.cryptoArtificats['id']}.cer`);
    
    }

}

async function remove(artificate, attachmentName) {
    var message = new Message()
    var result = await message.remove(couchdb.getURL(), window.cryptoArtificats['certificate'], attachmentName);

    window.cryptoArtificats['document'] = result.response['document'];

    showArtifacts(window.cryptoArtificats);

    document.getElementById("details").innerHTML = "";
    document.getElementById("info-message").innerHTML = `'${attachmentName}' : removed successfully`;
    document.getElementById("info-dialog").showModal();

}

/**
 * Open a password given the Passport Identifier
 * 
 * @param {string} podID the Passport Identifier
 */
function openPassport(podID) {

    function processURI(dataURI) {

        if (dataURI.startsWith("data:")) {
            var message = dataURI.split(/;|,|:/);
        
            return {
                "base64" : message[3],
                "mimetype" : message[1]
            }
        } else {
            return {
                "base64" : dataURI,
                "mimetype" : "application/x-pkcs12"             
            }
        
        }

    }

    function base64ToBlob(base64String, contentType = '') {
        const byteCharacters = atob(base64String);
        const byteArrays = [];
    
        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }
    
        const byteArray = new Uint8Array(byteArrays);
        
        return new Blob([byteArray], { type: contentType });
    
    }

    var passport = window.localStorage.getItem( podID );

    let processedURI = processURI(passport);

    let blob = base64ToBlob(processedURI.base64, processedURI.mimetype);

    var file = new File([blob], `POD-${podID}.p12`, {type:  processedURI.mimetype, lastModified: Date.now()});

    window.passport = file;

    document.getElementById("pod-open-dialog").showModal();

}

/**
 * Respond to the Document 'ready' event
 */
window.onload = function () {
    var closeButtons = document.getElementsByClassName("close-button");

    for (var closeButton = 0; closeButton < closeButtons.length; closeButton++) {

        closeButtons[closeButton].addEventListener('click', (e) => {
            document.getElementById(e.target.id.replace(/\-close|\-cancel/, "")).close();
        });

    }

    setCollapsible();

    // Setting Global Variables
    window.details = details;
    window.view = view;
    window.remove = remove;
    window.download = download;
    window.openPassport = openPassport;

    window.simplemde = new SimpleMDE({ element: document.getElementById("readme-editor"),
                                       toolbar: ["bold", "italic", "heading", "|", 
                                       "quote", "ordered-list", "unordered-list", "|",
                                       "table", "horizontal-rule", "|",
                                       "preview"
                                    ]});

    //Global Variables
    document.getElementById("new-pod").addEventListener("click", async function (event) {

        document.getElementById("email").value = "";
        document.getElementById("issuer").value = "";
        document.getElementById("organisation").value = "";
        document.getElementById("common-name").value = "";

        document.getElementById("new-pod-dialog").showModal();

    });

    document.getElementById('connect-couchdb').addEventListener('click', (e) => {

        document.getElementById("connect-message").innerHTML = (e != null && e.message != null) ? e.message : "";

        document.getElementById("connect-dialog").showModal();

        return false;

    });

    document.getElementById("ok-connect-dialog").addEventListener("click", async function (event) {
        var waitDialog = document.getElementById("wait-dialog");

        document.getElementById("details").innerHTML = "";
        document.getElementById("artifacts-container").innerHTML = "";
        window.artifcats = null;

        try {

            waitDialog.showModal();

            var message = new Message()
            var result = await message.connect(document.getElementById("couchdb-url").value);

            couchdb = new CouchDB(document.getElementById("couchdb-url").value, result['response']['version']);

            document.getElementById("couchdb-status").innerHTML = `CouchDB Version: ${couchdb.getVersion()} - &#128154;`;

            document.getElementById("connect-dialog").close();
            document.getElementById("wait-dialog").close();

            document.getElementById("connect-dialog-cancel").style.display = "inline-block";

        } catch (e) {
            document.getElementById("connect-message").innerHTML = e.message;
            waitDialog.close();
        }

        return false;

    });

    document.getElementById("new-pod-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();

        var email = document.getElementById("email").value;
        var issuer = document.getElementById("issuer").value;
        var organisation = document.getElementById("organisation").value;
        var cn = document.getElementById("common-name").value;

        var keysize = document.getElementById("key-size").value;
        var exponent = document.getElementById("public-exponent").value;
        var validity = document.getElementById("validaty-period").value;

        var result = await message.create(couchdb.getURL(), email, issuer, organisation, cn, validity, keysize, exponent)

        window.cryptoArtificats = result.response;

        document.getElementById("p12-password").value = "";
        document.getElementById("pod-save-dialog").showModal();
        document.getElementById("actions-button").style.visibility = "visible";
        document.getElementById("actions-button-content").style.visibility = "visible";
        document.getElementById("edit-button").style.visibility = "visible";
        document.getElementById("edit-button-content").style.visibility = "visible";

        expandCollapsible("actions-button");

    });

    document.getElementById("pod-save-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();

        try {
            var password = document.getElementById("p12-password").value;

            var result = await message.generate(window.cryptoArtificats, password);

            var fileUtil = new FileUtil(document);

            fileUtil.saveAs(result, `pod-${window.cryptoArtificats["id"]}.p12`);

            document.getElementById("pod-save-dialog").close();
            document.getElementById("new-pod-dialog").close();

            window.passportEncoded = true;
            window.passports = [];

            window.passports.push(result);

            showArtifacts(window.cryptoArtificats);

        } catch (e) {
            alert("ERROR: " + e);
        }

    });

    document.getElementById("open-pod").addEventListener("click", async function (event) {

        document.getElementById("upload-passport-file").value = "";
        document.getElementById("p12-password").value = "";
        document.getElementById("upload-passport-dialog").showModal();

    });

    document.getElementById("select-upload-passport").addEventListener("click", async function (event) {
        var fileUtil = new FileUtil(document);

        fileUtil.load(async function (files) {
            window.passports = [];
            window.passportEncoded = false;

            for (var file = 0; file < files.length; file++) {

                document.getElementById("upload-passport-file").value = files[file].name;
                
                window.passports.push(files[file]);

            }

        });

        return false;

    });

    document.getElementById("upload-passport-dialog-ok").addEventListener("click", async function (event) {
        var password = document.getElementById("passport-password").value;

        var message = new Message();
        var result = await message.open(couchdb.getURL(), passports[0], password)

        window.cryptoArtificats = result.response;

        showArtifacts(window.cryptoArtificats);

        document.getElementById("actions-button").style.visibility = "visible";
        document.getElementById("actions-button-content").style.visibility = "visible";
        document.getElementById("edit-button").style.visibility = "visible";
        document.getElementById("edit-button-content").style.visibility = "visible";


        expandCollapsible("actions-button");

        document.getElementById("upload-passport-dialog").close();

        return false;

    });

    document.getElementById("upload-file").addEventListener("click", async function (event) {

        document.getElementById("upload-file-name").value = "";
        document.getElementById("upload-file-dialog").showModal();

    });

    document.getElementById("save-passport").addEventListener("click", async function (event) {

        document.getElementById("p12-password").value = "";
        document.getElementById("pod-save-dialog").showModal();

    });

    document.getElementById("select-upload-file").addEventListener("click", async function (event) {
        var fileUtil = new FileUtil(document);

        fileUtil.load(async function (files) {
            window.files = [];

            for (var file = 0; file < files.length; file++) {

                document.getElementById("upload-file-name").value = files[file].name;

                window.files.push(files[file]);

            }

        });

        return false;

    });

    document.getElementById("upload-file-dialog-ok").addEventListener("click", async function (event) {

        document.getElementById("upload-file-dialog").close();
        var message = new Message();

        var waitDialog = document.getElementById("wait-dialog");

        waitDialog.showModal();

        var result = await message.upload(couchdb.getURL(), window.cryptoArtificats['certificate'],
            window.cryptoArtificats['private-key'], files);

        window.cryptoArtificats['document'] = result.response['document'];

        showArtifacts(window.cryptoArtificats);

        waitDialog.close();

    });

    getConnection();

    document.getElementById("update-settings").addEventListener("click", async function (event) {

        document.getElementById("view-certificates").checked = settings.view_certificates;
        document.getElementById("view-keys").checked = settings.view_keys;
        document.getElementById("view-files").checked = settings.view_files;

        document.getElementById("settings-dialog").showModal();

    });

    document.getElementById("settings-dialog-ok").addEventListener("click", async function (event) {

        settings.view_certificates = document.getElementById("view-certificates").checked;
        settings.view_keys = document.getElementById("view-keys").checked;
        settings.view_files = document.getElementById("view-files").checked;

        showArtifacts(window.cryptoArtificats);

        document.getElementById("settings-dialog").close();

    });

    document.getElementById("backup-pod").addEventListener("click", async function (event) {
        var waitDialog = document.getElementById("wait-dialog");

        waitDialog.showModal();

        var message = new Message();

        var result = await message.backup(couchdb.getURL(), window.cryptoArtificats);

        var fileUtil = new FileUtil(document);

        fileUtil.saveAs(result, `pod-${window.cryptoArtificats['id']}.zip`);

        waitDialog.close();

               
        document.getElementById("info-message").innerHTML = `<b>Pod Backup Complete:</b> ${window.cryptoArtificats['id']}`;
        document.getElementById("info-dialog").showModal();

    });

    document.getElementById("edit-readme").addEventListener("click", async function (event) {
        var message = new Message();
        var result = await message.get(couchdb.getURL(), window.cryptoArtificats);
        var editDialog = document.getElementById("edit-dialog");

        editDialog.showModal();

        window.simplemde.value(JSON.parse(result)['folder']['readme.md']);


    });

    document.getElementById("register-passport").addEventListener("click", async function (event) {

        if (!window.passportEncoded) {
            const reader = new FileReader();

            reader.onload = function(e) {
                const blob = new Blob([new Uint8Array(e.target.result)], {type: window.passports[0].type });

                var blobReader = new FileReader();
                
                blobReader.readAsDataURL(blob); 
                
                blobReader.onloadend = function() {
                
                    var base64data = blobReader.result;                

                    window.localStorage.setItem(window.cryptoArtificats['id'], base64data);

                    document.getElementById("info-message").innerHTML = `<b>Passport Registered:</b> ${window.cryptoArtificats['id']}`;
                    document.getElementById("info-dialog").showModal();

                }

            };

            reader.readAsArrayBuffer(window.passports[0]);

        } else {

            var certificate = arrayBufferToBase64(window.passports[0]);

            window.localStorage.setItem(window.cryptoArtificats['id'], certificate);
            document.getElementById("info-message").innerHTML = `<b>Passport Registered:</b> ${window.cryptoArtificats['id']}`;
            document.getElementById("info-dialog").showModal();
        }

    });
    
    document.getElementById("unregister-passport").addEventListener("click", async function (event) {
 
        window.localStorage.removeItem(window.cryptoArtificats['id']);

        document.getElementById("info-message").innerHTML = `<b>Passport Unregistered:</b> ${window.cryptoArtificats['id']}`;
        document.getElementById("info-dialog").showModal();


    });

    document.getElementById("open-register").addEventListener("click", async function (event) {

        document.getElementById("registered-artifacts-container").innerHTML = "";
        
        for (var keyID = 0;  keyID < window.localStorage.length; keyID++) {            
            let template = document.querySelector('script[data-template="regsitered-pod-item"]').text;
            
            let value = stringUtil.substitute(template, {
                "id": window.localStorage.key( keyID )
                });

            let fragment = document.createRange().createContextualFragment(value);

            document.getElementById("registered-artifacts-container").appendChild(fragment);

        }

        document.getElementById("register-dialog").showModal();
  
    });

    document.getElementById("pod-open-dialog-ok").addEventListener("click", async function (event) {

        var message = new Message();
        var result = await message.open(couchdb.getURL(), window.passport, 
                        document.getElementById("pod-passport-password").value);

        window.cryptoArtificats = result.response;

        showArtifacts(window.cryptoArtificats);

        document.getElementById("actions-button").style.visibility = "visible";
        document.getElementById("actions-button-content").style.visibility = "visible";
        document.getElementById("edit-button").style.visibility = "visible";
        document.getElementById("edit-button-content").style.visibility = "visible";

        expandCollapsible("actions-button");

        document.getElementById("pod-open-dialog").close();
        document.getElementById("register-dialog").close();

    });

    document.getElementById("edit-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();

        var result = await message.set(couchdb.getURL(), window.cryptoArtificats, "readme.md", window.simplemde.value());

        window.cryptoArtificats['document'] = result;

        document.getElementById("edit-dialog").close();

    });

    document.getElementById("add-user").addEventListener("click", async function (event) {
       
        document.getElementById("upload-certificate-dialog").showModal();

    });

    document.getElementById("delete-pod").addEventListener("click", async function (event) {

        document.getElementById("delete-message").innerHTML = `Delete POD - <b>${window.cryptoArtificats['id']}</b>&nbsp;?`;
        
        document.getElementById("delete-dialog").showModal();

    });

    document.getElementById("delete-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();
        var result = await message.delete(couchdb.getURL(), window.cryptoArtificats['certificate']);

        window.localStorage.removeItem(window.cryptoArtificats['id']);

        window.cryptoArtificats = null;
        document.getElementById("details").innerHTML = "";
        window.passports = null;

        showArtifacts(window.cryptoArtificats);

        document.getElementById("delete-dialog").close();

    });

    document.getElementById("select-certificate-file").addEventListener("click", async function (event) {
        var fileUtil = new FileUtil(document);

        fileUtil.load(async function (files) {
            window.certificates = [];

            for (var file = 0; file < files.length; file++) {

                document.getElementById("upload-certificate-file").value = files[file].name;

                window.certificates.push(files[file]);

            }

        });

        return false;

    });

    document.getElementById("upload-certificate-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();

        var result = await message.add(couchdb.getURL(), window.cryptoArtificats, window.certificates);

        window.certificates = [];

        document.getElementById("upload-certificate-dialog").close()

    });
    document.getElementById("clear-pod-cache").addEventListener("click", async function (event) {

        window.localStorage.clear();

    });

}