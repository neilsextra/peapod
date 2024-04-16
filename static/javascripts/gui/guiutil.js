/**
 * Clear a specified dilaog
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
 * Enable a selected Button
 * 
 * @param {string} button id to enable 
 */
function enableButton(button) {

    document.getElementById(button).classList.remove("message-dialog-small-disabled-button");
    document.getElementById(button).classList.add("message-dialog-small-ok-button");
    document.getElementById(button).removeAttribute("disabled");

}

/**
 * Disable a selected Button
 * 
 * @param {string} button id to disable 
 */
function disableButton(button) {

    document.getElementById(button).classList.remove("message-dialog-small-ok-button");
    document.getElementById(button).classList.add("message-dialog-small-disabled-button");
    document.getElementById(button).setAttribute("disabled", "disabled");

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


