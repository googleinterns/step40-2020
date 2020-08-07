// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var ATTRIBUTES_BY_LANGUAGE = {
    'en': ['TOXICITY', 'SEVERE_TOXICITY', 'TOXICITY_FAST', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT', 'SEXUALLY_EXPLICIT', 'FLIRTATION'],
    'es': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
    'fr': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
    'de': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
    'it': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
    'pt': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT']
};
/** Category names are correlated to youtube category numbers */
var YOUTUBE_CATEGORIES = {
    'Autos&Vehicles': 2,
    'Comedy': 23,
    'Entertainment': 24,
    'Film&Animation': 1,
    'Gaming': 20,
    'Music': 10,
    'Pets&Animals': 15,
    'Science&Technology': 28,
    'Sports': 17
};
/** Calls youtube servlet and passes output to perspctive */
function callYoutube() {
    return __awaiter(this, void 0, void 0, function () {
        var channelId, response, responseJson, usernameConverterResponseJson, convertedUserName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resetChart();
                    showLoadingWheel();
                    getInputElement('download').disabled = false;
                    document.getElementById('search-type').innerHTML = "";
                    channelId = getInputElement('channelIdForAnalysis').value.replace(/ /g, '');
                    if (!channelId) {
                        hideLoadingWheel();
                        return [2 /*return*/];
                    }
                    // Checks if input is a category, if so directs input to be handled by get trending
                    if (YOUTUBE_CATEGORIES[channelId] != undefined) {
                        document.getElementById('search-type').innerHTML = "Category Search";
                        getTrending(YOUTUBE_CATEGORIES[channelId]);
                        return [2 /*return*/];
                    }
                    if (!(channelId[0] == "U" && channelId[1] == "C" && channelId.length == 24 && isLetter(channelId[channelId.length - 1]))) return [3 /*break*/, 2];
                    return [4 /*yield*/, callYoutubeServlet("channelId", channelId)];
                case 1:
                    responseJson = _a.sent();
                    if (responseJson.hasOwnProperty('error')) {
                        hideLoadingWheel();
                        alert("Invalid Channel ID");
                        return [2 /*return*/];
                    }
                    document.getElementById('search-type').innerHTML = "Channel ID Search";
                    return [3 /*break*/, 5];
                case 2: return [4 /*yield*/, callYoutubeUsernameServlet(channelId)];
                case 3:
                    usernameConverterResponseJson = _a.sent();
                    if (usernameConverterResponseJson.pageInfo.totalResults == 0) {
                        hideLoadingWheel();
                        alert("Username Not found, Please Input Channel ID");
                        return [2 /*return*/];
                    }
                    document.getElementById('search-type').innerHTML = "Username Search";
                    convertedUserName = usernameConverterResponseJson.items[0].id;
                    return [4 /*yield*/, callYoutubeServlet("channelId", convertedUserName)];
                case 4:
                    responseJson = _a.sent();
                    _a.label = 5;
                case 5:
                    inputCommentsToPerspective([responseJson]);
                    return [2 /*return*/];
            }
        });
    });
}
/** Calls perspective to analyze an array of comment JSON's */
function inputCommentsToPerspective(commentsList) {
    return __awaiter(this, void 0, void 0, function () {
        var langElement, commentListElement, requestedAttributes, attributeScoresPromises, analyzedComments, _a, _b, _i, comments, _c, _d, _e, item, commentText, perspectiveScore, totalNumberOfComments;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    langElement = getInputElement('languageForAnalysis');
                    if (!langElement) {
                        return [2 /*return*/];
                    }
                    commentListElement = document.getElementById('comment-list');
                    commentListElement.innerHTML = '';
                    requestedAttributes = getRequestedAttributes();
                    if (!requestedAttributes) {
                        return [2 /*return*/];
                    }
                    attributeScoresPromises = [];
                    analyzedComments = [];
                    _a = [];
                    for (_b in commentsList)
                        _a.push(_b);
                    _i = 0;
                    _f.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    comments = _a[_i];
                    _c = [];
                    for (_d in commentsList[comments].items)
                        _c.push(_d);
                    _e = 0;
                    _f.label = 2;
                case 2:
                    if (!(_e < _c.length)) return [3 /*break*/, 5];
                    item = _c[_e];
                    commentText = commentsList[comments].items[item].snippet.topLevelComment.snippet.textOriginal;
                    analyzedComments.push(commentText);
                    return [4 /*yield*/, callPerspective(commentText, langElement.value, requestedAttributes)];
                case 3:
                    perspectiveScore = _f.sent();
                    attributeScoresPromises.push(perspectiveScore);
                    _f.label = 4;
                case 4:
                    _e++;
                    return [3 /*break*/, 2];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    totalNumberOfComments = commentsList[0].items.length * commentsList.length;
                    return [4 /*yield*/, Promise.all(attributeScoresPromises).then(function (resolvedAttributeScores) {
                            var attributeData = getAttributeData(resolvedAttributeScores);
                            var attributeDataForChart = getAttributeData(resolvedAttributeScores);
                            var attributeTotals = getAttributeTotals(resolvedAttributeScores);
                            var attributeAverages = getAttributeAverages(attributeTotals, totalNumberOfComments);
                            hideLoadingWheel();
                            loadChartsApi(attributeAverages, analyzedComments, attributeData);
                            perspectiveToxicityScale(attributeAverages);
                            beginDownload(analyzedComments, attributeDataForChart);
                        })];
                case 7:
                    _f.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** Returns a map of attribute score sums from an array of JSON's */
function getAttributeTotals(attributeScores) {
    var requestedAttributes = getRequestedAttributes();
    var attributeTotals = new Map();
    for (var i = 0; i < requestedAttributes.length; i++) {
        for (var j = 0; j < attributeScores.length; j++) {
            // populates attributeData to support CSV output and attributeTotals to support averaging
            var attributeScoreValue = attributeScores[j].attributeScores[requestedAttributes[i]].summaryScore.value;
            if (attributeTotals.has(requestedAttributes[i])) {
                attributeTotals.set(requestedAttributes[i], attributeTotals.get(requestedAttributes[i]) + attributeScoreValue);
            }
            else {
                attributeTotals.set(requestedAttributes[i], attributeScoreValue);
            }
        }
    }
    return attributeTotals;
}
/** Returns a map of attribute score averages from a map and an array */
function getAttributeAverages(attributeTotals, totalNumberOfComments) {
    var attributeAverages = new Map();
    // forEach(value,key)
    attributeTotals.forEach(function (attributeScoresTotal, attribute) {
        attributeAverages.set(attribute, attributeScoresTotal / totalNumberOfComments);
    });
    return attributeAverages;
}
/** Returns the user's input */
function getRequestedAttributes() {
    var attributes = Array.from(document.getElementById("available-attributes").getElementsByTagName('input'));
    var requestedAttributes = [];
    for (var _i = 0, attributes_1 = attributes; _i < attributes_1.length; _i++) {
        var attribute = attributes_1[_i];
        if (attribute.checked == true) {
            requestedAttributes.push(attribute.value);
        }
    }
    return requestedAttributes;
}
/** Calls the perspective API */
function callPerspective(text, lang, requestedAttributes) {
    return __awaiter(this, void 0, void 0, function () {
        var response, toxicityData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/call_perspective', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: text, lang: lang, requestedAttributes: requestedAttributes })
                    })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    toxicityData = _a.sent();
                    return [2 /*return*/, toxicityData];
            }
        });
    });
}
/** Loads the Google Charts API */
function loadChartsApi(toxicityData, analyzedComments, attributeData) {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.load('current', { 'packages': ['table'] });
    google.charts.setOnLoadCallback(function () { drawBarChart(toxicityData); });
    google.charts.setOnLoadCallback(function () { drawTableChart(analyzedComments, attributeData); });
}
/** Draws a Google BarChart from a map. */
function drawBarChart(toxicityData) {
    document.getElementById('chart-container').innerHTML = '';
    var data = google.visualization.arrayToDataTable([[{ label: 'Attribute' }, { label: 'Score', type: 'number' }, { role: "style" }]]);
    // forEach(value,key)
    toxicityData.forEach(function (attributeScoresAvg, attribute) {
        var score = attributeScoresAvg;
        var style = getStyle(attributeScoresAvg);
        data.addRow([attribute, score, style]);
    });
    data.sort({ column: 1, desc: false });
    var options = {
        title: 'Perspective Feedback',
        bars: 'horizontal',
        height: 700,
        legend: { position: "none" },
        theme: 'material',
        hAxis: { viewWindow: { min: 0, max: 1 } }
    };
    var chart = new google.visualization.BarChart(document.getElementById('chart-container'));
    chart.draw(data, options);
}
/** Shows the avaiable attributes given a language selected on text analyzer page */
function showAvailableAttributes() {
    var langElement = getInputElement('languageForAnalysis');
    if (!langElement) {
        return;
    }
    var lang = langElement.value;
    var availableAttributesElement = document.getElementById('available-attributes');
    availableAttributesElement.innerHTML = '';
    var attributes = ATTRIBUTES_BY_LANGUAGE[lang];
    attributes.forEach(function (attribute) {
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.value = attribute;
        checkbox.id = attribute + '-checkbox';
        checkbox.checked = true;
        var label = document.createElement('label');
        label.htmlFor = attribute + '-checkbox';
        label.appendChild(document.createTextNode(attribute));
        availableAttributesElement.appendChild(checkbox);
        availableAttributesElement.appendChild(label);
        availableAttributesElement.appendChild(document.createTextNode(" "));
    });
}
/** Checks if a character is a letter */
function isLetter(character) {
    return (character.charCodeAt() >= 65 && character.charCodeAt() <= 90) || (character.charCodeAt() >= 97 && character.charCodeAt() <= 122);
}
/** Category names are mapped to youtube category numbers */
function getTrending(categoryId) {
    return __awaiter(this, void 0, void 0, function () {
        var trendingResponseJson, trendingVideoIds, item, videoId, commentsListPromises, _a, _b, _i, id, videoCommentListJson;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, callYoutubeTrendingServlet(categoryId)];
                case 1:
                    trendingResponseJson = _c.sent();
                    trendingVideoIds = [];
                    for (item in trendingResponseJson.items) {
                        videoId = trendingResponseJson.items[item].id;
                        trendingVideoIds.push(videoId);
                    }
                    commentsListPromises = [];
                    _a = [];
                    for (_b in trendingVideoIds)
                        _a.push(_b);
                    _i = 0;
                    _c.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    id = _a[_i];
                    return [4 /*yield*/, callYoutubeServlet("videoId", trendingVideoIds[id])];
                case 3:
                    videoCommentListJson = _c.sent();
                    commentsListPromises.push(videoCommentListJson);
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, Promise.all(commentsListPromises).then(function (resolvedCommentsList) {
                        inputCommentsToPerspective(resolvedCommentsList);
                    })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** Enables and disables manual input into the text field */
function textInputToggle(button, toEnable) {
    var channelIdEl = getInputElement('channelIdForAnalysis');
    var keywordSearchdEl = getInputElement('channelIdForAnalysis');
    if (button.checked) {
        if (toEnable) {
            channelIdEl.value = button.id;
            channelIdEl.disabled = true;
            keywordSearchdEl.disabled = true;
        }
        else {
            channelIdEl.value = "";
            channelIdEl.disabled = false;
            keywordSearchdEl.disabled = false;
        }
    }
}
/** Creates radio buttons to allow the user to select between various categories*/
function showCategories() {
    // Creates button to enable manual text input
    var radiobox = document.createElement('input');
    radiobox.type = 'radio';
    radiobox.id = 'manualInput';
    radiobox.value = 'manualInput';
    radiobox.name = 'same';
    radiobox.checked = true;
    var label = document.createElement('label');
    label.htmlFor = 'manualInput';
    var description = document.createTextNode('ID/Username');
    label.appendChild(description);
    radiobox.onclick = function () {
        textInputToggle(this, false);
    };
    var categoryContainer = document.getElementById('category-container');
    categoryContainer.appendChild(radiobox);
    categoryContainer.appendChild(label);
    categoryContainer.appendChild(document.createTextNode(" "));
    categoryContainer.appendChild(document.createElement("br"));
    // Creates buttons for all youtube categories
    for (var category in YOUTUBE_CATEGORIES) {
        var radiobox_1 = document.createElement('input');
        radiobox_1.type = 'radio';
        radiobox_1.id = category;
        radiobox_1.value = category;
        radiobox_1.name = 'same';
        var label_1 = document.createElement('label');
        label_1.htmlFor = category;
        var description_1 = document.createTextNode(category);
        label_1.appendChild(description_1);
        radiobox_1.onclick = function () {
            textInputToggle(this, true);
        };
        var categoryContainer_1 = document.getElementById('category-container');
        categoryContainer_1.appendChild(radiobox_1);
        categoryContainer_1.appendChild(label_1);
        categoryContainer_1.appendChild(document.createTextNode(" "));
    }
}
/** Converts perspective results to knoop scale then to mohs*/
function perspectiveToxicityScale(attributeAverages) {
    var knoopScale = [1, 32, 135, 163, 430, 560, 820, 1340, 1800, 7000];
    var totalToxicityScore = 0;
    // forEach(value,key)
    attributeAverages.forEach(function (attributeAverage, attribute) {
        totalToxicityScore += attributeAverage;
    });
    var inputLength = attributeAverages.size;
    var averageToxicityScore = totalToxicityScore / inputLength;
    var knoopScore = averageToxicityScore * 7000;
    var knoopLow = 0;
    var knoopHigh = 0;
    var mohsScore = 0;
    for (var i = 0; i < knoopScale.length; i++) {
        if (knoopScore < knoopScale[i]) {
            if (knoopScore < 1) {
                knoopLow = 0;
            }
            else {
                knoopLow = knoopScale[i - 1];
            }
            knoopHigh = knoopScale[i];
            mohsScore = i;
            break;
        }
    }
    var knoopRange = knoopHigh - knoopLow;
    var amountMoreThanKnoop = knoopScore - knoopLow;
    var mohsDecimal = amountMoreThanKnoop / knoopRange;
    var perspectiveToxicityScore = (mohsScore + mohsDecimal).toFixed(1);
    document.getElementById('perspective-toxicity-score').innerHTML = "Perspective Toxicity Score" + " : " + perspectiveToxicityScore;
}
/** Returns top Youtube results by keyword to have their comments analyzed*/
function getKeywordSearchResults() {
    return __awaiter(this, void 0, void 0, function () {
        var searchTerm, responseJson, videoIds, item, commentsListPromises, _a, _b, _i, id, videoCommentListJson;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    resetChart();
                    showLoadingWheel();
                    getInputElement('download').disabled = false;
                    searchTerm = getInputElement('channelIdForAnalysis').value;
                    return [4 /*yield*/, callYoutubeKeywordServlet(searchTerm)];
                case 1:
                    responseJson = _c.sent();
                    videoIds = [];
                    for (item in responseJson.items) {
                        if (responseJson.items[item].id.videoId != undefined) {
                            videoIds.push(responseJson.items[item].id.videoId);
                        }
                    }
                    commentsListPromises = [];
                    _a = [];
                    for (_b in videoIds)
                        _a.push(_b);
                    _i = 0;
                    _c.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    id = _a[_i];
                    return [4 /*yield*/, callYoutubeServlet("videoid", videoIds[id])];
                case 3:
                    videoCommentListJson = _c.sent();
                    commentsListPromises.push(videoCommentListJson);
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, Promise.all(commentsListPromises).then(function (resolvedCommentsList) {
                        inputCommentsToPerspective(resolvedCommentsList);
                    })];
                case 6:
                    _c.sent();
                    document.getElementById('search-type').innerHTML = "Keyword Search";
                    return [2 /*return*/];
            }
        });
    });
}
/** Prepares CSV download*/
function prepareDownload(sheetHeader, sheetData, sheetName) {
    var csv = sheetHeader.join(',') + '\n';
    for (var _i = 0, sheetData_1 = sheetData; _i < sheetData_1.length; _i++) {
        var data = sheetData_1[_i];
        csv += data.join(',') + '\n';
    }
    var outputCsv = new Blob([csv], { type: 'text/csv' });
    var downloadUrl = URL.createObjectURL(outputCsv);
    var downloadElement = document.getElementById('download');
    downloadElement.href = downloadUrl;
    downloadElement.download = sheetName + '.csv';
}
/** Formats data and initiates download of CSV file*/
function beginDownload(analyzedComments, attributeData) {
    getInputElement('download').disabled = true;
    var requestedAttributes = getRequestedAttributes();
    requestedAttributes.unshift('COMMENT');
    var sheetHeader = requestedAttributes;
    for (var i = 0; i < attributeData.length; i++) {
        var comment = formatCommentForSpreadsheet(analyzedComments[i]);
        attributeData[i].unshift(comment);
    }
    var sheetName = 'Perspective_Output';
    prepareDownload(sheetHeader, attributeData, sheetName);
}
/** Clears on screen elements and empties arrays associated with CSV creation*/
function resetChart() {
    document.getElementById('chart-container').innerHTML = "";
    document.getElementById('table-container').innerHTML = "";
    document.getElementById('perspective-toxicity-score').innerHTML = "";
}
/** Removes whitespace, commas and newlines to allow comments to be comaptible with CSV*/
function formatCommentForSpreadsheet(comment) {
    var formattedComment = comment.replace(/(\r\n|\n|\r)/gm, " ");
    formattedComment = formattedComment.replace(/,/g, "");
    formattedComment = formattedComment.replace(/\s+/g, " ");
    return formattedComment;
}
/** Creates chart of analyzed comments and requested attributes*/
function drawTableChart(analyzedComments, attributeData) {
    var requestedAttributes = getRequestedAttributes();
    var tableData = new google.visualization.DataTable();
    // Add columns
    tableData.addColumn('string', 'COMMENT');
    for (var i = 0; i < requestedAttributes.length; i++) {
        tableData.addColumn('number', requestedAttributes[i]);
    }
    // Add rows
    tableData.addRows(analyzedComments.length);
    for (var i = 0; i < analyzedComments.length; i++) {
        tableData.setCell(i, 0, analyzedComments[i]);
        for (var j = 1; j < attributeData[i].length + 1; j++) {
            tableData.setCell(i, j, attributeData[i][j - 1]);
        }
    }
    var table = new google.visualization.Table(document.getElementById('table-container'));
    var formatter = new google.visualization.ColorFormat();
    formatter.addRange(0, .2, 'black', '#F6F2FC');
    formatter.addRange(.2, .4, 'black', '#E0CCFB');
    formatter.addRange(.4, .6, 'black', '#A166F2');
    formatter.addRange(.6, .8, 'white', '#8133EE');
    formatter.addRange(.8, 1, 'white', '#6200EA');
    for (var i = 0; i < requestedAttributes.length + 1; i++) {
        formatter.format(tableData, i);
    }
    table.draw(tableData, { allowHtml: true, showRowNumber: false, width: '100%', height: '100%' });
}
/** Displays a loading wheel that can be used a placeholder until an output is ready to be displayed*/
function showLoadingWheel() {
    var loadingContainerElement = document.getElementById('loading-container');
    // Only one loading wheel will be shown at a time
    if (loadingContainerElement.innerHTML == '') {
        var loadingWheel = document.createElement('p');
        loadingWheel.className = 'spinner-border';
        loadingContainerElement.appendChild(loadingWheel);
    }
}
/** Removes the placeholding loading wheel*/
function hideLoadingWheel() {
    var loadingContainerElement = document.getElementById('loading-container');
    loadingContainerElement.innerHTML = '';
}
/** Gives the appropriate style for a bar in a barchart given its score */
function getStyle(score) {
    var color;
    if (score >= 0.8) {
        color = '#6200EA'; // Darkest purple
    }
    else if (score >= 0.6) {
        color = '#8133EE'; // Dark purple
    }
    else if (score >= 0.4) {
        color = '#A166F2'; // Mild purple
    }
    else if (score >= 0.2) {
        color = '#E0CCFB'; // Light purple
    }
    else {
        color = '#F6F2FC'; // Lightest purple
    }
    return 'stroke-color: #000000; stroke-width: 1; fill-color: ' + color;
}
/** Returns an array of attribute data to support CSV output*/
function getAttributeData(attributeScores) {
    var requestedAttributes = getRequestedAttributes();
    var attributeData = [];
    for (var i = 0; i < requestedAttributes.length; i++) {
        for (var j = 0; j < attributeScores.length; j++) {
            // Populates attributeData to support CSV output
            var attributeScoreValue = attributeScores[j].attributeScores[requestedAttributes[i]].summaryScore.value;
            if (attributeData[j] == null) {
                attributeData[j] = [attributeScoreValue];
            }
            else {
                attributeData[j].push(attributeScoreValue);
            }
        }
    }
    return attributeData;
}
function getInputElement(id) {
    return document.getElementById(id);
}
function callYoutubeServlet(idType, id) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/youtube_servlet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idType: idType, id: id })
                    })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function callYoutubeUsernameServlet(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/youtube_username_servlet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: channelId
                    })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function callYoutubeTrendingServlet(categoryId) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/trending_servlet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: categoryId
                    })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function callYoutubeKeywordServlet(searchTerm) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/keyword_search_servlet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: searchTerm
                    })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
