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


}