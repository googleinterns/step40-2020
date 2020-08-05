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

declare let google;

const ATTRIBUTES_BY_LANGUAGE = {
  'en': ['TOXICITY', 'SEVERE_TOXICITY', 'TOXICITY_FAST', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT', 'SEXUALLY_EXPLICIT', 'FLIRTATION'],
  'es': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
  'fr': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
  'de': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
  'it': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
  'pt': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT']
};

/** Category names are correlated to youtube category numbers */
const YOUTUBE_CATEGORIES = {
  'Autos&Vehicles': 2,
  'Comedy': 23,
  'Entertainment': 24,
  'Film&Animation': 1,
  'Gaming': 20,
  'Music': 10,
  'Pets&Animals': 15,
  'Science&Technology': 28,
  'Sports' : 17,
};

/** These variables will keep track of the data required for CSV output */
let ATTRIBUTE_DATA: string[][];
let ANALYZED_COMMENTS: string[];

/** Calls youtube servlet and passes output to perspctive */
async function callYoutube() {
  resetChartAndCsv();
  showLoadingWheel();
  (<HTMLInputElement> document.getElementById("download")).disabled = false;
  document.getElementById('search-type').innerHTML = "";
  const channelId = (<HTMLInputElement> document.getElementById('channelIdForAnalysis')).value.replace(/ /g, '');
  if (!channelId) {
    hideLoadingWheel();
    return;
  }
  // Checks if input is a category, if so directs input to be handled by get trending
  if (YOUTUBE_CATEGORIES[channelId] != undefined) {
    document.getElementById('search-type').innerHTML = "Category Search";
    getTrending(YOUTUBE_CATEGORIES[channelId]);
    return;
  }
  // Checks if input follows channel ID format, if not attempts to convert it to channel ID
  let response: Response;
  let responseJson;
  if (channelId[0] == "U" && channelId[1] == "C" && channelId.length == 24 && isLetter(channelId[channelId.length-1])) {
    response = await fetch('/youtube_servlet?channelId=' + channelId);
    responseJson = await response.json();
    if (responseJson.hasOwnProperty('error')) {
      hideLoadingWheel();
      alert("Invalid Channel ID");
      return;
    }
    document.getElementById('search-type').innerHTML = "Channel ID Search";
  } else {
    const usernameConverterResponse = await fetch('/youtube_username_servlet?channelId=' + channelId);
    const usernameConverterResponseJson = await usernameConverterResponse.json();
    if (usernameConverterResponseJson.pageInfo.totalResults == 0) {
      hideLoadingWheel();
      alert("Username Not found, Please Input Channel ID");
      return;
    }
    document.getElementById('search-type').innerHTML = "Username Search";
    const convertedUserName = usernameConverterResponseJson.items[0].id;
    response = await fetch('/youtube_servlet?channelId=' + convertedUserName);
    responseJson = await response.json();
  }
  inputCommentsToPerspective([responseJson]);
}

/** Calls perspective to analyze an array of comment JSON's */
async function inputCommentsToPerspective(commentsList: any[]) {
  const langElement = (<HTMLInputElement> document.getElementById('languageForAnalysis'));
  if (!langElement) {
    return;
  }
  const commentListElement = document.getElementById('comment-list');
  commentListElement.innerHTML = '';
  const requestedAttributes = getRequestedAttributes();
  if (!requestedAttributes) {
      return;
  }
  const attributeScoresPromises = [];
  for (const comments in commentsList) {
    for (const item in commentsList[comments].items) {
      ANALYZED_COMMENTS.push(commentsList[comments].items[item].snippet.topLevelComment.snippet.textOriginal);
      const perspectiveScore = await callPerspective(commentsList[comments].items[item].snippet.topLevelComment.snippet.textOriginal, langElement.value, requestedAttributes);
      attributeScoresPromises.push(perspectiveScore);
    }
  }
  let totalNumberOfComments = commentsList[0].items.length * commentsList.length;
  await Promise.all(attributeScoresPromises).then(resolvedAttributeScores => {
    const attributeTotals = getAttributeTotals(resolvedAttributeScores);
    const attributeAverages = getAttributeAverages(attributeTotals, totalNumberOfComments);
    hideLoadingWheel();
    loadChartsApi(attributeAverages);
    perspectiveToxicityScale(attributeAverages);
  });
}

/** Returns a map of attribute score sums from an array of JSON's */
function getAttributeTotals(attributeScores: any[]) {
  const requestedAttributes = getRequestedAttributes();
  const attributeTotals = new Map<string, number>();   
  for (let i = 0; i < requestedAttributes.length; i++) {
    for (let j = 0; j < attributeScores.length; j++) {
      // populates attributeData to support CSV output and attributeTotals to support averaging
      let attributeScoreValue = attributeScores[j].attributeScores[requestedAttributes[i]].summaryScore.value;
      if (ATTRIBUTE_DATA[j] == null) {
        ATTRIBUTE_DATA[j] = [attributeScoreValue.toString()];
      } else {
        ATTRIBUTE_DATA[j].push(attributeScoreValue);
      }
      if (attributeTotals.has(requestedAttributes[i])) {
        attributeTotals.set(requestedAttributes[i], attributeTotals.get(requestedAttributes[i]) + attributeScoreValue);
      } else {
        attributeTotals.set(requestedAttributes[i], attributeScoreValue);
      }
    }
  }
  return attributeTotals;
}

/** Returns a map of attribute score averages from a map and an array */
function getAttributeAverages(attributeTotals: Map<string, number>, totalNumberOfComments: number) {
  const attributeAverages = new Map<string, number>(); 
  // forEach(value,key)
  attributeTotals.forEach((attributeScoresTotal, attribute) => { 
    attributeAverages.set(attribute, attributeScoresTotal / totalNumberOfComments);
  });
  return attributeAverages;
}

/** Returns the user's input */
function getRequestedAttributes() {
  const attributes = Array.from(document.getElementById("available-attributes").getElementsByTagName('input'));
  const requestedAttributes: string[] = [];
  for (const attribute of attributes) {
    if (attribute.checked == true) {
      requestedAttributes.push(attribute.value);	
    }	
  }
  return requestedAttributes;
}

/** Calls the perspective API */
async function callPerspective(text: string, lang: string, requestedAttributes:string[]) {
  const response = await fetch('/call_perspective', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: JSON.stringify({text: text, lang: lang, requestedAttributes: requestedAttributes})});
  const toxicityData = await response.json();
  return toxicityData;
}

/** Loads the Google Charts API */
function loadChartsApi(toxicityData: Map<string, number>) {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.load('current', {'packages':['table']});
  google.charts.setOnLoadCallback(function() {drawBarChart(toxicityData);}); 
  google.charts.setOnLoadCallback(function() {drawTableChart();}); 
}

/** Draws a Google BarChart from a map. */
function drawBarChart(toxicityData: Map<string, number>) {
  document.getElementById('chart-container').innerHTML = '';
  const data = google.visualization.arrayToDataTable([[{label: 'Attribute'}, {label: 'Score', type: 'number'}, {role: "style"}]]);
  // forEach(value,key)
  toxicityData.forEach((attributeScoresAvg, attribute) => {
    const score = attributeScoresAvg;
    const color = getColor(attributeScoresAvg);
    data.addRow([attribute, score, 'stroke-color: #000000; stroke-width: 1; fill-color: ' + color]);
  });
  data.sort({column: 1, desc: false});
  const options = {
    title: 'Perspective Feedback',
    bars: 'horizontal',
    height: 700,
    legend: {position: "none"},
    theme: 'material', 
    hAxis: {viewWindow: {min: 0, max: 1}}
  };
  const chart = new google.visualization.BarChart(document.getElementById('chart-container'));
  chart.draw(data, options);
}

/** Shows the avaiable attributes given a language selected on text analyzer page */
function showAvailableAttributes() {
  const langElement = (<HTMLInputElement> document.getElementById('languageForAnalysis'));
  if (!langElement) {
    return;
  }
  const lang = langElement.value;
  const availableAttributesElement = document.getElementById('available-attributes');
  availableAttributesElement.innerHTML = '';
  const attributes = ATTRIBUTES_BY_LANGUAGE[lang];
  attributes.forEach(function(attribute) {
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.value = attribute;
    checkbox.id = attribute + '-checkbox';
    checkbox.checked = true;
    const label = document.createElement('label');
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
async function getTrending(categoryId: number) {
  const trendingResponse = await fetch('/trending_servlet?videoCategoryId=' + categoryId);
  const trendingResponseJson = await trendingResponse.json();
  const trendingVideoIds = [];
  for (const item in trendingResponseJson.items) {
    const videoId = trendingResponseJson.items[item].id;
    trendingVideoIds.push(videoId);
  }
  const commentsListPromises = [];
  for (const id in trendingVideoIds) {
    const videoCommentList = await fetch('/youtube_servlet?videoId=' + trendingVideoIds[id]);
    const videoCommentListJson = await videoCommentList.json();
    commentsListPromises.push(videoCommentListJson);
  }
  await Promise.all(commentsListPromises).then(resolvedCommentsList => {
    inputCommentsToPerspective(resolvedCommentsList);
  });
}

/** Enables and disables manual input into the text field */
function textInputToggle (button, toEnable: boolean) {
  if (button.checked) { 
    if (toEnable) {
      (<HTMLInputElement> document.getElementById('channelIdForAnalysis')).value = button.id;
      (<HTMLInputElement> document.getElementById('channelIdForAnalysis')).disabled = true;
      (<HTMLInputElement> document.getElementById("keywordSearch")).disabled = true;
    } else {
      (<HTMLInputElement> document.getElementById('channelIdForAnalysis')).value = "";
      (<HTMLInputElement> document.getElementById('channelIdForAnalysis')).disabled = false;
      (<HTMLInputElement> document.getElementById("keywordSearch")).disabled = false;    
    }
  }
}

/** Creates radio buttons to allow the user to select between various categories*/
function showCategories() {
  // Creates button to enable manual text input
  const radiobox = document.createElement('input');
  radiobox.type = 'radio';
  radiobox.id = 'manualInput';
  radiobox.value = 'manualInput';
  radiobox.name = 'same';
  radiobox.checked  = true;
  const label = document.createElement('label');
  label.htmlFor = 'manualInput';
  const description = document.createTextNode('ID/Username');
  label.appendChild(description);
  radiobox.onclick = function() {
    textInputToggle(this, false);   
  }
  const categoryContainer = document.getElementById('category-container');
  categoryContainer.appendChild(radiobox);
  categoryContainer.appendChild(label);
  categoryContainer.appendChild(document.createTextNode(" "));
  categoryContainer.appendChild(document.createElement("br"));
  // Creates buttons for all youtube categories
  for (const category in YOUTUBE_CATEGORIES ) {
    const radiobox = document.createElement('input');
    radiobox.type = 'radio';
    radiobox.id = category;
    radiobox.value = category;
    radiobox.name = 'same';
    const label = document.createElement('label')
    label.htmlFor = category;
    const description = document.createTextNode(category);
    label.appendChild(description);
    radiobox.onclick = function() {
      textInputToggle(this, true);   
    }
    const categoryContainer = document.getElementById('category-container');
    categoryContainer.appendChild(radiobox);
    categoryContainer.appendChild(label);
    categoryContainer.appendChild(document.createTextNode(" "));
  }
}

/** Converts perspective results to knoop scale then to mohs*/
function perspectiveToxicityScale(attributeAverages: Map<string, number>) {
  const knoopScale = [1, 32, 135, 163, 430, 560, 820, 1340, 1800, 7000];
  let totalToxicityScore = 0;
  // forEach(value,key)
  attributeAverages.forEach((attributeAverage, attribute) => {
    totalToxicityScore += attributeAverage;
  });
  const inputLength = attributeAverages.size;
  const averageToxicityScore = totalToxicityScore / inputLength;
  const knoopScore = averageToxicityScore * 7000;
  let knoopLow = 0;
  let knoopHigh = 0;
  let mohsScore = 0;
  for (let i = 0; i < knoopScale.length; i++) {
    if (knoopScore < knoopScale[i]) {
      if (knoopScore < 1) {
        knoopLow = 0;
      } else {
        knoopLow = knoopScale[i-1];
      }
      knoopHigh = knoopScale[i];
      mohsScore = i;  
      break;
    }
  }
  const knoopRange = knoopHigh - knoopLow;
  const amountMoreThanKnoop = knoopScore - knoopLow;
  const mohsDecimal = amountMoreThanKnoop / knoopRange;
  const perspectiveToxicityScore = (mohsScore + mohsDecimal).toFixed(1);
  document.getElementById('perspective-toxicity-score').innerHTML = ("Perspective Toxicity Score" + " : " + perspectiveToxicityScore);
}

/** Returns top Youtube results by keyword to have their comments analyzed*/
async function getKeywordSearchResults() {
  resetChartAndCsv();
  showLoadingWheel();
  (<HTMLInputElement> document.getElementById("download")).disabled = false;
  const searchTerm = (<HTMLInputElement> document.getElementById('channelIdForAnalysis')).value;
  const response = await fetch('/keyword_search_servlet?searchTerm=' + searchTerm);
  const responseJson = await response.json();
  let videoIds = [];
  for (const item in responseJson.items) {
    if (responseJson.items[item].id.videoId != undefined) {
      videoIds.push(responseJson.items[item].id.videoId);
    }
  }   
  const commentsListPromises = [];
  for (const id in videoIds) {
    const videoCommentList = await fetch('/youtube_servlet?videoId=' + videoIds[id]);
    const videoCommentListJson = await videoCommentList.json();
    commentsListPromises.push(videoCommentListJson);
  }
  await Promise.all(commentsListPromises).then(resolvedCommentsList => {
    inputCommentsToPerspective(resolvedCommentsList);
  });
  document.getElementById('search-type').innerHTML = "Keyword Search";
}

/** Prepares CSV download*/
function prepareDownload(sheetHeader: string[], sheetData, sheetName:string) {
  let csv = sheetHeader.join(',') + '\n';
  for (const data of sheetData) {
    csv += data.join(',') + '\n';
  }
  const outputCsv = new Blob([csv], { type: 'text/csv' });  
  const downloadUrl = URL.createObjectURL(outputCsv);
  const downloadElement = document.createElement('a');
  downloadElement.href = downloadUrl;
  downloadElement.download = sheetName + '.csv';
  downloadElement.click();
}

/** Formats data and initiates download of CSV file*/
function beginDownload() {
  (<HTMLInputElement> document.getElementById("download")).disabled = true; 
  const requestedAttributes = getRequestedAttributes();
  requestedAttributes.unshift('COMMENT');
  const sheetHeader = requestedAttributes;
  for (let i = 0; i < ATTRIBUTE_DATA.length; i++) {
    const comment = formatCommentForSpreadsheet(ANALYZED_COMMENTS[i]);
    ATTRIBUTE_DATA[i].unshift(comment);
  }
  const sheetName = 'Perspective_Output';
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
function formatCommentForSpreadsheet(comment: string) {
  let formattedComment = comment.replace(/(\r\n|\n|\r)/gm, " ");
  formattedComment = formattedComment.replace(/,/g, "");
  formattedComment = formattedComment.replace(/\s+/g, " ");
  return formattedComment;    
}

/** Creates chart of analyzed comments and requested attributes*/
function drawTableChart() {      
  const requestedAttributes = getRequestedAttributes();
  let tableData = new google.visualization.DataTable();
  // Add columns
  tableData.addColumn('string', 'COMMENT');
  for (let i = 0; i < requestedAttributes.length; i++) {
    tableData.addColumn('number', requestedAttributes[i]);
  }
  // Add rows
  tableData.addRows(ANALYZED_COMMENTS.length);
  for (let i = 0; i < ANALYZED_COMMENTS.length; i++) {
    tableData.setCell(i, 0, ANALYZED_COMMENTS[i])
    for (let j = 1; j < ATTRIBUTE_DATA[i].length + 1; j++) {
      tableData.setCell(i, j, ATTRIBUTE_DATA[i][j-1])
    }
  }
  let table = new google.visualization.Table(document.getElementById('table-container'));
  let formatter = new google.visualization.ColorFormat();
  formatter.addRange(0, .2, 'white', '#6B8E23');
  formatter.addRange(.2, .8, 'white', '#ffd800');
  formatter.addRange(.8, 1, 'white', '#DC143C');
  for (let i = 0; i < requestedAttributes.length + 1; i++){
    formatter.format(tableData, i);
  }
  table.draw(tableData, {allowHtml: true, showRowNumber: false, width: '100%', height: '100%'});
}

/** Displays a loading wheel that can be used a placeholder until an output is ready to be displayed*/
function showLoadingWheel() {
  const loadingContainerElement = document.getElementById('loading-container');
  // Only one loading wheel will be shown at a time
  if (loadingContainerElement.innerHTML == '') {
    const loadingWheel = document.createElement('p');
    loadingWheel.className = 'spinner-border';
    loadingContainerElement.appendChild(loadingWheel);
  }
}

/** Removes the placeholding loading wheel*/
function hideLoadingWheel() {
  const loadingContainerElement = document.getElementById('loading-container');
  loadingContainerElement.innerHTML = '';
}

/** Gives the appropriate color for a bar in a barchart given its score */
function getColor(score) {
  if (score >= 0.8) {
    return '#6200EA'; // Darkest purple
  } else if (score >= 0.6) {
    return '#8133EE'; // Dark purple
  } else if (score >= 0.4) {
    return '#A166F2'; // Mild purple
  } else if (score >= 0.2) {
    return '#E0CCFB'; // Light purple
  } else {
    return '#F6F2FC'; // Lighest purple
  }
}
