function StringUtil() {

    StringUtil.prototype.substitute = (template, values) => {
        let value = template;

        let keys = Object.keys(values);

        for (let key in keys) {
            value = value.split("${" + keys[key] + "}").join(values[keys[key]]);
        }

        return value;

    }

    StringUtil.prototype.capitalize = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    StringUtil.prototype.arrayBufferToBase64 = (buffer) => {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        return window.btoa(binary);

    }

    StringUtil.prototype.base64ToBlob = (base64String, contentType = '') => {
        const byteCharacters = atob(base64String);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i));
        }

        const byteArray = new Uint8Array(byteArrays);

        return new Blob([byteArray], { type: contentType });

    }

    StringUtil.prototype.processURI = (dataURI) => {

        if (dataURI.startsWith("data:")) {
            var message = dataURI.split(/;|,|:/);

            return {
                "base64": message[3],
                "mimetype": message[1]
            }
        } else {
            return {
                "base64": dataURI,
                "mimetype": "application/x-pkcs12"
            }

        }

    }


}