
// var urlParams = new URLSearchParams(window.location.search);
// var param1 = urlParams.get('param1');
// var param2 = urlParams.get('param2');
// var param3 = urlParams.get('param3');
// var param4 = urlParams.get('param4');
// var param5 = urlParams.get('param5');
// var param6 = urlParams.get('param6');
// var param7 = urlParams.get('param7');
var param1 = 60;
var param2 = 35;
var param3 = 35;
var param4 = -10;
var param5 = 5;
var param6 = 5;
var param7 = 4;

var map = L.map('map', {
    minZoom: param7,
    maxZoom: 11
});

//Satellite Layer
googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});
googleSat.addTo(map);
googleSta = L.tileLayer('http://{s}.tile.stamen.com/terrain-lines/{z}/{x}/{y}.png',{
    maxZoom: 20
});
googleSta.addTo(map);

var maxBounds;
var player = -1;
var playerColor = 'Blue';
var latStart;
var latEnd;
var lngStart;
var lngEnd;
var latNum;
var lngNum;
var x1;
var x2;
var x3;
var y1;
var y2;
var y3;
var loggedCities = [];
var grid = [];
var gridCircle = [];
var keepRecord = [];
var movesPlayed = 0;
var gameOver = false;
var dangerGen = [];
var potentialGen = [];
var detMat = [];
var concreteDanPot = [];
var playingAgainstAi = true;
var blockedRow = -1;
var blockedCol = -1;

getGrid(param1, param2, param3, param4, param5, param6, param7);


function distance(point1, point2){
    var lat1 = point1.lat;
    var lon1 = point1.lng;
    var lat2 = point2.lat;
    var lon2 = point2.lng;
    const earthRadius = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
    return distance;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function getGrid(latStart, latEnd, lngStart, lngEnd, latNum, lngNum, zoom) {
    this.latStart = latStart;
    this.latEnd = latEnd;
    this.lngStart = lngStart;
    this.lngEnd = lngEnd;
    this.latNum = latNum;
    this.lngNum = lngNum;
    var latInterval = parseInt((latStart - latEnd) / latNum);
    var lngInterval = parseInt((lngStart - lngEnd) / lngNum);
    var lat = latStart;
    var lng = lngStart;

    while (lat > latEnd) {
        var gridLat = L.polyline([[lat, lngStart], [lat, lngEnd]], {color: 'grey', weight: 2});
        gridLat.addTo(map);
        lat -= latInterval;
    }
    var gridLat = L.polyline([[lat, lngStart], [lat, lngEnd]], {color: 'grey', weight: 2});
    gridLat.addTo(map);
    this.latEnd = lat;
    while (lng > lngEnd) {
        var gridLng = L.polyline([[latStart, lng], [latEnd, lng]], {color: 'grey', weight: 2});
        gridLng.addTo(map);
        lng -= lngInterval;
    }
    var gridLng = L.polyline([[latStart, lng], [latEnd, lng]], {color: 'grey', weight: 2});
    gridLng.addTo(map);
    this.lngEnd = lng;

    var maxN = this.latStart;
    var maxS = this.latEnd;
    var maxW = this.lngEnd;
    var maxE = this.lngStart;
    maxN++;
    maxS--;
    maxE++;
    maxW--;

    maxBounds = L.latLngBounds(L.latLng(maxS, maxW), L.latLng(maxN, maxE));
    map.setMaxBounds(maxBounds);

    map.setView([this.latEnd + (this.latStart - this.latEnd)/2, this.lngEnd + (this.lngStart - this.lngEnd)/2], zoom);

    var tab = [];
    for (var i = 0; i < latNum; i++) {
        var subArray = [];
        for (var j = 0; j < lngNum; j++) {
            subArray.push(0);
        }
        tab.push(subArray);
    }
    grid = tab;
    var tab2 = [];
    for (var i = 0; i < latNum; i++) {
        var subArray2 = [];
        for (var j = 0; j < lngNum; j++) {
            subArray2.push(null);
        }
        tab2.push(subArray2);
    }
    gridCircle = tab2;

    var tab3 = [];
    for (var i = 0; i < latNum; i++) {
        var subArray3 = [];
        for (var j = 0; j < lngNum; j++) {
            subArray3.push(0);
        }
        tab3.push(subArray3);
    }
    dangerGen = tab3;

    var tab4 = [];
    for (var i = 0; i < latNum; i++) {
        var subArray4 = [];
        for (var j = 0; j < lngNum; j++) {
            subArray4.push(0);
        }
        tab4.push(subArray4);
    }
    potentialGen = tab4;

    var tab5 = [];
    for (var i = 0; i < latNum; i++) {
        var subArray5 = [];
        for (var j = 0; j < lngNum; j++) {
            subArray5.push(0);
        }
        tab5.push(subArray5);
    }
    detMat = tab5;

    var tab6 = [];
    for (var i = 0; i < latNum; i++) {
        var subArray6 = [];
        for (var j = 0; j < lngNum; j++) {
            subArray6.push(0);
        }
        tab6.push(subArray6);
    }
    concreteDanPot = tab6;
}

async function logResult(city){
    var canBeLogged = false;
    var min;
    var record = [];
    var action = 0;
    var recordRow = -1;
    var recordCol = -1;
    var center = null;
    if(city.lat <= latStart && city.lat >= latEnd && city.lng <= lngStart && city.lng >= lngEnd){
        var cityLat = city.lat;
        var cityLng = city.lng;
        var latInt = parseInt((latStart - latEnd) / latNum);
        var midLat = latStart - latInt * parseInt((latStart - cityLat) / latInt);
        midLat -= 0.5 * latInt;
        var lngInt = parseInt((lngStart - lngEnd) / lngNum);
        var midLng = lngStart - lngInt * parseInt((lngStart - cityLng) / lngInt);
        midLng -= 0.5 * lngInt;
        center = Object.assign({}, city);
        center.lat = midLat;
        center.lng = midLng;
        var n = Object.assign({}, center);
        n.lat = midLat + 0.5 * latInt;
        var s = Object.assign({}, center);
        s.lat = midLat - 0.5 * latInt;
        var e = Object.assign({}, center);
        e.lng = midLng + 0.5 * lngInt;
        var w = Object.assign({}, center);
        w.lng = midLng - 0.5 * lngInt;
        min = distance(center, n);
        if(distance(center, s) < min){
            min = distance(center, s);
        }
        if(distance(center, e) < min){
            min = distance(center, e);
        }
        if(distance(center, w) < min){
            min = distance(center, w);
        }
        var row = parseInt((latStart - cityLat) / latInt);
        var col = parseInt((cityLng - lngEnd) / lngInt);
        recordRow = row;
        recordCol = col;
        if(grid[row][col] == 0){
            if(blockedRow != recordRow || blockedCol != recordCol){
                canBeLogged = true;
                action = 1;
                blockedRow = recordRow;
                blockedCol = recordCol;
            }
            else{
                ///////////
                console.log('gg1')
            }
        }
        else if(threeInARow(grid[row][col], row, col)){
            if(blockedRow != recordRow || blockedCol != recordCol){
                canBeLogged = true;
                action = -1;
                map.removeLayer(gridCircle[row][col]);
                blockedRow = recordRow;
                blockedCol = recordCol;
            }
            else{
                console.log('gg')
                ///////////
            }
        }
        else{
            messageElement = document.getElementById("message");
            messageElement.textContent = "Unfortunately your move is not valid, because your city is located in a field, that is currently blocked for you";
        }
    }
    else{
        messageElement = document.getElementById("message");
        messageElement.textContent = "Unfortunately your move is not valid, because your city is located outside of the playing field";
    }
    if(canBeLogged){
        var fillColour = 'blue';
        var lineColour = 'blue';
        var pushGrid = -1;
        if(player > 0){
            fillColour = 'red';
            lineColour = 'red';
            pushGrid = 1;
        }
        var radius = 0.8 * min;
        var circle = L.circle(center, {
            color: lineColour,
            fillColor: fillColour,
            fillOpacity: 0.3,
            radius: radius * 1000
        }).addTo(map);
        grid[row][col] = pushGrid;
        gridCircle[row][col] = circle;
    }
    player = player * (-1);
    playerColor = 'Blue';
    if(player > 0){
        playerColor = 'Red';
    }
    var turnLabel = document.getElementById("turnLabel");
    turnLabel.textContent = "It is " + playerColor + "'s turn:";
    movesPlayed++;
    record.push(action);
    record.push(recordRow);
    record.push(recordCol);
    record.push(min);
    record.push(center);
    keepRecord.push(record);
    x1 = undefined;
    x2 = undefined;
    x3 = undefined;
    y1 = undefined;
    y2 = undefined;
    y3 = undefined;
    if(canBeLogged){
        if(won(grid[recordRow][recordCol],recordRow ,recordCol)){
            if(playingAgainstAi){
                var container = document.getElementById("c2");
                var text = 'You lost against my AI hahahaha'
                if(player > 0){
                    text = 'Congrats! You defeated the AI';
                }
                container.innerHTML = '<p>' + text + '</p><button onclick="nextGame()">Next Game</button>';
                gameOver = true;
            }
            else{
                var container = document.getElementById("c2");
                var winner = 'Red'
                if(player > 0){
                    winner = 'Blue';
                }
                container.innerHTML = '<p>Congrats! ' + winner + ' won.</p><button onclick="nextGame()">Next Game</button>';
                gameOver = true;
            }
        }
    }
    // playing against AI
    if(!gameOver){
        if(player > 0){
            if(canBeLogged){
                logPlayersMove(recordRow, recordCol);
                updateDetMat();
            }
            document.getElementById("userInput").disabled = true;
            await delay(1000);
            automaticResponse();
            if(!gameOver){
                document.getElementById("userInput").disabled = false;
                var userInput = document.getElementById("userInput");
                userInput.value = "";
                userInput.focus();
            }
        }
    }
    /////////////////////
    if(gameOver){
        var undoButton = document.getElementById("undoButton");
        undoButton.disabled = true;
    }
    if(!playingAgainstAi){
        if (movesPlayed > 0) {
            var undoButton = document.getElementById("undoButton");
            undoButton.disabled = false;
        } else {
            var undoButton = document.getElementById("undoButton");
            undoButton.disabled = true;
        }
    }
    else{
        var undoButton = document.getElementById("undoButton");
        undoButton.disabled = true;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkCityTicTacToe(city){
    var cityLat = 100;
    var cityLng = 200;
    for(var i = 0; i < data.length; i++){
        if(data[i].name == city){
            if(data[i].lat <= latStart && data[i].lat >= latEnd && data[i].lng <= lngStart && data[i].lng >= lngEnd){
                cityLat = data[i].lat;
                cityLng = data[i].lng;
            }
        }
    }
    var c = { lat: cityLat, lng: cityLng };
    return c;
}

function levenshtein(string1, string2){
    string1 = string1.toLowerCase();
    string2 = string2.toLowerCase();
    var a = string1.split('');
    var b = string2.split('');
    var tab = [];
    for (var i = 0; i < a.length + 2; i++) {
        var subArray = [];
        for (var j = 0; j < b.length + 2; j++) {
            subArray.push(null);
        }
        tab.push(subArray);
    }
    for(var m = 2; m < a.length + 2; m++){
        tab[m][0] = a[m-2];
    }
    for(var n = 2; n < b.length + 2; n++){
        tab[0][n] = b[n-2];
    }
    for(var k = 1; k < a.length + 2; k++){
        tab[k][1] = k - 1;
    }
    for(var l = 1; l < b.length + 2; l++){
        tab[1][l] = l - 1;
    }
    for(var o = 2; o < a.length + 2; o++){
        for(var p = 2; p < b.length + 2; p++){
            var currentA = tab[o][0];
            var currentB = tab[0][p];
            var sub = tab[o-1][p-1] + 1;
            var del = tab[o-1][p] + 1;
            var ins = tab[o][p-1] + 1;
            if(currentA == currentB){
                sub--;
            }
            else if(currentB == tab[o-1][0]){
                if(currentA == tab[0][p-1]){
                    if(o > 2){
                        if(p > 2){
                            if(tab[o-2][p-2] + 1 < sub){
                                sub = tab[o-2][p-2] + 1;
                            }
                        }
                    }
                }
            }
            var min = sub;
            if(del < min){
                min = del;
            }
            if(ins < min){
                min = ins;
            }
            tab[o][p] = min;
        }
    }
    return tab[a.length + 1][b.length + 1];
}

function getClosest(city){
    var lev;
    x1 = data[0].name;
    y1 = levenshtein(city, data[0].name);
    x2 = data[1].name;
    y2 = levenshtein(city, data[1].name);
    if(y2 < y1){
        var tmpy = y1;
        y1 = y2;
        y2 = tmpy;
        var tmpx = x1;
        x1 = x2;
        x2 = tmpx;
    }
    x3 = data[2].name;
    y3 = levenshtein(city, data[2].name);
    if(y3 < y2){
        if(y3 < y1){
            var tmpy2 = y1;
            y1 = y3;
            y3 = y2;
            y2 = tmpy2;
            var tmpx2 = x1;
            x1 = x3;
            x3 = x2;
            x2 = tmpx2;
        }
        else {
            var tmpy3 = y2;
            y2 = y3;
            y3 = tmpy3;
            var tmpx3 = x2;
            x2 = x3;
            x3 = tmpx3;
        }
    }
    for(var i = 3; i < data.length; i++){
        lev = levenshtein(city, data[i].name);
        if(lev < y3){
            var levx = data[i].name;
            if(lev < y2){
                if(lev < y1){
                    tmpy2 = y1;
                    y1 = lev;
                    y3 = y2;
                    y2 = tmpy2;
                    tmpx2 = x1;
                    x1 = levx;
                    x3 = x2;
                    x2 = tmpx2;
                }
                else{
                    tmpy3 = y2;
                    y2 = lev;
                    y3 = tmpy3;
                    tmpx3 = x2;
                    x2 = levx;
                    x3 = tmpx3;
                }
            }
            else{
                y3 = lev;
                x3 = levx;
            }
        }
    }
}

function handleKeyDown(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        login();
    }
}

function login() {
    var messageElement = document.getElementById("message");
    messageElement.textContent = "";
    var userInput = document.getElementById('userInput').value;
    if(cityExists(userInput)){
        if(!alreadyLogged(userInput)){
            var coords = checkCityTicTacToe(userInput);
            loggedCities.push(userInput);
            logResult(coords);
        }
        else{
            messageElement = document.getElementById("message");
            messageElement.textContent = "This city is already used. Try something else";
        }
    }
    else{
        getClosest(userInput);
        if(y1 == 0){
            if(!alreadyLogged(x1)){
                loggedCities.push(x1);
                var coords = checkCityTicTacToe(x1);
                logResult(coords);
            }
            else{
                messageElement = document.getElementById("message");
                messageElement.textContent = "This city is already used. Try something else";
            }
        }
        else if(y1 <= 2){
            if(y1 < y2){
                messageElement = document.getElementById("message");
                messageElement.innerHTML = 'Did you mean: <a href="#" onclick="handleClick(event, \'' + x1 + '\')">' + x1 + '</a>?';
            }
            else{
                if(y2 < y3){
                    messageElement = document.getElementById("message");
                    messageElement.innerHTML = 'Did you mean: <a href="#" onclick="handleClick(event, \'' + x1 + '\')">' + x1 + '</a> or <a href="#" onclick="handleClick(event, \'' + x2 + '\')">' + x2 + '</a>?';
                }
                else {
                    messageElement = document.getElementById("message");
                    messageElement.innerHTML = 'Did you mean: <a href="#" onclick="handleClick(event, \'' + x1 + '\')">' + x1 + '</a>, <a href="#" onclick="handleClick(event, \'' + x2 + '\')">' + x2 + '</a> or <a href="#" onclick="handleClick(event, \'' + x3 + '\')">' + x3 + '</a>?';
                }
            }
        }
        else{
            messageElement = document.getElementById("message");
            messageElement.textContent = "No such city. Try something else";
        }
    }
    if(!gameOver){
        var userInput = document.getElementById("userInput");
        userInput.value = "";
        userInput.focus();
    }
}

function handleClick(event, suggestion) {
    event.preventDefault();
    var messageElement = document.getElementById("message");
    messageElement.textContent = "";
    var userInput = document.getElementById("userInput");
    userInput.value = "";
    userInput.focus();
    if(!alreadyLogged(suggestion)){
        var coords = checkCityTicTacToe(suggestion);
        loggedCities.push(suggestion);
        logResult(coords);
    }
    else{
        messageElement = document.getElementById("message");
        messageElement.textContent = "This city is already used";
    }
}

function cityExists(city){
    for(var i = 0; i < data.length; i++){
        if(city == data[i].name){
            return true;
        }
    }
    return false;
}

function alreadyLogged(city){
    if(loggedCities.length > 0){
        for(var i = 0; i < loggedCities.length; i++){
            if(loggedCities[i] == city){
                return true;
            }
        }
    }
    return false;
}

function threeInARow(c, i, j){
    if(c == player){
        return false;
    }
    else{
        var u;
        var ur;
        var r;
        var dr;
        var d;
        var dl;
        var l;
        var ul;
        var u2;
        var ur2;
        var r2;
        var dr2;
        var d2;
        var dl2;
        var l2;
        var ul2;

        if(i - 1 >= 0){
            u = grid[i-1][j];
            if(c == u){
                if(i - 2 >= 0){
                    u2 = grid[i-2][j];
                    if(c == u2){
                        return true;
                    }
                }
                if(i + 1 < latNum){
                    d = grid[i+1][j];
                    if(c == d){
                        return true;
                    }
                }
            }
        }
        if(i + 1 < latNum){
            d = grid[i+1][j];
            if(c == d){
                if(i + 2 < latNum){
                    d2 = grid[i+2][j];
                    if(c == d2){
                        return true;
                    }
                }
            }
        }

        if(j - 1 >= 0){
            l = grid[i][j-1];
            if(c == l){
                if(j - 2 >= 0){
                    l2 = grid[i][j-2];
                    if(c == l2){
                        return true;
                    }
                }
                if(j + 1 < lngNum){
                    r = grid[i][j+1];
                    if(c == r){
                        return true;
                    }
                }
            }
        }
        if(j + 1 < lngNum){
            r = grid[i][j+1];
            if(c == r){
                if(j + 2 < lngNum){
                    r2 = grid[i][j+2];
                    if(c == r2){
                        return true;
                    }
                }
            }
        }

        if(i - 1 >= 0 && j - 1 >= 0){
            ul = grid[i-1][j-1];
            if(c == ul){
                if(i - 2 >= 0 && j - 2 >= 0){
                    ul2 = grid[i-2][j-2];
                    if(c == ul2){
                        return true;
                    }
                }
                if(i + 1 < latNum && j + 1 < lngNum){
                    dr = grid[i+1][j+1];
                    if(c == dr){
                        return true;
                    }
                }
            }
        }
        if(i + 1 < latNum && j + 1 < lngNum){
            dr = grid[i+1][j+1];
            if(c == dr){
                if(i + 2 < latNum && j + 2 < lngNum){
                    dr2 = grid[i+2][j+2];
                    if(c == dr2){
                        return true;
                    }
                }
            }
        }

        if(i - 1 >= 0 && j + 1 < lngNum){
            ur = grid[i-1][j+1];
            if(c == ur){
                if(i - 2 >= 0 && j + 2 < lngNum){
                    ur2 = grid[i-2][j+2];
                    if(c == ur2){
                        return true;
                    }
                }
                if(i + 1 < latNum && j - 1 >= 0){
                    dl = grid[i+1][j-1];
                    if(c == dl){
                        return true;
                    }
                }
            }
        }
        if(i + 1 < latNum && j - 1 >= 0){
            dl = grid[i+1][j-1];
            if(c == dl){
                if(i + 2 < latNum && j - 2 >= 0){
                    dl2 = grid[i+2][j-2];
                    if(c == dl2){
                        return true;
                    }
                }
            }
        }
    }
    return false;
}


function won(c, i, j){
    var u;
    var ur;
    var r;
    var dr;
    var d;
    var dl;
    var l;
    var ul;
    var u2;
    var ur2;
    var r2;
    var dr2;
    var d2;
    var dl2;
    var l2;
    var ul2;
    var u3;
    var ur3;
    var r3;
    var dr3;
    var d3;
    var dl3;
    var l3;
    var ul3;

    if(i - 1 >= 0){
        u = grid[i-1][j];
        if(c == u){
            if(i - 2 >= 0){
                u2 = grid[i-2][j];
                if(c == u2){
                    if(i - 3 >= 0){
                        u3 = grid[i-3][j];
                        if(c == u3){
                            drawVictoryLine(i-3,j,i,j);
                            return true;
                        }
                    }
                    if(i + 1 < latNum){
                        d = grid[i+1][j];
                        if(c == d){
                            drawVictoryLine(i+1,j,i-2,j);
                            return true;
                        }
                    }
                }
            }
            if(i + 1 < latNum){
                d = grid[i+1][j];
                if(c == d){
                    if(i + 2 < latNum){
                        d2 = grid[i+2][j];
                        if(c == d2){
                            drawVictoryLine(i+2,j,i-1,j);
                            return true;
                        }
                    }
                }
            }
        }
    }
    if(i + 1 < latNum){
        d = grid[i+1][j];
        if(c == d){
            if(i + 2 < latNum){
                d2 = grid[i+2][j];
                if(c == d2){
                    if(i + 3 < latNum){
                        d3 = grid[i+3][j];
                        if(c == d3){
                            drawVictoryLine(i+3,j,i,j);
                            return true;
                        }
                    }
                }
            }
        }
    }

    if(j - 1 >= 0){
        l = grid[i][j-1];
        if(c == l){
            if(j - 2 >= 0){
                l2 = grid[i][j-2];
                if(c == l2){
                    if(j - 3 >= 0){
                        l3 = grid[i][j-3];
                        if(c == l3){
                            drawVictoryLine(i,j-3,i,j);
                            return true;
                        }
                    }
                    if(j + 1 < lngNum){
                        r = grid[i][j+1];
                        if(c == r){
                            drawVictoryLine(i,j+1,i,j-2);
                            return true;
                        }
                    }
                }
            }
            if(j + 1 < lngNum){
                r = grid[i][j+1];
                if(c == r){
                    if(j + 2 < lngNum){
                        r2 = grid[i][j+2];
                        if(c == r2){
                            drawVictoryLine(i,j+2,i,j-1);
                            return true;
                        }
                    }
                }
            }
        }
    }
    if(j + 1 < lngNum){
        r = grid[i][j+1];
        if(c == r){
            if(j + 2 < lngNum){
                r2 = grid[i][j+2];
                if(c == r2){
                    if(j + 3 < lngNum){
                        r3 = grid[i][j+3];
                        if(c == r3){
                            drawVictoryLine(i,j,i,j+3);
                            return true;
                        }
                    }
                }
            }
        }
    }

    if(i - 1 >= 0 && j - 1 >= 0){
        ul = grid[i-1][j-1];
        if(c == ul){
            if(i - 2 >= 0 && j - 2 >= 0){
                ul2 = grid[i-2][j-2];
                if(c == ul2){
                    if(i - 3 >= 0 && j - 3 >= 0){
                        ul3 = grid[i-3][j-3];
                        if(c == ul3){
                            drawVictoryLine(i-3,j-3,i,j);
                            return true;
                        }
                    }
                    if(i + 1 < latNum && j + 1 < lngNum){
                        dr = grid[i+1][j+1];
                        if(c == dr){
                            drawVictoryLine(i-2,j-2,i+1,j+1);
                            return true;
                        }
                    }
                }
            }
            if(i + 1 < latNum && j + 1 < lngNum){
                dr = grid[i+1][j+1];
                if(c == dr){
                    if(i + 2 < latNum && j + 2 < lngNum){
                        dr2 = grid[i+2][j+2];
                        if(c == dr2){
                            drawVictoryLine(i+2,j+2,i-1,j-1);
                            return true;
                        }
                    }
                }
            }
        }
    }
    if(i + 1 < latNum && j + 1 < lngNum){
        dr = grid[i+1][j+1];
        if(c == dr){
            if(i + 2 < latNum && j + 2 < lngNum){
                dr2 = grid[i+2][j+2];
                if(c == dr2){
                    if(i + 3 < latNum && j + 3 < lngNum){
                        dr3 = grid[i+3][j+3];
                        if(c == dr3){
                            drawVictoryLine(i+3,j+3,i,j);
                            return true;
                        }
                    }
                }
            }
        }
    }

    if(i - 1 >= 0 && j + 1 < lngNum){
        ur = grid[i-1][j+1];
        if(c == ur){
            if(i - 2 >= 0 && j + 2 < lngNum){
                ur2 = grid[i-2][j+2];
                if(c == ur2){
                    if(i - 3 >= 0 && j + 3 < lngNum){
                        ur3 = grid[i-3][j+3];
                        if(c == ur3){
                            drawVictoryLine(i,j,i-3,j+3);
                            return true;
                        }
                    }
                    if(i + 1 < latNum && j - 1 >= 0){
                        dl = grid[i+1][j-1];
                        if(c == dl){
                            drawVictoryLine(i+1,j-1,i-2,j+2);
                            return true;
                        }
                    }
                }
            }
            if(i + 1 < latNum && j - 1 >= 0){
                dl = grid[i+1][j-1];
                if(c == dl){
                    if(i + 2 < latNum && j - 2 >= 0){
                        dl2 = grid[i+2][j-2];
                        if(c == dl2){
                            drawVictoryLine(i+2,j-2,i-1,j+1);
                            return true;
                        }
                    }
                }
            }
        }
    }
    if(i + 1 < latNum && j - 1 >= 0){
        dl = grid[i+1][j-1];
        if(c == dl){
            if(i + 2 < latNum && j - 2 >= 0){
                dl2 = grid[i+2][j-2];
                if(c == dl2){
                    if(i + 3 < latNum && j - 3 >= 0){
                        dl3 = grid[i+3][j-3];
                        if(c == dl3){
                            drawVictoryLine(i,j,i+3,j-3);
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function undoMove(){
    loggedCities.pop();
    var lastAction = keepRecord[movesPlayed - 1];
    if(lastAction[0] == 1){
        map.removeLayer(gridCircle[lastAction[1]][lastAction[2]]);
        gridCircle[lastAction[1]][lastAction[2]] = null;
        grid[lastAction[1]][lastAction[2]] = 0;
    }
    else if(lastAction[0] == -1){
        map.removeLayer(gridCircle[lastAction[1]][lastAction[2]]);
        grid[lastAction[1]][lastAction[2]] = player;

        var fillColour = 'blue';
        var lineColour = 'blue';
        if(player > 0){
            fillColour = 'red';
            lineColour = 'red';
        }
        var radius = 0.8 * lastAction[3];
        var circle = L.circle(lastAction[4], {
            color: lineColour,
            fillColor: fillColour,
            fillOpacity: 0.3,
            radius: radius * 1000
        }).addTo(map);
        gridCircle[lastAction[1]][lastAction[2]] = circle;
    }
    movesPlayed--;
    keepRecord.pop();
    player = player * (-1);
    playerColor = 'Blue';
    if(player > 0){
        playerColor = 'Red';
    }
    var turnLabel = document.getElementById("turnLabel");
    turnLabel.textContent = "It is " + playerColor + "'s turn:";
    if (movesPlayed > 0) {
        var undoButton = document.getElementById("undoButton");
        undoButton.disabled = false;
    } else {
        var undoButton = document.getElementById("undoButton");
        undoButton.disabled = true;
    }
    var userInput = document.getElementById("userInput");
    userInput.focus();
}

function drawVictoryLine(i, j, k, l){
    var latInt = parseInt((latStart - latEnd) / latNum);
    var lngInt = parseInt((lngStart - lngEnd) / lngNum);
    var vicLatS = latStart - (0.5 * latInt + i * latInt);
    var vicLngS = lngEnd + (0.5 * lngInt + j * lngInt);
    var vicLatE = latStart - (0.5 * latInt + k * latInt);
    var vicLngE = lngEnd + (0.5 * lngInt + l * lngInt);
    var colour = 'red';
    if(player > 0){
        colour = 'blue';
    }
    var vic = L.polyline([[vicLatS, vicLngS], [vicLatE, vicLngE]], {color: colour, weight: 10});
    vic.addTo(map);
}

function nextGame() {
    var p1 = 60;
    var p2 = 35;
    var p3 = 35;
    var p4 = -10;
    var p5 = 5;
    var p6 = 5;
    var p7 = 4;
    var url = 'testGrid.html?param1=' + encodeURIComponent(p1) + '&param2=' + encodeURIComponent(p2) + '&param3=' + encodeURIComponent(p3) + '&param4=' + encodeURIComponent(p4) + '&param5=' + encodeURIComponent(p5) + '&param6=' + encodeURIComponent(p6) + '&param7=' + encodeURIComponent(p7);
    window.location.href = url;
}

function logPlayersMove(i, j){
    if(i+1 < latNum){
        dangerGen[i+1][j] += 1;
    }
    if(i+2 < latNum){
        dangerGen[i+2][j] += 1;
    }
    if(i+3 < latNum){
        dangerGen[i+3][j] += 1;
    }
    if(i-1 >= 0){
        dangerGen[i-1][j] += 1;
    }
    if(i-2 >= 0){
        dangerGen[i-2][j] += 1;
    }
    if(i-3 >= 0){
        dangerGen[i-3][j] += 1;
    }

    if(j+1 < lngNum){
        dangerGen[i][j+1] += 1;
    }
    if(j+2 < lngNum){
        dangerGen[i][j+2] += 1;
    }
    if(j+3 < lngNum){
        dangerGen[i][j+3] += 1;
    }
    if(j-1 >= 0){
        dangerGen[i][j-1] += 1;
    }
    if(j-2 >= 0){
        dangerGen[i][j-2] += 1;
    }
    if(j-3 >= 0){
        dangerGen[i][j-3] += 1;
    }

    if(i-1 >= 0 && j-1 >= 0){
        dangerGen[i-1][j-1] += 1;
    }
    if(i-2 >= 0 && j-2 >= 0){
        dangerGen[i-2][j-2] += 1;
    }
    if(i-3 >= 0 && j-3 >= 0){
        dangerGen[i-3][j-3] += 1;
    }
    if(i+1 < latNum && j+1 < lngNum){
        dangerGen[i+1][j+1] += 1;
    }
    if(i+2 < latNum && j+2 < lngNum){
        dangerGen[i+2][j+2] += 1;
    }
    if(i+3 < latNum && j+3 < lngNum){
        dangerGen[i+3][j+3] += 1;
    }

    if(i+1 < latNum && j-1 >= 0){
        dangerGen[i+1][j-1] += 1;
    }
    if(i+2 < latNum && j-2 >= 0){
        dangerGen[i+2][j-2] += 1;
    }
    if(i+3 < latNum && j-3 >= 0){
        dangerGen[i+3][j-3] += 1;
    }
    if(i-1 >= 0 && j+1 < lngNum){
        dangerGen[i-1][j+1] += 1;
    }
    if(i-2 >= 0 && j+2 < lngNum){
        dangerGen[i-2][j+2] += 1;
    }
    if(i-3 >= 0 && j+3 < lngNum){
        dangerGen[i-3][j+3] += 1;
    }

    if(keepRecord[movesPlayed - 1][0] == -1){
        if(i+1 < latNum){
            if(potentialGen[i+1][j] > 0){
                potentialGen[i+1][j] -= 1;
            }
        }
        if(i+2 < latNum){
            if(potentialGen[i+2][j] > 0){
                potentialGen[i+2][j] -= 1;
            }
        }
        if(i+3 < latNum){
            if(potentialGen[i+3][j] > 0){
                potentialGen[i+3][j] -= 1;
            }
        }
        if(i-1 >= 0){
            if(potentialGen[i-1][j] > 0){
                potentialGen[i-1][j] -= 1;
            }
        }
        if(i-2 >= 0){
            if(potentialGen[i-2][j] > 0){
                potentialGen[i-2][j] -= 1;
            }
        }
        if(i-3 >= 0){
            if(potentialGen[i-3][j] > 0){
                potentialGen[i-3][j] -= 1;
            }
        }

        if(j-1 >= 0){
            if(potentialGen[i][j-1] > 0){
                potentialGen[i][j-1] -= 1;
            }
        }
        if(j-2 >= 0){
            if(potentialGen[i][j-2] > 0){
                potentialGen[i][j-2] -= 1;
            }
        }
        if(j-3 >= 0){
            if(potentialGen[i][j-3] > 0){
                potentialGen[i][j-3] -= 1;
            }
        }
        if(j+1 < lngNum){
            if(potentialGen[i][j+1] > 0){
                potentialGen[i][j+1] -= 1;
            }
        }
        if(j+2 < lngNum){
            if(potentialGen[i][j+2] > 0){
                potentialGen[i][j+2] -= 1;
            }
        }
        if(j+3 < lngNum){
            if(potentialGen[i][j+3] > 0){
                potentialGen[i][j+3] -= 1;
            }
        }

        if(i+1 < latNum && j+1 < lngNum){
            if(potentialGen[i+1][j+1] > 0){
                potentialGen[i+1][j+1] -= 1;
            }
        }
        if(i+2 < latNum && j+2 < lngNum){
            if(potentialGen[i+2][j+2] > 0){
                potentialGen[i+2][j+2] -= 1;
            }
        }
        if(i+3 < latNum && j+3 < lngNum){
            if(potentialGen[i+3][j+3] > 0){
                potentialGen[i+3][j+3] -= 1;
            }
        }
        if(i-1 >= 0 && j-1 >= 0){
            if(potentialGen[i-1][j-1] > 0){
                potentialGen[i-1][j-1] -= 1;
            }
        }
        if(i-2 >= 0 && j-2 >= 0){
            if(potentialGen[i-2][j-2] > 0){
                potentialGen[i-2][j-2] -= 1;
            }
        }
        if(i-3 >= 0 && j-3 >= 0){
            if(potentialGen[i-3][j-3] > 0){
                potentialGen[i-3][j-3] -= 1;
            }
        }

        if(i+1 < latNum && j-1 >= 0){
            if(potentialGen[i+1][j-1] > 0){
                potentialGen[i+1][j-1] -= 1;
            }
        }
        if(i+2 < latNum && j-2 >= 0){
            if(potentialGen[i+2][j-2] > 0){
                potentialGen[i+2][j-2] -= 1;
            }
        }
        if(i+3 < latNum && j-3 >= 0){
            if(potentialGen[i+3][j-3] > 0){
                potentialGen[i+3][j-3] -= 1;
            }
        }
        if(i-1 >= 0 && j+1 < lngNum){
            if(potentialGen[i-1][j+1] > 0){
                potentialGen[i-1][j+1] -= 1;
            }
        }
        if(i-2 >= 0 && j+2 < lngNum){
            if(potentialGen[i-2][j+2] > 0){
                potentialGen[i-2][j+2] -= 1;
            }
        }
        if(i-3 >= 0 && j+3 < lngNum){
            if(potentialGen[i-3][j+3] > 0){
                potentialGen[i-3][j+3] -= 1;
            }
        }
    }
}

function logAiMove(i, j){
    if(i+1 < latNum){
        potentialGen[i+1][j] += 1;
    }
    if(i+2 < latNum){
        potentialGen[i+2][j] += 1;
    }
    if(i+3 < latNum){
        potentialGen[i+3][j] += 1;
    }
    if(i-1 >= 0){
        potentialGen[i-1][j] += 1;
    }
    if(i-2 >= 0){
        potentialGen[i-2][j] += 1;
    }
    if(i-3 >= 0){
        potentialGen[i-3][j] += 1;
    }

    if(j+1 < lngNum){
        potentialGen[i][j+1] += 1;
    }
    if(j+2 < lngNum){
        potentialGen[i][j+2] += 1;
    }
    if(j+3 < lngNum){
        potentialGen[i][j+3] += 1;
    }
    if(j-1 >= 0){
        potentialGen[i][j-1] += 1;
    }
    if(j-2 >= 0){
        potentialGen[i][j-3] += 1;
    }
    if(j-3 >= 0){
        potentialGen[i][j-3] += 1;
    }

    if(i-1 >= 0 && j-1 >= 0){
        potentialGen[i-1][j-1] += 1;
    }
    if(i-2 >= 0 && j-2 >= 0){
        potentialGen[i-2][j-2] += 1;
    }
    if(i-3 >= 0 && j-3 >= 0){
        potentialGen[i-3][j-3] += 1;
    }
    if(i+1 < latNum && j+1 < lngNum){
        potentialGen[i+1][j+1] += 1;
    }
    if(i+2 < latNum && j+2 < lngNum){
        potentialGen[i+2][j+2] += 1;
    }
    if(i+3 < latNum && j+3 < lngNum){
        potentialGen[i+3][j+3] += 1;
    }

    if(i+1 < latNum && j-1 >= 0){
        potentialGen[i+1][j-1] += 1;
    }
    if(i+2 < latNum && j-2 >= 0){
        potentialGen[i+2][j-2] += 1;
    }
    if(i+3 < latNum && j-3 >= 0){
        potentialGen[i+3][j-3] += 1;
    }
    if(i-1 >= 0 && j+1 < lngNum){
        potentialGen[i-1][j+1] += 1;
    }
    if(i-2 >= 0 && j+2 < lngNum){
        potentialGen[i-2][j+2] += 1;
    }
    if(i-3 >= 0 && j+3 < lngNum){
        potentialGen[i-3][j+3] += 1;
    }

    if(keepRecord[movesPlayed - 1][0] == -1){
        if(i+1 < latNum){
            if(dangerGen[i+1][j] > 0){
                dangerGen[i+1][j] -= 1;
            }
        }
        if(i+2 < latNum){
            if(dangerGen[i+2][j] > 0){
                dangerGen[i+2][j] -= 1;
            }
        }
        if(i+3 < latNum){
            if(dangerGen[i+3][j] > 0){
                dangerGen[i+3][j] -= 1;
            }
        }
        if(i-1 >= 0){
            if(dangerGen[i-1][j] > 0){
                dangerGen[i-1][j] -= 1;
            }
        }
        if(i-2 >= 0){
            if(dangerGen[i-2][j] > 0){
                dangerGen[i-2][j] -= 1;
            }
        }
        if(i-3 >= 0){
            if(dangerGen[i-3][j] > 0){
                dangerGen[i-3][j] -= 1;
            }
        }

        if(j-1 >= 0){
            if(dangerGen[i][j-1] > 0){
                dangerGen[i][j-1] -= 1;
            }
        }
        if(j-2 >= 0){
            if(dangerGen[i][j-2] > 0){
                dangerGen[i][j-2] -= 1;
            }
        }
        if(j-3 >= 0){
            if(dangerGen[i][j-3] > 0){
                dangerGen[i][j-3] -= 1;
            }
        }
        if(j+1 < lngNum){
            if(dangerGen[i][j+1] > 0){
                dangerGen[i][j+1] -= 1;
            }
        }
        if(j+2 < lngNum){
            if(dangerGen[i][j+2] > 0){
                dangerGen[i][j+2] -= 1;
            }
        }
        if(j+3 < lngNum){
            if(dangerGen[i][j+3] > 0){
                dangerGen[i][j+3] -= 1;
            }
        }

        if(i+1 < latNum && j+1 < lngNum){
            if(dangerGen[i+1][j+1] > 0){
                dangerGen[i+1][j+1] -= 1;
            }
        }
        if(i+2 < latNum && j+2 < lngNum){
            if(dangerGen[i+2][j+2] > 0){
                dangerGen[i+2][j+2] -= 1;
            }
        }
        if(i+3 < latNum && j+3 < lngNum){
            if(dangerGen[i+3][j+3] > 0){
                dangerGen[i+3][j+3] -= 1;
            }
        }
        if(i-1 >= 0 && j-1 >= 0){
            if(dangerGen[i-1][j-1] > 0){
                dangerGen[i-1][j-1] -= 1;
            }
        }
        if(i-2 >= 0 && j-2 >= 0){
            if(dangerGen[i-2][j-2] > 0){
                dangerGen[i-2][j-2] -= 1;
            }
        }
        if(i-3 >= 0 && j-3 >= 0){
            if(dangerGen[i-3][j-3] > 0){
                dangerGen[i-3][j-3] -= 1;
            }
        }

        if(i+1 < latNum && j-1 >= 0){
            if(dangerGen[i+1][j-1] > 0){
                dangerGen[i+1][j-1] -= 1;
            }
        }
        if(i+2 < latNum && j-2 >= 0){
            if(dangerGen[i+2][j-2] > 0){
                dangerGen[i+2][j-2] -= 1;
            }
        }
        if(i+3 < latNum && j-3 >= 0){
            if(dangerGen[i+3][j-3] > 0){
                dangerGen[i+3][j-3] -= 1;
            }
        }
        if(i-1 >= 0 && j+1 < lngNum){
            if(dangerGen[i-1][j+1] > 0){
                dangerGen[i-1][j+1] -= 1;
            }
        }
        if(i-2 >= 0 && j+2 < lngNum){
            if(dangerGen[i-2][j+2] > 0){
                dangerGen[i-2][j+2] -= 1;
            }
        }
        if(i-3 >= 0 && j+3 < lngNum){
            if(dangerGen[i-3][j+3] > 0){
                dangerGen[i-3][j+3] -= 1;
            }
        }
    }
}

function distanceToMiddle(row, col){
    var distLat = parseInt(latNum/2) - row;
    if(distLat < 0){
        distLat = distLat * (-1);
    }
    var distLng = parseInt(lngNum/2) - col;
    if(distLng < 0){
        distLng = distLng * (-1);
    }
    var dist = distLat + distLng;
    return dist;
}

function getMaxDetMat(){
    var maxI = 0;
    var maxJ = 0;
    var maxV = -1;
    for(var i = 0; i < detMat.length; i++){
        for(var j = 0; j < detMat[i].length; j++){
            var comp = detMat[i][j];
            if(comp > maxV){
                if(availabilityCheck(i, j)){
                    maxI = i;
                    maxJ = j;
                    maxV = comp;
                }
            }
            else if(comp == maxV){
                if(distanceToMiddle(i, j) < distanceToMiddle(maxI, maxJ)){
                    if(availabilityCheck(i, j)){
                        maxI = i;
                        maxJ = j;
                        maxV = comp;
                    }
                }
            }
        }
    }
    return [maxI, maxJ];
}

function availabilityCheck(row, col){
    if(row == blockedRow && col == blockedCol){
        return false;
    }
    if(grid[row][col] == 0){
        return true;
    }
    if(grid[row][col] == 1){
        return false;
    }
    if(grid[row][col] == -1){
        if(threeInARow(-1, row, col)){
            return true;
        }
    }
    return false;
}

function aiMove(){
    var row = getMaxDetMat()[0];
    var col = getMaxDetMat()[1];
    var latInt = parseInt((latStart - latEnd)/latNum);
    var lngInt = parseInt((lngStart - lngEnd)/lngNum);
    var latMin = latStart - latInt*(row+1);
    var latMax = latStart - latInt*row;
    var lngMin = lngEnd + lngInt*col;
    var lngMax = lngEnd + lngInt*(col+1);
    var aiChoice = getRandomAvailableCity();
    var pop = 0;
    for(var i = 0; i < data.length; i++){
        if(data[i].lat < latMax && data[i].lat > latMin){
            if(data[i].lng < lngMax && data[i].lng > lngMin){
                if(data[i].pop > pop){
                    pop = data[i].pop;
                    aiChoice = data[i].name;
                }
            }
        }
    }
    console.log('aiChoice: ' + aiChoice)
    var coords = checkCityTicTacToe(aiChoice);
    logResult(coords);
    return [row, col];
}

function getRandomAvailableCity(){
    var rand = data[0].name;
    for(var i = 1; i < data.length; i++){
        if(!alreadyLogged(data[i].name)){
            return data[i].name;
        }
    }
    return rand;
}

function automaticResponse(i, j){
    updateConcreteMatrix();
    var x = aiMove();
    var row = x[0];
    var col = x[1];
    logAiMove(row, col);
    updateDetMat();
}

function updateDetMat(){
    for(var i = 0; i < grid.length; i++){
        for(var j = 0; j < grid[i].length; j++){
            detMat[i][j] = dangerGen[i][j] + potentialGen[i][j] + concreteDanPot[i][j];
        }
    }
}








function updateConcreteMatrix(){
    for(var i = 0; i < grid.length; i++){
        for(var j = 0; j < grid[i].length; j++){
            concreteDanPot[i][j] = retrieveValueForAllDirections(i, j);
        }
    }
}

function getValueConcreteDanger(x, o){
    if(x == 3){
        // ausnahme!!!!!!!!!
        //
        return 100;
    }
    if(x == 2){
        if(o == 0){
            return 10;
        }
    }
    if(x == 1){
        if(o == 0){
            return 1;
        }
    }
    return 0;
}

function getValueConcretePotential(x, o){
    if(x == 3){
        return 1000;
    }
    if(x == 2){
        if(o == 0){
            return 10;
        }
        else if(o == 1){
            return 0.2;
        }
    }
    if(x == 1){
        if(o == 0){
            return 1;
        }

        else if(o == 1){
            return 0.1
        }
    }
    return 0;
}

function retrieveValueForAllDirections(i, j){
    var total = 0
    if(i+3 < latNum){
        var counts = countXandO(grid[i][j], grid[i+1][j], grid[i+2][j], grid[i+3][j]);
        var p = getValueConcretePotential(counts[0], counts[1]);
        var  d = getValueConcreteDanger(counts[1], counts[0]);
        total = total + d + p;
    }
    if(i+2 < latNum){
        if(i-1 >= 0){
            var counts = countXandO(grid[i][j], grid[i+1][j], grid[i+2][j], grid[i-1][j]);
            var p = getValueConcretePotential(counts[0], counts[1]);
            var  d = getValueConcreteDanger(counts[1], counts[0]);
            total = total + d + p;
        }
    }
    if(i+1 < latNum){
        if(i-2 >= 0){
            var counts = countXandO(grid[i][j], grid[i+1][j], grid[i-2][j], grid[i-1][j]);
            var p = getValueConcretePotential(counts[0], counts[1]);
            var  d = getValueConcreteDanger(counts[1], counts[0]);
            total = total + d + p;
        }
    }
    if(i-3 >= 0){
        var counts = countXandO(grid[i][j], grid[i-1][j], grid[i-2][j], grid[i-3][j]);
        var p = getValueConcretePotential(counts[0], counts[1]);
        var  d = getValueConcreteDanger(counts[1], counts[0]);
        total = total + d + p;
    }

    if(j+3 < lngNum){
        var counts = countXandO(grid[i][j], grid[i][j+1], grid[i][j+2], grid[i][j+3]);
        var p = getValueConcretePotential(counts[0], counts[1]);
        var  d = getValueConcreteDanger(counts[1], counts[0]);
        total = total + d + p;
    }
    if(j+2 < lngNum){
        if(j-1 >= 0){
            var counts = countXandO(grid[i][j], grid[i][j+1], grid[i][j+2], grid[i][j-1]);
            var p = getValueConcretePotential(counts[0], counts[1]);
            var  d = getValueConcreteDanger(counts[1], counts[0]);
            total = total + d + p;
        }
    }
    if(j+1 < lngNum){
        if(j-2 >= 0){
            var counts = countXandO(grid[i][j], grid[i][j+1], grid[i][j-2], grid[i][j]-1);
            var p = getValueConcretePotential(counts[0], counts[1]);
            var  d = getValueConcreteDanger(counts[1], counts[0]);
            total = total + d + p;
        }
    }
    if(j-3 >= 0){
        var counts = countXandO(grid[i][j], grid[i][j-1], grid[i][j-2], grid[i][j-3]);
        var p = getValueConcretePotential(counts[0], counts[1]);
        var  d = getValueConcreteDanger(counts[1], counts[0]);
        total = total + d + p;
    }

    if(i+3 < latNum && j+3 < lngNum){
        var counts = countXandO(grid[i][j], grid[i+1][j+1], grid[i+2][j+2], grid[i+3][j+3]);
        var p = getValueConcretePotential(counts[0], counts[1]);
        var  d = getValueConcreteDanger(counts[1], counts[0]);
        total = total + d + p;
    }
    if(i+2 < latNum && j+2 < lngNum){
        if(i-1 >= 0 && j-1 >= 0){
            var counts = countXandO(grid[i][j], grid[i+1][j+1], grid[i+2][j+2], grid[i-1][j-1]);
            var p = getValueConcretePotential(counts[0], counts[1]);
            var  d = getValueConcreteDanger(counts[1], counts[0]);
            total = total + d + p;
        }
    }
    if(i+1 < latNum && j+1 < lngNum){
        if(i-2 >= 0 && j-2 >= 0){
            var counts = countXandO(grid[i][j], grid[i+1][j+1], grid[i-2][j-2], grid[i-1][j]-1);
            var p = getValueConcretePotential(counts[0], counts[1]);
            var  d = getValueConcreteDanger(counts[1], counts[0]);
            total = total + d + p;
        }
    }
    if(i-3 >= 0 && j-3 >= 0){
        var counts = countXandO(grid[i][j], grid[i-1][j-1], grid[i-2][j-2], grid[i-3][j-3]);
        var p = getValueConcretePotential(counts[0], counts[1]);
        var  d = getValueConcreteDanger(counts[1], counts[0]);
        total = total + d + p;
    }

    if(i+3 < latNum && j-3 >= 0){
        var counts = countXandO(grid[i][j], grid[i+1][j-1], grid[i+2][j-2], grid[i+3][j-3]);
        var p = getValueConcretePotential(counts[0], counts[1]);
        var  d = getValueConcreteDanger(counts[1], counts[0]);
        total = total + d + p;
    }
    if(i+2 < latNum && j-2 >= 0){
        if(i-1 >= 0 && j+1 < lngNum){
            var counts = countXandO(grid[i][j], grid[i+1][j-1], grid[i+2][j-2], grid[i-1][j+1]);
            var p = getValueConcretePotential(counts[0], counts[1]);
            var  d = getValueConcreteDanger(counts[1], counts[0]);
            total = total + d + p;
        }
    }
    if(i+1 < latNum && j-1 >= 0){
        if(i-2 >= 0 && j+2 < lngNum){
            var counts = countXandO(grid[i][j], grid[i+1][j-1], grid[i-2][j+2], grid[i-1][j]+1);
            var p = getValueConcretePotential(counts[0], counts[1]);
            var  d = getValueConcreteDanger(counts[1], counts[0]);
            total = total + d + p;
        }
    }
    if(i-3 >= 0 && j+3 < lngNum){
        var counts = countXandO(grid[i][j], grid[i-1][j+1], grid[i-2][j+2], grid[i-3][j+3]);
        var p = getValueConcretePotential(counts[0], counts[1]);
        var  d = getValueConcreteDanger(counts[1], counts[0]);
        total = total + d + p;
    }

    return total;
}

function countXandO(a,b,c,d){
    var x = 0;
    var o = 0;
    if(a == 1){
        x++;
    }
    if(a == -1){
        o++;
    }
    if(b == 1){
        x++;
    }
    if(b == -1){
        o++;
    }
    if(c == 1){
        x++;
    }
    if(c == -1){
        o++;
    }
    if(d == 1){
        x++;
    }
    if(d == -1){
        o++;
    }
    return [x, o];
}