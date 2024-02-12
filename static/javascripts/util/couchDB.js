function CouchDB(url) {

    this.url = url;

    this.getURL = function() {

        return this.url;

    }

    CouchDB.prototype.getURL = new function() {

        return this.url;
    
    }

}
