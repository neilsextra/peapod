function Message() {

    this.connect = function (couchdbURL) {

        return new Promise((accept, reject) => {
            let parmURL = `/connect?couchdbURL=${encodeURIComponent(couchdbURL)}`;

            var xhttp = new XMLHttpRequest();

            xhttp.open("GET", parmURL, true);

            xhttp.onload = function () {
                var response = JSON.parse(this.responseText);

                if (this.readyState === 4 && this.status === 200) {
                    var result = JSON.parse(xhttp.response);

                    console.log(xhttp.status);

                    accept({
                        status: this.status,
                        response: response
                    });

                } else {

                    console.log('ERROR');

                    reject({
                        status: this.status,
                        message: this.statusText
                    });

                }

            };

            xhttp.onerror = function () {
            };

            xhttp.send();

        });

    }

    this.generate = function (cryptoArtifacts, password) {

        return new Promise((accept, reject) => {
            let parmURL = `/generate`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();

            formData.append('password', password);

            formData.append('private-key', cryptoArtifacts['private-key']);
            formData.append('certificate', cryptoArtifacts['certificate']);

            xhttp.responseType = "arraybuffer";

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                if (this.readyState === 4 && this.status === 200) {

                    console.log(xhttp.status);

                    console.log(this.response)

                    accept(this.response);

                } else {

                    console.log('ERROR');

                    reject({
                        status: this.status,
                        message: this.statusText
                    });

                }

            };

            xhttp.onerror = function () {
            };

            xhttp.send(formData);

        });

    }

    this.getKeyPair = function (couchdbURL, email, issuer, org, cn, validity, keysize, exponent) {

        return new Promise((accept, reject) => {

            let parmURL = `/keys?couchdbURL=${encodeURIComponent(couchdbURL)}&` +
                `email=${encodeURIComponent(email)}&` +
                `issuer=${encodeURIComponent(issuer)}&` +
                `org=${encodeURIComponent(org)}&` +
                `cn=${encodeURIComponent(cn)}&` +
                `validity=${encodeURIComponent(validity)}&` +
                `keysize=${encodeURIComponent(keysize)}&` +
                `exponent=${encodeURIComponent(exponent)}&`;

            var xhttp = new XMLHttpRequest();

            xhttp.open("GET", parmURL, true);

            xhttp.onload = function () {
                var response = JSON.parse(this.responseText);

                if (this.readyState === 4 && this.status === 200) {
                    var result = JSON.parse(xhttp.response);

                    console.log(xhttp.status);

                    accept({
                        status: this.status,
                        response: response
                    });

                } else {

                    console.log('ERROR');

                    reject({
                        status: this.status,
                        message: this.statusText
                    });

                }

            };

            xhttp.onerror = function () {
            };

            xhttp.send();

        });

    }

    this.open = function (couchdbURL, file, password) {

        return new Promise((accept, reject) => {
            let parmURL = `/open`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();

            formData.append("couchdbURL", couchdbURL);
            formData.append("password", password);
            formData.append(file.name, file);

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                var response = JSON.parse(this.responseText);

                if (this.readyState === 4 && this.status === 200) {
                    var result = JSON.parse(xhttp.response);

                    accept({
                        status: this.status,
                        response: response
                    });

                } else {

                    console.log('ERROR');

                    reject({
                        status: this.status,
                        message: this.statusText
                    });

                }

            };

            xhttp.onerror = function () {
            };

            xhttp.send(formData);

        });

    }

    this.upload = function (couchdbURL, certificate, files) {

        return new Promise((accept, reject) => {
            let parmURL = `/upload`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
            
            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", certificate);

            for (var file = 0; file < files.length; file++) {
                formData.append(files[file].name, files[file]);
            }

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                var response = JSON.parse(this.responseText);

                if (this.readyState === 4 && this.status === 200) {
                    var result = JSON.parse(xhttp.response);

                    console.log(xhttp.status);

                    accept({
                        status: this.status,
                        response: response
                    });

                } else {

                    console.log('ERROR');

                    reject({
                        status: this.status,
                        message: this.statusText
                    });

                }

            };

            xhttp.onerror = function () {
            };

            xhttp.send(formData);

        });

    }

    this.download = function (couchdbURL, certificate, key, attachment) {

        return new Promise((accept, reject) => {
            let parmURL = `/download`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
            
            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", certificate);
            formData.append("key", key);
            formData.append("attachment", attachment);

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                if (this.readyState === 4 && this.status === 200) {
                    console.log(xhttp.status);

                    accept(this.response);

                } else {

                    console.log('ERROR');

                    reject({
                        status: this.status,
                        message: this.statusText
                    });

                }

            };

            xhttp.onerror = function () {
            };

            xhttp.send(formData);

        });

    }

    Message.prototype.generate = function (cryptoArtificats) {

        return this.generate(file);

    }

    Message.prototype.generateKeyPair = function (couchdbURL, email, issuer, org, cn, validity, keysize, exponent) {

        return this.getKeyPair(couchdbURL, email, issuer, org, cn, validity, keysize, exponent);

    }

    Message.prototype.connect = function (couchdbURL) {

        return this.connect(couchdbURL);

    }

    Message.prototype.open = function (couchdbURL, file, password) {

        return this.open(couchdbURL, file, password);

    }

    Message.prototype.upload = function (couchdbURL, certificate, files) {

        return this.upload(couchdbURL, certificate, files);

    }
    
    Message.prototype.download = function (couchdbURL, certificate, key, filename) {

        return this.download(couchdbURL, certificate, key, filename);

    }

}