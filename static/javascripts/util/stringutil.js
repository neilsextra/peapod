$
function StringUtil() {
 
    StringUtil.prototype.substitute = (template, values) => {
        let value = template;

        let keys = Object.keys(values);

        for (let key in keys) {
            value = value.split("${" + keys[key] + "}").join(values[keys[key]]);
        }
        
        return value;

    }

}