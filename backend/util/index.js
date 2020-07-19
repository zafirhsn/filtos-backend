module.exports = {
  roughSizeOfObject(object) {
    var objectList = [];
    var stack = [ object ];
    var bytes = 0;
  
    while ( stack.length ) {
        var value = stack.pop();
  
        if ( typeof value === 'boolean' ) {
            bytes += 4;
        }
        else if ( typeof value === 'string' ) {
            bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
            bytes += 8;
        }
        else if
        (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
        )
        {
            objectList.push( value );
  
            for( var i in value ) {
                stack.push( value[ i ] );
            }
        }
    }
    return bytes;
  },
  getBinarySize(string) {
    return Buffer.byteLength(string, 'utf8');
  },
  sizeReduction(obj1, obj2) {
    let sizeObj1; 
    let sizeObj2;
    if (typeof obj1 === "string") {
      sizeObj1 = this.getBinarySize(obj1);
    }
    else {
      sizeObj1 = this.roughSizeOfObject(obj1);
    }
    if (typeof obj2 === "string") {
      sizeObj2 = this.getBinarySize(obj2);
    } else {
      sizeObj2 = this.roughSizeOfObject(obj2);
    }
    let percent = ((sizeObj1 - sizeObj2) / sizeObj1) * 100;
    percent = percent.toFixed(2);
    console.log(`There was a ${percent}% reduction in size      ${sizeObj1} ===> ${sizeObj2}`);
  
  },
  timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
