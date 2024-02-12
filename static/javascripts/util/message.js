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
    
    this.getKeyPair = function (issuer, org, cn, validity, keysize, exponent) {

        return new Promise((accept, reject) => {

            let parmURL = `/keys?issuer=${encodeURIComponent(issuer)}&` +
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

    Message.prototype.generate = function (cryptoArtificats) {

        return this.generate(file);

    }

    Message.prototype.generateKeyPair = function (issuer, org, cn, validity, keysize, exponent) {

        return this.getKeyPair(issuer, org, cn, validity, keysize, exponent);

    }

    Message.prototype.generate = function (cryptoArtificats) {

        return this.generate(file);

    }

    Message.prototype.connect = function (couchdbURL) {

        return this.connect(couchdbURL);

    }

}
