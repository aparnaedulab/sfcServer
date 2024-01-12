var randomstring = require('randomstring');

function generateRandomString(length){
    return randomstring.generate({
        length: length,
        charset: 'alphabetic'
    });
}

module.exports = {
    generateRandomString,
  };