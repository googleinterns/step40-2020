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
/** These variables will keep track of the data required for CSV output */
var ATTRIBUTE_DATA;
var ANALYZED_COMMENTS;
/** Calls youtube servlet and passes output to perspctive */
function callYoutube() {
    return __awaiter(this, void 0, void 0, function () {
        var channelId, response, responseJson, usernameConverterResponse, usernameConverterResponseJson, convertedUserName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resetChartAndCsv();
                    document.getElementById("download").disabled = false;
                    document.getElementById('search-type').innerHTML = "";
                    channelId = document.getElementById('channelIdForAnalysis').value.replace(/ /g, '');
                    if (!channelId) {
                        return [2 /*return*/];
                    }
                    // Checks if input is a category, if so directs input to be handled by get trending
                    if (YOUTUBE_CATEGORIES[channelId] != undefined) {
                        document.getElementById('search-type').innerHTML = "Category Search";
                        getTrending(YOUTUBE_CATEGORIES[channelId]);
                        return [2 /*return*/];
                    }
                    if (!(channelId[0] == "U" && channelId[1] == "C" && channelId.length == 24 && isLetter(channelId[channelId.length - 1]))) return [3 /*break*/, 3];
                    return [4 /*yield*/, fetch('/youtube_servlet?channelId=' + channelId)];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    responseJson = _a.sent();
                    if (responseJson.hasOwnProperty('error')) {
                        alert("Invalid Channel ID");
                        return [2 /*return*/];
                    }
                    document.getElementById('search-type').innerHTML = "Channel ID Search";
                    return [3 /*break*/, 8];
                case 3: return [4 /*yield*/, fetch('/youtube_username_servlet?channelId=' + channelId)];
                case 4:
                    usernameConverterResponse = _a.sent();
                    return [4 /*yield*/, usernameConverterResponse.json()];
                case 5:
                    usernameConverterResponseJson = _a.sent();
                    if (usernameConverterResponseJson.pageInfo.totalResults == 0) {
                        alert("Username Not found, Please Input Channel ID");
                        return [2 /*return*/];
                    }
                    document.getElementById('search-type').innerHTML = "Username Search";
                    convertedUserName = usernameConverterResponseJson.items[0].id;
                    return [4 /*yield*/, fetch('/youtube_servlet?channelId=' + convertedUserName)];
                case 6:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 7:
                    responseJson = _a.sent();
                    _a.label = 8;
                case 8:
                    inputCommentsToPerspective([responseJson]);
                    return [2 /*return*/];
            }
        });
    });
}
/** Calls perspective to analyze an array of comment JSON's */
function inputCommentsToPerspective(commentsList) {
    return __awaiter(this, void 0, void 0, function () {
        var langElement, commentListElement, requestedAttributes, attributeScoresPromises, _a, _b, _i, comments, _c, _d, _e, item, perspectiveScore, totalNumberOfComments;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    langElement = document.getElementById('languageForAnalysis');
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
                    ANALYZED_COMMENTS.push(commentsList[comments].items[item].snippet.topLevelComment.snippet.textOriginal);
                    return [4 /*yield*/, callPerspective(commentsList[comments].items[item].snippet.topLevelComment.snippet.textOriginal, langElement.value, requestedAttributes)];
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
                            var attributeTotals = getAttributeTotals(resolvedAttributeScores);
                            var attributeAverages = getAttributeAverages(attributeTotals, totalNumberOfComments);
                            loadChartsApi(attributeAverages);
                            perspectiveToxicityScale(attributeAverages);
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
            if (ATTRIBUTE_DATA[j] == null) {
                ATTRIBUTE_DATA[j] = [attributeScoreValue.toString()];
            }
            else {
                ATTRIBUTE_DATA[j].push(attributeScoreValue);
            }
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
function loadChartsApi(toxicityData) {
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.load('current', { 'packages': ['table'] });
    google.charts.setOnLoadCallback(function () { drawBarChart(toxicityData); });
    google.charts.setOnLoadCallback(function () { drawTableChart(); });
}
/** Draws a Google BarChart from a map. */
function drawBarChart(toxicityData) {
    document.getElementById('chart-container').innerHTML = '';
    var data = google.visualization.arrayToDataTable([[{ label: 'Attribute' }, { label: 'Score', type: 'number' }, { role: "style" }]]);
    // forEach(value,key)
    toxicityData.forEach(function (attributeScoresAvg, attribute) {
        var color = '#6B8E23'; // Green
        var score = attributeScoresAvg;
        if (score >= 0.8) {
            color = '#DC143C'; // Red
        }
        else if (score >= 0.2) {
            color = '#ffd800'; // Yellow
        }
        data.addRow([attribute, score, color]);
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
    var langElement = document.getElementById('languageForAnalysis');
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
        var trendingResponse, trendingResponseJson, trendingVideoIds, item, videoId, commentsListPromises, _a, _b, _i, id, videoCommentList, videoCommentListJson;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, fetch('/trending_servlet?videoCategoryId=' + categoryId)];
                case 1:
                    trendingResponse = _c.sent();
                    return [4 /*yield*/, trendingResponse.json()];
                case 2:
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
                    _c.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    id = _a[_i];
                    return [4 /*yield*/, fetch('/youtube_servlet?videoId=' + trendingVideoIds[id])];
                case 4:
                    videoCommentList = _c.sent();
                    return [4 /*yield*/, videoCommentList.json()];
                case 5:
                    videoCommentListJson = _c.sent();
                    commentsListPromises.push(videoCommentListJson);
                    _c.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 3];
                case 7: return [4 /*yield*/, Promise.all(commentsListPromises).then(function (resolvedCommentsList) {
                        inputCommentsToPerspective(resolvedCommentsList);
                    })];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** Enables and disables manual input into the text field */
function textInputToggle(button, toEnable) {
    if (button.checked) {
        if (toEnable) {
            document.getElementById('channelIdForAnalysis').value = button.id;
            document.getElementById('channelIdForAnalysis').disabled = true;
            document.getElementById("keywordSearch").disabled = true;
        }
        else {
            document.getElementById('channelIdForAnalysis').value = "";
            document.getElementById('channelIdForAnalysis').disabled = false;
            document.getElementById("keywordSearch").disabled = false;
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
    document.getElementById('perspective-toxicity-score').innerHTML = ("Perspective Toxicity Score" + " : " + perspectiveToxicityScore);
}
/** Returns top Youtube results by keyword to have their comments analyzed*/
function getKeywordSearchResults() {
    return __awaiter(this, void 0, void 0, function () {
        var searchTerm, response, responseJson, videoIds, item, commentsListPromises, _a, _b, _i, id, videoCommentList, videoCommentListJson;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    resetChartAndCsv();
                    document.getElementById("download").disabled = false;
                    searchTerm = document.getElementById('channelIdForAnalysis').value;
                    return [4 /*yield*/, fetch('/keyword_search_servlet?searchTerm=' + searchTerm)];
                case 1:
                    response = _c.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
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
                    _c.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    id = _a[_i];
                    return [4 /*yield*/, fetch('/youtube_servlet?videoId=' + videoIds[id])];
                case 4:
                    videoCommentList = _c.sent();
                    return [4 /*yield*/, videoCommentList.json()];
                case 5:
                    videoCommentListJson = _c.sent();
                    commentsListPromises.push(videoCommentListJson);
                    _c.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 3];
                case 7: return [4 /*yield*/, Promise.all(commentsListPromises).then(function (resolvedCommentsList) {
                        inputCommentsToPerspective(resolvedCommentsList);
                    })];
                case 8:
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
    var downloadElement = document.createElement('a');
    downloadElement.href = downloadUrl;
    downloadElement.download = sheetName + '.csv';
    downloadElement.click();
}
/** Formats data and initiates download of CSV file*/
function beginDownload() {
    document.getElementById("download").disabled = true;
    var requestedAttributes = getRequestedAttributes();
    requestedAttributes.unshift('COMMENT');
    var sheetHeader = requestedAttributes;
    for (var i = 0; i < ATTRIBUTE_DATA.length; i++) {
        var comment = formatCommentForSpreadsheet(ANALYZED_COMMENTS[i]);
        ATTRIBUTE_DATA[i].unshift(comment);
    }
    var sheetName = 'Perspective_Output';
    prepareDownload(sheetHeader, ATTRIBUTE_DATA, sheetName);
}
/** Clears on screen elements and empties arrays associated with CSV creation*/
function resetChartAndCsv() {
    document.getElementById('chart-container').innerHTML = "";
    document.getElementById('table-container').innerHTML = "";
    document.getElementById('perspective-toxicity-score').innerHTML = "";
    ATTRIBUTE_DATA = [];
    ANALYZED_COMMENTS = [];
}
/** Removes whitespace, commas and newlines to allow comments to be comaptible with CSV*/
function formatCommentForSpreadsheet(comment) {
    var formattedComment = comment.replace(/(\r\n|\n|\r)/gm, " ");
    formattedComment = formattedComment.replace(/,/g, "");
    formattedComment = formattedComment.replace(/\s+/g, " ");
    return formattedComment;
}
/** Creates chart of analyzed comments and requested attributes*/
function drawTableChart() {
    var requestedAttributes = getRequestedAttributes();
    var tableData = new google.visualization.DataTable();
    // Add columns
    tableData.addColumn('string', 'COMMENT');
    for (var i = 0; i < requestedAttributes.length; i++) {
        tableData.addColumn('number', requestedAttributes[i]);
    }
    // Add rows
    tableData.addRows(ANALYZED_COMMENTS.length);
    for (var i = 0; i < ANALYZED_COMMENTS.length; i++) {
        tableData.setCell(i, 0, ANALYZED_COMMENTS[i]);
        for (var j = 1; j < ATTRIBUTE_DATA[i].length + 1; j++) {
            tableData.setCell(i, j, ATTRIBUTE_DATA[i][j - 1]);
        }
    }
    var table = new google.visualization.Table(document.getElementById('table-container'));
    var formatter = new google.visualization.ColorFormat();
    formatter.addRange(0, .2, 'white', '#6B8E23');
    formatter.addRange(.2, .8, 'white', '#ffd800');
    formatter.addRange(.8, 1, 'white', '#DC143C');
    for (var i = 0; i < requestedAttributes.length + 1; i++) {
        formatter.format(tableData, i);
    }
    table.draw(tableData, { allowHtml: true, showRowNumber: false, width: '100%', height: '100%' });
}
