'use strict'

var bigTable = undefined;

var xOffset = 20;
var yOffset = 16;

var rows = [];
var types = {};
var columns = null;

var uploadedFile = null;

/**
 * Get the next ID
 * @returns the next ID
 */
function getID() {

    id += 1;

    return id;

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
 * Clear a specified dialog
 * @param {*} element  the dialog 'element' to clear
 */
function clearDialog(element) {
    const inputs = element.querySelectorAll("input[type=text]");

    inputs.forEach((item) => {

        item.value = "";

    });

    const checkboxes = element.querySelectorAll("input[type=checkbox]");

    checkboxes.forEach((item) => {

        item.checked = false;

    })

    const dates = element.querySelectorAll("input[type=date]");

    dates.forEach((item) => {

        item.value = "";

    });

    const textareas = element.querySelectorAll("textarea");

    textareas.forEach((item) => {

        item.value = "";

    });

    const keywords = element.querySelectorAll(".keyword-entry");

    keywords.forEach((item) => {

        item.parentNode.removeChild(item);

    });

    const tableBody = element.querySelectorAll(".table-view > tr");

    tableBody.forEach((item) => {

        item.parentNode.removeChild(item);

    });

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

    document.getElementById("upload-file").addEventListener("click", async function (event) {

        clearDialog(document.getElementById("upload-file-dialog"));

        document.getElementById("upload-file-dialog").showModal();

    });
    
    document.getElementById("select-upload-file").addEventListener("click", async function (event) {
        var fileUtil = new FileUtil(document);

        fileUtil.load(async function (files) {
        
            for (var file = 0; file < files.length; file++) {
      
                document.getElementById("upload-file-name").value = files[file].name;

                uploadedFile = files[file];

            }

        });

        return false;

    });   

    document.getElementById("upload-file-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();
        var result = await message.sendFile(uploadedFile);

        document.getElementById("upload-file-dialog").close();
 
    });

    document.getElementById("generate-key-pair").addEventListener("click", async function (event) {
        
        document.getElementById("key-generation-dialog").showModal();

    });

    document.getElementById("ok-key-generation-dialog").addEventListener("click", async function (event) {
        var message = new Message();
        var result = await message.generateKeyPair()

        document.getElementById("key-generation-dialog").close();

        document.getElementById("certificate-pem").innerText = result.response.certificate;

        document.getElementById("key-generation-results-dialog").showModal();

    });

}