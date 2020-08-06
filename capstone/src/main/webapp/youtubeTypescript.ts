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

/** Calls youtube servlet and passes output to perspctive */
async function callYoutube() {
  resetChart();
  getInputElement('download').disabled = false;
  document.getElementById('search-type').innerHTML = "";
  const channelId = getInputElement('channelIdForAnalysis').value.replace(/ /g, '');
  if (!channelId) {
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
      alert("Invalid Channel ID");
      return;
    }
    document.getElementById('search-type').innerHTML = "Channel ID Search";
  } else {
    const usernameConverterResponse = await fetch('/youtube_username_servlet?channelId=' + channelId);
    const usernameConverterResponseJson = await usernameConverterResponse.json();
    if (usernameConverterResponseJson.pageInfo.totalResults == 0) {
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
  const langElement = getInputElement('languageForAnalysis');
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
  const analyzedComments = [];
  for (const comments in commentsList) {
    for (const item in commentsList[comments].items) {
      let commentText = commentsList[comments].items[item].snippet.topLevelComment.snippet.textOriginal;
      analyzedComments.push(commentText);
      const perspectiveScore = await callPerspective(commentText, langElement.value, requestedAttributes);
      attributeScoresPromises.push(perspectiveScore);
    }
  }
  let totalNumberOfComments = commentsList[0].items.length * commentsList.length;
  await Promise.all(attributeScoresPromises).then(resolvedAttributeScores => {
    const attributeData = getAttributeData(resolvedAttributeScores);
    const attributeDataForChart = getAttributeData(resolvedAttributeScores);
    const attributeTotals = getAttributeTotals(resolvedAttributeScores);
    const attributeAverages = getAttributeAverages(attributeTotals, totalNumberOfComments);
    loadChartsApi(attributeAverages, analyzedComments, attributeData);
    perspectiveToxicityScale(attributeAverages);
    beginDownload(analyzedComments, attributeDataForChart);
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
function loadChartsApi(toxicityData: Map<string, number>, analyzedComments: string[], attributeData) {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.load('current', {'packages':['table']});
  google.charts.setOnLoadCallback(function() {drawBarChart(toxicityData);}); 
  google.charts.setOnLoadCallback(function() {drawTableChart(analyzedComments, attributeData);}); 
}

/** Draws a Google BarChart from a map. */
function drawBarChart(toxicityData: Map<string, number>) {
  document.getElementById('chart-container').innerHTML = '';
  const data = google.visualization.arrayToDataTable([[{label: 'Attribute'}, {label: 'Score', type: 'number'}, {role: "style"}]]);
  // forEach(value,key)
  toxicityData.forEach((attributeScoresAvg, attribute) => {
    const score = attributeScoresAvg;
    const style = getStyle(attributeScoresAvg);
    data.addRow([attribute, score, style]);
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
  const langElement = getInputElement('languageForAnalysis');
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
  let channelIdEl = getInputElement('channelIdForAnalysis');
  let keywordSearchdEl = getInputElement('channelIdForAnalysis');
  if (button.checked) { 
    if (toEnable) {
      channelIdEl.value = button.id;
      channelIdEl.disabled = true;
      keywordSearchdEl.disabled = true;
    } else {
      channelIdEl.value = "";
      channelIdEl.disabled = false;
      keywordSearchdEl.disabled = false;    
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
  resetChart();
  getInputElement('download').disabled = false;
  const searchTerm = getInputElement('channelIdForAnalysis').value;
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
  const downloadElement = <HTMLAnchorElement> document.getElementById('download');
  downloadElement.href = downloadUrl;
  downloadElement.download = sheetName + '.csv';
}

/** Formats data and initiates download of CSV file*/
function beginDownload(analyzedComments, attributeData) {
  getInputElement('download').disabled = true; 
  const requestedAttributes = getRequestedAttributes();
  requestedAttributes.unshift('COMMENT');
  const sheetHeader = requestedAttributes;
  for (let i = 0; i < attributeData.length; i++) {
    const comment = formatCommentForSpreadsheet(analyzedComments[i]);
    attributeData[i].unshift(comment);
  }
  const sheetName = 'Perspective_Output';
  prepareDownload(sheetHeader, attributeData, sheetName);
}

/** Clears on screen elements and empties arrays associated with CSV creation*/
function resetChart() {
  document.getElementById('chart-container').innerHTML = "";
  document.getElementById('table-container').innerHTML = "";
  document.getElementById('perspective-toxicity-score').innerHTML = "";
}

/** Removes whitespace, commas and newlines to allow comments to be comaptible with CSV*/
function formatCommentForSpreadsheet(comment: string) {
  let formattedComment = comment.replace(/(\r\n|\n|\r)/gm, " ");
  formattedComment = formattedComment.replace(/,/g, "");
  formattedComment = formattedComment.replace(/\s+/g, " ");
  return formattedComment;    
}

/** Creates chart of analyzed comments and requested attributes*/
function drawTableChart(analyzedComments: string[], attributeData) {      
  const requestedAttributes = getRequestedAttributes();
  let tableData = new google.visualization.DataTable();
  // Add columns
  tableData.addColumn('string', 'COMMENT');
  for (let i = 0; i < requestedAttributes.length; i++) {
    tableData.addColumn('number', requestedAttributes[i]);
  }
  // Add rows
  tableData.addRows(analyzedComments.length);
  for (let i = 0; i < analyzedComments.length; i++) {
    tableData.setCell(i, 0, analyzedComments[i])
    for (let j = 1; j < attributeData[i].length + 1; j++) {
      tableData.setCell(i, j, attributeData[i][j-1])
    }
  }
  let table = new google.visualization.Table(document.getElementById('table-container'));
  let formatter = new google.visualization.ColorFormat();
  formatter.addRange(0, .2, 'black', '#F6F2FC');
  formatter.addRange(.2, .4, 'black', '#E0CCFB');
  formatter.addRange(.4, .6, 'black', '#A166F2');
  formatter.addRange(.6, .8, 'white', '#8133EE');
  formatter.addRange(.8, 1, 'white', '#6200EA');
  for (let i = 0; i < requestedAttributes.length + 1; i++){
    formatter.format(tableData, i);
  }
  table.draw(tableData, {allowHtml: true, showRowNumber: false, width: '100%', height: '100%'});
}

/** Gives the appropriate style for a bar in a barchart given its score */
function getStyle(score) {
  let color;
  if (score >= 0.8) {
    color = '#6200EA'; // Darkest purple
  } else if (score >= 0.6) {
    color = '#8133EE'; // Dark purple
  } else if (score >= 0.4) {
    color = '#A166F2'; // Mild purple
  } else if (score >= 0.2) {
    color = '#E0CCFB'; // Light purple
  } else {
    color = '#F6F2FC'; // Lightest purple
  }
  return 'stroke-color: #000000; stroke-width: 1; fill-color: ' + color;
}

/** Returns an array of attribute data to support CSV output*/
function getAttributeData(attributeScores) {
  const requestedAttributes = getRequestedAttributes();
  const attributeData = [];    
  for (let i = 0; i < requestedAttributes.length; i++) {
    for (let j = 0; j < attributeScores.length; j++) {
      // Populates attributeData to support CSV output
      let attributeScoreValue = attributeScores[j].attributeScores[requestedAttributes[i]].summaryScore.value;
      if (attributeData[j] == null) {
        attributeData[j] = [attributeScoreValue];
      } else {
        attributeData[j].push(attributeScoreValue);
      }
    }
  }
  return attributeData;
}

function getInputElement(id: string) {
    return <HTMLInputElement> document.getElementById(id);
}