function hexview(data) {
    var innerHTML = "";
    for (i in u = new Uint8Array(data)) {
        innerHTML += (i % 16 ? ' ' : `<p></p>` + 
            (1e7 + (+i)[t = 'toString'](16)).slice(-8) + ' | ') + 
            (0 + u[i][t] (16)).slice(-2); 
  
    }

    return innerHTML;
    
}
