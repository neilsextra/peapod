function Message() {

    this.connect = function (couchdbURL) {

        return new Promise((accept, reject) => {
            let parmURL = `/connect?couchdbURL=${encodeURIComponent(couchdbURL)}`;

            var xhttp = new XMLHttpRequest();

            xhttp.open("GET", parmURL, true);

            xhttp.onload = function () {
                
                if (this.readyState === 4 && this.status === 200) {
                    var response = JSON.parse(this.responseText);
     
                    var result = JSON.parse(xhttp.response);

                    accept({
                        status: this.status,
                        response: response
                    });

                } else {

                    reject({
                        status: this.status,
                        error: this.statusText,
                        message: this.responseText
                    });

                }

            };

            xhttp.onerror = function () {
     
                alert(this.statusText);

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

                    accept(this.response);

                } else {

                    reject({
                        status: this.status,
                        error: this.statusText,
                        message: this.response
                    });

                }

            };

            xhttp.onerror = function () {
            };

            xhttp.send(formData);

        });

    }

    this.create = function (couchdbURL, email, issuer, org, cn, validity, keysize, exponent) {

        return new Promise((accept, reject) => {

            let parmURL = `/create?couchdbURL=${encodeURIComponent(couchdbURL)}&` +
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


                    accept({
                        status: this.status,
                        response: response
                    });

                } else {

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
                if (this.readyState === 4 && this.status === 200) {
                    var result = JSON.parse(xhttp.response);

                    accept({
                        status: this.status,
                        response: response
                    });

                } else {

                    reject({
                        status: this.status,
                        error: this.statusText,
                        message: this.response
                    });
                }

            };

            xhttp.onerror = function () {
            };

            xhttp.send(formData);

        });

    }

    this.upload = function (couchdbURL, certificate, key, files) {

        return new Promise((accept, reject) => {
            let parmURL = `/upload`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
            
            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", certificate);
            formData.append("key", key);

            for (var file = 0; file < files.length; file++) {
                formData.append(files[file].name, files[file]);
            }

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

    this.download = function (couchdbURL, certificate, key, attachment, binary) {

        return new Promise((accept, reject) => {
            let parmURL = `/download`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
            
            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", certificate);
            formData.append("key", key);
            formData.append("attachment", attachment);

            if (binary) {
                xhttp.responseType = "arraybuffer";
            }

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                if (this.readyState === 4 && this.status === 200) {

                    accept(this.response);

                } else {

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

    this.remove = function (couchdbURL, certificate, attachmentName) {

        return new Promise((accept, reject) => {
            let parmURL = "/remove";
    
            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
    
            formData.append('couchdb-url', couchdbURL);
            formData.append('certificate', certificate);
            formData.append('attachment-name', attachmentName);
    
            xhttp.open("POST", parmURL, true);
    
            xhttp.onload = function () {
                var response = JSON.parse(this.responseText);
                
                if (this.readyState === 4 && this.status === 200) {
    
                    accept({
                        status: this.status,
                        response: response
                    });
    
                } else {
    
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

    this.delete = function (couchdbURL, certificate, attachmentName) {

        return new Promise((accept, reject) => {
            let parmURL = "/delete";
    
            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
    
            formData.append('couchdb-url', couchdbURL);
            formData.append('certificate', certificate);

            xhttp.open("POST", parmURL, true);
    
            xhttp.onload = function () {
                var response = JSON.parse(this.responseText);
                
                if (this.readyState === 4 && this.status === 200) {
    
                    accept({
                        status: this.status,
                        response: response
                    });
    
                } else {
    
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

    this.backup = function (couchdbURL, cryptoArtifacts) {

        return new Promise((accept, reject) => {
            let parmURL = `/backup`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();

            formData.append("couchdbURL", couchdbURL);
            formData.append("key", cryptoArtifacts['private-key']);
            formData.append("certificate", cryptoArtifacts['certificate']);

            xhttp.responseType = "arraybuffer";

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                if (this.readyState === 4 && this.status === 200) {

                    accept(this.response);

                } else {

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

    this.restore = function (couchdbURL, certificate, key, files) {

        return new Promise((accept, reject) => {
            let parmURL = `/restore`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
            
            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", certificate);
            formData.append("key", key);

            for (var file = 0; file < files.length; file++) {
                formData.append(files[file].name, files[file]);
            }

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

    this.get = function (couchdbURL, cryptoArtifacts) {

        return new Promise((accept, reject) => {
            let parmURL = `/get`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();

            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", cryptoArtifacts['certificate']);

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                if (this.readyState === 4 && this.status === 200) {

                    accept(this.response);

                } else {

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

    this.set = function (couchdbURL, cryptoArtifacts, name, value) {

        return new Promise((accept, reject) => {
            let parmURL = `/set`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();

            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", cryptoArtifacts['certificate']);
            formData.append("name", name);

            formData.append("value", value);

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                if (this.readyState === 4 && this.status === 200) {

                    accept(this.response);

                } else {

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

    this.expand = function (couchdbURL, cryptoArtifacts) {

        return new Promise((accept, reject) => {
            let parmURL = `/expand`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();

            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", cryptoArtifacts['certificate']);

            xhttp.open("POST", parmURL, true);

            xhttp.onload = function () {
                if (this.readyState === 4 && this.status === 200) {

                    accept(this.response);

                } else {

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

    this.share = function (couchdbURL, cryptoArtifactes, certificates) {

        return new Promise((accept, reject) => {
            let parmURL = `/share`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
            
            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", cryptoArtifactes['certificate']);

            for (var certificate = 0; certificate < certificates.length; certificate++) {
                formData.append(certificates[certificate].name, certificates[certificate]);
            }

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

    this.unshare = function (couchdbURL, cryptoArtifactes, other) {

        return new Promise((accept, reject) => {
            let parmURL = `/unshare`;

            var xhttp = new XMLHttpRequest();
            var formData = new FormData();
            
            formData.append("couchdbURL", couchdbURL);
            formData.append("certificate", cryptoArtifactes['certificate']);
            formData.append("other", other);

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

    Message.prototype.create = function (couchdbURL, email, issuer, org, cn, validity, keysize, exponent) {

        return this.create(couchdbURL, email, issuer, org, cn, validity, keysize, exponent);

    }

    Message.prototype.connect = function (couchdbURL) {

        return this.connect(couchdbURL);

    }

    Message.prototype.open = function (couchdbURL, file, password) {

        return this.open(couchdbURL, file, password);

    }

    Message.prototype.upload = function (couchdbURL, certificate, key, files) {

        return this.upload(couchdbURL, certificate, key, files);

    }
    
    Message.prototype.download = function (couchdbURL, certificate, key, filename, binary = false) {

        return this.download(couchdbURL, certificate, key, filename, binary);

    }
       
    Message.prototype.remove = function (couchdbURL, certificate, filename) {

        return this.remove(couchdbURL, certificate, filename);

    }
           
    Message.prototype.delete = function (couchdbURL, certificate) {

        return this.remove(couchdbURL, certificate);

    }

    Message.prototype.backup = function (couchdbURL, cryptoArtifacts) {

        return this.backup(couchdbURL, cryptoArtifacts);

    }
       
    Message.prototype.restore = function (couchdbURL, certificate, key, files) {
        
        return this.restore(couchdbURL, certificate, key, files);

    }
            
    Message.prototype.get = function (couchdbURL, cryptoArtifacts) {

        return this.backup(couchdbURL, cryptoArtifacts);

    }
            
    Message.prototype.set = function (couchdbURL, cryptoArtifacts, name, value) {

        return this.backup(couchdbURL, cryptoArtifacts, name, value);

    }

    Message.prototype.share = function (couchdbURL, cryptoArtifacts, certificates) {

        return this.share(couchdbURL, cryptoArtifacts, certificates);

    }
    
    Message.prototype.unshare = function (couchdbURL, cryptoArtifacts, other) {

        return this.unshare(couchdbURL, cryptoArtifacts, other);

    }
      
    Message.prototype.expand = function (couchdbURL, cryptoArtifacts) {

        return this.expand(couchdbURL, cryptoArtifacts);

    }

}