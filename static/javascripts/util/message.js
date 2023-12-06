function Message() {

    this.processFile = function (file) {

        return new Promise((accept, reject) => {
            let parmURL = `/upload`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();

            formData.append(file.name, file);

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
    
    this.getKeyPair = function () {

        return new Promise((accept, reject) => {

            let parmURL = `/keys`;

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

    Message.prototype.sendFile = function (file) {

        return this.processFile(file);

    }

    Message.prototype.generateKeyPair = function (keylength) {

        return this.getKeyPair();

    }

}
