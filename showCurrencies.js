const getCurrency = document.getElementById('get-currency');
const base = document.getElementById("cur");
const accepted_currencies = ["RON", "EUR", "USD", "GBP", "CHF"];
const symbols = ["EUR", "RON", "USD", "GBP", "CHF"];
const currencies = 5;
var currencyArbitrage = new Array(currencies);
var currenciesAsList = new Array(currencies * currencies);
var updateInterval = 300000;

for (var i = 0; i < currencies; ++i) {
    currencyArbitrage[i] = new Array(currencies);
}

setInterval(function(){
    var xhr = [];
    for (var i = 0; i < currencies; ++i) {
        var base = accepted_currencies[i];
        var put = 0;
        (function(i){
            xhr[i] = new XMLHttpRequest();
            var url = "https://api.exchangeratesapi.io/latest?base=" + base + "&symbols=";
            for(var j = 0; j < currencies; ++j) {
                if (i != j) {
                    url += accepted_currencies[j];
                    if (put < currencies - 2) {
                        url += ",";
                    }
                    put++;
                }
            }
            xhr[i].open("GET", url);
            xhr[i].send();
            xhr[i].onreadystatechange = function(){
                if (xhr[i].readyState === 4 && xhr[i].status === 200){
                    // console.log('Response from request ' + i + ' [ ' + xhr[i].responseText + ']');
                    var json = JSON.parse(xhr[i].responseText);
                    var index = 0;
                    currencyArbitrage[i][i] = 1;
                    currenciesAsList[i * currencies + i] = 1;
                    for (var rate in json.rates) {
                        if (index == i) {
                            index++;
                        }
                        currencyArbitrage[i][index] = json.rates[rate];
                        currenciesAsList[i * currencies + index] = json.rates[rate];
                        index++;
                    }
                }
            };
        })(i);

    }

    // add to database
    var docData = {
        currencies: currenciesAsList,
        lastCheck: Date.now()
    };
    db.collection('api-info').doc('currencies').set(docData).then(function() {
        console.log("Data successfully added!");
    });

}, updateInterval);

getCurrency.onclick = () => {
    var rates = 0;
    var len = symbols.length;

    var Http = new XMLHttpRequest();
    var url = "https://api.exchangeratesapi.io/latest?base=" + base.value + "&symbols=";

    for(var i = 0; i < len; ++i) {
        if (symbols[i] != base.value) {
            rates++;
            url += symbols[i];
            if (i != len - 1) {
                url += ",";    
            }
        }
    }

    // for feature graph
    // var url2 = "https://api.exchangeratesapi.io/history?start_at=2018-01-01&end_at=2018-09-01&base=USD&symbols=RON";
    Http.open("GET", url);
    Http.send();

    Http.onreadystatechange=function(){
        if(this.readyState==4 && this.status==200) {
            var json = JSON.parse(Http.responseText);
            var result = "";
            

            for (var r in json.rates) {
                result += "1 " + base.value + " = " + json.rates[r] + " " + r;
                result += "\n";
            }
            
            window.alert(result);
        }
    }
}

function neg_log(matrix) {
    for (r in matrix) {
        for (c in r) {
            c = -Math.log(c);
        }
    }

    return matrix;
}

function fillArray(value, len) {
    var arr = [];
    for (var i = 0; i < len; i++) {
      arr.push(value);
    }
    return arr;
}


function arbitrage (mat) {
    var new_mat = neg_log(mat);

    var n = new_mat.length;
    var source = 0;

    var min_dist = fillArray(10000, n);
    min_dist[source] = source;

    var pre = fillArray(-1, n);

    for (i = 0; i < n - 1; ++i) {
        for (s_curr = 0; s_curr < n; ++s_curr) {
            for (d_curr = 0; d_curr < n; ++d_curr) {
                if (min_dist[d_curr] > min_dist[s_curr] + new_mat[s_curr][d_curr]) {
                    min_dist[d_curr] = min_dist[s_curr] + new_mat[s_curr][d_curr];
                    pre[d_curr] = s_curr;
                }
            }
        }
    }

    for (s_curr = 0; s_curr < n; ++s_curr) {
        for (d_curr = 0; d_curr < n; ++d_curr) {
            if (min_dist[d_curr] > min_dist[s_curr] + new_mat[s_curr][d_curr]) {
                console.log("Arbitrage opportunity");
                // TO DO
                var multiply = mat[s_curr][d_curr];
                
                while (pre[s_curr] != d_curr) {
                    multiply *= mat[pre[s_curr]][s_curr];
                    s_curr = pre[s_curr];
                    
                }
                return multiply; // Returts the multiplier factor

            }
        }
    }
    return 1;
}