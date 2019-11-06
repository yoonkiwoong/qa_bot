let decimal = process.argv[2];

let quotient = Math.trunc(decimal / 2);

let remainder = decimal % 2;

let i = 0;
let binaryResult = new Array();
binaryResult[i] = remainder;

while (quotient > 0) {
  remainder = quotient % 2;

  i = ++i;
  binaryResult[i] = remainder;

  quotient = Math.trunc(quotient / 2);
  }

let result = binaryResult.reverse();
result.forEach(function(item){
  console.log(item);
});
