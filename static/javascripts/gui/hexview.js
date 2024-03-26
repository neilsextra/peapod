function hexview(data) {
    var innerHTML = "";
    var chars = "";
    var i = 0;

    for (i in u = new Uint8Array(data)) {
        innerHTML += (i % 16 ? ' ' : ` ${i != 0 ? " | " + chars + "<p></p>" : ""}` +
            (1e7 + (+i)[t = 'toString'](16)).slice(-8) + ' | ') +
            (0 + u[i][t](16)).slice(-2);

        if (!(i % 16)) {
            chars = "";
        }

        chars += String.fromCharCode(u[i]).replace(/[^ -~]+/g, ".").replace(" ", "&nbsp;");

    }

    console.log(`I is ${i} - ${i % 16}`);

    if (i % 16) {
        innerHTML += " | ".padStart((16 - (i % 16)) * 3, "-").replace(/-/g, "&nbsp;") + chars;
    }

    return innerHTML;

}
