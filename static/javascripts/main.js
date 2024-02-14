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

var passports = [];

var id = 0;

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
 * Remove all the event listeners for an element
 * @param {String} id the element Identifier
 */

function removeAllEventListeners(id) {
    var oldElement = document.getElementById(id);
    var newElement = oldElement.cloneNode(true);

    oldElement.parentNode.replaceChild(newElement, oldElement);

}

/**
 * Set the Collapsibe Handler
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
 * Get the Connection
 */
async function getConnection() {

    document.getElementById("connect-dialog").showModal();

}

/**
 * Show the Cryptographic Artifacts - Certificate Information
 * @param {*} artifcats 
 */
function showArtifacts(artifcats) {
    document.getElementById("artifacts-container").innerHTML = "";

    id += 1;

    let template = document.querySelector('script[data-template="certificate-card-item"]').text;
    let value = stringUtil.substitute(template, {
        "id": id,
        "issuer": artifcats['issuer'],
        "subject": artifcats['subject']
    });

    id += 1;

    let fragment = document.createRange().createContextualFragment(value);
    document.getElementById("artifacts-container").appendChild(fragment);

    template = document.querySelector('script[data-template="key-card-item"]').text;
    value = stringUtil.substitute(template, {
        "id": id,
        "modulus": artifcats['private-key-modulus'],
        "exponent": artifcats['private-key-exponent']
    });

    fragment = document.createRange().createContextualFragment(value);
    document.getElementById("artifacts-container").appendChild(fragment);

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

    document.getElementById("new-pod").addEventListener("click", async function (event) {

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

        try {

            waitDialog.showModal();

            var message = new Message()
            var result = await message.connect(document.getElementById("couchdb-url").value);

            document.getElementById("couchdb-status").innerHTML = `CouchDB Version: ${result['response']['version']} - &#128154;`;

            couchdb = new CouchDB(document.getElementById("couchdb-url").value);

            document.getElementById("connect-dialog").close();
            document.getElementById("wait-dialog").close();

            document.getElementById("cancel-connect-dialog").style.visibility = "visible";

        } catch (e) {
            document.getElementById("connect-message").innerHTML = e.message;
            waitDialog.close();
        }

        return false;

    });

    document.getElementById("new-pod-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();

        var issuer = document.getElementById("issuer").value;
        var organisation = document.getElementById("organisation").value;
        var cn = document.getElementById("common-name").value;

        var keysize = document.getElementById("key-size").value;
        var exponent = document.getElementById("public-exponent").value;
        var validity = document.getElementById("validaty-period").value;

        var result = await message.generateKeyPair(couchdb.getURL(), issuer, organisation, cn, validity, keysize, exponent)

        cryptoArtificats = result.response;

        document.getElementById("p12-password").value = "";

        document.getElementById("pod-save-dialog").showModal();

    });

    document.getElementById("pod-save-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();

        var password = document.getElementById("p12-password").value;

        var result = await message.generate(cryptoArtificats, password)

        var fileUtil = new FileUtil(document);

        fileUtil.saveAs(result, "pod.p12");

        document.getElementById("pod-save-dialog").close();
        document.getElementById("new-pod-dialog").close();

        showArtifacts(cryptoArtificats);

    });

    document.getElementById("open-pod").addEventListener("click", async function (event) {

        document.getElementById("upload-passport-dialog").showModal();

    });

    document.getElementById("select-upload-passport").addEventListener("click", async function (event) {
        var fileUtil = new FileUtil(document);

        fileUtil.load(async function (files) {
            passports = [];

            for (var file = 0; file < files.length; file++) {

                document.getElementById("upload-passport-file").value = files[file].name;

                passports.push(files[file]);

            }

        });

        return false;

    });

    document.getElementById("upload-passport-dialog-ok").addEventListener("click", async function (event) {

        var password = document.getElementById("passport-password").value;

        var message = new Message();
        var result = await message.open(couchdb.getURL(), passports[0], password)

        cryptoArtificats = result.response;

        showArtifacts(cryptoArtificats)

        document.getElementById("upload-passport-dialog").close();

        return false;

    });

    getConnection();

}