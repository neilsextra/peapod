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

    document.getElementById("new-pod-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();

        var issuer = document.getElementById("issuer").value;
        var organisation = document.getElementById("organisation").value;
        var cn = document.getElementById("common-name").value;

        var keysize = document.getElementById("key-size").value;
        var exponent = document.getElementById("public-exponent").value;
        var validity = document.getElementById("validaty-period").value;

        var result = await message.generateKeyPair(issuer, organisation, cn, validity, keysize, exponent)

        let template = document.querySelector('script[data-template="certificate-card-item"]').text;
        let value = stringUtil.substitute(template, {
            "issuer": result.response.issuer,
            "serial": result.response['serial-number'],
            "subject": result.response['subject']
        });

        cryptoArtificats = result.response;

        let fragment = document.createRange().createContextualFragment(value);
        document.getElementById("artifacts-container").appendChild(fragment);

        template = document.querySelector('script[data-template="key-card-item"]').text;
        value = stringUtil.substitute(template, {
            "modulus": result.response['private-key-modulus'],
            "exponent": result.response['private-key-exponent']
        });

        fragment = document.createRange().createContextualFragment(value);
        document.getElementById("artifacts-container").appendChild(fragment);

        document.getElementById("p12-password").value = "";

        document.getElementById("pod-save-dialog").showModal();

        document.getElementById("")

    });

    document.getElementById("pod-save-dialog-ok").addEventListener("click", async function (event) {
        var message = new Message();

        var password = document.getElementById("p12-password").value;

        var result = await message.generate(cryptoArtificats, password)

        var fileUtil = new FileUtil(document);

        fileUtil.saveAs(result, "pod.p12");

        document.getElementById("pod-save-dialog").close();
        document.getElementById("new-pod-dialog").close();

    });
    

}