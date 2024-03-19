function CouchDB(url, version) {

    this.url = url;
    this.version = version;

    this.getURL = function() {

        return this.url;

    }

    CouchDB.prototype.getURL = function() {

        return this.url;
    
    }

    CouchDB.prototype.getVersion = function() {

        return this.version;
    
    }

    CouchDB.prototype.setVersion = function(version) {

        this.version = version;
    
    }

}
